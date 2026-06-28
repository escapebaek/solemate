-- Run Shoes App - Supabase Schema
-- Execute this in your Supabase project SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Shoes table
create table public.shoes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  brand text not null,
  model text not null,
  nickname text,
  image_url text,
  color text,
  size text,
  purchase_date date,
  max_mileage numeric default 800 not null,
  current_mileage numeric default 0 not null,
  is_retired boolean default false not null,
  notes text,
  specs jsonb,
  sneaker_db_id text,
  created_at timestamptz default now() not null
);

-- Runs table
create table public.runs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  shoe_id uuid references public.shoes(id) on delete cascade not null,
  distance numeric not null,
  date date not null,
  screenshot_url text,
  notes text,
  created_at timestamptz default now() not null
);

-- Row Level Security
alter table public.shoes enable row level security;
alter table public.runs enable row level security;

-- Shoes policies
create policy "Users can view their own shoes"
  on public.shoes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own shoes"
  on public.shoes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own shoes"
  on public.shoes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own shoes"
  on public.shoes for delete
  using (auth.uid() = user_id);

-- Runs policies
create policy "Users can view their own runs"
  on public.runs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own runs"
  on public.runs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own runs"
  on public.runs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own runs"
  on public.runs for delete
  using (auth.uid() = user_id);

-- Storage bucket for shoe images and run screenshots
insert into storage.buckets (id, name, public)
values ('shoe-images', 'shoe-images', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('run-screenshots', 'run-screenshots', false)
on conflict do nothing;

-- Storage policies
create policy "Users can upload shoe images"
  on storage.objects for insert
  with check (bucket_id = 'shoe-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view shoe images"
  on storage.objects for select
  using (bucket_id = 'shoe-images');

create policy "Users can delete their shoe images"
  on storage.objects for delete
  using (bucket_id = 'shoe-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload run screenshots"
  on storage.objects for insert
  with check (bucket_id = 'run-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their run screenshots"
  on storage.objects for select
  using (bucket_id = 'run-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their run screenshots"
  on storage.objects for delete
  using (bucket_id = 'run-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);
