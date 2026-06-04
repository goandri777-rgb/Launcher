# Guía de Setup — ALAS Launcher 2.0 en Linux
> Seguí esta guía de arriba a abajo. Al final tenés el ambiente 100% idéntico al de Windows.

---

## Tus cuentas de GitHub — mapa de repos

| Proyecto | Email | Cuenta GitHub |
|----------|-------|---------------|
| **logistic-launcher** | goandri777@gmail.com | goandri777-rgb |
| **cajaventa** | cajaventas8@gmail.com | cajaventas8-ux |
| **itemsborrados** | lcc1alasdeposito@gmail.com | lcc1alasdeposito-a11y |
| **Calendario tareas Alas** | therminator298@gmail.com | therminator298-source |

> Tenés 4 cuentas distintas. Por eso el setup de SSH necesita una clave por cuenta.

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
git --version
```

### Configurar identidad global (nombre base — el email se configura por repo)

```bash
git config --global user.name "AGOMEZ"
git config --global user.email "therminator298@gmail.com"
```

> El email global es el de respaldo. Más adelante configuramos el email correcto
> en cada repositorio individualmente.

---

## PASO 3 — Instalar Node.js (via NVM)

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
npm --version
```

---

## PASO 4 — Instalar VS Code

```bash
sudo snap install code --classic
```

---

## PASO 5 — Instalar Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Obtené tu API Key en **console.anthropic.com** → API Keys → Create key

```bash
claude
# La primera vez te pide la API key — pegala y Enter
```

---

## PASO 6 — Configurar SSH para 4 cuentas de GitHub

Como tenés 4 cuentas distintas, necesitás una clave SSH por cuenta y un archivo
de configuración que le diga a Git cuál usar para cada repo.

### 6.1 — Generar las 4 claves SSH

```bash
# Clave para el Launcher (goandri777)
ssh-keygen -t ed25519 -C "goandri777@gmail.com" -f ~/.ssh/id_launcher
# Presionar Enter 2 veces (sin passphrase)

# Clave para CajaVenta (cajaventas8)
ssh-keygen -t ed25519 -C "cajaventas8@gmail.com" -f ~/.ssh/id_cajaventa

# Clave para ItemsBorrados (lcc1alasdeposito)
ssh-keygen -t ed25519 -C "lcc1alasdeposito@gmail.com" -f ~/.ssh/id_itemsborrados

# Clave para Calendario (therminator298)
ssh-keygen -t ed25519 -C "therminator298@gmail.com" -f ~/.ssh/id_calendario
```

### 6.2 — Crear el archivo de configuración SSH

```bash
nano ~/.ssh/config
```

Pegá exactamente esto:

```
# Launcher — goandri777
Host github-launcher
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_launcher

# CajaVenta — cajaventas8
Host github-cajaventa
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_cajaventa

# ItemsBorrados — lcc1alasdeposito
Host github-itemsborrados
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_itemsborrados

# Calendario — therminator298
Host github-calendario
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_calendario
```

Guardá: `Ctrl + O` → Enter → `Ctrl + X`

```bash
# Ajustar permisos (obligatorio)
chmod 600 ~/.ssh/config
```

### 6.3 — Agregar cada clave pública a su cuenta de GitHub

Hacé esto 4 veces, una por cuenta:

```bash
# Ver la clave pública del Launcher
cat ~/.ssh/id_launcher.pub
```
Copiá todo el texto → abrí **github.com** → iniciar sesión con **goandri777@gmail.com**
→ tu foto → **Settings** → **SSH and GPG keys** → **New SSH key** → pegá → **Add SSH key**

```bash
# Ver la clave pública de CajaVenta
cat ~/.ssh/id_cajaventa.pub
```
Copiá → **github.com** → iniciá sesión con **cajaventas8@gmail.com** → mismos pasos

```bash
# Ver la clave pública de ItemsBorrados
cat ~/.ssh/id_itemsborrados.pub
```
Copiá → **github.com** → iniciá sesión con **lcc1alasdeposito@gmail.com** → mismos pasos

```bash
# Ver la clave pública de Calendario
cat ~/.ssh/id_calendario.pub
```
Copiá → **github.com** → iniciá sesión con **therminator298@gmail.com** → mismos pasos

### 6.4 — Verificar que las 4 conexiones funcionan

```bash
ssh -T git@github-launcher
# Debe responder: "Hi goandri777-rgb! You've successfully authenticated..."

ssh -T git@github-cajaventa
# Debe responder: "Hi cajaventas8-ux! You've successfully authenticated..."

ssh -T git@github-itemsborrados
# Debe responder: "Hi lcc1alasdeposito-a11y! You've successfully authenticated..."

ssh -T git@github-calendario
# Debe responder: "Hi therminator298-source! You've successfully authenticated..."
```

---

## PASO 7 — Crear la carpeta y clonar los repositorios

```bash
mkdir -p ~/Escritorio/LAUNCHER-2.0
cd ~/Escritorio/LAUNCHER-2.0
```

