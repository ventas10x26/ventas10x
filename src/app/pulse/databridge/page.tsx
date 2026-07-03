'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const GRAD = 'linear-gradient(90deg, #3b82f6, #ec4899, #a855f7)'
const gradText: React.CSSProperties = { backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }

const MARCAS  = ['KIA', 'Hyundai', 'Renault', 'Chevrolet', 'Toyota', 'Mazda', 'Nissan', 'Otra']
const MODULOS = [
  { id: 'vehiculos',    label: 'Vehículos nuevos', sub: 'Inventario, reservas y asignaciones', fijo: true },
  { id: 'retomas',      label: 'Retomas',           sub: 'Usados, avalúos y oportunidades',      fijo: false },
  { id: 'financiacion', label: 'Financiación',      sub: 'Solicitudes, bancos y aprobaciones',   fijo: false },
  { id: 'polizas',      label: 'Pólizas',           sub: 'Colisión, todo riesgo y renovaciones', fijo: false },
  { id: 'accesorios',   label: 'Accesorios',        sub: 'Stock, ventas cruzadas y comisiones',  fijo: false },
  { id: 'whatsapp',     label: 'Agente WhatsApp',   sub: 'Incluido para cada asesor — siempre',  fijo: true },
]

const card: React.CSSProperties = {
  borderRadius: '12px', border: '1px solid rgba(0,0,0,0.07)',
  background: 'rgba(0,0,0,0.02)', padding: '14px',
}

export default function DataBridgePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [razon, setRazon]     = useState('')
  const [ciudad, setCiudad]   = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail]     = useState('')
  const [marcas, setMarcas]   = useState<string[]>([])
  const [modulos, setModulos] = useState<string[]>(['vehiculos', 'whatsapp'])
  const [error, setError]     = useState('')
  const [archivo, setArchivo] = useState<{ nombre: string; filas: number } | null>(null)
  const [analizando, setAnalizando] = useState(false)

  const toggleMarca = (m: string) =>
    setMarcas(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const toggleModulo = (id: string, fijo: boolean) => {
    if (fijo) return
    setModulos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    setAnalizando(true)
    setTimeout(() => {
      setArchivo({ nombre: file.name, filas: Math.floor(200 + Math.random() * 4000) })
      setAnalizando(false)
    }, 1100)
  }

  const irACrearCuenta = () => {
    const qs = new URLSearchParams({
      concesionario: razon,
      email,
      whatsapp: telefono,
      ...(marcas[0] ? { marca: marcas[0] } : {}),
    })
    router.push(`/pulse/signup?${qs.toString()}`)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '8px', boxSizing: 'border-box',
    border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.04)',
    color: '#000', fontSize: '14px', fontFamily: FONT_BODY, outline: 'none',
  }

  const progLabels = ['Tu empresa', 'Qué activás', 'Cargá tus datos']

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: FONT_BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      {/* Header mínimo */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <a href="/pulse" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>⚡</div>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: '15px', color: '#0a0a0a' }}>Pulse Motor</span>
        </a>
        <a href="/pulse" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>← Volver</a>
      </header>

      <main style={{ maxWidth: '620px', margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Hero corto y directo */}
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>DataBridge 360</p>
        <h1 style={{ fontFamily: FONT, fontSize: '30px', fontWeight: 800, letterSpacing: '-0.6px', margin: '0 0 10px', color: '#0a0a0a' }}>
          Cargá tu inventario. <span style={gradText}>Empezá a vender hoy.</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 28px', maxWidth: '480px' }}>
          Sin demos ni esperas. Subí tus datos y creá tu cuenta en el momento.
        </p>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '26px', gap: 0 }}>
          {progLabels.map((label, i) => {
            const n = i + 1
            const done = step > n
            const cur  = step === n
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 600,
                    background: done ? '#000' : cur ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)',
                    border: `1.5px solid ${done ? '#000' : cur ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
                    color: done ? '#fff' : cur ? '#000' : '#94a3b8',
                  }}>{done ? '✓' : n}</div>
                  <span style={{ fontSize: '12px', fontWeight: cur ? 600 : 400, color: done ? '#444' : cur ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {i < progLabels.length - 1 && <div style={{ flex: 1, height: '1px', background: done ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)', margin: '0 8px' }} />}
              </div>
            )
          })}
        </div>

        {/* STEP 1 — empresa */}
        {step === 1 && (
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Razón social *</label>
                <input style={inp} placeholder="Almotores S.A.S." value={razon} onChange={e => setRazon(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Ciudad *</label>
                <input style={inp} placeholder="Cali, Valle del Cauca" value={ciudad} onChange={e => setCiudad(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Teléfono *</label>
                <input style={inp} placeholder="+57 300 000 0000" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Email *</label>
                <input style={inp} type="email" placeholder="director@concesionario.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>Marcas que representás</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {MARCAS.map(m => (
                  <button key={m} onClick={() => toggleMarca(m)} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', border: marcas.includes(m) ? '1px solid rgba(0,0,0,0.5)' : '1px solid rgba(0,0,0,0.1)', background: marcas.includes(m) ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.04)', color: marcas.includes(m) ? '#000' : '#64748b', fontWeight: marcas.includes(m) ? 600 : 400 }}>{m}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — módulos */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MODULOS.map(m => {
              const sel = modulos.includes(m.id)
              return (
                <div key={m.id} onClick={() => toggleModulo(m.id, m.fijo)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${sel ? 'rgba(59,130,246,0.4)' : 'rgba(0,0,0,0.07)'}`, background: sel ? 'rgba(59,130,246,0.05)' : 'rgba(0,0,0,0.02)', cursor: m.fijo ? 'default' : 'pointer', transition: 'all .15s' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: `1.5px solid ${sel ? '#3b82f6' : 'rgba(0,0,0,0.15)'}`, background: sel ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
                    {sel && <span style={{ color: '#fff' }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.sub}</div>
                  </div>
                  {m.fijo && <span style={{ fontSize: '10px', color: '#666', background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.16)', borderRadius: '4px', padding: '2px 7px', fontWeight: 600 }}>Incluido</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* STEP 3 — screen real de DataBridge: subir fuentes de datos */}
        {step === 3 && (
          <div style={{ ...card, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>⚡</div>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px' }}>DataBridge</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Listo
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>Integración de datos con IA</p>

            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]) }}
              style={{
                border: `1.5px dashed ${archivo ? 'rgba(59,130,246,0.4)' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: '12px', padding: '28px 20px', textAlign: 'center',
                cursor: 'pointer', background: archivo ? 'rgba(59,130,246,0.04)' : '#fff',
                transition: 'all .15s',
              }}
            >
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json" style={{ display: 'none' }} onChange={e => onFile(e.target.files?.[0])} />
              {analizando ? (
                <>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>⏳</div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: 0 }}>Analizando con IA…</p>
                </>
              ) : archivo ? (
                <>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>✅</div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>{archivo.nombre}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{archivo.filas.toLocaleString('es-CO')} filas detectadas · llaves y relaciones OK</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>⬆</div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>Subí tus fuentes de datos</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Excel · CSV · JSON</p>
                </>
              )}
            </div>

            <p style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'center', margin: '14px 0 0' }}>
              El agente detecta relaciones, llaves y problemas de calidad automáticamente.
            </p>
          </div>
        )}

        {error && <p style={{ fontSize: '13px', color: '#f87171', margin: '14px 0 0', textAlign: 'center' }}>{error}</p>}

        {/* Nav botones */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{ padding: '13px 18px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>← Volver</button>
          )}
          {step < 3 && (
            <button
              onClick={() => {
                if (step === 1 && (!razon || !ciudad || !telefono || !email)) { setError('Completá los campos obligatorios (*)'); return }
                setError(''); setStep(step + 1)
              }}
              style={{ flex: 1, padding: '13px', borderRadius: '10px', background: '#000', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
            >Continuar →</button>
          )}
          {step === 3 && (
            <button
              onClick={irACrearCuenta}
              disabled={analizando}
              style={{ flex: 1, padding: '13px', borderRadius: '10px', background: analizando ? 'rgba(0,0,0,0.3)' : '#000', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: analizando ? 'not-allowed' : 'pointer', fontFamily: FONT }}
            >{archivo ? 'Crear mi cuenta →' : 'Saltar y crear cuenta →'}</button>
          )}
        </div>
      </main>
    </div>
  )
}
