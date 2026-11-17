create table public.circle_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy real,
  sharing boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.circle_locations enable row level security;

grant select, insert, update on public.circle_locations to authenticated;

create policy circle_locations_insert_own on public.circle_locations
  for insert to authenticated with check (auth.uid() = user_id);

create policy circle_locations_update_own on public.circle_locations
  for update to authenticated using (auth.uid() = user_id);

-- SEMENTARA: semua user login bisa baca, supaya kita bisa tes realtime.
-- Akan diganti jadi "hanya teman" di Fase 3.
create policy circle_locations_select_temp on public.circle_locations
  for select to authenticated using (true);

alter publication supabase_realtime add table public.circle_locations;