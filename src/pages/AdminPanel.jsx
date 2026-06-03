import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, UserPlus, ShieldCheck, ShieldX, Ban, CheckCircle2,
  X, Clock, Link2, Eye, EyeOff, Pencil, Check, UserCog,
  Users, Boxes, TrendingUp, AlertTriangle, Trash2,
} from 'lucide-react'
import { adminApi } from '../lib/adminApi'
import { getModuleIcon } from '../data/icons'
import { useAuth } from '../lib/AuthContext'

const ROLES  = ['admin', 'supervisor', 'operador', 'invitado']
const EASE   = [0.16, 1, 0.3, 1]
const SPRING = { type: 'spring', stiffness: 400, damping: 30, mass: 0.5 }

const C = {
  brand:       '#0B5F8D',              // Azul corporativo ALAS
  brandDark:   '#08486a',              // Azul corporativo oscuro
  brandLight:  'rgba(11, 95, 141, 0.08)', // Glass acento
  border:      'rgba(11, 95, 141, 0.12)',  // Bordes sutiles
  borderHov:   'rgba(11, 95, 141, 0.32)',  // Borde de enfoque
  borderFocus: 'rgba(11, 95, 141, 0.50)',
  bg:          'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)', // Fondo light cyberpunk limpio
  surface:     'rgba(255, 255, 255, 0.75)', // Glassmorphism translúcido claro
  surfaceHov:  'rgba(11, 95, 141, 0.04)',
  text1:       '#0f172a',              // Slate 900
  text2:       '#334155',              // Slate 700
  text3:       '#64748b',              // Slate 500
  text4:       '#94a3b8',              // Slate 400
  green:       '#10b981',              // Verde
  amber:       '#f59e0b',              // Ámbar
  red:         '#ef4444',              // Rojo
  glass:       'rgba(255, 255, 255, 0.85)', // Cabecera glass clara
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const statusMap = {
  active:   { bg:'rgba(16, 185, 129, 0.06)', fg:'#0f766e', border:'rgba(16, 185, 129, 0.2)',  dot:'#10b981', label: 'ACTIVE'    },
  blocked:  { bg:'rgba(239, 68, 68, 0.06)',  fg:'#dc2626', border:'rgba(239, 68, 68, 0.2)',   dot:'#ef4444', label: 'BLOCKED'   },
  inactive: { bg:'rgba(148, 163, 184, 0.06)', fg:'#475569', border:'rgba(148, 163, 184, 0.2)',  dot:'#94a3b8', label: 'INACTIVE'  },
}
const roleMap = {
  admin:      { bg:'rgba(11, 95, 141, 0.08)', fg:'#0b5f8d',   border:'rgba(11, 95, 141, 0.25)' },
  supervisor: { bg:'rgba(168, 85, 247, 0.08)', fg:'#7c3aed',   border:'rgba(168, 85, 247, 0.22)' },
  operador:   { bg:'rgba(71, 85, 105, 0.06)', fg:'#475569',   border:'rgba(71, 85, 105, 0.18)'  },
  invitado:   { bg:'rgba(100, 116, 139, 0.06)', fg:'#64748b',   border:'rgba(100, 116, 139, 0.18)'  },
}

function normalizeUsernameInput(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 32)
}

function StatusPill({ status }) {
  const s = statusMap[status] || statusMap.inactive
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:99,fontSize:11,fontWeight:500,background:s.bg,color:s.fg,border:`1px solid ${s.border}`}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:s.dot,flexShrink:0}}/>
      {s.label}
    </span>
  )
}
function RolePill({ role }) {
  const r = roleMap[role] || roleMap.operador
  return (
    <span style={{display:'inline-block',padding:'2px 9px',borderRadius:99,fontSize:11,fontWeight:500,background:r.bg,color:r.fg,border:`1px solid ${r.border}`,textTransform:'capitalize'}}>{role}</span>
  )
}
function ActionPill({ action }) {
  return (
    <span style={{display:'inline-block',padding:'2px 9px',borderRadius:99,fontSize:11,fontWeight:500,background:C.brandLight,color:C.brand,border:`1px solid rgba(11,95,141,0.15)`,textTransform:'capitalize'}}>{action}</span>
  )
}

// ─── base ─────────────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      boxShadow: '0 12px 32px 0 rgba(11, 95, 141, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255,255,255,0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── cards ───────────────────────────────────────────────────────────────────
function CardHeader({ title, right }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'15px 20px 13px',
      borderBottom:`1px solid ${C.border}`,
      background: 'rgba(11, 95, 141, 0.03)',
    }}>
      <span style={{fontFamily:'"Sora",system-ui,sans-serif',fontWeight:700,fontSize:13,color:C.text1,letterSpacing:'-0.02em'}}>{title}</span>
      {right && <div>{right}</div>}
    </div>
  )
}

