# MEMORIA DEL PROYECTO — ALAS Logistic Launcher

> Documento de trabajo que registra decisiones, cambios, arquitectura y estado actual del proyecto.
> Actualizar después de cada sesión de cambios importantes.

---

## 1. DESCRIPCIÓN GENERAL

**ALAS Launcher** es el centro de autenticación y punto de entrada del ecosistema logístico ALAS.
Es una app React con diseño circular (launcher) que muestra los módulos disponibles para cada usuario
y los abre con sesión automática vía SSO.

---

## 2. STACK TÉCNICO

| Tecnología | Uso |
|---|---|
| React 18 + Vite | Framework principal |
| Tailwind CSS | Estilos base |
| Framer Motion | Animaciones (Hyde-style) |
| GSAP | Timeline de intro y microinteracciones del launcher |
| Supabase Auth | Autenticación de usuarios (en producción) |
| Web Crypto API | Firma HMAC-SHA-256 de tokens SSO |
| React Router DOM | Rutas: `/` (Launcher), `/admin` (Panel) |

---

## 3. ESTRUCTURA DE ARCHIVOS CLAVE

```
src/
├── lib/
│   ├── AuthContext.jsx      # Contexto global de sesión. DEMO_MODE aquí.
│   ├── supabase.js          # Cliente Supabase (usa VITE_SUPABASE_URL)
│   └── sessionBridge.js     # Generación y verificación de tokens SSO
│                              (generateToken, verifyToken, readTokenFromUrl)
├── hooks/
│   └── useModules.js        # Lista módulos permitidos + openModule() con SSO
├── data/
│   └── icons.js             # Mapa key → ícono Lucide para cada módulo
├── components/
│   └── CircularLauncher.jsx # Launcher circular con animaciones
├── pages/
│   ├── Launcher.jsx         # Página principal (header, launcher, footer)
│   └── AdminPanel.jsx       # Panel admin completo (usuarios, módulos, actividad)
└── guards/
    └── Guards.jsx           # AuthGuard + AdminGuard para rutas protegidas

.env                         # Variables de entorno (NO commitear)
MEMORIA.md                   # Este archivo
```

---

## 4. VARIABLES DE ENTORNO (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# SSO — secreto HMAC-SHA-256 (debe ser idéntico en TODOS los sistemas)
VITE_SSO_SECRET=b526922500372bfa54a63c8e7bf92402b2dda357e07fd146c013dc79d5204bad

