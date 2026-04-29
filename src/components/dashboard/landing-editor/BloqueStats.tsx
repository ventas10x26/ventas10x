// Ruta destino: src/components/dashboard/landing-editor/BloqueStats.tsx

'use client'

import { useState } from 'react'

type Stat = { valor: string; label: string }

type Props = {
  stats: Stat[]
  onChange: (stats: Stat[]) => void
  industria?: string
  empresa?: string
  nombreVendedor?: string
  productoPrincipal?: string
}

const STATS_DEFAULT: Stat[] = [
  { valor: '+200', label: 'CLIENTES' },
  { valor: '5 años', label: 'EXPERIENCIA' },
  { valor: '5 min', label: 'RESPUESTA' },
  { valor: '★ 4.9', label: 'RESEÑAS' },
]

export function BloqueStats({
  stats,
  onChange,
  industria,
  empresa,
  nombreVendedor,
  productoPrincipal,
}: Props) {
  const [generando, setGenerando] = useState(false)
  const lista = stats.length > 0 ? stats : STATS_DEFAULT

  const cambiar = (i: number, campo: keyof Stat, valor: string) => {
    const copia = [...lista]
    copia[i] = { ...copia[i], [campo]: valor }
    onChange(copia)
  }

  const agregar = () => {
    if (lista.length >= 6) return
    onChange([...lista, { valor: '', label: '' }])
  }

  const eliminar = (i: number) => {
    if (lista.length <= 1) return
    onChange(lista.filter((_, idx) => idx !== i))
  }

  const regenerar = async () => {
    setGenerando(true)
    try {
      const res = await fetch('/api/landing/ia-autogenerar-bloques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industria, empresa, nombreVendedor, productoPrincipal }),
      })
      const data = await res.json()
      if (data.ok && data.stats) {
        onChange(data.stats)
      }
    } catch (e) {
      console.error('Error regenerando stats:', e)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-gray-500">
          Métricas sociales que aparecen bajo el hero. Sé conservador con los números.
        </p>
        <button
          onClick={regenerar}
          disabled={generando}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-400 text-white disabled:opacity-50"
        >
          {generando ? 'Generando…' : '✨ Regenerar con IA'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {lista.map((s, i) => (
          <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex-1 space-y-1">
              <input
                value={s.valor}
                onChange={(e) => cambiar(i, 'valor', e.target.value)}
                placeholder="+200"
                maxLength={20}
                className="w-full px-2 py-1.5 text-sm font-semibold rounded border border-gray-200 bg-white"
              />
              <input
                value={s.label}
                onChange={(e) => cambiar(i, 'label', e.target.value)}
                placeholder="CLIENTES"
                maxLength={14}
                className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 bg-white uppercase tracking-wide"
              />
            </div>
            {lista.length > 1 && (
              <button
                onClick={() => eliminar(i)}
                className="text-gray-400 hover:text-red-500 px-1 text-lg"
                title="Eliminar"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {lista.length < 6 && (
        <button
          onClick={agregar}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 w-full"
        >
          + Agregar métrica
        </button>
      )}
    </div>
  )
}
