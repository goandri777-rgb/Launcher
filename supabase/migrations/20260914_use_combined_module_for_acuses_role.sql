-- ALAS Launcher - corrección del acceso exclusivo para el rol Acuses.
--
-- El rol `acuses` abre el módulo combinado (key = calendario), pero el cliente
-- lo dirige a /acuses. Los accesos antiguos separados se conservan en la tabla
-- para no perder configuración, aunque quedan desactivados y ocultos.

update public.modules
set is_active = false
where key in ('acuses', 'recepcion');

create or replace function public.get_allowed_modules()
returns table (key text, name text, is_active boolean, is_blocked boolean, sort_order int)
language sql stable security definer set search_path = public
as $$
  select m.key, m.name, m.is_active, m.is_blocked, m.sort_order
  from public.modules m
  join public.profiles pr on pr.id = auth.uid()
  left join public.permissions p on p.module_id = m.id and p.user_id = pr.id
  where m.key not in ('acuses', 'recepcion')
    and (
      (pr.role::text = 'calendario' and m.key = 'calendario')
      or (pr.role::text = 'acuses' and m.key = 'calendario')
      or (pr.role::text not in ('calendario', 'acuses') and p.user_id is not null)
    )
  order by m.sort_order;
$$;

create or replace function public.get_module_catalog()
returns table (id uuid, key text, name text, is_active boolean, is_blocked boolean, sort_order int)
language sql stable security definer set search_path = public
as $$
  select m.id, m.key, m.name, m.is_active, m.is_blocked, m.sort_order
  from public.modules m
  join public.profiles pr on pr.id = auth.uid()
  where m.key not in ('acuses', 'recepcion')
    and (
      pr.role::text not in ('calendario', 'acuses')
      or (pr.role::text = 'calendario' and m.key = 'calendario')
      or (pr.role::text = 'acuses' and m.key = 'calendario')
    )
  order by m.sort_order;
$$;

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

  if p_module_key in ('acuses', 'recepcion') then
    insert into public.access_logs(user_id, action) values (auth.uid(), 'denied');
    return json_build_object('url', null, 'reason', 'módulo retirado del launcher');
  end if;

  if v_prof.role::text = 'calendario' and p_module_key <> 'calendario' then
    insert into public.access_logs(user_id, action) values (auth.uid(), 'denied');
    return json_build_object('url', null, 'reason', 'rol calendario limitado al módulo combinado');
  end if;
  if v_prof.role::text = 'acuses' and p_module_key <> 'calendario' then
    insert into public.access_logs(user_id, action) values (auth.uid(), 'denied');
    return json_build_object('url', null, 'reason', 'rol acuses limitado al módulo combinado');
  end if;

  select * into v_mod from public.modules where key = p_module_key;
  if not found or not v_mod.is_active or v_mod.is_blocked then
    insert into public.access_logs(user_id, module_id, action)
      values (auth.uid(), v_mod.id, 'denied');
    return json_build_object('url', null, 'reason', 'módulo no disponible');
  end if;

  if v_prof.role::text in ('calendario', 'acuses') then
    v_ok := v_mod.key = 'calendario';
  else
    select exists(
      select 1 from public.permissions
      where user_id = auth.uid() and module_id = v_mod.id
    ) into v_ok;
  end if;

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
