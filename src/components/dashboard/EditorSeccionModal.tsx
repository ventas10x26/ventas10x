// Ruta destino: src/components/dashboard/EditorSeccionModal.tsx
'use client'

import { useState } from 'react'
import { LandingSeccion, ContenidoTestimonios, ContenidoFAQ, ContenidoCTA } from '@/types/secciones'
import { EditorTestimonios } from './editors/EditorTestimonios'
import { EditorFAQ } from './editors/EditorFAQ'
import { EditorCTA } from './editors/EditorCTA'

type Props = {
  seccion: LandingSeccion
  onClose: () => void
  onGuardada: (seccion: LandingSeccion) => void
}

export function EditorSeccionModal({ seccion, onClose, onGuardada }: Props) {
  const [titulo, setTitulo] = useState(seccion.titulo || '')
  const [subtitulo, setSubtitulo] = useState(seccion.subtitulo || '')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contenido, setContenido] = useState<any>(seccion.contenido)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    try {
      const res = await fetch(`/api/landing/secciones/${seccion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo || null,
          subtitulo: subtitulo || null,
          contenido,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onGuardada(data.seccion)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '1.5rem',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f1c2e' }}>
            Editar sección
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.6rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            ❌ {error}
          </div>
        )}

        {/* Campos comunes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
              Título de la sección
            </label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="ej. Lo que dicen nuestros clientes"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
              Subtítulo (opcional)
            </label>
            <input
              value={subtitulo}
              onChange={e => setSubtitulo(e.target.value)}
              placeholder="Subtítulo descriptivo"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Editor específico por tipo */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
          {seccion.tipo === 'testimonios' && (
            <EditorTestimonios
              contenido={contenido as ContenidoTestimonios}
              onChange={setContenido}
            />
          )}
          {seccion.tipo === 'faq' && (
            <EditorFAQ
              contenido={contenido as ContenidoFAQ}
              onChange={setContenido}
            />
          )}
          {seccion.tipo === 'cta' && (
            <EditorCTA
              contenido={contenido as ContenidoCTA}
              onChange={setContenido}
            />
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={guardando}
            style={{
              padding: '0.7rem 1.25rem',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            style={{
              padding: '0.7rem 1.5rem',
              background: '#FF6B2B',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: guardando ? 'wait' : 'pointer',
              opacity: guardando ? 0.7 : 1,
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.875rem',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
}

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
}
