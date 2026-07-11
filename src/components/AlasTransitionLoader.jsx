import { forwardRef, useLayoutEffect, useRef, useState, useEffect } from 'react'
import gsap from 'gsap'

// ── Geometría ─────────────────────────────────────────────────────────────
const HUB_D  = 192
const ARC_R  = HUB_D / 2 + 18
const C      = 2 * Math.PI * ARC_R
const SIZE   = ARC_R * 2 + 44

// 100% GSAP — sin framer-motion.
// El montaje/desmontaje y el fade de salida se orquestan con GSAP: cuando
// `active` pasa a false, se anima la salida y recién en onComplete se desmonta.
export default function AlasTransitionLoader({ active, label = 'Abriendo módulo' }) {
  const [render, setRender] = useState(active)
  const shellRef = useRef(null)

  // Entrada: al activarse, montar de inmediato.
  useEffect(() => {
    if (active) setRender(true)
  }, [active])

  // Salida: al desactivarse (aún montado), animar el shell y desmontar en onComplete.
  useEffect(() => {
    if (active || !render) return undefined
    const el = shellRef.current
    if (!el) { setRender(false); return undefined }

    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (noMotion) { setRender(false); return undefined }

    const tw = gsap.to(el, {
      autoAlpha: 0, y: -10, duration: 0.6, ease: 'power2.in',
      onComplete: () => setRender(false),
    })
    return () => tw.kill()
  }, [active, render])

  if (!render) return null
  return <LoaderStage ref={shellRef} label={label} />
}

const LoaderStage = forwardRef(function LoaderStage({ label }, ref) {
  const stageRef    = useRef(null)
  const coreRef     = useRef(null)
  const logoRef     = useRef(null)
  const arcGroupRef = useRef(null)
  const arcRef      = useRef(null)
  const trackRef    = useRef(null)

  // useLayoutEffect: dispara sincrónicamente ANTES del primer paint.
  // Evita el flash de elementos visibles antes de que GSAP los oculte.
  useLayoutEffect(() => {
    if (!ref || !ref.current) return undefined

    const ctx = gsap.context(() => {
      const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // ── Estados iniciales — se aplican antes del primer paint ────────────
      gsap.set(stageRef.current,    { y: 20 })
      gsap.set(coreRef.current,     { autoAlpha: 0, scale: 0.72, transformOrigin: '50% 50%', force3D: true })
      gsap.set(logoRef.current,     { autoAlpha: 0, transformOrigin: '50% 50%', force3D: true })
      gsap.set(arcGroupRef.current, { autoAlpha: 0 })
      gsap.set(trackRef.current,    { autoAlpha: 0 })
      gsap.set(arcRef.current,      { strokeDasharray: C, strokeDashoffset: C * 0.40 })

      if (noMotion) {
        gsap.set(stageRef.current, { y: 0 })
        gsap.set(
          [coreRef.current, logoRef.current, arcGroupRef.current, trackRef.current],
          { autoAlpha: 1, scale: 1 },
        )
        return
      }

      const CX = SIZE / 2
      const CY = SIZE / 2

      // ── Entrada fluida: stage sube → hub emerge → track → arco ──────────
      const introTl = gsap.timeline({ defaults: { ease: 'expo.out' } })

      introTl
        .to(stageRef.current,    { y: 0, duration: 0.62, ease: 'expo.out' }, 0)
        .to(coreRef.current,     { autoAlpha: 1, scale: 1.04, duration: 0.40, ease: 'back.out(1.4)' }, 0.04)
        .to(coreRef.current,     { scale: 1.0, duration: 0.18, ease: 'power2.out' })
        .to([trackRef.current, logoRef.current], { autoAlpha: 1, duration: 0.36 }, '-=0.28')
        .to(arcGroupRef.current, { autoAlpha: 1, duration: 0.38 }, '-=0.20')

      // ── Idle: hub flota ──────────────────────────────────────────────────
      gsap.to(coreRef.current, {
        y: -5, scale: 1.022, duration: 2.6,
        repeat: -1, yoyo: true, ease: 'sine.inOut',
      })

      // ── Arco: giro continuo + respiración del dash ───────────────────────
      gsap.to(arcGroupRef.current, {
        rotate: 360, duration: 0.95, repeat: -1,
        ease: 'none', svgOrigin: `${CX} ${CY}`,
      })
      gsap.to(arcRef.current, {
        strokeDashoffset: C * 0.82, duration: 0.75,
        repeat: -1, yoyo: true, ease: 'sine.inOut',
      })
    }, ref)

    return () => ctx.revert()
  }, [ref])

  const CX = SIZE / 2
  const CY = SIZE / 2

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'auto',
        background: `
          radial-gradient(circle, rgba(11,95,141,0.055) 1px, transparent 1px),
          radial-gradient(ellipse 70% 55% at 50% 42%, rgba(11,95,141,0.04), transparent 65%),
          linear-gradient(145deg, #edf1f7 0%, #e6ecf5 55%, #edf2f8 100%)
        `,
        backgroundSize: '44px 44px, 100% 100%, 100% 100%',
      }}
    >
      {/* Stage — empieza 20px abajo, sube suavemente */}
      <div
        ref={stageRef}
        style={{
          position: 'relative', width: SIZE, height: SIZE,
          display: 'grid', placeItems: 'center',
          transform: 'translateY(20px)', // estado inicial visible: evita flash en caso de race
        }}
      >

        {/* SVG: track + arco */}
        <svg
          width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <circle
            ref={trackRef}
            cx={CX} cy={CY} r={ARC_R}
            fill="none"
            stroke="rgba(11,95,141,0.09)"
            strokeWidth="1.5"
            style={{ opacity: 0 }} // oculto por CSS: respaldo ante cualquier race
          />
          <g ref={arcGroupRef} style={{ opacity: 0 }}>
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

        {/* Hub central */}
        <div
          ref={coreRef}
          aria-hidden="true"
          style={{
            position: 'relative',
            width: HUB_D, height: HUB_D,
            borderRadius: '50%',
            display: 'grid', placeItems: 'center',
            willChange: 'transform, opacity',
            opacity: 0, // oculto por CSS: respaldo ante cualquier race
          }}
        >
          {/* Anillo pulsante */}
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: '1px solid rgba(11,95,141,0.14)',
            animation: 'hub-ring 4s ease-in-out infinite',
            willChange: 'transform, opacity',
          }} />

          {/* Superficie */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'linear-gradient(145deg, #ffffff 0%, #f4f8ff 100%)',
            border: '1px solid rgba(203,213,225,0.75)',
            animation: 'hub-glow-pulse 4s ease-in-out infinite',
          }} />

          {/* Especular */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '55%', height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,1), transparent)',
            }} />
          </div>

          {/* Logo */}
          <img
            ref={logoRef}
            src="/logo-icon.png"
            alt=""
            draggable="false"
            style={{
              position: 'relative',
              width: Math.round(HUB_D * 0.62),
              height: 'auto',
              userSelect: 'none',
              pointerEvents: 'none',
              opacity: 0,          // oculto por CSS: GSAP lo anima a 1
              filter: 'grayscale(1) brightness(0)',
              willChange: 'transform, opacity',
            }}
          />
        </div>

      </div>
    </div>
  )
})
