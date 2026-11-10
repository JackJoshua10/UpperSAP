-- EventoPro: eventos (por organizador) e inscripciones de asistentes
-- Aplicada en Supabase (proyecto "eventopro", region sa-east-1).

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  description text,
  venue text,
  starts_at date,
  capacity int check (capacity is null or capacity > 0),
  created_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company text,
  job_title text,
  phone text,
  ticket_type text not null default 'general' check (ticket_type in ('general','vip','estudiante')),
  status text not null default 'pendiente' check (status in ('pendiente','confirmado','asistio','cancelado')),
  notes text,
  ai_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);

create index registrations_event_id_idx on public.registrations(event_id);
create index events_owner_id_idx on public.events(owner_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger registrations_set_updated_at
before update on public.registrations
for each row execute function public.set_updated_at();

alter table public.events enable row level security;
alter table public.registrations enable row level security;

-- Eventos: cualquiera puede ver un evento (página pública de inscripción);
-- solo el organizador lo crea, edita o elimina.
create policy "events_public_read" on public.events
  for select to anon, authenticated using (true);
create policy "events_owner_insert" on public.events
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "events_owner_update" on public.events
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "events_owner_delete" on public.events
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Inscripciones: el público solo puede crear inscripciones pendientes;
-- solo el organizador del evento puede verlas, editarlas o eliminarlas.
create policy "registrations_public_insert" on public.registrations
  for insert to anon, authenticated
  with check (status = 'pendiente' and ai_message is null
              and exists (select 1 from public.events e where e.id = event_id));
create policy "registrations_owner_select" on public.registrations
  for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "registrations_owner_update" on public.registrations
  for update to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy "registrations_owner_delete" on public.registrations
  for delete to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
