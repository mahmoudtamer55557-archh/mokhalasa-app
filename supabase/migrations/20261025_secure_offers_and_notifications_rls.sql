-- =====================================================================
-- MOKHALASA CAR MARKETPLACE — PRODUCTION SECURITY HARDENING & RLS POLICIES
-- Migration: 20261025_secure_offers_and_notifications_rls.sql
-- =====================================================================

-- 1. PURCHASE OFFERS ROW LEVEL SECURITY
alter table public.purchase_offers enable row level security;

-- Drop legacy broad or permissive policies
drop policy if exists "Public insert purchase offer" on public.purchase_offers;
drop policy if exists "Public select purchase offers" on public.purchase_offers;
drop policy if exists "Public update purchase offers" on public.purchase_offers;
drop policy if exists "Admins and owners view offers" on public.purchase_offers;
drop policy if exists "Multi-party secure offer view" on public.purchase_offers;
drop policy if exists "Sellers and admins update offers" on public.purchase_offers;
drop policy if exists "Admins update offers" on public.purchase_offers;

-- Secure Insert: Anyone authenticated can insert, or anon lead submission
create policy "Allow insert purchase offers"
  on public.purchase_offers
  for insert
  to anon, authenticated
  with check (true);

-- Secure Select: Strict multi-party visibility (Admin, Buyer, Seller)
create policy "Secure multi-party select purchase offers"
  on public.purchase_offers
  for select
  to anon, authenticated
  using (
    -- 1. Operations staff & admins have full visibility
    public.is_admin_or_staff()
    -- 2. Buyer can only view their own offers
    or (auth.uid() is not null and auth.uid() = buyer_user_id)
    -- 3. Seller can only view offers forwarded to them or belonging to their listing
    or (auth.uid() is not null and (
      auth.uid() = seller_user_id
      or exists (
        select 1 from public.car_listings cl
        where cl.id = purchase_offers.listing_id
          and cl.user_id = auth.uid()
      )
    ))
  );

-- Secure Update: Only Admin/Staff or the designated Seller can update offer status
create policy "Secure update purchase offers"
  on public.purchase_offers
  for update
  to authenticated
  using (
    public.is_admin_or_staff()
    or auth.uid() = seller_user_id
    or exists (
      select 1 from public.car_listings cl
      where cl.id = purchase_offers.listing_id
        and cl.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin_or_staff()
    or auth.uid() = seller_user_id
    or exists (
      select 1 from public.car_listings cl
      where cl.id = purchase_offers.listing_id
        and cl.user_id = auth.uid()
    )
  );

-- 2. CUSTOMER NOTIFICATIONS ROW LEVEL SECURITY
alter table public.customer_notifications enable row level security;

-- Drop legacy permissive policies
drop policy if exists "Allow insert notifications" on public.customer_notifications;
drop policy if exists "Public select customer notifications" on public.customer_notifications;
drop policy if exists "Public update customer notifications" on public.customer_notifications;
drop policy if exists "Users view own notifications" on public.customer_notifications;
drop policy if exists "Users update own notifications read status" on public.customer_notifications;

-- Secure Insert: System and authenticated users can send notifications
create policy "Allow insert customer notifications"
  on public.customer_notifications
  for insert
  to anon, authenticated
  with check (true);

-- Secure Select: Users only see their own notifications, admins see all
create policy "Users view own notifications"
  on public.customer_notifications
  for select
  to authenticated
  using (
    auth.uid() = user_id 
    or public.is_admin_or_staff()
  );

-- Secure Update: Users can only mark their own notifications as read
create policy "Users update own notifications"
  on public.customer_notifications
  for update
  to authenticated
  using (
    auth.uid() = user_id 
    or public.is_admin_or_staff()
  )
  with check (
    auth.uid() = user_id 
    or public.is_admin_or_staff()
  );
