import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { getModuleIcon } from '../data/icons'

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
const SPRING = { type: 'spring', stiffness: 380, damping: 28, mass: 0.55 }

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
  if (state === 'blocked')  return 'rgba(239,68,68,0.22)'
  if (state === 'inactive') return 'rgba(203,213,225,0.45)'
  return 'rgba(203,213,225,0.65)'
}

function nodeStyles(state, hov) {
  const base = {
    borderRadius: 20, width: BTN_SIZE, height: BTN_SIZE,
    transition: 'background 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
    willChange: 'transform',
  }
  if (state === 'inactive') return {
    ...base, background: C.surface,
    border: `1px solid ${C.border}`, boxShadow: 'none',
    opacity: 0.4, cursor: 'not-allowed',
  }
  if (state === 'blocked') return {
    ...base, background: '#fff1f2',
    border: `1px solid rgba(239,68,68,${hov ? 0.32 : 0.20})`,
    boxShadow: hov ? '0 6px 18px rgba(239,68,68,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
    cursor: 'not-allowed',
  }
  return {
    ...base,
    background: hov ? C.surfaceHov : C.surface,
    border: `1px solid ${hov ? C.borderHov : C.border}`,
    boxShadow: hov
      ? '0 16px 40px rgba(11,95,141,0.14), 0 6px 16px rgba(11,95,141,0.07), 0 1px 4px rgba(15,23,42,0.05)'
      : '0 1px 4px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.4)',
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
function dotStyle(state) {
  const b = { width: 6, height: 6, borderRadius: '50%', position: 'absolute', top: 8, right: 8 }
  if (state === 'active')  return { ...b, background: '#10b981', boxShadow: '0 0 5px rgba(16,185,129,0.5)' }
  if (state === 'blocked') return { ...b, background: C.danger, boxShadow: '0 0 5px rgba(239,68,68,0.4)' }
  return { ...b, background: '#cbd5e1' }
}

export default function CircularLauncher({ modules, onOpen }) {
  const [busyKey,    setBusyKey]    = useState(null)
  const [hoveredKey, setHoveredKey] = useState(null)

  // ── Refs for GSAP ────────────────────────────────────────────────────────
  const hubRef      = useRef(null)
  const hubRingRef  = useRef(null)
  const orbitRef    = useRef(null)
  const lineBaseRefs = useRef([])   // solid base lines
  const lineDashRefs = useRef([])   // marching dash overlays
  const pulseRefs   = useRef([])    // click pulse circles
  const nodeRefs    = useRef([])    // module node wrappers
  const floatTween  = useRef(null)  // hub float tween (kept for pause/resume)
  const systemRef   = useRef(null)  // 3D tilt wrapper — mouse parallax target

  // ── 1. GSAP entrance timeline (runs once on mount) ────────────────────────
  useEffect(() => {
    if (!modules.length || !hubRef.current) return

    // Primera visita en esta sesión → cinematografía completa.
    // Visitas repetidas (misma pestaña) → fade-in abreviado ~0.35s.
    const INTRO_KEY   = 'alas.launcher.intro'
    const isFirstVisit = !sessionStorage.getItem(INTRO_KEY)
    if (isFirstVisit) sessionStorage.setItem(INTRO_KEY, '1')

    const ctx = gsap.context(() => {

      // ── Estados iniciales ──────────────────────────────────────────────────
      gsap.set(hubRef.current, {
        scale: isFirstVisit ? 0.5 : 1,
        opacity: 0, transformOrigin: 'center center', z: 24,
      })
      gsap.set(orbitRef.current, { opacity: 0 })

      lineBaseRefs.current.forEach(path => {
        if (!path) return
        const len = path.getTotalLength ? path.getTotalLength() : 200
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: isFirstVisit ? len : 0,
          opacity: 1,
        })
      })

      gsap.set(lineDashRefs.current.filter(Boolean), { opacity: 0 })
      gsap.set(nodeRefs.current.filter(Boolean), {
        scale: isFirstVisit ? 0.62 : 1,
        opacity: 0, z: 8,
      })

      // goLive: inicia float + activa dashes (compartido entre ambas rutas)
      const goLive = () => {
        floatTween.current = gsap.to(hubRef.current, {
          y: -5, duration: 2.6, repeat: -1, yoyo: true,
          ease: 'sine.inOut', overwrite: false,
        })
        gsap.to(lineDashRefs.current.filter(Boolean), {
          opacity: 1, duration: 0.4, stagger: 0.04,
        })
      }

      // ── Ruta abreviada — visitas repetidas ─────────────────────────────────
      if (!isFirstVisit) {
        const quick = gsap.timeline({ delay: 0.1, onComplete: goLive })
        quick
          .to(hubRef.current,  { opacity: 1, duration: 0.30, ease: 'power2.out' })
          .to(orbitRef.current, { opacity: 1, duration: 0.28, ease: 'power2.out' }, '-=0.20')
          .to(nodeRefs.current.filter(Boolean), {
            opacity: 1, duration: 0.26, stagger: 0.04, ease: 'power2.out',
          }, '-=0.14')
        return
      }

      // ── Ruta cinematográfica — primera visita ──────────────────────────────
      const tl = gsap.timeline({ delay: 0.30, onComplete: goLive })

      // 1. Hub carga: power4.out (expansión intensa) → settle (power2.out)
      tl
        .to(hubRef.current, {
          scale: 1.06, opacity: 1,
          duration: 0.55, ease: 'power4.out',
        })
        .to(hubRef.current, {
          scale: 1.0,
          duration: 0.18, ease: 'power2.out',
        })

      // 2. Orbit ring aparece mientras el hub completa el settle
      tl.to(orbitRef.current, {
        opacity: 1, duration: 0.30, ease: 'power3.out',
      }, '-=0.28')

      // 3. Pausa narrativa implícita (tl head ~0.75s, módulos arrancan en 0.85s → 0.10s de beat)
      // 4. Conexión módulo a módulo — secuencial, clockwise
      for (let i = 0; i < modules.length; i++) {
        if (!lineBaseRefs.current[i] || !nodeRefs.current[i]) continue
        const t = 0.85 + i * 0.14

        // Línea se dibuja hub → nodo
        tl.to(lineBaseRefs.current[i], {
          strokeDashoffset: 0,
          duration: 0.22, ease: 'power2.out',
        }, t)

        // Pulso de energía viaja por la línea (usa el mecanismo de click)
        tl.call(() => firePulse(i), [], t + 0.10)

        // Nodo materializa al final de la línea
        tl.to(nodeRefs.current[i], {
          scale: 1, opacity: 1,
          duration: 0.26, ease: 'expo.out',
        }, t + 0.16)
      }
    })

    return () => {
      ctx.revert()
      floatTween.current?.kill()
      floatTween.current = null
    }
  }, [modules.length]) // eslint-disable-line

  // ── 2. Hub reacts to module hover ────────────────────────────────────────
  useEffect(() => {
    if (!hubRef.current) return

    if (hoveredKey) {
      // Hub subtly expands — pauses float temporarily with overwrite:auto
      gsap.to(hubRef.current, {
        scale: 1.045,
        duration: 0.32,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      // Ring glows a bit more
      if (hubRingRef.current) {
        gsap.to(hubRingRef.current, {
          borderColor: 'rgba(11,95,141,0.28)',
          duration: 0.25,
        })
      }
    } else {
      // Elastic return + resume float
      gsap.to(hubRef.current, {
        scale: 1,
        duration: 0.55,
        ease: 'elastic.out(1, 0.55)',
        overwrite: 'auto',
      })
      if (hubRingRef.current) {
        gsap.to(hubRingRef.current, {
          borderColor: 'rgba(11,95,141,0.14)',
          duration: 0.35,
        })
      }
    }
  }, [hoveredKey])

  // ── 3. Focus effect — dim non-hovered lines ───────────────────────────────
  useEffect(() => {
    lineBaseRefs.current.forEach((lineEl, i) => {
      if (!lineEl) return
      const m     = modules[i]
      if (!m) return
      const state = getState(m)
      const isHov = hoveredKey === m.key

      let target
      if (!hoveredKey) {
        target = 1                          // No hover: all full
      } else if (isHov) {
        target = 1                          // Hovered line: full
      } else {
        target = state === 'active' ? 0.18 : 0.10  // Others: dimmed
      }

      gsap.to(lineEl, {
        opacity: target,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    })
  }, [hoveredKey, modules])

  // ── 4. Busy state — dim everything except the active module ──────────────
  useEffect(() => {
    if (busyKey) {
      nodeRefs.current.forEach((el, i) => {
        if (!el) return
        const isBusyNode = modules[i]?.key === busyKey
        gsap.to(el, {
          opacity: isBusyNode ? 1 : 0.22,
          scale:   isBusyNode ? 1.02 : 0.97,
          duration: 0.28, ease: 'power2.out', overwrite: 'auto',
        })
      })
      lineBaseRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          opacity: modules[i]?.key === busyKey ? 1 : 0.08,
          duration: 0.25, ease: 'power2.out', overwrite: 'auto',
        })
      })
    } else {
      gsap.to(nodeRefs.current.filter(Boolean), {
        opacity: 1, scale: 1,
        duration: 0.35, ease: 'power2.out', overwrite: 'auto',
      })
      lineBaseRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto',
        })
      })
    }
  }, [busyKey, modules])

  // ── 6. Mouse parallax — 3D tilt (desktop only) ───────────────────────────
  useEffect(() => {
    const system    = systemRef.current
    const container = system?.parentElement
    if (!system || !container) return
    if (window.matchMedia('(hover: none)').matches) return   // no touch

    const onMove = (e) => {
      const r  = container.getBoundingClientRect()
      const nx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2)
      const ny = (e.clientY - r.top   - r.height / 2) / (r.height / 2)
      gsap.to(system, {
        rotateY:  nx * 5,
        rotateX: -ny * 4,
        duration: 1.8,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    const onLeave = () => {
      gsap.to(system, {
        rotateY: 0,
        rotateX: 0,
        duration: 2.4,
        ease: 'elastic.out(1, 0.55)',
        overwrite: 'auto',
      })
    }

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)
    return () => {
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      gsap.killTweensOf(system)
    }
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
    gsap.set(pulseEl, { attr: { cx: x1, cy: y1, r: 4 }, opacity: 0.9 })
    gsap.to(pulseEl, {
      attr: { cx: x2, cy: y2, r: 2.5 },
      opacity: 0,
      duration: 0.42,
      ease: 'power2.in',
    })
  }, [modules.length])

  const handleClick = async (m) => {
    if (getState(m) !== 'active') return
    const idx = modules.findIndex(mod => mod.key === m.key)
    firePulse(idx)
    setBusyKey(m.key)
    await onOpen(m.key)
    setBusyKey(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative grid place-items-center select-none"
      style={{ width: SIZE, height: SIZE, maxWidth: '92vw', perspective: '900px' }}
    >
      {/* 3D tilt wrapper — parallax rota este div, hijos viven en eje Z real */}
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
        <defs>
          <filter id="line-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

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
          const isHov = hoveredKey === m.key

          return (
            <g key={m.key}>
              {/* Base line — GSAP draws it in and controls focus */}
              <path
                ref={el => { lineBaseRefs.current[i] = el }}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke={lineBaseColor(state)}
                strokeWidth={isHov ? 1.2 : 0.8}
                strokeLinecap="round"
                fill="none"
                filter={isHov && state === 'active' ? 'url(#line-glow)' : undefined}
              />
              {/* Marching dashes — CSS infinite, GSAP fades in after entrance */}
              {state === 'active' && (
                <path
                  ref={el => { lineDashRefs.current[i] = el }}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke={isHov ? 'rgba(11,95,141,0.55)' : 'rgba(11,95,141,0.22)'}
                  strokeWidth={isHov ? 1.5 : 1.2}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="2 11"
                  style={{
                    animation: `dash-march ${isHov ? 0.9 : 1.8}s linear infinite`,
                    animationDelay: `${i * 0.22}s`,
                    transition: 'stroke 200ms ease',
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

        {/* Hub surface */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f4f8ff 100%)',
          border: '1px solid rgba(203,213,225,0.75)',
          animation: 'hub-glow 4s ease-in-out infinite',
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
              <motion.p
                key="busy"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
                style={{
                  fontFamily: '"Sora", system-ui, sans-serif',
                  fontWeight: 600, fontSize: '10px',
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: '#0B5F8D',
                  margin: 0,
                }}
              >
                Abriendo…
              </motion.p>
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
        const isHov    = hoveredKey === m.key
        const isActive = state === 'active'

        return (
          // Regular div — GSAP animates entrance (y + opacity)
          // Framer Motion handles only whileHover/whileTap on the button inside
          <div
            key={m.key}
            ref={el => { nodeRefs.current[i] = el }}
            className="absolute z-20 flex flex-col items-center"
            style={{
              // CSS absolute positioning (replaces Framer Motion x/y)
              left: `calc(50% + ${x - NODE_W / 2}px)`,
              top:  `calc(50% + ${y - BTN_SIZE / 2}px)`,
              width: NODE_W,
              gap: 8,
              willChange: 'transform, opacity',
            }}
            onMouseEnter={() => isActive && setHoveredKey(m.key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            {/* Framer Motion only for hover/tap spring on the button */}
            <motion.button
              onClick={() => handleClick(m)}
              disabled={!isActive || isBusy}
              className="relative grid place-items-center flex-shrink-0"
              style={nodeStyles(state, isHov)}
              whileHover={isActive ? { scale: 1.06, y: -3 } : {}}
              whileTap={  isActive ? { scale: 0.94       } : {}}
              transition={SPRING}
            >
              {/* Top specular */}
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: '46%', height: '1px', borderRadius: 99,
                background: 'rgba(255,255,255,0.9)',
              }} />

              {/* Status dot */}
              <span style={dotStyle(state)} />

              {/* Icon */}
              <Icon style={{
                width: 26, height: 26,
                color: iconColor(state, isHov),
                transition: 'color 140ms ease',
                flexShrink: 0,
              }} />

              {/* Busy spinner */}
              {isBusy && (
                <div className="absolute inset-0 grid place-items-center" style={{
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(4px)',
                }}>
                  <div className="animate-spin rounded-full border-2" style={{
                    width: 16, height: 16,
                    borderColor: 'rgba(11,95,141,0.15)',
                    borderTopColor: '#0B5F8D',
                  }} />
                </div>
              )}
            </motion.button>

            {/* Label */}
            <span style={{
              fontSize: '12px', fontWeight: 500, letterSpacing: '-0.01em',
              fontFamily: '"Inter", system-ui, sans-serif',
              color: labelColor(state, isHov),
              transition: 'color 140ms ease',
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

      </div>{/* /systemRef — 3D tilt wrapper */}
    </div>
  )
}
