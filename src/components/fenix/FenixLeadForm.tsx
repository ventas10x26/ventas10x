// Ruta destino: src/components/fenix/FenixLeadForm.tsx
'use client'
import { useState, type FormEvent, type CSSProperties } from 'react'

const ACCENT = '#F5821F'

const INPUT_STYLE: CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.15)',
  borderRadius: '10px',
  padding: '13px 16px',
  fontSize: '14px',
  color: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
}

const LABEL_STYLE: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(255,255,255,.55)',
  marginBottom: '6px',
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

export function FenixLeadForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      empresa: (form.elements.namedItem('empresa') as HTMLInputElement).value.trim(),
      nombre: (form.elements.namedItem('nombre') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      telefono: (form.elements.namedItem('telefono') as HTMLInputElement).value.trim(),
      mensaje: (form.elements.namedItem('mensaje') as HTMLTextAreaElement).value.trim(),
    }

    try {
      const res = await fetch('/api/fenix-contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo enviar el formulario')
      setStatus('ok')
      form.reset()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  if (status === 'ok') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ fontSize: '40px', marginBottom: '1rem' }}>✅</div>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
          Solicitud recibida
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.55)' }}>
          Un especialista de Fenix Consultores se pondrá en contacto con su empresa muy pronto.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="fenix-form-row">
        <div>
          <label style={LABEL_STYLE} htmlFor="empresa">Empresa *</label>
          <input id="empresa" name="empresa" required style={INPUT_STYLE} placeholder="Nombre de su empresa" />
        </div>
        <div>
          <label style={LABEL_STYLE} htmlFor="nombre">Nombre de contacto *</label>
          <input id="nombre" name="nombre" required style={INPUT_STYLE} placeholder="Su nombre" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="fenix-form-row">
        <div>
          <label style={LABEL_STYLE} htmlFor="email">Correo *</label>
          <input id="email" name="email" type="email" required style={INPUT_STYLE} placeholder="correo@empresa.com" />
        </div>
        <div>
          <label style={LABEL_STYLE} htmlFor="telefono">WhatsApp / Teléfono *</label>
          <input id="telefono" name="telefono" type="tel" required style={INPUT_STYLE} placeholder="+57 300 000 0000" />
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="mensaje">¿Qué necesita su empresa?</label>
        <textarea id="mensaje" name="mensaje" rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="Recaudo de cartera, derecho preventivo, consultoría empresarial..." />
      </div>

      {status === 'error' && (
        <div style={{ fontSize: '13px', color: '#ff8080' }}>{errorMsg}</div>
      )}

      <button type="submit" disabled={status === 'loading'} style={{
        background: ACCENT, color: '#050302', border: 'none',
        padding: '15px', borderRadius: '999px', fontSize: '14px', fontWeight: 700,
        cursor: status === 'loading' ? 'default' : 'pointer',
        opacity: status === 'loading' ? 0.7 : 1,
        boxShadow: `0 8px 30px ${ACCENT}45`,
      }}>
        {status === 'loading' ? 'Enviando…' : 'Solicitar asesoría para mi empresa →'}
      </button>

      <style>{`
        @media (max-width: 560px) {
          .fenix-form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  )
}
