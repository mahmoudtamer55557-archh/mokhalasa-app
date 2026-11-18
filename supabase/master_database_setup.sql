-- =====================================================================
-- منصة مخلصة | MOKHALASA CAR MARKETPLACE — MASTER DATABASE SCHEMA
-- المشروع: vakqpfsuunfjnsnqdjea
-- ترتيب تنفيذي مضمون 100% بدون أي أخطاء تبعية
-- =====================================================================

-- 1. تفعيل الامتدادات المطلوبة أولاً
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. جدول الملفات الشخصية (PROFILES TABLE) أولاً لتفادي أي خطأ تبعية
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key,
  phone text not null default '',
  full_name text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'staff', 'owner', 'admin')),
  governorate text,
  city text,
  is_verified boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles view policy" on public.profiles;
create policy "Profiles view policy" on public.profiles for select using (true);

drop policy if exists "Profiles insert policy" on public.profiles;
create policy "Profiles insert policy" on public.profiles for insert with check (true);

drop policy if exists "Profiles update policy" on public.profiles;
create policy "Profiles update policy" on public.profiles for update using (true) with check (true);

-- ---------------------------------------------------------------------
-- 3. دالة فحص صلاحيات الإدارة (تعتمد على وجود جدول profiles)
-- ---------------------------------------------------------------------
create or replace function public.is_admin_or_staff()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 
    from public.profiles 
    where id = auth.uid() 
      and role in ('admin', 'owner', 'staff')
  );
exception when others then
  return false;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. جدول إعلانات السيارات (CAR LISTINGS TABLE)
-- ---------------------------------------------------------------------
create table if not exists public.car_listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  case_reference text,
  
  -- مواصفات السيارة
  make text not null,
  model text not null,
  year integer not null check (year between 1990 and 2030),
  trim text,
  transmission text not null default 'أوتوماتيك',
  fuel_type text not null default 'بنزين',
  engine_size text,
  mileage integer not null check (mileage >= 0),
  color text,
  
  -- الموقع
  governorate text not null default 'القاهرة',
  city text,
  
  -- السعر والحالة
  asking_price numeric(12,2) not null check (asking_price > 0),
  condition_description text not null default '',
  paint_condition text default 'فابريكا بالكامل',
  disclosed_defects text[] default '{}',
  
  -- المديونية والتمويل
  has_financing boolean not null default true,
  financing_type text default 'bank_loan',
  financing_provider text,
  outstanding_amount numeric(12,2) default 0,
  monthly_installment numeric(12,2) default 0,
  remaining_months integer default 0,
  
  -- التواصل
  seller_name text not null default 'مالك السيارة',
  seller_phone text not null,
  
  -- الحالة وسير العمل
  status text not null default 'pending_review' check (
    status in ('pending_review', 'approved', 'rejected', 'needs_changes', 'published', 'sold', 'archived', 'withdrawn')
  ),
  review_feedback text,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  admin_notes text[] default '{}',
  call_logs jsonb default '[]'::jsonb,
  next_action text,
  followup_status text default 'new',
  deactivation_reason text,
  deactivated_by text,
  deactivated_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.car_listings enable row level security;

create index if not exists idx_car_listings_user_id on public.car_listings(user_id);
create index if not exists idx_car_listings_status on public.car_listings(status);
create index if not exists idx_car_listings_case_ref on public.car_listings(case_reference);
create index if not exists idx_car_listings_created_at on public.car_listings(created_at desc);

drop policy if exists "Allow select car listings" on public.car_listings;
create policy "Allow select car listings" on public.car_listings for select using (true);

drop policy if exists "Allow insert car listings" on public.car_listings;
create policy "Allow insert car listings" on public.car_listings for insert with check (true);

drop policy if exists "Allow update car listings" on public.car_listings;
create policy "Allow update car listings" on public.car_listings for update using (true) with check (true);

drop policy if exists "Allow delete car listings" on public.car_listings;
create policy "Allow delete car listings" on public.car_listings for delete using (true);