```bash
# Launcher — usa el alias github-launcher
git clone git@github-launcher:goandri777-rgb/Launcher.git logistic-launcher

# CajaVenta — usa el alias github-cajaventa
git clone git@github-cajaventa:cajaventas8-ux/Cajaventa.git cajaventa

# ItemsBorrados — usa el alias github-itemsborrados
git clone git@github-itemsborrados:lcc1alasdeposito-a11y/ITEMSBORRADOS.git itemsborrados

# Calendario — usa el alias github-calendario
git clone git@github-calendario:therminator298-source/ALAS.git "Calendario tareas Alas"
```

### Configurar el email correcto en cada repo

```bash
cd ~/Escritorio/LAUNCHER-2.0/logistic-launcher
git config user.email "goandri777@gmail.com"

cd ~/Escritorio/LAUNCHER-2.0/cajaventa
git config user.email "cajaventas8@gmail.com"

cd ~/Escritorio/LAUNCHER-2.0/itemsborrados
git config user.email "lcc1alasdeposito@gmail.com"

cd ~/Escritorio/LAUNCHER-2.0/Calendario\ tareas\ Alas
git config user.email "therminator298@gmail.com"
```

---

## PASO 8 — Instalar dependencias

```bash
cd ~/Escritorio/LAUNCHER-2.0/logistic-launcher
npm install

cd ~/Escritorio/LAUNCHER-2.0/cajaventa
npm install

cd ~/Escritorio/LAUNCHER-2.0/ACUSE
npm install
```

---

## PASO 9 — Copiar los archivos secretos (.env y configs SSO)

Estos NO están en Git. Tenés que copiarlos desde tu PC de trabajo (USB o email a vos mismo).

| Archivo | Destino |
|---------|---------|
| `logistic-launcher/.env` | `~/Escritorio/LAUNCHER-2.0/logistic-launcher/.env` |
| `cajaventa/js/alas-sso-config.js` | `~/Escritorio/LAUNCHER-2.0/cajaventa/js/alas-sso-config.js` |
| `itemsborrados/alas-sso-config.js` | `~/Escritorio/LAUNCHER-2.0/itemsborrados/alas-sso-config.js` |
| `Calendario tareas Alas/sso-config.js` | `~/Escritorio/LAUNCHER-2.0/Calendario tareas Alas/sso-config.js` |

### Contenido del .env del Launcher (completar con tus valores):

```env
VITE_SUPABASE_URL=https://xkgumqztscqcwamtimuh.supabase.co
VITE_SUPABASE_ANON_KEY=(copiá desde el .env de Windows)
VITE_SSO_SECRET=(copiá desde el .env de Windows)
VITE_LAUNCHER_URL=https://launcher-tawny.vercel.app
```

---

## PASO 10 — Levantar los proyectos

```bash
# Launcher
cd ~/Escritorio/LAUNCHER-2.0/logistic-launcher
npm run dev
# → http://localhost:5173

# CajaVenta
cd ~/Escritorio/LAUNCHER-2.0/cajaventa
node server.js
# → http://localhost:3000

# Calendario (rebuild si cambiaste src/)
cd ~/Escritorio/LAUNCHER-2.0/Calendario\ tareas\ Alas
node scripts/build.js
npx http-server -p 8080 --cors -c-1 .
# → http://localhost:8080

# ItemsBorrados
cd ~/Escritorio/LAUNCHER-2.0/itemsborrados
node server.js
# → http://localhost:4000
```

---

## Flujo diario de trabajo

```bash
# 1. Antes de empezar — bajar los últimos cambios
cd ~/Escritorio/LAUNCHER-2.0/logistic-launcher
git pull origin main

# 2. Trabajar con Claude Code
claude

# 3. Al terminar — subir cambios
git add nombre-archivo.jsx
git commit -m "descripcion del cambio"
git push origin main
```

> Cada repo usa automáticamente la cuenta de GitHub correcta gracias al archivo
> ~/.ssh/config que configuramos en el Paso 6.

---

## Extensiones de VS Code recomendadas

Abrí VS Code y buscalas en el marketplace (icono de cuadraditos a la izquierda):

- **Claude Code** (Anthropic)
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **GitLens**
- **Prettier**
- **Auto Rename Tag**

---

## Solución de problemas comunes

### "Permission denied (publickey)" al hacer push
```bash
# Verificar que el agente SSH tiene las claves cargadas
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_launcher
ssh-add ~/.ssh/id_cajaventa
ssh-add ~/.ssh/id_itemsborrados
ssh-add ~/.ssh/id_calendario

# Probar la conexión de nuevo
ssh -T git@github-launcher
```

### "command not found: node"
```bash
source ~/.bashrc
nvm use --lts
```

### Puerto ocupado
```bash
lsof -i :5173    # ver qué proceso usa el puerto
kill -9 <PID>    # cerrar ese proceso
```

### Error de dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Resumen final — checklist

- [ ] Git instalado y configurado
- [ ] SSH keys generadas (4 claves — una por cuenta)
- [ ] Archivo `~/.ssh/config` creado con los 4 alias
- [ ] Claves públicas agregadas a cada cuenta de GitHub
- [ ] Node.js instalado via NVM
- [ ] VS Code instalado
- [ ] Claude Code instalado con API key
- [ ] 4 repositorios clonados
- [ ] Email configurado en cada repo individualmente
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivos `.env` y `sso-config.js` copiados desde Windows
- [ ] Proyectos corriendo correctamente

---

*Guía generada para el ecosistema ALAS Launcher 2.0 — junio 2026*
