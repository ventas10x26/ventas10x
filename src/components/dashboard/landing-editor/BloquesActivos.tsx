// Ruta destino: src/components/dashboard/landing-editor/BloquesActivos.tsx

'use client'

export type BloquesConfig = {
  hero: boolean
  stats: boolean
  productos: boolean
  como_funciona: boolean
  testimonios: boolean
  cta_cierre: boolean
}

const BLOQUES = [
  { key: 'hero' as const, label: 'Hero (encabezado)', descripcion: 'Título + foto + CTA principal' },
  { key: 'stats' as const, label: 'Stats sociales', descripcion: 'Métricas como clientes, experiencia, rating' },
  { key: 'productos' as const, label: 'Productos / servicios', descripcion: 'Catálogo con precios' },
  { key: 'como_funciona' as const, label: 'Cómo funciona', descripcion: '3 pasos del proceso' },
  { key: 'testimonios' as const, label: 'Testimonios', descripcion: 'Reseñas de clientes' },
  { key: 'cta_cierre' as const, label: 'CTA de cierre', descripcion: 'Recordatorio del botón al final' },
]

type Props = {
  bloques: BloquesConfig
  onChange: (bloques: BloquesConfig) => void
}

export function BloquesActivos({ bloques, onChange }: Props) {
  const toggle = (key: keyof BloquesConfig) => {
    onChange({ ...bloques, [key]: !bloques[key] })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">
        Activa o desactiva secciones de tu landing según tu sector. El contenido se conserva al desactivar.
      </p>

      {BLOQUES.map((b) => {
        const activo = bloques[b.key] !== false
        return (
          <button
            key={b.key}
            onClick={() => toggle(b.key)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors"
          >
            {/* Switch visual */}
            <div
              className={`flex-shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${activo ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </div>

            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-gray-800">{b.label}</div>
              <div className="text-xs text-gray-500">{b.descripcion}</div>
            </div>

            <span className={`text-xs font-medium ${activo ? 'text-green-600' : 'text-gray-400'}`}>
              {activo ? 'Visible' : 'Oculto'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
