'use client'

import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

const MARCAS  = ['KIA', 'Hyundai', 'Renault', 'Chevrolet', 'Toyota', 'Mazda', 'Nissan', 'Otra']
const MODULOS = [
  { id: 'vehiculos',    label: 'Vehículos nuevos',  sub: 'Inventario, reservas y asignaciones', fijo: true },
  { id: 'retomas',      label: 'Retomas',            sub: 'Usados, avalúos y oportunidades',      fijo: false },
  { id: 'financiacion', label: 'Financiación',       sub: 'Solicitudes, bancos y aprobaciones',   fijo: false },
  { id: 'polizas',      label: 'Pólizas',            sub: 'Colisión, todo riesgo y renovaciones', fijo: false },
  { id: 'accesorios',   label: 'Accesorios',         sub: 'Stock, ventas cruzadas y comisiones',  fijo: false },
  { id: 'whatsapp',     label: 'Agente WhatsApp',    sub: 'Incluido para cada asesor — siempre',  fijo: true },
]

export function ConcesionarioModal({ open, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const [razon, setRazon]         = useState('')
  const [nit, setNit]             = useState('')
  const [ciudad, setCiudad]       = useState('')
  const [telefono, setTelefono]   = useState('')
  const [email, setEmail]         = useState('')
  const [marcas, setMarcas]       = useState<string[]>([])
  const [asesores, setAsesores]   = useState(5)
  const [modulos, setModulos]     = useState<string[]>(['vehiculos', 'whatsapp'])

  const toggleMarca = (m: string) =>
    setMarcas(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const toggleModulo = (id: string, fijo: boolean) => {
    if (fijo) return
    setModulos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const enviar = async () => {
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/pulse/concesionario/solicitud', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          razon_social: razon, nit, ciudad, telefono, email,
          marcas, num_asesores: asesores,
          modulos: MODULOS.filter(m => modulos.includes(m.id)).map(m => m.label),
        }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al enviar')
      setStep(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally {
      setEnviando(false)
    }
  }

  const reset = () => {
    setStep(1); setRazon(''); setNit(''); setCiudad(''); setTelefono('')
    setEmail(''); setMarcas([]); setAsesores(5); setModulos(['vehiculos','whatsapp'])
    setError(''); onClose()
  }

  if (!open) return null

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '14px', fontFamily: FONT_BODY, outline: 'none',
  }

  const progSteps = ['Tu empresa', 'Qué necesitás', 'Confirmar']

  return (
    <div
      onClick={reset}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,15,26,0.93)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#0d1b2e', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
      >
        <button onClick={reset} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '30px', height: '30px', color: '#64748b', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

        {step < 4 && (
          <>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#10b981', marginBottom: '6px', fontFamily: FONT_BODY }}>DataBridge 360</p>

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: 0 }}>
              {progSteps.map((label, i) => {
                const n = i + 1
                const done = step > n
                const cur  = step === n
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 600, fontFamily: FONT_BODY,
                        background: done ? '#10b981' : cur ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${done ? '#10b981' : cur ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        color: done ? '#fff' : cur ? '#6ee7b7' : '#475569',
                      }}>{done ? '✓' : n}</div>
                      <span style={{ fontSize: '12px', fontWeight: cur ? 600 : 400, color: done ? '#6ee7b7' : cur ? '#e2e8f0' : '#475569', fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                    {i < progSteps.length - 1 && <div style={{ flex: 1, height: '1px', background: done ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)', margin: '0 8px' }} />}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', fontFamily: FONT, marginBottom: '6px', letterSpacing: '-.3px' }}>Datos de tu empresa</p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px', fontFamily: FONT_BODY }}>Usamos esto para preparar tu demo personalizada.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '5px', fontFamily: FONT_BODY }}>Razón social *</label>
                <input style={inp} placeholder="Almotores S.A.S." value={razon} onChange={e => setRazon(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '5px', fontFamily: FONT_BODY }}>NIT</label>
                <input style={inp} placeholder="900.123.456-7" value={nit} onChange={e => setNit(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '5px', fontFamily: FONT_BODY }}>Ciudad *</label>
                <input style={inp} placeholder="Cali, Valle del Cauca" value={ciudad} onChange={e => setCiudad(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '5px', fontFamily: FONT_BODY }}>Teléfono *</label>
                <input style={inp} placeholder="+57 300 000 0000" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '5px', fontFamily: FONT_BODY }}>Email director comercial *</label>
              <input style={inp} type="email" placeholder="director@concesionario.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', fontFamily: FONT_BODY }}>Marcas que representás</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {MARCAS.map(m => (
                  <button key={m} onClick={() => toggleMarca(m)} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: marcas.includes(m) ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.1)', background: marcas.includes(m) ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: marcas.includes(m) ? '#6ee7b7' : '#64748b', fontWeight: marcas.includes(m) ? 600 : 400, transition: 'all .15s' }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px', fontFamily: FONT_BODY }}>
                Asesores de ventas: <span style={{ color: '#10b981' }}>{asesores}</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#475569', fontFamily: FONT_BODY }}>1</span>
                <input type="range" min={1} max={30} value={asesores} step={1} onChange={e => setAsesores(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: '12px', color: '#475569', fontFamily: FONT_BODY }}>30+</span>
              </div>
            </div>
            <button
              onClick={() => { if (!razon || !ciudad || !telefono || !email) { setError('Completá los campos obligatorios (*)'); return }; setError(''); setStep(2) }}
              style={{ width: '100%', padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
            >Continuar →</button>
            {error && <p style={{ fontSize: '13px', color: '#f87171', marginTop: '8px', textAlign: 'center', fontFamily: FONT_BODY }}>{error}</p>}
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', fontFamily: FONT, marginBottom: '6px', letterSpacing: '-.3px' }}>¿Qué querés activar?</p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px', fontFamily: FONT_BODY }}>Podés empezar con algunos módulos y sumar más después.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {MODULOS.map(m => {
                const sel = modulos.includes(m.id)
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleModulo(m.id, m.fijo)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${sel ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`, background: sel ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', cursor: m.fijo ? 'default' : 'pointer', transition: 'all .15s' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: `1.5px solid ${sel ? '#10b981' : 'rgba(255,255,255,0.15)'}`, background: sel ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
                      {sel && <span style={{ color: '#fff' }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', fontFamily: FONT_BODY }}>{m.label}</div>
                      <div style={{ fontSize: '11px', color: '#475569', fontFamily: FONT_BODY }}>{m.sub}</div>
                    </div>
                    {m.fijo && <span style={{ fontSize: '10px', color: '#6ee7b7', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px', padding: '2px 7px', fontFamily: FONT_BODY, fontWeight: 600 }}>Incluido</span>}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', fontSize: '14px', cursor: 'pointer', fontFamily: FONT_BODY }}>← Volver</button>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Ver resumen →</button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', fontFamily: FONT, marginBottom: '6px', letterSpacing: '-.3px' }}>Resumen</p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px', fontFamily: FONT_BODY }}>Revisá los datos. Te contactamos en menos de 24 horas.</p>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontFamily: FONT_BODY }}>
              {[
                { label: 'Empresa',   val: razon },
                { label: 'Ciudad',    val: ciudad },
                { label: 'Email',     val: email },
                { label: 'Teléfono', val: telefono },
                { label: 'Asesores', val: `${asesores} asesores` },
                { label: 'Marcas',   val: marcas.length ? marcas.join(', ') : 'No especificadas' },
                { label: 'Módulos',  val: MODULOS.filter(m => modulos.includes(m.id)).map(m => m.label).join(', ') },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#475569', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '13px', color: '#e2e8f0', textAlign: 'right' }}>{row.val}</span>
                </div>
              ))}
            </div>
            {error && <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '8px', textAlign: 'center', fontFamily: FONT_BODY }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', fontSize: '14px', cursor: 'pointer', fontFamily: FONT_BODY }}>← Editar</button>
              <button onClick={enviar} disabled={enviando} style={{ flex: 1, padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: enviando ? 0.7 : 1 }}>
                {enviando ? 'Enviando…' : 'Solicitar demo →'}
              </button>
            </div>
          </>
        )}

        {/* STEP 4 — Éxito */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>✓</div>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', fontFamily: FONT, marginBottom: '10px', letterSpacing: '-.3px' }}>Solicitud enviada</p>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 24px', fontFamily: FONT_BODY }}>
              Te contactamos en menos de 24 horas para coordinar la demo personalizada de DataBridge 360.
            </p>
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'left', maxWidth: '360px', margin: '0 auto 24px', fontFamily: FONT_BODY }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Qué sigue</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
                1. Revisamos tu solicitud y módulos<br />
                2. Te enviamos link para agendar<br />
                3. Demo con tu equipo — sin compromiso
              </p>
            </div>
            <button onClick={reset} style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', fontSize: '14px', cursor: 'pointer', fontFamily: FONT_BODY }}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  )
}
