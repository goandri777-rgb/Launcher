# Guía de Setup — ALAS Launcher 2.0 en Linux
> Seguí esta guía de arriba a abajo. Al final tenés el ambiente 100% idéntico al de Windows.

---

## PASO 1 — Actualizar el sistema

Abrí una terminal (`Ctrl + Alt + T`) y ejecutá:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## PASO 2 — Instalar Git

```bash
sudo apt install git -y

# Verificar instalación
git --version
```

### Configurar tu identidad (OBLIGATORIO para commits)

```bash
git config --global user.name "Tu Nombre Completo"
git config --global user.email "therminator298@gmail.com"

# Verificar que quedó bien
git config --global --list
```

> **¿Por qué el email?** Git necesita el email para firmar cada commit con tu identidad.
> No es una contraseña ni acceso — es solo etiqueta de autoría. Usá el mismo
> email que usás en tu cuenta de GitHub.

---

## PASO 3 — Autenticación con GitHub (para poder hacer push)

Tenés dos opciones. La opción A es la más cómoda a largo plazo.

### Opción A — SSH Key (recomendado, no pedirá contraseña nunca más)

```bash
# 1. Generar la clave SSH
ssh-keygen -t ed25519 -C "therminator298@gmail.com"
# Presionar Enter 3 veces (acepta defaults, sin passphrase)

# 2. Copiar la clave pública
cat ~/.ssh/id_ed25519.pub
```

Copiá todo el texto que aparece. Luego:
1. Ir a **GitHub.com** → tu foto → **Settings**
2. **SSH and GPG keys** → **New SSH key**
3. Pegar la clave copiada → **Add SSH key**

```bash
# 3. Verificar que funciona
ssh -T git@github.com
# Debe responder: "Hi goandri777-rgb! You've successfully authenticated..."
```

---

### Opción B — HTTPS con Token (más simple pero pide token en cada push)

1. Ir a **GitHub.com** → tu foto → **Settings**
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token** → seleccionar scope `repo` → copiar el token generado

```bash
# Guardar credenciales para no escribirlas cada vez
git config --global credential.helper store
# La primera vez que hagas push te pedirá usuario y token — después lo guarda
```

---

## PASO 4 — Instalar Node.js (via NVM)

NVM te permite manejar versiones de Node fácilmente:

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recargar terminal
source ~/.bashrc

# Instalar Node.js LTS
nvm install --lts
nvm use --lts

# Verificar
node --version    # debe mostrar v20.x o superior
npm --version     # debe mostrar 10.x o superior
```

---

## PASO 5 — Instalar VS Code

```bash
sudo snap install code --classic
```

Si snap no está disponible en tu distro:

```bash
# Descargar .deb desde el sitio oficial
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code -y
```

---

## PASO 6 — Instalar Claude Code (la IA con la que trabajamos)

```bash
npm install -g @anthropic-ai/claude-code
```

Obtené tu API Key en: **console.anthropic.com** → API Keys → Create key

```bash
# Configurar la API key
claude
# La primera vez te pedirá la API key — pegala y Enter
```

---

## PASO 7 — Crear la carpeta de trabajo y clonar los repositorios

```bash
# Crear carpeta principal
mkdir -p ~/Escritorio/LAUNCHER-2.0
cd ~/Escritorio/LAUNCHER-2.0
```

### Clonar con SSH (si elegiste Opción A):

```bash
git clone git@github.com:goandri777-rgb/Launcher.git logistic-launcher
git clone git@github.com:cajaventas8-ux/Cajaventa.git cajaventa
git clone git@github.com:lcc1alasdeposito-a11y/ITEMSBORRADOS.git itemsborrados
git clone git@github.com:therminator298-source/ALAS.git "Calendario tareas Alas"
```

### Clonar con HTTPS (si elegiste Opción B):

```bash
git clone https://github.com/goandri777-rgb/Launcher.git logistic-launcher
git clone https://github.com/cajaventas8-ux/Cajaventa.git cajaventa
git clone https://github.com/lcc1alasdeposito-a11y/ITEMSBORRADOS.git itemsborrados
git clone https://github.com/therminator298-source/ALAS.git "Calendario tareas Alas"
```

---

## PASO 8 — Instalar dependencias de cada proyecto

```bash
# Launcher (React + Vite)
cd ~/Escritorio/LAUNCHER-2.0/logistic-launcher
npm install

# CajaVenta (Node.js)
cd ~/Escritorio/LAUNCHER-2.0/cajaventa
npm install

