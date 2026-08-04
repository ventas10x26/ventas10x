'use client'

// Ruta destino: src/components/pulse/PulsePrototipos.tsx
//
// Sección "Empieza con un prototipo" del home.
//
// Toma el lenguaje visual de DataBridgePrototipos —tarjeta clara con un panel
// oscuro embebido— pero cambia el contenido: en vez de tres paneles ilustrativos,
// son los seis módulos que el visitante puede abrir de verdad en /pulse/demo.
//
// POR QUÉ CADA TARJETA ES UN ENLACE. La sección de DataBridge muestra lo que se
// arma; ésta muestra lo que ya existe. Si el prototipo es real y navegable, la
// tarjeta tiene que llevar hasta él — y lleva a su módulo exacto, no a la portada
// del demo, aprovechando que la sección viaja en la URL (?seccion=).
//
// La miniatura de cada tarjeta reproduce la forma del panel real, no un gráfico
// genérico: quien llega al demo tiene que reconocer lo que vio acá. Las cifras son
// de muestra y no corresponden a ningún concesionario.

const FONT = 'var(--font-display), var(--font-inter), sans-serif'
const FONT_BODY = 'var(--font-inter), sans-serif'
const FONT_MONO = 'var(--font-mono), monospace'

// El panel embebido va oscuro en los dos temas de la página: es una captura de
// producto, y una captura que cambia de piel con el tema deja de leerse como tal.
const PANEL = '#0B0D12'
const PANEL_LINE = 'rgba(255,255,255,0.06)'
const PANEL_INK = '#e2e8f0'
const PANEL_DIM = '#94a3b8'
const PANEL_MUTED = '#64748b'

const AZUL = '#2563EB'
const AZUL_2 = '#3B82F6'
const TEAL = '#0D9488'
const VIOLETA = '#8B5CF6'
const CIAN = '#0EA5E9'
const AMBAR = '#D97706'

type Modulo = {
  seccion: string
  tag: string
  color: string
  titulo: string
  desc: string
  panel: React.ReactNode
}

// ── Piezas de miniatura ────────────────────────────────────────────────────
function Barra({ pct, color, alto = 5 }: { pct: number; color: string; alto?: number }) {
  return (
    <div style={{ height: `${alto}px`, background: PANEL_LINE, borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: '3px' }} />
    </div>
  )
}

function FilaValor({ label, sub, valor, pct, color }: { label: string; sub?: string; valor: string; pct: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', gap: '8px' }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: '10.5px', color: PANEL_INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}{sub && <span style={{ color: PANEL_MUTED, fontSize: '9px' }}> · {sub}</span>}
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: '10px', color, fontWeight: 600, flexShrink: 0 }}>{valor}</span>
      </div>
      <Barra pct={pct} color={color} />
    </div>
  )
}

