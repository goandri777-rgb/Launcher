// Líneas decorativas tipo topográfico — esquinas inferior-izquierda y derecha.
// Puro SVG, sin animación, sin JS overhead.
export default function WaveLines() {
  const stroke = 'rgba(56,189,248,VAL)'
  const lines = (opacity) => stroke.replace('VAL', opacity)

  // Genera paths paralelos con offset vertical
  function wavePaths(flip = false) {
    const paths = []
    const offsets = [0, 22, 44, 66, 88, 110]
    for (const dy of offsets) {
      const o = (0.18 - dy * 0.0012).toFixed(3)
      if (o <= 0) break
      const d = flip
        ? `M 320 ${200 + dy} C 260 ${160 + dy} 200 ${185 + dy} 140 ${148 + dy} C 80 ${110 + dy} 40 ${130 + dy} -10 ${100 + dy}`
        : `M -10 ${200 + dy} C 50 ${160 + dy} 110 ${185 + dy} 170 ${148 + dy} C 230 ${110 + dy} 270 ${130 + dy} 320 ${100 + dy}`
      paths.push(<path key={dy} d={d} stroke={lines(o)} strokeWidth="1" fill="none" />)
    }
    return paths
  }

  return (
    <>
      {/* Esquina inferior izquierda */}
      <svg
        aria-hidden
        style={{ position: 'fixed', bottom: 0, left: 0, width: 320, height: 320, pointerEvents: 'none', zIndex: 0, opacity: 0.7 }}
        viewBox="0 0 320 320"
      >
        {wavePaths(false)}
      </svg>

      {/* Esquina inferior derecha (espejada) */}
      <svg
        aria-hidden
        style={{ position: 'fixed', bottom: 0, right: 0, width: 320, height: 320, pointerEvents: 'none', zIndex: 0, opacity: 0.7, transform: 'scaleX(-1)' }}
        viewBox="0 0 320 320"
      >
        {wavePaths(false)}
      </svg>
    </>
  )
}
