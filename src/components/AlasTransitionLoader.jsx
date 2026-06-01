import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'

const OVERLAY_EASE = [0.16, 1, 0.3, 1]

export default function AlasTransitionLoader({ active }) {
  return (
    <AnimatePresence>
      {active && <LoaderStage />}
    </AnimatePresence>
  )
}

function LoaderStage() {
  const shellRef = useRef(null)
  const coreRef = useRef(null)
  const logoRef = useRef(null)
  const ringRef = useRef(null)
  const ringBackRef = useRef(null)
  const scanRef = useRef(null)
  const sparkRefs = useRef([])

  useEffect(() => {
    if (!shellRef.current) return undefined

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const sparks = sparkRefs.current.filter(Boolean)

      gsap.set(coreRef.current, {
        autoAlpha: 0,
        scale: 0.86,
        y: 10,
        transformOrigin: '50% 50%',
        force3D: true,
      })
      gsap.set(logoRef.current, {
        autoAlpha: 0,
        scale: 0.78,
        transformOrigin: '50% 50%',
        force3D: true,
      })
      gsap.set([ringRef.current, ringBackRef.current], {
        rotate: -36,
        transformOrigin: '50% 50%',
        force3D: true,
      })
      gsap.set(scanRef.current, {
        autoAlpha: 0,
        scaleX: 0.32,
        transformOrigin: '50% 50%',
        force3D: true,
      })
      gsap.set(sparks, {
        autoAlpha: 0,
        scale: 0.65,
        transformOrigin: '50% 50%',
        force3D: true,
      })

      if (reduceMotion) {
        gsap.set([coreRef.current, logoRef.current, scanRef.current, ...sparks], {
          autoAlpha: 1,
          scale: 1,
          y: 0,
        })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl
        .to(coreRef.current, { autoAlpha: 1, scale: 1, y: 0, duration: 0.42, ease: 'expo.out' })
        .to(logoRef.current, { autoAlpha: 1, scale: 1, duration: 0.34, ease: 'back.out(1.35)' }, '-=0.24')
        .to(scanRef.current, { autoAlpha: 1, scaleX: 1, duration: 0.36 }, '-=0.24')
        .to(sparks, { autoAlpha: 1, scale: 1, duration: 0.28, stagger: 0.045 }, '-=0.22')

      gsap.to(ringRef.current, {
        rotate: 324,
        duration: 0.9,
        repeat: -1,
        ease: 'none',
      })
      gsap.to(ringBackRef.current, {
        rotate: -396,
        duration: 1.45,
        repeat: -1,
        ease: 'none',
      })
      gsap.to(coreRef.current, {
        scale: 1.025,
        duration: 0.82,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
      gsap.to(scanRef.current, {
        scaleX: 0.42,
        autoAlpha: 0.35,
        duration: 0.72,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
      gsap.to(sparks, {
        autoAlpha: 0.34,
        scale: 0.72,
        duration: 0.62,
        repeat: -1,
        yoyo: true,
        stagger: 0.09,
        ease: 'sine.inOut',
      })
    }, shellRef)

    return () => ctx.revert()
  }, [])

  return (
    <motion.div
      ref={shellRef}
      role="status"
      aria-label="Abriendo modulo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: OVERLAY_EASE }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'auto',
        background:
          'radial-gradient(circle at 50% 44%, rgba(255,255,255,0.98) 0%, rgba(242,247,252,0.96) 42%, rgba(230,237,246,0.94) 100%)',
        backdropFilter: 'blur(18px) saturate(145%)',
        WebkitBackdropFilter: 'blur(18px) saturate(145%)',
      }}
    >
      <div
        ref={coreRef}
        aria-hidden="true"
        style={{
          position: 'relative',
          width: 172,
          height: 172,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,248,255,0.94))',
          border: '1px solid rgba(203,213,225,0.76)',
          boxShadow:
            '0 28px 70px rgba(11,95,141,0.16), 0 8px 22px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,1)',
          overflow: 'visible',
          willChange: 'transform, opacity',
        }}
      >
        <div
          ref={ringBackRef}
          style={{
            position: 'absolute',
            inset: -18,
            borderRadius: '50%',
            border: '1px solid rgba(11,95,141,0.10)',
            borderLeftColor: 'rgba(11,95,141,0.30)',
            borderBottomColor: 'rgba(11,95,141,0.03)',
            willChange: 'transform',
          }}
        />
        <div
          ref={ringRef}
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: '2px solid rgba(11,95,141,0.10)',
            borderTopColor: 'rgba(11,95,141,0.78)',
            borderRightColor: 'rgba(59,130,246,0.28)',
            willChange: 'transform',
          }}
        />

        {[0, 1, 2, 3].map((i) => {
          const positions = [
            { top: 18, left: 84 },
            { top: 84, right: 18 },
            { bottom: 18, left: 84 },
            { top: 84, left: 18 },
          ]

          return (
            <span
              key={i}
              ref={el => { sparkRefs.current[i] = el }}
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(11,95,141,0.68)',
                boxShadow: '0 0 14px rgba(11,95,141,0.32)',
                ...positions[i],
              }}
            />
          )
        })}

        <div
          style={{
            position: 'absolute',
            inset: 18,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 50% 36%, rgba(255,255,255,1), rgba(240,247,255,0.92) 64%, rgba(226,236,247,0.82) 100%)',
            border: '1px solid rgba(226,232,240,0.88)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,1)',
          }}
        />

        <img
          ref={logoRef}
          src="/logo-icon.png"
          alt=""
          draggable="false"
          style={{
            position: 'relative',
            width: 78,
            height: 'auto',
            userSelect: 'none',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 8px 18px rgba(11,95,141,0.16))',
            willChange: 'transform, opacity',
          }}
        />

        <div
          ref={scanRef}
          style={{
            position: 'absolute',
            bottom: 38,
            width: 76,
            height: 2,
            borderRadius: 99,
            background: 'linear-gradient(90deg, transparent, rgba(11,95,141,0.58), transparent)',
            willChange: 'transform, opacity',
          }}
        />
      </div>
    </motion.div>
  )
}
