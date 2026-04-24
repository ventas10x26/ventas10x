// Ruta destino: src/components/dashboard/SeccionesEditor.tsx
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LandingSeccion, SECCIONES_META, TipoSeccion } from '@/types/secciones'
import { EditorSeccionModal } from './EditorSeccionModal'
import { AgregarSeccionModal } from './AgregarSeccionModal'

type Props = {
  form: {
    titulo: string
    subtitulo: string
    producto: string
    color_acento: string
  }
  analisisPrevio?: string
}

export function SeccionesEditor({ form, analisisPrevio }: Props) {
  const [secciones, setSecciones] = useState<LandingSeccion[]>([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState<LandingSeccion | null>(null)
  const [mostrandoAgregar, setMostrandoAgregar] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Cargar secciones
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/landing/secciones')
      const data = await res.json()
      if (data.secciones) setSecciones(data.secciones)
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al cargar secciones' })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Toggle activa/inactiva
  const toggleActiva = async (seccion: LandingSeccion) => {
    const nuevoValor = !seccion.activa
    // Optimistic update
    setSecciones(s => s.map(x => x.id === seccion.id ? { ...x, activa: nuevoValor } : x))

    try {
      const res = await fetch(`/api/landing/secciones/${seccion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: nuevoValor }),
      })
      if (!res.ok) throw new Error('Error')
    } catch {
      // Revertir
      setSecciones(s => s.map(x => x.id === seccion.id ? { ...x, activa: seccion.activa } : x))
      setMensaje({ tipo: 'error', texto: 'Error al actualizar' })
    }
  }

  // Eliminar
  const eliminar = async (seccion: LandingSeccion) => {
    if (!confirm(`¿Eliminar la sección "${seccion.titulo || seccion.tipo}"?`)) return

    try {
      const res = await fetch(`/api/landing/secciones/${seccion.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error')
      setSecciones(s => s.filter(x => x.id !== seccion.id))
      setMensaje({ tipo: 'ok', texto: 'Sección eliminada' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar' })
    }
  }

  // Drag & Drop: reordenar
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = secciones.findIndex(s => s.id === active.id)
    const newIndex = secciones.findIndex(s => s.id === over.id)
    const nuevoOrden = arrayMove(secciones, oldIndex, newIndex)

    setSecciones(nuevoOrden)

    // Persistir orden en backend
    try {
      await fetch('/api/landing/secciones/reordenar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: nuevoOrden.map(s => s.id) }),
      })
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al reordenar, recarga la página' })
    }
  }

  // Cuando se guarda una edición
  const onSeccionActualizada = (actualizada: LandingSeccion) => {
    setSecciones(s => s.map(x => x.id === actualizada.id ? actualizada : x))
    setEditando(null)
    setMensaje({ tipo: 'ok', texto: 'Sección actualizada' })
  }

  // Cuando se crea una nueva
  const onSeccionCreada = (nueva: LandingSeccion) => {
    setSecciones(s => [...s, nueva])
    setMostrandoAgregar(false)
    // Abrir editor inmediatamente
    setEditando(nueva)
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,.04)',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f1c2e', marginBottom: '2px' }}>
            Secciones de la landing
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Arrastra para reordenar · Toggle para mostrar/ocultar
          </p>
        </div>
        <button
          onClick={() => setMostrandoAgregar(true)}
          style={{
            padding: '0.6rem 1.2rem',
            background: '#FF6B2B',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          + Agregar sección
        </button>
      </div>

      {mensaje && (
        <div style={{
          padding: '0.6rem 1rem',
          borderRadius: '8px',
          marginBottom: '0.75rem',
          fontSize: '0.85rem',
          background: mensaje.tipo === 'ok' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'ok' ? '#166534' : '#991b1b',
        }}>
          {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          Cargando secciones...
        </div>
      ) : secciones.length === 0 ? (
        <div style={{
          padding: '2.5rem 1rem',
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f1c2e', marginBottom: '0.5rem' }}>
            Aún no tienes secciones extra
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
            Agrega testimonios, preguntas frecuentes o un llamado a la acción para convertir más.
          </p>
          <button
            onClick={() => setMostrandoAgregar(true)}
            style={{
              padding: '0.6rem 1.5rem',
              background: '#FF6B2B',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Agregar mi primera sección
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={secciones.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {secciones.map((seccion) => (
                <SeccionItem
                  key={seccion.id}
                  seccion={seccion}
                  onToggle={() => toggleActiva(seccion)}
                  onEditar={() => setEditando(seccion)}
                  onEliminar={() => eliminar(seccion)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal de agregar */}
      {mostrandoAgregar && (
        <AgregarSeccionModal
          onClose={() => setMostrandoAgregar(false)}
          onCreada={onSeccionCreada}
          form={form}
          analisisPrevio={analisisPrevio}
        />
      )}

      {/* Modal de edición */}
      {editando && (
        <EditorSeccionModal
          seccion={editando}
          onClose={() => setEditando(null)}
          onGuardada={onSeccionActualizada}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Item individual (sortable)
// ═══════════════════════════════════════════════════════════════

type SeccionItemProps = {
  seccion: LandingSeccion
  onToggle: () => void
  onEditar: () => void
  onEliminar: () => void
}

function SeccionItem({ seccion, onToggle, onEditar, onEliminar }: SeccionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: seccion.id })

  const meta = SECCIONES_META[seccion.tipo as TipoSeccion]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Contador de items por tipo
  let contador = ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = seccion.contenido as any
  if (c?.items && Array.isArray(c.items)) {
    contador = ` · ${c.items.length} item${c.items.length !== 1 ? 's' : ''}`
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: seccion.activa ? '#fff' : '#f9fafb',
        border: `1px solid ${seccion.activa ? '#e5e7eb' : '#e5e7eb'}`,
        borderRadius: '12px',
        opacity: seccion.activa ? 1 : 0.65,
      }}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'grab',
          color: '#9ca3af',
          fontSize: '1.25rem',
          padding: '0.25rem',
          touchAction: 'none',
        }}
        title="Arrastrar para reordenar"
      >
        ⋮⋮
      </button>

      {/* Icono */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${meta?.color || '#6B7280'}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        flexShrink: 0,
      }}>
        {meta?.icono || '📦'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#0f1c2e', fontSize: '0.95rem' }}>
          {seccion.titulo || meta?.nombre || seccion.tipo}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {meta?.nombre}{contador}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Toggle */}
        <button
          onClick={onToggle}
          title={seccion.activa ? 'Ocultar' : 'Mostrar'}
          style={{
            width: '44px',
            height: '24px',
            background: seccion.activa ? '#10b981' : '#d1d5db',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background .2s',
          }}
        >
          <span style={{
            position: 'absolute',
            top: '2px',
            left: seccion.activa ? '22px' : '2px',
            width: '20px',
            height: '20px',
            background: '#fff',
            borderRadius: '50%',
            transition: 'left .2s',
            boxShadow: '0 1px 2px rgba(0,0,0,.2)',
          }} />
        </button>

        {/* Editar */}
        <button
          onClick={onEditar}
          title="Editar contenido"
          style={{
            padding: '0.4rem 0.75rem',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            color: '#374151',
            fontWeight: 600,
          }}
        >
          Editar
        </button>

        {/* Eliminar */}
        <button
          onClick={onEliminar}
          title="Eliminar"
          style={{
            padding: '0.4rem 0.6rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#ef4444',
            fontSize: '1rem',
          }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
