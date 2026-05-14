-- ============================================================
-- ArtMind AI – Phase 3 Schema Update
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Add Stripe fields to profiles ────────────────────────
alter table public.profiles
  add column if not exists stripe_customer_id  text,
  add column if not exists subscription_status text default 'free';

-- ── Payments table ────────────────────────────────────────
create table if not exists public.payments (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  stripe_ref    text not null,
  credits_added integer not null,
  type          text not null, -- 'one_time' | 'subscription_renewal'
  created_at    timestamptz default now()
);

-- RLS for payments
alter table public.payments enable row level security;

create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

-- ── Index for faster lookups ──────────────────────────────
create index if not exists profiles_stripe_customer_id_idx
  on public.profiles(stripe_customer_id);
