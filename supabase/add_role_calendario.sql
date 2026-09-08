-- ============================================================
-- ALAS Launcher · Agregar el rol 'calendario' al enum user_role
-- Proyecto Supabase de AUTH del Launcher.
-- Correr en el SQL Editor.
--
-- 'calendario' = rol operativo para el módulo "Calendario Tareas".
-- Esos usuarios ven SOLO el Calendario. El "solo el calendario" se
-- consigue asignándole a cada usuario únicamente el permiso del módulo
-- "Calendario Tareas" en el AdminPanel (tabla public.permissions);
-- el enum solo habilita que el rol sea válido para profiles.role y los
-- RPC admin_create_user / admin_edit_user.
-- Idempotente: si ya existe, no hace nada.
-- ============================================================

alter type user_role add value if not exists 'calendario';
