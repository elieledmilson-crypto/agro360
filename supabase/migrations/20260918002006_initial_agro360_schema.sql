create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  location text not null default '',
  total_area numeric(14,4) not null default 0 check (total_area >= 0),
  owner_name text not null check (btrim(owner_name) <> ''),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  job_function text not null check (btrim(job_function) <> ''),
  phone text,
  email text,
  status text not null default 'Ativo' check (status in ('Ativo','Inativo')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id)
);

create table public.property_members (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid,
  role text not null default 'user' check (role in ('admin','user')),
  permissions text[] not null default '{}'::text[],
  status text not null default 'Ativo' check (status in ('Ativo','Inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, user_id),
  unique(property_id, employee_id),
  foreign key (property_id, employee_id)
    references public.employees(property_id, id) on delete set null,
  check (
    permissions <@ array[
      'animals','health','land','crops','machines','inventory',
      'finance','property','agenda','reports','map','intelligence'
    ]::text[]
  )
);

create or replace function private.is_property_member(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.property_members pm
    where pm.property_id = p_property_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'Ativo'
  );
$$;

create or replace function private.is_property_admin(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.property_members pm
    where pm.property_id = p_property_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'Ativo'
      and pm.role = 'admin'
  );
$$;

create or replace function private.has_permission(p_property_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.property_members pm
    where pm.property_id = p_property_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'Ativo'
      and (
        pm.role = 'admin'
        or p_permission = any(pm.permissions)
      )
  );
$$;

revoke all on function private.is_property_member(uuid) from public;
revoke all on function private.is_property_admin(uuid) from public;
revoke all on function private.has_permission(uuid,text) from public;
grant execute on function private.is_property_member(uuid) to authenticated;
grant execute on function private.is_property_admin(uuid) to authenticated;
grant execute on function private.has_permission(uuid,text) to authenticated;

create table public.land_areas (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  type text not null check (type in ('Piquete','Talhão','Pastagem','Reserva/APP','Infraestrutura','Área ociosa','Outro')),
  area_hectares numeric(14,4) not null check (area_hectares > 0),
  purpose text,
  status text not null check (status in ('Em uso','Em descanso','Em recuperação','Inativa')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  unique(property_id, code)
);

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id)
);

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  identification text not null check (btrim(identification) <> ''),
  name text,
  species text not null check (species in ('Bovino','Bubalino','Ovino','Caprino','Equino','Suíno','Outro')),
  breed text not null check (btrim(breed) <> ''),
  sex text not null check (sex in ('Macho','Fêmea')),
  birth_date date,
  category text not null check (category in ('Bezerro','Bezerra','Novilho','Novilha','Vaca','Touro','Boi','Matriz','Reprodutor','Outro')),
  status text not null check (status in ('Ativo','Vendido','Morto','Descartado','Transferido')),
  lot_id uuid,
  land_area_id uuid,
  current_weight numeric(14,3) check (current_weight is null or current_weight > 0),
  origin text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  unique(property_id, identification),
  foreign key (property_id, lot_id)
    references public.lots(property_id, id) on delete set null,
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete set null
);

create table public.animal_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  animal_id uuid not null,
  type text not null check (type in ('created','updated','lot_change','status_change','land_change')),
  description text not null,
  date timestamptz not null default now(),
  foreign key (property_id, animal_id)
    references public.animals(property_id, id) on delete cascade
);

create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  animal_id uuid not null,
  vaccine_name text not null check (btrim(vaccine_name) <> ''),
  application_date date not null,
  next_dose_date date,
  dose text,
  batch text,
  responsible text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  foreign key (property_id, animal_id)
    references public.animals(property_id, id) on delete cascade
);

