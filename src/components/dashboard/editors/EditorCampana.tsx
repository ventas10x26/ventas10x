'use client'
import { inputStyle, textareaStyle } from '../EditorSeccionModal'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EditorCampana({ contenido, onChange }: { contenido: any; onChange: (c: any) => void }) {
  const upd = (key: string, val: unknown) => onChange({ ...contenido, [key]: val })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Badge / etiqueta</label>
        <input value={contenido.badge || ''} onChange={e => upd('badge', e.target.value)} placeholder="🔥 Oferta del mes" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Imagen</label>
        <input value={contenido.imagen_url || ''} onChange={e => upd('imagen_url', e.target.value)} placeholder="https://..." style={inputStyle} />
        <div style={{ marginTop: '8px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>O sube desde tu computador:</label>
          <input
            type="file"
            accept="image/*"
            style={{ fontSize: '12px', color: '#374151' }}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const formData = new FormData()
              formData.append('file', file)
              formData.append('tipo', 'hero')
              const res = await fetch('/api/landing/upload-imagen', { method: 'POST', body: formData })
              const data = await res.json()
              if (data.ok) upd('imagen_url', data.url)
            }}
          />
        </div>
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>URL de video Instagram (opcional)</label>
        <input value={contenido.video_url || ''} onChange={e => upd('video_url', e.target.value)} placeholder="https://www.instagram.com/reel/..." style={inputStyle} />
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Si hay video, reemplaza la imagen.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Precio destacado</label>
          <input value={contenido.precio || ''} onChange={e => upd('precio', e.target.value)} placeholder="$85.000.000" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Precio anterior (tachado)</label>
          <input value={contenido.precio_anterior || ''} onChange={e => upd('precio_anterior', e.target.value)} placeholder="$92.000.000" style={inputStyle} />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!contenido.destacar_precio} onChange={e => upd('destacar_precio', e.target.checked)} />
        Mostrar precio destacado
      </label>
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Vigencia</label>
        <input value={contenido.vigencia || ''} onChange={e => upd('vigencia', e.target.value)} placeholder="Válido hasta el 31 de mayo" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Texto del botón CTA</label>
        <input value={contenido.cta_texto || ''} onChange={e => upd('cta_texto', e.target.value)} placeholder="Quiero este producto" style={inputStyle} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!contenido.usar_whatsapp} onChange={e => upd('usar_whatsapp', e.target.checked)} />
        Enviar por WhatsApp
      </label>
      {contenido.usar_whatsapp && (
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Mensaje WhatsApp</label>
          <textarea value={contenido.mensaje_wa || ''} onChange={e => upd('mensaje_wa', e.target.value)} placeholder="Hola, me interesa la campaña..." style={textareaStyle} />
        </div>
      )}
    </div>
  )
}