// Ruta destino: src/components/pulse/PulseDemoForm.tsx
'use client'
import { useState, type FormEvent, type CSSProperties } from 'react'

const F_BODY = "var(--font-inter), sans-serif"
const F_MONO = "var(--font-mono), monospace"

const LABEL_STYLE: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--ink-dim)',
  marginBottom: '6px',
  fontFamily: F_BODY,
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

type Props = {
  compact?: boolean
  onSuccess?: () => void
}

export function PulseDemoForm({ compact = false, onSuccess }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const mensajeEl = form.elements.namedItem('mensaje') as HTMLTextAreaElement | null
    const data = {
      concesionario: (form.elements.namedItem('concesionario') as HTMLInputElement).value.trim(),
      nombre: (form.elements.namedItem('nombre') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      telefono: (form.elements.namedItem('telefono') as HTMLInputElement).value.trim(),
      mensaje: mensajeEl?.value.trim() || '',
    }

    try {
      const res = await fetch('/api/pulse/demo-contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo enviar la solicitud')
      setStatus('ok')
      form.reset()
      onSuccess?.()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  if (status === 'ok') {
    return (
      <div style={{ textAlign: 'center', padding: compact ? '12px 0' : '2rem 0' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)', fontFamily: F_BODY }}>
          Solicitud enviada
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ink-dim)', fontFamily: F_BODY, lineHeight: 1.5 }}>
          Un asesor de Pulse Motor te escribe por WhatsApp muy pronto para agendar tu demo.
        </div>
      </div>
    )
  }

  const gap = compact ? '10px' : '14px'
  const rowCols = compact ? '1fr' : '1fr 1fr'

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap, textAlign: 'left' }}>
      <div style={{ display: 'grid', gridTemplateColumns: rowCols, gap }} className="pulse-form-row">
        <div>
          <label style={LABEL_STYLE} htmlFor="pdf-concesionario">Concesionario / empresa *</label>
          <input id="pdf-concesionario" name="concesionario" required className="pm-input" placeholder="Nombre del concesionario" />
        </div>
        <div>
          <label style={LABEL_STYLE} htmlFor="pdf-nombre">Tu nombre *</label>
          <input id="pdf-nombre" name="nombre" required className="pm-input" placeholder="Nombre y apellido" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: rowCols, gap }} className="pulse-form-row">
        <div>
          <label style={LABEL_STYLE} htmlFor="pdf-telefono">WhatsApp *</label>
          <input id="pdf-telefono" name="telefono" type="tel" required className="pm-input" placeholder="+57 300 000 0000" />
        </div>
        <div>
          <label style={LABEL_STYLE} htmlFor="pdf-email">Correo *</label>
          <input id="pdf-email" name="email" type="email" required className="pm-input" placeholder="correo@concesionario.com" />
        </div>
      </div>

      {!compact && (
        <div>
          <label style={LABEL_STYLE} htmlFor="pdf-mensaje">¿Algo puntual para la demo?</label>
          <textarea id="pdf-mensaje" name="mensaje" rows={3} className="pm-input" style={{ resize: 'vertical' }} placeholder="Cantidad de asesores, DMS actual, etc." />
        </div>
      )}

      {status === 'error' && (
        <div style={{ fontSize: '12px', color: 'var(--red)', fontFamily: F_BODY }}>{errorMsg}</div>
      )}

      <button type="submit" disabled={status === 'loading'} className="pm-btn" style={{ width: '100%', padding: compact ? '12px' : '14px', fontSize: '13px' }}>
        {status === 'loading' ? 'Enviando…' : 'Agendar demo'}<span className="btn-arrow">→</span>
      </button>

      <p style={{ fontSize: '11px', color: 'var(--ink-dim)', fontFamily: F_MONO, textAlign: 'center' }}>
        Te contactamos por WhatsApp en minutos.
      </p>

      <style>{`
        @media (max-width: 560px) {
          .pulse-form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  )
}
