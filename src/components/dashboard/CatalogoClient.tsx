'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/app/dashboard/catalogo/page'

type ProductoExtraido = {
  id: string // ID local temporal hasta guardar
  nombre: string
  precio: string | null
  descripcion: string
}

type TipoUpload = 'imagen' | 'pdf' | 'excel' | 'texto'

type Props = {
  productosIniciales: Producto[]
}

export function CatalogoClient({ productosIniciales }: Props) {
  const router = useRouter()
  const [tipoActivo, setTipoActivo] = useState<TipoUpload>('texto')
  const [procesando, setProcesando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extraidos, setExtraidos] = useState<ProductoExtraido[]>([])
  const [productos, setProductos] = useState<Producto[]>(productosIniciales)
  const [textoInput, setTextoInput] = useState('')

  const extraerProductos = async () => {
    if (tipoActivo !== 'texto') {
      setError('Imagen, PDF y Excel/CSV llegan pronto. Por ahora prueba con texto.')
      return
    }

    setProcesando(true)
    setError(null)
    setExtraidos([])

    try {
      const res = await fetch('/api/catalogo/extraer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'texto', contenido: textoInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al procesar')

      const productosConId: ProductoExtraido[] = data.productos.map(
        (p: { nombre: string; precio: string | null; descripcion: string }, i: number) => ({
          id: `extraido-${Date.now()}-${i}`,
          nombre: p.nombre,
          precio: p.precio,
          descripcion: p.descripcion,
        })
      )

      setExtraidos(productosConId)
      if (productosConId.length === 0) {
        setError('La IA no encontró productos en el texto. Intenta con una lista más clara.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setProcesando(false)
    }
  }

  const guardarExtraidos = async () => {
    setGuardando(true)
    setError(null)

    try {
      const res = await fetch('/api/catalogo/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productos: extraidos.map(({ nombre, precio, descripcion }) => ({
            nombre,
            precio,
            descripcion,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      // Actualizar lista local con los productos reales devueltos por Supabase
      setProductos((prev) => [...data.productos, ...prev])
      setExtraidos([])
      setTextoInput('')

      // Refrescar datos del server para mantener consistencia
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const descartarExtraidos = () => setExtraidos([])

  const editarExtraido = (id: string, campo: keyof ProductoExtraido, valor: string) => {
    setExtraidos((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)))
  }

  const eliminarExtraido = (id: string) => {
    setExtraidos((prev) => prev.filter((p) => p.id !== id))
  }

  const eliminarProducto = async (id: string) => {
    if (!confirm('¿Eliminar este producto del catálogo?')) return
    setEliminandoId(id)
    try {
      const res = await fetch(`/api/catalogo/productos?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar')
      setProductos((prev) => prev.filter((p) => p.id !== id))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div className="px-6 py-8 md:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-brand-navy">Catálogo IA</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube tu catálogo en el formato que tengas. La IA extrae los productos automáticamente.
        </p>
      </header>

      {/* Card de upload */}
      <section className="card p-6 mb-8">
        <div className="flex gap-1 mb-6 border-b border-gray-100">
          {([
            { id: 'texto', label: 'Texto', icon: '✍️' },
            { id: 'imagen', label: 'Imagen', icon: '📷' },
            { id: 'pdf', label: 'PDF', icon: '📄' },
            { id: 'excel', label: 'Excel / CSV', icon: '📊' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTipoActivo(t.id); setError(null) }}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tipoActivo === t.id
                  ? 'border-brand-orange text-brand-navy'
                  : 'border-transparent text-gray-500 hover:text-brand-navy'
              }`}
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tipoActivo === 'texto' ? (
          <div>
            <label className="label">Pega tu lista de productos aquí</label>
            <textarea
              value={textoInput}
              onChange={(e) => setTextoInput(e.target.value)}
              rows={8}
              className="input font-mono text-sm"
              placeholder={`Ej:
Sofá moderno - $2.450.000 - Tapizado gris, 3 puestos
Mesa de centro nórdica - $680.000 - Madera roble 120x60cm
...`}
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {textoInput.length > 0 && `${textoInput.length} caracteres`}
              </p>
              <button
                onClick={extraerProductos}
                disabled={procesando || !textoInput.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? 'Procesando con IA…' : '✨ Extraer productos'}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">
              {tipoActivo === 'imagen' && '🖼️'}
              {tipoActivo === 'pdf' && '📄'}
              {tipoActivo === 'excel' && '📊'}
            </div>
            <p className="text-sm font-medium text-brand-navy">Próximamente</p>
            <p className="text-xs text-gray-500 mt-1">
              Por ahora usa la pestaña "Texto". Las otras llegan en la próxima actualización.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
      </section>

      {procesando && (
        <section className="card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-brand-orange animate-spin"></div>
            <div>
              <p className="font-semibold text-brand-navy">La IA está leyendo tu catálogo…</p>
              <p className="text-sm text-gray-500">Esto suele tardar entre 3 y 15 segundos.</p>
            </div>
          </div>
        </section>
      )}

      {extraidos.length > 0 && !procesando && (
        <section className="card p-6 mb-8 border-2 border-brand-orange/30">
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">
                ✨ {extraidos.length} {extraidos.length === 1 ? 'producto detectado' : 'productos detectados'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Revisa y edita antes de guardar.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={descartarExtraidos}
                disabled={guardando}
                className="btn-ghost !py-2 !px-4 !text-sm disabled:opacity-50"
              >
                Descartar
              </button>
              <button
                onClick={guardarExtraidos}
                disabled={guardando}
                className="btn-primary !py-2 !px-4 !text-sm disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Guardar todos'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {extraidos.map((p) => (
              <div key={p.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-400 text-center px-1">Sin imagen</span>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <div>
                    <input
                      value={p.nombre}
                      onChange={(e) => editarExtraido(p.id, 'nombre', e.target.value)}
                      className="w-full px-2 py-1 text-sm font-semibold text-brand-navy bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-blue focus:outline-none"
                    />
                    <textarea
                      value={p.descripcion}
                      onChange={(e) => editarExtraido(p.id, 'descripcion', e.target.value)}
                      rows={2}
                      className="mt-1 w-full px-2 py-1 text-sm text-gray-600 bg-transparent border border-transparent hover:border-gray-300 focus:border-brand-blue focus:outline-none rounded resize-none"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <input
                      value={p.precio ?? ''}
                      onChange={(e) => editarExtraido(p.id, 'precio', e.target.value)}
                      placeholder="Sin precio"
                      className="w-36 px-2 py-1 text-sm font-semibold text-brand-orange text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-blue focus:outline-none"
                    />
                    <button
                      onClick={() => eliminarExtraido(p.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold text-brand-navy">Mi catálogo</h2>
          <p className="text-sm text-gray-500">
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {productos.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-gray-500">Aún no tienes productos. Sube tu primer catálogo arriba.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((p) => (
              <article key={p.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-4 flex items-center justify-center">
                  <span className="text-sm text-gray-400">Sin imagen</span>
                </div>
                <h3 className="font-semibold text-brand-navy line-clamp-1">{p.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.descripcion || '—'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-orange">
                    {p.precio || 'Sin precio'}
                  </span>
                  <button
                    onClick={() => eliminarProducto(p.id)}
                    disabled={eliminandoId === p.id}
                    className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    {eliminandoId === p.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