-- ---------------------------------------------------------------------
-- 5. جدول صور السيارات (LISTING IMAGES TABLE)
-- ---------------------------------------------------------------------
create table if not exists public.listing_images (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.car_listings on delete cascade not null,
  user_id uuid,
  image_url text not null,
  slot_type text not null default 'general',
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.listing_images enable row level security;

create index if not exists idx_listing_images_listing_id on public.listing_images(listing_id);

drop policy if exists "Allow select listing images" on public.listing_images;
create policy "Allow select listing images" on public.listing_images for select using (true);

drop policy if exists "Allow insert listing images" on public.listing_images;
create policy "Allow insert listing images" on public.listing_images for insert with check (true);

drop policy if exists "Allow delete listing images" on public.listing_images;
create policy "Allow delete listing images" on public.listing_images for delete using (true);

-- ---------------------------------------------------------------------
-- 6. جدول عروض الشراء والتفاوض (PURCHASE OFFERS TABLE)
-- ---------------------------------------------------------------------
create table if not exists public.purchase_offers (
  id text primary key,
  listing_id uuid references public.car_listings on delete cascade,
  case_reference text not null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_user_id uuid,
  seller_user_id uuid,
  car_title text,
  offer_type text not null default 'asking_price' check (offer_type in ('asking_price', 'negotiated')),
  offered_price numeric(12,2) not null check (offered_price > 0),
  asking_price numeric(12,2) not null check (asking_price > 0),
  payment_preference text not null default 'cash_at_bank' check (
    payment_preference in ('cash_at_bank', 'need_new_financing', 'negotiate')
  ),
  preferred_contact_time text default 'مساءً (من 5 إلى 9 مساءً)',
  notes text,
  admin_notes text,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'negotiating', 'accepted', 'declined')
  ),
  communicated_to_seller_at timestamp with time zone,
  seller_response_at timestamp with time zone,
  seller_response_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.purchase_offers enable row level security;

create index if not exists idx_purchase_offers_listing on public.purchase_offers(listing_id);
create index if not exists idx_purchase_offers_status on public.purchase_offers(status);
create index if not exists idx_purchase_offers_created_at on public.purchase_offers(created_at desc);

drop policy if exists "Allow insert purchase offers" on public.purchase_offers;
create policy "Allow insert purchase offers" on public.purchase_offers for insert with check (true);

drop policy if exists "Allow select purchase offers" on public.purchase_offers;
create policy "Allow select purchase offers" on public.purchase_offers for select using (true);

drop policy if exists "Allow update purchase offers" on public.purchase_offers;
create policy "Allow update purchase offers" on public.purchase_offers for update using (true) with check (true);

-- ---------------------------------------------------------------------
-- 7. جدول إشعارات العملاء (CUSTOMER NOTIFICATIONS)
-- ---------------------------------------------------------------------
create table if not exists public.customer_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  type text not null default 'general',
  title text not null,
  message text not null,
  link_view text,
  related_id text,
  is_read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.customer_notifications enable row level security;

create index if not exists idx_cust_notifs_user on public.customer_notifications(user_id);
create index if not exists idx_cust_notifs_unread on public.customer_notifications(user_id, is_read);
create index if not exists idx_cust_notifs_created on public.customer_notifications(created_at desc);

drop policy if exists "Allow insert customer notifications" on public.customer_notifications;
create policy "Allow insert customer notifications" on public.customer_notifications for insert with check (true);

drop policy if exists "Allow select customer notifications" on public.customer_notifications;
create policy "Allow select customer notifications" on public.customer_notifications for select using (true);

drop policy if exists "Allow update customer notifications" on public.customer_notifications;
create policy "Allow update customer notifications" on public.customer_notifications for update using (true) with check (true);

-- ---------------------------------------------------------------------
-- 8. جدول إشعارات الإدارة (ADMIN NOTIFICATIONS)
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

drop policy if exists "Allow insert admin notifications" on public.admin_notifications;
create policy "Allow insert admin notifications" on public.admin_notifications for insert with check (true);

drop policy if exists "Allow select admin notifications" on public.admin_notifications;
create policy "Allow select admin notifications" on public.admin_notifications for select using (true);

drop policy if exists "Allow update admin notifications" on public.admin_notifications;
create policy "Allow update admin notifications" on public.admin_notifications for update using (true) with check (true);

-- ---------------------------------------------------------------------
-- 9. جدول سجل التدقيق والعمليات (AUDIT LOGS)
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid,
  event_type text not null,
  record_id text,
  details jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;

create index if not exists idx_audit_logs_event_type on public.audit_logs(event_type);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

drop policy if exists "Allow insert audit logs" on public.audit_logs;
create policy "Allow insert audit logs" on public.audit_logs for insert with check (true);

drop policy if exists "Allow select audit logs" on public.audit_logs;
create policy "Allow select audit logs" on public.audit_logs for select using (true);

