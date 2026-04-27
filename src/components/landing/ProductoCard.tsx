// Ruta destino: src/components/landing/ProductoCard.tsx
// REEMPLAZA el archivo. La descripción ahora respeta saltos de línea (\n)
// y soporta bold con **texto** que la IA puede agregar.

'use client'

import { useState } from 'react'
import { ProductoLightbox } from './ProductoLightbox'

type ProductoCardProps = {
  producto: {
    id: string
    nombre: string
    precio: string | null
    descripcion: string | null
    imagen_principal: string | null
    imagenes_adicionales: string[] | null
  }
  colorAcento: string
}

/**
 * Renderiza una descripción con:
 *  - saltos de línea (\n)
 *  - **texto** convertido a <strong>
 */
function renderDescripcion(texto: string): React.ReactNode {
  // Dividir por líneas
  const lineas = texto.split('\n')

  return lineas.map((linea, i) => {
    // Procesar **bold**
    const partes = linea.split(/(\*\*[^*]+\*\*)/g)
    const renderedLinea = partes.map((parte, j) => {
      if (parte.startsWith('**') && parte.endsWith('**')) {
        return (
          <strong key={j} style={{ fontWeight: 700, color: '#0f1c2e' }}>
            {parte.slice(2, -2)}
          </strong>
        )
      }
      return <span key={j}>{parte}</span>
    })

    // Última línea: sin <br/> al final
    return (
      <span key={i}>
        {renderedLinea}
        {i < lineas.length - 1 && <br />}
      </span>
    )
  })
}

export function ProductoCard({ producto, colorAcento }: ProductoCardProps) {
  const [lightboxAbierto, setLightboxAbierto] = useState(false)

  const totalImagenes =
    (producto.imagen_principal ? 1 : 0) + (producto.imagenes_adicionales?.length || 0)

  // Construir array de imágenes para el lightbox
  const imagenesParaLightbox: string[] = []
  if (producto.imagen_principal) imagenesParaLightbox.push(producto.imagen_principal)
  if (producto.imagenes_adicionales) imagenesParaLightbox.push(...producto.imagenes_adicionales)

  return (
    <>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(0,0,0,.05)',
          transition: 'transform .2s, box-shadow .2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.05)'
        }}
      >
        {/* Imagen principal */}
        <div
          onClick={() => totalImagenes > 0 && setLightboxAbierto(true)}
          style={{
            position: 'relative',
            aspectRatio: '4/3',
            background: '#f3f4f6',
            cursor: totalImagenes > 0 ? 'pointer' : 'default',
            overflow: 'hidden',
          }}
        >
          {producto.imagen_principal ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={producto.imagen_principal}
              alt={producto.nombre}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform .3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#d1d5db', fontSize: '3rem',
            }}>
              📷
            </div>
          )}

          {totalImagenes > 1 && (
            <div style={{
              position: 'absolute', bottom: '8px', right: '8px',
              background: 'rgba(0,0,0,.6)', color: '#fff',
              padding: '3px 9px', borderRadius: '999px',
              fontSize: '0.7rem', fontWeight: 600,
              backdropFilter: 'blur(4px)',
            }}>
              📷 {totalImagenes}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontSize: '1rem', fontWeight: 700, color: '#0f1c2e',
            marginBottom: '6px', lineHeight: 1.3,
          }}>
            {producto.nombre}
          </h3>

          {producto.descripcion && (
            <div style={{
              fontSize: '0.85rem',
              color: '#64748b',
              lineHeight: 1.6,
              marginBottom: '12px',
              flex: 1,
              whiteSpace: 'pre-wrap',  // respeta espacios y saltos
            }}>
              {renderDescripcion(producto.descripcion)}
            </div>
          )}

          {producto.precio && (
            <div style={{
              fontSize: '1.05rem', fontWeight: 800,
              color: colorAcento, marginTop: 'auto',
            }}>
              Desde {producto.precio}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxAbierto && imagenesParaLightbox.length > 0 && (
        <ProductoLightbox
          imagenes={imagenesParaLightbox}
          producto={producto.nombre}
          onClose={() => setLightboxAbierto(false)}
        />
      )}
    </>
  )
}
