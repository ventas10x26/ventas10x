// Ruta destino: src/components/dashboard/editors/EditorFAQ.tsx
'use client'

import { ContenidoFAQ } from '@/types/secciones'

type Props = {
  contenido: ContenidoFAQ
  onChange: (c: ContenidoFAQ) => void
}

export function EditorFAQ({ contenido, onChange }: Props) {
  const items = contenido?.items || []

  const generarId = () => `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const agregar = () => {
    onChange({
      items: [...items, { id: generarId(), pregunta: '', respuesta: '' }],
    })
  }

  const actualizar = (id: string, campo: string, valor: string) => {
    onChange({
      items: items.map(f => (f.id === id ? { ...f, [campo]: valor } : f)),
    })
  }

  const eliminar = (id: string) => {
    onChange({ items: items.filter(f => f.id !== id) })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1c2e' }}>
          Preguntas frecuentes ({items.length})
        </h4>
        <button
          onClick={agregar}
          style={{
            padding: '0.4rem 0.9rem',
            background: '#FF6B2B',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Agregar pregunta
        </button>
      </div>

      {items.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', background: '#f9fafb', borderRadius: '10px' }}>
          Aún no has agregado preguntas
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((f, i) => (
          <div
            key={f.id}
            style={{
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Pregunta {i + 1}
              </span>
              <button
                onClick={() => eliminar(f.id)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
              >
                🗑
              </button>
            </div>

            <input
              value={f.pregunta}
              onChange={e => actualizar(f.id, 'pregunta', e.target.value)}
              placeholder="¿Cuál es tu pregunta?"
              style={{ ...inp, marginBottom: '0.5rem', fontWeight: 600 }}
            />

            <textarea
              value={f.respuesta}
              onChange={e => actualizar(f.id, 'respuesta', e.target.value)}
              placeholder="Respuesta..."
              rows={3}
              style={{ ...inp, minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
}
