-- Tabel pertemanan
create table public.circle_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- Satu pasangan hanya boleh punya satu relasi, siapa pun yang mengirim
create unique index circle_friendships_pair_uniq on public.circle_friendships (
  least(requester_id, addressee_id), greatest(requester_id, addressee_id)
);

alter table public.circle_friendships enable row level security;

-- Tidak ada grant insert: tambah teman HANYA lewat fungsi circle_add_friend_by_code
grant select, update, delete on public.circle_friendships to authenticated;

create policy circle_friendships_select on public.circle_friendships
  for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

create policy circle_friendships_accept on public.circle_friendships
  for update to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id and status = 'accepted');

create policy circle_friendships_delete on public.circle_friendships
  for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- Helper: sudah berteman (accepted)?
create or replace function public.circle_are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.circle_friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- Helper: ada relasi apa pun (pending/accepted), untuk membaca nama di daftar request
create or replace function public.circle_are_connected(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.circle_friendships
    where (requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a)
  );
$$;

revoke all on function public.circle_are_friends(uuid, uuid) from public;
revoke all on function public.circle_are_connected(uuid, uuid) from public;
grant execute on function public.circle_are_friends(uuid, uuid) to authenticated;
grant execute on function public.circle_are_connected(uuid, uuid) to authenticated;

-- Tambah teman lewat kode invite (guest ditolak di sini)
create or replace function public.circle_add_friend_by_code(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  me_guest boolean;
  target record;
  existing record;
begin
  if me is null then return 'unauthenticated'; end if;

  select is_guest into me_guest from public.circle_profiles where id = me;
  if me_guest is null or me_guest then return 'guest_not_allowed'; end if;

  select id, is_guest into target
  from public.circle_profiles where invite_code = upper(trim(p_code));
  if not found then return 'not_found'; end if;
  if target.id = me then return 'self'; end if;
  if target.is_guest then return 'target_is_guest'; end if;

  select * into existing from public.circle_friendships
  where (requester_id = me and addressee_id = target.id)
     or (requester_id = target.id and addressee_id = me);

  if found then
    if existing.status = 'pending' and existing.addressee_id = me then
      update public.circle_friendships set status = 'accepted' where id = existing.id;
      return 'accepted';
    end if;
    return existing.status;
  end if;

  insert into public.circle_friendships (requester_id, addressee_id)
  values (me, target.id);
  return 'requested';
end;
$$;

revoke all on function public.circle_add_friend_by_code(text) from public;
grant execute on function public.circle_add_friend_by_code(text) to authenticated;

-- Ganti policy sementara dengan yang sebenarnya
drop policy circle_locations_select_temp on public.circle_locations;
create policy circle_locations_select_friends on public.circle_locations
  for select to authenticated
  using (auth.uid() = user_id or public.circle_are_friends(auth.uid(), user_id));

drop policy circle_profiles_select_temp on public.circle_profiles;
create policy circle_profiles_select_connected on public.circle_profiles
  for select to authenticated
  using (auth.uid() = id or public.circle_are_connected(auth.uid(), id));