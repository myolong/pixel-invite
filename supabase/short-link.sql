-- 픽셀 초대장 짧은 링크 저장소. Supabase → SQL Editor에 통째로 붙여 넣고 Run.
-- 초대장 내용(긴 링크 코드)을 8글자 번호로 저장해 invite-<종류>.html?s=<번호> 처럼 짧은 주소를 만든다.
-- 링크가 짧아야 카카오톡이 링크 미리보기(제목·그림)를 만든다.
-- 표는 직접 읽고 쓸 수 없게 막고(RLS), 아래 함수 2개로만 다룬다.
--   link_put : 번호와 코드를 저장(같은 번호가 이미 있으면 덮어쓰지 않음)
--   link_get : 번호로 코드 읽기

create table if not exists public.links (
  id text primary key check (id ~ '^[A-Za-z0-9]{8}$'),
  code text not null check (char_length(code) between 10 and 150000 and code ~ '^[zj]\.[A-Za-z0-9_-]+$'),
  created_at timestamptz not null default now()
);

alter table public.links enable row level security;
revoke all on public.links from anon, authenticated;

create or replace function public.link_put(p_id text, p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into links (id, code) values (p_id, p_code) on conflict (id) do nothing;
  return exists (select 1 from links where id = p_id and code = p_code);
end $$;

create or replace function public.link_get(p_id text)
returns text language sql stable security definer set search_path = public as $$
  select code from links where id = p_id;
$$;

revoke all on function public.link_put(text, text), public.link_get(text) from public;
grant execute on function public.link_put(text, text), public.link_get(text) to anon, authenticated;
