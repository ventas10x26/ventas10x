// Ruta destino: src/components/landing-sections/SeccionTestimonios.tsx

import { ContenidoTestimonios } from '@/types/secciones'

type Props = {
  titulo?: string | null
  subtitulo?: string | null
  contenido: ContenidoTestimonios
  colorAcento?: string
}

export function SeccionTestimonios({ titulo, subtitulo, contenido, colorAcento = '#FF6B2B' }: Props) {
  const items = contenido?.items || []
  if (items.length === 0) return null

  return (
    <section style={{ padding: '4rem 1.5rem', background: '#fafafa' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {titulo && (
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            textAlign: 'center',
            color: '#0f1c2e',
            marginBottom: subtitulo ? '0.5rem' : '2.5rem',
          }}>
            {titulo}
          </h2>
        )}
        {subtitulo && (
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '1rem' }}>
            {subtitulo}
          </p>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {items.map((t) => (
            <div
              key={t.id}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                border: '1px solid rgba(0,0,0,.05)',
              }}
            >
              {/* Rating */}
              {t.rating && (
                <div style={{ marginBottom: '0.75rem', color: '#FFB800', fontSize: '1rem' }}>
                  {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                </div>
              )}

              {/* Texto del testimonio */}
              <p style={{
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: '#374151',
                marginBottom: '1rem',
                fontStyle: 'italic',
              }}>
                &ldquo;{t.texto}&rdquo;
              </p>

              {/* Autor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {t.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.foto}
                    alt={t.nombre}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: colorAcento, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1rem',
                  }}>
                    {t.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, color: '#0f1c2e', fontSize: '0.9rem' }}>
                    {t.nombre}
                  </div>
                  {t.empresa && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {t.empresa}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
