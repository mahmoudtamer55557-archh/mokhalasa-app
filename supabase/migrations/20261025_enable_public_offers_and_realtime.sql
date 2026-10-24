-- =====================================================================
-- MOKHALASA CAR MARKETPLACE — OFFERS, NOTIFICATIONS & REALTIME POLICIES
-- Migration: 20261025_enable_public_offers_and_realtime.sql
-- =====================================================================

-- 1. Ensure all columns exist on purchase_offers
alter table public.purchase_offers
  add column if not exists buyer_user_id uuid references auth.users on delete set null,
  add column if not exists seller_user_id uuid references auth.users on delete set null,
  add column if not exists car_title text,
  add column if not exists admin_notes text,
  add column if not exists communicated_to_seller_at timestamp with time zone,
  add column if not exists seller_response_at timestamp with time zone,
  add column if not exists seller_response_notes text;

-- 2. Clean and configure RLS Policies for purchase_offers
alter table public.purchase_offers enable row level security;

drop policy if exists "Public insert purchase offer" on public.purchase_offers;
drop policy if exists "Admins and owners view offers" on public.purchase_offers;
drop policy if exists "Multi-party secure offer view" on public.purchase_offers;
drop policy if exists "Admins update offers" on public.purchase_offers;
drop policy if exists "Sellers and admins update offers" on public.purchase_offers;
drop policy if exists "Public select purchase offers" on public.purchase_offers;
drop policy if exists "Public update purchase offers" on public.purchase_offers;

create policy "Public insert purchase offer"
  on public.purchase_offers
  for insert
  to anon, authenticated
  with check (true);

create policy "Public select purchase offers"
  on public.purchase_offers
  for select
  to anon, authenticated
  using (true);

create policy "Public update purchase offers"
  on public.purchase_offers
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- 3. Clean and configure RLS Policies for customer_notifications
alter table public.customer_notifications enable row level security;

drop policy if exists "Users view own notifications" on public.customer_notifications;
drop policy if exists "Users update own notifications read status" on public.customer_notifications;
drop policy if exists "Allow insert notifications" on public.customer_notifications;
drop policy if exists "Public select customer notifications" on public.customer_notifications;
drop policy if exists "Public update customer notifications" on public.customer_notifications;

create policy "Allow insert notifications"
  on public.customer_notifications
  for insert
  to anon, authenticated
  with check (true);

create policy "Public select customer notifications"
  on public.customer_notifications
  for select
  to anon, authenticated
  using (true);

create policy "Public update customer notifications"
  on public.customer_notifications
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- 4. Enable Supabase Realtime Publication for instant multi-device sync
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'purchase_offers') then
    alter publication supabase_realtime add table public.purchase_offers;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'admin_notifications') then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'customer_notifications') then
    alter publication supabase_realtime add table public.customer_notifications;
  end if;
exception when others then
  null;
end $$;
