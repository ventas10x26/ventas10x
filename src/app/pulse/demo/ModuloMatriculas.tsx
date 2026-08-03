'use client'

// Ruta destino: src/app/pulse/demo/ModuloMatriculas.tsx
//
// Sección "Matrículas" del panel demo. En un concesionario la matrícula es el
// último portón antes de que una venta cuente: mientras el vehículo no queda
// inscrito ante el RUNT, el pedido está firmado pero la unidad no se factura ni
// suma al indicador del mes.
//
// La vista por defecto es la compuerta (estados pendientes) y no el calendario
// de inscripciones, aunque el calendario sea el reporte que un concesionario ya
// tiene. El motivo es la tesis del módulo: cuántas se matricularon es un dato
// que aparece solo al cierre; cuántas están represadas y hace cuántos días es
// el que permite hacer algo mientras el mes todavía se puede mover.
//
// TEMA: este archivo no declara colores propios salvo la escala de antigüedad.
// Todo lo demás sale de las variables que define page.tsx, así la sección
// acompaña el toggle claro/oscuro sin recibir el tema por props. Al agregar un
// color nuevo, agregarlo a los dos bloques .pm-tema-* de abajo — uno solo deja
// texto invisible al cambiar de modo.
//
// REGLA DURA DE DATOS: todas las cifras son sintéticas, con otra escala y otra
// distribución que cualquier operación real, y están construidas para ilustrar
// el método. No hay marca, modelo, sede, asesor ni cliente: las familias son
// segmentos genéricos de carrocería y las vitrinas son puntos cardinales.

import { useMemo, useState } from 'react'

const FONT = 'var(--font-inter), sans-serif'
const FONT_BODY = "'DM Sans', sans-serif"

const INK = 'var(--pm-ink)'
const DIM = 'var(--pm-dim)'
const MUTED = 'var(--pm-muted)'
const LINE = 'var(--pm-line)'
const ROW_LINE = 'var(--pm-rowline)'
const TRACK = 'var(--pm-track)'
const SURFACE = 'var(--pm-surface)'
const CARD = 'var(--pm-card)'
const BLUE = 'var(--pm-blue)'
const BLUE_SOFT = 'var(--pm-blue-soft)'
const AMBER_LINE = 'var(--pm-amber-line)'

// Escala de antigüedad. Es el único color que este archivo define: los tokens del
// panel no tienen un "ok / atención / crítico" y usar el rojo de KPI para "9 días
// detenida" mezclaría dos lecturas distintas en el mismo color.
const OK = 'var(--pmx-ok)'
const WARN = 'var(--pmx-warn)'
const CRIT = 'var(--pmx-crit)'

const DIAS_MES = 30
const DOMINGOS = [7, 14, 21, 28]

type FilaMes = { familia: string; total: number; dias: [number, number][] }

