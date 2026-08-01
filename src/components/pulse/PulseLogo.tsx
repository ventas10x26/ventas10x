// Ruta destino: src/components/pulse/PulseLogo.tsx
//
// Identidad de marca de Pulse Motor.
//
// El isotipo va como SVG inline y no como <img>: es un lockup de trazo fino
// (círculo + 12 ticks + onda), así que un PNG a 26px se ve sucio en pantallas @1x
// y obliga a mantener dos archivos —uno por tema— sincronizados a mano. Inline
// escala, hereda el color del tema y no cuesta un request extra en el header,
// que está montado en todas las páginas públicas.
//
// El azul de los ticks y del punto central es fijo (var(--blue)) porque es el
// color de marca. Lo único que cambia entre superficies es la onda y el wordmark,
// de ahí la prop `ink`:
//   · Header  → var(--panel-ink)  (regla dura 9: el header es oscuro sólido
//                                  sin importar el tema de la página)
//   · Footer y superficies que siguen el tema → var(--ink)
//
// Nota sobre dependencias: este archivo no importa F_DISPLAY de _shared/sections
// a propósito. Sections importa componentes, no al revés; hacer que el logo
// dependa de sections crearía un ciclo. La familia se pasa por la variable CSS
// --font-display, que el layout de /pulse ya declara.

const FONT_DISPLAY = 'var(--font-display), var(--font-inter), sans-serif'

export function PulseLogoMark({ size = 26, ink = 'var(--panel-ink)' }: { size?: number; ink?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <circle cx="12" cy="12" r="7.6" fill="none" stroke="var(--blue)" strokeOpacity="0.45" strokeWidth="0.9" />

      {/* 12 ticks cada 30°. Los cardinales (cada 3) van más largos y gruesos: sin esa
          jerarquía el anillo se lee como una rueda dentada en vez de como un dial. */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180
        const cardinal = i % 3 === 0
        const r0 = cardinal ? 9.4 : 8.8
        const r1 = cardinal ? 11.5 : 10.4
        return (
          <line
            key={i}
            x1={(12 + r0 * Math.cos(a)).toFixed(2)}
            y1={(12 + r0 * Math.sin(a)).toFixed(2)}
            x2={(12 + r1 * Math.cos(a)).toFixed(2)}
            y2={(12 + r1 * Math.sin(a)).toFixed(2)}
            stroke="var(--blue)"
            strokeWidth={cardinal ? 1.5 : 1}
            strokeLinecap="round"
          />
        )
      })}

      {/* La onda termina antes que los ticks cardinales E/O a propósito: si llega hasta
          el borde los tapa y el dial pierde sus cuatro puntos de referencia. */}
      <path
        d="M 3.7 12 H 8.2 L 10.1 6.2 L 13.4 17.8 L 15.4 12 H 20.3"
        fill="none"
        stroke={ink}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="12" cy="12" r="1.35" fill="var(--blue)" />
    </svg>
  )
}

// Lockup completo: isotipo + wordmark.
//
// "PulseMotor" va sin espacio y en dos colores, como está definido en los archivos
// de marca. Separarlo en dos palabras rompe el reconocimiento contra la papelería
// y el favicon.
//
// Devuelve un fragmento y no un contenedor propio: quien lo usa ya tiene su flex
// (el <a> del header, la columna del footer) y meterle otro div de por medio
// obligaría a redefinir el gap en dos lugares.
export function PulseLogo({
  size = 26,
  fontSize = 17,
  ink = 'var(--panel-ink)',
}: { size?: number; fontSize?: number; ink?: string }) {
  return (
    <>
      <PulseLogoMark size={size} ink={ink} />
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          fontFamily: FONT_DISPLAY,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: ink,
        }}
      >
        Pulse<span style={{ color: 'var(--blue)' }}>Motor</span>
      </span>
    </>
  )
}
