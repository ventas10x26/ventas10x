// Ruta destino: src/lib/sector-themes.ts
// Diccionario central de temas por sector. Mantenible en un solo lugar.

export type SectorKey =
  | 'automotriz'
  | 'inmobiliaria'
  | 'salud'
  | 'retail'
  | 'tecnologia'
  | 'belleza'
  | 'servicios'
  | 'generico'

export type StatDefault = { valor: string; label: string }
export type PasoDefault = { titulo: string; descripcion: string }

export type SectorTheme = {
  key: SectorKey
  nombre: string
  emoji: string
  descripcion: string

  // Visual
  colorPrimario: string
  colorSecundario: string
  fontHero: string

  // Hero
  heroLayout: 'split' | 'centered' | 'full-image'
  tituloDefault: string
  subtituloDefault: string
  badgePromoDefault: string

  // CTA
  ctaTextoDefault: string
  ctaMicrocopyDefault: string

  // Bloques con datos default
  statsDefault: StatDefault[]
  comoFuncionaDefault: PasoDefault[]

  // Catálogo
  catalogoTitulo: string
  catalogoSubtitulo: string

  // CTA cierre
  ctaCierreTitulo: string
  ctaCierreDescripcion: string
}

// ═══════════════════════════════════════════
// AUTOMOTRIZ
// ═══════════════════════════════════════════
const automotriz: SectorTheme = {
  key: 'automotriz',
  nombre: 'Automotriz',
  emoji: '🚗',
  descripcion: 'Concesionarios, asesores de carros, motos y vehículos comerciales',

  colorPrimario: '#0f1c2e',
  colorSecundario: '#FF6B2B',
  fontHero: "'Inter', system-ui, sans-serif",

  heroLayout: 'split',
  tituloDefault: 'Tu próximo carro\nestá aquí.',
  subtituloDefault: 'Asesoría personalizada, financiación a tu medida y entrega rápida. Te ayudo a elegir el carro ideal.',
  badgePromoDefault: 'Cupos para test drive esta semana',

  ctaTextoDefault: 'Cotizar y agendar test drive',
  ctaMicrocopyDefault: '⚡ Te respondo en menos de 1 hora por WhatsApp',

  statsDefault: [
    { valor: '+150', label: 'CARROS ENTREGADOS' },
    { valor: '8 años', label: 'EXPERIENCIA' },
    { valor: '★ 4.8', label: 'CALIFICACIÓN' },
    { valor: '24/7', label: 'ATENCIÓN' },
  ],
  comoFuncionaDefault: [
    { titulo: 'Eliges', descripcion: 'Cuéntame qué buscas: presupuesto, marca, uso.' },
    { titulo: 'Cotizamos', descripcion: 'Te envío opciones con financiación a tu medida.' },
    { titulo: 'Entregamos', descripcion: 'Test drive, papeleo y entrega rápida.' },
  ],

  catalogoTitulo: 'Modelos disponibles',
  catalogoSubtitulo: 'Stock confirmado · Test drive sin compromiso',

  ctaCierreTitulo: '¿Listo para estrenar?',
  ctaCierreDescripcion: 'Escríbeme ahora por WhatsApp. Te asesoro personalmente y agendamos tu test drive.',
}

// ═══════════════════════════════════════════
// INMOBILIARIA
// ═══════════════════════════════════════════
const inmobiliaria: SectorTheme = {
  key: 'inmobiliaria',
  nombre: 'Inmobiliaria',
  emoji: '🏠',
  descripcion: 'Asesores inmobiliarios, ventas y arriendos de propiedades',

  colorPrimario: '#1e3a5f',
  colorSecundario: '#d4a574',
  fontHero: "'Inter', system-ui, sans-serif",

  heroLayout: 'split',
  tituloDefault: 'El hogar que buscas,\nya está esperándote.',
  subtituloDefault: 'Apartamentos, casas y oficinas en las mejores zonas. Te acompaño en todo el proceso, sin rodeos.',
  badgePromoDefault: 'Inmuebles disponibles esta semana',

  ctaTextoDefault: 'Agendar visita',
  ctaMicrocopyDefault: '🏠 Te muestro 3 opciones que se ajustan a tu presupuesto',

  statsDefault: [
    { valor: '+80', label: 'PROPIEDADES' },
    { valor: '10 años', label: 'EN EL SECTOR' },
    { valor: '★ 4.9', label: 'CLIENTES FELICES' },
    { valor: '48h', label: 'RESPUESTA' },
  ],
  comoFuncionaDefault: [
    { titulo: 'Conversamos', descripcion: 'Me cuentas qué buscas: zona, presupuesto, tipo.' },
    { titulo: 'Selecciono', descripcion: 'Te muestro 3 opciones que cumplen tus criterios.' },
    { titulo: 'Visitamos', descripcion: 'Agendamos visitas y cerramos el trato.' },
  ],

  catalogoTitulo: 'Inmuebles disponibles',
  catalogoSubtitulo: 'Visitas con cita previa · Cero presión',

  ctaCierreTitulo: '¿Encontremos tu próximo hogar?',
  ctaCierreDescripcion: 'Cuéntame qué buscas y te muestro las mejores opciones disponibles hoy.',
}