function Th({ children, right }) {
  return (
    <th style={{padding:'10px 20px',textAlign:right?'right':'left',fontWeight:600,color:C.text4,fontSize:10.5,fontFamily:'"JetBrains Mono", monospace',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>
      {children}
    </th>
  )
}

function IconBtn({ title, onClick, icon: Icon, variant = 'default' }) {
  const [hov, setHov] = useState(false)
  const styles = {
    default: { bg:'rgba(59, 130, 246, 0.18)', color:C.brand,  border:'rgba(59, 130, 246, 0.3)',  borderRest:'rgba(59, 130, 246, 0.18)' },
    danger:  { bg:'rgba(239, 68, 68, 0.18)',  color:C.red,    border:'rgba(239, 68, 68, 0.3)',   borderRest:'rgba(239, 68, 68, 0.18)'  },
    success: { bg:'rgba(16, 185, 129, 0.18)', color:C.green,  border:'rgba(16, 185, 129, 0.3)',  borderRest:'rgba(16, 185, 129, 0.18)' },
    ghost:   { bg:C.surfaceHov,               color:C.text3,  border:C.borderHov,                borderRest:C.border                   },
  }
  const s = styles[variant] || styles.default
  return (
    <motion.button title={title} onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      whileHover={{scale:1.1}} whileTap={{scale:0.9}} transition={SPRING}
      style={{
        display:'grid',placeItems:'center',width:42,height:42,borderRadius:11,
        background: hov ? s.bg : 'transparent',
        border: `1px solid ${hov ? s.border : s.borderRest}`,
        color: hov ? s.color : C.text4,
        cursor:'pointer', transition:'all 150ms ease',
        flexShrink: 0,
      }}
    >
      <Icon style={{width:18,height:18}}/>
    </motion.button>
  )
}

// ─── modals ───────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      transition={{duration:0.2,ease:EASE}}
      style={{position:'fixed',inset:0,zIndex:50,display:'grid',placeItems:'center',background:'rgba(15, 23, 42, 0.35)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',padding:16}}
      onClick={onClose}
      aria-hidden="true"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{scale:0.93,y:24,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.93,opacity:0}}
        transition={{type:'spring',stiffness:350,damping:28,mass:0.55}}
        onClick={e=>e.stopPropagation()}
        aria-hidden="false"
      >{children}</motion.div>
    </motion.div>
  )
}

function ModalCard({ children, width=440 }) {
  return (
    <div style={{background:'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))',border:`1px solid ${C.border}`,borderRadius:24,padding:32,width:'100%',maxWidth:width,boxShadow:'0 25px 80px rgba(11, 95, 141, 0.08), inset 0 1px 0 rgba(255,255,255,1)',backdropFilter:'blur(24px)',fontFamily:'"Inter",system-ui,sans-serif'}}>
      {children}
    </div>
  )
}

function ModalHead({ title, sub, onClose }) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
      <div>
        <h2 style={{fontFamily:'"Sora",system-ui,sans-serif',fontWeight:700,fontSize:18,color:C.text1,margin:0}}>{title}</h2>
        {sub && <p style={{fontSize:13,color:C.text3,margin:'4px 0 0'}}>{sub}</p>}
      </div>
      <motion.button onClick={onClose}
        whileHover={{scale:1.1,rotate:90}} whileTap={{scale:0.9}} transition={SPRING}
        style={{background:C.surfaceHov,border:`1px solid ${C.border}`,cursor:'pointer',color:C.text4,padding:6,borderRadius:8,flexShrink:0,display:'grid',placeItems:'center'}}
      >
        <X style={{width:16,height:16}}/>
      </motion.button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{fontSize:10,fontWeight:700,color:C.text3,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>
      {children}
    </div>
  )
}

function Input({ type='text', value, onChange, placeholder, mono }) {
  const [focused, setFocused] = useState(false)
  return (
    <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      style={{width:'100%',borderRadius:10,background:'#ffffff',border:`1px solid ${focused?C.borderFocus:C.border}`,padding:'10px 12px',fontSize:13,color:C.text1,outline:'none',fontFamily:mono?'"JetBrains Mono","Fira Code",monospace':'"Inter",system-ui,sans-serif',boxSizing:'border-box',transition:'border-color 200ms ease, box-shadow 200ms ease',boxShadow:focused?'0 0 0 3px rgba(11, 95, 141, 0.15)':'none'}}
    />
  )
}

function PrimaryBtn({ onClick, disabled, children, icon: Icon }) {
  return (
    <motion.button onClick={onClick} disabled={disabled}
      whileHover={disabled?{}:{scale:1.03,y:-2}} whileTap={disabled?{}:{scale:0.96}} transition={SPRING}
      style={{display:'inline-flex',alignItems:'center',gap:8,padding:'11px 24px',borderRadius:12,background:disabled?'rgba(59,130,246,0.2)':`linear-gradient(135deg,${C.brand},${C.brandDark})`,border:'none',color:'#fff',fontSize:13.5,fontWeight:600,fontFamily:'"JetBrains Mono",monospace',cursor:disabled?'not-allowed':'pointer',boxShadow:disabled?'none':`0 4px 16px rgba(59,130,246,0.25)`,letterSpacing:'-0.01em'}}
    >
      {Icon && <Icon style={{width:14,height:14}}/>}{children}
    </motion.button>
  )
}

// ─── buttons ──────────────────────────────────────────────────────────────────
function GhostBtn({ onClick, children }) {
  return (
    <motion.button onClick={onClick}
      whileHover={{scale:1.02}} whileTap={{scale:0.97}} transition={SPRING}
      style={{padding:'11px 22px',borderRadius:12,background:'transparent',border:`1px solid ${C.border}`,color:C.text2,fontSize:13.5,cursor:'pointer',fontFamily:'"Inter",system-ui,sans-serif',transition:'all 150ms ease'}}
      onMouseEnter={e=>{e.currentTarget.style.background=C.surfaceHov;e.currentTarget.style.borderColor=C.borderHov}}
      onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=C.border}}
    >{children}</motion.button>
  )
}

