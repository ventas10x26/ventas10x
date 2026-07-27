'use client'

// Ruta destino: src/app/pulse/demo/page.tsx
//
// Demo público del panel de concesionario. No pide login a propósito: sirve para mandarle
// el link en frío a un prospecto que todavía no tiene cuenta.
//
// Todos los datos salen de ./datos.ts y son sintéticos — ver la regla dura documentada ahí.
// No agregar acá ninguna cifra, nombre de sede/asesor/marca/modelo que venga de un cliente
// real, ni siquiera "de ejemplo": esta pantalla es pública.

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  PERIODOS, SEDES_OPCIONES, calcularDemo,
  formatearNumero, formatearPct, formatearMillones,
  type PeriodoId, type SedeId,
} from './datos'

const FONT = "var(--font-inter), sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const BLUE = '#2563EB'
const BLUE_2 = '#1D4ED8'
const INK = '#0f172a'
const DIM = '#64748b'
const LINE = '#e3e8f0'

const CLAVE_DESBLOQUEO = 'pulse_demo_registrado'

export default function DemoPage() {
  const [sede, setSede] = useState<SedeId>('todas')
  const [periodo, setPeriodo] = useState<PeriodoId>('12m')

  // Arranca bloqueado a propósito: si arrancara abierto y recién después leyera el registro
  // previo, el panel se vería un instante antes de pedir los datos. Quien ya se registró
  // pasa el gate en el primer efecto, sin volver a llenar nada.
  const [desbloqueado, setDesbloqueado] = useState(false)
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_DESBLOQUEO) === '1') setDesbloqueado(true)
    } catch { /* modo incógnito o storage bloqueado: se pide el registro igual */ }
  }, [])

  const d = useMemo(() => calcularDemo(sede, periodo), [sede, periodo])
  const maxEmbudo = d.embudo[0].valor || 1

  const kpis = [
    { label: 'Oportunidades', valor: formatearNumero(d.totales.oportunidades), pie: 'leads que entraron al embudo' },
    { label: 'Show up', valor: formatearNumero(d.totales.showUp), pie: 'llegaron efectivamente a la vitrina' },
    { label: 'Pedidos', valor: formatearNumero(d.totales.pedidos), pie: 'con anticipo o reserva' },
    { label: 'Matrículas', valor: formatearNumero(d.totales.matriculas), pie: 'entregadas y registradas' },
  ]

  return (
    <div style={{ background: '#f8f9fb', minHeight: '100vh', fontFamily: FONT_BODY }}>
      <style>{`
        .pm-demo-chip { transition: border-color .15s ease, color .15s ease, background .15s ease; }
        .pm-demo-barra { transition: width .35s cubic-bezier(.2,.7,.3,1); }
        .pm-demo-cta { transition: transform .15s ease, box-shadow .15s ease; }
        .pm-demo-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(37,99,235,0.32); }
        @media (prefers-reduced-motion: reduce) {
          .pm-demo-chip, .pm-demo-barra, .pm-demo-cta { transition: none; }
          .pm-demo-cta:hover { transform: none; }
        }
      `}</style>

      {/* Barra superior: marca + salida al producto real */}
      <div style={{ borderBottom: `1px solid ${LINE}`, background: '#fff' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <a href="/pulse" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{ width: '32px', height: '32px', borderRadius: '9px', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M13.5 1.5 4.2 13.1a.8.8 0 0 0 .62 1.3h4.6l-1.02 7.3a.5.5 0 0 0 .9.36l9.3-11.6a.8.8 0 0 0-.62-1.3h-4.6l1.02-7.3a.5.5 0 0 0-.9-.36Z" />
              </svg>
            </span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: '16px', color: INK }}>Pulse Motor</span>
          </a>
          <a href="/pulse/databridge" className="pm-demo-cta" style={{ padding: '9px 18px', borderRadius: '11px', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_2})`, color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: FONT, textDecoration: 'none' }}>
            Armá este panel con tus datos →
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 24px 72px' }}>

        {/* Encabezado + aviso de datos simulados. El aviso va arriba y no al pie: quien abre
            esto tiene que saber desde el primer segundo que no está viendo un cliente real. */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONT_BODY }}>
          Demo · datos simulados
        </div>
        <h1 style={{ fontFamily: FONT, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.06, margin: '0 0 10px', color: INK }}>
          Así se ve <span style={{ color: BLUE }}>tu operación</span> cuando está toda junta
        </h1>
        <p style={{ fontSize: '15px', color: DIM, lineHeight: 1.6, margin: '0 0 14px', maxWidth: '70ch' }}>
          El mismo embudo de seis etapas que corre en producción, más las cuatro líneas de integralidad que casi nunca se miden juntas. Filtrá por sede y por periodo para ver cómo se mueve.
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', marginBottom: '24px', maxWidth: '76ch' }}>
          <span style={{ fontSize: '13px', lineHeight: 1.5 }} aria-hidden="true">⚠️</span>
          <span style={{ fontSize: '12.5px', color: '#78350f', lineHeight: 1.55 }}>
            Cifras generadas para esta demostración. No corresponden a ningún concesionario, asesor, marca ni modelo real — los datos de cada cliente son suyos y no se muestran acá.
          </span>
        </div>

        {/* De acá para abajo va el panel en sí. Se muestra difuminado detrás del registro en
            vez de esconderse: quien llega tiene que ver que hay algo real, no una pared. */}
        <div style={{ position: 'relative' }}>
        {!desbloqueado && <GateRegistro onListo={() => setDesbloqueado(true)} />}
        <div
          aria-hidden={!desbloqueado}
          style={{
            filter: desbloqueado ? 'none' : 'blur(7px)',
            pointerEvents: desbloqueado ? 'auto' : 'none',
            userSelect: desbloqueado ? 'auto' : 'none',
            transition: 'filter .3s ease',
          }}
        >

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <Filtro titulo="Sede" opciones={SEDES_OPCIONES.map(s => ({ id: s.id, label: s.label }))} activo={sede} onPick={id => setSede(id as SedeId)} />
          <Filtro titulo="Periodo" opciones={PERIODOS.map(p => ({ id: p.id, label: p.label }))} activo={periodo} onPick={id => setPeriodo(id as PeriodoId)} />
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: '14px', padding: '16px 18px' }}>
              <div style={{ fontSize: '11.5px', color: DIM, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontFamily: FONT, fontSize: '30px', fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1 }}>{k.valor}</div>
              <div style={{ fontSize: '12px', color: DIM, marginTop: '6px' }}>{k.pie}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>

          {/* Embudo */}
          <Panel titulo="Embudo de ventas" sub="De la oportunidad a la matrícula">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {d.embudo.map(e => (
                <div key={e.clave}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: INK, fontWeight: 600 }}>{e.label}</span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: INK }}>{formatearNumero(e.valor)}</span>
                      {e.conversion !== null && (
                        <span style={{ fontSize: '11.5px', color: BLUE, fontWeight: 700 }}>{formatearPct(e.conversion)}</span>
                      )}
                    </span>
                  </div>
                  <div style={{ height: '9px', borderRadius: '5px', background: '#eef2f7', overflow: 'hidden' }}>
                    <div className="pm-demo-barra" style={{ height: '100%', width: `${Math.min(100, (e.valor / maxEmbudo) * 100)}%`, borderRadius: '5px', background: `linear-gradient(90deg, ${BLUE}, ${BLUE_2})` }} />
                  </div>
                  {e.base && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>sobre {e.base}</div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {/* Integralidad 360° */}
          <Panel titulo="Integralidad 360°" sub={`Sobre ${formatearNumero(d.totales.pedidos)} pedidos · ${formatearMillones(d.totales.roe)} en ROE asociado`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {d.integralidad.map(l => (
                <div key={l.clave}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: INK, fontWeight: 600 }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: l.color, display: 'inline-block' }} />
                      {l.label}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: DIM }}>{formatearNumero(l.unidades)} u.</span>
                      <span style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: INK }}>{formatearPct(l.penetracion)}</span>
                    </span>
                  </div>
                  <div style={{ height: '9px', borderRadius: '5px', background: '#eef2f7', overflow: 'hidden' }}>
                    <div className="pm-demo-barra" style={{ height: '100%', width: `${Math.min(100, l.penetracion * 100)}%`, borderRadius: '5px', background: l.color }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{formatearMillones(l.valor)} asociados</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

          {/* Sedes */}
          <Panel titulo="Rendimiento por sede" sub="Conversión de oportunidad a matrícula">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.9fr', gap: '8px', paddingBottom: '8px', borderBottom: `1px solid ${LINE}`, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                <span>Sede</span><span style={{ textAlign: 'right' }}>Oport.</span><span style={{ textAlign: 'right' }}>Matríc.</span><span style={{ textAlign: 'right' }}>Conv.</span>
              </div>
              {d.sedes.map(s => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.9fr', gap: '8px', padding: '11px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: INK, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{s.nombre}</span>
                  <span style={{ textAlign: 'right', color: DIM }}>{formatearNumero(s.oportunidades)}</span>
                  <span style={{ textAlign: 'right', color: DIM }}>{formatearNumero(s.matriculas)}</span>
                  <span style={{ textAlign: 'right', fontWeight: 700, color: BLUE }}>{formatearPct(s.conversion)}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Segmentos */}
          <Panel titulo="Matrículas por segmento" sub="Sin marca ni modelo — el método es agnóstico">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {d.segmentos.map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: INK, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: DIM }}>{formatearNumero(s.unidades)} u.</span>
                      <span style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 800, color: INK }}>{formatearPct(s.share)}</span>
                    </span>
                  </div>
                  <div style={{ height: '9px', borderRadius: '5px', background: '#eef2f7', overflow: 'hidden' }}>
                    <div className="pm-demo-barra" style={{ height: '100%', width: `${s.share * 100}%`, borderRadius: '5px', background: `linear-gradient(90deg, ${BLUE}, ${BLUE_2})` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Cierre */}
        <div style={{ marginTop: '28px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: '16px', padding: '26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '62ch' }}>
            <div style={{ fontFamily: FONT, fontSize: '19px', fontWeight: 800, color: INK, marginBottom: '6px' }}>
              Este panel sale de tus propias planillas
            </div>
            <div style={{ fontSize: '14px', color: DIM, lineHeight: 1.6 }}>
              Subí lo que ya tenés — CRM, pedidos, crédito, matrículas, pólizas, retomas — y DataBridge arma el modelo de datos con sus relaciones. Tus cifras quedan en tu cuenta: no las mostramos ni las mezclamos con las de nadie.
            </div>
          </div>
          <a href="/pulse/databridge" className="pm-demo-cta" style={{ padding: '13px 24px', borderRadius: '12px', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_2})`, color: '#fff', fontSize: '14px', fontWeight: 700, fontFamily: FONT, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Empezar con mis datos →
          </a>
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}

const WHATSAPP_VENTAS = '573004339418'

// Registro previo al panel. Reusa /api/pulse/demo-contacto —el mismo endpoint del formulario
// de demo de la landing— para que todos los leads lleguen por un solo camino en vez de tener
// dos fuentes de verdad que después no coinciden.
function GateRegistro({ onListo }: { onListo: () => void }) {
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'error'>('idle')
  const [error, setError] = useState('')
  const [datos, setDatos] = useState({ concesionario: '', nombre: '', email: '', telefono: '' })

  const set = (k: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos(prev => ({ ...prev, [k]: e.target.value }))

  const whatsappFallback = `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(
    ['Hola, quiero ver el demo del panel de Pulse Motor.',
      datos.concesionario && `Concesionario: ${datos.concesionario}`,
      datos.nombre && `Nombre: ${datos.nombre}`].filter(Boolean).join('\n')
  )}`

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEstado('enviando'); setError('')
    try {
      const res = await fetch('/api/pulse/demo-contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, mensaje: 'Registro para ver el demo del panel' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No pudimos registrar tus datos')
      try { window.localStorage.setItem(CLAVE_DESBLOQUEO, '1') } catch { /* storage bloqueado */ }
      onListo()
    } catch (err) {
      setEstado('error')
      setError(err instanceof Error ? err.message : 'No pudimos registrar tus datos')
    }
  }

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '10px 13px', borderRadius: '9px',
    border: `1px solid ${LINE}`, background: '#fff', color: INK,
    fontSize: '13.5px', fontFamily: FONT_BODY, outline: 'none',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569',
    marginBottom: '5px', fontFamily: FONT_BODY,
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', justifyContent: 'center', paddingTop: '30px' }}>
      <form
        onSubmit={enviar}
        style={{
          position: 'sticky', top: '30px', alignSelf: 'flex-start',
          width: '100%', maxWidth: '440px', height: 'fit-content',
          background: '#fff', border: `1px solid ${LINE}`, borderRadius: '18px',
          padding: '26px', boxShadow: '0 18px 50px rgba(15,23,42,0.16)',
        }}
      >
        <div style={{ fontFamily: FONT, fontSize: '20px', fontWeight: 800, color: INK, letterSpacing: '-0.02em', marginBottom: '7px' }}>
          Dejanos tus datos y entrá al panel
        </div>
        <div style={{ fontSize: '13.5px', color: DIM, lineHeight: 1.55, marginBottom: '18px' }}>
          Es un panel de demostración con cifras simuladas. Te lo abrimos completo y te escribimos para armarlo con los datos de tu concesionario.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="g-conc" style={label}>Concesionario</label>
            <input id="g-conc" required value={datos.concesionario} onChange={set('concesionario')} placeholder="Nombre del concesionario" style={input} />
          </div>
          <div>
            <label htmlFor="g-nom" style={label}>Nombre</label>
            <input id="g-nom" required value={datos.nombre} onChange={set('nombre')} placeholder="Tu nombre" style={input} />
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label htmlFor="g-mail" style={label}>Correo</label>
              <input id="g-mail" required type="email" value={datos.email} onChange={set('email')} placeholder="tu@correo.com" style={input} />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label htmlFor="g-tel" style={label}>WhatsApp</label>
              <input id="g-tel" required type="tel" value={datos.telefono} onChange={set('telefono')} placeholder="300 000 0000" style={input} />
            </div>
          </div>
        </div>

        {estado === 'error' && (
          <div style={{ marginTop: '14px', fontSize: '12.5px', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', padding: '9px 12px', lineHeight: 1.5 }}>
            {error}{' '}
            <a href={whatsappFallback} target="_blank" rel="noopener noreferrer" style={{ color: '#b91c1c', fontWeight: 700 }}>
              Escribinos por WhatsApp →
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="pm-demo-cta"
          style={{
            width: '100%', marginTop: '18px', padding: '13px', borderRadius: '11px', border: 'none',
            background: `linear-gradient(135deg, ${BLUE}, ${BLUE_2})`, color: '#fff',
            fontSize: '14px', fontWeight: 700, fontFamily: FONT,
            cursor: estado === 'enviando' ? 'default' : 'pointer', opacity: estado === 'enviando' ? 0.7 : 1,
          }}
        >
          {estado === 'enviando' ? 'Abriendo…' : 'Ver el panel →'}
        </button>

        <div style={{ marginTop: '11px', fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
          Usamos tus datos solo para contactarte. No vas a ver información de ningún otro concesionario.
        </div>
      </form>
    </div>
  )
}

function Filtro({ titulo, opciones, activo, onPick }: {
  titulo: string
  opciones: { id: string; label: string }[]
  activo: string
  onPick: (id: string) => void
}) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, marginBottom: '7px' }}>{titulo}</div>
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
        {opciones.map(o => {
          const on = o.id === activo
          return (
            <button
              key={o.id}
              onClick={() => onPick(o.id)}
              aria-pressed={on}
              className="pm-demo-chip"
              style={{
                fontSize: '12.5px', fontFamily: FONT_BODY, cursor: 'pointer',
                padding: '7px 14px', borderRadius: '999px',
                border: `1px solid ${on ? BLUE : '#dbe3ef'}`,
                background: on ? 'rgba(37,99,235,0.08)' : '#fff',
                color: on ? BLUE : '#475569',
                fontWeight: on ? 700 : 500,
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Panel({ titulo, sub, children }: { titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: '16px', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: INK }}>{titulo}</div>
        <div style={{ fontSize: '12.5px', color: DIM, marginTop: '3px' }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}
