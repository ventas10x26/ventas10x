// Ruta destino: src/components/dashboard/landing-editor/BloqueComoFunciona.tsx

'use client'

import { useState } from 'react'

type Paso = { titulo: string; descripcion: string }

type Props = {
  pasos: Paso[]
  onChange: (pasos: Paso[]) => void
  industria?: string
  empresa?: string
  nombreVendedor?: string
  productoPrincipal?: string
}

const PASOS_DEFAULT: Paso[] = [
  { titulo: 'Reservas', descripcion: 'Cuéntame qué necesitas. Te respondo rápido.' },
  { titulo: 'Confirmamos', descripcion: 'Validamos detalles y agendamos sin compromiso.' },
  { titulo: 'Resolvemos', descripcion: 'Ejecutamos el servicio con calidad garantizada.' },
]

export function BloqueComoFunciona({
  pasos,
  onChange,
  industria,
  empresa,
  nombreVendedor,
  productoPrincipal,
}: Props) {
  const [generando, setGenerando] = useState(false)
  const lista = pasos.length > 0 ? pasos : PASOS_DEFAULT

  const cambiar = (i: number, campo: keyof Paso, valor: string) => {
    const copia = [...lista]
    copia[i] = { ...copia[i], [campo]: valor }
    onChange(copia)
  }

  const agregar = () => {
    if (lista.length >= 5) return
    onChange([...lista, { titulo: '', descripcion: '' }])
  }

  const eliminar = (i: number) => {
    if (lista.length <= 1) return
    onChange(lista.filter((_, idx) => idx !== i))
  }

  const mover = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= lista.length) return
    const copia = [...lista]
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
    onChange(copia)
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
      if (data.ok && data.como_funciona) {
        onChange(data.como_funciona)
      }
    } catch (e) {
      console.error('Error regenerando pasos:', e)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-gray-500">
          Explica el proceso desde que el cliente llega hasta que recibe el servicio.
        </p>
        <button
          onClick={regenerar}
          disabled={generando}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-400 text-white disabled:opacity-50"
        >
          {generando ? 'Generando…' : '✨ Regenerar con IA'}
        </button>
      </div>

      <div className="space-y-2">
        {lista.map((p, i) => (
          <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold">
              {i + 1}
            </div>

            <div className="flex-1 space-y-1">
              <input
                value={p.titulo}
                onChange={(e) => cambiar(i, 'titulo', e.target.value)}
                placeholder="Reservas"
                maxLength={30}
                className="w-full px-2 py-1.5 text-sm font-semibold rounded border border-gray-200 bg-white"
              />
              <textarea
                value={p.descripcion}
                onChange={(e) => cambiar(i, 'descripcion', e.target.value)}
                placeholder="Cuéntame qué necesitas..."
                maxLength={120}
                rows={2}
                className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 bg-white resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1 text-sm"
                title="Subir"
              >
                ▲
              </button>
              <button
                onClick={() => mover(i, 1)}
                disabled={i === lista.length - 1}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1 text-sm"
                title="Bajar"
              >
                ▼
              </button>
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
          </div>
        ))}
      </div>

      {lista.length < 5 && (
        <button
          onClick={agregar}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 w-full"
        >
          + Agregar paso
        </button>
      )}
    </div>
  )
}