// ─── permissions modal ────────────────────────────────────────────────────────
function PermissionsModal({ user, modules, onClose, notify }) {
  const [granted, setGranted] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)

  useEffect(()=>{
    adminApi.getUserPermissions(user.id).then(({data})=>{
      setGranted(new Set((data||[]).map(p=>p.module_id)))
      setLoading(false)
    })
  },[user.id])

  const toggle = async mod => {
    setSaving(mod.id)
    const grant = !granted.has(mod.id)
    await adminApi.togglePermission(user.id, mod.id, grant)
    setSaving(null)
    setGranted(prev=>{ const n=new Set(prev); grant?n.add(mod.id):n.delete(mod.id); return n })
    notify(grant?`Acceso a "${mod.name}" otorgado`:`Acceso a "${mod.name}" revocado`)
  }

  const userStatus = user.is_blocked?'blocked':user.is_active?'active':'inactive'

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={580}>
        <ModalHead title="Permisos de acceso" sub={`${user.full_name||user.username||user.email}`} onClose={onClose}/>

        {/* usuario info strip */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,marginBottom:20,background:C.surfaceHov,border:`1px solid ${C.border}`}}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:C.brand,display:'grid',placeItems:'center',fontFamily:'"Sora",system-ui',fontWeight:700,fontSize:14,color:'#fff'}}>
            {(user.full_name||user.email||'U').charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text1}}>{user.full_name||'—'}</div>
            <div style={{fontSize:11,color:C.text3}}>{user.username || user.email}</div>
          </div>
          <RolePill role={user.role}/>
          <StatusPill status={userStatus}/>
        </div>

        {loading ? (
          <div style={{padding:'32px 0',textAlign:'center',color:C.text4,fontSize:13}}>Cargando módulos…</div>
        ) : (
          <motion.div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:320,overflowY:'auto'}}
            initial="h" animate="s" variants={{h:{},s:{transition:{staggerChildren:0.04}}}}
          >
            {modules.map(m=>{
              const on=granted.has(m.id), busy=saving===m.id
              const Icon=getModuleIcon(m.key)
              return (
                <motion.button key={m.id}
                  variants={{h:{opacity:0,y:6},s:{opacity:1,y:0,transition:{duration:0.25,ease:EASE}}}}
                  whileHover={{scale:1.01}} whileTap={{scale:0.99}} transition={SPRING}
                  onClick={()=>!busy&&toggle(m)}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:11,background:on?'#f0f7ff':C.surface,border:`1px solid ${on?'rgba(11,95,141,0.22)':C.border}`,cursor:busy?'wait':'pointer',transition:'background 150ms ease,border-color 150ms ease',fontFamily:'"Inter",system-ui,sans-serif',opacity:busy?0.5:1}}
                >
                  <div style={{width:32,height:32,borderRadius:9,background:on?C.brandLight:'#f8fafc',border:`1px solid ${on?'rgba(11,95,141,0.15)':C.border}`,display:'grid',placeItems:'center',flexShrink:0}}>
                    <Icon style={{width:14,height:14,color:on?C.brand:C.text4}}/>
                  </div>
                  <span style={{flex:1,fontSize:13,color:C.text1,fontWeight:on?600:400,textAlign:'left'}}>{m.name}</span>
                  <span style={{width:38,height:22,borderRadius:99,background:on?C.brand:'rgba(203,213,225,0.6)',position:'relative',flexShrink:0,transition:'background 220ms ease',display:'block'}}>
                    <span style={{position:'absolute',top:3,left:on?19:3,width:16,height:16,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.18)',transition:'left 220ms ease',display:'block'}}/>
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </ModalCard>
    </Overlay>
  )
}

// ─── edit module modal ────────────────────────────────────────────────────────
function EditModuleModal({ module: mod, onClose, onSaved, notify }) {
  const [name, setName] = useState(mod.name||'')
  const [url,  setUrl]  = useState(mod.url||'')
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')
  const Icon = getModuleIcon(mod.key)

  const normalizeUrl = (raw) => {
    const u = raw.trim()
    if (!u) return u
    if (/^https?:\/\//i.test(u)) return u
    return 'https://' + u
  }

  const save = async () => {
    setErr(''); setBusy(true)
    const updates = {}
    if (name.trim() !== mod.name) updates.name = name.trim()
    const cleanUrl = normalizeUrl(url)
    if (cleanUrl !== mod.url) updates.url = cleanUrl
    if (!Object.keys(updates).length) { setBusy(false); onClose(); return }
    const { error } = await adminApi.updateModule(mod.id, updates)
    setBusy(false)
    if (error) { setErr(error.message || 'Error al guardar'); return }
    onSaved()
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={480}>
        <ModalHead title="Editar módulo" onClose={onClose}/>

        <div style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:12,marginBottom:24,background:C.surfaceHov,border:`1px solid ${C.border}`}}>
          <div style={{width:40,height:40,borderRadius:11,background:C.brandLight,border:'1px solid rgba(11,95,141,0.15)',display:'grid',placeItems:'center',flexShrink:0}}>
            <Icon style={{width:18,height:18,color:C.brand}}/>
          </div>
          <div>
            <p style={{fontSize:14,fontWeight:600,color:C.text1,margin:0}}>{mod.name}</p>
            <code style={{fontSize:11,color:C.text3,background:'#f1f5f9',padding:'1px 6px',borderRadius:5,border:`1px solid ${C.border}`}}>{mod.key}</code>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Field label="Nombre del módulo"><Input value={name} onChange={setName}/></Field>
          <Field label="URL de destino">
            <div style={{position:'relative'}}>
              <Link2 style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:13,height:13,color:C.text4,pointerEvents:'none'}}/>
              <input type="text" value={url} placeholder="https://..." onChange={e=>setUrl(e.target.value)}
                style={{width:'100%',borderRadius:10,background:C.surface,border:`1px solid ${C.border}`,padding:'9px 12px 9px 32px',fontSize:12,color:C.text1,outline:'none',fontFamily:'"JetBrains Mono","Fira Code",monospace',boxSizing:'border-box',transition:'border-color 150ms ease'}}
                onFocus={e=>e.target.style.borderColor=C.borderFocus}
                onBlur={e=>e.target.style.borderColor=C.border}
              />
            </div>
            <p style={{fontSize:11,color:C.text4,margin:'5px 0 0'}}>URL que se abre al hacer clic en el módulo desde el Launcher.</p>
          </Field>
          {err && <p style={{color:C.red,fontSize:12,margin:0,padding:'8px 12px',background:'#fff1f2',borderRadius:8,border:'1px solid rgba(239,68,68,0.2)'}}>{err}</p>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={save} disabled={busy} icon={Check}>{busy?'Guardando…':'Guardar cambios'}</PrimaryBtn>
          </div>
        </div>
      </ModalCard>
    </Overlay>
  )
}

