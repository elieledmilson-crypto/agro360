drop policy if exists properties_select on public.properties;

create policy properties_select on public.properties
for select to authenticated
using (
  private.has_permission(id, 'property')
  or private.can_bootstrap_property(id, (select auth.uid()))
);