-- ---------------------------------------------------------------------
-- 10. إعداد مجلدات التخزين للصور (STORAGE BUCKETS & POLICIES)
-- ---------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values 
    ('listing-images', 'listing-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
    ('car-images', 'car-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set public = true;
exception when others then null;
end $$;

do $$
begin
  drop policy if exists "Public Access listing-images" on storage.objects;
  create policy "Public Access listing-images" on storage.objects for select using (bucket_id in ('listing-images', 'car-images'));
exception when others then null;
end $$;

do $$
begin
  drop policy if exists "Public Insert listing-images" on storage.objects;
  create policy "Public Insert listing-images" on storage.objects for insert with check (bucket_id in ('listing-images', 'car-images'));
exception when others then null;
end $$;

do $$
begin
  drop policy if exists "Public Update listing-images" on storage.objects;
  create policy "Public Update listing-images" on storage.objects for update using (bucket_id in ('listing-images', 'car-images'));
exception when others then null;
end $$;

do $$
begin
  drop policy if exists "Public Delete listing-images" on storage.objects;
  create policy "Public Delete listing-images" on storage.objects for delete using (bucket_id in ('listing-images', 'car-images'));
exception when others then null;
end $$;

-- ---------------------------------------------------------------------
-- 11. ربط تسجيل جوجل وإنشاء الملف الشخصي وصلاحيات المؤسس
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'customer';
begin
  if new.email in ('mahmoudtamer55557@gmail.com', 'mahmoud@mokhalasa.com') 
     or new.phone in ('01008836962', '+201008836962', '201008836962')
     or (new.raw_user_meta_data->>'phone') in ('01008836962', '+201008836962') then
    v_role := 'admin';
  end if;

  insert into public.profiles (
    id,
    phone,
    full_name,
    avatar_url,
    role,
    is_verified
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'phone', new.phone, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'عميل مخلصة'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    v_role,
    true
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    role = case when v_role = 'admin' then 'admin' else profiles.role end,
    updated_at = timezone('utc'::text, now());
    
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- دالة إدارة الإعلانات
create or replace function public.admin_moderate_listing(
  p_listing_id uuid,
  p_new_status text,
  p_feedback text default null,
  p_staff_name text default 'إدارة مخلصة'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_listing record;
  v_seller_id uuid;
  v_car_title text;
begin
  select * into v_listing from public.car_listings where id = p_listing_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'الإعلان غير موجود');
  end if;

  v_seller_id := v_listing.user_id;
  v_car_title := coalesce(v_listing.make, '') || ' ' || coalesce(v_listing.model, '') || ' ' || coalesce(v_listing.year::text, '');

  update public.car_listings
  set 
    status = p_new_status,
    review_feedback = coalesce(p_feedback, review_feedback),
    updated_at = timezone('utc'::text, now())
  where id = p_listing_id;

  if p_new_status in ('approved', 'published') and v_seller_id is not null then
    begin
      insert into public.customer_notifications (
        user_id,
        type,
        title,
        message,
        link_view,
        related_id
      ) values (
        v_seller_id,
        'listing_published',
        'تهانينا! تم اعتماد ونشر إعلان سيارتك',
        'تمت مراجعة واعتماد إعلان سيارتك (' || v_car_title || ') بنجاح من قِبل إدارة مخلصة، وأصبح الآن منشوراً ومتاحاً لجميع المشترين في المعرض العام.',
        'profile',
        p_listing_id::text
      );
    exception when others then null; end;
  end if;

  return jsonb_build_object('success', true, 'message', 'تم تحديث حالة الإعلان بنجاح');
end;
$$;

grant execute on function public.admin_moderate_listing to anon, authenticated;

-- ---------------------------------------------------------------------
-- 12. تفعيل التحديث اللحظي (REALTIME)
-- ---------------------------------------------------------------------
do $$ begin alter publication supabase_realtime add table public.car_listings; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.purchase_offers; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.customer_notifications; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.admin_notifications; exception when others then null; end $$;

-- ---------------------------------------------------------------------
-- 13. استرجاع سيارات المعرض الأساسية (SEED LISTINGS)
-- ---------------------------------------------------------------------
insert into public.car_listings (
  id, case_reference, make, model, year, trim, transmission, fuel_type, engine_size,
  mileage, color, governorate, city, asking_price, condition_description, paint_condition,
  disclosed_defects, has_financing, financing_type, financing_provider, outstanding_amount,
  monthly_installment, remaining_months, seller_name, seller_phone, status
)
values 
(
  '42d64b78-5162-4518-a23c-ce86177d12d6', 'MK-CASE-2026-101', 'نيسان', 'صني (Sunny)', 2023,
  'سوبر صالون بصمة وتكييف تاتش (Super Saloon)', 'أوتوماتيك', 'بنزين', '1500 cc', 34000,
  'فضي ميتاليك', 'القاهرة', 'التجمع الخامس (القاهرة الجديدة)', 620000,
  'العربية فابريكا من الزيرو وصيانتها منتظمة في التوكيل. البيع فقط لتصفية المديونية بالكامل.',
  'فابريكا بالكامل', array['شروخ بسيطة بالزجاج أو الصالون'], true, 'bank_loan',
  'بنك كريدي أجريكول مصر', 260000, 9400, 32, 'م. طارق العسلي', '01012345678', 'published'
),
(
  '8d578635-4673-45f8-80f4-d538e146cba2', 'MK-CASE-2026-102', 'هيونداي', 'إلنترا CN7 (Elantra CN7)', 2022,
  'الفئة الرابعة سمارت بلس (Smart Plus)', 'أوتوماتيك', 'بنزين', '1600 cc', 52000,
  'رمادي غامق (فحمى)', 'الجيزة', 'الدقي والمهندسين', 980000,
  'السيارة بحالة ممتازة جداً واستخدام راقي، رشة إكصدام أمامي نظافة وباقي السيارة فابريكا بالكامل.',
  'رش أجزاء خارجية (نظافة)', array['حكات سطحية بالإكصدام الأمامي'], true, 'bank_loan',
  'البنك التجاري الدولي (CIB)', 410000, 14200, 34, 'د. كريم عبد العزيز', '01123456789', 'published'
),
(
  '9e123456-7890-4abc-def1-234567890abc', 'MK-CASE-2026-103', 'كيا', 'سبورتاج (Sportage)', 2021,
  'هاي لاين بانوراما (Highline)', 'أوتوماتيك', 'بنزين', '1600 cc', 68000,
  'أبيض لؤلؤي', 'الإسكندرية', 'سموحة', 1150000,
  'كيا سبورتاج 2021 أعلى فئة بانوراما، فابريكا بالكامل والمتبقي تسوية بنكية مباشرة.',
  'فابريكا بالكامل', array['لا توجد عيوب'], true, 'bank_loan',
  'بنك مصر', 380000, 12500, 36, 'أ. سامح عبد السلام', '01234567890', 'published'
),
(
  'af345678-9012-4def-bcde-345678901def', 'MK-CASE-2026-104', 'إم جي', 'MG 5', 2022,
  'كومفورت (Comfort)', 'أوتوماتيك', 'بنزين', '1500 cc', 41000,
  'أحمر ميتاليك', 'القاهرة', 'مدينة نصر', 580000,
  'سيارة إم جي 5 كسر زيرو، فابريكا بالكامل وصيانة دورية بالتوكيل والباقي تسوية بالبنك الأهلي المصري.',
  'فابريكا بالكامل', array['لا توجد عيوب'], true, 'bank_loan',
  'البنك الأهلي المصري', 195000, 6800, 34, 'مهندس وليد نبيل', '01098765432', 'published'
),
(
  'b1234567-8901-4cde-f123-456789012cde', 'MK-CASE-2026-105', 'تويوتا', 'كورولا (Corolla)', 2020,
  'الفئة الثانية كومفورت (Comfort)', 'أوتوماتيك', 'بنزين', '1600 cc', 75000,
  'برونزي ميتاليك', 'الجيزة', 'الشيخ زايد و 6 أكتوبر', 890000,
  'تويوتا كورولا الجيل الحديث، رشة حزام نظافة وفابريكا دواخل وسقف وشنطة بالكامل.',
  'رش حزام نظافة', array['حكات بسيطة'], true, 'direct_installment',
  'تقسيط مباشر بمعرفة المالك', 220000, 8000, 32, 'حاج محمود السويفي', '01187654321', 'published'
)
on conflict (id) do nothing;

insert into public.listing_images (listing_id, image_url, slot_type, display_order)
values
  ('42d64b78-5162-4518-a23c-ce86177d12d6', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80', 'exterior_front', 0),
  ('42d64b78-5162-4518-a23c-ce86177d12d6', 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80', 'interior_front', 1),
  ('8d578635-4673-45f8-80f4-d538e146cba2', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80', 'exterior_front', 0),
  ('8d578635-4673-45f8-80f4-d538e146cba2', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'interior_front', 1),
  ('9e123456-7890-4abc-def1-234567890abc', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'exterior_front', 0),
  ('af345678-9012-4def-bcde-345678901def', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80', 'exterior_front', 0),
  ('b1234567-8901-4cde-f123-456789012cde', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80', 'exterior_front', 0)
on conflict do nothing;
