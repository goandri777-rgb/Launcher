# ALAS Ecosystem — Standards & Module Template

> **Fuente de verdad:** `logistic-launcher`
> Todo módulo nuevo debe compararse contra este documento antes de aprobarse.
> Las protecciones, transiciones, navegación y configuración del launcher se reutilizan — no se reimplementan.

---

## Índice

1. [Estructura de archivos obligatorios](#1-estructura-de-archivos-obligatorios)
2. [ALASTransition](#2-alastransition)
3. [SSO — Control de sesión](#3-sso--control-de-sesión)
4. [Roles](#4-roles)
5. [ui-protection.js](#5-ui-protectionjs)
6. [Favicon y manifest](#6-favicon-y-manifest)
7. [Colores brand](#7-colores-brand)
8. [Fuentes](#8-fuentes)
9. [Volver al menú](#9-volver-al-menú)
10. [Auditoría básica](#10-auditoría-básica)
11. [Plantilla HTML de módulo nuevo](#11-plantilla-html-de-módulo-nuevo)
12. [Checklist de integración](#12-checklist-de-integración)
13. [Archivos canónicos por proyecto](#13-archivos-canónicos-por-proyecto)

---

## 1. Estructura de archivos obligatorios

Todo módulo del ecosistema ALAS debe incluir los siguientes archivos, copiados desde el launcher:

```
mi-modulo/
├── js/                          (o src/ si usa bundler)
│   ├── alas-transition.js       ← copia exacta de logistic-launcher/public/alas-transition.js
│   ├── ui-protection.js         ← copia exacta de logistic-launcher/public/ui-protection.js
│   ├── alas-sso-config.js       ← secreto local — NO commitear (agregar a .gitignore)
│   └── alas-auth-client.js      ← cliente SSO estándar
├── assets/
│   └── icon-192.png             ← ícono ALAS oficial
└── index.html                   ← sigue la plantilla de §11
```

**Regla:** Nunca crear una implementación propia de SSO, transición o protección de consola. Siempre copiar desde `logistic-launcher/public/`.

---

## 2. ALASTransition

**Archivo canónico:** `logistic-launcher/public/alas-transition.js` (v1.3)

### Parámetros vigentes

```js
X_OUT  = '80px'                           // distancia horizontal de salida
SC_OUT = '0.96'                           // escala al salir
BL_OUT = '5px'                            // blur al salir
DUR_IN  = 680   // ms                     // duración de entrada
DUR_OUT = 420   // ms                     // duración de salida
ESE_IN  = 'cubic-bezier(0.16, 1, 0.3, 1)'  // expo.out — rápido al inicio
ESE_OUT = 'cubic-bezier(0.3, 0, 0.8, 0.15)' // ease-in limpio
```

### API

```js
ALASTransition.init({ root: '.selector-raiz' })  // oculta el contenedor antes del primer paint
ALASTransition.enterProject()                      // anima entrada desde derecha
ALASTransition.exitToLauncher(url)                 // anima salida y navega al launcher
```

### Integración en HTML (orden obligatorio)

```html
<head>
  <!-- SIN defer — debe correr antes del primer paint -->
  <script src="/js/alas-transition.js"></script>
</head>
<body>
  <div id="alas-root">
    <!-- contenido de la app -->
  </div>

  <script>
    // Sincrónico — inmediatamente después del elemento raíz
    if (window.ALASTransition) ALASTransition.init({ root: '#alas-root' });
  </script>
</body>
```

### Cuándo llamar enterProject()

```js
// Con loader: cuando el loader desaparece (simultáneo con fade-out del loader)
function hideLoader() {
  loader.classList.remove('loader--active');  // fade-out del loader
  ALASTransition.enterProject();              // simultáneo — overlap suave
}

// Sin loader: en DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  ALASTransition.enterProject();
});
```

### CSS obligatorio en el elemento raíz

```css
#alas-root,
.app-container,
#layout-root {
  overflow: hidden;     /* necesario para el GPU compositing del blur */
}

body {
  overflow-x: hidden;   /* evita scrollbar horizontal durante translateX */
}
```

### Causas de falla más comunes

| # | Síntoma | Causa | Fix |
|---|---|---|---|
| 1 | Transición no corre en botón `<a href>` | `href` navega antes de que termine | Agregar `e.preventDefault()` en el handler |
| 2 | Pantalla gris — `enterProject()` no se llama | Scripts `defer` corren antes de `DOMContentLoaded` | Usar `checkAndEnter()` inmediato después de `obs.observe()` |
| 3 | Blur lento / jank | `backdrop-filter` en elemento hijo del raíz animado | Suprimir con CSS `[style*="will-change"] .elemento { backdrop-filter: none }` |
| 4 | Scrollbar horizontal en entrada | Sin `overflow-x: hidden` en body | Agregar al CSS del proyecto |
| 5 | Flash de contenido antes de la animación | `init()` llamado tarde (en DOMContentLoaded) | Llamar sincrónicamente en `<body>` |

---

## 3. SSO — Control de sesión

### Flujo completo

```
Launcher (logistic-launcher)
  │
  ├─ Usuario hace clic en módulo
  ├─ RPC open_module(key) → Supabase verifica permiso → retorna URL
  ├─ sessionBridge.generateToken({ userId, name, email, role, permissions })
  │    → firma con HMAC-SHA-256 usando VITE_SSO_SECRET
  │    → TTL: 60 minutos
  └─ Navega a: https://modulo.vercel.app?alas_token=payload.firma

Módulo (vanilla JS)
  │
  ├─ alas-auth-client.js detecta ?alas_token en URL
  ├─ Limpia URL con history.replaceState() INMEDIATAMENTE
  ├─ Verifica firma HMAC-SHA-256 con mismo secreto compartido
  ├─ Verifica que Date.now() < payload.exp
  ├─ Guarda en localStorage['alas.sso.session']
  └─ Expone window.AlasAuthClient con API pública
```

### Estructura del token (payload)

```json
{
  "userId":      "uuid-del-usuario",
  "name":        "Nombre Apellido",
  "email":       "usuario@empresa.com",
  "role":        "operador",
  "permissions": ["pedidos", "calendario"],
  "iat":         1717000000000,
  "exp":         1717003600000
}
```

### localStorage keys estándar

| Key | Contenido | Quién lo escribe |
|---|---|---|
| `alas.sso.session` | payload JSON completo | alas-auth-client.js |
| `acuse.currentUser` | nombre del usuario (string) | alas-auth-client.js (compatibilidad auditoría) |

### alas-sso-config.js (NO commitear)

```js
// js/alas-sso-config.js — LOCAL ONLY
// Agregar a .gitignore. Copiar desde alas-sso-config.example.js y rellenar.
window.ALAS_SSO_CONFIG = {
  secret:     '64-hex-chars-identico-a-VITE_SSO_SECRET',
  launcherUrl: 'https://launcher-tawny.vercel.app',
};
```

### API pública: window.AlasAuthClient

```js
window.AlasAuthClient.isAuthenticated          // boolean
window.AlasAuthClient.user                     // payload completo
window.AlasAuthClient.getCurrentUser()         // string — nombre o email
window.AlasAuthClient.getUserId()              // UUID
window.AlasAuthClient.getRole()                // string — rol del usuario
window.AlasAuthClient.hasPermission('pedidos') // boolean
window.AlasAuthClient.logout()                 // limpia sesión → redirect al launcher
window.AlasAuthClient.auditAction(accion, detalle) // registra en auditoría
```

### Comportamiento ante sesión inválida

| Situación | Comportamiento correcto |
|---|---|
| Token URL inválido (firma mala) | Intentar sesión guardada → si falla, redirect launcher |
| Token expirado | Redirect al launcher (sin mostrar login local) |
| Sin sesión en absoluto | Redirect al launcher |
| Sesión expirada mientras la app está abierta | `doSessionExpired()` → redirect launcher (NO mostrar login local) |

**Regla:** Ningún módulo del ecosistema debe mostrar su propio formulario de login si hay un launcher configurado. El launcher es el único punto de autenticación.

---

## 4. Roles

### Enum de roles (definido en Supabase — tabla profiles)

| Rol | Descripción | Acceso AdminPanel |
|---|---|---|
| `admin` | Acceso total, gestiona usuarios y módulos | Sí — lectura y escritura |
| `supervisor` | Vista de solo lectura en AdminPanel | Sí — solo lectura *(pendiente implementar)* |
| `operador` | Usuario estándar, acceso según permisos asignados | No |
| `invitado` | Sin permisos iniciales | No |

### Verificación de roles en módulos vanilla

```js
// Nunca bloquear por rol solo en el frontend — es UX, no seguridad real.
// La seguridad real está en RLS + RPC SECURITY DEFINER en Supabase.

var role = window.AlasAuthClient.getRole();

if (role === 'admin' || role === 'supervisor') {
  // mostrar sección de administración
  document.getElementById('seccion-admin').style.display = 'block';
}

if (role === 'invitado') {
  // ocultar acciones de escritura
  document.querySelectorAll('.btn-accion').forEach(function(b) {
    b.disabled = true;
  });
}
```

### Verificación de permisos por módulo

```js
// El token incluye el array de módulos autorizados por el launcher.
if (!window.AlasAuthClient.hasPermission('pedidos')) {
  // Este usuario no tiene permiso para este módulo
  window.AlasAuthClient.logout(); // redirige al launcher
}
```

---

## 5. ui-protection.js

**Archivo canónico:** `logistic-launcher/public/ui-protection.js`

```js
/*
 * ui-protection.js
 *
 * Muestra un aviso disuasivo en la consola del navegador.
 * NO bloquea herramientas de desarrollo: hacerlo rompe lectores de pantalla,
 * extensiones de accesibilidad y flujos legítimos de depuración.
 */
(function () {
  'use strict';

  const WARNING_TITLE = 'Detente, zona restringida.';
  const WARNING_TEXT  = 'Esta consola es solo para personal autorizado de ALAS.';

  try {
    console.log(
      '%c' + WARNING_TITLE,
      'font-size:24px;font-weight:800;color:#dc2626;'
    );
    console.log(
      '%c' + WARNING_TEXT,
      'font-size:13px;font-weight:600;color:#0f172a;'
    );
  } catch (_) {
    /* consola no disponible */
  }
})();
```

**Regla de carga:** siempre con `defer` — no bloquea el render inicial.

```html
<script src="/js/ui-protection.js" defer></script>
```

---

## 6. Favicon y manifest

### Archivos requeridos

```
assets/
└── icon-192.png    ← ícono ALAS oficial (fondo azul #0B1929, logo blanco)
```

### En index.html (obligatorio)

```html
<head>
  <link rel="icon"             type="image/png" href="/assets/icon-192.png" />
  <link rel="apple-touch-icon"                  href="/assets/icon-192.png" />
  <link rel="manifest"                          href="/manifest.json" />
  <meta name="theme-color"     content="#0B5F8D" />
</head>
```

### manifest.json estándar

```json
{
  "name": "ALAS — [Nombre del Módulo]",
  "short_name": "ALAS",
  "description": "Módulo logístico ALAS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B1929",
  "theme_color": "#0B5F8D",
  "icons": [
    {
      "src": "/assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## 7. Colores brand

Usar siempre los valores exactos del launcher. No inventar variaciones.

```css
/* Variables CSS recomendadas — pegar en el CSS principal del módulo */
:root {
  --alas-brand:       #0B5F8D;   /* azul primario ALAS */
  --alas-brand-dark:  #08486A;   /* hover / activo */
  --alas-accent:      #3B82F6;   /* azul acento / highlights */
  --alas-surface:     #ffffff;
  --alas-bg:          #EEF2F7;   /* fondo general */
  --alas-border:      rgba(226, 232, 240, 0.85);
  --alas-text-1:      #1e293b;   /* texto principal */
  --alas-text-2:      #475569;   /* texto secundario */
  --alas-text-3:      #94a3b8;   /* texto muted */
  --alas-danger:      #dc2626;
  --alas-success:     #16a34a;
  --alas-warning:     #d97706;
}
```

**Regla:** El color primario de botones, links activos y elementos de marca es `#0B5F8D`, no `#3B82F6`. Este último es el acento/highlight, no el brand principal.

---

## 8. Fuentes

### Google Fonts (cargar en `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
  rel="stylesheet"
/>
```

### CSS base

```css
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  color: var(--alas-text-1);
}

h1, h2, h3, .display {
  font-family: 'Sora', system-ui, sans-serif;
  letter-spacing: -0.03em;
}
```

**Regla:** Inter para cuerpo de texto, Sora para títulos y elementos display. No usar FontAwesome si se puede reemplazar con SVG inline o Lucide.

---

## 9. Volver al menú

### Patrón estándar (vanilla JS)

```html
<!-- En el sidebar o navbar -->
<a
  href="https://launcher-tawny.vercel.app"
  class="btn-volver"
  title="Volver al Launcher ALAS"
  onclick="alasGoToLauncher(event)"
>
  <!-- ícono SVG inline aquí -->
  Menú principal
</a>
```

```js
function alasGoToLauncher(e) {
  if (e) e.preventDefault();   // SIEMPRE — bloquea el href aunque haya return false

  var url = (window.ALAS_SSO_CONFIG && window.ALAS_SSO_CONFIG.launcherUrl)
    ? window.ALAS_SSO_CONFIG.launcherUrl
    : 'https://launcher-tawny.vercel.app';

  if (window.ALASTransition) {
    ALASTransition.exitToLauncher(url);
  } else {
    window.location.href = url;   // fallback sin transición
  }
}
```

### Reglas

1. **Siempre `e.preventDefault()`** si el elemento es `<a href>`. Sin esto, el href navega antes de que termine la animación de 420ms y la transición no se ve.
2. Leer la URL desde `ALAS_SSO_CONFIG.launcherUrl` — no hardcodear, permite dev/prod.
3. Siempre tener fallback a `window.location.href` por si ALASTransition no cargó.
4. Verificar con el patrón "Botón B aislado" si la transición parece no funcionar (ver §2).

---

## 10. Auditoría básica

### Launcher (Supabase RPC — automático)

El launcher registra automáticamente en `access_logs`:
- `login` — cada vez que el usuario inicia sesión
- `open_module` — cada vez que abre un módulo
- `denied` — cuando el acceso es rechazado por permiso, estado o módulo inactivo

Los módulos **no necesitan reimplementar** esto — el launcher ya lo hace al emitir el token.

### Módulos (opcional, recomendado para acciones críticas)

```js
// Registrar acción importante (ej: eliminar un registro, aprobar algo)
window.AlasAuthClient.auditAction('eliminar_item', 'ID: ' + itemId);

// El método loguea en consola y llama a registrarAuditoria() si supabase.js está disponible
// → console.info('[ALAS AUDIT] eliminar_item | Nombre Usuario | ID: 123')
```

### Qué auditar en módulos

| Acción | Auditar |
|---|---|
| Apertura del módulo | No (ya lo hace el launcher) |
| Login / logout | Sí — `AlasAuthClient.auditAction('logout', '')` |
| Eliminar registro | Sí |
| Aprobar / rechazar | Sí |
| Exportar datos | Sí |
| Cambio de estado crítico | Sí |
| Cargar datos (import) | Sí |

---

## 11. Plantilla HTML de módulo nuevo

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ALAS — [Nombre del Módulo]</title>

  <!-- ── Favicon y PWA ─────────────────────────────────── -->
  <link rel="icon"             type="image/png" href="/assets/icon-192.png" />
  <link rel="apple-touch-icon"                  href="/assets/icon-192.png" />
  <link rel="manifest"                          href="/manifest.json" />
  <meta name="theme-color"     content="#0B5F8D" />

  <!-- ── Fuentes ───────────────────────────────────────── -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
    rel="stylesheet"
  />

  <!-- ── CSS principal ─────────────────────────────────── -->
  <link rel="stylesheet" href="/css/styles.css" />

  <!-- ── SSO + Transición (SIN defer — antes del primer paint) ── -->
  <script src="/js/alas-transition.js"></script>
  <script src="/js/alas-sso-config.js"></script>
  <script src="/js/alas-auth-client.js"></script>

  <!-- ── Protección de consola (con defer — no bloquea render) ── -->
  <script src="/js/ui-protection.js" defer></script>
</head>
<body>

  <!-- Loader institucional (visible mientras la app carga) -->
  <div id="loader" style="
    position:fixed; inset:0; z-index:9999;
    display:flex; align-items:center; justify-content:center;
    background:#EEF2F7;
  ">
    <!-- spinner o logo ALAS -->
    <img src="/assets/logo_alas_blanco.png" alt="ALAS" style="height:48px; opacity:0.5;" />
  </div>

  <!-- Contenedor raíz de la app -->
  <div id="alas-root" style="min-height:100vh;">
    <!-- contenido del módulo aquí -->
  </div>

  <!-- ── Init sincrónico de transición ─────────────────── -->
  <script>
    // Corre antes del primer paint — oculta #alas-root para la animación de entrada
    if (window.ALASTransition) ALASTransition.init({ root: '#alas-root' });

    // Failsafe: si el loader no desaparece en 30s, forzar ocultamiento
    setTimeout(function () {
      var l = document.getElementById('loader');
      if (l && getComputedStyle(l).display !== 'none') {
        l.style.setProperty('display', 'none', 'important');
        l.style.opacity = '0';
        console.log('[ALAS] Failsafe: loader oculto por timeout');
      }
    }, 30000);

    // Función global para volver al launcher
    function alasGoToLauncher(e) {
      if (e) e.preventDefault();
      var url = (window.ALAS_SSO_CONFIG && window.ALAS_SSO_CONFIG.launcherUrl)
        ? window.ALAS_SSO_CONFIG.launcherUrl
        : 'https://launcher-tawny.vercel.app';
      if (window.ALASTransition) {
        ALASTransition.exitToLauncher(url);
      } else {
        window.location.href = url;
      }
    }
  </script>

  <!-- ── Scripts de la app (con defer) ─────────────────── -->
  <script src="/js/app.js" defer></script>

</body>
</html>
```

---

## 12. Checklist de integración

Antes de aprobar un módulo nuevo como parte del ecosistema ALAS:

### Archivos

- [ ] `alas-transition.js` — copia exacta de `logistic-launcher/public/alas-transition.js`
- [ ] `ui-protection.js` — copia exacta de `logistic-launcher/public/ui-protection.js`
- [ ] `alas-sso-config.js` — presente y en `.gitignore`
- [ ] `alas-auth-client.js` — cliente SSO estándar
- [ ] `alas-sso-config.example.js` — commiteado como referencia sin el secreto real
- [ ] `assets/icon-192.png` — ícono ALAS oficial

### index.html

- [ ] `<link rel="icon">` con `icon-192.png`
- [ ] `<link rel="manifest">` con `manifest.json`
- [ ] `<meta name="theme-color" content="#0B5F8D">`
- [ ] Fuentes Inter + Sora desde Google Fonts
- [ ] `alas-transition.js` cargado SIN defer
- [ ] `alas-sso-config.js` cargado SIN defer
- [ ] `alas-auth-client.js` cargado SIN defer
- [ ] `ui-protection.js` cargado CON defer
- [ ] `ALASTransition.init()` llamado sincrónicamente en `<body>`
- [ ] Failsafe loader con timeout de 30 segundos
- [ ] Función `alasGoToLauncher()` definida globalmente

### CSS

- [ ] `#alas-root` (o el contenedor raíz) tiene `overflow: hidden`
- [ ] `body` tiene `overflow-x: hidden`
- [ ] Loaders usan `opacity: 0 + pointer-events: none` (NO `display: none`) para animaciones
- [ ] Sin `will-change` permanente en elementos estáticos o filas de tabla

### SSO y sesión

- [ ] URL limpiada con `history.replaceState()` inmediatamente al recibir el token
- [ ] `doSessionExpired()` sobreescrito → redirige al launcher (NO muestra login local)
- [ ] `logout()` sobreescrito → redirige al launcher
- [ ] Sin login local propio (el launcher es el único punto de autenticación)

### Navegación

- [ ] Botón "Volver al menú" presente en sidebar / navbar
- [ ] Usa `ALASTransition.exitToLauncher(url)` con `e.preventDefault()`
- [ ] URL leída desde `ALAS_SSO_CONFIG.launcherUrl` (no hardcodeada)
- [ ] Fallback a `window.location.href` si ALASTransition no está disponible

### Rendimiento visual

- [ ] Sin `backdrop-filter` en overlays fullscreen (usar fondo sólido semiopaco)
- [ ] Sin `will-change` en filas de tabla ni en elementos con animación one-shot
- [ ] Sin `location.reload()` en eventos de resize (a menos que sea estrictamente necesario)

---

## 13. Archivos canónicos por proyecto

| Archivo | Fuente canónica | Copiar a |
|---|---|---|
| `alas-transition.js` | `logistic-launcher/public/alas-transition.js` | `js/` de cada módulo |
| `ui-protection.js` | `logistic-launcher/public/ui-protection.js` | `js/` de cada módulo |
| `icon-192.png` | `logistic-launcher/public/icon-192.png` | `assets/` de cada módulo |
| `alas-auth-client.js` | `cajaventa/js/alas-auth-client.js` | `js/` de módulos vanilla |
| `alas-bypass.js` | `itemsborrados/alas-bypass.js` | módulos que usan login local como fallback |

### Estado actual por módulo

| Módulo | alas-transition.js | ui-protection.js | favicon | brand color | fuentes |
|---|---|---|---|---|---|
| logistic-launcher | ✅ canónico | ❌ falta | ✅ | ✅ #0B5F8D | ✅ Inter+Sora |
| cajaventa | ✅ sincronizado | ✅ | ❌ sin `<link>` | ⚠️ #3B82F6 | ⚠️ +FontAwesome |
| Calendario tareas Alas | ✅ sincronizado | ❌ falta | ✅ /assets/ | — | ✅ Inter |
| itemsborrados | ✅ sincronizado | ❌ falta | ✅ /assets/ | — | ⚠️ sistema |

---

*Documento creado: junio 2026. Mantener actualizado en cada cambio al launcher canónico.*