create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  animal_id uuid not null,
  reason text not null check (btrim(reason) <> ''),
  medication text,
  dosage text,
  start_date date not null,
  end_date date,
  responsible text,
  notes text,
  status text not null check (status in ('Em andamento','Concluído','Interrompido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  foreign key (property_id, animal_id)
    references public.animals(property_id, id) on delete cascade
);

create table public.health_occurrences (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  animal_id uuid not null,
  date date not null,
  type text not null check (type in ('Doença','Sintoma','Ferimento','Exame','Observação clínica','Outro')),
  title text not null check (btrim(title) <> ''),
  description text,
  severity text not null check (severity in ('Baixa','Média','Alta')),
  status text not null check (status in ('Aberta','Resolvida')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  foreign key (property_id, animal_id)
    references public.animals(property_id, id) on delete cascade
);

create table public.paddock_occupations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  land_area_id uuid not null,
  lot_id uuid not null,
  entry_date date not null,
  exit_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete restrict,
  foreign key (property_id, lot_id)
    references public.lots(property_id, id) on delete restrict
);

create table public.rural_structures (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  type text not null check (type in ('Cerca','Corredor','Porteira')),
  status text not null check (status in ('Em uso','Em manutenção','Inativa')),
  condition text not null check (condition in ('Boa','Regular','Ruim')),
  length_meters numeric(14,3) check (length_meters is null or length_meters >= 0),
  width_meters numeric(14,3) check (width_meters is null or width_meters >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  unique(property_id, code)
);

create table public.rural_structure_land_areas (
  property_id uuid not null references public.properties(id) on delete cascade,
  rural_structure_id uuid not null,
  land_area_id uuid not null,
  primary key (rural_structure_id, land_area_id),
  foreign key (property_id, rural_structure_id)
    references public.rural_structures(property_id, id) on delete cascade,
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete cascade
);

create table public.land_use_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  land_area_id uuid not null,
  type text not null check (type in ('Uso produtivo','Descanso','Recuperação','Preservação','Manutenção','Outro')),
  start_date date not null,
  end_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete restrict
);

create table public.crop_cycles (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  land_area_id uuid not null,
  crop text not null check (btrim(crop) <> ''),
  cultivar text,
  season text not null check (btrim(season) <> ''),
  status text not null check (status in ('Planejado','Em andamento','Concluído','Cancelado')),
  planting_date date,
  expected_harvest_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete restrict
);

create table public.soil_analyses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  land_area_id uuid not null,
  sample_date date not null,
  laboratory text,
  sample_code text,
  sample_depth text,
  ph numeric,
  organic_matter numeric,
  phosphorus numeric,
  potassium numeric,
  calcium numeric,
  magnesium numeric,
  aluminum numeric,
  cec numeric,
  base_saturation numeric,
  aluminum_saturation numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete restrict
);

create table public.crop_managements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  crop_cycle_id uuid not null,
  date date not null,
  type text not null check (type in ('Adubação','Irrigação','Pulverização','Capina','Controle de plantas daninhas','Controle de pragas','Controle de doenças','Manejo cultural','Outro')),
  description text not null check (btrim(description) <> ''),
  product_or_material text,
  dose_or_quantity text,
  responsible text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  foreign key (property_id, crop_cycle_id)
    references public.crop_cycles(property_id, id) on delete restrict
);

create table public.harvest_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  crop_cycle_id uuid not null,
  harvest_date date not null,
  harvested_area_hectares numeric(14,4) not null check (harvested_area_hectares > 0),
  production_quantity numeric(16,4) not null check (production_quantity >= 0),
  production_unit text not null check (production_unit in ('kg','t','sc')),
  sack_weight_kg numeric(14,3) check (sack_weight_kg is null or sack_weight_kg > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (property_id, crop_cycle_id)
    references public.crop_cycles(property_id, id) on delete restrict
);