const MATRICULADAS: FilaMes[] = [
  { familia: 'Hatchback urbano', total: 71, dias: [[1,1],[4,2],[5,1],[8,1],[11,3],[12,2],[13,3],[15,3],[19,2],[20,5],[22,5],[23,5],[24,5],[25,2],[26,6],[27,11],[29,5],[30,9]] },
  { familia: 'SUV compacta', total: 34, dias: [[1,3],[2,2],[3,1],[5,2],[10,1],[13,2],[15,1],[16,3],[17,2],[19,2],[20,1],[24,3],[25,2],[26,4],[29,3],[30,2]] },
  { familia: 'SUV subcompacta', total: 27, dias: [[3,1],[5,1],[9,1],[12,1],[15,1],[17,1],[18,1],[20,1],[22,1],[24,1],[25,1],[26,4],[27,8],[29,1],[30,3]] },
  { familia: 'SUV híbrida', total: 23, dias: [[4,1],[5,1],[6,2],[8,1],[10,1],[16,1],[19,1],[20,1],[22,3],[24,2],[26,3],[27,1],[29,2],[30,3]] },
  { familia: 'Sedán mediano', total: 21, dias: [[4,1],[5,1],[8,2],[9,1],[10,2],[12,1],[16,1],[17,2],[20,1],[22,4],[25,1],[26,1],[27,1],[29,1],[30,1]] },
  { familia: 'Eléctrico mediano', total: 16, dias: [[4,1],[10,1],[12,1],[16,1],[20,2],[27,3],[29,5],[30,2]] },
  { familia: 'Flota / servicio público', total: 14, dias: [[3,1],[8,1],[12,1],[17,2],[18,1],[22,1],[23,1],[24,1],[26,2],[27,2],[30,1]] },
  { familia: 'Crossover urbano', total: 12, dias: [[10,1],[12,1],[15,1],[16,1],[17,1],[20,1],[23,1],[26,1],[27,2],[29,1],[30,1]] },
  { familia: 'Sedán compacto', total: 11, dias: [[8,1],[15,1],[16,1],[17,1],[19,1],[23,1],[25,2],[29,2],[30,1]] },
  { familia: 'SUV grande', total: 9, dias: [[2,1],[10,1],[13,1],[15,1],[20,2],[22,1],[23,1],[26,1]] },
  { familia: 'Eléctrico compacto', total: 5, dias: [[1,1],[6,1],[20,2],[29,1]] },
  { familia: 'Pickup', total: 3, dias: [[22,1],[29,1],[30,1]] },
]

const VITRINAS = ['Norte', 'Centro', 'Sur', 'Oriente', 'Occidente', 'Portal']

// `dias` es la antigüedad promedio en el estado — el dato que convierte un conteo
// en una alerta. `bloqueo` distingue lo que necesita que alguien haga algo de lo
// que avanza solo: sin esa separación, el total se lee como una crisis cuando en
// realidad una parte ya está en trámite normal.
type Estado = { estado: string; total: number; dias: number; bloqueo: boolean; pv: number[]; nota: string }

const ESTADOS: Estado[] = [
  { estado: 'Servicio público / taxi', total: 19, dias: 11, bloqueo: true,  pv: [0, 9, 0, 10, 0, 0], nota: 'Requiere cupo y trámite ante la autoridad de transporte.' },
  { estado: 'Radicado en tránsito',    total: 16, dias: 6,  bloqueo: false, pv: [1, 0, 7, 6, 0, 2], nota: 'Ya está en la ventanilla. Avanza sin intervención.' },
  { estado: 'En proceso hoy',          total: 14, dias: 1,  bloqueo: false, pv: [7, 0, 0, 0, 0, 7], nota: 'Se inscribe en la jornada.' },
  { estado: 'Otra ciudad',             total: 5,  dias: 9,  bloqueo: true,  pv: [0, 0, 0, 3, 0, 2], nota: 'Matrícula fuera del municipio de la vitrina.' },
  { estado: 'Solo SOAT',               total: 4,  dias: 4,  bloqueo: true,  pv: [0, 2, 1, 0, 1, 0], nota: 'Falta el resto del expediente para radicar.' },
  { estado: 'Pendiente de solicitud',  total: 3,  dias: 7,  bloqueo: true,  pv: [0, 0, 1, 0, 2, 0], nota: 'Nadie abrió el trámite todavía.' },
  { estado: 'Registro de prenda',      total: 1,  dias: 5,  bloqueo: true,  pv: [0, 1, 0, 0, 0, 0], nota: 'El banco no ha registrado la garantía.' },
  { estado: 'Programada próximo mes',  total: 2,  dias: 0,  bloqueo: false, pv: [0, 1, 0, 1, 0, 0], nota: 'Decisión comercial, no represa.' },
]

// Totales del modulo. Se exportan para que el encabezado del panel los muestre
// sin duplicar las cifras en page.tsx: si manana cambian los datos sinteticos,
// el pill del encabezado cambia solo.
export const TOTAL_MATRICULADAS = MATRICULADAS.reduce((a, f) => a + f.total, 0)
export const TOTAL_REPRESADAS = ESTADOS.reduce((a, e) => a + e.total, 0)

