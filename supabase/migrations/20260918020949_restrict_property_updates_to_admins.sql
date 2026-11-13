drop policy if exists properties_update on public.properties;

create policy properties_update on public.properties
for update to authenticated
using (private.is_property_admin(id))
with check (private.is_property_admin(id));
