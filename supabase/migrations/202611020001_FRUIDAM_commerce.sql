begin;
create table if not exists public."FRUIDAM_commerce" (
  id boolean primary key default true check(id),
  document jsonb not null,
  revision bigint not null default 1
);
alter table public."FRUIDAM_commerce" enable row level security;
revoke all on public."FRUIDAM_commerce" from anon, authenticated;
insert into public."FRUIDAM_commerce" (id,document) values(true,'{"version":1,"members":[],"products":[],"orders":[],"claims":[],"notices":[],"purchases":[],"imageUsage":{},"downloads":{},"projectProducts":{}}'::jsonb) on conflict(id) do nothing;
create or replace function public."FRUIDAM_commerce_load"() returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object('document',document,'revision',revision) from public."FRUIDAM_commerce" where id=true;
$$;
create or replace function public."FRUIDAM_commerce_save"(next_document jsonb,expected_revision bigint) returns void language plpgsql security definer set search_path=public as $$
begin
  if jsonb_typeof(next_document) <> 'object' or next_document->>'version' <> '1' then raise exception 'invalid commerce document'; end if;
  update public."FRUIDAM_commerce" set document=next_document,revision=revision+1 where id=true and revision=expected_revision;
  if not found then raise exception 'revision conflict' using errcode='40001'; end if;
end;
$$;
revoke all on function public."FRUIDAM_commerce_load"() from public,anon,authenticated;
revoke all on function public."FRUIDAM_commerce_save"(jsonb,bigint) from public,anon,authenticated;
grant execute on function public."FRUIDAM_commerce_load"() to service_role;
grant execute on function public."FRUIDAM_commerce_save"(jsonb,bigint) to service_role;
commit;
