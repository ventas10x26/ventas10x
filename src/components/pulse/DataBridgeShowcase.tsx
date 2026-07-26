'use client'

const FONT = "var(--font-inter), sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const FONT_MONO = "var(--font-mono), 'IBM Plex Mono', monospace"

const BLUE = '#2563EB'
const BLUE_2 = '#1D4ED8'

// Archivos tal como llegan de un concesionario real: nombres inconsistentes, versiones
// duplicadas, la misma entidad nombrada distinto en cada hoja.
const FUENTES_DISPERSAS = [
  { label: 'ventas_julio_FINAL(2).xlsx', rot: -6 },
  { label: 'leads_web.csv', rot: 4 },
  { label: 'Copia de cartera.xlsx', rot: -2 },
  { label: 'polizas 2026 v3.xlsx', rot: 7 },
  { label: 'retomas_tasacion.csv', rot: -5 },
  { label: 'export_crm_(1).json', rot: 3 },
  { label: 'accesorios_bodega.xlsx', rot: -8 },
  { label: 'matriculas_runt.csv', rot: 5 },
]

const CAMPOS_SUELTOS = ['VIN', 'Vend', 'ASESOR', 'cedula_cli', 'Nro Documento', 'placa', 'Modelo', 'version_veh']

const TABLAS_ORDENADAS = [
  { nombre: 'Clientes', color: '#8B5CF6', campos: ['documento · identificador', 'nombre · texto', 'celular · texto'] },
  { nombre: 'Vehículos', color: '#0D9488', campos: ['vin · identificador', 'modelo · texto', 'versión · texto'] },
  { nombre: 'Operaciones', color: BLUE, campos: ['documento · identificador', 'vin · identificador', 'asesor · texto'] },
]

export function DataBridgeOrden() {
  return (
    <div style={{ marginTop: '56px' }}>
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUE, marginBottom: '10px' }}>
          Lo que hace DataBridge
        </div>
        <h2 style={{ fontFamily: FONT, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 8px', color: '#0f172a' }}>
          Tus datos hoy viven dispersos.<br />
          <span style={{ color: BLUE }}>Acá salen estructurados y relacionados.</span>
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: '14px', color: '#64748b', margin: 0, maxWidth: '60ch', marginInline: 'auto', lineHeight: 1.6 }}>
          Diez exportaciones distintas, cada una con su propio nombre para el mismo campo. La IA lee todas, infiere el tipo de dato de cada columna y encuentra por dónde se cruzan.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', gap: '18px', alignItems: 'center' }} className="pm-orden-grid">
        {/* Antes */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 18px 24px', minHeight: '250px' }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '16px' }}>
            Como llegan hoy
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {FUENTES_DISPERSAS.map(f => (
              <span key={f.label} style={{
                fontFamily: FONT_MONO, fontSize: '10.5px', color: '#475569',
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
                padding: '5px 9px', transform: `rotate(${f.rot}deg)`, whiteSpace: 'nowrap',
              }}>
                {f.label}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CAMPOS_SUELTOS.map(c => (
              <span key={c} style={{ fontFamily: FONT_MONO, fontSize: '10px', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '5px', padding: '3px 7px' }}>
                {c}
              </span>
            ))}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: '11.5px', color: '#94a3b8', marginTop: '16px', lineHeight: 1.5 }}>
            El mismo asesor aparece como <span style={{ fontFamily: FONT_MONO }}>Vend</span>, <span style={{ fontFamily: FONT_MONO }}>ASESOR</span> y <span style={{ fontFamily: FONT_MONO }}>asesor_email</span> según la hoja.
          </div>
        </div>

        {/* Puente */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: `linear-gradient(135deg, ${BLUE}, ${BLUE_2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '20px', fontWeight: 700,
            boxShadow: '0 8px 20px rgba(37,99,235,0.28)',
          }}>→</div>
          <span style={{ fontFamily: FONT_MONO, fontSize: '9.5px', letterSpacing: '0.1em', textTransform: 'uppercase', color: BLUE }}>
            DataBridge
          </span>
        </div>

        {/* Después */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 18px 24px', minHeight: '250px' }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '16px' }}>
            Como quedan
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {TABLAS_ORDENADAS.map((t, i) => (
              <div key={t.nombre} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ background: t.color, color: '#fff', fontFamily: FONT, fontSize: '11.5px', fontWeight: 700, padding: '6px 10px' }}>
                  {t.nombre}
                </div>
                {t.campos.map((c, ci) => (
                  <div key={c} style={{
                    fontFamily: FONT_MONO, fontSize: '10px', color: '#475569',
                    padding: '4px 10px', borderTop: ci === 0 ? 'none' : '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: i < 2 && ci === 0 ? BLUE : '#cbd5e1', flexShrink: 0 }} />
                    {c}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: '11.5px', color: '#64748b', marginTop: '14px', lineHeight: 1.5 }}>
            Tres tablas, tipos inferidos y <span style={{ color: BLUE, fontWeight: 600 }}>2 llaves compartidas</span> detectadas entre ellas.
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .pm-orden-grid { grid-template-columns: 1fr !important; }
          .pm-orden-grid > div:nth-child(2) { flex-direction: row !important; }
        }
      `}</style>
    </div>
  )
}

