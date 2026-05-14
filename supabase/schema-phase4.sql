-- ============================================================
-- ArtMind AI – Phase 4 Schema Update
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Create storage bucket for generated images ────────────
insert into storage.buckets (id, name, public)
values ('generations', 'generations', true)
on conflict do nothing;

-- ── Storage RLS policies ──────────────────────────────────
create policy "Users can upload own images"
  on storage.objects for insert
  with check (bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view generation images"
  on storage.objects for select
  using (bucket_id = 'generations');

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'generations' and auth.uid()::text = (storage.foldername(name))[1]);
