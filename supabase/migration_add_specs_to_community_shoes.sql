-- Migration: add physical specs columns to community_shoes if they don't exist
-- Run this in Supabase SQL Editor if community_shoes was created without these columns

alter table public.community_shoes
  add column if not exists weight text,
  add column if not exists drop text,
  add column if not exists stack_height text,
  add column if not exists cushioning text,
  add column if not exists usage_count integer default 0,
  add column if not exists submitted_by uuid references auth.users(id);

-- Allow authenticated users to update community shoes (for specs backfill)
create policy if not exists "Authenticated users can update community shoes"
  on public.community_shoes for update
  using (auth.uid() is not null);
