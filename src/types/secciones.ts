// Ruta destino: src/types/secciones.ts
// Types compartidos entre frontend y backend para el sistema de secciones

export type TipoSeccion =
  | 'testimonios'
  | 'faq'
  | 'cta'
  | 'galeria'
  | 'planes'
  | 'stats'
  | 'video'
  | 'mapa'
  | 'bio'
  | 'redes'
  | 'custom'

// ── Contenido por tipo (cada tipo tiene su shape) ──

export interface ContenidoTestimonios {
  items: Array<{
    id: string
    nombre: string
    texto: string
    rating?: number // 1-5
    foto?: string
    empresa?: string
  }>
}

export interface ContenidoFAQ {
  items: Array<{
    id: string
    pregunta: string
    respuesta: string
  }>
}

export interface ContenidoCTA {
  boton_texto: string
  boton_url?: string // opcional, si no, usa whatsapp
  usar_whatsapp: boolean
  mensaje_wa?: string
  descripcion?: string
}

// Tipos que implementaremos después (se dejan los shapes listos)
export interface ContenidoGaleria {
  imagenes: Array<{ url: string; descripcion?: string }>
  columnas: 2 | 3 | 4
}

export interface ContenidoPlanes {
  items: Array<{
    id: string
    nombre: string
    precio: string
    periodo?: string
    descripcion?: string
    features: string[]
    destacado?: boolean
    cta_texto?: string
    cta_url?: string
  }>
}

export interface ContenidoStats {
  items: Array<{ id: string; numero: string; label: string; icono?: string }>
}

export interface ContenidoVideo {
  url: string
  plataforma: 'youtube' | 'vimeo' | 'directo'
}

export interface ContenidoMapa {
  lat: number
  lng: number
  direccion: string
  zoom?: number
}

export interface ContenidoBio {
  foto?: string
  texto: string
  habilidades: string[]
}

export interface ContenidoRedes {
  items: Array<{
    id: string
    plataforma: 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube' | 'twitter'
    url: string
    label?: string
  }>
}

export interface ContenidoCustom {
  html: string
}

// Union type del contenido
export type ContenidoSeccion =
  | ContenidoTestimonios
  | ContenidoFAQ
  | ContenidoCTA
  | ContenidoGaleria
  | ContenidoPlanes
  | ContenidoStats
  | ContenidoVideo
  | ContenidoMapa
  | ContenidoBio
  | ContenidoRedes
  | ContenidoCustom

// ── Fila principal ──
export interface LandingSeccion {
  id: string
  vendedor_id: string
  tipo: TipoSeccion
  orden: number
  activa: boolean
  titulo: string | null
  subtitulo: string | null
  contenido: ContenidoSeccion
  created_at: string
  updated_at: string
}

// ── Metadata de cada tipo para el selector ──
export const SECCIONES_META: Record<
  TipoSeccion,
  {
    nombre: string
    descripcion: string
    icono: string
    color: string
    disponibleMVP: boolean
  }
> = {
  testimonios: {
    nombre: 'Testimonios',
    descripcion: 'Reseñas de clientes satisfechos',
    icono: '⭐',
    color: '#FFB800',
    disponibleMVP: true,
  },
  faq: {
    nombre: 'Preguntas Frecuentes',
    descripcion: 'Resuelve dudas comunes',
    icono: '❓',
    color: '#7C3AED',
    disponibleMVP: true,
  },
  cta: {
    nombre: 'Llamado a la Acción',
    descripcion: 'Botón destacado para convertir',
    icono: '🎯',
    color: '#FF6B2B',
    disponibleMVP: true,
  },
  galeria: {
    nombre: 'Galería',
    descripcion: 'Vitrina de productos o servicios',
    icono: '🖼️',
    color: '#EC4899',
    disponibleMVP: false,
  },
  planes: {
    nombre: 'Planes y Precios',
    descripcion: 'Paquetes con comparación',
    icono: '💰',
    color: '#00BF63',
    disponibleMVP: false,
  },
  stats: {
    nombre: 'Estadísticas',
    descripcion: 'Números que impresionan',
    icono: '📊',
    color: '#185FA5',
    disponibleMVP: false,
  },
  video: {
    nombre: 'Video',
    descripcion: 'Embed de YouTube/Vimeo',
    icono: '🎬',
    color: '#E74C3C',
    disponibleMVP: false,
  },
  mapa: {
    nombre: 'Mapa',
    descripcion: 'Ubicación del negocio',
    icono: '📍',
    color: '#0EA5E9',
    disponibleMVP: false,
  },
  bio: {
    nombre: 'Sobre mí',
    descripcion: 'Biografía del vendedor',
    icono: '👤',
    color: '#8B5CF6',
    disponibleMVP: false,
  },
  redes: {
    nombre: 'Redes Sociales',
    descripcion: 'Enlaces a redes',
    icono: '🔗',
    color: '#F59E0B',
    disponibleMVP: false,
  },
  custom: {
    nombre: 'Personalizada',
    descripcion: 'HTML libre (avanzado)',
    icono: '⚙️',
    color: '#6B7280',
    disponibleMVP: false,
  },
}

// ── Contenido por defecto al crear una sección ──
export function contenidoInicial(tipo: TipoSeccion): ContenidoSeccion {
  switch (tipo) {
    case 'testimonios':
      return { items: [] }
    case 'faq':
      return { items: [] }
    case 'cta':
      return {
        boton_texto: 'Contactar ahora',
        usar_whatsapp: true,
        descripcion: '',
      }
    case 'galeria':
      return { imagenes: [], columnas: 3 }
    case 'planes':
      return { items: [] }
    case 'stats':
      return { items: [] }
    case 'video':
      return { url: '', plataforma: 'youtube' }
    case 'mapa':
      return { lat: 4.711, lng: -74.0721, direccion: 'Bogotá, Colombia', zoom: 13 }
    case 'bio':
      return { texto: '', habilidades: [] }
    case 'redes':
      return { items: [] }
    case 'custom':
      return { html: '' }
  }
}