create table public.machines (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  category text not null check (category in ('Trator','Colheitadeira','Pulverizador','Plantadeira','Semeadora','Grade','Arado','Roçadeira','Distribuidor','Implemento','Veículo','Outro')),
  brand text,
  model text,
  year integer check (year is null or year between 1900 and 2200),
  identification text,
  hour_meter numeric(14,2) check (hour_meter is null or hour_meter >= 0),
  status text not null check (status in ('Operacional','Em manutenção','Inativa')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  unique(property_id, code)
);

create table public.machine_maintenance_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  machine_id uuid not null,
  maintenance_date date not null,
  type text not null check (type in ('Preventiva','Corretiva','Inspeção','Lubrificação','Troca de óleo','Troca de filtros','Reparo','Outro')),
  hour_meter numeric(14,2) check (hour_meter is null or hour_meter >= 0),
  service_performed text not null check (btrim(service_performed) <> ''),
  responsible text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  foreign key (property_id, machine_id)
    references public.machines(property_id, id) on delete restrict
);

create table public.machine_usage_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  machine_id uuid not null,
  land_area_id uuid not null,
  crop_cycle_id uuid,
  operation_date date not null,
  operation_type text not null check (operation_type in ('Preparo do solo','Plantio','Semeadura','Adubação','Pulverização','Colheita','Roçada','Irrigação','Transporte','Outro')),
  worked_hours numeric(14,2) not null check (worked_hours > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (property_id, machine_id)
    references public.machines(property_id, id) on delete restrict,
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete restrict,
  foreign key (property_id, crop_cycle_id)
    references public.crop_cycles(property_id, id) on delete restrict
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  category text not null check (category in ('Ração','Medicamento veterinário','Vacina','Semente','Fertilizante','Defensivo agrícola','Combustível','Lubrificante','Peça','Material','Outro')),
  unit text not null check (unit in ('kg','g','L','mL','un','sc','t','m','Outro')),
  current_quantity numeric(16,4) not null default 0 check (current_quantity >= 0),
  minimum_quantity numeric(16,4) check (minimum_quantity is null or minimum_quantity >= 0),
  location text,
  description text,
  status text not null check (status in ('Ativo','Inativo')),
  batch_number text,
  expiration_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  unique(property_id, code)
);

create table public.integration_operations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  source_module text not null check (source_module in ('health','crops','machines','inventory')),
  source_type text not null check (source_type in ('vaccination','treatment','crop-management','machine-maintenance','inventory-entry')),
  source_record_id uuid not null,
  target_module text not null check (target_module in ('inventory','finance')),
  created_at timestamptz not null default now(),
  unique(property_id, id),
  unique(property_id, source_module, source_type, source_record_id, target_module),
  check (
    (source_module = 'health' and source_type in ('vaccination','treatment') and target_module in ('inventory','finance'))
    or (source_module = 'crops' and source_type = 'crop-management' and target_module in ('inventory','finance'))
    or (source_module = 'machines' and source_type = 'machine-maintenance' and target_module in ('inventory','finance'))
    or (source_module = 'inventory' and source_type = 'inventory-entry' and target_module = 'finance')
  )
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  inventory_item_id uuid not null,
  integration_operation_id uuid,
  type text not null check (type in ('Entrada','Saída')),
  movement_date date not null,
  quantity numeric(16,4) not null check (quantity > 0),
  balance_before numeric(16,4) not null check (balance_before >= 0),
  balance_after numeric(16,4) not null check (balance_after >= 0),
  reason text not null check (btrim(reason) <> ''),
  responsible text,
  notes text,
  item_code_snapshot text,
  item_name_snapshot text,
  unit_snapshot text check (unit_snapshot is null or unit_snapshot in ('kg','g','L','mL','un','sc','t','m','Outro')),
  created_at timestamptz not null default now(),
  unique(property_id, id),
  foreign key (property_id, inventory_item_id)
    references public.inventory_items(property_id, id) on delete restrict,
  foreign key (property_id, integration_operation_id)
    references public.integration_operations(property_id, id) on delete restrict
);

