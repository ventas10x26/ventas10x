// Ruta destino: src/components/fenix/FenixLogo.tsx
// Logotipo completo: isotipo + tipografia. Se usa en nav, footer y hero.
//
// `uid` existe porque los degradados del SVG se referencian por id: dos copias
// con el mismo id en el documento hacen que la segunda dependa de que la
// primera siga montada (p. ej. el menu movil), y el logo se queda sin color.

import { marcaSvg } from './logo-mark'

type Props = {
  /** Alto del isotipo en px. La tipografia escala con el. */
  size?: number
  /** Superficie sobre la que se dibuja. */
  theme?: 'light' | 'dark'
  /** Muestra la linea "ABOGADOS - TECNOLOGIA - RESULTADOS". */
  claim?: boolean
  /** Identificador unico de los degradados. Uno por instancia. */
  uid: string
}

export function FenixLogo({ size = 34, theme = 'light', claim = false, uid }: Props) {
  const tinta = theme === 'dark' ? '#FFFFFF' : '#14100C'
  const suave = theme === 'dark' ? 'rgba(255,255,255,.55)' : 'rgba(20,16,12,.55)'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>
      <span
        style={{ display: 'flex', flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: marcaSvg(uid, size) }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          fontSize: size * 0.72,
          fontWeight: 700,
          letterSpacing: '-.03em',
          color: tinta,
        }}>
          Fénix
        </span>
        <span style={{
          fontSize: Math.max(6.5, size * 0.198),
          fontWeight: 600,
          letterSpacing: '.085em',
          textTransform: 'uppercase',
          color: suave,
          marginTop: size * 0.1,
          whiteSpace: 'nowrap',
        }}>
          Consultores Empresariales S.A.S.
        </span>
        {claim && (
          <span style={{
            fontSize: Math.max(6.5, size * 0.19),
            fontWeight: 700,
            letterSpacing: '.075em',
            textTransform: 'uppercase',
            color: theme === 'dark' ? '#F5821F' : '#B0570A',
            marginTop: size * 0.14,
            whiteSpace: 'nowrap',
          }}>
            Abogados · Tecnología · Resultados
          </span>
        )}
      </span>
    </span>
  )
}
