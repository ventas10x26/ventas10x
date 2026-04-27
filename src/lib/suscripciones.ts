// Ruta destino: src/lib/suscripciones.ts
// Helpers reutilizables para el sistema de suscripciones

export type Plan = 'trial' | 'starter' | 'pro' | 'enterprise'
export type Periodo = 'mensual' | 'anual' | 'trial'
export type EstadoSuscripcion = 'activa' | 'vencida' | 'cancelada' | 'pausada'
export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado'

export type Suscripcion = {
  id: string
  vendedor_id: string
  plan: Plan
  periodo: Periodo
  estado: EstadoSuscripcion
  fecha_inicio: string
  fecha_fin: string
  created_at: string
  updated_at: string
}

export type Pago = {
  id: string
  vendedor_id: string
  suscripcion_id: string | null
  plan: Plan
  periodo: Periodo
  monto: number
  comprobante_url: string | null
  comprobante_storage_path: string | null
  estado: EstadoPago
  motivo_rechazo: string | null
  notas_admin: string | null
  notas_vendedor: string | null
  aprobado_por: string | null
  aprobado_at: string | null
  created_at: string
  updated_at: string
}

// ─── Configuración de planes ───
export const PLANES: Record<Plan, {
  nombre: string
  emoji: string
  descripcion: string
  precioMensual: number
  precioAnual: number
  ahorroAnual: string
  caracteristicas: string[]
  destacado: boolean
}> = {
  trial: {
    nombre: 'Trial',
    emoji: '🎁',
    descripcion: '14 días gratis para probarlo todo',
    precioMensual: 0,
    precioAnual: 0,
    ahorroAnual: '',
    caracteristicas: [
      'Todas las funciones de Pro',
      'Productos ilimitados',
      'Bot IA por WhatsApp',
      'Pipeline visual',
      '14 días sin tarjeta',
    ],
    destacado: false,
  },
  starter: {
    nombre: 'Starter',
    emoji: '🚀',
    descripcion: 'Para asesores que están empezando',
    precioMensual: 49000,
    precioAnual: 490000, // 2 meses gratis
    ahorroAnual: 'Ahorras $98.000',
    caracteristicas: [
      'Hasta 50 productos en catálogo',
      'Bot IA básico por WhatsApp',
      'Pipeline visual',
      'Banco de imágenes (50)',
      'Notificaciones por email',
      '1 usuario',
    ],
    destacado: false,
  },
  pro: {
    nombre: 'Pro',
    emoji: '⭐',
    descripcion: 'Para asesores que quieren escalar',
    precioMensual: 99000,
    precioAnual: 990000, // 2 meses gratis
    ahorroAnual: 'Ahorras $198.000',
    caracteristicas: [
      'Productos ilimitados',
      'Bot IA avanzado por industria',
      'Pipeline + automatizaciones',
      'Banco de imágenes ilimitado',
      'Notificaciones email + WhatsApp',
      'Mejora masiva con IA',
      'Análisis de imágenes con IA',
      'Soporte prioritario',
      'Hasta 5 usuarios',
    ],
    destacado: true,
  },
  enterprise: {
    nombre: 'Enterprise',
    emoji: '🏢',
    descripcion: 'Para empresas con necesidades únicas',
    precioMensual: 0,
    precioAnual: 0,
    ahorroAnual: '',
    caracteristicas: [
      'Todo lo de Pro',
      'Usuarios ilimitados',
      'Integraciones custom',
      'Gestor de cuenta dedicado',
      'SLA garantizado',
      'Onboarding personalizado',
    ],
    destacado: false,
  },
}

/** Formato de moneda colombiana */
export function formatearCOP(monto: number): string {
  return monto.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/** Días restantes en suscripción */
export function diasRestantes(fechaFin: string): number {
  const ahora = Date.now()
  const fin = new Date(fechaFin).getTime()
  const diff = fin - ahora
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/** Está activa la suscripción? */
export function esSuscripcionActiva(sub: Suscripcion | null): boolean {
  if (!sub) return false
  if (sub.estado !== 'activa') return false
  return new Date(sub.fecha_fin).getTime() > Date.now()
}

/** Está en trial? */
export function esTrial(sub: Suscripcion | null): boolean {
  return sub?.plan === 'trial' && esSuscripcionActiva(sub)
}

/** Necesita renovar (faltan 3 días o menos)? */
export function necesitaRenovar(sub: Suscripcion | null): boolean {
  if (!esSuscripcionActiva(sub)) return false
  return diasRestantes(sub!.fecha_fin) <= 3
}

/** Datos de Nequi para pago */
export const DATOS_NEQUI = {
  numero: '3014339418',           // ⚠️ CAMBIA por tu número real
  titular: 'Ricardo Zambrano',     // ⚠️ CAMBIA por tu nombre real
  qrUrl: '/nequi-qr.png',          // ⚠️ Sube tu QR a public/nequi-qr.png
}
