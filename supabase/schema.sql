-- =====================================================================
-- ALAS · Launcher logístico — Esquema, RLS y funciones (Supabase / Postgres)
-- Ejecutar en: Supabase Studio → SQL Editor (todo de una vez).
-- Idempotente en la medida de lo posible. Datos DEMO incluidos al final.
-- =====================================================================

-- ---------- TIPOS ----------
do $$ begin
  create type user_role as enum ('admin','supervisor','operador','invitado');
exception when duplicate_object then null; end $$;

-- Garantiza que 'admin' existe aunque el enum haya sido creado con nombre antiguo ('administración').
alter type user_role add value if not exists 'admin';

-- ---------- TABLAS ----------

-- Perfil 1:1 con auth.users. Guarda rol y estado de la cuenta.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text,                      -- nombre de usuario para login (sin email)
  full_name   text,
  role        user_role not null default 'invitado',
  is_active   boolean not null default true,
  is_blocked  boolean not null default false,
  last_login  timestamptz,
  created_at  timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;

-- Catálogo de módulos (programas publicados en Vercel).
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,         -- clave estable usada por el frontend
  name        text not null,
  url         text not null,                -- enlace de Vercel
  is_active   boolean not null default true,
  is_blocked  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Permisos: qué usuario puede entrar a qué módulo.
create table if not exists public.permissions (
  user_id    uuid references public.profiles(id) on delete cascade,
  module_id  uuid references public.modules(id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

-- Logs de actividad / accesos.
create table if not exists public.access_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles(id) on delete set null,
  module_id  uuid references public.modules(id) on delete set null,
  action     text not null,                 -- 'login' | 'open_module' | 'denied'
  ip         text,
  created_at timestamptz not null default now()
);

-- ---------- HELPERS ----------

-- Comprueba si el usuario actual es admin. SECURITY DEFINER + search_path fijo
-- para evitar recursión en las políticas RLS de profiles.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
      and is_active and not is_blocked
  );
$$;

-- ---------- HABILITAR RLS ----------
alter table public.profiles    enable row level security;
alter table public.modules     enable row level security;
alter table public.permissions enable row level security;
alter table public.access_logs enable row level security;

-- ---------- POLÍTICAS RLS ----------

-- PROFILES: cada quien ve su perfil; el admin ve/gestiona todo.
drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_public_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- MODULES: solo admin lee/escribe la tabla completa porque contiene URLs.
-- El launcher usa get_module_catalog(), que no devuelve URLs.
drop policy if exists modules_read on public.modules;

drop policy if exists modules_admin_write on public.modules;
create policy modules_admin_write on public.modules
  for all using (public.is_admin()) with check (public.is_admin());

-- PERMISSIONS: el usuario ve los suyos; el admin gestiona todos.
drop policy if exists perms_self_select on public.permissions;
create policy perms_self_select on public.permissions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists perms_admin_write on public.permissions;
create policy perms_admin_write on public.permissions
  for all using (public.is_admin()) with check (public.is_admin());

-- ACCESS_LOGS: el usuario ve los suyos; el admin ve todos. Inserción vía RPC.
drop policy if exists logs_self_select on public.access_logs;
create policy logs_self_select on public.access_logs
  for select using (user_id = auth.uid() or public.is_admin());

-- =====================================================================
-- FUNCIONES RPC (seguridad real del lado servidor)
-- =====================================================================

-- Registra el último login del usuario actual.
create or replace function public.register_login()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles set last_login = now() where id = auth.uid();
  insert into public.access_logs(user_id, action) values (auth.uid(), 'login');
end;
$$;

-- Registra el logout del usuario actual.
-- Debe llamarse ANTES de cerrar la sesión (auth.uid() aún disponible).
create or replace function public.register_logout()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.access_logs(user_id, action) values (auth.uid(), 'logout');
end;
$$;

create or replace function public.normalize_username(p_username text)
returns text
language plpgsql immutable
as $$
declare
  v_username text;
