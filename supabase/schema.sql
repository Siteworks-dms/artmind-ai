-- ============================================================
-- ArtMind AI – Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ── PROFILES ──────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── CREDITS ───────────────────────────────────────────────
create table public.credits (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null unique,
  balance          integer default 10 not null check (balance >= 0),
  total_purchased  integer default 0,
  total_used       integer default 0,
  updated_at       timestamptz default now()
);

-- ── GENERATIONS ───────────────────────────────────────────
create table public.generations (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  prompt        text not null,
  model         text not null,
  provider      text not null,
  size          text not null,
  style         text,
  image_url     text,
  credits_used  integer default 1,
  created_at    timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.credits    enable row level security;
alter table public.generations enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Credits
create policy "credits_select_own" on public.credits
  for select using (auth.uid() = user_id);
create policy "credits_update_own" on public.credits
  for update using (auth.uid() = user_id);

-- Generations
create policy "generations_select_own" on public.generations
  for select using (auth.uid() = user_id);
create policy "generations_insert_own" on public.generations
  for insert with check (auth.uid() = user_id);
create policy "generations_delete_own" on public.generations
  for delete using (auth.uid() = user_id);

-- ── AUTO-CREATE PROFILE + 10 FREE CREDITS ON SIGNUP ──────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.credits (user_id, balance)
  values (new.id, 10);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── DEDUCT CREDIT FUNCTION (called from serverless API) ───
create or replace function public.deduct_credit(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.credits
  set
    balance      = balance - 1,
    total_used   = total_used + 1,
    updated_at   = now()
  where user_id = p_user_id
    and balance  > 0
  returning balance into new_balance;

  if not found then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  return new_balance;
end;
$$;

-- ── ADD CREDITS FUNCTION (called after Stripe payment) ────
create or replace function public.add_credits(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.credits
  set
    balance          = balance + p_amount,
    total_purchased  = total_purchased + p_amount,
    updated_at       = now()
  where user_id = p_user_id
  returning balance into new_balance;

  return new_balance;
end;
$$;

-- ── UPDATED_AT TRIGGER ────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger credits_updated_at before update on public.credits
  for each row execute procedure public.set_updated_at();
