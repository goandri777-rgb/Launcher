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
  if (state === 'blocked')  return 'rgba(239,68,68,0.22)'
  if (state === 'inactive') return 'rgba(203,213,225,0.45)'
  return 'rgba(203,213,225,0.65)'
}

function nodeStyles(state, hov) {
  const base = {
    borderRadius: 20, width: BTN_SIZE, height: BTN_SIZE,
    transition: 'none',
    transformOrigin: '50% 50%',
    backfaceVisibility: 'hidden',
    willChange: 'transform, background-color, border-color, box-shadow',
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
  const [busyKey, setBusyKey] = useState(null)
  // ── Refs for GSAP ────────────────────────────────────────────────────────
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

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const nodes = nodeRefs.current.filter(Boolean)
      const dashLines = lineDashRefs.current.filter(Boolean)

      floatTween.current?.kill()
      floatTween.current = null

      // ── Estados iniciales ──────────────────────────────────────────────────
      gsap.set(hubRef.current, {
        autoAlpha: 0,
        scale: 0.78,
        y: 10,
        transformOrigin: 'center center',
        force3D: true,
      })
      gsap.set(orbitRef.current, {
        autoAlpha: 0,
        scale: 0.96,
        transformOrigin: 'center center',
        force3D: true,
      })

      lineBaseRefs.current.forEach(path => {
        if (!path) return
        const len = path.getTotalLength ? path.getTotalLength() : 200
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0.92 })
      })

      gsap.set(dashLines, { opacity: 0 })
      gsap.set(nodes, {
        autoAlpha: 0,
        scale: 0.78,
        y: 14,
        transformOrigin: '50% 50%',
        force3D: true,
      })

      if (reduceMotion) {
        gsap.set(hubRef.current, { autoAlpha: 1, scale: 1, y: 0 })
        gsap.set(orbitRef.current, { autoAlpha: 1, scale: 1 })
        lineBaseRefs.current.forEach(path => path && gsap.set(path, { strokeDashoffset: 0 }))
        gsap.set(dashLines, { opacity: 1 })
        gsap.set(nodes, { autoAlpha: 1, scale: 1, y: 0 })
        return
      }

      const goLive = () => {
        floatTween.current = gsap.to(hubRef.current, {
          y: -4,
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: FLOAT_EASE,
          overwrite: false,
        })
        gsap.to(dashLines, {
          opacity: 1,
          duration: 0.72,
          stagger: 0.055,
          ease: 'sine.out',
        })
      }

      const tl = gsap.timeline({
        delay: 0.18,
        defaults: { ease: INTRO_EASE },
        onComplete: goLive,
      })

      // 1. Hub carga — explosión power4.out → settle elegante
      tl
        .to(hubRef.current, { autoAlpha: 1, scale: 1, y: 0, duration: 0.78, ease: SETTLE_EASE })
        .to(orbitRef.current, { autoAlpha: 1, scale: 1, duration: 0.65, ease: 'power2.out' }, '-=0.52')

      // 2. Orbit ring aparece con el settle del hub
      // Orbit ring now overlaps the hub reveal to avoid a hard phase break.

      // 3. Módulos se conectan uno a uno — clockwise, con pulso de energía
      for (let i = 0; i < modules.length; i++) {
        if (!lineBaseRefs.current[i] || !nodeRefs.current[i]) continue
        const t = 0.48 + i * 0.115

        // Línea se dibuja hub → nodo
        tl.to(lineBaseRefs.current[i], {
          strokeDashoffset: 0,
          duration: 0.44,
          ease: 'power2.inOut',
        }, t)

        // Pulso viaja por la línea
        tl.call(() => firePulse(i), [], t + 0.10)

        // Nodo materializa
        tl.to(nodeRefs.current[i], {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 0.50,
          ease: 'back.out(1.16)',
        }, t + 0.20)
      }
    })

    return () => {
      ctx.revert()
      floatTween.current?.kill()
      floatTween.current = null
    }
  }, [modules.length]) // eslint-disable-line

  // ── 2. Hub reacts to module hover ────────────────────────────────────────
  // Hover is handled imperatively in animateModuleHover to avoid SVG re-renders.

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
    gsap.set(pulseEl, { attr: { cx: x1, cy: y1, r: 4 }, opacity: 0.9 })
    gsap.to(pulseEl, {
      attr: { cx: x2, cy: y2, r: 2.5 },
      opacity: 0,
      duration: 0.56,
      ease: 'power2.out',
    })
  }, [modules.length])

  const animateModuleHover = useCallback((moduleIndex, module, on) => {
    if (getState(module) !== 'active') return

    const buttonEl = buttonRefs.current[moduleIndex]
    const nodeEl = nodeRefs.current[moduleIndex]
    if (nodeEl) gsap.set(nodeEl, { zIndex: on ? 32 : 20 })
    if (!buttonEl) return

    const iconEl = nodeEl?.querySelector('[data-module-icon]')
    const labelEl = nodeEl?.querySelector('[data-module-label]')

    gsap.killTweensOf([buttonEl, iconEl, labelEl].filter(Boolean))
    gsap.to(buttonEl, {
      scale: on ? 1.07 : 1,
      y: on ? -2 : 0,
      backgroundColor: on ? C.surfaceHov : C.surface,
      borderColor: on ? C.borderHov : C.border,
      boxShadow: on
        ? '0 14px 34px rgba(11,95,141,0.13), 0 4px 12px rgba(15,23,42,0.06)'
        : '0 1px 4px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.4)',
      duration: on ? 0.24 : 0.20,
      ease: 'power2.out',
      overwrite: 'auto',
      force3D: true,
    })
    if (iconEl) {
      gsap.to(iconEl, {
        color: on ? C.brand : '#475569',
        duration: 0.18,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
    if (labelEl) {
      gsap.to(labelEl, {
        color: on ? C.brand : C.text2,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }, [])

  const handleClick = async (m) => {
    if (getState(m) !== 'active') return
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
      className="relative grid place-items-center select-none"
      style={{ width: SIZE, height: SIZE, maxWidth: '92vw', perspective: '900px' }}
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
          const isHov = false
          const isBusy = busyKey === m.key

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
                  stroke={
                    isBusy ? 'rgba(11,95,141,0.7)'
                    : isHov ? 'rgba(11,95,141,0.55)'
                    : 'rgba(11,95,141,0.22)'
                  }
                  strokeWidth={isBusy ? 1.8 : isHov ? 1.5 : 1.2}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="2 11"
                  style={{
                    animation: `dash-march ${isBusy ? 0.45 : isHov ? 0.9 : 1.8}s linear infinite`,
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
              disabled={!isActive || isBusy}
              className="relative grid place-items-center flex-shrink-0"
              style={nodeStyles(state, isHov)}
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
              <Icon data-module-icon style={{
                width: 26, height: 26,
                color: iconColor(state, isHov),
                transition: 'none',
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
            </button>

            {/* Label */}
            <span data-module-label style={{
              fontSize: '12px', fontWeight: 500, letterSpacing: '-0.01em',
              fontFamily: '"Inter", system-ui, sans-serif',
              color: labelColor(state, isHov),
              transition: 'none',
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
