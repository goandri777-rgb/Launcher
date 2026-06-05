# Guía de Setup — ALAS Launcher 2.0 en Arch Linux
> Guía actualizada para este sistema exacto. Tachado = ya está hecho.

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

## Estado actual de este sistema (junio 2026)

| Herramienta | Estado |
|---|---|
| Arch Linux | ✅ Instalado |
| Git 2.54.0 | ✅ Instalado |
| Node.js v26.2.0 | ✅ Instalado |
| npm 11.13.0 | ✅ Instalado |
| yay (AUR helper) | ✅ Instalado |
| VS Code | ✅ Instalado (en uso) |
| Claude Code | ✅ Instalado y activo |
| SSH keys (4 claves) | ❌ Pendiente — pasos 1-3 abajo |
| Remotes → SSH | ❌ Pendiente — paso 4 abajo |
| Repos clonados | ✅ En `/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/` |
| Emails por repo | ✅ Corregidos |
| Dependencias (npm install) | Verificar por repo |

---

## PASO 1 — Configurar identidad global de Git

```bash
git config --global user.name "eladripc"
git config --global user.email "therminator298@gmail.com"
```

> El email global es de respaldo. Cada repo tiene su email correcto configurado individualmente.

---

## PASO 2 — Generar las 4 claves SSH

```bash
# Crear la carpeta si no existe
mkdir -p ~/.ssh
chmod 700 ~/.ssh

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

---

## PASO 3 — Crear el archivo de configuración SSH

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
chmod 600 ~/.ssh/config
```

### 3.1 — Agregar cada clave pública a su cuenta de GitHub

Hacé esto 4 veces, una por cuenta:

```bash
cat ~/.ssh/id_launcher.pub
```
Copiá todo → abrí **github.com** → iniciá sesión con **goandri777@gmail.com**
→ foto → **Settings** → **SSH and GPG keys** → **New SSH key** → pegá → **Add SSH key**

```bash
cat ~/.ssh/id_cajaventa.pub
```
Copiá → **github.com** → iniciá sesión con **cajaventas8@gmail.com** → mismos pasos

```bash
cat ~/.ssh/id_itemsborrados.pub
```
Copiá → **github.com** → iniciá sesión con **lcc1alasdeposito@gmail.com** → mismos pasos

```bash
cat ~/.ssh/id_calendario.pub
```
Copiá → **github.com** → iniciá sesión con **therminator298@gmail.com** → mismos pasos

### 3.2 — Verificar que las 4 conexiones funcionan

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

## PASO 4 — Cambiar los remotes de HTTPS a SSH

Los repos fueron clonados con HTTPS. Después de configurar SSH, cambiar cada remote:

```bash
cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/logistic-launcher"
git remote set-url origin git@github-launcher:goandri777-rgb/Launcher.git

cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/cajaventa"
git remote set-url cajaventas8 git@github-cajaventa:cajaventas8-ux/Cajaventa.git

cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/itemsborrados"
git remote set-url origin git@github-itemsborrados:lcc1alasdeposito-a11y/ITEMSBORRADOS.git

cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/Calendario\ tareas\ Alas"
git remote set-url origin git@github-calendario:therminator298-source/ALAS.git
```

Verificar que quedó bien:

```bash
cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/logistic-launcher"
git remote -v
# origin  git@github-launcher:goandri777-rgb/Launcher.git (fetch)
```

---

## PASO 5 — Instalar dependencias (si aún no se hizo)

```bash
cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/logistic-launcher"
npm install

cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/cajaventa"
npm install

cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/ACUSE"
npm install
```

---

## PASO 6 — Copiar los archivos secretos (.env y configs SSO)

Estos NO están en Git. Copiá desde tu PC de trabajo (USB o email a vos mismo).

| Archivo | Destino |
|---------|---------|
| `logistic-launcher/.env` | `/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/logistic-launcher/.env` |
| `cajaventa/js/alas-sso-config.js` | `/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/cajaventa/js/alas-sso-config.js` |
| `itemsborrados/alas-sso-config.js` | `/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/itemsborrados/alas-sso-config.js` |
| `Calendario tareas Alas/sso-config.js` | `/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/Calendario tareas Alas/sso-config.js` |

### Contenido del .env del Launcher:

```env
VITE_SUPABASE_URL=https://xkgumqztscqcwamtimuh.supabase.co
VITE_SUPABASE_ANON_KEY=(copiá desde el .env de Windows)
VITE_SSO_SECRET=(copiá desde el .env de Windows)
VITE_LAUNCHER_URL=https://launcher-tawny.vercel.app
```

