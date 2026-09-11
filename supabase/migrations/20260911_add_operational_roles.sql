-- ALAS Launcher - roles operativos usados por el panel admin.
-- Necesario para poder guardar usuarios con role = 'registro' o 'calendario'.

alter type public.user_role add value if not exists 'registro';
alter type public.user_role add value if not exists 'calendario';
