drop policy if exists properties_select on public.properties;

create policy properties_select on public.properties
for select to authenticated
using (
  created_by = (select auth.uid())
  or private.has_permission(id, 'property')
);

create or replace function public.create_property_for_current_user(
  p_name text,
  p_location text,
  p_total_area numeric,
  p_owner_name text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_property_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'PROPERTY_NAME_REQUIRED';
  end if;

  if p_owner_name is null or btrim(p_owner_name) = '' then
    raise exception 'OWNER_NAME_REQUIRED';
  end if;

  if p_total_area is null or p_total_area < 0 then
    raise exception 'INVALID_TOTAL_AREA';
  end if;

  if exists (
    select 1
    from public.property_members pm
    where pm.user_id = v_user_id
      and pm.status = 'Ativo'
  ) then
    raise exception 'ACTIVE_PROPERTY_MEMBERSHIP_ALREADY_EXISTS';
  end if;

  insert into public.properties (
    name, location, total_area, owner_name, created_by
  )
  values (
    btrim(p_name),
    coalesce(btrim(p_location), ''),
    p_total_area,
    btrim(p_owner_name),
    v_user_id
  )
  returning id into v_property_id;

  insert into public.property_members (
    property_id, user_id, role, permissions, status
  )
  values (
    v_property_id, v_user_id, 'admin', '{}'::text[], 'Ativo'
  );

  return v_property_id;
end;
$$;

revoke all on function public.create_property_for_current_user(text,text,numeric,text) from public;
revoke all on function public.create_property_for_current_user(text,text,numeric,text) from anon;
grant execute on function public.create_property_for_current_user(text,text,numeric,text) to authenticated;
