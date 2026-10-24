-- =====================================================================
-- KHUTWA / MOKHALASA CAR MARKETPLACE — PRODUCTION SCHEMA & RLS POLICIES
-- Migration: 20261022_comprehensive_marketplace_schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 2. HELPER FUNCTIONS FOR SECURITY
-- ---------------------------------------------------------------------

-- Check if current authenticated user has administrative privileges
create or replace function public.is_admin_or_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 
    from public.profiles 
    where id = auth.uid() 
      and role in ('admin', 'owner', 'staff')
  );
$$;

-- ---------------------------------------------------------------------
-- 3. PROFILES TABLE & ROLE SECURITY
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text not null,
  full_name text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'staff', 'owner', 'admin')),
  governorate text,
  city text,
  is_verified boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies:
-- 1. Read: User can view their own profile; Admins/Staff can view all profiles
drop policy if exists "Users can view own profile or admin can view all" on public.profiles;
create policy "Users can view own profile or admin can view all" 
  on public.profiles 
  for select 
  to authenticated 
  using (auth.uid() = id or public.is_admin_or_staff());

-- 2. Update: User can update own profile, but CANNOT elevate their own role
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" 
  on public.profiles 
  for update 
  to authenticated 
  using (auth.uid() = id or public.is_admin_or_staff())
  with check (auth.uid() = id or public.is_admin_or_staff());

-- 3. Insert: Handled by auth trigger or user insert matching UID
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" 
  on public.profiles 
  for insert 
  to authenticated 
  with check (auth.uid() = id or public.is_admin_or_staff());

-- Security Trigger: Prevent customers from tampering with protected columns
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Prevent non-admins from changing their role or id
  if not public.is_admin_or_staff() then
    if new.role <> old.role then
      raise exception 'Unauthorized: Customers are not permitted to change their account role.';
    end if;
    if new.id <> old.id then
      raise exception 'Unauthorized: Account ID is immutable.';
    end if;
  end if;

  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists tr_protect_profile_fields on public.profiles;
create trigger tr_protect_profile_fields
  before update on public.profiles
  for each row execute procedure public.protect_profile_fields();

-- ---------------------------------------------------------------------
-- 4. CAR LISTINGS TABLE & MODERATION LIFECYCLE
-- ---------------------------------------------------------------------
create table if not exists public.car_listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  
  -- Vehicle Specifications
  make text not null,
  model text not null,
  year integer not null check (year between 1990 and 2030),
  trim text,
  transmission text not null default 'أوتوماتيك',
  fuel_type text not null default 'بنزين',
  engine_size text,
  mileage integer not null check (mileage >= 0),
  color text,
  
  -- Location
  governorate text not null,
  city text,
  
  -- Pricing & Condition
  asking_price numeric(12,2) not null check (asking_price > 0),
  condition_description text not null,
  paint_condition text default 'فابريكا بالكامل',
  disclosed_defects text[] default '{}',
  
  -- Financing / Distress Context
  has_financing boolean not null default true,
  financing_type text default 'bank_loan',
  financing_provider text,
  outstanding_amount numeric(12,2) default 0,
  monthly_installment numeric(12,2) default 0,
  remaining_months integer default 0,
  
  -- Private Contact Info (Protected from Public Views)
  seller_name text,
  seller_phone text not null,
  
  -- Moderation Lifecycle Statuses
  -- 'pending_review' -> Initial state
  -- 'approved'       -> Approved by admin, ready for marketplace
  -- 'published'      -> Live on public website
  -- 'rejected'       -> Rejected with reason
  -- 'needs_changes'  -> Admin requested adjustments
  -- 'sold'           -> Completed sale
  -- 'archived'       -> Inactive
  -- 'withdrawn'      -> Customer cancelled listing
  status text not null default 'pending_review' check (
    status in ('pending_review', 'approved', 'rejected', 'needs_changes', 'published', 'sold', 'archived', 'withdrawn')
  ),
  review_feedback text,
  reviewed_by uuid references auth.users,
  reviewed_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on car_listings
alter table public.car_listings enable row level security;

-- Indexing for performance
create index if not exists idx_car_listings_user_id on public.car_listings(user_id);
create index if not exists idx_car_listings_status on public.car_listings(status);
create index if not exists idx_car_listings_created_at on public.car_listings(created_at desc);