// ── Los seis módulos ───────────────────────────────────────────────────────
const MODULOS: Modulo[] = [
  {
    seccion: 'resumen',
    tag: '01 · Resumen',
    color: AZUL,
    titulo: 'Resumen',
    desc: 'Las tasas contra su meta y el volumen del periodo, en una sola pantalla.',
    panel: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[['Citas', '48%', 119], ['Show up', '65%', 131], ['Cotización', '58%', 96], ['Conversión', '6%', 76]].map(([k, v, cump]) => {
          const cumple = Number(cump) >= 100
          return (
            <div key={k as string} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '7px', padding: '8px 9px' }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: '8.5px', color: PANEL_MUTED, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>{k}</div>
              <div style={{ fontFamily: FONT, fontSize: '17px', fontWeight: 800, color: PANEL_INK, lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: '8.5px', color: cumple ? AZUL_2 : '#F87171', marginTop: '3px' }}>{cump}% de meta</div>
            </div>
          )
        })}
      </div>
    ),
  },
  {
    seccion: 'funnel',
    tag: '02 · Funnel CRM',
    color: AZUL_2,
    titulo: 'Funnel CRM',
    desc: 'De dónde entra cada oportunidad y en qué etapa exacta se está cayendo.',
    panel: (
      <div style={{ display: 'grid', gap: '7px' }}>
        {[['Oportunidades', 2680, 100], ['Citas', 1286, 48], ['Show up', 831, 31], ['Cotizaciones', 754, 28], ['Pedidos', 375, 14], ['Matrículas', 163, 6]].map(([e, v, p]) => (
          <div key={e as string}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_BODY, fontSize: '9.5px', color: PANEL_DIM, marginBottom: '3px' }}>
              <span>{e}</span>
              <span style={{ fontFamily: FONT_MONO, color: PANEL_INK }}>{(v as number).toLocaleString('es-CO')}</span>
            </div>
            <Barra pct={p as number} color={`linear-gradient(90deg, ${AZUL_2}, ${AZUL})`} alto={6} />
          </div>
        ))}
      </div>
    ),
  },
  {
    seccion: 'asesores',
    tag: '03 · Asesores',
    color: TEAL,
    titulo: 'Asesores',
    desc: 'Conversión real de cada asesor y cada vitrina, sobre las matrículas efectivas.',
    panel: (
      <div style={{ display: 'grid', gap: '11px' }}>
        {[['Asesor A', 'Norte', '14.2%', 100], ['Asesor B', 'Centro', '11.8%', 83], ['Asesor C', 'Norte', '9.4%', 66], ['Asesor D', 'Sur', '7.1%', 50], ['Asesor E', 'Sur', '5.6%', 39]].map(([n, s, c, p]) => (
          <FilaValor key={n as string} label={n as string} sub={s as string} valor={c as string} pct={p as number} color={TEAL} />
        ))}
      </div>
    ),
  },
  {
    seccion: 'integralidad',
    tag: '04 · Integralidad',
    color: VIOLETA,
    titulo: 'Integralidad 360°',
    desc: 'Cuántas de las cinco líneas de margen carga cada unidad que ya vendiste.',
    panel: (
      <div style={{ display: 'grid', gap: '12px' }}>
        {[['Financiación', 62, VIOLETA], ['Póliza todo riesgo', 48, TEAL], ['Accesorios', 34, AZUL_2], ['Retomas', 27, '#EC4899']].map(([l, p, c]) => (
          <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: '10.5px', color: PANEL_INK, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>
              <Barra pct={p as number} color={c as string} />
            </div>
            <span style={{ fontFamily: FONT_MONO, fontSize: '12px', fontWeight: 700, color: c as string, width: '34px', textAlign: 'right' }}>{p}%</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    seccion: 'vitrinas',
    tag: '05 · Vitrinas',
    color: CIAN,
    titulo: 'Vitrinas',
    desc: 'Qué sede convierte y cuál solo genera tráfico sin cerrar.',
    panel: (
      <div style={{ display: 'grid', gap: '11px' }}>
        {[['Sede Norte', '1.020', '7.1%', 100], ['Sede Centro', '890', '5.8%', 82], ['Sede Sur', '770', '4.3%', 61]].map(([s, o, c, p]) => (
          <FilaValor key={s as string} label={s as string} sub={`${o} oport.`} valor={c as string} pct={p as number} color={CIAN} />
        ))}
      </div>
    ),
  },
  {
    seccion: 'matriculas',
    tag: '06 · Matrículas',
    color: AMBAR,
    titulo: 'Matrículas',
    desc: 'Cuántas unidades vendidas siguen represadas antes del RUNT, y hace cuántos días.',
    panel: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {[['246', 'publicadas', '#2DD4BF'], ['64', 'represadas', '#FBBF24']].map(([v, l, c]) => (
            <div key={l as string} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '7px', padding: '8px 9px' }}>
              <div style={{ fontFamily: FONT, fontSize: '19px', fontWeight: 800, color: c as string, lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: '9px', color: PANEL_MUTED, marginTop: '3px' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: '8px' }}>
          {[['Servicio público', '11 d', '#F87171', 100], ['Radicado', '6 d', '#FBBF24', 84], ['En proceso hoy', '1 d', '#2DD4BF', 74]].map(([e, d, c, p]) => (
            <FilaValor key={e as string} label={e as string} valor={d as string} pct={p as number} color={c as string} />
          ))}
        </div>
      </div>
    ),
  },
]

function TarjetaModulo({ m }: { m: Modulo }) {
  return (
    <a
      href={`/pulse/demo?seccion=${m.seccion}`}
      className="pm-proto-card"
      style={{
        display: 'flex', flexDirection: 'column', textDecoration: 'none',
        background: 'var(--bg-1)', border: '1px solid var(--line)',
        borderRadius: '14px', padding: '18px', minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: '9.5px', fontWeight: 600, letterSpacing: '.1em',
          textTransform: 'uppercase', color: m.color, padding: '4px 9px', borderRadius: '999px',
          background: `${m.color}1F`, border: `1px solid ${m.color}4D`, whiteSpace: 'nowrap',
        }}>
          {m.tag}
        </span>
        <span className="pm-proto-arrow" style={{ fontFamily: FONT_MONO, fontSize: '11px', color: 'var(--ink-dim)' }}>Abrir ↗</span>
      </div>

      <div style={{ fontFamily: FONT, fontSize: '16px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '5px' }}>
        {m.titulo}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.5, marginBottom: '14px' }}>
        {m.desc}
      </div>

      <div style={{ background: PANEL, borderRadius: '12px', padding: '14px', flex: 1 }}>
        {m.panel}
      </div>
    </a>
  )
}

export function PulsePrototipos() {
  return (
    <section id="prototipos" style={{ padding: '72px 24px', borderTop: '1px solid var(--line)' }}>
      <style>{`
        .pm-proto-card { transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease }
        .pm-proto-card:hover { transform: translateY(-3px); border-color: rgba(37,99,235,.45); box-shadow: 0 14px 34px rgba(15,23,42,.14) }
        .pm-proto-card:hover .pm-proto-arrow { color: var(--blue) }
        .pm-proto-card:focus-visible { outline: 2px solid var(--blue); outline-offset: 3px }
        @media (prefers-reduced-motion: reduce) { .pm-proto-card, .pm-proto-card:hover { transition: none; transform: none } }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: '10.5px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '10px' }}>
            Prototipos
          </div>
          <h2 style={{ fontFamily: FONT, fontSize: 'clamp(26px,3.4vw,40px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, margin: '0 0 10px', color: 'var(--ink)' }}>
            Empieza con un <span style={{ color: 'var(--blue)' }}>prototipo</span>
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: '15px', color: 'var(--ink-dim)', margin: '0 auto', maxWidth: '62ch', lineHeight: 1.6 }}>
            Seis módulos que salen del mismo modelo de datos. Cada uno está abierto y navegable ahora mismo — tocá cualquiera para entrar. Las cifras son de muestra.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {MODULOS.map(m => <TarjetaModulo key={m.seccion} m={m} />)}
        </div>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <a
            href="/pulse/demo"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '13px 26px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${AZUL_2}, ${AZUL})`, color: '#fff',
              fontFamily: FONT, fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            Ver el panel completo →
          </a>
        </div>
      </div>
    </section>
  )
}
