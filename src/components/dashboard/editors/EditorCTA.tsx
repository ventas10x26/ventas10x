// Ruta destino: src/components/dashboard/editors/EditorCTA.tsx
'use client'

import { ContenidoCTA } from '@/types/secciones'

type Props = {
  contenido: ContenidoCTA
  onChange: (c: ContenidoCTA) => void
}

export function EditorCTA({ contenido, onChange }: Props) {
  const actualizar = <K extends keyof ContenidoCTA>(campo: K, valor: ContenidoCTA[K]) => {
    onChange({ ...contenido, [campo]: valor })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1c2e' }}>
        Configuración del CTA
      </h4>

      <div>
        <label style={lbl}>Descripción antes del botón (opcional)</label>
        <textarea
          value={contenido.descripcion || ''}
          onChange={e => actualizar('descripcion', e.target.value)}
          placeholder="ej. Cotiza sin compromiso en menos de 2 minutos"
          rows={2}
          style={{ ...inp, minHeight: '60px', resize: 'vertical' }}
        />
      </div>

      <div>
        <label style={lbl}>Texto del botón</label>
        <input
          value={contenido.boton_texto || ''}
          onChange={e => actualizar('boton_texto', e.target.value)}
          placeholder="Contactar ahora"
          maxLength={30}
          style={inp}
        />
        <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
          Corto y directo (máx 3-4 palabras)
        </p>
      </div>

      <div style={{
        padding: '0.875rem',
        background: '#f9fafb',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#0f1c2e', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={contenido.usar_whatsapp}
            onChange={e => actualizar('usar_whatsapp', e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          Abrir WhatsApp al dar clic
        </label>

        {contenido.usar_whatsapp ? (
          <div style={{ marginTop: '0.75rem' }}>
            <label style={lbl}>Mensaje predefinido de WhatsApp</label>
            <textarea
              value={contenido.mensaje_wa || ''}
              onChange={e => actualizar('mensaje_wa', e.target.value)}
              placeholder="Hola, vi tu landing y me interesa..."
              rows={2}
              style={{ ...inp, minHeight: '60px', resize: 'vertical' }}
            />
          </div>
        ) : (
          <div style={{ marginTop: '0.75rem' }}>
            <label style={lbl}>URL del botón</label>
            <input
              value={contenido.boton_url || ''}
              onChange={e => actualizar('boton_url', e.target.value)}
              placeholder="https://tu-sitio.com/contacto"
              style={inp}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  display: 'block',
  marginBottom: '4px',
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.875rem',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
}