begin
  v_username := lower(trim(coalesce(p_username, '')));
  if v_username = '' then
    raise exception 'usuario requerido';
  end if;
  if v_username !~ '^[a-z0-9._-]{3,32}$' then
    raise exception 'usuario invalido: usa 3 a 32 caracteres con letras, numeros, punto, guion o guion bajo';
  end if;
  return v_username;
end;
$$;

-- Devuelve SOLO los módulos que el usuario puede ver.
-- NOTA: no devuelve la URL aquí (la URL se entrega únicamente al abrir).
create or replace function public.get_allowed_modules()
returns table (key text, name text, is_active boolean, is_blocked boolean, sort_order int)
language sql stable security definer set search_path = public
as $$
  select m.key, m.name, m.is_active, m.is_blocked, m.sort_order
  from public.modules m
  join public.permissions p on p.module_id = m.id
  where p.user_id = auth.uid()
  order by m.sort_order;
$$;

-- Catálogo visible para el launcher: metadata sin URL.
create or replace function public.get_module_catalog()
returns table (id uuid, key text, name text, is_active boolean, is_blocked boolean, sort_order int)
language sql stable security definer set search_path = public
as $$
  select m.id, m.key, m.name, m.is_active, m.is_blocked, m.sort_order
  from public.modules m
  where auth.uid() is not null
  order by m.sort_order;
$$;

