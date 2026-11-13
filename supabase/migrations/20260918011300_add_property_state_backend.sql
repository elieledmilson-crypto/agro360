create or replace function private.expected_property_state_module(p_state_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_state_key
    when 'agro360_animals' then 'animals'
    when 'agro360_animal_events' then 'animals'
    when 'agro360_animals_initialized' then 'animals'
    when 'agro360_lots' then 'animals'

    when 'agro360_vaccinations' then 'health'
    when 'agro360_treatments' then 'health'
    when 'agro360_health_occurrences' then 'health'
    when 'agro360_health_initialized' then 'health'

    when 'agro360_land_areas' then 'land'
    when 'agro360_land_areas_initialized' then 'land'
    when 'agro360_paddock_occupations' then 'land'
    when 'agro360_paddock_occupations_initialized' then 'land'
    when 'agro360_rural_structures' then 'land'
    when 'agro360_rural_structures_initialized' then 'land'
    when 'agro360_land_use_records' then 'land'
    when 'agro360_land_use_records_initialized' then 'land'

    when 'agro360_crop_cycles' then 'crops'
    when 'agro360_crop_cycles_initialized' then 'crops'
    when 'agro360_crop_managements' then 'crops'
    when 'agro360_crop_managements_initialized' then 'crops'
    when 'agro360_harvest_records' then 'crops'
    when 'agro360_harvest_records_initialized' then 'crops'
    when 'agro360_soil_analyses' then 'crops'
    when 'agro360_soil_analyses_initialized' then 'crops'

    when 'agro360_machines' then 'machines'
    when 'agro360_machines_initialized' then 'machines'
    when 'agro360_machine_maintenance_records' then 'machines'
    when 'agro360_machine_maintenance_records_initialized' then 'machines'
    when 'agro360_machine_usage_records' then 'machines'
    when 'agro360_machine_usage_records_initialized' then 'machines'

    when 'agro360_inventory_items' then 'inventory'
    when 'agro360_inventory_items_initialized' then 'inventory'
    when 'agro360_inventory_movements' then 'inventory'
    when 'agro360_inventory_movements_initialized' then 'inventory'

    when 'agro360_financial_categories' then 'finance'
    when 'agro360_financial_categories_initialized' then 'finance'
    when 'agro360_financial_transactions' then 'finance'
    when 'agro360_financial_transactions_initialized' then 'finance'

    when 'agro360_agenda_activities' then 'agenda'
    when 'agro360_agenda_activities_initialized' then 'agenda'

    when 'agro360:propertyMap:location' then 'map'
    when 'agro360:propertyMap:layouts' then 'map'
    when 'agro360:propertyMap:geoBoundary:property' then 'map'
    when 'agro360:propertyMap:geoBoundary:landareas' then 'map'

    when 'agro360_employees' then 'admin'
    when 'agro360_employees_initialized' then 'admin'
    when 'agro360_access_accounts' then 'admin'
    when 'agro360_access_accounts_initialized' then 'admin'
    else null
  end;
$$;

revoke all on function private.expected_property_state_module(text) from public;
grant execute on function private.expected_property_state_module(text) to authenticated;

create table public.property_state (
  property_id uuid not null references public.properties(id) on delete cascade,
  state_key text not null,
  module_key text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (property_id, state_key),
  check (
    private.expected_property_state_module(state_key) is not null
    and module_key = private.expected_property_state_module(state_key)
  )
);

create index property_state_module_idx
  on public.property_state(property_id, module_key);

create trigger property_state_set_updated_at
before update on public.property_state
for each row execute function private.set_updated_at();

alter table public.property_state enable row level security;

create policy property_state_select on public.property_state
for select to authenticated
using (
  case
    when module_key = 'admin'
      then private.is_property_admin(property_id)
    else private.has_permission(property_id, module_key)
  end
);

create policy property_state_insert on public.property_state
for insert to authenticated
with check (
  case
    when module_key = 'admin'
      then private.is_property_admin(property_id)
    else private.has_permission(property_id, module_key)
  end
);

create policy property_state_update on public.property_state
for update to authenticated
using (
  case
    when module_key = 'admin'
      then private.is_property_admin(property_id)
    else private.has_permission(property_id, module_key)
  end
)
with check (
  case
    when module_key = 'admin'
      then private.is_property_admin(property_id)
    else private.has_permission(property_id, module_key)
  end
);

create policy property_state_delete on public.property_state
for delete to authenticated
using (
  case
    when module_key = 'admin'
      then private.is_property_admin(property_id)
    else private.has_permission(property_id, module_key)
  end
);

revoke all on public.property_state from anon;
grant select, insert, update, delete on public.property_state to authenticated;
