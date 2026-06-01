import { motion } from 'framer-motion'

// Configuración fija — se calcula una sola vez al cargar el módulo.
const PARTICLES = [
  { id: 0,  left: '8%',  top: '14%', size: 1.5, dur: 14, delay: 0,   opacity: 0.18 },
  { id: 1,  left: '22%', top: '72%', size: 1,   dur: 11, delay: 1.5, opacity: 0.12 },
  { id: 2,  left: '38%', top: '8%',  size: 2,   dur: 16, delay: 0.8, opacity: 0.14 },
  { id: 3,  left: '55%', top: '82%', size: 1,   dur: 12, delay: 2.2, opacity: 0.10 },
  { id: 4,  left: '68%', top: '18%', size: 1.5, dur: 13, delay: 0.4, opacity: 0.16 },
  { id: 5,  left: '80%', top: '60%', size: 1,   dur: 10, delay: 3.0, opacity: 0.12 },
  { id: 6,  left: '90%', top: '30%', size: 2,   dur: 15, delay: 1.0, opacity: 0.13 },
  { id: 7,  left: '14%', top: '45%', size: 1,   dur: 11, delay: 2.6, opacity: 0.11 },
  { id: 8,  left: '48%', top: '92%', size: 1.5, dur: 14, delay: 0.2, opacity: 0.09 },
  { id: 9,  left: '75%', top: '78%', size: 1,   dur: 12, delay: 1.8, opacity: 0.14 },
  { id: 10, left: '30%', top: '28%', size: 2,   dur: 17, delay: 0.6, opacity: 0.10 },
  { id: 11, left: '62%', top: '48%', size: 1,   dur: 9,  delay: 3.4, opacity: 0.16 },
  { id: 12, left: '5%',  top: '85%', size: 1.5, dur: 13, delay: 2.0, opacity: 0.11 },
  { id: 13, left: '93%', top: '8%',  size: 1,   dur: 11, delay: 1.2, opacity: 0.13 },
]

export default function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: 'rgba(56,189,248,1)',
            boxShadow: `0 0 ${p.size * 3}px rgba(56,189,248,0.8)`,
          }}
          animate={{
            y: [0, -(10 + p.size * 4), 0],
            x: [0, p.id % 2 === 0 ? 4 : -4, 0],
            opacity: [p.opacity, p.opacity * 2.2, p.opacity],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
