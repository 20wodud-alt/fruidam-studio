begin;

create table if not exists public."FRUIDAM_projects" (
  id uuid primary key,
  document jsonb not null check (jsonb_typeof(document) = 'object' and document->>'id' is not null and document->>'id' = id::text),
  revision bigint not null default 1 check (revision > 0),
  position integer not null check (position >= 0),
  synced_at timestamptz not null default now()
);
create table if not exists public."FRUIDAM_sections" (
  project_id uuid not null references public."FRUIDAM_projects"(id) on delete cascade,
  id text not null check (length(id) between 1 and 100),
  position integer not null check (position >= 0),
  document jsonb not null check (jsonb_typeof(document) = 'object' and document->>'id' is not null and document->>'id' = id),
  primary key (project_id, id)
);
create index if not exists "FRUIDAM_sections_project_position_idx" on public."FRUIDAM_sections" (project_id, position);
alter table public."FRUIDAM_projects" enable row level security;
alter table public."FRUIDAM_sections" enable row level security;
revoke all on public."FRUIDAM_projects", public."FRUIDAM_sections" from public, anon, authenticated;
grant select, insert, update, delete on public."FRUIDAM_projects", public."FRUIDAM_sections" to service_role;

create or replace function public."FRUIDAM_load_projects"()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'revision', p.revision,
    'project', p.document || jsonb_build_object('sections', coalesce((
      select jsonb_agg(s.document order by s.position, s.id)
      from public."FRUIDAM_sections" s where s.project_id = p.id
    ), '[]'::jsonb))
  ) order by p.position, p.id), '[]'::jsonb)
  from public."FRUIDAM_projects" p;
$$;

create or replace function public."FRUIDAM_apply_changes"(changes jsonb, deletions jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  item jsonb;
  section_item jsonb;
  project_document jsonb;
  project_id_value uuid;
  expected_revision bigint;
  current_revision bigint;
  section_position integer;
begin
  if jsonb_typeof(changes) is distinct from 'array' or jsonb_typeof(deletions) is distinct from 'array' then
    raise exception 'Invalid change set' using errcode = '22023';
  end if;
  -- Serialize workspace commits across server processes. Revision checks prevent
  -- a stale snapshot from overwriting a newer commit; nothing is auto-retried.
  perform pg_catalog.pg_advisory_xact_lock(1806435019);
  for item in select value from jsonb_array_elements(deletions) loop
    project_id_value := (item->>'id')::uuid;
    expected_revision := (item->>'expected_revision')::bigint;
    select revision into current_revision from public."FRUIDAM_projects" where id = project_id_value for update;
    if current_revision is null or expected_revision is null or current_revision <> expected_revision then
      raise exception 'FRUIDAM revision conflict' using errcode = '40001';
    end if;
    delete from public."FRUIDAM_projects" where id = project_id_value;
  end loop;
  for item in select value from jsonb_array_elements(changes) loop
    project_document := item->'project';
    project_id_value := (project_document->>'id')::uuid;
    expected_revision := (item->>'expected_revision')::bigint;
    if jsonb_typeof(project_document) is distinct from 'object'
      or jsonb_typeof(project_document->'product') is distinct from 'object'
      or jsonb_typeof(project_document->'sections') is distinct from 'array'
      or jsonb_array_length(project_document->'sections') not between 1 and 30
      or expected_revision is null or item->>'position' is null or (item->>'position')::integer < 0 then
      raise exception 'Invalid project document' using errcode = '22023';
    end if;
    select revision into current_revision from public."FRUIDAM_projects" where id = project_id_value for update;
    if (current_revision is null and expected_revision <> 0)
      or (current_revision is not null and current_revision <> expected_revision) then
      raise exception 'FRUIDAM revision conflict' using errcode = '40001';
    end if;
    insert into public."FRUIDAM_projects" (id, document, revision, position)
    values (project_id_value, project_document - 'sections', 1, (item->>'position')::integer)
    on conflict (id) do update set
      document = excluded.document, revision = "FRUIDAM_projects".revision + 1,
      position = excluded.position, synced_at = now();
    delete from public."FRUIDAM_sections" where project_id = project_id_value;
    section_position := 0;
    for section_item in select value from jsonb_array_elements(project_document->'sections') loop
      insert into public."FRUIDAM_sections" (project_id, id, position, document)
      values (project_id_value, section_item->>'id', section_position, section_item);
      section_position := section_position + 1;
    end loop;
  end loop;
end;
$$;

revoke all on function public."FRUIDAM_load_projects"() from public, anon, authenticated;
revoke all on function public."FRUIDAM_apply_changes"(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public."FRUIDAM_load_projects"() to service_role;
grant execute on function public."FRUIDAM_apply_changes"(jsonb, jsonb) to service_role;
notify pgrst, 'reload schema';
commit;
