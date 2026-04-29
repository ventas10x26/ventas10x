// Ruta destino: src/components/landing/CTACierre.tsx

'use client'

type Props = {
  colorAcento: string
  ctaTexto: string
  ctaMicrocopy: string
  whatsapp: string
  mensajeWa: string
  slug: string
}

function whatsappLink(numero: string, mensaje: string, slug: string): string {
  if (!numero) return '#'
  const num = numero.replace(/\D/g, '')
  const msg = encodeURIComponent(
    mensaje?.trim() || `Hola, vengo desde tu landing (${slug}) y quiero más información.`
  )
  return `https://wa.me/${num}?text=${msg}`
}

export function CTACierre({
  colorAcento,
  ctaTexto,
  ctaMicrocopy,
  whatsapp,
  mensajeWa,
  slug,
}: Props) {
  return (
    <section style={{
      padding: '56px 24px',
      textAlign: 'center',
      background: `linear-gradient(180deg, #fff 0%, ${colorAcento}15 100%)`,
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: 'clamp(26px, 3vw, 34px)',
          fontWeight: 500,
          color: '#111',
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          ¿Listo para dar el siguiente paso?
        </h2>
        <p style={{
          fontSize: 'clamp(14px, 1.5vw, 16px)',
          color: '#555',
          margin: '0 0 24px',
          lineHeight: 1.5,
        }}>
          Escríbeme ahora por WhatsApp. Te respondo personalmente y resolvemos tu caso sin compromiso.
        </p>

        <a
          href={whatsappLink(whatsapp, mensajeWa, slug)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: colorAcento,
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 32px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: `0 8px 22px ${colorAcento}3a`,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          {ctaTexto} →
        </a>

        <div style={{
          fontSize: '12px',
          color: '#888',
          marginTop: '12px',
        }}>
          {ctaMicrocopy}
        </div>
      </div>
    </section>
  )
}
