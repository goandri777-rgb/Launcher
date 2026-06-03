import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { getModuleIcon } from '../data/icons'
import { Lock, HardHat } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

// ── Helpers ───────────────────────────────────────────────────────────────
function getState(m) {
  if (m.is_blocked)          return 'blocked'
  if (m.is_active === false) return 'inactive'
  return 'active'
}
function polar(i, n, r) {
  const a = (i / n) * 2 * Math.PI - Math.PI / 2
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, angle: a }
}

// ── Layout ────────────────────────────────────────────────────────────────
const SIZE     = 680
const CX       = SIZE / 2
const CY       = SIZE / 2
const ORBIT_R  = 258
const HUB_R    = 96
const L_START  = HUB_R + 14
const L_END    = ORBIT_R - 48
const NODE_W   = 120
const BTN_SIZE = 88

// ── Motion ────────────────────────────────────────────────────────────────
const INTRO_EASE = 'power3.out'
const SETTLE_EASE = 'expo.out'
const FLOAT_EASE = 'sine.inOut'

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  brand:      '#0B5F8D',
  brandDark:  '#08486A',
  border:     'rgba(226,232,240,0.85)',
  borderHov:  'rgba(11,95,141,0.25)',
  text1:      '#1e293b',
  text2:      '#475569',
  text3:      '#94a3b8',
  surface:    '#ffffff',
  surfaceHov: '#f0f7ff',
  danger:     '#ef4444',
}

function lineBaseColor(state) {
  if (state === 'blocked')  return 'rgba(239, 68, 68, 0.35)'
  if (state === 'inactive') return 'rgba(37, 99, 235, 0.22)'
  return 'rgba(11, 95, 141, 0.28)'
}

function nodeStyles(state, hov) {
  const base = {
    borderRadius: 22, width: BTN_SIZE, height: BTN_SIZE,
    transition: 'none',
    transformOrigin: '50% 50%',
    backfaceVisibility: 'hidden',
    willChange: 'transform, opacity',
  }
  if (state === 'inactive') return {
    ...base,
    background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
    border: '1px solid rgba(37, 99, 235, 0.22)',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
    opacity: 1,
    cursor: 'not-allowed',
  }
  if (state === 'blocked') return {
    ...base,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(254, 242, 242, 0.8))',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.02)',
    cursor: 'pointer',
    opacity: 0.65,
  }
  return {
    ...base,
    background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfe 100%)',
    border: '1px solid rgba(11, 95, 141, 0.14)',
    boxShadow: '0 6px 20px rgba(11, 95, 141, 0.04), 0 2px 4px rgba(11, 95, 141, 0.02), inset 0 1px 0 #ffffff',
    cursor: 'pointer',
  }
}
function iconColor(state, hov) {
  if (state === 'inactive') return C.text3
  if (state === 'blocked')  return hov ? C.danger : 'rgba(239,68,68,0.70)'
  return hov ? C.brand : '#475569'
}
function labelColor(state, hov) {
  if (state === 'inactive') return C.text3
  if (state === 'blocked')  return 'rgba(239,68,68,0.65)'
  return hov ? C.brand : C.text2
}
// dotStyle removed - replaced by inline pulsing component

