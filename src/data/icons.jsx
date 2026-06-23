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
} from 'lucide-react'

const GuaraniIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    {...props}
  >
    <text x="2" y="17" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif"
      stroke="none" fill="currentColor">Gs</text>
  </svg>
)

export const MODULE_ICONS = {
  calendario:   CalendarDays,
  acuses:       FileCheck2,
  borrados:     Trash2,
  pedidos:      Store,
  recepcion:    PackageCheck,
  inventario:   Boxes,
  facturacion:  GuaraniIcon,
  flete:              Truck,
  'calculadora-flete': Truck,
  'productividad-picking': BarChart3,
  admin:        Settings2,
}

export const getModuleIcon = (key) => MODULE_ICONS[key] || Box
