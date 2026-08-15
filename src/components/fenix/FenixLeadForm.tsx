// Ruta destino: src/components/fenix/FenixLeadForm.tsx
'use client'
import { useState, type FormEvent } from 'react'

const ACCENT = '#F5821F'

type Status = 'idle' | 'loading' | 'ok' | 'error'

type Props = {
  compact?: boolean
  onSuccess?: () => void
  /** 'light' se usa dentro del panel claro de la sección de contacto */
  theme?: 'dark' | 'light'
}

// Opciones de "qué necesita su empresa" -- antes era un textarea libre, que
// para alguien con una necesidad real y prisa es más fricción que ayuda:
// elegir es más rápido que redactar. El textbox de abajo sigue disponible
// para quien quiera dar contexto adicional, pero ya no es obligatorio
// escribir para poder avanzar.
const NECESIDADES = [
  'Recaudo de cartera vencida',
  'Derecho preventivo',
  'Consultoría jurídica empresarial',
  'Recuperación de activos',
  'Otro',
]

function IconLock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

export function FenixLeadForm({ compact = false, onSuccess, theme = 'dark' }: Props) {
  const light = theme === 'light'
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [necesidades, setNecesidades] = useState<Set<string>>(new Set())
  const [detalle, setDetalle] = useState('')

  function toggleNecesidad(opcion: string) {
    setNecesidades(prev => {
      const next = new Set(prev)
      if (next.has(opcion)) next.delete(opcion)
      else next.add(opcion)
      return next
    })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const partesMensaje: string[] = []
    if (necesidades.size > 0) partesMensaje.push(`Necesita: ${[...necesidades].join(', ')}`)
    if (detalle.trim()) partesMensaje.push(detalle.trim())

    const data = {
      empresa: (form.elements.namedItem('empresa') as HTMLInputElement).value.trim(),
      nombre: (form.elements.namedItem('nombre') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      telefono: (form.elements.namedItem('telefono') as HTMLInputElement).value.trim(),
      mensaje: partesMensaje.join(' — '),
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
      setNecesidades(new Set())
      setDetalle('')
      onSuccess?.()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  if (status === 'ok') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 1rem',
          background: `${ACCENT}18`, border: `1px solid ${ACCENT}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: light ? '#17120e' : undefined }}>
          Solicitud recibida
        </div>
        <div style={{ fontSize: '14px', color: light ? 'rgba(23,18,14,.6)' : 'rgba(255,255,255,.55)', lineHeight: 1.6 }}>
          Un especialista de Fenix Consultores se pondrá en contacto con su empresa muy pronto.
        </div>
      </div>
    )
  }

  const gap = compact ? '12px' : '16px'
  const rowCols = compact ? '1fr' : '1fr 1fr'

  return (
    <form onSubmit={handleSubmit} className={light ? 'fenix-form fenix-form-light' : 'fenix-form'} style={{ display: 'flex', flexDirection: 'column', gap, textAlign: 'left' }}>
      {!compact && (
        <div className="fenix-kicker">
          Análisis inicial sin costo — cuéntenos su caso y un especialista lo revisa hoy mismo.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: rowCols, gap }} className="fenix-form-row">
        <div>
          <label className="fenix-label" htmlFor="empresa">Empresa *</label>
          <input id="empresa" name="empresa" required className="fenix-input" placeholder="Nombre de su empresa" />
        </div>
        <div>
          <label className="fenix-label" htmlFor="nombre">Nombre de contacto *</label>
          <input id="nombre" name="nombre" required className="fenix-input" placeholder="Su nombre" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: rowCols, gap }} className="fenix-form-row">
        <div>
          <label className="fenix-label" htmlFor="email">Correo *</label>
          <input id="email" name="email" type="email" required className="fenix-input" placeholder="correo@empresa.com" />
        </div>
        <div>
          <label className="fenix-label" htmlFor="telefono">WhatsApp / Teléfono *</label>
          <input id="telefono" name="telefono" type="tel" required className="fenix-input" placeholder="+57 300 000 0000" />
          <div className="fenix-hint">Incluya el código de país: +57 o 57 antes del número</div>
        </div>
      </div>

      {!compact && (
        <div>
          <label className="fenix-label">¿Qué necesita su empresa?</label>
          <div className="fenix-chips">
            {NECESIDADES.map(opcion => {
              const activo = necesidades.has(opcion)
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => toggleNecesidad(opcion)}
                  className={`fenix-chip${activo ? ' fenix-chip-activo' : ''}`}
                  aria-pressed={activo}
                >
                  {activo ? '✓ ' : ''}{opcion}
                </button>
              )
            })}
          </div>
          <textarea
            id="detalle"
            name="detalle"
            rows={2}
            className="fenix-input"
            style={{ resize: 'vertical', marginTop: '10px' }}
            placeholder="Cuéntenos más detalles de su caso (opcional)"
            value={detalle}
            onChange={e => setDetalle(e.target.value)}
          />
        </div>
      )}

      {status === 'error' && (
        <div style={{ fontSize: '13px', color: '#ff8080' }}>{errorMsg}</div>
      )}

      <button type="submit" disabled={status === 'loading'} className="fenix-submit-btn" style={{
        padding: compact ? '13px' : '15px',
        cursor: status === 'loading' ? 'default' : 'pointer',
        opacity: status === 'loading' ? 0.7 : 1,
      }}>
        {status === 'loading' ? 'Enviando…' : compact ? 'Enviar →' : 'Solicitar asesoría para mi empresa →'}
      </button>

      <div className="fenix-trust-row">
        <span><IconLock /> Datos protegidos</span>
        <span className="fenix-trust-dot">•</span>
        <span><IconClock /> Respuesta en menos de 24h</span>
      </div>

      <style>{`
        .fenix-kicker {
          font-size: 12.5px;
          font-weight: 600;
          color: ${light ? ACCENT : '#ffb066'};
          background: ${light ? `${ACCENT}12` : `${ACCENT}1c`};
          border: 1px solid ${light ? `${ACCENT}30` : `${ACCENT}38`};
          border-radius: 10px;
          padding: 10px 14px;
          line-height: 1.5;
        }
        .fenix-input {
          width: 100%;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 14px;
          color: #fff;
          font-family: inherit;
          outline: none;
          transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease;
        }
        .fenix-input::placeholder { color: rgba(255,255,255,.32); }
        .fenix-input:hover { border-color: rgba(255,255,255,.28); }
        .fenix-input:focus {
          border-color: ${ACCENT};
          background: rgba(255,255,255,.06);
          box-shadow: 0 0 0 3px ${ACCENT}28;
        }
        .fenix-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,.55);
          margin-bottom: 6px;
        }
        .fenix-hint {
          font-size: 11px;
          color: rgba(255,255,255,.4);
          margin-top: 5px;
        }
        .fenix-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .fenix-chip {
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.04);
          color: rgba(255,255,255,.75);
          cursor: pointer;
          transition: border-color .15s ease, background-color .15s ease, color .15s ease, transform .1s ease;
        }
        .fenix-chip:hover { border-color: rgba(255,255,255,.35); transform: translateY(-1px); }
        .fenix-chip-activo {
          background: ${ACCENT};
          border-color: ${ACCENT};
          color: #050302;
        }
        .fenix-chip-activo:hover { border-color: ${ACCENT}; }
        .fenix-submit-btn {
          width: 100%;
          background: ${ACCENT};
          color: #050302;
          border: none;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 8px 30px ${ACCENT}45;
          transition: transform .2s ease, box-shadow .2s ease, background-color .2s ease;
        }
        .fenix-submit-btn:hover:not(:disabled) {
          background: #ff9a3d;
          transform: translateY(-2px);
          box-shadow: 0 12px 36px ${ACCENT}65;
        }
        .fenix-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .fenix-trust-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 11.5px;
          color: rgba(255,255,255,.35);
        }
        .fenix-trust-row span { display: inline-flex; align-items: center; gap: 5px; }
        .fenix-trust-dot { opacity: .5; }
        /* ── Tema claro (panel derecho de la sección de contacto) ── */
        .fenix-form-light .fenix-input {
          background: #f1efec;
          border-color: #e0dbd5;
          color: #17120e;
        }
        .fenix-form-light .fenix-input::placeholder { color: rgba(23,18,14,.38); }
        .fenix-form-light .fenix-input:hover { border-color: #cfc8c0; }
        .fenix-form-light .fenix-input:focus {
          border-color: ${ACCENT};
          background: #fff;
          box-shadow: 0 0 0 3px ${ACCENT}28;
        }
        .fenix-form-light .fenix-label {
          color: rgba(23,18,14,.62);
          text-transform: uppercase;
          letter-spacing: .06em;
          font-size: 11px;
          font-weight: 700;
        }
        .fenix-form-light .fenix-hint { color: rgba(23,18,14,.42); }
        .fenix-form-light .fenix-chip {
          border-color: #e0dbd5;
          background: #f1efec;
          color: rgba(23,18,14,.68);
        }
        .fenix-form-light .fenix-chip:hover { border-color: #cfc8c0; }
        .fenix-form-light .fenix-chip-activo { color: #fff; }
        .fenix-form-light .fenix-submit-btn { color: #fff; }
        .fenix-form-light .fenix-trust-row { color: rgba(23,18,14,.45); }
        @media (max-width: 560px) {
          .fenix-form-row { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fenix-submit-btn:hover:not(:disabled) { transform: none; }
          .fenix-chip:hover { transform: none; }
        }
      `}</style>
    </form>
  )
}
