// Ruta destino: src/components/landing/ProductoCard.tsx
'use client'

import { useState } from 'react'
import type { Producto } from '@/types/database'
import { ProductoLightbox } from './ProductoLightbox'

type Props = {
  producto: Producto
  colorAcento: string
}

/**
 * Renderiza una descripción respetando:
 *  - saltos de línea (\n)
 *  - **texto** convertido a <strong>
 */
function renderDescripcion(texto: string): React.ReactNode {
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

export function ProductoCard({ producto, colorAcento }: Props) {
  const [lightboxAbierto, setLightboxAbierto] = useState(false)
  const [indiceInicial, setIndiceInicial] = useState(0)

  const adicionales = producto.imagenes_adicionales || []
  const totalImagenes = (producto.imagen_principal ? 1 : 0) + adicionales.length
  const todasLasImagenes = [
    ...(producto.imagen_principal ? [producto.imagen_principal] : []),
    ...adicionales,
  ]

  const abrirLightbox = (indice = 0) => {
    if (todasLasImagenes.length === 0) return
    setIndiceInicial(indice)
    setLightboxAbierto(true)
  }

  return (
    <>
      <div
        className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col"
        style={{ borderTop: `3px solid ${colorAcento}` }}
      >
        {/* Imagen principal */}
        {producto.imagen_principal ? (
          <button
            onClick={() => abrirLightbox(0)}
            className="relative block w-full overflow-hidden group"
            style={{
              aspectRatio: '4/3',
              background: '#f3f4f6',
              border: 'none',
              padding: 0,
              cursor: todasLasImagenes.length > 0 ? 'zoom-in' : 'default',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={producto.imagen_principal}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {totalImagenes > 1 && (
              <div
                className="absolute bottom-3 right-3 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm"
                style={{ background: 'rgba(0,0,0,.6)' }}
              >
                📷 {totalImagenes}
              </div>
            )}
          </button>
        ) : (
          <div
            className="w-full flex items-center justify-center"
            style={{
              aspectRatio: '4/3',
              background: '#f3f4f6',
              color: '#9ca3af',
              fontSize: '2rem',
            }}
          >
            📷
          </div>
        )}

        {/* Info */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="font-semibold text-gray-900 mb-2 text-lg leading-snug">
            {producto.nombre}
          </div>

          {producto.descripcion && (
            <div
              className="text-sm text-gray-600 mb-3 flex-1"
              style={{
                whiteSpace: 'pre-wrap',  // respeta saltos y espacios
                lineHeight: 1.65,
              }}
            >
              {renderDescripcion(producto.descripcion)}
            </div>
          )}

          <div className="font-bold text-lg mt-auto" style={{ color: colorAcento }}>
            {producto.precio || 'Consultar precio'}
          </div>
        </div>
      </div>

      {lightboxAbierto && (
        <ProductoLightbox
          imagenes={todasLasImagenes}
          indiceInicial={indiceInicial}
          nombre={producto.nombre}
          onClose={() => setLightboxAbierto(false)}
        />
      )}
    </>
  )
}
