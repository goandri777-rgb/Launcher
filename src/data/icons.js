import {
  CalendarDays,
  FileCheck2,
  Trash2,
  Store,
  PackageCheck,
  Boxes,
  Box,
  Settings2,
} from 'lucide-react'

// Ícono personalizado Guaraní "Gs"
const GuaraniIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    {...props}
  >
    <text x="2" y="17" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif"
      stroke="none" fill="currentColor">Gs</text>
  </svg>
)

// Mapea la clave del módulo (definida en BD) a un ícono Lucide.
// Fallback: Box si la clave no está registrada.
export const MODULE_ICONS = {
  calendario:   CalendarDays,  // Calendario Tareas
  acuses:       FileCheck2,    // Acuses de recibo
  borrados:     Trash2,        // Items borrados
  pedidos:      Store,         // Pedidos Caja venta
  recepcion:    PackageCheck,  // Recepción control de mercaderías
  inventario:   Boxes,         // Inventario
  facturacion:  GuaraniIcon,   // Facturación — Guaraníes
  admin:        Settings2,     // Panel admin
}

export const getModuleIcon = (key) => MODULE_ICONS[key] || Box
