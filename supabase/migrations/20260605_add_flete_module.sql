-- =====================================================================
-- ALAS · Módulo Calculadora de Flete
-- Ejecutar en: Supabase Studio → SQL Editor
-- =====================================================================

insert into public.modules (key, name, url, is_active, is_blocked, sort_order)
values ('flete', 'Calculadora de Flete', '', false, false, 10)
on conflict (key) do nothing;
