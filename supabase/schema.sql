-- Book Club schema
-- Run this in the Supabase SQL editor (Dashboard > SQL > New query).
-- Free tier: this creates the tables, RLS, and anon access the app needs.

create extension if not exists pgcrypto;

-- Users (no auth; just a shared name list)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40 and name = btrim(name)),
  created_at timestamptz not null default now()
);

create unique index if not exists users_name_key on public.users (name);

-- Books; cover_i = book cover id from Open Library; book_api_id = Open Library ID (OLID)
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  book_api_id text not null unique,
  title text not null,
  authors text[] not null default '{}',
  subjects text[] not null default '{}',
  synopsis text not null default '',
  cover_i integer,
  created_at timestamptz not null default now()
);

-- Votes: one row per (book, user); toggles are upserted
create table if not exists public.votes (
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  recommended boolean not null default false,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (book_id, user_id)
);

-- Comments; updated_by = creator on insert, changes to the editor on update
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  updated_by uuid not null references public.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: this is a trust-based, no-login, so anon can read shared data
-- and write rows. Inputs are still validated in the app.
alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;

create policy "anon read users"     on public.users    for select to anon using (true);
create policy "anon insert users"   on public.users    for insert to anon with check (true);

create policy "anon read books"     on public.books    for select to anon using (true);
create policy "anon insert books"   on public.books    for insert to anon with check (true);

create policy "anon read votes"     on public.votes    for select to anon using (true);
create policy "anon insert votes"   on public.votes    for insert to anon with check (true);
create policy "anon update votes"   on public.votes    for update to anon using (true) with check (true);

create policy "anon read comments"   on public.comments for select to anon using (true);
create policy "anon insert comments" on public.comments for insert to anon with check (true);
create policy "anon update comments" on public.comments for update to anon using (true) with check (true);