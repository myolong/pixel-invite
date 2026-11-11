-- 픽셀 초대장 참석 여부(RSVP) 저장소. Supabase → SQL Editor에 통째로 붙여 넣고 Run.
-- 표는 직접 읽고 쓸 수 없게 막고(RLS), 아래 함수 3개로만 다룬다.
--   rsvp_register : 링크를 만들 때 초대장 번호와 "만든 사람 열쇠"의 해시를 등록
--   rsvp_submit   : 받은 사람이 참석/불참 응답(같은 기기에서 다시 보내면 고쳐짐)
--   rsvp_list     : 명단 보기. 모두 공개 초대장이거나, 만든 사람 열쇠가 맞을 때만 돌려줌

create table if not exists public.invites (
  id text primary key check (id ~ '^[A-Za-z0-9]{12}$'),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  pub boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id bigint generated always as identity primary key,
  invite_id text not null references public.invites(id) on delete cascade,
  device text not null check (device ~ '^[A-Za-z0-9]{16}$'),
  name text not null check (char_length(name) between 1 and 20),
  attend boolean not null,
  people smallint not null default 1 check (people between 0 and 20),
  note text not null default '' check (char_length(note) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invite_id, device)
);

alter table public.invites enable row level security;
alter table public.rsvps enable row level security;
revoke all on public.invites, public.rsvps from anon, authenticated;

create or replace function public.rsvp_register(p_id text, p_hash text, p_pub boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into invites (id, key_hash, pub) values (p_id, p_hash, coalesce(p_pub, false))
  on conflict (id) do nothing;
  return exists (select 1 from invites where id = p_id and key_hash = p_hash);
end $$;

create or replace function public.rsvp_submit(p_invite text, p_device text, p_name text, p_attend boolean, p_people int, p_note text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from invites where id = p_invite) then return false; end if;
  if (select count(*) from rsvps where invite_id = p_invite) >= 500
     and not exists (select 1 from rsvps where invite_id = p_invite and device = p_device) then return false; end if;
  insert into rsvps (invite_id, device, name, attend, people, note)
  values (p_invite, p_device, btrim(p_name), p_attend, case when p_attend then greatest(1, least(p_people, 20)) else 0 end, coalesce(btrim(p_note), ''))
  on conflict (invite_id, device) do update
    set name = excluded.name, attend = excluded.attend, people = excluded.people, note = excluded.note, updated_at = now();
  return true;
end $$;

create or replace function public.rsvp_list(p_invite text, p_key text default null)
returns table (name text, attend boolean, people smallint, note text, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select r.name, r.attend, r.people, r.note, r.updated_at
  from rsvps r join invites i on i.id = r.invite_id
  where r.invite_id = p_invite
    and (i.pub or (p_key is not null and i.key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex')))
  order by r.updated_at;
$$;

revoke all on function public.rsvp_register(text, text, boolean), public.rsvp_submit(text, text, text, boolean, int, text), public.rsvp_list(text, text) from public;
grant execute on function public.rsvp_register(text, text, boolean), public.rsvp_submit(text, text, text, boolean, int, text), public.rsvp_list(text, text) to anon, authenticated;
