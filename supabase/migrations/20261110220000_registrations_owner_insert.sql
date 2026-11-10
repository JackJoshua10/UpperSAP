-- El organizador puede registrar asistentes manualmente con cualquier estado en sus propios eventos.
-- (La política pública sigue limitando al público a inscripciones "pendiente".)
create policy "registrations_owner_insert" on public.registrations
  for insert to authenticated
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