-- Car Listings RLS Policies:
-- 1. SELECT:
-- - The owner can view all their own listings (any status)
-- - Admins and staff can view all listings (any status)
-- - Public / unauthenticated can view only approved, published, or sold listings
drop policy if exists "Listing view access" on public.car_listings;
create policy "Listing view access" 
  on public.car_listings 
  for select 
  using (
    (auth.uid() = user_id)
    or public.is_admin_or_staff()
    or (status in ('approved', 'published', 'sold'))
  );

-- 2. INSERT:
-- Authenticated users can insert their own listing with initial status 'pending_review'
drop policy if exists "Customer can insert pending listing" on public.car_listings;
create policy "Customer can insert pending listing" 
  on public.car_listings 
  for insert 
  to authenticated 
  with check (
    auth.uid() = user_id 
    and (status = 'pending_review' or public.is_admin_or_staff())
  );

-- 3. UPDATE:
-- Customers can update their own listings ONLY when status is 'pending_review' or 'needs_changes',
-- or they can set status to 'withdrawn'. Customers CANNOT approve or publish their own ads!
drop policy if exists "Customer can update own editable listing" on public.car_listings;
create policy "Customer can update own editable listing" 
  on public.car_listings 
  for update 
  to authenticated 
  using (
    (auth.uid() = user_id and status in ('pending_review', 'needs_changes', 'approved', 'published'))
    or public.is_admin_or_staff()
  )
  with check (
    public.is_admin_or_staff()
    or (
      auth.uid() = user_id 
      and (
        (status in ('pending_review', 'needs_changes'))
        or (status = 'withdrawn')
      )
    )
  );

-- 4. DELETE:
-- Only owner of pending listing or admin can delete
drop policy if exists "Listing delete access" on public.car_listings;
create policy "Listing delete access" 
  on public.car_listings 
  for delete 
  to authenticated 
  using (
    (auth.uid() = user_id and status in ('pending_review', 'withdrawn', 'archived'))
    or public.is_admin_or_staff()
  );

-- Security Trigger: Prevent customers from changing status to 'approved' or 'published' directly
create or replace function public.enforce_listing_moderation()
returns trigger
language plpgsql
security definer
as $$
begin
  if not public.is_admin_or_staff() then
    -- If customer is updating, ensure they cannot change ownership
    if new.user_id <> old.user_id then
      raise exception 'Unauthorized: Listing ownership cannot be altered.';
    end if;

    -- Ensure customer cannot self-approve or self-publish
    if new.status in ('approved', 'published', 'rejected') and old.status <> new.status then
      raise exception 'Unauthorized: Status changes to approved, published, or rejected require administrator review.';
    end if;

    -- If customer edits a needs_changes listing, automatically return to pending_review
    if old.status = 'needs_changes' and new.status <> 'withdrawn' then
      new.status = 'pending_review';
    end if;
  end if;

  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists tr_enforce_listing_moderation on public.car_listings;
create trigger tr_enforce_listing_moderation
  before update on public.car_listings
  for each row execute procedure public.enforce_listing_moderation();

-- ---------------------------------------------------------------------
-- 5. LISTING IMAGES TABLE
-- ---------------------------------------------------------------------
create table if not exists public.listing_images (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.car_listings on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  image_url text not null,
  slot_type text not null default 'general',
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.listing_images enable row level security;

create index if not exists idx_listing_images_listing_id on public.listing_images(listing_id);

-- Images RLS:
-- 1. Read: Public can view images of public listings, or owner can view their own
drop policy if exists "Images view access" on public.listing_images;
create policy "Images view access"
  on public.listing_images
  for select
  using (
    (auth.uid() = user_id)
    or public.is_admin_or_staff()
    or exists (
      select 1 from public.car_listings cl
      where cl.id = listing_images.listing_id 
        and cl.status in ('approved', 'published', 'sold')
    )
  );

-- 2. Insert: Listing owner can insert images
drop policy if exists "Images insert access" on public.listing_images;
create policy "Images insert access"
  on public.listing_images
  for insert
  to authenticated
  with check (auth.uid() = user_id or public.is_admin_or_staff());

-- 3. Delete: Owner or admin can delete
drop policy if exists "Images delete access" on public.listing_images;
create policy "Images delete access"
  on public.listing_images
  for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin_or_staff());

-- ---------------------------------------------------------------------
-- 6. AUDIT LOGS (IMMUTABLE & APPEND-ONLY)
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references auth.users,
  event_type text not null,
  record_id text,
  details jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_event_type on public.audit_logs(event_type);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Audit Logs RLS:
