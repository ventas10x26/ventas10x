// Ruta destino: src/components/dashboard/landing-editor/SelectorTema.tsx

'use client'

import { SECTOR_THEMES, SECTOR_KEYS, type SectorKey } from '@/lib/sector-themes'

type Props = {
  tema: SectorKey
  onChange: (tema: SectorKey) => void
  onAplicarDefaults?: (tema: SectorKey) => void
}

export function SelectorTema({ tema, onChange, onAplicarDefaults }: Props) {
  const temaActual = SECTOR_THEMES[tema] || SECTOR_THEMES.generico

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        El tema define el estilo visual de tu landing: colores, tipografía, copy por defecto.
        Por defecto se elige según tu industria, pero puedes cambiarlo cuando quieras.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {SECTOR_KEYS.map((k) => {
          const t = SECTOR_THEMES[k]
          const activo = tema === k
          return (
            <button
              key={k}
              onClick={() => onChange(k)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                activo
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{t.emoji}</div>
              <div className="text-sm font-semibold text-gray-800">{t.nombre}</div>
              <div className="text-xs text-gray-500 line-clamp-2">{t.descripcion}</div>
            </button>
          )
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{temaActual.emoji}</span>
          <span className="font-semibold text-gray-800">Tema activo: {temaActual.nombre}</span>
        </div>

        <div className="text-xs text-gray-600 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold w-24">Color primario:</span>
            <span
              className="inline-block w-4 h-4 rounded border border-gray-300"
              style={{ background: temaActual.colorPrimario }}
            />
            <code>{temaActual.colorPrimario}</code>
          </div>
          <div>
            <span className="font-semibold">CTA default:</span>{' '}
            <span className="italic">&ldquo;{temaActual.ctaTextoDefault}&rdquo;</span>
          </div>
          <div>
            <span className="font-semibold">Microcopy:</span>{' '}
            <span className="italic">{temaActual.ctaMicrocopyDefault}</span>
          </div>
        </div>

        {onAplicarDefaults && (
          <button
            onClick={() => {
              if (confirm('Esto sobrescribirá los textos vacíos con los defaults del tema. ¿Continuar?')) {
                onAplicarDefaults(tema)
              }
            }}
            className="mt-3 text-xs font-semibold px-3 py-1.5 rounded bg-orange-500 text-white hover:bg-orange-600"
          >
            ✨ Aplicar defaults del tema en campos vacíos
          </button>
        )}
      </div>
    </div>
  )
}
