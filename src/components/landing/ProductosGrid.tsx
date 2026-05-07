// Ruta destino: src/components/landing/ProductosGrid.tsx

'use client'

import { useState } from 'react'
import type { Producto } from '@/types/database'

type Props = {
  productos: Producto[]
  colorAcento: string
  whatsapp: string
}

function formatearPrecio(precio: string | null): string {
  if (!precio) return 'Cotizar'
  return precio
}

function whatsappLink(numero: string, producto: string): string {
  if (!numero) return '#'
  const num = numero.replace(/\D/g, '')
  const msg = encodeURIComponent(`Hola, quiero más información sobre ${producto}`)
  return `https://wa.me/${num}?text=${msg}`
}

const LIMITE = 160

export function ProductosGrid({ productos, colorAcento, whatsapp }: Props) {
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})

  const toggleExpandir = (id: string) =>
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <section style={{ padding: '40px 24px', background: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: 'clamp(22px, 2.6vw, 28px)',
            fontWeight: 500, color: '#111', margin: 0,
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            Productos y servicios
          </h2>
          <p style={{ fontSize: '15px', color: '#666', margin: '4px 0 0' }}>
            Te respondo personalmente por WhatsApp en menos de 5 minutos
          </p>
        </div>

        <div className="productos-grid">
          {productos.map((p) => {
            const expandido = expandidos[p.id] || false
            const desc = p.descripcion || ''
            const esCortada = desc.length > LIMITE

            return (
              <article
                key={p.id}
                style={{
                  border: '0.5px solid #eee',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{
                  aspectRatio: '4/3',
                  background: p.imagen_principal
                    ? `url(${p.imagen_principal}) center/cover`
                    : 'linear-gradient(135deg, #f4ebe1, #e8d5bc)',
                }} />

                <div style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flex: 1,
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 580, color: '#111', lineHeight: 1.3 }}>
                    {p.nombre}
                  </div>

                  {desc && (
                    <div>
                      <div style={{
                        fontSize: '14px', color: '#666', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                      }}>
                        {expandido || !esCortada ? desc : desc.slice(0, LIMITE) + '…'}
                      </div>
                      {esCortada && (
                        <button
                          onClick={() => toggleExpandir(p.id)}
                          style={{
                            marginTop: '4px', background: 'none', border: 'none',
                            cursor: 'pointer', color: colorAcento, fontSize: '13px',
                            fontWeight: 600, padding: 0, fontFamily: 'inherit',
                          }}
                        >
                          {expandido ? 'Ver menos ↑' : 'Ver más ↓'}
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{
                    marginTop: 'auto',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '8px', paddingTop: '8px',
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: colorAcento }}>
                      {formatearPrecio(p.precio)}
                    </div>
                    <a
                      href={whatsappLink(whatsapp, p.nombre)}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        background: '#111', color: '#fff', borderRadius: '100px',
                        padding: '7px 14px', fontSize: '13px', fontWeight: 500,
                        textDecoration: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      Consultar
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <style>{`
        .productos-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .productos-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .productos-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