create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  type text not null check (type in ('Receita','Despesa')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  unique(property_id, name, type)
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  type text not null check (type in ('Receita','Despesa')),
  date date not null,
  category_id uuid not null,
  description text not null check (btrim(description) <> ''),
  amount numeric(16,2) not null check (amount > 0),
  notes text,
  integration_operation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, id),
  foreign key (property_id, category_id)
    references public.financial_categories(property_id, id) on delete restrict,
  foreign key (property_id, integration_operation_id)
    references public.integration_operations(property_id, id) on delete restrict
);

create unique index financial_transactions_one_per_integration
  on public.financial_transactions(integration_operation_id)
  where integration_operation_id is not null;

create table public.agenda_activities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  type text not null check (type in ('Tarefa','Vacinação','Tratamento','Plantio','Colheita','Manutenção','Irrigação','Pagamento','Reposição de estoque','Outro')),
  date date not null,
  time time,
  priority text not null check (priority in ('Baixa','Média','Alta')),
  status text not null check (status in ('Pendente','Concluída','Cancelada')),
  responsible_employee_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (property_id, responsible_employee_id)
    references public.employees(property_id, id) on delete set null
);

create table public.property_map_locations (
  property_id uuid primary key references public.properties(id) on delete cascade,
  latitude numeric(9,6) not null check (latitude between -90 and 90),
  longitude numeric(9,6) not null check (longitude between -180 and 180),
  updated_at timestamptz not null default now()
);

create table public.land_area_map_layouts (
  property_id uuid not null references public.properties(id) on delete cascade,
  land_area_id uuid not null,
  x numeric not null,
  y numeric not null,
  width numeric not null check (width > 0),
  height numeric not null check (height > 0),
  shape_type text check (shape_type is null or shape_type in ('rectangle','triangle','trapezoid','l-shape','free')),
  points jsonb,
  updated_at timestamptz not null default now(),
  primary key (property_id, land_area_id),
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete cascade,
  check (points is null or jsonb_typeof(points) = 'array')
);

create table public.property_geographic_boundaries (
  property_id uuid primary key references public.properties(id) on delete cascade,
  points jsonb not null check (jsonb_typeof(points) = 'array'),
  updated_at timestamptz not null default now()
);

