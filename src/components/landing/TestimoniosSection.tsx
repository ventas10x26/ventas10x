// Ruta destino: src/components/landing/TestimoniosSection.tsx

'use client'

type Testimonio = {
  id: string
  nombre_cliente: string
  texto: string
  rating: number
  avatar_url: string | null
}

type Props = {
  testimonios: Testimonio[]
}

export function TestimoniosSection({ testimonios }: Props) {
  if (!testimonios || testimonios.length === 0) return null

  return (
    <section style={{
      padding: '40px 24px',
      background: '#faf9f6',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: 'clamp(22px, 2.6vw, 28px)',
          fontWeight: 500,
          color: '#111',
          margin: '0 0 24px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          Lo que dicen mis clientes
        </h2>

        <div className="testimonios-grid">
          {testimonios.map((t) => (
            <div
              key={t.id}
              style={{
                background: '#fff',
                border: '0.5px solid #eee',
                borderRadius: '14px',
                padding: '18px',
              }}
            >
              <div style={{
                color: '#f5a623',
                fontSize: '12px',
                marginBottom: '8px',
                letterSpacing: '1px',
              }}>
                {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
              </div>

              <div style={{
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#333',
                marginBottom: '14px',
              }}>
                &ldquo;{t.texto}&rdquo;
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {t.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.avatar_url}
                    alt={t.nombre_cliente}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#d4a574',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {t.nombre_cliente.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{
                  fontSize: '12px',
                  color: '#555',
                  fontWeight: 500,
                }}>
                  {t.nombre_cliente}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .testimonios-grid {
          display: grid;
          grid-template-columns: repeat(${Math.min(testimonios.length, 3)}, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .testimonios-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .testimonios-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
