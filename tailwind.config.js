/** @type {import('tailwindcss').Config} */
// Paleta corporativa — inspirada en modelo ALAS (Linear / Stripe / Raycast feel)
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Superficie / fondo — escala de grises fríos
        surface: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
        },
        // Azul corporativo ALAS (del modelo proyecto)
        brand: {
          900: '#08486A',
          800: '#0B5F8D',
          700: '#0e6fa8',
          500: '#3B82F6',
          100: '#DBEAFE',
          50:  '#EFF6FF',
        },
        // Texto
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
        },
        // Mantener night para Admin Panel (no tocamos esa pantalla)
        night: {
          950: '#030508',
          900: '#050810',
          800: '#080d1c',
          700: '#0d1530',
          600: '#172044',
        },
      },
      fontFamily: {
        sans:    ['"Inter"',   'system-ui', 'sans-serif'],
        display: ['"Sora"',    'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':     '0 1px 4px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.5)',
        'card-hover':'0 8px 24px rgba(11,95,141,0.12), 0 2px 6px rgba(15,23,42,0.06)',
        'panel':    '0 4px 20px rgba(11,95,141,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        'inner':    'inset 0 1px 0 rgba(255,255,255,0.9)',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
