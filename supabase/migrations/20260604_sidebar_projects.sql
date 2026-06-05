-- =====================================================================
-- ALAS · Tabla sidebar_projects
-- Proyectos compartidos visibles para todos; escritura solo para admin.
-- Ejecutar en: Supabase Studio → SQL Editor
-- =====================================================================

create table if not exists public.sidebar_projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  status     text not null default 'trabajando',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sidebar_projects enable row level security;

-- Todos los usuarios autenticados pueden leer
create policy "sidebar_projects_select"
  on public.sidebar_projects for select
  to authenticated
  using (true);

-- Solo admin puede insertar
create policy "sidebar_projects_insert"
  on public.sidebar_projects for insert
  to authenticated
  with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Solo admin puede actualizar
create policy "sidebar_projects_update"
  on public.sidebar_projects for update
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Solo admin puede eliminar
create policy "sidebar_projects_delete"
  on public.sidebar_projects for delete
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Índice para ordenamiento rápido
create index if not exists sidebar_projects_position_idx
  on public.sidebar_projects (position asc);
