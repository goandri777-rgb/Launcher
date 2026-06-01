import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración base de Vite con plugin de React.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