---

## PASO 7 — Levantar los proyectos

Abrí terminales separadas para cada servidor:

```bash
# Terminal 1 — Launcher
cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/logistic-launcher"
npm run dev
# → http://localhost:5173

# Terminal 2 — CajaVenta
cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/cajaventa"
node server.js
# → http://localhost:3000

# Terminal 3 — Calendario (rebuild si cambiaste src/)
cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/Calendario tareas Alas"
node scripts/build.js
npx http-server -p 8080 --cors -c-1 .
# → http://localhost:8080

# Terminal 4 — ItemsBorrados
cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/itemsborrados"
node server.js
# → http://localhost:4000
```

---

## Flujo diario de trabajo

```bash
# 1. Antes de empezar — bajar los últimos cambios
cd "/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/logistic-launcher"
git pull

# 2. Trabajar con Claude Code (ya está activo en VS Code)

# 3. Al terminar — subir cambios
git add nombre-archivo.jsx
git commit -m "descripcion del cambio"
git push
```

> Cada repo usa automáticamente la cuenta de GitHub correcta gracias al archivo
> `~/.ssh/config` configurado en el Paso 3.

---

## Solución de problemas comunes

### "Permission denied (publickey)" al hacer push
```bash
# Iniciar el agente SSH y cargar las claves
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_launcher
ssh-add ~/.ssh/id_cajaventa
ssh-add ~/.ssh/id_itemsborrados
ssh-add ~/.ssh/id_calendario

# Para que el agente arranque automáticamente, agregá esto a ~/.bashrc:
# eval "$(ssh-agent -s)" > /dev/null 2>&1

# Probar la conexión
ssh -T git@github-launcher
```

### El agente SSH no persiste entre reinicios (Arch Linux)
```bash
# Opción 1 — Agregar al ~/.bashrc (inicia el agente en cada terminal):
echo 'eval "$(ssh-agent -s)" > /dev/null 2>&1' >> ~/.bashrc
echo 'ssh-add ~/.ssh/id_launcher ~/.ssh/id_cajaventa ~/.ssh/id_itemsborrados ~/.ssh/id_calendario 2>/dev/null' >> ~/.bashrc

# Opción 2 — Usar el agente de GNOME Keyring (si usás entorno gráfico):
# ya gestiona las claves automáticamente al iniciar sesión
```

### "command not found: node" en terminal nueva
```bash
# Node fue instalado con pacman, debería estar siempre disponible.
# Si no aparece, verificar:
which node
node --version
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

### Instalar herramientas adicionales en Arch Linux
```bash
# En Arch se usa pacman (no apt ni snap):
sudo pacman -S git                        # git
sudo pacman -S nodejs npm                 # Node.js y npm
yay -S visual-studio-code-bin             # VS Code (via AUR)
npm install -g @anthropic-ai/claude-code  # Claude Code
```

---

## Emails configurados por repo (ya corregidos)

| Repo | Email local | Cuenta GitHub |
|---|---|---|
| `logistic-launcher` | goandri777@gmail.com | goandri777-rgb |
| `cajaventa` | cajaventas8@gmail.com | cajaventas8-ux |
| `itemsborrados` | lcc1alasdeposito@gmail.com | lcc1alasdeposito-a11y |
| `Calendario tareas Alas` | therminator298@gmail.com | therminator298-source |

Para verificar o cambiar en cualquier repo:
```bash
git config user.email              # ver el actual
git config user.email "nuevo@mail" # cambiar
```

---

## Checklist final

- [x] Git instalado y configurado
- [x] Node.js v26 instalado
- [x] VS Code instalado
- [x] Claude Code activo
- [x] 4 repositorios clonados en `/home/eladripc/LAUNCHER ALAS/LAUNCHER 2.0/`
- [x] Email configurado correctamente en cada repo
- [ ] SSH keys generadas (4 claves — una por cuenta) → Paso 2
- [ ] Archivo `~/.ssh/config` creado con los 4 alias → Paso 3
- [ ] Claves públicas agregadas a cada cuenta de GitHub → Paso 3.1
- [ ] Conexiones SSH verificadas → Paso 3.2
- [ ] Remotes cambiados de HTTPS a SSH → Paso 4
- [ ] Archivos `.env` y `sso-config.js` copiados desde Windows → Paso 6
- [ ] Dependencias instaladas (`npm install`) → Paso 5
- [ ] Proyectos corriendo correctamente → Paso 7

---

*Guía actualizada para Arch Linux — junio 2026*