// ─── create user modal ────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({username:'',email:'',password:'',fullName:'',role:'operador'})
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')

  const submit = async () => {
    setErr(''); setBusy(true)
    const username = normalizeUsernameInput(form.username)
    const email = form.email.trim()
    if (username.length < 3) {
      setBusy(false)
      setErr('Usuario inválido: usá al menos 3 caracteres.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setBusy(false)
      setErr('Correo electrónico inválido.')
      return
    }
    if (form.password.length < 8) {
      setBusy(false)
      setErr('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    const {error} = await adminApi.createUser(username,email,form.password,form.fullName.trim(),form.role)
    setBusy(false)
    if (error) { setErr(error.message); return }
    onCreated()
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={440}>
        <ModalHead title="Nuevo usuario" sub="Crea la cuenta con acceso al Launcher" onClose={onClose}/>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Field label="Usuario"><Input value={form.username} onChange={v=>setForm({...form,username:normalizeUsernameInput(v)})} placeholder="miguel_casco" mono/></Field>
          <Field label="Nombre completo"><Input value={form.fullName} onChange={v=>setForm({...form,fullName:v})} placeholder="Ej. Juan Pérez"/></Field>
          <Field label="Correo electrónico"><Input type="email" value={form.email} onChange={v=>setForm({...form,email:v})} placeholder="usuario@empresa.com"/></Field>
          <Field label="Contraseña"><Input type="password" value={form.password} onChange={v=>setForm({...form,password:v})} placeholder="Mínimo 8 caracteres"/></Field>
          <Field label="Rol">
            <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
              style={{width:'100%',borderRadius:10,background:'#ffffff',border:`1px solid ${C.border}`,padding:'9px 12px',fontSize:13,color:C.text1,outline:'none',fontFamily:'"Inter",system-ui,sans-serif',textTransform:'capitalize',boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor=C.borderFocus}
              onBlur={e=>e.target.style.borderColor=C.border}
            >
              {ROLES.map(r=><option key={r} value={r} style={{textTransform:'capitalize'}}>{r}</option>)}
            </select>
          </Field>
          {err && <p style={{color:C.red,fontSize:12,margin:0,padding:'8px 12px',background:'#fff1f2',borderRadius:8,border:'1px solid rgba(239,68,68,0.2)'}}>{err}</p>}
          <div style={{paddingTop:4}}>
            <PrimaryBtn onClick={submit} disabled={busy} icon={UserPlus}>{busy?'Creando…':'Crear usuario'}</PrimaryBtn>
          </div>
        </div>
      </ModalCard>
    </Overlay>
  )
}

// ─── delete user modal ────────────────────────────────────────────────────────
function DeleteUserModal({ user, onClose, onDeleted, notify }) {
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')
  const userStatus = user.is_blocked ? 'blocked' : user.is_active ? 'active' : 'inactive'

  const confirm = async () => {
    setErr(''); setBusy(true)
    const { error } = await adminApi.deleteUser(user.id)
    setBusy(false)
    if (error) { setErr(error.message || 'Error al eliminar'); return }
    notify('Usuario eliminado')
    onDeleted()
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={440}>
        <ModalHead title="Eliminar usuario" sub="Esta acción es permanente e irreversible" onClose={onClose}/>

        {/* usuario info strip */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,marginBottom:20,background:'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.18)'}}>
          <div style={{width:38,height:38,borderRadius:11,flexShrink:0,background:`linear-gradient(135deg,${C.brand},${C.brandDark})`,display:'grid',placeItems:'center',fontFamily:'"Sora",system-ui',fontWeight:700,fontSize:15,color:'#fff'}}>
            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.full_name || '—'}</div>
            <div style={{fontSize:11,color:C.text3,marginTop:1}}>{user.username || user.email}</div>
          </div>
          <RolePill role={user.role}/>
          <StatusPill status={userStatus}/>
        </div>

        {/* advertencia */}
        <div style={{display:'flex',gap:10,padding:'12px 14px',borderRadius:10,marginBottom:20,background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.18)'}}>
          <AlertTriangle style={{width:15,height:15,color:C.red,flexShrink:0,marginTop:1}}/>
          <p style={{fontSize:12,color:'#b91c1c',margin:0,lineHeight:1.5}}>
            Se eliminarán la cuenta, todos sus permisos y su acceso al sistema. Los registros de actividad se conservarán sin identificación de usuario.
          </p>
        </div>

        {err && <p style={{color:C.red,fontSize:12,margin:'0 0 16px',padding:'8px 12px',background:'#fff1f2',borderRadius:8,border:'1px solid rgba(239,68,68,0.2)'}}>{err}</p>}

        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
          <motion.button onClick={confirm} disabled={busy}
            whileHover={busy?{}:{scale:1.03,y:-2}} whileTap={busy?{}:{scale:0.96}} transition={SPRING}
            style={{display:'inline-flex',alignItems:'center',gap:8,padding:'11px 22px',borderRadius:12,background:busy?'rgba(239,68,68,0.35)':'linear-gradient(135deg,#ef4444,#dc2626)',border:'none',color:'#fff',fontSize:13.5,fontWeight:600,fontFamily:'"JetBrains Mono",monospace',cursor:busy?'not-allowed':'pointer',boxShadow:busy?'none':'0 4px 16px rgba(239,68,68,0.28)',letterSpacing:'-0.01em'}}
          >
            <Trash2 style={{width:14,height:14}}/>{busy ? 'Eliminando…' : 'Eliminar usuario'}
          </motion.button>
        </div>
      </ModalCard>
    </Overlay>
  )
}

// ─── edit user modal ──────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved, notify }) {
  const [username, setUsername] = useState(user.username || '')
  const [fullName, setFullName] = useState(user.full_name || '')
  const [role,     setRole]     = useState(user.role     || 'operador')
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')

  const save = async () => {
    setErr(''); setBusy(true)
    const updates = {}
    const cleanUsername = normalizeUsernameInput(username)
    if (cleanUsername && cleanUsername !== user.username) updates.username = cleanUsername
    if (fullName.trim() && fullName.trim() !== user.full_name) updates.full_name = fullName.trim()
    if (role !== user.role) updates.role = role
    if (!Object.keys(updates).length) { setBusy(false); onClose(); return }
    const { error } = await adminApi.editUser(user.id, updates)
    setBusy(false)
    if (error) { setErr(error.message || 'Error al guardar'); return }
    notify('Usuario actualizado'); onSaved()
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard width={440}>
        <ModalHead title="Editar usuario" sub={user.full_name || user.email} onClose={onClose}/>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Field label="Usuario">
            <Input value={username} onChange={v=>setUsername(normalizeUsernameInput(v))} placeholder="Usuario de acceso" mono/>
          </Field>
          <Field label="Nombre completo">
            <Input value={fullName} onChange={setFullName} placeholder="Nombre completo"/>
          </Field>
          <Field label="Rol">
            <select value={role} onChange={e=>setRole(e.target.value)}
              style={{width:'100%',borderRadius:10,background:'#ffffff',border:`1px solid ${C.border}`,padding:'9px 12px',fontSize:13,color:C.text1,outline:'none',fontFamily:'"Inter",system-ui,sans-serif',textTransform:'capitalize',boxSizing:'border-box',transition:'border-color 200ms ease'}}
              onFocus={e=>e.target.style.borderColor=C.borderFocus}
              onBlur={e=>e.target.style.borderColor=C.border}
            >
              {ROLES.map(r=><option key={r} value={r} style={{textTransform:'capitalize'}}>{r}</option>)}
            </select>
          </Field>
          {err && <p style={{color:C.red,fontSize:12,margin:0,padding:'8px 12px',background:'#fff1f2',borderRadius:8,border:'1px solid rgba(239,68,68,0.2)'}}>{err}</p>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={save} disabled={busy} icon={Check}>{busy?'Guardando…':'Guardar cambios'}</PrimaryBtn>
          </div>
        </div>
      </ModalCard>
    </Overlay>
  )
}

// ─── stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent, delay=0 }) {
  const a = {
    blue:   { bg:'rgba(59, 130, 246, 0.12)', icon:C.brand,   ring:'rgba(59, 130, 246, 0.25)'   },
    green:  { bg:'rgba(16, 185, 129, 0.12)', icon:'#10b981', ring:'rgba(16, 185, 129, 0.25)'   },
    amber:  { bg:'rgba(245, 158, 11, 0.12)', icon:'#f59e0b', ring:'rgba(245, 158, 11, 0.25)'   },
    purple: { bg:'rgba(168, 85, 247, 0.12)', icon:'#a855f7', ring:'rgba(168, 85, 247, 0.25)'  },
  }[accent] || {}

  return (
    <motion.div
      initial={{opacity:0,y:16,scale:0.97}} animate={{opacity:1,y:0,scale:1}}
      transition={{duration:0.42,delay,ease:EASE}}
      style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:'18px 20px',boxShadow:'0 1px 3px rgba(15,23,42,0.05)',display:'flex',alignItems:'center',gap:16}}
    >
      <div style={{width:46,height:46,borderRadius:13,flexShrink:0,background:a.bg,border:`1px solid ${a.ring}`,display:'grid',placeItems:'center'}}>
        <Icon style={{width:20,height:20,color:a.icon}}/>
      </div>
      <div>
        <p style={{fontSize:26,fontWeight:800,color:C.text1,margin:0,fontFamily:'"Sora",system-ui,sans-serif',letterSpacing:'-0.04em',lineHeight:1}}>{value}</p>
        <p style={{fontSize:12,color:C.text3,margin:'4px 0 0',fontFamily:'"Inter",system-ui',fontWeight:400}}>{label}</p>
      </div>
    </motion.div>
  )
}