// ═══════════════════════════════════════════
// SALUD
// ═══════════════════════════════════════════
const salud: SectorTheme = {
  key: 'salud',
  nombre: 'Salud',
  emoji: '🩺',
  descripcion: 'Médicos, odontólogos, psicólogos, nutricionistas y profesionales de la salud',

  colorPrimario: '#1d9e75',
  colorSecundario: '#FF6B2B',
  fontHero: "'Inter', system-ui, sans-serif",

  heroLayout: 'split',
  tituloDefault: 'Tu salud,\nen buenas manos.',
  subtituloDefault: 'Atención personalizada y tratamientos efectivos. Te acompaño en cada paso de tu cuidado.',
  badgePromoDefault: 'Citas disponibles esta semana',

  ctaTextoDefault: 'Reservar valoración',
  ctaMicrocopyDefault: '⚡ Te respondo personalmente por WhatsApp en minutos',

  statsDefault: [
    { valor: '+500', label: 'PACIENTES' },
    { valor: '12 años', label: 'EXPERIENCIA' },
    { valor: '★ 4.9', label: 'RESEÑAS' },
    { valor: '5 min', label: 'RESPUESTA' },
  ],
  comoFuncionaDefault: [
    { titulo: 'Reservas', descripcion: 'Cuéntame qué necesitas. Te respondo rápido.' },
    { titulo: 'Te valoro', descripcion: 'Diagnóstico claro y plan personalizado.' },
    { titulo: 'Resolvemos', descripcion: 'Tratamiento con seguimiento y garantía.' },
  ],

  catalogoTitulo: 'Tratamientos disponibles',
  catalogoSubtitulo: 'Atención personalizada · Cita en menos de 24h',

  ctaCierreTitulo: '¿Listo para cuidar de ti?',
  ctaCierreDescripcion: 'Escríbeme ahora por WhatsApp y agendamos tu primera valoración sin compromiso.',
}

// ═══════════════════════════════════════════
// RETAIL
// ═══════════════════════════════════════════
const retail: SectorTheme = {
  key: 'retail',
  nombre: 'Retail',
  emoji: '🛍️',
  descripcion: 'Tiendas de ropa, electrodomésticos, productos físicos en general',

  colorPrimario: '#dc2626',
  colorSecundario: '#0f1c2e',
  fontHero: "'Inter', system-ui, sans-serif",

  heroLayout: 'split',
  tituloDefault: 'Lo que buscas,\nhoy mismo.',
  subtituloDefault: 'Stock confirmado, envío rápido y atención personal. Cómprame por WhatsApp y recibe en casa.',
  badgePromoDefault: 'Envíos en 24h · Stock confirmado',

  ctaTextoDefault: 'Ver disponibilidad',
  ctaMicrocopyDefault: '📦 Stock confirmado en 5 min · Envío el mismo día',

  statsDefault: [
    { valor: '+1.000', label: 'VENTAS' },
    { valor: '★ 4.8', label: 'CLIENTES FELICES' },
    { valor: '24h', label: 'ENVÍOS' },
    { valor: '5 min', label: 'RESPUESTA' },
  ],
  comoFuncionaDefault: [
    { titulo: 'Eliges', descripcion: 'Mira el catálogo y dime qué te interesa.' },
    { titulo: 'Confirmamos', descripcion: 'Verifico stock y te paso datos de pago.' },
    { titulo: 'Te llega', descripcion: 'Envío en 24h con seguimiento.' },
  ],

  catalogoTitulo: 'Productos disponibles',
  catalogoSubtitulo: 'Stock real · Pago seguro · Envío garantizado',

  ctaCierreTitulo: '¿Listo para tu compra?',
  ctaCierreDescripcion: 'Escríbeme y te confirmo stock, precios y opciones de envío al instante.',
}

