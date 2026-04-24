// Ruta destino: src/components/landing-sections/SeccionRenderer.tsx

import { LandingSeccion } from '@/types/secciones'
import { SeccionTestimonios } from './SeccionTestimonios'
import { SeccionFAQ } from './SeccionFAQ'
import { SeccionCTA } from './SeccionCTA'
import {
  ContenidoTestimonios,
  ContenidoFAQ,
  ContenidoCTA,
} from '@/types/secciones'

type Props = {
  seccion: LandingSeccion
  colorAcento?: string
  whatsappVendedor?: string | null
}

export function SeccionRenderer({
  seccion,
  colorAcento,
  whatsappVendedor,
}: Props) {
  if (!seccion.activa) return null

  const commonProps = {
    titulo: seccion.titulo,
    subtitulo: seccion.subtitulo,
    colorAcento,
  }

  switch (seccion.tipo) {
    case 'testimonios':
      return (
        <SeccionTestimonios
          {...commonProps}
          contenido={seccion.contenido as ContenidoTestimonios}
        />
      )
    case 'faq':
      return (
        <SeccionFAQ
          {...commonProps}
          contenido={seccion.contenido as ContenidoFAQ}
        />
      )
    case 'cta':
      return (
        <SeccionCTA
          {...commonProps}
          contenido={seccion.contenido as ContenidoCTA}
          whatsappVendedor={whatsappVendedor}
        />
      )
    // Tipos futuros (todavía no implementados en MVP)
    default:
      return null
  }
}
