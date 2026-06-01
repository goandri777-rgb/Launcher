// Orbs atmosféricos — animación 100% CSS (compositor thread, cero JS runtime).
// filter:blur() es estático; solo se anima opacity vía @keyframes orb-breathe.
const ORBS = [
  { id: 0, left: '3%',  top: '-10%',  w: 580, h: 500, color: 'rgba(56,189,248,0.09)', dur: 24, delay: 0  },
  { id: 1, right: '2%', bottom: '-4%',w: 520, h: 440, color: 'rgba(99,102,241,0.08)', dur: 30, delay: 10 },
  { id: 2, left: '36%', top: '25%',   w: 460, h: 460, color: 'rgba(56,189,248,0.05)', dur: 20, delay: 5  },
]

export default function AmbientLights() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {ORBS.map((o) => (
        <div
          key={o.id}
          style={{
            position: 'absolute',
            left:   o.left,
            right:  o.right,
            top:    o.top,
            bottom: o.bottom,
            width:  o.w,
            height: o.h,
            borderRadius: '50%',
            background: o.color,
            filter: 'blur(72px)',
            animation: `orb-breathe ${o.dur}s ${o.delay}s ease-in-out infinite`,
            willChange: 'opacity',
          }}
        />
      ))}
    </div>
  )
}