# URLs del Launcher y subsistemas
VITE_LAUNCHER_URL=http://localhost:5173          # Dev. En prod: URL de Vercel
VITE_URL_CALENDARIO=http://localhost:8080        # Dev. En prod: URL real
VITE_URL_PEDIDOS=http://localhost:3000           # Dev. En prod: URL real
VITE_URL_ACUSES=
VITE_URL_BORRADOS=
VITE_URL_RECEPCION=
VITE_URL_INVENTARIO=
```

---

## 5. DEMO MODE

Los archivos mantienen un flag `DEMO_MODE`, pero el estado actual del proyecto es producción/Supabase:

| Archivo | Flag | Efecto |
|---|---|---|
| `src/lib/AuthContext.jsx` | `DEMO_MODE = false` | Login real con Supabase Auth |
| `src/hooks/useModules.js` | `DEMO_MODE = false` | Módulos desde RPCs Supabase |
| `src/lib/adminApi.js` | `DEMO_MODE = false` | Panel admin desde RPCs Supabase |

**Para desarrollo demo se puede volver temporalmente a `true`, pero no es el estado actual.**

---

## 6. DISEÑO VISUAL

### Tema
- **Estilo**: Light, profesional (inspirado en Linear / Stripe / Raycast)
- **Fondo**: `radial-gradient` + `linear-gradient(145deg, #edf1f7, #e6ecf5, #edf2f8)`
- **Fuentes**: Inter (cuerpo) + Sora (títulos/display)
- **Color brand**: `#0B5F8D` (azul corporativo ALAS)

### Paleta principal
```js
brand:      '#0B5F8D'   // azul principal
brandDark:  '#08486A'   // hover/activo
accent:     '#3B82F6'   // azul acento
surface:    '#ffffff'
border:     'rgba(226,232,240,0.85)'
text1:      '#1e293b'
text2:      '#475569'
text3:      '#94a3b8'
```

### CircularLauncher
- Tamaño: `680px`, órbita radio `258px`, hub radio `96px`
- Botones de módulo: `88px` cuadrado, `borderRadius 20`
- Hub central: gradiente blanco + float animation + logo ALAS de fondo (opacity 0.07)
- Líneas SVG: base sólida gris + dashes marchantes azules para módulos activos
- Intro: timeline GSAP con hub, órbita, líneas y módulos en cascada; cleanup con `gsap.context()`
- Hover actual: animación imperativa simple solo sobre el botón del módulo (`scale 1.07`, `y -2`, sombra/color)
- Loader de salida: `AlasTransitionLoader.jsx`, overlay institucional sin texto visible, logo central + anillos GSAP
- Al abrir módulo: delay `LAUNCH_TRANSITION_MS = 1400` para cubrir la salida y evitar flashes blancos
- Importante: no usar estado React para hover del launcher ni parallax del sistema; provocaba re-render/flicker del SVG
- Animaciones CSS residuales: `hub-float 5s`, `hub-ring 4s`, `dash-march 1.8s`

### AdminPanel
- Dashboard de una sola vista (sin tabs)
- Grid: `1fr 420px` (tabla usuarios | columna derecha: módulos + actividad)
- 4 stat cards arriba con gradientes de color
- Filas animadas con CSS `@keyframes row-in` + `animationDelay` escalonado
- Hover: CSS `.alas-tr:hover { background: #f8fafc }`

---

## 7. MÓDULOS DEL SISTEMA

| Key | Nombre | URL dev | Sistema |
|---|---|---|---|
| `calendario` | Calendario Tareas | `localhost:8080` | Calendario tareas Alas |
| `pedidos` | Pedidos Caja Venta | `localhost:3000` | cajaventa |
| `acuses` | Acuses de Recibo | — | pendiente |
| `borrados` | Items Borrados | — | pendiente |
| `recepcion` | Recepción Mercaderías | — | pendiente |
| `inventario` | Inventario | — | pendiente |
| `control-facturas` | Control de Facturas | — | pendiente |

---

## 8. ARQUITECTURA SSO

### Problema
Los tres sistemas corren en orígenes distintos (puertos diferentes), por lo que `localStorage`
no se comparte. Se usa un token firmado pasado por URL.

### Flujo
```
LAUNCHER (login) → generateToken() → openModule(key)
  → URL: http://destino?alas_token=payloadB64url.firmaHMAC
    ↓
SUBSISTEMA carga alas-auth-client.js
  → lee ?alas_token del URL
  → verifica firma HMAC-SHA-256
  → limpia el token del URL con history.replaceState()
  → guarda sesión en localStorage["alas.sso.session"]
  → popula localStorage["acuse.currentUser"] (para auditoría)
  → llama setLoggedInUser() o AlasAuthClient.isAuthenticated = true
  → la app carga con el usuario del Launcher
```

### Token SSO
```
Formato:  base64url(payload).base64url(firma_HMAC_SHA256)
Payload:  { userId, name, email, role, permissions[], iat, exp }
TTL:      60 minutos
Secreto:  VITE_SSO_SECRET (compartido, NO en código fuente)
```

### Seguridad
- El secreto vive en `.env` del Launcher y en archivos de config gitignoreados en subsistemas
- Token manipulado → firma inválida → rechazado
- Token expirado → `Date.now() > exp` → rechazado
- Sin sesión → redirige al Launcher (CajaVenta) o muestra login PIN (Calendario)

---

## 9. SISTEMAS CONECTADOS

### CajaVenta (`../cajaventa`)
- **Stack**: Vanilla JS + HTML + Node.js (puerto 3000)
- **Auth original**: `window.prompt()` pidiendo nombre → `localStorage["acuse.currentUser"]`
- **Cambios SSO**:
  - `js/alas-auth-client.js` (nuevo) — SSO client
  - `js/alas-sso-config.js` (nuevo, gitignoreado) — secreto + launcherUrl
  - `js/alas-layout.js` — 4 cambios quirúrgicos: sin prompt si hay SSO
  - `views/pedidos.html` + `views/dashboard-Cajaventa.html` — cargan config + auth client
- **Auditoría**: `supabase.js` ya tenía `registrarAuditoria()` — usa `localStorage["acuse.currentUser"]` automáticamente
- **Logout SSO**: `window.AlasAuthClient.logout()`

### Calendario Tareas (`../Calendario tareas Alas`)
- **Stack**: Vanilla JS + esbuild bundle (puerto 8080, servido con http-server)
- **Auth original**: Login PIN con hash SHA-256, validado en Google Apps Script
- **Backend dual**: Supabase `yyuniovoywemybfzhwou` + Google Apps Script (fallback)
- **Cambios SSO**:
  - `src/alas-auth-client.js` (nuevo) — SSO client, incluido en bundle
  - `src/app-boot.js` — llama `initSSO()` después de `loadUsers()`
  - `src/app-sync.js` — guard `App.ssoAuthenticated` previene eviction del SSO user
  - `scripts/build.js` — agrega `alas-auth-client.js` al bundle
  - `sso-config.js` (nuevo, gitignoreado) — secreto + launcherUrl
  - `index.html` — carga `sso-config.js` antes del bundle
- **Login PIN**: NO eliminado. Es el fallback si no hay token SSO.
- **Logout SSO**: `window.AlasSSO.logoutSSO()`
- **Rebuild**: `node scripts/build.js` después de cambios en `src/`

---

## 10. PANEL ADMIN

Accesible en `/admin`. Solo visible para usuarios con `role === 'admin'`.

### Vistas (dashboard único, sin tabs)
- **Stat cards**: Total usuarios, Activos, Módulos activos, Bloqueados
- **Tabla Usuarios**: nombre, rol, estado, último acceso, botón permisos, acciones
- **Modal Permisos**: toggle on/off por módulo para cada usuario
- **Panel Módulos**: ícono, nombre, URL oculta (revelar con ojito), editar, activar/desactivar
- **Modal Editar Módulo**: nombre + URL de destino (la que recibe el token SSO)
- **Actividad reciente**: últimos 8 registros con email, acción y módulo

### AdminAPI (`src/lib/adminApi.js`)
Con `DEMO_MODE = false` llama RPCs de Supabase protegidos por `is_admin()`.
El login operativo es por `username`; el email queda interno para Supabase Auth.
El panel crea usuarios Auth completos con `username`, contraseña, nombre y rol mediante la Edge Function `admin-create-user`.
Si no se envía email, la función genera uno interno a partir del `username`.
El RPC `admin_create_user` queda como respaldo para enlazar usuarios Auth existentes.

---

## 11. ALASmotionbridge — TRANSICIÓN ESTÁNDAR DEL ECOSISTEMA

Patrón oficial de transición visual entre el Launcher y todos los módulos ALAS.

### Archivo de referencia
`logistic-launcher/public/alas-transition.js` — fuente canónica. Copiar a cada proyecto.

### API
```js
ALASTransition.init({ root: '.selector-raíz' })   // oculta el contenedor inmediatamente
ALASTransition.enterProject()                       // anima entrada desde izquierda (420ms)
ALASTransition.exitToLauncher(url)                  // anima salida hacia derecha (260ms) → navega
```

### Animaciones
| Dirección | Transform | Easing |
|---|---|---|
| Entrada (desde Launcher) | X(-24px)→none + blur(3px)→0 + opacity 0→1 | `cubic-bezier(0.16,1,0.3,1)` expo.out |
| Salida (hacia Launcher) | none→X(24px) + blur(0)→3px + opacity 1→0 | `cubic-bezier(0.4,0,1,1)` ease-in |

### Integración por proyecto

| Proyecto | Script | Root | `enterProject()` | `exitToLauncher()` |
|---|---|---|---|---|
| **CajaVenta pedidos** | `/js/alas-transition.js` | `#layout-root` | `alas-layout.js` post-render | intercepta `<a>` sidebar |
| **CajaVenta dashboard** | `/js/alas-transition.js` | `.dashboard-card` | `DOMContentLoaded` | intercepta `#btnSidebarHome` |
| **Calendario** | `alas-transition.js` (raíz) | `.app-container` | fin de `bootstrap()` en `app-boot.js` | `alasGoToLauncher()` en botones |

### Receta para futuros proyectos
1. Copiar `alas-transition.js` al proyecto
2. Cargar antes de `sso-config.js`: `<script src="/js/alas-transition.js"></script>`
3. Llamar `ALASTransition.init({ root: '.contenedor-principal' })`
4. Llamar `ALASTransition.enterProject()` cuando el contenido esté listo
5. En botón "Volver": `ALASTransition.exitToLauncher(launcherUrl)`

### Garantías del bridge
- No toca SSO, tokens, Supabase ni lógica de negocio
- Respeta `prefers-reduced-motion` (sin animación si está activo)
- Fallback graceful si JS falla (elemento visible por defecto)
- Compatible: HTML puro, Vanilla JS, Vite, React

---

## 12. HISTORIAL DE CAMBIOS

### UI / Diseño
- [x] Launcher circular con animaciones Hyde-style
- [x] CircularLauncher refinado con GSAP: intro fluida, hover estable sin parallax ni re-render SVG
- [x] Fix pantalla blanca: `isBusy` definido en connector lines SVG
- [x] Hover de módulos simplificado a zoom animado estable para evitar parpadeo del cursor
- [x] Loader institucional sin palabras al abrir módulos: logo central, anillos GSAP y overlay anti-flash
- [x] Tema light (Linear/Stripe/Raycast feel)
- [x] Logo ALAS en hub central (watermark sutil, opacity 0.07)
- [x] Líneas SVG con dashes marchantes (azul → módulo)
- [x] Footer "Conexión segura" eliminado
- [x] AdminPanel rediseñado: dashboard único, stat cards, tabla con CSS hover, modales premium
- [x] AnimatePresence + stagger en AdminPanel (sin motion.tr para evitar bugs de re-animación)

### Autenticación / SSO
- [x] Etapa 1: `sessionBridge.js` — token HMAC-SHA-256, `openModule()` con token
- [x] Etapa 2: CajaVenta — `alas-auth-client.js`, sin prompt(), sin romper KPIs
- [x] Etapa 3: Calendario — `alas-auth-client.js` en bundle, bypass PIN, guard anti-eviction
- [x] Etapa 4: Pruebas E2E (29/29 OK con Playwright)
- [x] Etapa 5: Endurecimiento — secreto fuerte, config gitignoreada, TTL 60 min, logout
- [x] Login por `username` alineado con Supabase: `admin_create_user`, `admin_edit_user`, `get_email_by_username`
- [x] Catálogo de módulos sin URLs vía `get_module_catalog`; URLs solo por `open_module` o panel admin
- [x] Dependencia directa Linux de Rollup removida; build verificado en Windows
- [x] Creación de usuarios con contraseña desde el panel mediante Supabase Edge Function `admin-create-user`

---

## 12. PENDIENTES / PRÓXIMOS PASOS

### Antes de producción (obligatorios)
- [x] `DEMO_MODE = false` en `AuthContext.jsx`, `useModules.js` y `adminApi.js`
- [ ] Configurar `.env` con Supabase real (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Desplegar `supabase/functions/admin-create-user` y configurar `ALAS_SERVICE_ROLE_KEY`
- [ ] Configurar `VITE_LAUNCHER_URL` y URLs de cada módulo en `.env`
- [ ] Actualizar `launcherUrl` en `sso-config.js` de CajaVenta y Calendario con URL de Vercel
- [x] Crear RPCs de Supabase: `get_module_catalog`, `get_allowed_modules`, `open_module`, `admin_list_users`, `admin_create_user`, `admin_edit_user`, etc.
- [ ] Configurar RLS en Supabase (actualmente permisivo en CajaVenta)

### Mejoras de seguridad (recomendadas)
- [ ] Supabase Edge Function para verificar tokens server-side (secreto fuera del browser)
- [ ] Tabla `sso_tokens` con revocación para logout global inmediato
- [ ] Refresh automático de token antes de que expire (a los 50 min)
- [ ] BroadcastChannel para logout sincronizado entre pestañas del mismo origen

### Módulos pendientes de conectar
- [ ] Acuses de Recibo
- [ ] Items Borrados
- [ ] Recepción Mercaderías
- [ ] Inventario

---

## 13. CÓMO LEVANTAR EL ENTORNO DE DESARROLLO

```powershell
# Launcher
cd C:\Users\AGOMEZ\Desktop\logistic-launcher
npm run dev          # → http://localhost:5173

# CajaVenta
cd C:\Users\AGOMEZ\Desktop\cajaventa
node server.js       # → http://localhost:3000

# Calendario (requiere build previo si hubo cambios en src/)
cd "C:\Users\AGOMEZ\Desktop\Calendario tareas Alas"
node scripts/build.js          # reconstruye el bundle
npx http-server -p 8080 --cors -c-1 .   # → http://localhost:8080
```

---

## 14. FLUJO DE PRUEBA END-TO-END

```
1. Levantar los 3 servidores (ver sección 13)
2. Abrir http://localhost:5173 (Launcher)
3. Hacer clic en "Pedidos Caja Venta"
   → Se abre http://localhost:3000 con ?alas_token=xxx
   → Token se limpia del URL
   → No aparece window.prompt()
   → localStorage["acuse.currentUser"] = nombre del usuario
4. Hacer clic en "Calendario Tareas"
   → Se abre http://localhost:8080 con ?alas_token=xxx
   → No aparece login PIN
   → App.ssoAuthenticated = true
   → App.currentUser.nm = nombre del usuario
5. Acceso directo a localhost:3000 sin sesión → redirige a localhost:5173
6. Acceso directo a localhost:8080 sin sesión → muestra login PIN
```

---

*Última actualización: Junio 2026 — login por username, creación de usuarios con contraseña vía Edge Function, RPCs admin y catálogo seguro de módulos alineados con el código actual.*
