-- =====================================================================
-- MOKHALASA — SECURE PROFILES SCHEMA & RLS POLICIES
-- Migration: 20261022_create_profiles_table.sql
-- =====================================================================

-- 1. Create public.profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. RLS Security Policies:
-- Only authenticated users can read their own profile record.
-- Anonymous / unauthenticated users have ZERO access to private profile data.
create policy "Users can view own profile" 
  on public.profiles 
  for select 
  to authenticated 
  using (auth.uid() = id);

-- Only authenticated users can update their own profile record.
create policy "Users can update own profile" 
  on public.profiles 
  for update 
  to authenticated 
  using (auth.uid() = id);

-- Only authenticated users can insert their own profile record matching their UID.
create policy "Users can insert own profile" 
  on public.profiles 
  for insert 
  to authenticated 
  with check (auth.uid() = id);

-- 4. Trigger to handle profile creation automatically on auth.users creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Updated_at auto-timestamp trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
