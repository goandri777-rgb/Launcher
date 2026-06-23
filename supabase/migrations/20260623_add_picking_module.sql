-- =====================================================================
-- ALAS · Módulo Productividad Picking
-- Ejecutar en: Supabase Studio (LAUNCHER) → SQL Editor
-- =====================================================================

-- 1. Registrar el módulo (aparece en el hub apenas se inserta).
--    url vacía + is_active=false hasta tener el deploy de Vercel.
insert into public.modules (key, name, url, is_active, is_blocked, sort_order)
values ('productividad-picking', 'Productividad Picking', '', false, false, 11)
on conflict (key) do nothing;

-- 2. Cuando tengas la URL de Vercel, activá el módulo:
-- update public.modules
--   set url = 'https://TU-URL.vercel.app', is_active = true
--   where key = 'productividad-picking';