create table public.land_area_geographic_boundaries (
  property_id uuid not null references public.properties(id) on delete cascade,
  land_area_id uuid not null,
  points jsonb not null check (jsonb_typeof(points) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (property_id, land_area_id),
  foreign key (property_id, land_area_id)
    references public.land_areas(property_id, id) on delete cascade
);

create index property_members_user_idx on public.property_members(user_id, status);
create index employees_property_idx on public.employees(property_id);
create index animals_property_idx on public.animals(property_id);
create index animals_lot_idx on public.animals(property_id, lot_id);
create index animals_land_area_idx on public.animals(property_id, land_area_id);
create index animal_events_animal_idx on public.animal_events(property_id, animal_id, date desc);
create index vaccinations_animal_idx on public.vaccinations(property_id, animal_id, application_date desc);
create index treatments_animal_idx on public.treatments(property_id, animal_id, start_date desc);
create index health_occurrences_animal_idx on public.health_occurrences(property_id, animal_id, date desc);
create index paddock_occupations_land_idx on public.paddock_occupations(property_id, land_area_id, entry_date desc);
create index paddock_occupations_lot_idx on public.paddock_occupations(property_id, lot_id, entry_date desc);
create index crop_cycles_land_idx on public.crop_cycles(property_id, land_area_id);
create index crop_managements_cycle_idx on public.crop_managements(property_id, crop_cycle_id, date desc);
create index harvest_records_cycle_idx on public.harvest_records(property_id, crop_cycle_id, harvest_date desc);
create index machine_maintenance_machine_idx on public.machine_maintenance_records(property_id, machine_id, maintenance_date desc);
create index machine_usage_machine_idx on public.machine_usage_records(property_id, machine_id, operation_date desc);
create index machine_usage_land_idx on public.machine_usage_records(property_id, land_area_id, operation_date desc);
create index inventory_movements_item_idx on public.inventory_movements(property_id, inventory_item_id, movement_date desc);
create index inventory_movements_integration_idx on public.inventory_movements(integration_operation_id);
create index financial_transactions_date_idx on public.financial_transactions(property_id, date desc);
create index financial_transactions_category_idx on public.financial_transactions(property_id, category_id);
create index agenda_activities_date_idx on public.agenda_activities(property_id, date);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.employees enable row level security;
alter table public.property_members enable row level security;
alter table public.land_areas enable row level security;
alter table public.lots enable row level security;
alter table public.animals enable row level security;
alter table public.animal_events enable row level security;
alter table public.vaccinations enable row level security;
alter table public.treatments enable row level security;
alter table public.health_occurrences enable row level security;
alter table public.paddock_occupations enable row level security;
alter table public.rural_structures enable row level security;
alter table public.rural_structure_land_areas enable row level security;
alter table public.land_use_records enable row level security;
alter table public.crop_cycles enable row level security;
alter table public.soil_analyses enable row level security;
alter table public.crop_managements enable row level security;
alter table public.harvest_records enable row level security;
alter table public.machines enable row level security;
alter table public.machine_maintenance_records enable row level security;
alter table public.machine_usage_records enable row level security;
alter table public.inventory_items enable row level security;
alter table public.integration_operations enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.financial_categories enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.agenda_activities enable row level security;
alter table public.property_map_locations enable row level security;
alter table public.land_area_map_layouts enable row level security;
alter table public.property_geographic_boundaries enable row level security;
alter table public.land_area_geographic_boundaries enable row level security;

create policy profiles_select_self on public.profiles
for select to authenticated
using (id = (select auth.uid()));

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy property_members_select on public.property_members
for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_property_admin(property_id)
);

create policy property_members_insert_admin on public.property_members
for insert to authenticated
with check (private.is_property_admin(property_id));

create policy property_members_update_admin on public.property_members
for update to authenticated
using (private.is_property_admin(property_id))
with check (private.is_property_admin(property_id));

create policy property_members_delete_admin on public.property_members
for delete to authenticated
using (private.is_property_admin(property_id));

create policy properties_select on public.properties
for select to authenticated
using (private.has_permission(id, 'property'));

create policy properties_update on public.properties
for update to authenticated
using (private.has_permission(id, 'property'))
with check (private.has_permission(id, 'property'));

create policy properties_delete_admin on public.properties
for delete to authenticated
using (private.is_property_admin(id));

create policy employees_select_admin on public.employees
for select to authenticated
using (private.is_property_admin(property_id));

create policy employees_insert_admin on public.employees
for insert to authenticated
with check (private.is_property_admin(property_id));

create policy employees_update_admin on public.employees
for update to authenticated
using (private.is_property_admin(property_id))
with check (private.is_property_admin(property_id));

create policy employees_delete_admin on public.employees
for delete to authenticated
using (private.is_property_admin(property_id));

