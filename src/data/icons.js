import {
  CalendarDays,
  FileCheck2,
  Trash2,
  Store,
  PackageCheck,
  Boxes,
  Box,
  Settings2,
  Receipt,
} from 'lucide-react'

// Mapea la clave del módulo (definida en BD) a un ícono Lucide.
// Fallback: Box si la clave no está registrada.
export const MODULE_ICONS = {
  calendario:   CalendarDays,  // Calendario Tareas
  acuses:       FileCheck2,    // Acuses de recibo
  borrados:     Trash2,        // Items borrados
  pedidos:      Store,         // Pedidos Caja venta
  recepcion:    PackageCheck,  // Recepción control de mercaderías
  inventario:   Boxes,         // Inventario
  facturacion:  Receipt,       // Facturación
  admin:        Settings2,     // Panel admin
}

export const getModuleIcon = (key) => MODULE_ICONS[key] || Box