type VistaId = 'compuerta' | 'calendario' | 'vitrinas'

const VISTAS: { id: VistaId; label: string; sub: string }[] = [
  { id: 'compuerta',  label: 'Compuerta',  sub: 'Qué frena y hace cuánto' },
  { id: 'calendario', label: 'Calendario', sub: 'Inscripciones día a día' },
  { id: 'vitrinas',   label: 'Vitrinas',   sub: 'Dónde está cada represa' },
]

function colorAntiguedad(dias: number): string {
  if (dias >= 9) return CRIT
  if (dias >= 4) return WARN
  return OK
}

export default function ModuloMatriculas() {
  const [vista, setVista] = useState<VistaId>('compuerta')
  const [foco, setFoco] = useState<string | null>(null)

  const totalMatriculadas = useMemo(() => MATRICULADAS.reduce((a, f) => a + f.total, 0), [])
  const totalRepresadas = useMemo(() => ESTADOS.reduce((a, e) => a + e.total, 0), [])
  const bloqueadas = useMemo(() => ESTADOS.filter(e => e.bloqueo).reduce((a, e) => a + e.total, 0), [])
  const antiguedad = useMemo(
    () => (ESTADOS.reduce((a, e) => a + e.total * e.dias, 0) / totalRepresadas).toFixed(1),
    [totalRepresadas],
  )

  const porDia = useMemo(() => {
    const acc = Array(DIAS_MES + 1).fill(0) as number[]
    MATRICULADAS.forEach(f => f.dias.forEach(([d, v]) => { acc[d] += v }))
    return acc
  }, [])
  const maxDia = Math.max(...porDia)
  const maxEstado = Math.max(...ESTADOS.map(e => e.total))

  const grid = `180px repeat(${DIAS_MES}, 1fr) 44px`
  const gridPv = `1.5fr repeat(${VITRINAS.length}, 1fr) 0.7fr`

  return (
    <div className="pmx" style={{ fontFamily: FONT_BODY }}>
      {/* Sin interpolación dentro del <style>: el SWC de Next 15 falla al compilar
          expresiones dentro de un <style> en JSX. Los colores van literales. */}
      <style>{`
        .pmx { --pmx-ok:#2DD4BF; --pmx-warn:#FBBF24; --pmx-crit:#F87171; --pmx-heat:59,130,246; --pmx-empty:rgba(255,255,255,0.05); }
        .pm-tema-dark .pmx { --pmx-ok:#2DD4BF; --pmx-warn:#FBBF24; --pmx-crit:#F87171; --pmx-heat:59,130,246; --pmx-empty:rgba(255,255,255,0.05); }
        .pm-tema-light .pmx { --pmx-ok:#0D9488; --pmx-warn:#B45309; --pmx-crit:#DC2626; --pmx-heat:37,99,235; --pmx-empty:rgba(15,23,42,0.06); }
        .pmx-tab { transition: background .15s ease, border-color .15s ease, color .15s ease; }
        .pmx-row { transition: background .12s ease; }
        .pmx-row:hover { background: var(--pm-inset); }
        .pmx-cell { transition: transform .12s ease; }
        .pmx-cell:hover { transform: scale(1.35); }
        .pmx-scroll::-webkit-scrollbar { height: 8px; }
        .pmx-scroll::-webkit-scrollbar-thumb { background: var(--pm-track); border-radius: 4px; }
        .pmx-tab:focus-visible { outline: 2px solid var(--pm-blue); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .pmx-tab, .pmx-row, .pmx-cell { transition: none; }
          .pmx-cell:hover { transform: none; }
        }
        @media (max-width: 720px) {
          .pmx-hero { grid-template-columns: 1fr !important; }
          .pmx-tabs { overflow-x: auto; }
        }
      `}</style>

      {/* Los dos números que ordenan el módulo. El de la derecha es el que rara vez
          existe en un tablero: sin él, la represa se descubre con el mes cerrado. */}
      <div className="pmx-hero" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <Tarjeta
          valor={totalMatriculadas}
          etiqueta="Publicadas ante el RUNT"
          pie="cierran el mes y suman al indicador"
          color={OK}
        />
        <Tarjeta
          valor={totalRepresadas}
          etiqueta="Represadas antes de la placa"
          pie={`${bloqueadas} requieren que alguien actúe · ${antiguedad} días detenidas en promedio`}
          color={WARN}
          alerta
        />
      </div>

      <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6, margin: '0 0 18px', maxWidth: '78ch' }}>
        Entre el pedido firmado y la matrícula publicada hay una fila de estados que casi nadie mide. Cada unidad detenida ahí es una venta hecha que todavía no se factura ni cuenta para el mes.
      </p>

      <div className="pmx-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {VISTAS.map(v => {
          const activa = vista === v.id
          return (
            <button
              key={v.id}
              onClick={() => setVista(v.id)}
              className="pmx-tab"
              aria-pressed={activa}
              style={{
                flex: '1 1 0', minWidth: '148px', textAlign: 'left', cursor: 'pointer',
                padding: '10px 13px', borderRadius: '11px',
                border: `1px solid ${activa ? BLUE : LINE}`,
                background: activa ? BLUE_SOFT : CARD,
                fontFamily: FONT_BODY,
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: activa ? INK : DIM }}>{v.label}</div>
              <div style={{ fontSize: '10.5px', color: MUTED, marginTop: '2px' }}>{v.sub}</div>
            </button>
          )
        })}
      </div>

      {/* ── Compuerta ──────────────────────────────────────────────────────── */}
      {vista === 'compuerta' && (
        <Bloque
          titulo="La fila antes del RUNT"
          sub="Ordenada por antigüedad, no por volumen: lo que lleva más tiempo detenido es lo que cuesta plata."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {[...ESTADOS].sort((a, b) => b.dias - a.dias).map(e => {
              const c = colorAntiguedad(e.dias)
              const abierto = foco === e.estado
              return (
                <div
                  key={e.estado}
                  className="pmx-row"
                  onClick={() => setFoco(abierto ? null : e.estado)}
                  style={{ padding: '11px 13px', borderRadius: '10px', border: `1px solid ${LINE}`, background: CARD, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '4px', alignSelf: 'stretch', minHeight: '30px', borderRadius: '2px', background: c, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: INK }}>{e.estado}</span>
                        {e.bloqueo && (
                          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: c, border: `1px solid ${c}`, borderRadius: '4px', padding: '1px 5px' }}>
                            Requiere acción
                          </span>
                        )}
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: TRACK, marginTop: '7px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(e.total / maxEstado) * 100}%`, background: c, borderRadius: '3px' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '92px' }}>
                      <div style={{ fontFamily: FONT, fontSize: '19px', fontWeight: 800, lineHeight: 1, color: INK }}>{e.total}</div>
                      <div style={{ fontSize: '10.5px', color: c, marginTop: '3px' }}>
                        {e.dias === 0 ? 'sin represa' : `${e.dias} d detenidas`}
                      </div>
                    </div>
                  </div>
                  {abierto && (
                    <div style={{ fontSize: '12px', color: DIM, lineHeight: 1.55, marginTop: '9px', paddingLeft: '16px', borderLeft: `1px solid ${LINE}` }}>
                      {e.nota}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '11.5px', color: MUTED, marginTop: '13px', lineHeight: 1.55 }}>
            Tocá una fila para ver por qué está detenida. La antigüedad se cuenta desde que la unidad entró al estado, no desde la venta.
          </p>
        </Bloque>
      )}

      {/* ── Calendario ─────────────────────────────────────────────────────── */}
      {vista === 'calendario' && (
        <Bloque
          titulo="Inscripciones día a día"
          sub={`${totalMatriculadas} unidades publicadas en el mes. La intensidad del bloque es el volumen del día.`}
        >
          <div className="pmx-scroll" style={{ overflowX: 'auto', paddingBottom: '6px' }}>
            <div style={{ minWidth: '760px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: grid, gap: '2px', marginBottom: '5px' }}>
                <span />
                {Array.from({ length: DIAS_MES }, (_, i) => i + 1).map(d => (
                  <span key={d} style={{ fontSize: '8.5px', textAlign: 'center', color: DOMINGOS.includes(d) ? 'var(--pm-disabled)' : MUTED }}>{d}</span>
                ))}
                <span style={{ fontSize: '9px', textAlign: 'right', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tot</span>
              </div>

              {MATRICULADAS.map(f => {
                const mapa = Object.fromEntries(f.dias) as Record<number, number>
                return (
                  <div key={f.familia} style={{ display: 'grid', gridTemplateColumns: grid, gap: '2px', marginBottom: '2px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{f.familia}</span>
                    {Array.from({ length: DIAS_MES }, (_, i) => i + 1).map(d => {
                      const v = mapa[d] || 0
                      const a = v ? (0.22 + Math.min(1, v / 11) * 0.78).toFixed(2) : '0'
                      const domingo = DOMINGOS.includes(d)
                      return (
                        <span
                          key={d}
                          className="pmx-cell"
                          title={v ? `${f.familia} · día ${d}: ${v}` : `${f.familia} · día ${d}: sin inscripciones`}
                          style={{
                            height: '17px', borderRadius: '3px', display: 'block',
                            background: v ? `rgba(var(--pmx-heat), ${a})` : (domingo ? 'transparent' : 'var(--pmx-empty)'),
                            border: domingo && !v ? `1px dashed ${ROW_LINE}` : 'none',
                          }}
                        />
                      )
                    })}
                    <span style={{ fontFamily: FONT, fontSize: '11px', textAlign: 'right', fontWeight: 800, color: INK }}>{f.total}</span>
                  </div>
                )
              })}

              <div style={{ display: 'grid', gridTemplateColumns: grid, gap: '2px', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${LINE}`, alignItems: 'end' }}>
                <span style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total día</span>
                {Array.from({ length: DIAS_MES }, (_, i) => i + 1).map(d => (
                  <span key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '100%', height: `${Math.max(2, (porDia[d] / maxDia) * 30)}px`, background: porDia[d] ? OK : 'transparent', borderRadius: '2px', opacity: 0.8 }} />
                    <span style={{ fontSize: '8.5px', color: porDia[d] ? DIM : 'transparent' }}>{porDia[d] || 0}</span>
                  </span>
                ))}
                <span style={{ fontFamily: FONT, fontSize: '12px', textAlign: 'right', fontWeight: 800, color: OK }}>{totalMatriculadas}</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '11.5px', color: MUTED, marginTop: '13px', lineHeight: 1.55 }}>
            Los días punteados no tienen operación. El apilamiento sobre el cierre no es casualidad: es la cola que se resuelve contra reloj, y es exactamente lo que la vista de compuerta permite anticipar.
          </p>
        </Bloque>
      )}

      {/* ── Vitrinas ───────────────────────────────────────────────────────── */}
      {vista === 'vitrinas' && (
        <Bloque
          titulo="Dónde está cada represa"
          sub="El mismo pendiente, abierto por punto de venta. Un total no le sirve a nadie: la acción la ejecuta una vitrina."
        >
          <div className="pmx-scroll" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '620px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: gridPv, gap: '8px', paddingBottom: '9px', borderBottom: `1px solid ${LINE}`, fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
                <span>Estado</span>
                {VITRINAS.map(v => <span key={v} style={{ textAlign: 'center' }}>{v}</span>)}
                <span style={{ textAlign: 'right' }}>Total</span>
              </div>

              {ESTADOS.map(e => {
                const c = colorAntiguedad(e.dias)
                return (
                  <div key={e.estado} className="pmx-row" style={{ display: 'grid', gridTemplateColumns: gridPv, gap: '8px', padding: '9px 0', borderBottom: `1px solid ${ROW_LINE}`, alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: INK, minWidth: 0 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: c, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.estado}</span>
                    </span>
                    {e.pv.map((n, i) => (
                      <span key={i} style={{ textAlign: 'center', fontFamily: FONT, fontSize: '13px', color: n ? INK : 'var(--pm-disabled)', fontWeight: n ? 700 : 400 }}>
                        {n || '·'}
                      </span>
                    ))}
                    <span style={{ textAlign: 'right', fontFamily: FONT, fontSize: '13px', fontWeight: 800, color: c }}>{e.total}</span>
                  </div>
                )
              })}

              <div style={{ display: 'grid', gridTemplateColumns: gridPv, gap: '8px', paddingTop: '11px' }}>
                <span style={{ color: MUTED, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.6px', fontWeight: 700 }}>Represado</span>
                {VITRINAS.map((_, i) => {
                  const n = ESTADOS.reduce((a, e) => a + e.pv[i], 0)
                  return <span key={i} style={{ textAlign: 'center', fontFamily: FONT, fontSize: '14px', fontWeight: 800, color: n >= 15 ? CRIT : INK }}>{n}</span>
                })}
                <span style={{ textAlign: 'right', fontFamily: FONT, fontSize: '14px', fontWeight: 800, color: WARN }}>{totalRepresadas}</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '11.5px', color: MUTED, marginTop: '13px', lineHeight: 1.55 }}>
            Una vitrina concentra casi un tercio del pendiente. Sin esta apertura, esa concentración se lee como un problema general del concesionario en vez de como una gestión puntual.
          </p>
        </Bloque>
      )}

      <div style={{ marginTop: '16px', background: CARD, border: `1px solid ${LINE}`, borderRadius: '14px', padding: '18px' }}>
        <div style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 800, color: INK, marginBottom: '13px' }}>Cómo lo resuelve el módulo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {[
            ['Un registro por unidad', 'Pedido, expediente, estado y placa viven en el mismo lugar, con su historial de cambios.'],
            ['El estado se vuelve reloj', 'Cada cambio guarda la fecha, así el sistema sabe cuántos días lleva detenida cada unidad.'],
            ['La represa avisa sola', 'Cuando un estado supera su umbral, la unidad aparece en la bandeja de la vitrina responsable.'],
            ['El cierre deja de ser sorpresa', 'A mitad de mes ya se sabe cuántas alcanzan a inscribirse y cuántas no.'],
          ].map(([t, d]) => (
            <div key={t}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: INK, marginBottom: '5px' }}>{t}</div>
              <div style={{ fontSize: '12px', color: DIM, lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Tarjeta({ valor, etiqueta, pie, color, alerta }: { valor: number; etiqueta: string; pie: string; color: string; alerta?: boolean }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${alerta ? AMBER_LINE : LINE}`, borderRadius: '12px', padding: '15px 17px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
        <span style={{ fontFamily: FONT, fontSize: '36px', fontWeight: 800, lineHeight: 1, color, letterSpacing: '-0.02em' }}>{valor}</span>
        <span style={{ fontSize: '12px', color: DIM }}>unidades</span>
      </div>
      <div style={{ fontSize: '12.5px', fontWeight: 600, color: INK, marginTop: '8px' }}>{etiqueta}</div>
      <div style={{ fontSize: '11.5px', color: MUTED, marginTop: '3px', lineHeight: 1.5 }}>{pie}</div>
    </div>
  )
}

function Bloque({ titulo, sub, children }: { titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: '16px', padding: '18px' }}>
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: INK }}>{titulo}</div>
        <div style={{ fontSize: '12.5px', color: DIM, marginTop: '3px', lineHeight: 1.5 }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}
