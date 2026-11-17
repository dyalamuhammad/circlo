create table public.circle_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  is_guest boolean not null default false,
  invite_code text unique not null
    default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_at timestamptz not null default now()
);

alter table public.circle_profiles enable row level security;

grant select, insert, update on public.circle_profiles to authenticated;

create policy circle_profiles_select_own on public.circle_profiles
  for select to authenticated using (auth.uid() = id);

create policy circle_profiles_insert_own on public.circle_profiles
  for insert to authenticated with check (auth.uid() = id);

create policy circle_profiles_update_own on public.circle_profiles
  for update to authenticated using (auth.uid() = id);

  create policy circle_profiles_select_temp on public.circle_profiles
  for select to authenticated using (true);