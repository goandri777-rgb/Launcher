import {
  CalendarDays,
  FileCheck2,
  Trash2,
  Store,
  PackageCheck,
  Boxes,
  Box,
  Settings2,
  Truck,
  BarChart3,
  ReceiptText,
} from 'lucide-react'

export const MODULE_ICONS = {
  calendario:   CalendarDays,
  acuses:       FileCheck2,
  borrados:     Trash2,
  pedidos:      Store,
  recepcion:    PackageCheck,
  inventario:   Boxes,
  'control-facturas':  ReceiptText,
  flete:              Truck,
  'calculadora-flete': Truck,
  'productividad-picking': BarChart3,
  admin:        Settings2,
}

export const getModuleIcon = (key) => MODULE_ICONS[key] || Box
