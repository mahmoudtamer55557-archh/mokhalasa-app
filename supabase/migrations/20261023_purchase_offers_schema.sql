-- =====================================================================
-- MOKHALASA CAR MARKETPLACE — PURCHASE OFFERS & BUYER INQUIRIES SCHEMA
-- Migration: 20261023_purchase_offers_schema.sql
-- =====================================================================

create table if not exists public.purchase_offers (
  id text primary key,
  listing_id uuid references public.car_listings on delete cascade,
  case_reference text not null,
  buyer_name text not null,
  buyer_phone text not null,
  offer_type text not null default 'asking_price' check (offer_type in ('asking_price', 'negotiated')),
  offered_price numeric(12,2) not null check (offered_price > 0),
  asking_price numeric(12,2) not null check (asking_price > 0),
  payment_preference text not null default 'cash_at_bank' check (
    payment_preference in ('cash_at_bank', 'need_new_financing', 'negotiate')
  ),
  preferred_contact_time text default 'مساءً (من 5 إلى 9 مساءً)',
  notes text,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'negotiating', 'accepted', 'declined')
  ),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.purchase_offers enable row level security;

-- Indexes for performance
create index if not exists idx_purchase_offers_listing on public.purchase_offers(listing_id);
create index if not exists idx_purchase_offers_status on public.purchase_offers(status);
create index if not exists idx_purchase_offers_created_at on public.purchase_offers(created_at desc);

-- Purchase Offers RLS Policies:
-- 1. Insert: Anyone (authenticated buyer or unauthenticated visitor) can submit a purchase offer
drop policy if exists "Public insert purchase offer" on public.purchase_offers;
create policy "Public insert purchase offer"
  on public.purchase_offers
  for insert
  to anon, authenticated
  with check (true);

-- 2. Select: Only Admins/Staff and the Listing Owner can view offers
drop policy if exists "Admins and owners view offers" on public.purchase_offers;
create policy "Admins and owners view offers"
  on public.purchase_offers
  for select
  to authenticated
  using (
    public.is_admin_or_staff()
    or exists (
      select 1 from public.car_listings cl
      where cl.id = purchase_offers.listing_id
        and cl.user_id = auth.uid()
    )
  );

-- 3. Update: Only Admins/Staff can update offer status
drop policy if exists "Admins update offers" on public.purchase_offers;
create policy "Admins update offers"
  on public.purchase_offers
  for update
  to authenticated
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());