// Datos ficticios de demostración — no provienen de ningún concesionario real.
const EMBUDO = [
  { etapa: 'Oportunidades', valor: 1240, pct: 100 },
  { etapa: 'Citas', valor: 486, pct: 39 },
  { etapa: 'Show up', valor: 342, pct: 28 },
  { etapa: 'Cotizaciones', valor: 268, pct: 22 },
  { etapa: 'Pedidos', valor: 121, pct: 10 },
  { etapa: 'Matrículas', valor: 98, pct: 8 },
]

const ASESORES = [
  { nombre: 'Asesor A', sede: 'Sede Norte', cierre: 14.2, pct: 100 },
  { nombre: 'Asesor B', sede: 'Sede Centro', cierre: 11.8, pct: 83 },
  { nombre: 'Asesor C', sede: 'Sede Norte', cierre: 9.4, pct: 66 },
  { nombre: 'Asesor D', sede: 'Sede Sur', cierre: 7.1, pct: 50 },
  { nombre: 'Asesor E', sede: 'Sede Sur', cierre: 5.6, pct: 39 },
]

const INTEGRALIDAD = [
  { linea: 'Financiación', pct: 62, color: BLUE },
  { linea: 'Póliza todo riesgo', pct: 48, color: '#0D9488' },
  { linea: 'Accesorios', pct: 34, color: '#8B5CF6' },
  { linea: 'Retoma', pct: 27, color: '#DB2777' },
  { linea: 'Monitoreo satelital', pct: 12, color: '#F2A93B' },
]

function CardPrototipo({ tag, color, titulo, desc, children }: {
  tag: string; color: string; titulo: string; desc: string; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          color, background: `${color}14`, border: `1px solid ${color}33`, borderRadius: '6px', padding: '3px 8px',
        }}>{tag}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: '9.5px', color: '#94a3b8' }}>datos de ejemplo</span>
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{titulo}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div style={{ background: '#0B0D12', borderRadius: '12px', padding: '14px', flex: 1 }}>
        {children}
      </div>
    </div>
  )
}

export function DataBridgePrototipos() {
  return (
    <div style={{ marginTop: '56px' }}>
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUE, marginBottom: '10px' }}>
          Prototipos
        </div>
        <h2 style={{ fontFamily: FONT, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 8px', color: '#0f172a' }}>
          Del esquema al panel: <span style={{ color: BLUE }}>esto es lo que se arma</span>
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: '14px', color: '#64748b', margin: 0, maxWidth: '60ch', marginInline: 'auto', lineHeight: 1.6 }}>
          Tres paneles que salen del mismo modelo de datos una vez que las tablas quedan cruzadas. Las cifras de abajo son de muestra.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <CardPrototipo
          tag="01 · Embudo"
          color={BLUE}
          titulo="Embudo comercial 360°"
          desc="Cada etapa con su caída real — desde la oportunidad hasta la matrícula efectiva."
        >
          <div style={{ display: 'grid', gap: '7px' }}>
            {EMBUDO.map(e => (
              <div key={e.etapa}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_BODY, fontSize: '9.5px', color: '#94a3b8', marginBottom: '3px' }}>
                  <span>{e.etapa}</span>
                  <span style={{ fontFamily: FONT_MONO, color: '#e2e8f0' }}>{e.valor.toLocaleString('es-CO')}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${e.pct}%`, height: '100%', background: `linear-gradient(90deg, ${BLUE}, ${BLUE_2})`, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </CardPrototipo>

        <CardPrototipo
          tag="02 · Asesores"
          color="#0D9488"
          titulo="Productividad por asesor"
          desc="Conversión real de cada asesor y sede, cruzando el CRM con las matrículas facturadas."
        >
          <div style={{ display: 'grid', gap: '11px' }}>
            {ASESORES.map(a => (
              <div key={a.nombre}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: '10.5px', color: '#e2e8f0' }}>
                    {a.nombre} <span style={{ color: '#64748b', fontSize: '9px' }}>· {a.sede}</span>
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: '10px', color: '#0D9488', fontWeight: 600 }}>{a.cierre}%</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', background: '#0D9488', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </CardPrototipo>

        <CardPrototipo
          tag="03 · Integralidad"
          color="#8B5CF6"
          titulo="Integralidad por venta"
          desc="Qué porcentaje de las ventas se lleva también financiación, póliza, retoma o accesorios."
        >
          <div style={{ display: 'grid', gap: '12px' }}>
            {INTEGRALIDAD.map(l => (
              <div key={l.linea} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.linea}
                  </div>
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${l.pct}%`, height: '100%', background: l.color, borderRadius: '3px' }} />
                  </div>
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: '12px', fontWeight: 700, color: l.color, width: '34px', textAlign: 'right' }}>{l.pct}%</span>
              </div>
            ))}
          </div>
        </CardPrototipo>
      </div>
    </div>
  )
}
