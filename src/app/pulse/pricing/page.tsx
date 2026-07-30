'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CREDITOS_CONFIG,
  PACKS,
  creditosACop,
  formatearCop,
  enlaceDePack,
  type PackCreditos,
} from '@/lib/pulse/creditos-config'

const FONT = "var(--font-inter), sans-serif"
const MONO = "var(--font-mono), monospace"

const BLUE   = '#2563EB'
const BG_0   = '#0B0D0C'
const BG_1   = '#14120F'
const BG_2   = '#1B1815'
const INK    = '#F5F1E9'
const INK_D  = '#8A8578'
const LINE    = 'rgba(255,255,255,0.10)'

// Lo que el agente hace gratis vs. lo que se cobra. Sale de CREDITOS_CONFIG para
// que la página no pueda mostrar un precio distinto al que cobra el backend.
const GRATIS = [
  'Responder mensajes de WhatsApp, sin límite',
  'Follow-up automático día 1, 3 y 7',
  'Calificar y ordenar el lead en el pipeline',
  'Conectar tu WhatsApp y entrenar al agente',
]

const RESULTADOS = [
  {
    accion: 'Cita agendada',
    detalle: 'El lead llega a Test Drive en tu pipeline',
    creditos: CREDITOS_CONFIG.COSTO.CITA_AGENDADA,
  },
  {
    accion: 'Venta cerrada',
    detalle: 'El lead llega a Cerrado',
    creditos: CREDITOS_CONFIG.COSTO.VENTA_CERRADA,
  },
]

