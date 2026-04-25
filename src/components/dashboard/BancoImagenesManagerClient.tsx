// Ruta destino: src/components/dashboard/BancoImagenesManagerClient.tsx
// Página dedicada del banco. Wrap del BancoImagenesPicker con header propio.

'use client'

import { BancoImagenesPicker } from './BancoImagenesPicker'

export function BancoImagenesManagerClient() {
  const onSeleccionar = () => {
    // En esta vista no necesitamos hacer nada al seleccionar,
    // el botón de seleccionar es solo informativo.
    // Si quisieras, podrías abrir un modal con detalles.
  }

  return (
    <div className="px-6 py-8 md:px-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-brand-navy">Mi banco de imágenes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tus imágenes propias. Etiquetadas automáticamente con IA · Compártelas si quieres ayudar a otros vendedores
        </p>
      </header>

      <div className="card p-6">
        <BancoImagenesPicker
          onSeleccionar={onSeleccionar}
          textoBotonSeleccionar="Ver"
        />
      </div>

      <div className="mt-6 card p-5" style={{
        background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
        border: '1px solid #fcd34d',
      }}>
        <div className="text-sm font-semibold text-amber-900 mb-2">
          💡 ¿Cómo funciona el banco?
        </div>
        <div className="text-xs text-amber-800 leading-relaxed">
          <p className="mb-2">
            <strong>📁 Mis imágenes:</strong> Las que has subido tú. Por defecto son privadas (solo tú las ves).
          </p>
          <p className="mb-2">
            <strong>🌍 Públicas:</strong> Imágenes compartidas por otros vendedores que pasaron la moderación IA.
          </p>
          <p className="mb-2">
            <strong>✨ Etiquetas IA:</strong> Cuando subes una imagen, Claude la analiza automáticamente:
            <span className="block ml-3 mt-1">• Le pone etiquetas (ej: &quot;carro&quot;, &quot;suv&quot;, &quot;blanco&quot;)</span>
            <span className="block ml-3">• La categoriza (vehículo, inmueble, alimento, etc.)</span>
            <span className="block ml-3">• Verifica que sea apropiada para uso comercial</span>
          </p>
          <p>
            <strong>🔒 Privacidad:</strong> Las imágenes son privadas por defecto. Click en 🔒 para hacerlas públicas y ayudar a otros vendedores.
          </p>
        </div>
      </div>
    </div>
  )
}
