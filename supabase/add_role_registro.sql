-- ============================================================
-- ALAS Launcher · Agregar el rol 'registro' al enum user_role
-- Proyecto Supabase de AUTH: xkgumqztscqcwamtimuh
-- Correr en el SQL Editor.
--
-- 'registro' = rol operativo para el apartado "Control de facturas"
-- del Tablero de Facturación: esos usuarios solo ven ese apartado.
-- El enum user_role gobierna profiles.role y los RPC admin_create_user
-- / admin_edit_user, así que sin este ADD VALUE la base rechaza el rol.
-- Idempotente: si ya existe, no hace nada.
-- ============================================================

alter type user_role add value if not exists 'registro';
