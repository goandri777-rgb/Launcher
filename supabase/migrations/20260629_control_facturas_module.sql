-- =====================================================================
-- ALAS · Reemplazar módulo "Facturación del día" por "Control de Facturas"
-- Ejecutar en: Supabase Studio (LAUNCHER) → SQL Editor
-- =====================================================================

-- 1. Quitar el módulo de facturación anterior (era placeholder/pendiente).
--    (borra también sus permisos por el ON DELETE CASCADE)
delete from public.modules where key = 'facturacion';

-- 2. Registrar "Control de Facturas".
--    url vacía + is_active=false hasta tener el deploy de Vercel.
insert into public.modules (key, name, url, is_active, is_blocked, sort_order)
values ('control-facturas', 'Control de Facturas', '', false, false, 7)
on conflict (key) do nothing;

-- 3. Cuando tengas la URL de Vercel, activá el módulo:
-- update public.modules
--   set url = 'https://TU-URL.vercel.app', is_active = true
--   where key = 'control-facturas';