// ─── url cell ─────────────────────────────────────────────────────────────────
function UrlCell({ url }) {
  const [vis, setVis] = useState(false)
  if (!url) return <span style={{color:C.text4,fontSize:11,fontStyle:'italic'}}>Sin URL</span>
  return (
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      <span style={{fontSize:11,color:C.text2,fontFamily:vis?'"JetBrains Mono",monospace':'"Inter",system-ui',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:150}}>
        {vis?url:'••••••••••••••'}
      </span>
      <button onClick={()=>setVis(v=>!v)} style={{background:'none',border:'none',cursor:'pointer',color:C.text4,padding:2,flexShrink:0,display:'grid',placeItems:'center'}}>
        {vis?<EyeOff style={{width:11,height:11}}/>:<Eye style={{width:11,height:11}}/>}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const { profile } = useAuth()
  const isReadOnly  = profile?.role !== 'admin'

  const [users,       setUsers]       = useState([])
  const [modules,     setModules]     = useState([])
  const [logs,        setLogs]        = useState([])
  const [selected,     setSelected]     = useState(null)
  const [editing,      setEditing]      = useState(null)
  const [editingUser,  setEditingUser]  = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [showCreate,   setShowCreate]   = useState(false)
  const [toast,       setToast]       = useState('')
  const toastTimer = useRef(null)

  const notify = msg => {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const loadUsers   = useCallback(async()=>{ const {data,error}=await adminApi.listUsers();   if(!error) setUsers(data||[]) },[])
  const loadModules = useCallback(async()=>{ const {data,error}=await adminApi.listModules(); if(!error) setModules(data||[]) },[])
  const loadLogs    = useCallback(async()=>{ const {data,error}=await adminApi.listLogs(8);   if(!error) setLogs(data||[]) },[])

  useEffect(()=>{ loadUsers(); loadModules(); loadLogs() },[loadUsers,loadModules,loadLogs])

  const toggleActive  = async u => { await adminApi.setActive(u.id,!u.is_active);   notify(u.is_active?'Usuario desactivado':'Usuario activado');    loadUsers() }
  const toggleBlocked = async u => { await adminApi.setBlocked(u.id,!u.is_blocked); notify(u.is_blocked?'Usuario desbloqueado':'Usuario bloqueado'); loadUsers() }
  const toggleModule  = async m => { await adminApi.updateModule(m.id,{is_active:!m.is_active}); notify(m.is_active?`"${m.name}" desactivado`:`"${m.name}" activado`); loadModules() }

  const active  = users.filter(u=>u.is_active&&!u.is_blocked).length
  const blocked = users.filter(u=>u.is_blocked).length
  const activeMods = modules.filter(m=>m.is_active).length
  const emailToName = Object.fromEntries(users.map(u => [u.email, u.full_name || u.username || u.email]))


  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{    opacity: 0, y: -7, scale: 0.992, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
      transition={{ duration: 0.42, ease: EASE }}
      style={{minHeight:'100%',display:'flex',flexDirection:'column',fontFamily:'"Inter",system-ui,sans-serif',color:C.text1,background:C.bg}}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}}
        transition={{duration:0.45, delay:0.10, ease:EASE}}
        style={{
          background:C.glass, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          borderBottom:`1px solid ${C.border}`,
          boxShadow:'0 4px 20px rgba(0, 0, 0, 0.15)',
          display:'grid', gridTemplateColumns:'auto 1fr auto',
          alignItems:'center', gap:16,
          padding:'10px 28px',
          position:'sticky', top:0, zIndex:20,
        }}
      >
        <Link to="/" style={{display:'grid',placeItems:'center',width:34,height:34,borderRadius:10,background:'rgba(11, 95, 141, 0.05)',border:`1px solid ${C.border}`,color:C.text3,textDecoration:'none',flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,0.03)',transition:'all 150ms ease'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderHov;e.currentTarget.style.color=C.brand;e.currentTarget.style.background=C.brandLight}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;e.currentTarget.style.background='rgba(11, 95, 141, 0.05)'}}
        >
          <ArrowLeft style={{width:15,height:15}}/>
        </Link>

        <div>
          <h1 style={{fontFamily:'"Sora",system-ui,sans-serif',fontWeight:800,fontSize:15,color:C.text1,letterSpacing:'-0.03em',margin:0}}>
            Panel de administración
          </h1>
          <p style={{fontSize:10.5,color:C.text4,margin:'1px 0 0',fontFamily:'"JetBrains Mono",monospace'}}>
            {users.length} USUARIOS // {modules.length} MODULOS
          </p>
        </div>

        {isReadOnly ? (
          <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:99,background:'rgba(245,158,11,0.10)',border:'1px solid rgba(245,158,11,0.28)',color:'#b45309',fontSize:11,fontWeight:600,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'0.04em'}}>
            👁 SOLO LECTURA
          </span>
        ) : (
          <PrimaryBtn onClick={()=>setShowCreate(true)} icon={UserPlus}>Nuevo usuario</PrimaryBtn>
        )}
      </motion.header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{flex:1,padding:'24px 28px',display:'flex',flexDirection:'column',gap:20}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,minWidth:0}}>
          <StatCard icon={Users}         label="Total usuarios"    value={users.length} accent="blue"   delay={0}    />
          <StatCard icon={CheckCircle2}  label="Usuarios activos"  value={active}       accent="green"  delay={0.07} />
          <StatCard icon={Boxes}         label="Módulos activos"   value={activeMods}   accent="purple" delay={0.14} />
          <StatCard icon={AlertTriangle} label="Bloqueados"        value={blocked}      accent="amber"  delay={0.21} />
        </div>

        {/* Main grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 420px',gap:18,alignItems:'start'}}>

          {/* ── Usuarios ───────────────────────────────────────────────────── */}
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.42,delay:0.26,ease:EASE}}>
            <Card>
              <CardHeader title="Usuarios" right={
                <span style={{fontSize:11,color:C.text4,background:C.surfaceHov,padding:'3px 9px',borderRadius:99,border:`1px solid ${C.border}`}}>
                  {users.length} total
                </span>
              }/>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,tableLayout:'fixed', '--border': C.border}}>
                <colgroup>
                  <col style={{width:'30%'}}/>  {/* Usuario */}
                  <col style={{width:'10%'}}/>  {/* Rol */}
                  <col style={{width:'12%'}}/>  {/* Estado */}
                  <col style={{width:'20%'}}/>  {/* Último acceso */}
                  <col style={{width:'14%'}}/>  {/* Acceso */}
                  <col style={{width:'14%'}}/>  {/* Acciones */}
                </colgroup>
                <thead style={{borderBottom:`1px solid ${C.border}`}}>
                  <tr>
                    <Th>Usuario</Th>
                    <Th>Rol</Th>
                    <Th>Estado</Th>
                    <Th>Último acceso</Th>
                    <Th>Permisos</Th>
                    <Th right>Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u,i)=>{
                    const st=u.is_blocked?'blocked':u.is_active?'active':'inactive'
                    return (
                      <tr key={u.id} className="alas-tr" style={{animationDelay:`${Math.min(i, 7) * 0.055}s`}}>
                        <td style={{padding:'11px 16px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                            <div style={{width:30,height:30,borderRadius:9,flexShrink:0,background:`linear-gradient(135deg,${C.brand},${C.brandDark})`,display:'grid',placeItems:'center',fontFamily:'"Sora",system-ui',fontWeight:800,fontSize:12,color:'#fff',boxShadow:'0 2px 6px rgba(11,95,141,0.28)'}}>
                              {(u.full_name||u.username||u.email||'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{minWidth:0}}>
                              <div style={{fontWeight:600,color:C.text1,fontSize:13,letterSpacing:'-0.01em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.full_name||'—'}</div>
                              <div style={{fontSize:11,color:C.text4,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.username || u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{padding:'11px 16px'}}><RolePill role={u.role}/></td>
                        <td style={{padding:'11px 16px'}}><StatusPill status={st}/></td>
                        <td style={{padding:'11px 16px',color:C.text4,fontSize:11,whiteSpace:'nowrap'}}>
                          {u.last_login ? new Date(u.last_login).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}
                        </td>
                        <td style={{padding:'11px 16px'}}>
                          {!isReadOnly && (
                            <button onClick={()=>setSelected(u)}
                              style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:8,background:'transparent',border:`1px solid ${C.border}`,color:C.text3,fontSize:11,fontWeight:500,cursor:'pointer',transition:'all 150ms ease',whiteSpace:'nowrap'}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderHov;e.currentTarget.style.color=C.brand;e.currentTarget.style.background=C.brandLight}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;e.currentTarget.style.background='transparent'}}
                            >
                              <ShieldCheck style={{width:11,height:11}}/> Módulos
                            </button>
                          )}
                        </td>
                        <td style={{padding:'11px 16px'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:2}}>
                            {!isReadOnly && <>
                              <IconBtn title="Editar usuario" onClick={()=>setEditingUser(u)} icon={UserCog} variant="default"/>
                              <IconBtn title={u.is_active?'Desactivar':'Activar'} onClick={()=>toggleActive(u)} icon={u.is_active?ShieldX:CheckCircle2} variant={u.is_active?'ghost':'success'}/>
                              <IconBtn title={u.is_blocked?'Desbloquear':'Bloquear'} onClick={()=>toggleBlocked(u)} icon={u.is_blocked?CheckCircle2:Ban} variant={u.is_blocked?'success':'danger'}/>
                              {u.role !== 'admin' && (
                                <IconBtn title="Eliminar usuario" onClick={()=>setDeletingUser(u)} icon={Trash2} variant="danger"/>
                              )}
                            </>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {users.length===0 && (
                    <tr>
                      <td colSpan={6} style={{padding:'36px 20px',textAlign:'center',color:C.text4,fontSize:13,borderBottom:'none'}}>Sin usuarios registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </motion.div>

          {/* ── Columna derecha ─────────────────────────────────────────────── */}
          <div style={{display:'flex',flexDirection:'column',gap:18}}>

            {/* Módulos */}
            <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.42,delay:0.32,ease:EASE}}>
              <Card>
                <CardHeader title="Módulos" right={
                  <span style={{fontSize:11,color:C.text4,background:C.surfaceHov,padding:'3px 9px',borderRadius:99,border:`1px solid ${C.border}`}}>
                    {activeMods}/{modules.length} activos
                  </span>
                }/>
                <div>
                  {modules.map((m,i)=>{
                    const Icon=getModuleIcon(m.key)
                    return (
                      <motion.div key={m.id}
                        initial={{opacity:0,x:8}} animate={{opacity:1,x:0}}
                        transition={{duration:0.3,delay:0.36+i*0.05,ease:EASE}}
                        whileHover={{backgroundColor:C.surfaceHov}}
                        style={{display:'flex',alignItems:'center',gap:12,padding:'11px 18px',borderBottom:i<modules.length-1?`1px solid ${C.border}`:'none',transition:'background 120ms ease'}}
                      >
                        <div style={{width:32,height:32,borderRadius:9,flexShrink:0,background:m.is_active?C.brandLight:'#f1f5f9',border:`1px solid ${m.is_active?'rgba(11,95,141,0.15)':C.border}`,display:'grid',placeItems:'center',transition:'background 200ms ease'}}>
                          <Icon style={{width:14,height:14,color:m.is_active?C.brand:C.text4}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:m.is_active?C.text1:C.text4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',letterSpacing:'-0.01em'}}>{m.name}</div>
                          <UrlCell url={m.url}/>
                        </div>
                        {!isReadOnly && (
                          <div style={{display:'flex',alignItems:'center',gap:2,flexShrink:0}}>
                            <IconBtn title="Editar URL" onClick={()=>setEditing(m)} icon={Pencil} variant="default"/>
                            <IconBtn title={m.is_active?'Desactivar':'Activar'} onClick={()=>toggleModule(m)} icon={m.is_active?EyeOff:Eye} variant={m.is_active?'danger':'success'}/>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </Card>
            </motion.div>

            {/* Actividad */}
            <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.42,delay:0.38,ease:EASE}}>
              <Card>
                <CardHeader title="Actividad reciente"/>
                <div>
                  {logs.map((l,i)=>(
                    <motion.div key={l.id}
                      initial={{opacity:0,x:8}} animate={{opacity:1,x:0}}
                      transition={{duration:0.28,delay:0.42+i*0.04,ease:EASE}}
                      whileHover={{backgroundColor:C.surfaceHov}}
                      style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 18px',borderBottom:i<logs.length-1?`1px solid ${C.border}`:'none',transition:'background 120ms ease'}}
                    >
                      <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:'#f8fafc',border:`1px solid ${C.border}`,display:'grid',placeItems:'center',marginTop:1}}>
                        <Clock style={{width:12,height:12,color:C.text4}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                          <span style={{fontSize:12,fontWeight:600,color:C.text1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emailToName[l.email] || l.email || '—'}</span>
                          <ActionPill action={l.action}/>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          {l.module_name && <span style={{fontSize:11,color:C.text3}}>{l.module_name}</span>}
                          {l.module_name && <span style={{color:C.border}}>·</span>}
                          <span style={{fontSize:11,color:C.text4}}>{new Date(l.created_at).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {logs.length===0 && (
                    <div style={{padding:'24px 18px',textAlign:'center',color:C.text4,fontSize:13}}>Sin actividad</div>
                  )}
                </div>
              </Card>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selected   && <PermissionsModal user={selected} modules={modules} onClose={()=>setSelected(null)} notify={notify}/>}
      </AnimatePresence>
      <AnimatePresence>
        {editing     && <EditModuleModal module={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);loadModules();notify('Módulo actualizado')}} notify={notify}/>}
      </AnimatePresence>
      <AnimatePresence>
        {editingUser && <EditUserModal user={editingUser} onClose={()=>setEditingUser(null)} onSaved={()=>{setEditingUser(null);loadUsers()}} notify={notify}/>}
      </AnimatePresence>
      <AnimatePresence>
        {deletingUser && <DeleteUserModal user={deletingUser} onClose={()=>setDeletingUser(null)} onDeleted={()=>{setDeletingUser(null);loadUsers()}} notify={notify}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showCreate  && <CreateUserModal onClose={()=>setShowCreate(false)} onCreated={()=>{setShowCreate(false);loadUsers();notify('Usuario creado')}}/>}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:16,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12,scale:0.95}}
            transition={{duration:0.22,ease:EASE}}
            style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'9px 20px',fontSize:13,fontWeight:500,color:C.text1,boxShadow:'0 8px 24px rgba(15,23,42,0.12)',fontFamily:'"Inter",system-ui,sans-serif',zIndex:9999,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:8}}
          >
            <span style={{width:7,height:7,borderRadius:'50%',background:C.green,flexShrink:0}}/>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
