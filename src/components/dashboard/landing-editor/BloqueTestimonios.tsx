// Ruta destino: src/components/dashboard/landing-editor/BloqueTestimonios.tsx

'use client'

import { useState } from 'react'

type Testimonio = {
  id: string
  nombre_cliente: string
  texto: string
  rating: number
  avatar_url: string | null
  orden?: number
}

type Props = {
  testimoniosIniciales: Testimonio[]
  onChange?: () => void
}

export function BloqueTestimonios({ testimoniosIniciales, onChange }: Props) {
  const [lista, setLista] = useState<Testimonio[]>(testimoniosIniciales)
  const [editando, setEditando] = useState<Testimonio | null>(null)
  const [creando, setCreando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recargar = async () => {
    try {
      const res = await fetch('/api/testimonios', { method: 'GET' })
      const data = await res.json()
      if (data.testimonios) setLista(data.testimonios)
      onChange?.()
    } catch {}
  }

  const empezarCrear = () => {
    setEditando({
      id: 'nuevo',
      nombre_cliente: '',
      texto: '',
      rating: 5,
      avatar_url: null,
    })
    setCreando(true)
    setError(null)
  }

  const empezarEditar = (t: Testimonio) => {
    setEditando({ ...t })
    setCreando(false)
    setError(null)
  }

  const cancelar = () => {
    setEditando(null)
    setCreando(false)
    setError(null)
  }

  const guardar = async () => {
    if (!editando) return
    if (!editando.nombre_cliente.trim() || !editando.texto.trim()) {
      setError('Nombre y testimonio son obligatorios')
      return
    }
    setGuardando(true)
    setError(null)

    try {
      const url = creando ? '/api/testimonios' : `/api/testimonios/${editando.id}`
      const method = creando ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_cliente: editando.nombre_cliente.trim(),
          texto: editando.texto.trim(),
          rating: editando.rating,
          avatar_url: editando.avatar_url || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      await recargar()
      setEditando(null)
      setCreando(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este testimonio?')) return
    try {
      const res = await fetch(`/api/testimonios/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await recargar()
      }
    } catch {}
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Reseñas reales de tus clientes. Aparecen en la sección &ldquo;Lo que dicen mis clientes&rdquo;.
      </p>

      {/* Lista */}
      {lista.length > 0 && (
        <div className="space-y-2">
          {lista.map((t) => (
            <div key={t.id} className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-xs font-semibold overflow-hidden">
                {t.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.avatar_url} alt={t.nombre_cliente} className="w-full h-full object-cover" />
                ) : (
                  t.nombre_cliente.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{t.nombre_cliente}</span>
                  <span className="text-amber-500 text-xs">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{t.texto}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => empezarEditar(t)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-white text-gray-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminar(t.id)}
                  className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón agregar */}
      {!editando && (
        <button
          onClick={empezarCrear}
          className="text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-orange-400 text-gray-600 hover:text-orange-600 w-full"
        >
          + Agregar testimonio
        </button>
      )}

      {/* Form edición/creación */}
      {editando && (
        <div className="border-2 border-orange-300 bg-orange-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">
            {creando ? '+ Nuevo testimonio' : 'Editando testimonio'}
          </h3>

          {error && (
            <div className="text-xs text-red-600 bg-red-100 border border-red-200 rounded p-2">
              ❌ {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Nombre del cliente *</label>
            <input
              value={editando.nombre_cliente}
              onChange={(e) => setEditando({ ...editando, nombre_cliente: e.target.value })}
              maxLength={60}
              className="w-full px-3 py-2 text-sm rounded border border-gray-200 bg-white"
              placeholder="Carolina M."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Testimonio *</label>
            <textarea
              value={editando.texto}
              onChange={(e) => setEditando({ ...editando, texto: e.target.value })}
              maxLength={400}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded border border-gray-200 bg-white resize-none"
              placeholder="Quedé encantado con el servicio..."
            />
            <div className="text-xs text-gray-500 mt-1">{editando.texto.length}/400</div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setEditando({ ...editando, rating: n })}
                    className={`text-xl ${n <= editando.rating ? 'text-amber-400' : 'text-gray-300'} hover:text-amber-500`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-700 block mb-1">URL avatar (opcional)</label>
              <input
                value={editando.avatar_url || ''}
                onChange={(e) => setEditando({ ...editando, avatar_url: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded border border-gray-200 bg-white font-mono"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={cancelar}
              disabled={guardando}
              className="text-sm px-4 py-2 rounded border border-gray-300 hover:bg-white"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="text-sm font-semibold px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : creando ? 'Crear' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
