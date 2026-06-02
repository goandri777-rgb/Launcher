import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'

// ── Geometría — espeja el CircularLauncher ────────────────────────────────
const SIZE    = 320
const CX      = SIZE / 2
const CY      = SIZE / 2
const ORBIT_R = 118   // radio del anillo orbital (más grande que el hub)
const HUB_D   = 152   // diámetro del hub central (igual al launcher: HUB_R*2=192, este es más compacto)

// 4 puntos orbitales en posiciones cardinales (N, E, S, W)
const ORBITAL_ANGLES = [0, 1, 2, 3].map(i => (i / 4) * 2 * Math.PI - Math.PI / 2)
const ORBITAL_DOTS   = ORBITAL_ANGLES.map(a => ({
  x: CX + Math.cos(a) * ORBIT_R,
  y: CY + Math.sin(a) * ORBIT_R,
}))

export default function AlasTransitionLoader({ active }) {
  return (
    <AnimatePresence>
      {active && <LoaderStage />}
    </AnimatePresence>
  )
}

function LoaderStage() {
  const shellRef   = useRef(null)
  const coreRef    = useRef(null)
  const logoRef    = useRef(null)
  const orbitGRef  = useRef(null)   // <g> del anillo orbital guía
  const dashGRef   = useRef(null)   // <g> de los dashes marchantes
  const dotRefs    = useRef([])

  useEffect(() => {
    if (!shellRef.current) return undefined

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const dots = dotRefs.current.filter(Boolean)

      // ── Estados iniciales ────────────────────────────────────────────────
      gsap.set(coreRef.current,  { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', force3D: true })
      gsap.set(logoRef.current,  { autoAlpha: 0, scale: 0.82, transformOrigin: '50% 50%', force3D: true })
      gsap.set(orbitGRef.current, { autoAlpha: 0 })
      gsap.set(dashGRef.current,  { autoAlpha: 0 })
      gsap.set(dots, { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', force3D: true })

      if (reduceMotion) {
        gsap.set(
          [coreRef.current, logoRef.current, orbitGRef.current, dashGRef.current, ...dots],
          { autoAlpha: 1, scale: 1 },
        )
        return
      }

      // ── Secuencia de entrada — espeja System Online del Launcher ─────────
      const tl = gsap.timeline()
      tl
        // 1. Hub materializa igual que el hub principal
        .to(coreRef.current, { autoAlpha: 1, scale: 1.06, duration: 0.48, ease: 'power4.out' })
        .to(coreRef.current, { scale: 1.0,               duration: 0.18, ease: 'power2.out' })
        // 2. Anillo orbital aparece durante el settle del hub
        .to(orbitGRef.current, { autoAlpha: 1, duration: 0.30, ease: 'power3.out' }, '-=0.26')
        // 3. Logo aparece sobre el hub
        .to(logoRef.current, { autoAlpha: 1, scale: 1, duration: 0.30, ease: 'expo.out' }, '-=0.22')
        // 4. Puntos orbitales materializan en cascada
        .to(dots, { autoAlpha: 1, scale: 1, duration: 0.22, stagger: 0.07, ease: 'expo.out' }, '-=0.16')
        // 5. Dashes marchantes activan
        .to(dashGRef.current, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' }, '-=0.10')

      // ── Animaciones idle ─────────────────────────────────────────────────
      // Hub float (igual que el launcher)
      gsap.to(coreRef.current, {
        y: -5, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut',
      })
      // Anillo orbital: rotación lenta (30s, igual que el launcher)
      gsap.to(orbitGRef.current, {
        rotate: 360, duration: 30, repeat: -1, ease: 'none',
        svgOrigin: `${CX} ${CY}`,
      })
      // Dashes: contra-rotación más rápida para efecto visual
      gsap.to(dashGRef.current, {
        rotate: -360, duration: 16, repeat: -1, ease: 'none',
        svgOrigin: `${CX} ${CY}`,
      })
      // Dots: pulso sutil escalonado
      gsap.to(dots, {
        autoAlpha: 0.38, scale: 0.82, duration: 0.75,
        repeat: -1, yoyo: true, stagger: 0.20, ease: 'sine.inOut',
      })
    }, shellRef)

    return () => ctx.revert()
  }, [])

  return (
    <motion.div
      ref={shellRef}
      role="status"
      aria-live="polite"
      aria-label="Abriendo módulo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'auto',
        // Fondo idéntico al body del Launcher (gradient + textura de puntos)
        background: `
          radial-gradient(circle, rgba(11,95,141,0.055) 1px, transparent 1px),
          radial-gradient(ellipse 70% 55% at 50% 42%, rgba(11,95,141,0.04), transparent 65%),
          linear-gradient(145deg, #edf1f7 0%, #e6ecf5 55%, #edf2f8 100%)
        `,
        backgroundSize: '44px 44px, 100% 100%, 100% 100%',
      }}
    >
      {/* Stage: área de 320×320 centrada */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE, display: 'grid', placeItems: 'center' }}>

        {/* ── Capa SVG: anillo orbital + dashes + puntos ─────────────────── */}
        <svg
          width={SIZE}
          height={SIZE}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <filter id="tl-dot-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Anillo orbital guía — mismo dash que el launcher (3 16) */}
          <g ref={orbitGRef}>
            <circle
              cx={CX} cy={CY} r={ORBIT_R}
              fill="none"
              stroke="rgba(203,213,225,0.60)"
              strokeWidth="1"
              strokeDasharray="3 16"
            />
          </g>

          {/* Dashes marchantes — copia exacta de los connector lines del launcher */}
          <g ref={dashGRef}>
            <circle
              cx={CX} cy={CY} r={ORBIT_R}
              fill="none"
              stroke="rgba(11,95,141,0.28)"
              strokeWidth="1.4"
              strokeDasharray="2 11"
              strokeLinecap="round"
            />
          </g>

          {/* Puntos orbitales — equivalente a los nodos de módulo */}
          {ORBITAL_DOTS.map((d, i) => (
            <circle
              key={i}
              ref={el => { dotRefs.current[i] = el }}
              cx={d.x}
              cy={d.y}
              r={4.5}
              fill="rgba(11,95,141,0.60)"
              filter="url(#tl-dot-glow)"
            />
          ))}
        </svg>

        {/* ── Hub central — espejo exacto del hub de CircularLauncher ──────── */}
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
          {/* Anillo exterior pulsante */}
          <div style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: '1px solid rgba(11,95,141,0.14)',
            animation: 'hub-ring 4s ease-in-out infinite',
            willChange: 'transform, opacity',
          }} />

          {/* Superficie del hub */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #ffffff 0%, #f4f8ff 100%)',
            border: '1px solid rgba(203,213,225,0.75)',
            animation: 'hub-glow 4s ease-in-out infinite',
          }} />

          {/* Línea especular superior */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '55%', height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,1), transparent)',
            }} />
          </div>

          {/* Logo con filtro de color de marca */}
          <img
            ref={logoRef}
            src="/logo-icon.png"
            alt=""
            draggable="false"
            style={{
              position: 'relative',
              width: 76,
              height: 'auto',
              userSelect: 'none',
              pointerEvents: 'none',
              // Mismo filtro de color que el logo del header
              filter: 'brightness(0) saturate(100%) invert(24%) sepia(61%) saturate(1200%) hue-rotate(183deg) brightness(85%)',
              willChange: 'transform, opacity',
            }}
          />
        </div>

      </div>
    </motion.div>
  )
}
