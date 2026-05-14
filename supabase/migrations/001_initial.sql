-- Profiles (auto-created on signup via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Saved events (reference Sanity event _id)
create table public.saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  sanity_event_id text not null,
  saved_at timestamptz default now(),
  unique(user_id, sanity_event_id)
);

-- Saved venues (reference Sanity gallery/museum _id)
create table public.saved_venues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  sanity_venue_id text not null,
  saved_at timestamptz default now(),
  unique(user_id, sanity_venue_id)
);

-- Journal entries (private notes on events)
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  sanity_event_id text not null,
  body text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, sanity_event_id)
);

-- Row-level security
alter table public.profiles enable row level security;
alter table public.saved_events enable row level security;
alter table public.saved_venues enable row level security;
alter table public.journal_entries enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users manage own saved_events" on public.saved_events
  for all using (auth.uid() = user_id);

create policy "Users manage own saved_venues" on public.saved_venues
  for all using (auth.uid() = user_id);

create policy "Users manage own journal_entries" on public.journal_entries
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