-- Abre un módulo: reverifica permiso + estado de cuenta y módulo,
-- registra el acceso y devuelve la URL solo si todo es válido.
create or replace function public.open_module(p_module_key text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_mod  public.modules%rowtype;
  v_prof public.profiles%rowtype;
  v_ok   boolean;
begin
  select * into v_prof from public.profiles where id = auth.uid();
  if not found or not v_prof.is_active or v_prof.is_blocked then
    insert into public.access_logs(user_id, action) values (auth.uid(), 'denied');
    return json_build_object('url', null, 'reason', 'cuenta no disponible');
  end if;

  select * into v_mod from public.modules where key = p_module_key;
  if not found or not v_mod.is_active or v_mod.is_blocked then
    insert into public.access_logs(user_id, module_id, action)
      values (auth.uid(), v_mod.id, 'denied');
    return json_build_object('url', null, 'reason', 'módulo no disponible');
  end if;

  select exists(
    select 1 from public.permissions
    where user_id = auth.uid() and module_id = v_mod.id
  ) into v_ok;

  if not v_ok then
    insert into public.access_logs(user_id, module_id, action)
      values (auth.uid(), v_mod.id, 'denied');
    return json_build_object('url', null, 'reason', 'sin permiso');
  end if;

  insert into public.access_logs(user_id, module_id, action)
    values (auth.uid(), v_mod.id, 'open_module');
  return json_build_object('url', v_mod.url);
end;
$$;

-- ---------- RPCs DE ADMINISTRACIÓN (todas exigen is_admin()) ----------

drop function if exists public.admin_list_users();
create or replace function public.admin_list_users()
returns table (id uuid, username text, email text, full_name text, role user_role,
               is_active boolean, is_blocked boolean, last_login timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  return query
    select p.id, p.username, u.email::text, p.full_name, p.role, p.is_active, p.is_blocked, p.last_login
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

create or replace function public.admin_set_active(p_user_id uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  update public.profiles set is_active = p_value where id = p_user_id;
end; $$;

create or replace function public.admin_set_blocked(p_user_id uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  update public.profiles set is_blocked = p_value where id = p_user_id;
end; $$;

create or replace function public.admin_get_permissions(p_user_id uuid)
returns table (module_id uuid)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  return query select pm.module_id from public.permissions pm where pm.user_id = p_user_id;
end; $$;

create or replace function public.admin_toggle_permission(p_user_id uuid, p_module_id uuid, p_grant boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  if p_grant then
    insert into public.permissions(user_id, module_id)
    values (p_user_id, p_module_id) on conflict do nothing;
  else
    delete from public.permissions where user_id = p_user_id and module_id = p_module_id;
  end if;
end; $$;

create or replace function public.admin_list_logs(p_limit int default 100)
returns table (id bigint, email text, action text, module_name text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  return query
    select l.id, u.email::text, l.action, m.name, l.created_at
    from public.access_logs l
    left join auth.users u on u.id = l.user_id
    left join public.modules m on m.id = l.module_id
    order by l.created_at desc
    limit p_limit;
end; $$;

-- Enlaza un usuario Auth existente con su perfil y username de login.
-- La creación completa con contraseña vive en supabase/functions/admin-create-user.
drop function if exists public.admin_create_user(text, text, text, public.user_role);
create or replace function public.admin_create_user(
  p_username text, p_email text, p_full_name text, p_role user_role)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_username text;
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  v_username := public.normalize_username(p_username);
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    return json_build_object('ok', false,
      'reason', 'Crea primero el usuario en Authentication o usa la Edge Function (ver README).');
  end if;
  insert into public.profiles(id, username, full_name, role)
  values (v_id, v_username, nullif(trim(p_full_name), ''), p_role)
  on conflict (id) do update set
    username = excluded.username,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = excluded.role;
  return json_build_object('ok', true, 'id', v_id);
end; $$;

create or replace function public.admin_edit_user(
  p_user_id uuid, p_username text default null, p_full_name text default null, p_role user_role default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_username text;
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  if p_user_id = auth.uid() and p_role is not null and p_role <> 'admin' then
    raise exception 'no puedes quitarte el rol admin a ti mismo';
  end if;

  if p_username is not null then
    v_username := public.normalize_username(p_username);
  end if;

  update public.profiles
  set
    username = coalesce(v_username, username),
    full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
    role = coalesce(p_role, role)
  where id = p_user_id;
end; $$;

-- Elimina un usuario de auth.users (cascada elimina perfil, permisos; logs quedan con user_id=null).
-- No permite borrar tu propia cuenta ni la de otro admin.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_role user_role;
begin
  if not public.is_admin() then raise exception 'no autorizado'; end if;
  if p_user_id = auth.uid() then raise exception 'no puedes eliminar tu propia cuenta'; end if;
  select role into v_role from public.profiles where id = p_user_id;
  if v_role = 'admin' then raise exception 'no se puede eliminar a otro administrador'; end if;
  delete from auth.users where id = p_user_id;
end; $$;

-- Devuelve el email interno a partir del username (para login sin email visible).
-- SECURITY DEFINER: el cliente no puede listar todos los usernames.
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql stable security definer set search_path = public as $$
declare v_email text;
begin
  select u.email into v_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username);
  return v_email;
end; $$;

-- ---------- TRIGGER: crear perfil automático al registrarse ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'invitado')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- MÓDULOS DEL SISTEMA ALAS
-- URLs: actualizar desde el Panel Admin una vez desplegado,
--       o reemplazar los placeholder antes de ejecutar.
-- =====================================================================
insert into public.modules(key, name, url, is_active, sort_order) values
  ('calendario',  'Calendario Tareas',     'https://PENDIENTE.vercel.app', true,  1),
  ('pedidos',     'Pedidos Caja Venta',    'https://PENDIENTE.vercel.app', true,  2),
  ('acuses',      'Acuses de Recibo',      'https://PENDIENTE.vercel.app', false, 3),
  ('borrados',    'Items Borrados',        'https://PENDIENTE.vercel.app', false, 4),
  ('recepcion',   'Recepción Mercaderías', 'https://PENDIENTE.vercel.app', false, 5),
  ('inventario',  'Inventario',            'https://PENDIENTE.vercel.app', false, 6),
  ('facturacion', 'Facturacion',           'https://PENDIENTE.vercel.app', false, 7)
on conflict (key) do nothing;

-- =====================================================================
-- PASO FINAL: convertir tu usuario en admin
-- Ejecutar DESPUÉS de registrarte en el Launcher por primera vez.
-- =====================================================================
-- update public.profiles set username='admin', role='admin' where id =
--   (select id from auth.users where email='TU-EMAIL@ejemplo.com');