# ACUSE (si tiene dependencias)
cd ~/Escritorio/LAUNCHER-2.0/ACUSE
npm install
```

---

## PASO 9 — Copiar los archivos secretos (.env y configs SSO)

Estos archivos NO están en Git porque contienen contraseñas y tokens.
Tenés que copiarlos manualmente desde tu PC de trabajo.

### Archivos que necesitás copiar:

| Archivo origen (Windows) | Destino en Linux |
|--------------------------|-----------------|
| `logistic-launcher/.env` | `~/Escritorio/LAUNCHER-2.0/logistic-launcher/.env` |
| `cajaventa/js/alas-sso-config.js` | `~/Escritorio/LAUNCHER-2.0/cajaventa/js/alas-sso-config.js` |
| `itemsborrados/alas-sso-config.js` | `~/Escritorio/LAUNCHER-2.0/itemsborrados/alas-sso-config.js` |
| `Calendario tareas Alas/sso-config.js` | `~/Escritorio/LAUNCHER-2.0/Calendario tareas Alas/sso-config.js` |

### Contenido del archivo .env del Launcher:

```env
VITE_SUPABASE_URL=https://xkgumqztscqcwamtimuh.supabase.co
VITE_SUPABASE_ANON_KEY=(tu anon key de Supabase)
VITE_SSO_SECRET=(tu secreto de 64 hex chars)
VITE_LAUNCHER_URL=https://launcher-tawny.vercel.app
```

> Abrí el archivo .env en Windows, copiá el contenido y creá el mismo archivo en Linux.

---

## PASO 10 — Levantar los proyectos

### Launcher (React + Vite)
```bash
cd ~/Escritorio/LAUNCHER-2.0/logistic-launcher
npm run dev
# → abre http://localhost:5173
```

### CajaVenta
```bash
cd ~/Escritorio/LAUNCHER-2.0/cajaventa
node server.js
# → abre http://localhost:3000
```

### Calendario Tareas
```bash
cd ~/Escritorio/LAUNCHER-2.0/Calendario\ tareas\ Alas

# Si hiciste cambios en src/, primero rebuild:
node scripts/build.js

# Levantar servidor
npx http-server -p 8080 --cors -c-1 .
# → abre http://localhost:8080
```

### Items Borrados
```bash
cd ~/Escritorio/LAUNCHER-2.0/itemsborrados
node server.js
# → abre http://localhost:4000
```

---

## Flujo de trabajo diario con Git

### Ver qué archivos cambiaron
```bash
git status
```

### Hacer commit de un archivo específico
```bash
git add nombre-del-archivo.jsx
git commit -m "descripcion del cambio"
```

### Subir al repositorio remoto
```bash
git push origin main
```

### Bajar cambios que hiciste desde otro lado
```bash
git pull origin main
```

### Ver historial de commits
```bash
git log --oneline -10
```

---

## Abrir el proyecto con Claude Code (igual que acá)

```bash
cd ~/Escritorio/LAUNCHER-2.0/logistic-launcher
claude
```

Claude Code detecta automáticamente el proyecto y la memoria guardada.
Podés pedirle exactamente lo mismo que acá — tiene toda la memoria del proyecto.

---

## Extensiones de VS Code recomendadas

Abrí VS Code y instalá estas extensiones desde el marketplace:

- **Claude Code** (Anthropic) — integración con IA
- **ES7+ React/Redux/React-Native snippets** — snippets para React
- **Tailwind CSS IntelliSense** — autocompletado de clases Tailwind
- **GitLens** — historial y diff de Git en el editor
- **Prettier** — formateo automático de código
- **Auto Rename Tag** — renombra tags HTML/JSX automáticamente

---

## Solución de problemas comunes

### "Permission denied" al hacer push con SSH
```bash
# Verificar que el agente SSH está corriendo
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### "command not found: node" después de instalar NVM
```bash
source ~/.bashrc
nvm use --lts
```

### Puerto ya en uso
```bash
# Ver qué proceso usa el puerto (ej: 5173)
lsof -i :5173
# Matar ese proceso
kill -9 <PID>
```

### Error al instalar dependencias con npm
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## Resumen rápido de lo que necesitás

| ¿Qué? | ¿Para qué? | ¿El email es necesario? |
|-------|------------|------------------------|
| `git config user.email` | Firmar tus commits | **Sí — siempre** |
| SSH key / Token GitHub | Hacer push al repo | **Sí — una sola vez** |
| `.env` y `sso-config.js` | Conectar con Supabase y SSO | **Sí — copiar manualmente** |
| `node` + `npm` | Correr los proyectos | No necesita email |
| Claude Code API key | Usar la IA | No necesita email |

---

*Guía generada para el ecosistema ALAS Launcher 2.0 — junio 2026*
