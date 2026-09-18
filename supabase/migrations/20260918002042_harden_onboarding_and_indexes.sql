create or replace function private.can_bootstrap_property(
  p_property_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.created_by = p_user_id
      and not exists (
        select 1
        from public.property_members pm
        where pm.property_id = p_property_id
      )
  );
$$;

revoke all on function private.can_bootstrap_property(uuid,uuid) from public;
revoke all on function private.can_bootstrap_property(uuid,uuid) from anon;
grant execute on function private.can_bootstrap_property(uuid,uuid) to authenticated;

drop policy if exists property_members_insert_admin on public.property_members;

create policy property_members_insert_admin_or_bootstrap on public.property_members
for insert to authenticated
with check (
  private.is_property_admin(property_id)
  or (
    user_id = (select auth.uid())
    and role = 'admin'
    and status = 'Ativo'
    and private.can_bootstrap_property(property_id, (select auth.uid()))
  )
);

create policy properties_insert_owner on public.properties
for insert to authenticated
with check (created_by = (select auth.uid()));

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

drop trigger if exists on_auth_user_created_agro360 on auth.users;
drop function if exists public.handle_new_user_profile();

create or replace function private.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(new.email, 'usuario'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user_profile() from public;
revoke all on function private.handle_new_user_profile() from anon;
revoke all on function private.handle_new_user_profile() from authenticated;

create trigger on_auth_user_created_agro360
after insert on auth.users
for each row execute function private.handle_new_user_profile();

create index if not exists agenda_activities_responsible_idx
  on public.agenda_activities(property_id, responsible_employee_id);

create index if not exists financial_transactions_integration_property_idx
  on public.financial_transactions(property_id, integration_operation_id);

create index if not exists inventory_movements_integration_property_idx
  on public.inventory_movements(property_id, integration_operation_id);

create index if not exists land_use_records_land_idx
  on public.land_use_records(property_id, land_area_id);

create index if not exists machine_usage_crop_cycle_idx
  on public.machine_usage_records(property_id, crop_cycle_id);

create index if not exists properties_created_by_idx
  on public.properties(created_by);

create index if not exists rural_structure_land_areas_land_idx
  on public.rural_structure_land_areas(property_id, land_area_id);

create index if not exists rural_structure_land_areas_structure_idx
  on public.rural_structure_land_areas(property_id, rural_structure_id);

create index if not exists soil_analyses_land_idx
  on public.soil_analyses(property_id, land_area_id);