// ═══════════════════════════════════════════
// TECNOLOGÍA
// ═══════════════════════════════════════════
const tecnologia: SectorTheme = {
  key: 'tecnologia',
  nombre: 'Tecnología',
  emoji: '💻',
  descripcion: 'SaaS, software, agencias digitales, soluciones tech',

  colorPrimario: '#0a0a0a',
  colorSecundario: '#3b82f6',
  fontHero: "'Inter', system-ui, sans-serif",

  heroLayout: 'split',
  tituloDefault: 'Tu negocio,\n10x más eficiente.',
  subtituloDefault: 'Soluciones tecnológicas que ahorran tiempo y aumentan ventas. Implementación clara, soporte real.',
  badgePromoDefault: 'Demos gratis esta semana',

  ctaTextoDefault: 'Solicitar demo',
  ctaMicrocopyDefault: '🚀 Demo en vivo de 20 min · Sin tarjeta de crédito',

  statsDefault: [
    { valor: '+50', label: 'CLIENTES' },
    { valor: '99.9%', label: 'UPTIME' },
    { valor: '★ 4.9', label: 'NPS' },
    { valor: '< 1h', label: 'SOPORTE' },
  ],
  comoFuncionaDefault: [
    { titulo: 'Demo', descripcion: 'Te muestro la solución en 20 minutos.' },
    { titulo: 'Implementamos', descripcion: 'Configuramos todo en menos de una semana.' },
    { titulo: 'Crecemos', descripcion: 'Soporte continuo y mejoras mensuales.' },
  ],

  catalogoTitulo: 'Soluciones',
  catalogoSubtitulo: 'Diseñadas para resultados medibles desde el día 1',

  ctaCierreTitulo: '¿Quieres ver cómo funciona?',
  ctaCierreDescripcion: 'Agenda una demo y te muestro cómo resolver tu caso específico.',
}

// ═══════════════════════════════════════════
// BELLEZA & BIENESTAR
// ═══════════════════════════════════════════
const belleza: SectorTheme = {
  key: 'belleza',
  nombre: 'Belleza & Bienestar',
  emoji: '✨',
  descripcion: 'Peluquerías, spas, estética, fitness, nutrición',

  colorPrimario: '#ec4899',
  colorSecundario: '#0a0a0a',
  fontHero: "'Inter', system-ui, sans-serif",

  heroLayout: 'split',
  tituloDefault: 'Date un momento\npara ti.',
  subtituloDefault: 'Servicios pensados para que te sientas y te veas increíble. Reserva tu espacio en minutos.',
  badgePromoDefault: 'Cupos disponibles esta semana',

  ctaTextoDefault: 'Reservar mi cita',
  ctaMicrocopyDefault: '✨ Confirmación inmediata · Recordatorios por WhatsApp',

  statsDefault: [
    { valor: '+800', label: 'CLIENTES' },
    { valor: '6 años', label: 'EXPERIENCIA' },
    { valor: '★ 4.9', label: 'RESEÑAS' },
    { valor: '5 min', label: 'RESPUESTA' },
  ],
  comoFuncionaDefault: [
    { titulo: 'Eliges', descripcion: 'Mira los servicios y elige el que quieras.' },
    { titulo: 'Reservas', descripcion: 'Te confirmo cupo y horario por WhatsApp.' },
    { titulo: 'Disfrutas', descripcion: 'Llegas, te cuido y sales encantada.' },
  ],

  catalogoTitulo: 'Servicios',
  catalogoSubtitulo: 'Reserva tu espacio · Sin filas, sin esperas',

  ctaCierreTitulo: '¿Lista para tu momento?',
  ctaCierreDescripcion: 'Reserva ahora por WhatsApp y aparta tu cita esta semana.',
}

// ═══════════════════════════════════════════
// SERVICIOS PROFESIONALES
// ═══════════════════════════════════════════
const servicios: SectorTheme = {
  key: 'servicios',
  nombre: 'Servicios Profesionales',
  emoji: '💼',
  descripcion: 'Consultores, abogados, contadores, coaches, freelancers',

  colorPrimario: '#0f1c2e',
  colorSecundario: '#FF6B2B',
  fontHero: "'Inter', system-ui, sans-serif",

  heroLayout: 'split',
  tituloDefault: 'Soluciones claras\npara decisiones difíciles.',
  subtituloDefault: 'Asesoría experta y resultados concretos. Te ayudo a resolver lo que necesitas, sin enredos.',
  badgePromoDefault: 'Primera consulta sin costo',

  ctaTextoDefault: 'Agendar consulta',
  ctaMicrocopyDefault: '💼 Primera reunión sin compromiso · 30 min',

  statsDefault: [
    { valor: '+200', label: 'CLIENTES' },
    { valor: '10 años', label: 'EXPERIENCIA' },
    { valor: '★ 4.9', label: 'CALIFICACIÓN' },
    { valor: '24h', label: 'RESPUESTA' },
  ],
  comoFuncionaDefault: [
    { titulo: 'Diagnóstico', descripcion: 'Conversamos sin compromiso sobre tu caso.' },
    { titulo: 'Propuesta', descripcion: 'Te envío plan claro con tiempos y costos.' },
    { titulo: 'Ejecutamos', descripcion: 'Acompañamiento hasta el resultado.' },
  ],

  catalogoTitulo: 'Mis servicios',
  catalogoSubtitulo: 'Resultados medibles · Sin sorpresas en honorarios',

  ctaCierreTitulo: '¿Hablamos de tu caso?',
  ctaCierreDescripcion: 'Agenda una primera consulta sin costo y vemos si puedo ayudarte.',
}

