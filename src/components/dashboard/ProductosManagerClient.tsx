// Ruta destino: src/components/dashboard/ProductosManagerClient.tsx
// REEMPLAZA. Agrega botón "✨ Mejorar todas con IA" en el header
// y un modal con el resumen de qué productos se mejoraron.

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Producto } from '@/types/database'
import { ProductoEditorModal } from './ProductoEditorModal'

type ResultadoMejora = {
  id: string
  nombre: string
  estado: 'mejorado' | 'omitido' | 'error'
  motivo?: string
}

type ResumenMejora = {
  total: number
  mejorados: number
  omitidos: number
  errores: number
  resultados: ResultadoMejora[]
}

export function ProductosManagerClient() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [creandoNuevo, setCreandoNuevo] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  // ── Mejora masiva ──
  const [mejorandoTodos, setMejorandoTodos] = useState(false)
  const [resumenMejora, setResumenMejora] = useState<ResumenMejora | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/productos')
      const data = await res.json()
      if (data.productos) setProductos(data.productos)
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al cargar productos' })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(null), 3500)
    return () => clearTimeout(t)
  }, [mensaje])

  const eliminar = async (producto: Producto) => {
    if (!confirm(`¿Eliminar el producto "${producto.nombre}"? Sus imágenes también se eliminarán.`)) return

    try {
      const res = await fetch(`/api/productos/${producto.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error')
      setProductos(p => p.filter(x => x.id !== producto.id))
      setMensaje({ tipo: 'ok', texto: 'Producto eliminado' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar' })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = productos.findIndex(p => p.id === active.id)
    const newIndex = productos.findIndex(p => p.id === over.id)
    const nuevoOrden = arrayMove(productos, oldIndex, newIndex)
    setProductos(nuevoOrden)

    try {
      await fetch('/api/productos/reordenar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: nuevoOrden.map(p => p.id) }),
      })
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al reordenar, recarga la página' })
    }
  }

  const onProductoActualizado = (actualizado: Producto) => {
    setProductos(p => p.map(x => x.id === actualizado.id ? actualizado : x))
    setEditando(null)
    setMensaje({ tipo: 'ok', texto: 'Producto actualizado' })
  }

  const onProductoCreado = (nuevo: Producto) => {
    setProductos(p => [...p, nuevo])
    setCreandoNuevo(false)
    setEditando(nuevo)
    setMensaje({ tipo: 'ok', texto: 'Producto creado. Agrega imágenes y detalles.' })
  }

  // ── Mejorar todas las descripciones ──
  const mejorarTodas = async () => {
    if (productos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No hay productos que mejorar' })
      return
    }

    if (!confirm(
      `¿Mejorar el formato de las descripciones de los ${productos.length} productos con IA?\n\n` +
      `Esto puede tardar unos segundos. La IA solo modificará productos con descripciones largas sin formato.`
    )) return

    setMejorandoTodos(true)
    setResumenMejora(null)
    try {
      const res = await fetch('/api/productos/mejorar-todos', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error en la mejora masiva')

      setResumenMejora({
        total: data.total,
        mejorados: data.mejorados,
        omitidos: data.omitidos,
        errores: data.errores,
        resultados: data.resultados,
      })

      // Recargar productos para mostrar las nuevas descripciones
      await cargar()
    } catch (e) {
      setMensaje({
        tipo: 'error',
        texto: e instanceof Error ? e.message : 'Error al mejorar',
      })
    } finally {
      setMejorandoTodos(false)
    }
  }

  return (
    <div className="px-6 py-8 md:px-10">
      <header className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-brand-navy">Mis productos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Arrastra para reordenar · Click para editar · {productos.length} producto{productos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {productos.length > 0 && (
            <button
              onClick={mejorarTodas}
              disabled={mejorandoTodos}
              style={{
                background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 700,
                cursor: mejorandoTodos ? 'wait' : 'pointer',
                opacity: mejorandoTodos ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 2px 8px rgba(255,107,43,.25)',
              }}
              title="La IA mejorará el formato de las descripciones largas"
            >
              {mejorandoTodos ? (
                <>
                  <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                  Mejorando...
                </>
              ) : '✨ Mejorar todas con IA'}
            </button>
          )}
          <button
            onClick={() => setCreandoNuevo(true)}
            className="btn-primary !py-2 !px-4 !text-sm"
          >
            + Nuevo producto
          </button>
        </div>
      </header>

      {mensaje && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
          mensaje.tipo === 'ok'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <div className="text-center py-12 text-gray-500">Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-brand-navy mb-2">
            Aún no tienes productos
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Agrega los productos o servicios que quieras mostrar en tu landing.
          </p>
          <button
            onClick={() => setCreandoNuevo(true)}
            className="btn-primary !text-sm"
          >
            + Crear mi primer producto
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={productos.map(p => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {productos.map(producto => (
                <ProductoItem
                  key={producto.id}
                  producto={producto}
                  onEditar={() => setEditando(producto)}
                  onEliminar={() => eliminar(producto)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal de creación */}
      {creandoNuevo && (
        <ProductoEditorModal
          modo="crear"
          onClose={() => setCreandoNuevo(false)}
          onGuardado={onProductoCreado}
        />
      )}

      {/* Modal de edición */}
      {editando && (
        <ProductoEditorModal
          modo="editar"
          producto={editando}
          onClose={() => setEditando(null)}
          onGuardado={onProductoActualizado}
        />
      )}

      {/* Modal de resumen de mejora masiva */}
      {resumenMejora && (
        <ResumenMejoraModal
          resumen={resumenMejora}
          onClose={() => setResumenMejora(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Card individual sortable
// ═══════════════════════════════════════════════════════════════

type ProductoItemProps = {
  producto: Producto
  onEditar: () => void
  onEliminar: () => void
}

function ProductoItem({ producto, onEditar, onEliminar }: ProductoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: producto.id })

  const totalFotos =
    (producto.imagen_principal ? 1 : 0) + (producto.imagenes_adicionales?.length || 0)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card overflow-hidden flex flex-col"
    >
      <div
        onClick={onEditar}
        className="relative cursor-pointer overflow-hidden bg-gray-100"
        style={{ aspectRatio: '4/3' }}
      >
        {producto.imagen_principal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={producto.imagen_principal}
            alt={producto.nombre}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <div className="text-center">
              <div className="text-4xl mb-1">📷</div>
              <div className="text-xs text-gray-400">Sin imagen</div>
            </div>
          </div>
        )}

        {totalFotos > 0 && (
          <div className="absolute bottom-2 right-2 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm bg-black/50">
            📷 {totalFotos}
          </div>
        )}

        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-grab"
          style={{ touchAction: 'none' }}
          title="Arrastrar para reordenar"
        >
          ⋮⋮
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-semibold text-gray-900 line-clamp-1 flex-1">
            {producto.nombre}
          </div>
        </div>
        {producto.descripcion && (
          <div className="text-xs text-gray-500 mb-3 line-clamp-2" style={{ whiteSpace: 'pre-wrap' }}>
            {producto.descripcion}
          </div>
        )}
        <div className="font-bold text-brand-orange mt-auto">
          {producto.precio || 'Consultar precio'}
        </div>
      </div>

      <div className="border-t border-gray-100 px-3 py-2 flex justify-between items-center bg-gray-50">
        <button
          onClick={onEditar}
          className="text-xs text-brand-blue font-medium hover:text-brand-blue-dark"
        >
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="text-xs text-red-500 font-medium hover:text-red-700"
        >
          🗑 Eliminar
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Modal con resumen de mejora masiva
// ═══════════════════════════════════════════════════════════════

function ResumenMejoraModal({
  resumen,
  onClose,
}: {
  resumen: ResumenMejora
  onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px',
          maxWidth: '560px', width: '100%',
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f1c2e' }}>
            ✨ Resultado de la mejora con IA
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Total', valor: resumen.total, color: '#64748b' },
              { label: 'Mejorados', valor: resumen.mejorados, color: '#10b981' },
              { label: 'Omitidos', valor: resumen.omitidos, color: '#9ca3af' },
              { label: 'Errores', valor: resumen.errores, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '0.75rem 0.5rem',
                background: '#f9fafb', borderRadius: '10px',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>
                  {s.valor}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {resumen.mejorados > 0 && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#166534',
            }}>
              ✅ <strong>{resumen.mejorados}</strong> producto{resumen.mejorados !== 1 ? 's' : ''} con descripción mejorada. ¡Revisa tu landing pública!
            </div>
          )}

          {/* Lista detallada */}
          <div style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600, marginBottom: '0.5rem' }}>
            Detalle por producto:
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {resumen.resultados.map(r => (
              <div
                key={r.id}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {r.nombre}
                  </div>
                  {r.motivo && (
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {r.motivo}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  padding: '2px 8px', borderRadius: '999px',
                  background:
                    r.estado === 'mejorado' ? 'rgba(16,185,129,.12)' :
                    r.estado === 'omitido' ? 'rgba(156,163,175,.12)' :
                    'rgba(239,68,68,.12)',
                  color:
                    r.estado === 'mejorado' ? '#059669' :
                    r.estado === 'omitido' ? '#6b7280' :
                    '#dc2626',
                  flexShrink: 0,
                  textTransform: 'capitalize',
                }}>
                  {r.estado === 'mejorado' && '✓ '}
                  {r.estado === 'error' && '⚠ '}
                  {r.estado}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', marginTop: '1.25rem',
              background: '#0f1c2e', color: '#fff',
              border: 'none', borderRadius: '10px',
              padding: '0.7rem', fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