export default function CircularLauncher({ modules, onOpen }) {
  const { appBooting, transitioning } = useAuth()
  const [busyKey, setBusyKey] = useState(null)
  const [hubAlert, setHubAlert] = useState(null)
  const alertTimer = useRef(null)

  const triggerHubAlert = useCallback((msg) => {
    clearTimeout(alertTimer.current)
    setHubAlert(msg)
    alertTimer.current = setTimeout(() => setHubAlert(null), 2000)
  }, [])

  // Limpieza del timer al desmontar
  useEffect(() => () => clearTimeout(alertTimer.current), [])

  // ── Refs for GSAP ────────────────────────────────────────────────────────
  const containerRef = useRef(null)
  const hubRef      = useRef(null)
  const hubRingRef  = useRef(null)
  const orbitRef    = useRef(null)
  const lineBaseRefs = useRef([])   // solid base lines
  const lineDashRefs = useRef([])   // marching dash overlays
  const pulseRefs   = useRef([])    // click pulse circles
  const nodeRefs    = useRef([])    // module node wrappers
  const buttonRefs  = useRef([])    // module button surfaces
  const floatTween  = useRef(null)  // hub float tween (kept for pause/resume)
  const systemRef   = useRef(null)

  // ── 1. GSAP entrance — System Online (runs on every mount) ─────────────
  useEffect(() => {
    if (!modules.length || !hubRef.current) return

    // ── Si el loader de inicio o de transición siguen activos, mantener oculto ──
    if (appBooting || transitioning) {
      const ctx = gsap.context(() => {
        // transformPerspective propio en el sistema: crea un punto de fuga real
        // z: -1400 lo pone "detrás de la pantalla" — combinado con scale:0.05 es casi invisible
        gsap.set(systemRef.current, {
          autoAlpha: 0,
          transformPerspective: 1100,
          rotationX: 58,
          scale: 0.88,
          transformOrigin: '50% 50%',
          force3D: true,
        })
        gsap.set(hubRef.current, {
          scale: 0,
          autoAlpha: 0,
          force3D: true,
        })
        nodeRefs.current.filter(Boolean).forEach(node => {
          gsap.set(node, {
            autoAlpha: 0,
            scale: 0,
            transformOrigin: '50% 50%',
            force3D: true,
          })
        })
        lineBaseRefs.current.forEach(path => {
          if (!path) return
          const len = path.getTotalLength ? path.getTotalLength() : 200
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0.92 })
        })
        gsap.set(lineDashRefs.current.filter(Boolean), { opacity: 0 })
      })
      return () => ctx.revert()
    }

    // ── Cuando los loaders se apagan, lanzar la animación de entrada ──
    const ctx = gsap.context(() => {
      const nodes     = nodeRefs.current.filter(Boolean)
      const dashLines = lineDashRefs.current.filter(Boolean)

      floatTween.current?.kill()
      floatTween.current = null

      // Siempre partir del estado oculto — ctx.revert() del bloque anterior
      // restaura los elementos a su estado CSS visible, así que hay que
      // volver a ocultarlos antes de animar.
      gsap.set(systemRef.current, { autoAlpha: 0, transformPerspective: 1100, rotationX: 58, scale: 0.88, transformOrigin: '50% 50%', force3D: true })
      gsap.set(hubRef.current,    { scale: 0, autoAlpha: 0, force3D: true })
      nodes.forEach(node => gsap.set(node, { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%', force3D: true }))
      lineBaseRefs.current.forEach(path => {
        if (!path) return
        const len = path.getTotalLength ? path.getTotalLength() : 200
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0.92 })
      })
      gsap.set(dashLines, { opacity: 0 })
      gsap.set(orbitRef.current, { autoAlpha: 0 })

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) {
        gsap.set(systemRef.current, { autoAlpha: 1, scale: 1, rotationX: 0 })
        gsap.set(hubRef.current,    { scale: 1, autoAlpha: 1 })
        lineBaseRefs.current.forEach(p => p && gsap.set(p, { strokeDashoffset: 0 }))
        gsap.set(dashLines, { opacity: 1 })
        gsap.set(nodes, { scale: 1, autoAlpha: 1 })
        return
      }

      const goLive = () => {
        gsap.to(dashLines, {
          opacity: 1,
          duration: 0.50,
          stagger: { each: 0.035, from: 'center' },
          ease: 'power2.out',
        })
      }

      const tl = gsap.timeline({ delay: 0.02, onComplete: goLive })

      // ── FASE 1: Tilt forward — el disco empieza inclinado (rotationX 58°)
      // como mirando un plato desde arriba, se "levanta" hacia la cámara.
      // El círculo se ve como elipse al principio y se abre al quedar de frente.
      tl.to(systemRef.current, {
        autoAlpha: 1,
        rotationX: -3,
        scale: 1.01,
        duration: 0.88,
        ease: 'expo.out',
        force3D: true,
      }, 0)
      // Pequeño rebote y queda perfecto de frente
      tl.to(systemRef.current, {
        rotationX: 0,
        scale: 1,
        duration: 0.28,
        ease: 'power3.inOut',
        force3D: true,
      }, 0.88)

      // ── FASE 2: Hub emerge del centro a mitad del vuelo ──────────────────
      tl.to(hubRef.current, {
        autoAlpha: 1,
        scale: 1.18,
        duration: 0.44,
        ease: 'back.out(2.5)',
        force3D: true,
      }, 0.44)
      tl.to(hubRef.current, {
        scale: 1,
        duration: 0.26,
        ease: 'power3.out',
        force3D: true,
      }, 0.88)

      // ── FASE 3: Órbita snap ───────────────────────────────────────────────
      tl.set(orbitRef.current, { autoAlpha: 1 }, 0.58)

      // ── FASE 4: Líneas explotan desde el centro — simultáneas ────────────
      tl.to(lineBaseRefs.current.filter(Boolean), {
        strokeDashoffset: 0,
        duration: 0.50,
        stagger: 0,
        ease: 'power4.out',
      }, 0.62)

      // ── FASE 5: Módulos en cascada al extremo de cada línea ───────────────
      nodes.forEach((node, i) => {
        if (!node) return
        const t = 0.82 + i * 0.055
        tl.call(() => firePulse(i), [], t)
        tl.to(node, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.50,
          ease: 'back.out(1.6)',
          force3D: true,
        }, t)
      })
    })

    return () => {
      ctx.revert()
      floatTween.current?.kill()
      floatTween.current = null
    }
  }, [modules.length, appBooting, transitioning]) // eslint-disable-line



  // ── 2. Hub reacts to module hover ────────────────────────────────────────
  // Hover is handled imperatively in animateModuleHover to avoid SVG re-renders.

  // ── 4. Busy state — dim everything except the active module ──────────────
  useEffect(() => {
    const ease = 'expo.out'
    if (busyKey) {
      nodeRefs.current.forEach((el, i) => {
        if (!el) return
        const isBusyNode = modules[i]?.key === busyKey
        gsap.to(el, {
          opacity: isBusyNode ? 1 : 0.15, // Mayor enfoque en el nodo seleccionado
          scale:   isBusyNode ? 1.04 : 0.94,
          duration: 0.45, ease, overwrite: 'auto',
        })
      })
      lineBaseRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          opacity: modules[i]?.key === busyKey ? 0.9 : 0.04,
          duration: 0.4, ease, overwrite: 'auto',
        })
      })
      lineDashRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          opacity: modules[i]?.key === busyKey ? 0.9 : 0.04,
          duration: 0.4, ease, overwrite: 'auto',
        })
      })
      if (orbitRef.current) {
        gsap.to(orbitRef.current, {
          opacity: 0.15,
          duration: 0.4,
          ease,
        })
      }
    } else {
      gsap.to(nodeRefs.current.filter(Boolean), {
        opacity: 1, scale: 1,
        duration: 0.5, ease, overwrite: 'auto',
      })
      lineBaseRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          opacity: 1, duration: 0.45, ease, overwrite: 'auto',
        })
      })
      lineDashRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          opacity: 1, duration: 0.45, ease, overwrite: 'auto',
        })
      })
      if (orbitRef.current) {
        gsap.to(orbitRef.current, {
          opacity: 1,
          duration: 0.5,
          ease,
        })
      }
    }
  }, [busyKey, modules])

  // ── 5b. Page Visibility — pausa float cuando la pestaña está en background ──
  useEffect(() => {
    const onVisibility = () => {
      if (!floatTween.current) return
      if (document.hidden) floatTween.current.pause()
      else                  floatTween.current.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // ── 5. Click pulse — dot travels hub → node ───────────────────────────────
  const firePulse = useCallback((moduleIndex) => {
    const pulseEl = pulseRefs.current[moduleIndex]
    if (!pulseEl) return

    const { angle } = polar(moduleIndex, modules.length, ORBIT_R)
    const x1 = CX + Math.cos(angle) * L_START
    const y1 = CY + Math.sin(angle) * L_START
    const x2 = CX + Math.cos(angle) * L_END
    const y2 = CY + Math.sin(angle) * L_END

    gsap.killTweensOf(pulseEl)
    gsap.set(pulseEl, { attr: { cx: x1, cy: y1, r: 6 }, opacity: 1, fill: '#3B82F6' })
    
    const tl = gsap.timeline()
    tl.to(pulseEl, {
      attr: { cx: x2, cy: y2, r: 3 },
      duration: 0.48,
      ease: 'power3.out',
    })
    tl.to(pulseEl, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
    }, '-=0.35')
  }, [modules.length])

  const animateModuleHover = useCallback((moduleIndex, module, on) => {
    if (getState(module) !== 'active') return

    const buttonEl = buttonRefs.current[moduleIndex]
    const nodeEl   = nodeRefs.current[moduleIndex]
    if (nodeEl) gsap.set(nodeEl, { zIndex: on ? 32 : 20 })
    if (!buttonEl) return

    // ── Transform del botón: composited, sin paint ─────────────────────────
    gsap.killTweensOf(buttonEl)
    gsap.to(buttonEl, {
      scale: on ? 1.08 : 1,
      y:     on ? -3   : 0,
      duration: on ? 0.32 : 0.24,
      ease:     on ? 'expo.out' : 'power3.out',
      overwrite: 'auto',
      force3D: true,
    })

    // ── Hover overlay: opacity composited, cero paint por frame ───────────
    const overlayEl = buttonEl.querySelector('[data-hover-overlay]')
    if (overlayEl) {
      gsap.to(overlayEl, {
        opacity:  on ? 1 : 0,
        duration: on ? 0.28 : 0.20,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    // ── Colores icon/label: CSS transition, 1 paint al cambiar, no por frame
    const iconEl  = nodeEl?.querySelector('[data-module-icon]')
    const labelEl = nodeEl?.querySelector('[data-module-label]')
    if (iconEl)  iconEl.style.color  = on ? C.brand : '#475569'
    if (labelEl) labelEl.style.color = on ? C.brand : C.text2

    // ── Líneas: solo opacity (composited), sin stroke color ni strokeWidth ─
    const lineBaseEl = lineBaseRefs.current[moduleIndex]
    const lineDashEl = lineDashRefs.current[moduleIndex]
    if (lineBaseEl) {
      gsap.killTweensOf(lineBaseEl)
      gsap.to(lineBaseEl, {
        opacity:  on ? 1 : 0.55,
        duration: on ? 0.32 : 0.24,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
    if (lineDashEl) {
      gsap.killTweensOf(lineDashEl)
      gsap.to(lineDashEl, {
        opacity:  on ? 1 : 0.6,
        duration: on ? 0.28 : 0.20,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }, [])

  const handleClick = async (m) => {
    const state = getState(m)
    if (state === 'blocked') {
      const idx = modules.findIndex(mod => mod.key === m.key)
      const buttonEl = buttonRefs.current[idx]
      if (buttonEl) {
        gsap.killTweensOf(buttonEl)
        gsap.fromTo(buttonEl,
          { x: -6 },
          { x: 0, duration: 0.42, ease: 'elastic.out(1, 0.25)', clearProps: 'x' }
        )
      }
      triggerHubAlert("SIN PERMISO")
      return
    }
    if (state !== 'active') return
    const idx = modules.findIndex(mod => mod.key === m.key)
    firePulse(idx)
    setBusyKey(m.key)
    try {
      const result = await onOpen(m.key)
      if (!result?.ok) setBusyKey(null)
    } catch (error) {
      setBusyKey(null)
      throw error
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative grid place-items-center select-none"
      style={{ width: SIZE, height: SIZE, maxWidth: '92vw' }}
    >
      {/* System wrapper */}
      <div
        ref={systemRef}
        className="grid place-items-center"
        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', willChange: 'transform' }}
      >

      {/* ── SVG layer ────────────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        width={SIZE} height={SIZE}
      >
        <defs />

        {/* Orbit guide */}
        <circle
          ref={orbitRef}
          cx={CX} cy={CY} r={ORBIT_R}
          fill="none"
          stroke="rgba(203,213,225,0.5)"
          strokeWidth="1"
          strokeDasharray="3 16"
          style={{
            opacity: 0,
            animation: 'orbit-spin 30s linear infinite',
            transformBox: 'fill-box',
            transformOrigin: 'center center',
          }}
        />

        {/* Connector lines */}
        {modules.map((m, i) => {
          const { angle } = polar(i, modules.length, ORBIT_R)
          const x1 = CX + Math.cos(angle) * L_START
          const y1 = CY + Math.sin(angle) * L_START
          const x2 = CX + Math.cos(angle) * L_END
          const y2 = CY + Math.sin(angle) * L_END
          const state = getState(m)
          const isBusy = busyKey === m.key

          return (
            <g key={m.key}>
              {/* Base line — GSAP draws it in and controls focus */}
              <path
                ref={el => { lineBaseRefs.current[i] = el }}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke={lineBaseColor(state)}
                strokeWidth={isBusy ? 2.0 : 1.4}
                strokeLinecap="round"
                fill="none"
              />
              {/* Marching dashes — CSS infinite, GSAP fades in after entrance */}
              {state === 'active' && (
                <path
                  ref={el => { lineDashRefs.current[i] = el }}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke={isBusy ? '#0B5F8D' : 'rgba(11,95,141,0.38)'}
                  strokeWidth={isBusy ? 2.5 : 1.5}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="3 9"
                  style={{
                    animation: `dash-march ${isBusy ? 0.45 : 1.8}s linear infinite`,
                    animationDelay: `${i * 0.22}s`,
                    transition: 'stroke 200ms ease, stroke-width 200ms ease',
                    opacity: 0, // GSAP fades in after entrance
                  }}
                />
              )}
              {/* Click pulse dot — starts at hub, travels to node */}
              <circle
                ref={el => { pulseRefs.current[i] = el }}
                cx={x1} cy={y1} r={4}
                fill={C.brand}
                opacity={0}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )
        })}
      </svg>

      {/* ── Hub central ──────────────────────────────────────────────── */}
      {/* Regular div — GSAP owns entrance + float + hover reaction */}
      <div
        ref={hubRef}
        className="absolute z-10 rounded-full grid place-items-center cursor-default"
        style={{
          width: HUB_R * 2, height: HUB_R * 2,
          willChange: 'transform, opacity',
          // hub-float removed — GSAP handles it after entrance completes
        }}
      >
        {/* Pulse ring */}
        <div
          ref={hubRingRef}
          className="absolute rounded-full"
          style={{
            inset: -8,
            border: '1px solid rgba(11,95,141,0.14)',
            animation: 'hub-ring 4s ease-in-out infinite',
            willChange: 'transform, opacity',
          }}
        />

        {/* Hub surface — sombra estática, sin animación de paint */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f4f8ff 100%)',
          border: '1px solid rgba(203,213,225,0.75)',
          boxShadow: '0 4px 20px rgba(11,95,141,0.07), 0 1px 4px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,1)',
        }} />
        {/* Glow overlay — solo opacity pulsa → compositor path, cero paint */}
        <div className="absolute rounded-full pointer-events-none" style={{
          inset: -2,
          boxShadow: '0 6px 28px rgba(11,95,141,0.13), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 5px rgba(11,95,141,0.035)',
          willChange: 'opacity',
          animation: 'hub-glow-pulse 4s ease-in-out infinite',
        }} />

        {/* Specular */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '55%', height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,1), transparent)',
          }} />
        </div>

        {/* Logo watermark */}
        <img
          src="/logo-icon.png"
          alt="" aria-hidden
          style={{
            position: 'absolute', width: '62%', height: 'auto',
            opacity: 0.07, filter: 'grayscale(1) brightness(0)',
            pointerEvents: 'none', userSelect: 'none',
          }}
        />

        {/* Hub text */}
        <div className="relative z-10 text-center px-5" style={{ lineHeight: 1.3, minHeight: 28 }}>
          <AnimatePresence mode="wait">
            {busyKey ? (
              <motion.div
                key="busy"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
                aria-hidden="true"
                style={{
                  width: 38,
                  height: 22,
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto',
                }}
              >
                <div
                  className="animate-spin"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid rgba(11,95,141,0.14)',
                    borderTopColor: '#0B5F8D',
                  }}
                />
              </motion.div>
            ) : hubAlert ? (
              <motion.div
                key="alert"
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <p style={{
                  fontFamily: '"Sora", system-ui, sans-serif',
                  fontWeight: 700, fontSize: '10px',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#ef4444',
                  textShadow: '0 0 8px rgba(239, 68, 68, 0.25)',
                  margin: 0,
                }}>{hubAlert}</p>
                <p style={{
                  fontSize: '14px',
                  margin: '2px 0 0',
                  lineHeight: 1,
                }}>😢</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.18 }}
              >
                {['Gestión de', 'Logística'].map(line => (
                  <p key={line} style={{
                    fontFamily: '"Sora", system-ui, sans-serif',
                    fontWeight: 600, fontSize: '10px',
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: '#64748b',
                    margin: 0,
                  }}>{line}</p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Módulos ──────────────────────────────────────────────────── */}
      {modules.map((m, i) => {
        const { x, y } = polar(i, modules.length, ORBIT_R)
        const state    = getState(m)
        const Icon     = getModuleIcon(m.key)
        const isBusy   = busyKey    === m.key
        const isHov    = false
        const isActive = state === 'active'

        return (
          // Regular div — GSAP animates entrance (y + opacity)
          // GSAP handles hover zoom without moving the hitbox.
          <div
            key={m.key}
            ref={el => { nodeRefs.current[i] = el }}
            className="absolute z-20 flex flex-col items-center"
            style={{
              // CSS absolute positioning (replaces Framer Motion x/y)
              left: `calc(50% + ${x - NODE_W / 2}px)`,
              top:  `calc(50% + ${y - BTN_SIZE / 2 - 8}px)`,
              width: NODE_W,
              height: BTN_SIZE + 56,
              paddingTop: 8,
              boxSizing: 'border-box',
              gap: 8,
              zIndex: isHov ? 32 : 20,
              willChange: 'transform, opacity',
            }}
            onPointerEnter={() => isActive && !isBusy && animateModuleHover(i, m, true)}
            onPointerLeave={() => animateModuleHover(i, m, false)}
          >
            {/* Button surface: GSAP animates hover zoom without moving the hitbox */}
            <button
              ref={el => { buttonRefs.current[i] = el }}
              onClick={() => handleClick(m)}
              disabled={state === 'inactive' || isBusy}
              className="relative grid place-items-center flex-shrink-0"
              style={nodeStyles(state, isHov)}
            >
              {/* Hover overlay — visual hover baked in, solo opacity cambia (compositor) */}
              {state === 'active' && (
                <div
                  data-hover-overlay
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 20,
                    background: '#f0f7ff',
                    boxShadow: '0 16px 36px rgba(11,95,141,0.15), 0 0 0 2px #0B5F8D, 0 0 0 5px rgba(11,95,141,0.08)',
                    opacity: 0,
                    pointerEvents: 'none',
                    willChange: 'opacity',
                  }}
                />
              )}
              {/* Top specular */}
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: '46%', height: '1px', borderRadius: 99,
                background: 'rgba(255,255,255,0.9)',
              }} />

              {/* Status dot with subtle pulse */}
              <div style={{
                position: 'absolute', top: 8, right: 8,
                width: 6, height: 6,
                pointerEvents: 'none',
              }}>
                <span style={{
                  position: 'absolute', inset: -1,
                  borderRadius: '50%',
                  background: state === 'active' ? '#10b981' : state === 'inactive' ? '#2563EB' : '#ef4444',
                  animation: 'status-dot-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
                  pointerEvents: 'none',
                }} />
                <span style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  background: state === 'active' ? '#10b981' : state === 'inactive' ? '#2563EB' : '#ef4444',
                  boxShadow: state === 'active'
                    ? '0 0 5px rgba(16, 185, 129, 0.45)'
                    : state === 'inactive'
                    ? '0 0 5px rgba(37, 99, 235, 0.45)'
                    : '0 0 5px rgba(239, 68, 68, 0.4)',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Icon — casco cuando está en proceso, ícono normal en otro caso */}
              {state === 'inactive' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <HardHat data-module-icon style={{
                    width: 24, height: 24,
                    color: '#2563EB',
                    flexShrink: 0,
                    animation: 'hardhat-bob 2.4s ease-in-out infinite',
                  }} />
                  <span style={{
                    fontSize: '8.5px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: '#2563EB',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    textTransform: 'uppercase',
                    opacity: 0.85,
                  }}>Trabajando...</span>
                </div>
              ) : (
                <Icon data-module-icon style={{
                  width: 26, height: 26,
                  color: iconColor(state, isHov),
                  transition: 'color 220ms ease',
                  flexShrink: 0,
                  filter: state === 'blocked' ? 'grayscale(100%) opacity(0.35)' : 'none',
                }} />
              )}

              {/* Locked overlay lock icon */}
              {state === 'blocked' && (
                <div style={{
                  position: 'absolute', bottom: 5, right: 5,
                  width: 17, height: 17, borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Lock style={{ width: 8, height: 8, color: '#ef4444' }} />
                </div>
              )}

              {/* Busy spinner */}
              {isBusy && (
                <div className="absolute inset-0 grid place-items-center" style={{
                  borderRadius: 22,
                  background: 'rgba(255,255,255,0.94)',
                }}>
                  <div className="animate-spin rounded-full border-2" style={{
                    width: 16, height: 16,
                    borderColor: 'rgba(11,95,141,0.15)',
                    borderTopColor: '#0B5F8D',
                  }} />
                </div>
              )}
            </button>



            {/* Label */}
            <span data-module-label style={{
              fontSize: '11.5px', fontWeight: 500, letterSpacing: '-0.01em',
              fontFamily: '"Inter", system-ui, sans-serif',
              color: labelColor(state, isHov),
              transition: 'color 220ms ease',
              textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.35,
              width: NODE_W,
              display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {m.name}
            </span>
          </div>
        )
      })}

      </div>{/* /systemRef */}
    </div>
  )
}
