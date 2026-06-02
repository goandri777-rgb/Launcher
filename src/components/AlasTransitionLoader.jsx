import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'

// ── Geometría ─────────────────────────────────────────────────────────────
const HUB_D  = 148                           // diámetro del hub (igual al launcher)
const ARC_R  = HUB_D / 2 + 18               // radio del arco: 92px (fuera del hub ring)
const C      = 2 * Math.PI * ARC_R          // circunferencia ≈ 578px
const SIZE   = ARC_R * 2 + 44               // canvas SVG: 228px (arco + margen)

export default function AlasTransitionLoader({ active }) {
  return (
    <AnimatePresence>
      {active && <LoaderStage />}
    </AnimatePresence>
  )
}

function LoaderStage() {
  const shellRef    = useRef(null)
  const coreRef     = useRef(null)
  const logoRef     = useRef(null)
  const arcGroupRef = useRef(null)
  const arcRef      = useRef(null)
  const trackRef    = useRef(null)

  useEffect(() => {
    if (!shellRef.current) return undefined

    const ctx = gsap.context(() => {
      const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // ── Estados iniciales ────────────────────────────────────────────────
      gsap.set(coreRef.current,     { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', force3D: true })
      gsap.set(logoRef.current,     { autoAlpha: 0,              transformOrigin: '50% 50%', force3D: true })
      gsap.set(arcGroupRef.current, { autoAlpha: 0 })
      gsap.set(trackRef.current,    { autoAlpha: 0 })
      // Arco: ~215° visible al inicio
      gsap.set(arcRef.current, { strokeDasharray: C, strokeDashoffset: C * 0.40 })

      if (noMotion) {
        gsap.set(
          [coreRef.current, logoRef.current, arcGroupRef.current, trackRef.current],
          { autoAlpha: 1, scale: 1 },
        )
        return
      }

      const CX = SIZE / 2
      const CY = SIZE / 2

      // ── Entrada: hub como System Online, luego arco aparece ─────────────
      gsap.timeline()
        .to(coreRef.current,     { autoAlpha: 1, scale: 1.05, duration: 0.45, ease: 'power4.out' })
        .to(coreRef.current,     { scale: 1.0,               duration: 0.16, ease: 'power2.out' })
        .to(trackRef.current,    { autoAlpha: 1, duration: 0.22, ease: 'power2.out' }, '-=0.18')
        .to(logoRef.current,     { autoAlpha: 1, duration: 0.26, ease: 'expo.out' },   '-=0.18')
        .to(arcGroupRef.current, { autoAlpha: 1, duration: 0.30, ease: 'power2.out' }, '-=0.16')

      // ── Idle: hub flota (igual que el launcher) ──────────────────────────
      gsap.to(coreRef.current, {
        y: -5, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut',
      })

      // ── Arco: giro continuo + respiración del largo (spinner iOS) ────────
      gsap.to(arcGroupRef.current, {
        rotate: 360,
        duration: 1.3,
        repeat: -1,
        ease: 'none',
        svgOrigin: `${CX} ${CY}`,
      })
      gsap.to(arcRef.current, {
        strokeDashoffset: C * 0.76,   // oscila entre ~215° y ~86° de arco visible
        duration: 0.90,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, shellRef)

    return () => ctx.revert()
  }, [])

  const CX = SIZE / 2
  const CY = SIZE / 2

  return (
    <motion.div
      ref={shellRef}
      role="status"
      aria-live="polite"
      aria-label="Abriendo módulo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'auto',
        // Fondo idéntico al body del Launcher
        background: `
          radial-gradient(circle, rgba(11,95,141,0.055) 1px, transparent 1px),
          radial-gradient(ellipse 70% 55% at 50% 42%, rgba(11,95,141,0.04), transparent 65%),
          linear-gradient(145deg, #edf1f7 0%, #e6ecf5 55%, #edf2f8 100%)
        `,
        backgroundSize: '44px 44px, 100% 100%, 100% 100%',
      }}
    >
      {/* Stage centrado */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE, display: 'grid', placeItems: 'center' }}>

        {/* ── SVG: track + arco giratorio ────────────────────────────────── */}
        <svg
          width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          {/* Track: círculo completo muy sutil */}
          <circle
            ref={trackRef}
            cx={CX} cy={CY} r={ARC_R}
            fill="none"
            stroke="rgba(11,95,141,0.09)"
            strokeWidth="1.5"
          />

          {/* Arco giratorio: el spinner */}
          <g ref={arcGroupRef}>
            <circle
              ref={arcRef}
              cx={CX} cy={CY} r={ARC_R}
              fill="none"
              stroke="#0B5F8D"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* ── Hub central: espejo exacto del hub del launcher ─────────────── */}
        <div
          ref={coreRef}
          aria-hidden="true"
          style={{
            position: 'relative',
            width: HUB_D,
            height: HUB_D,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            willChange: 'transform, opacity',
          }}
        >
          {/* Anillo pulsante exterior */}
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: '1px solid rgba(11,95,141,0.14)',
            animation: 'hub-ring 4s ease-in-out infinite',
            willChange: 'transform, opacity',
          }} />

          {/* Superficie del hub */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'linear-gradient(145deg, #ffffff 0%, #f4f8ff 100%)',
            border: '1px solid rgba(203,213,225,0.75)',
            animation: 'hub-glow 4s ease-in-out infinite',
          }} />

          {/* Línea especular */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '55%', height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,1), transparent)',
            }} />
          </div>

          {/* Logo: gris minimalista, igual que el watermark del hub */}
          <img
            ref={logoRef}
            src="/logo-icon.png"
            alt=""
            draggable="false"
            style={{
              position: 'relative',
              width: 64,
              height: 'auto',
              userSelect: 'none',
              pointerEvents: 'none',
              opacity: 0.14,
              filter: 'grayscale(1) brightness(0)',
              willChange: 'transform, opacity',
            }}
          />
        </div>

      </div>
    </motion.div>
  )
}
