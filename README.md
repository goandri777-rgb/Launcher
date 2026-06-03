# ALAS · Launcher logístico seguro

Portal tipo *launcher* circular para entrar a tus programas de gestión logística (publicados en Vercel), con login por `username`, roles, permisos por módulo, panel admin y registro de accesos. **La seguridad real vive en Postgres (RLS), no en el frontend.**

Stack: React + Vite · Tailwind CSS · Framer Motion · Supabase (Auth + Postgres + RLS).

---

## 1. Requisitos

- Node.js 18+
- Una cuenta de Supabase (proyecto nuevo gratuito sirve)

## 2. Instalación

```bash
cd logistic-launcher
npm install
cp .env.example .env      # completa con tus claves PÚBLICAS
npm run dev               # http://localhost:5173
```

## 3. Configurar Supabase

1. Crea un proyecto en supabase.com.
2. En **Project Settings → API** copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   Pégalas en `.env`. **Nunca** pongas la `service_role` en el frontend.
3. Abre **SQL Editor** y ejecuta entero el archivo [`supabase/schema.sql`](supabase/schema.sql). Crea tablas, RLS, funciones y módulos demo.

## 4. Crear tu primer admin

1. Ve a **Authentication → Users → Add user**, crea tu correo y contraseña.
   El trigger crea automáticamente su perfil con rol `invitado`.
2. En **SQL Editor**, conviértelo en admin y asignale un `username`:

   ```sql
   update public.profiles set username='admin', role='admin'
   where id = (select id from auth.users where email='tu-correo@ejemplo.com');
   ```
3. Inicia sesión con ese `username` y tu contraseña. Verás el botón **Admin** en el launcher.

## 5. Crear más usuarios

El panel admin ahora crea la cuenta completa con `username`, contraseña, nombre y rol.
Supabase Auth necesita un email internamente, pero el sistema lo genera automáticamente a partir del `username`; el operador nunca lo carga ni lo usa para entrar.
Para que funcione, desplegá la Edge Function que usa `auth.admin.createUser` del lado servidor:

```bash
supabase functions deploy admin-create-user
supabase secrets set ALAS_SERVICE_ROLE_KEY=tu_service_role_key
```

Después entrá al **panel admin → Nuevo usuario**, cargá los datos y asigná permisos de módulos.
La `service_role` queda solo en Supabase; el frontend sigue usando únicamente la anon key pública.
El RPC `admin_create_user` del SQL queda como respaldo para enlazar un usuario Auth existente si alguna vez lo necesitás.

## 6. Configurar tus URLs reales de Vercel

Los módulos demo usan `*.example.vercel.app`. Cámbialos:

```sql
update public.modules set url='https://tu-app-real.vercel.app' where key='pedidos';
-- repite para calendario, acuses, borrados, recepcion, inventario, facturacion
```

## 7. Asignar permisos

En el panel admin → un usuario → botón de permisos (escudo) → activa los módulos. Solo verá y podrá abrir los que tenga asignados.

---

## Modelo de seguridad (lee esto)

- **Ocultar botones es solo UX, no seguridad.** Cualquiera con devtools la salta.
- La seguridad real son las **políticas RLS** y las **funciones RPC** del lado servidor:
  - `get_module_catalog()` devuelve el catálogo sin URLs para pintar el launcher.
  - `get_allowed_modules()` devuelve solo los módulos del usuario; **no** entrega URLs.
  - `open_module(key)` reverifica permiso + estado de cuenta/módulo en el servidor, registra el acceso y **solo entonces** devuelve la URL. Sin permiso, el navegador nunca recibe el enlace.
  - Las RPC de admin exigen `is_admin()` internamente.
- El frontend solo usa la **anon key** (pública por diseño). Ninguna clave secreta toca el navegador.

### Limitación honesta sobre los enlaces externos

Una URL de Vercel, una vez conocida, es abrible por cualquiera que la tenga. Este launcher controla **el descubrimiento** (quién recibe la URL) y **el registro** (quién la abrió), que es lo correcto en el lado del portal. Pero para seguridad fuerte de extremo a extremo, **cada app de Vercel debería validar también la sesión de Supabase al cargar** (su propio guard que compruebe el JWT y el permiso). Sin eso, un enlace filtrado sigue siendo accesible directamente. Recomendado: compartir la sesión de Supabase entre subdominios o validar el token en cada app destino.

---

## Estructura

```
logistic-launcher/
├── src/
│   ├── components/CircularLauncher.jsx   # launcher circular (Framer Motion)
│   ├── pages/Login.jsx                    # login glass
│   ├── pages/Launcher.jsx                 # pantalla principal
│   ├── pages/AdminPanel.jsx               # panel admin (usuarios, permisos, logs)
│   ├── guards/Guards.jsx                  # rutas protegidas (sesión + rol)
│   ├── hooks/useModules.js                # módulos permitidos + abrir módulo
│   ├── lib/supabase.js                    # cliente Supabase
│   ├── lib/AuthContext.jsx                # sesión + perfil
│   ├── lib/adminApi.js                    # llamadas RPC de admin
│   └── data/icons.js                      # iconos por módulo
├── supabase/schema.sql                    # tablas + RLS + funciones + demo
├── supabase/functions/admin-create-user   # crea usuarios Auth con password
├── .env.example
└── README.md
```

## Roles

`admin` · `supervisor` · `operador` · `invitado`. El rol vive en `profiles.role`. Solo `admin` accede a `/admin` (doble guard: cliente y RLS).

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run preview` — previsualizar build

---

Datos de ejemplo únicamente. No incluye información real.
