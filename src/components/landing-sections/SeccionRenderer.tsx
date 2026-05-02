// Ruta destino: src/components/landing-sections/SeccionRenderer.tsx

import { LandingSeccion } from '@/types/secciones'
import { SeccionTestimonios } from './SeccionTestimonios'
import { SeccionFAQ } from './SeccionFAQ'
import { SeccionCTA } from './SeccionCTA'
import { CampanaDestacadaSection } from '@/components/landing/CampanaDestacadaSection'
import { ContenidoCampana } from '@/types/secciones'
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
      case 'campana':
        return (
          <CampanaDestacadaSection
            {...commonProps}
            contenido={seccion.contenido as ContenidoCampana}
            colorAcento={colorAcento || '#FF6B2B'}
            whatsapp={whatsappVendedor || ''}
            onCtaClick={() => {
              document.getElementById('cta-principal')?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        )
      // Tipos futuros (todavía no implementados en MVP)
    default:
      return null
  }
}