-- 1. Read: ONLY Admins and Staff
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin_or_staff());

-- 2. Insert: Authenticated users can insert their own actions
drop policy if exists "Users and system can insert audit logs" on public.audit_logs;
create policy "Users and system can insert audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (actor_id = auth.uid() or public.is_admin_or_staff());

-- 3. UPDATE & DELETE: STRICTLY PROHIBITED (Zero policies granted, ensuring append-only behavior)

-- ---------------------------------------------------------------------
-- 7. ADMIN NOTIFICATIONS QUEUE
-- ---------------------------------------------------------------------
create table if not exists public.admin_notifications (
  id uuid default gen_random_uuid() primary key,
  type text not null default 'new_listing',
  title text not null,
  message text not null,
  listing_id uuid references public.car_listings on delete cascade,
  is_read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.admin_notifications enable row level security;

-- Admin Notifications RLS:
drop policy if exists "Admins can manage notifications" on public.admin_notifications;
create policy "Admins can manage notifications"
  on public.admin_notifications
  for all
  to authenticated
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ---------------------------------------------------------------------
-- 8. AUTOMATIC NOTIFICATION TRIGGER ON NEW LISTINGS
-- ---------------------------------------------------------------------
create or replace function public.notify_admin_on_new_listing()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'pending_review' and (tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status <> 'pending_review')) then
    insert into public.admin_notifications (type, title, message, listing_id)
    values (
      'new_listing',
      'إعلان سيارة جديد بانتظار المراجعة',
      'قام العميل بإضافة سيارة ' || new.make || ' ' || new.model || ' موديل ' || new.year || ' وهي بانتظار الاعتماد.',
      new.id
    );

    -- Log audit entry
    insert into public.audit_logs (actor_id, event_type, record_id, details)
    values (
      new.user_id,
      'LISTING_SUBMITTED',
      new.id::text,
      jsonb_build_object('make', new.make, 'model', new.model, 'year', new.year, 'price', new.asking_price)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tr_notify_admin_new_listing on public.car_listings;
create trigger tr_notify_admin_new_listing
  after insert or update of status on public.car_listings
  for each row execute procedure public.notify_admin_on_new_listing();

-- ---------------------------------------------------------------------
-- 9. PUBLIC SANITIZED LISTINGS VIEW (ZERO SENSITIVE SELLER CONTACT INFO)
-- ---------------------------------------------------------------------
create or replace view public.v_public_car_listings as
  select 
    cl.id,
    cl.make,
    cl.model,
    cl.year,
    cl.trim,
    cl.transmission,
    cl.fuel_type,
    cl.engine_size,
    cl.mileage,
    cl.color,
    cl.governorate,
    cl.city,
    cl.asking_price,
    cl.condition_description,
    cl.paint_condition,
    cl.disclosed_defects,
    cl.has_financing,
    cl.financing_type,
    cl.financing_provider,
    cl.status,
    cl.created_at,
    (
      select coalesce(json_agg(li.image_url order by li.display_order), '[]'::json)
      from public.listing_images li
      where li.listing_id = cl.id
    ) as images
  from public.car_listings cl
  where cl.status in ('approved', 'published', 'sold');

-- Grant select on public view to anon and authenticated
grant select on public.v_public_car_listings to anon, authenticated;

-- ---------------------------------------------------------------------
-- 10. STORAGE BUCKET CONFIGURATION & POLICIES
-- ---------------------------------------------------------------------
-- Note: Insert bucket declarations into storage.buckets if table exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('listing-images', 'listing-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage Policies on storage.objects:
-- 1. Avatars: Public read
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable" 
  on storage.objects for select 
  using (bucket_id = 'avatars');

-- 2. Avatars: User can upload ONLY to their own subfolder: avatars/<auth.uid()>/filename
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" 
  on storage.objects for insert 
  to authenticated 
  with check (
    bucket_id = 'avatars' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update own avatar" 
  on storage.objects for update 
  to authenticated 
  using (
    bucket_id = 'avatars' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Listing Images: Public read
drop policy if exists "Listing images are publicly readable" on storage.objects;
create policy "Listing images are publicly readable" 
  on storage.objects for select 
  using (bucket_id = 'listing-images');

-- 4. Listing Images: Authenticated user can upload to listing-images/<auth.uid()>/filename
drop policy if exists "Users can upload listing images" on storage.objects;
create policy "Users can upload listing images" 
  on storage.objects for insert 
  to authenticated 
  with check (
    bucket_id = 'listing-images' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );
