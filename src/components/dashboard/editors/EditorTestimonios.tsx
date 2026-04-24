// Ruta destino: src/components/dashboard/editors/EditorTestimonios.tsx
'use client'

import { ContenidoTestimonios } from '@/types/secciones'

type Props = {
  contenido: ContenidoTestimonios
  onChange: (c: ContenidoTestimonios) => void
}

export function EditorTestimonios({ contenido, onChange }: Props) {
  const items = contenido?.items || []

  const generarId = () => `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const agregar = () => {
    onChange({
      items: [
        ...items,
        { id: generarId(), nombre: '', texto: '', rating: 5, empresa: '' },
      ],
    })
  }

  const actualizar = (id: string, campo: string, valor: string | number) => {
    onChange({
      items: items.map(t => (t.id === id ? { ...t, [campo]: valor } : t)),
    })
  }

  const eliminar = (id: string) => {
    onChange({ items: items.filter(t => t.id !== id) })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1c2e' }}>
          Testimonios ({items.length})
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
          + Agregar testimonio
        </button>
      </div>

      {items.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', background: '#f9fafb', borderRadius: '10px' }}>
          Aún no has agregado testimonios
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((t, i) => (
          <div
            key={t.id}
            style={{
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Testimonio {i + 1}
              </span>
              <button
                onClick={() => eliminar(t.id)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
              >
                🗑
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                value={t.nombre}
                onChange={e => actualizar(t.id, 'nombre', e.target.value)}
                placeholder="Nombre (ej: María P.)"
                style={inp}
              />
              <input
                value={t.empresa || ''}
                onChange={e => actualizar(t.id, 'empresa', e.target.value)}
                placeholder="Ciudad o empresa"
                style={inp}
              />
            </div>

            <textarea
              value={t.texto}
              onChange={e => actualizar(t.id, 'texto', e.target.value)}
              placeholder="Texto del testimonio..."
              rows={3}
              style={{ ...inp, minHeight: '70px', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Rating:</span>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => actualizar(t.id, 'rating', n)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.15rem',
                    padding: 0,
                    color: n <= (t.rating || 0) ? '#FFB800' : '#d1d5db',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
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
  fontSize: '0.85rem',
  outline: 'none',
  fontFamily: 'inherit',
}