export default function PulsePricingPage() {
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuarioEmail(data.user?.email ?? null)
    })
  }, [])

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG_0}; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .fade-up { animation: fadeUp .5s ease forwards; }
        .pack-card { transition: transform .18s ease, box-shadow .18s ease; }
        .pack-card:hover { transform: translateY(-3px); box-shadow: 0 18px 40px rgba(0,0,0,0.45); }
        @media (prefers-reduced-motion: reduce) {
          .fade-up { animation: none; }
          .pack-card:hover { transform: none; }
        }
        @media(max-width:860px){ .packs-grid{grid-template-columns:1fr!important} .cobro-split{grid-template-columns:1fr!important} }
      `}</style>

      <div style={{ minHeight: '100vh', background: BG_0, color: INK, fontFamily: FONT }}>

        <header style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1080px', margin: '0 auto', borderBottom: `1px solid ${LINE}` }}>
          <a href="/pulse" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: `linear-gradient(135deg,${BLUE},#1D4ED8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', color: '#fff' }}>⚡</div>
            <span style={{ fontSize: '17px', fontWeight: 800, color: INK, letterSpacing: '-.3px' }}>Pulse Motor</span>
          </a>
          {usuarioEmail && <span style={{ fontFamily: MONO, fontSize: '12px', color: INK_D }}>{usuarioEmail}</span>}
        </header>

        <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '56px 24px 80px' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '44px' }} className="fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.35)', borderRadius: '4px', padding: '5px 14px', fontFamily: MONO, fontSize: '11px', fontWeight: 600, color: '#93b4fb', marginBottom: '20px', letterSpacing: '.5px' }}>
              <span style={{ width: '7px', height: '7px', background: BLUE }} />
              SIN MENSUALIDAD
            </div>
            <h1 style={{ fontSize: 'clamp(30px,4.5vw,52px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-1px', marginBottom: '16px' }}>
              Pagás por la cita,<br />no por el <span style={{ color: BLUE }}>mes</span>
            </h1>
            <p style={{ fontSize: '16px', color: INK_D, maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
              Tu agente conversa gratis, todo lo que haga falta. El saldo se descuenta
              solo cuando un lead llega a test drive o se cierra la venta.
            </p>
          </div>

          {/* Gratis vs. se cobra */}
          <div className="cobro-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: LINE, border: `1px solid ${LINE}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '52px' }}>

            <div style={{ background: BG_1, padding: '28px' }}>
              <p style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: INK_D, letterSpacing: '1px', marginBottom: '18px' }}>NO CUESTA NADA</p>
              {GRATIS.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderBottom: `1px solid ${LINE}` }}>
                  <span style={{ fontFamily: MONO, fontSize: '13px', color: BLUE, flexShrink: 0, lineHeight: 1.5 }}>$0</span>
                  <span style={{ fontSize: '14px', color: INK_D, lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
              <p style={{ fontSize: '13px', color: INK_D, marginTop: '18px', lineHeight: 1.6 }}>
                Cobrar por mensaje castiga al agente que conversa más para cerrar mejor.
                Por eso no lo hacemos.
              </p>
            </div>

            <div style={{ background: BG_2, padding: '28px' }}>
              <p style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: '#93b4fb', letterSpacing: '1px', marginBottom: '18px' }}>SE COBRA AL RESULTADO</p>
              {RESULTADOS.map(r => (
                <div key={r.accion} style={{ padding: '12px 0', borderBottom: `1px solid ${LINE}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: INK }}>{r.accion}</span>
                    <span style={{ fontFamily: MONO, fontSize: '15px', fontWeight: 700, color: BLUE, whiteSpace: 'nowrap' }}>
                      {formatearCop(creditosACop(r.creditos))}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: INK_D }}>{r.detalle}</span>
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: INK_D, whiteSpace: 'nowrap' }}>{r.creditos} créditos</span>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: '13px', color: INK_D, marginTop: '18px', lineHeight: 1.6 }}>
                Cada resultado se cobra una sola vez por lead. Mover la tarjeta de vuelta
                y traerla otra vez no vuelve a descontar.
              </p>
            </div>
          </div>

          {/* Packs */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-.5px', marginBottom: '10px' }}>
              Cargá saldo cuando lo necesites
            </h2>
            <p style={{ fontSize: '15px', color: INK_D }}>
              El saldo no vence. 1 crédito = {formatearCop(CREDITOS_CONFIG.COP_POR_CREDITO)}.
            </p>
          </div>

          <div className="packs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '48px' }}>
            {PACKS.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>

          {/* Nota de saldo actual / bienvenida */}
          <div style={{ background: BG_1, border: `1px solid ${LINE}`, borderRadius: '8px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ width: '8px', height: '8px', background: BLUE, flexShrink: 0 }} />
            <span style={{ fontSize: '14px', color: INK_D, lineHeight: 1.6 }}>
              Al registrarte arrancás con <strong style={{ color: INK }}>{CREDITOS_CONFIG.BIENVENIDA} créditos</strong> —
              alcanzan para {Math.floor(CREDITOS_CONFIG.BIENVENIDA / CREDITOS_CONFIG.COSTO.CITA_AGENDADA)} citas agendadas
              sin poner un peso. Si el saldo llega a cero, el agente se pausa hasta que cargues.
            </span>
          </div>
        </main>
      </div>
    </>
  )
}

function PackCard({ pack }: { pack: PackCreditos }) {
  const citas = Math.floor(pack.creditos / CREDITOS_CONFIG.COSTO.CITA_AGENDADA)
  const disponible = Boolean(pack.bold_link)

  return (
    <div
      className="pack-card"
      style={{
        background: pack.destacado ? BG_2 : BG_1,
        border: `1px solid ${pack.destacado ? 'rgba(37,99,235,0.45)' : LINE}`,
        borderRadius: '8px',
        padding: '26px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        opacity: disponible ? 1 : 0.62,
      }}
    >
      {pack.etiqueta && (
        <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: pack.destacado ? '#93b4fb' : INK_D }}>
          {pack.etiqueta.toUpperCase()}
        </span>
      )}

      <div>
        <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
          {pack.creditos.toLocaleString('es-CO')}
        </div>
        <div style={{ fontFamily: MONO, fontSize: '12px', color: INK_D, marginTop: '4px' }}>créditos</div>
      </div>

      <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: '14px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: INK }}>{formatearCop(pack.precio_cop)}</div>
        <div style={{ fontSize: '13px', color: INK_D, marginTop: '4px' }}>
          ≈ {citas} citas agendadas
        </div>
      </div>

      <a
        href={enlaceDePack(pack)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block', textAlign: 'center', padding: '12px',
          borderRadius: '6px', marginTop: 'auto',
          background: pack.destacado ? BLUE : 'transparent',
          border: pack.destacado ? `1px solid ${BLUE}` : `1px solid ${LINE}`,
          color: pack.destacado ? '#fff' : INK,
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
        }}
      >
        {disponible ? 'Cargar saldo →' : 'Coordinar por WhatsApp →'}
      </a>

      {!disponible && (
        <div style={{ fontSize: '11px', color: INK_D, textAlign: 'center', lineHeight: 1.5 }}>
          Te pasamos el link de pago por este monto
        </div>
      )}
    </div>
  )
}