create or replace function private.install_permission_policies(
  p_table regclass,
  p_permission text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table_name text := p_table::text;
  v_base_name text := replace(v_table_name, '.', '_');
begin
  execute format(
    'create policy %I on %s for select to authenticated using (private.has_permission(property_id, %L))',
    v_base_name || '_select',
    p_table,
    p_permission
  );
  execute format(
    'create policy %I on %s for insert to authenticated with check (private.has_permission(property_id, %L))',
    v_base_name || '_insert',
    p_table,
    p_permission
  );
  execute format(
    'create policy %I on %s for update to authenticated using (private.has_permission(property_id, %L)) with check (private.has_permission(property_id, %L))',
    v_base_name || '_update',
    p_table,
    p_permission,
    p_permission
  );
  execute format(
    'create policy %I on %s for delete to authenticated using (private.has_permission(property_id, %L))',
    v_base_name || '_delete',
    p_table,
    p_permission
  );
end;
$$;

select private.install_permission_policies('public.land_areas', 'land');
select private.install_permission_policies('public.paddock_occupations', 'land');
select private.install_permission_policies('public.rural_structures', 'land');
select private.install_permission_policies('public.rural_structure_land_areas', 'land');
select private.install_permission_policies('public.land_use_records', 'land');

select private.install_permission_policies('public.lots', 'animals');
select private.install_permission_policies('public.animals', 'animals');
select private.install_permission_policies('public.animal_events', 'animals');

select private.install_permission_policies('public.vaccinations', 'health');
select private.install_permission_policies('public.treatments', 'health');
select private.install_permission_policies('public.health_occurrences', 'health');

select private.install_permission_policies('public.crop_cycles', 'crops');
select private.install_permission_policies('public.soil_analyses', 'crops');
select private.install_permission_policies('public.crop_managements', 'crops');
select private.install_permission_policies('public.harvest_records', 'crops');

select private.install_permission_policies('public.machines', 'machines');
select private.install_permission_policies('public.machine_maintenance_records', 'machines');
select private.install_permission_policies('public.machine_usage_records', 'machines');

select private.install_permission_policies('public.inventory_items', 'inventory');
select private.install_permission_policies('public.inventory_movements', 'inventory');

select private.install_permission_policies('public.financial_categories', 'finance');
select private.install_permission_policies('public.financial_transactions', 'finance');

select private.install_permission_policies('public.agenda_activities', 'agenda');

select private.install_permission_policies('public.property_map_locations', 'map');
select private.install_permission_policies('public.land_area_map_layouts', 'map');
select private.install_permission_policies('public.property_geographic_boundaries', 'map');
select private.install_permission_policies('public.land_area_geographic_boundaries', 'map');

drop function private.install_permission_policies(regclass,text);

create policy integration_operations_select on public.integration_operations
for select to authenticated
using (
  private.has_permission(property_id, target_module)
  and private.has_permission(property_id, source_module)
);

create or replace function public.create_property_for_current_user(
  p_name text,
  p_location text,
  p_total_area numeric,
  p_owner_name text
)
returns uuid
language plpgsql
security definer
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
grant execute on function public.create_property_for_current_user(text,text,numeric,text) to authenticated;

create or replace function public.handle_new_user_profile()
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

revoke all on function public.handle_new_user_profile() from public;

create trigger on_auth_user_created_agro360
after insert on auth.users
for each row execute function public.handle_new_user_profile();

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','properties','employees','property_members','land_areas','lots','animals',
    'vaccinations','treatments','health_occurrences','paddock_occupations','rural_structures',
    'land_use_records','crop_cycles','soil_analyses','crop_managements','harvest_records',
    'machines','machine_maintenance_records','machine_usage_records','inventory_items',
    'financial_categories','financial_transactions','agenda_activities'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      t || '_set_updated_at',
      t
    );
  end loop;
end $$;

revoke all on all tables in schema public from anon;

grant select, update on public.profiles to authenticated;
grant select, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.property_members to authenticated;

grant select, insert, update, delete on
  public.land_areas,
  public.lots,
  public.animals,
  public.animal_events,
  public.vaccinations,
  public.treatments,
  public.health_occurrences,
  public.paddock_occupations,
  public.rural_structures,
  public.rural_structure_land_areas,
  public.land_use_records,
  public.crop_cycles,
  public.soil_analyses,
  public.crop_managements,
  public.harvest_records,
  public.machines,
  public.machine_maintenance_records,
  public.machine_usage_records,
  public.inventory_items,
  public.inventory_movements,
  public.financial_categories,
  public.financial_transactions,
  public.agenda_activities,
  public.property_map_locations,
  public.land_area_map_layouts,
  public.property_geographic_boundaries,
  public.land_area_geographic_boundaries
to authenticated;

grant select on public.integration_operations to authenticated;