// ═══════════════════════════════════════════
// GENÉRICO (fallback)
// ═══════════════════════════════════════════
const generico: SectorTheme = {
  key: 'generico',
  nombre: 'Asesor General',
  emoji: '⭐',
  descripcion: 'Tema general para cualquier industria',

  colorPrimario: '#0f1c2e',
  colorSecundario: '#FF6B2B',
  fontHero: "'Inter', system-ui, sans-serif",

  heroLayout: 'split',
  tituloDefault: 'Tu próximo paso\nempieza con un mensaje.',
  subtituloDefault: 'Atención personalizada por WhatsApp. Te respondo rápido y sin compromiso.',
  badgePromoDefault: 'Disponible esta semana',

  ctaTextoDefault: 'Reservar mi cita',
  ctaMicrocopyDefault: '⚡ Te respondo en 5 min por WhatsApp',

  statsDefault: [
    { valor: '+200', label: 'CLIENTES' },
    { valor: '5 años', label: 'EXPERIENCIA' },
    { valor: '5 min', label: 'RESPUESTA' },
    { valor: '★ 4.9', label: 'RESEÑAS' },
  ],
  comoFuncionaDefault: [
    { titulo: 'Reservas', descripcion: 'Cuéntame qué necesitas. Te respondo rápido.' },
    { titulo: 'Confirmamos', descripcion: 'Validamos detalles y agendamos sin compromiso.' },
    { titulo: 'Resolvemos', descripcion: 'Ejecutamos el servicio con calidad.' },
  ],

  catalogoTitulo: 'Productos y servicios',
  catalogoSubtitulo: 'Atención personalizada por WhatsApp',

  ctaCierreTitulo: '¿Listo para dar el siguiente paso?',
  ctaCierreDescripcion: 'Escríbeme ahora por WhatsApp. Te respondo personalmente y resolvemos tu caso sin compromiso.',
}

// ═══════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════
export const SECTOR_THEMES: Record<SectorKey, SectorTheme> = {
  automotriz,
  inmobiliaria,
  salud,
  retail,
  tecnologia,
  belleza,
  servicios,
  generico,
}

export const SECTOR_KEYS: SectorKey[] = [
  'automotriz', 'inmobiliaria', 'salud', 'retail',
  'tecnologia', 'belleza', 'servicios', 'generico',
]

/**
 * Devuelve el tema según la clave (con fallback al genérico).
 */
export function getTheme(key: string | null | undefined): SectorTheme {
  if (!key) return generico
  const lower = key.toLowerCase()
  if (lower in SECTOR_THEMES) {
    return SECTOR_THEMES[lower as SectorKey]
  }
  return generico
}

/**
 * Detecta el tema desde el campo libre `industria` (texto del usuario).
 * Usa pattern matching sobre el string. Si no encuentra match, devuelve 'generico'.
 */
export function detectThemeFromIndustria(industria: string | null | undefined): SectorKey {
  if (!industria) return 'generico'
  const i = industria.toLowerCase()

  if (i.includes('automotriz') || i.includes('auto') || i.includes('vehic') || i.includes('carro') || i.includes('moto')) return 'automotriz'
  if (i.includes('inmobil') || i.includes('bienes raices') || i.includes('real estate')) return 'inmobiliaria'
  if (i.includes('salud') || i.includes('medic') || i.includes('dental') || i.includes('odonto') || i.includes('psico') || i.includes('nutric')) return 'salud'
  if (i.includes('retail') || i.includes('tienda') || i.includes('comerc') || i.includes('ropa')) return 'retail'
  if (i.includes('tecno') || i.includes('saas') || i.includes('software') || i.includes('digital')) return 'tecnologia'
  if (i.includes('bellez') || i.includes('spa') || i.includes('fitness') || i.includes('peluquer') || i.includes('estetica')) return 'belleza'
  if (i.includes('servicio') || i.includes('consultor') || i.includes('abogad') || i.includes('coach') || i.includes('contador')) return 'servicios'

  return 'generico'
}
