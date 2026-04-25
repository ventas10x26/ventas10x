// Ruta destino: src/components/dashboard/ProductosManagerClient.tsx
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

export function ProductosManagerClient() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [creandoNuevo, setCreandoNuevo] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

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

  // Auto-ocultar mensaje
  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(null), 3500)
    return () => clearTimeout(t)
  }, [mensaje])

  // Eliminar
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

  // Drag & Drop
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
    // Abrir editor para que agregue imágenes
    setEditando(nuevo)
    setMensaje({ tipo: 'ok', texto: 'Producto creado. Agrega imágenes y detalles.' })
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
        <button
          onClick={() => setCreandoNuevo(true)}
          className="btn-primary !py-2 !px-4 !text-sm"
        >
          + Nuevo producto
        </button>
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
      {/* Imagen */}
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

        {/* Drag handle (esquina superior izq) */}
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

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-semibold text-gray-900 line-clamp-1 flex-1">
            {producto.nombre}
          </div>
        </div>
        {producto.descripcion && (
          <div className="text-xs text-gray-500 mb-3 line-clamp-2">
            {producto.descripcion}
          </div>
        )}
        <div className="font-bold text-brand-orange mt-auto">
          {producto.precio || 'Consultar precio'}
        </div>
      </div>

      {/* Acciones */}
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
