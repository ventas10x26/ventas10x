'use client'

// Ruta destino: src/app/pulse/demo/page.tsx
//
// Demo público del panel de concesionario. No pide login a propósito: sirve para mandarle
// el link en frío a un prospecto que todavía no tiene cuenta.
//
// Todos los datos salen de ./datos.ts y son sintéticos — ver la regla dura documentada ahí.
// No agregar acá ninguna cifra, nombre de sede/asesor/marca/modelo que venga de un cliente
// real, ni siquiera "de ejemplo": esta pantalla es pública.
//
// Tema oscuro. Toda la paleta sale de las constantes de abajo: no meter hex sueltos en el
// JSX, porque después cambiar el fondo obliga a recorrer 900 líneas a mano.

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  PERIODOS, SEDES_OPCIONES, ASESORES_OPCIONES, CATEGORIAS_OPCIONES, ORIGEN_OPCIONES,
  FILTROS_INICIALES, calcularDemoFiltrado,
  calcularKpis, calcularAsesores, serieDiaria, GRUPO_CANAL_LABEL,
  formatearNumero, formatearPct, formatearMillones,
  type PeriodoId, type SedeId, type KpiDemo, type AsesorDemo, type PuntoDia,
  type OrigenDemo, type CanalDigital, type FiltrosDemo, type OrigenId,
} from './datos'

const FONT = "var(--font-inter), sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

// Azul un punto más claro que el de la landing: el #2563EB sobre fondo negro pierde
// legibilidad cuando se usa como color de texto (porcentajes, chips activos).
const BLUE = '#3B82F6'
const BLUE_2 = '#2563EB'

const INK = '#E6EBF5'
const DIM = '#93A3BE'
const MUTED = '#7F8FAE'
const LINE = 'rgba(255,255,255,0.09)'
const ROW_LINE = 'rgba(255,255,255,0.06)'
const TRACK = 'rgba(255,255,255,0.08)'

// Tres niveles de superficie a propósito. Un solo gris para todo deja el panel plano y se
// pierde el borde entre el lienzo y las tarjetas.
const BG = '#080B14'       // fondo de página
const SURFACE = '#0D1220'  // lienzo de contenido dentro del marco de app
const CARD = '#131A2B'     // tarjetas, paneles, barra superior
const CARD_2 = '#182034'   // elevado: listas desplegables, botones secundarios
const SIDE = '#0A0F1C'     // barra lateral

const RED = '#F87171'
const AMBER = '#FBBF24'

const CLAVE_DESBLOQUEO = 'pulse_demo_registrado'

export default function DemoPage() {
  const [filtros, setFiltros] = useState<FiltrosDemo>(FILTROS_INICIALES)
  const setFiltro = <K extends keyof FiltrosDemo>(k: K, v: FiltrosDemo[K]) =>
    setFiltros(f => ({ ...f, [k]: v }))

  // La hora de sync se fija en el cliente, nunca en el render inicial: si saliera del
  // servidor, el HTML llegaría con una hora y React la reemplazaría por otra.
  const [sync, setSync] = useState('')
  useEffect(() => { setSync(horaCorta()) }, [])

  // Arranca bloqueado a propósito: si arrancara abierto y recién después leyera el registro
  // previo, el panel se vería un instante antes de pedir los datos. Quien ya se registró
  // pasa el gate en el primer efecto, sin volver a llenar nada.
  const [desbloqueado, setDesbloqueado] = useState(false)

  // Vista "solo panel": la que se abre en pestaña nueva. Deja el panel sin el encabezado
  // de marketing, para poder proyectarlo en una reunión sin el titular de venta arriba.
  // Se lee de window y no con useSearchParams para no tener que envolver la página en un
  // Suspense solo por esto.
  const [soloPanel, setSoloPanel] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_DESBLOQUEO) === '1') setDesbloqueado(true)
    } catch { /* modo incógnito o storage bloqueado: se pide el registro igual */ }
    try {
      setSoloPanel(new URLSearchParams(window.location.search).get('vista') === 'panel')
    } catch { /* si no se puede leer la query, se muestra la página completa */ }
  }, [])

  const [seccion, setSeccion] = useState<SeccionId>('resumen')

  const { datos: d, origen, sedeEfectiva } = useMemo(() => calcularDemoFiltrado(filtros), [filtros])
  const kpis = useMemo(() => calcularKpis(d), [d])
  const asesores = useMemo(() => calcularAsesores(sedeEfectiva, filtros.periodo), [sedeEfectiva, filtros.periodo])
  const serie = useMemo(() => serieDiaria(d, sedeEfectiva), [d, sedeEfectiva])
  const maxEmbudo = d.embudo[0].valor || 1

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: FONT_BODY, colorScheme: 'dark' }}>
      {/* Sin interpolación de template literal acá dentro: el SWC de Next 15 falla al
          compilar expresiones dentro de un <style> en JSX. Los colores van literales. */}
      <style>{`
        body { background: #080B14; }
        .pm-demo-chip { transition: border-color .15s ease, color .15s ease, background .15s ease; }
        .pm-demo-barra { transition: width .35s cubic-bezier(.2,.7,.3,1); }
        .pm-demo-cta { transition: transform .15s ease, box-shadow .15s ease; }
        .pm-demo-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(37,99,235,0.45); }
        .pm-demo-nav { transition: background .15s ease, color .15s ease; }
        .pm-demo-nav:hover { background: rgba(255,255,255,0.06) !important; color: #fff !important; }
        .pm-demo-accion { transition: border-color .15s ease, color .15s ease; }
        .pm-demo-accion:hover { border-color: #3B82F6 !important; color: #7DA9FF !important; }
        .pm-demo-opcion { transition: background .12s ease; }
        .pm-demo-opcion:hover { background: rgba(255,255,255,0.07) !important; }
        /* El placeholder por defecto queda casi negro sobre el input oscuro del registro. */
        .pm-demo-gate input::placeholder { color: #5C6B87; }
        .pm-demo-gate input:focus { border-color: #3B82F6; }
        @media (prefers-reduced-motion: reduce) {
          .pm-demo-chip, .pm-demo-barra, .pm-demo-cta, .pm-demo-nav { transition: none; }
          .pm-demo-cta:hover { transform: none; }
        }
        /* En pantalla angosta la barra lateral pasa a ser una fila de pestañas arriba:
           212px fijos dejarían el panel en nada. */
        @media (max-width: 820px) {
          .pm-demo-app { grid-template-columns: 1fr !important; }
          .pm-demo-side { flex-direction: row !important; overflow-x: auto; align-items: center; gap: 6px !important; padding: 10px !important; }
          .pm-demo-side > div:first-child { display: none !important; }
          .pm-demo-side > div:nth-child(2) { display: none !important; }
          .pm-demo-side > div:last-child { display: none !important; }
          .pm-demo-nav { white-space: nowrap; width: auto !important; }
        }
      `}</style>

      {/* Barra superior: marca + salida al producto real */}
      <div style={{ borderBottom: `1px solid ${LINE}`, background: CARD }}>
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

      {/* En vista de pantalla completa el contenedor deja de estar acotado a 1180px:
          la gracia de abrirlo en su propia pestaña es que ocupe el monitor entero. */}
      <div style={{ maxWidth: soloPanel ? 'none' : '1180px', margin: '0 auto', padding: soloPanel ? '14px 16px 24px' : '28px 24px 72px' }}>

        {/* Encabezado + aviso de datos simulados. El aviso va arriba y no al pie: quien abre
            esto tiene que saber desde el primer segundo que no está viendo un cliente real. */}
        {!soloPanel && (
          <>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.34)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONT_BODY }}>
              Demo · datos simulados
            </div>
            <h1 style={{ fontFamily: FONT, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.06, margin: '0 0 10px', color: INK }}>
              Así se ve <span style={{ color: BLUE }}>tu operación</span> cuando está toda junta
            </h1>
            <p style={{ fontSize: '15px', color: DIM, lineHeight: 1.6, margin: '0 0 14px', maxWidth: '70ch' }}>
              El mismo embudo de seis etapas que corre en producción, más las cuatro líneas de integralidad que casi nunca se miden juntas. Filtrá por sede y por periodo para ver cómo se mueve.
            </p>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: '10px', padding: '10px 14px', marginBottom: '24px', maxWidth: '76ch' }}>
          <span style={{ fontSize: '13px', lineHeight: 1.5 }} aria-hidden="true">⚠️</span>
          <span style={{ fontSize: '12.5px', color: AMBER, lineHeight: 1.55 }}>
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

        {/* Marco de aplicación: barra lateral + contenido. La idea es que se lea como el
            producto abierto, no como una lámina de marketing con gráficos. */}
        <div className="pm-demo-app" style={{ display: 'grid', gridTemplateColumns: '212px 1fr', gap: '0', border: `1px solid ${LINE}`, borderRadius: '16px', overflow: 'hidden', background: SURFACE }}>

          {/* Navegación del workspace */}
          <aside className="pm-demo-side" style={{ background: SIDE, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ padding: '0 10px 14px', display: 'flex', alignItems: 'center', gap: '9px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M13.5 1.5 4.2 13.1a.8.8 0 0 0 .62 1.3h4.6l-1.02 7.3a.5.5 0 0 0 .9.36l9.3-11.6a.8.8 0 0 0-.62-1.3h-4.6l1.02-7.3a.5.5 0 0 0-.9-.36Z" />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: '13px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Panel demo</div>
                <div style={{ fontSize: '10.5px', color: '#7C8DB5' }}>Análisis 360°</div>
              </div>
            </div>

            <div style={{ padding: '0 10px 8px', fontSize: '10px', color: '#5C6D94', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Workspace</div>
            {SECCIONES.map(s => (
              <button
                key={s.id}
                onClick={() => setSeccion(s.id)}
                className="pm-demo-nav"
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
                  padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: seccion === s.id ? 'rgba(59,130,246,0.24)' : 'transparent',
                  color: seccion === s.id ? '#fff' : '#93A3C4',
                  fontSize: '12.5px', fontWeight: seccion === s.id ? 700 : 500,
                  fontFamily: FONT_BODY, textAlign: 'left',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: '13px', width: '16px', flexShrink: 0 }}>{s.icono}</span>
                {s.label}
              </button>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', fontSize: '11px', color: '#93A3C4', lineHeight: 1.5 }}>
                Cifras simuladas. Tus datos quedan solo en tu cuenta.
              </div>
            </div>
          </aside>

          {/* Contenido */}
          <div style={{ minWidth: 0, background: SURFACE }}>

            <BarraFiltros
              seccion={SECCIONES.find(s => s.id === seccion)?.label ?? ''}
              oportunidades={d.totales.oportunidades}
              sync={sync}
              filtros={filtros}
              setFiltro={setFiltro}
              onLimpiar={() => setFiltros(FILTROS_INICIALES)}
              onActualizar={() => setSync(horaCorta())}
              mostrarPantallaCompleta={!soloPanel}
            />

            <div style={{ padding: '18px' }}>

            {seccion === 'resumen' && (
              <>
                {/* Tasas contra meta */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  {kpis.map(k => <KpiTile key={k.clave} k={k} />)}
                </div>

                {/* Volumen absoluto */}
                {/* Cada card abre su total en las dos puertas de entrada. La suma de las
                    dos barras es siempre el número de arriba — no es una estimación. */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'Oportunidades', valor: d.totales.oportunidades, w: origen.walkin.oportunidades, dg: origen.digital.oportunidades, pie: 'entraron al embudo' },
                    { label: 'Show up',       valor: d.totales.showUp,        w: origen.walkin.showUp,        dg: origen.digital.showUp,        pie: 'llegaron a la vitrina' },
                    { label: 'Pedidos',       valor: d.totales.pedidos,       w: origen.walkin.pedidos,       dg: origen.digital.pedidos,       pie: 'con anticipo o reserva' },
                    { label: 'Matrículas',    valor: d.totales.matriculas,    w: origen.walkin.matriculas,    dg: origen.digital.matriculas,    pie: 'entregadas y registradas' },
                  ].map(k => <CardConOrigen key={k.label} {...k} />)}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <ComposicionOrigen origen={origen} total={d.totales.oportunidades} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Panel titulo="Gestión diaria" sub="Cómo se movió el periodo, día por día">
                    <GraficoDiario serie={serie} />
                  </Panel>
                </div>
              </>
            )}

            {seccion === 'asesores' && (
              <div style={{ marginBottom: '16px' }}>
                <Panel titulo="Productividad por asesor" sub="Alias, no personas — el demo no expone a nadie">
                  <TablaAsesores filas={asesores} />
                </Panel>
              </div>
            )}

            {seccion === 'funnel' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <ComposicionOrigen origen={origen} total={d.totales.oportunidades} />
                </div>
                <Panel titulo="Gestión diaria" sub="Cómo se movió el periodo, día por día">
                  <GraficoDiario serie={serie} />
                </Panel>
              </div>
            )}

            {(seccion === 'resumen' || seccion === 'funnel' || seccion === 'integralidad') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>

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
                  <div style={{ height: '9px', borderRadius: '5px', background: TRACK, overflow: 'hidden' }}>
                    <div className="pm-demo-barra" style={{ height: '100%', width: `${Math.min(100, (e.valor / maxEmbudo) * 100)}%`, borderRadius: '5px', background: `linear-gradient(90deg, ${BLUE}, ${BLUE_2})` }} />
                  </div>
                  {e.base && (
                    <div style={{ fontSize: '11px', color: MUTED, marginTop: '4px' }}>sobre {e.base}</div>
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
                  <div style={{ height: '9px', borderRadius: '5px', background: TRACK, overflow: 'hidden' }}>
                    <div className="pm-demo-barra" style={{ height: '100%', width: `${Math.min(100, l.penetracion * 100)}%`, borderRadius: '5px', background: l.color }} />
                  </div>
                  <div style={{ fontSize: '11px', color: MUTED, marginTop: '4px' }}>{formatearMillones(l.valor)} asociados</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
            )}

            {(seccion === 'resumen' || seccion === 'vitrinas') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

          {/* Sedes */}
          <Panel titulo="Rendimiento por sede" sub="Conversión de oportunidad a matrícula">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.9fr', gap: '8px', paddingBottom: '8px', borderBottom: `1px solid ${LINE}`, fontSize: '11px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                <span>Sede</span><span style={{ textAlign: 'right' }}>Oport.</span><span style={{ textAlign: 'right' }}>Matríc.</span><span style={{ textAlign: 'right' }}>Conv.</span>
              </div>
              {d.sedes.map(s => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.9fr', gap: '8px', padding: '11px 0', borderBottom: `1px solid ${ROW_LINE}`, fontSize: '13px', color: INK, alignItems: 'center' }}>
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
                  <div style={{ height: '9px', borderRadius: '5px', background: TRACK, overflow: 'hidden' }}>
                    <div className="pm-demo-barra" style={{ height: '100%', width: `${s.share * 100}%`, borderRadius: '5px', background: `linear-gradient(90deg, ${BLUE}, ${BLUE_2})` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
            )}

            </div>{/* fin del padding de contenido */}
          </div>{/* fin de la columna de contenido */}
        </div>{/* fin del marco de aplicación */}

        {/* Cierre */}
        <div style={{ display: soloPanel ? 'none' : 'flex', marginTop: '28px', background: CARD, border: `1px solid ${LINE}`, borderRadius: '16px', padding: '26px', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
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

// Secciones del workspace. Nombres genéricos del negocio automotor — nada que remita a
// un cliente, a una marca ni al nombre interno de un módulo de otro producto.
const accionBarra: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '5px 11px', borderRadius: '8px',
  border: `1px solid ${LINE}`, background: CARD_2, color: DIM,
  fontSize: '11.5px', fontWeight: 700, fontFamily: FONT_BODY, cursor: 'pointer',
}

type SeccionId = 'resumen' | 'funnel' | 'asesores' | 'integralidad' | 'vitrinas'

const SECCIONES: { id: SeccionId; label: string; icono: string }[] = [
  { id: 'resumen',      label: 'Resumen',           icono: '▦' },
  { id: 'funnel',       label: 'Funnel CRM',        icono: '⧗' },
  { id: 'asesores',     label: 'Asesores',          icono: '◉' },
  { id: 'integralidad', label: 'Integralidad 360°', icono: '◈' },
  { id: 'vitrinas',     label: 'Vitrinas',          icono: '⌂' },
]

function horaCorta(): string {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

// Encabezado del panel: identidad de la vista, estado de los datos y todos los filtros.
// Cada control filtra de verdad — un select decorativo en un demo es peor que no ponerlo,
// porque el prospecto lo prueba y descubre que la pantalla es un dibujo.
function BarraFiltros({
  seccion, oportunidades, sync, filtros, setFiltro, onLimpiar, onActualizar, mostrarPantallaCompleta,
}: {
  seccion: string
  oportunidades: number
  sync: string
  filtros: FiltrosDemo
  setFiltro: <K extends keyof FiltrosDemo>(k: K, v: FiltrosDemo[K]) => void
  onLimpiar: () => void
  onActualizar: () => void
  mostrarPantallaCompleta: boolean
}) {
  const hayFiltros =
    filtros.sede !== 'todas' || filtros.periodo !== '12m' ||
    filtros.asesor !== 'todos' || filtros.origen !== 'todos' || filtros.categoria !== 'todas'

  return (
    <div style={{ background: CARD, borderBottom: `1px solid ${LINE}` }}>

      {/* Identidad + estado de los datos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 4h18l-7 8.5V20l-4-2.5v-5L3 4Z" />
            </svg>
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: '16px', fontWeight: 800, color: INK, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.15 }}>
              {seccion}
            </div>
            {/* Sin nombre de concesionario ni marca: esta pantalla es publica. */}
            <div style={{ fontSize: '12px', color: DIM }}>
              Embudo de conversión · Panel de demostración
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 13px', borderRadius: '999px', background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.32)' }}>
            <span style={{ width: '7px', height: '7px', background: BLUE, flexShrink: 0 }} />
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: BLUE, letterSpacing: '0.3px' }}>
              {formatearNumero(oportunidades)} OPORTUNIDADES
            </span>
            {/* suppressHydrationWarning no hace falta: arranca vacio y se llena en efecto. */}
            {sync && <span style={{ fontSize: '11px', color: DIM }}>· sync {sync}</span>}
          </div>

          {mostrarPantallaCompleta && (
            <a
              href="/pulse/demo?vista=panel"
              target="_blank"
              rel="noopener noreferrer"
              className="pm-demo-accion"
              title="Abrir el panel a pantalla completa, en una pestaña nueva"
              style={{ ...accionBarra, textDecoration: 'none' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
              </svg>
              Pantalla completa
            </a>
          )}
        </div>
      </div>

      {/* Fila de filtros, con separadores verticales como en un tablero real */}
      <div className="pm-demo-filtros" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', borderTop: `1px solid ${LINE}` }}>
        <CampoFiltro titulo="Vitrina">
          <SelectFiltro
            valor={filtros.sede}
            onChange={v => setFiltro('sede', v as SedeId)}
            opciones={SEDES_OPCIONES.map(s => ({ id: s.id, label: s.label }))}
          />
        </CampoFiltro>

        <CampoFiltro titulo="Asesor">
          <SelectFiltro
            valor={filtros.asesor}
            onChange={v => setFiltro('asesor', v)}
            opciones={ASESORES_OPCIONES.map(a => ({ id: a.id, label: a.sede ? `${a.label} · ${a.sede}` : a.label }))}
          />
        </CampoFiltro>

        <CampoFiltro titulo="Periodo">
          <SelectFiltro
            valor={filtros.periodo}
            onChange={v => setFiltro('periodo', v as PeriodoId)}
            opciones={PERIODOS.map(p => ({ id: p.id, label: p.label }))}
          />
        </CampoFiltro>

        <CampoFiltro titulo="Origen">
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {ORIGEN_OPCIONES.map(o => {
              const activo = filtros.origen === o.id
              return (
                <button
                  key={o.id}
                  onClick={() => setFiltro('origen', o.id as OrigenId)}
                  className="pm-demo-chip"
                  style={{
                    padding: '5px 10px', borderRadius: '7px', cursor: 'pointer',
                    border: `1px solid ${activo ? BLUE : LINE}`,
                    background: activo ? 'rgba(59,130,246,0.16)' : 'transparent',
                    color: activo ? BLUE : DIM,
                    fontSize: '12px', fontWeight: activo ? 700 : 500, fontFamily: FONT_BODY,
                  }}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </CampoFiltro>

        <CampoFiltro titulo="Categoría">
          <SelectFiltro
            valor={filtros.categoria}
            onChange={v => setFiltro('categoria', v)}
            opciones={CATEGORIAS_OPCIONES}
          />
        </CampoFiltro>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '10px 18px', borderTop: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.02)' }}>
        <button
          onClick={onLimpiar}
          disabled={!hayFiltros}
          style={{
            border: 'none', background: 'transparent', cursor: hayFiltros ? 'pointer' : 'default',
            color: hayFiltros ? DIM : '#3D4A63', fontSize: '11.5px', fontWeight: 700,
            letterSpacing: '0.4px', textTransform: 'uppercase', fontFamily: FONT_BODY,
            padding: '6px 4px',
          }}
        >
          Limpiar filtros
        </button>
        {/* Va con pm-demo-cta y no con pm-demo-accion: el hover de accion pinta el texto de
            azul, y sobre un botón azul el texto desaparecería. */}
        <button
          onClick={onActualizar}
          className="pm-demo-cta"
          title="Vuelve a leer los datos y actualiza la hora de sincronización"
          style={{ ...accionBarra, background: `linear-gradient(135deg, ${BLUE}, ${BLUE_2})`, color: '#fff', border: `1px solid ${BLUE}` }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
          </svg>
          Actualizar datos
        </button>
      </div>
    </div>
  )
}

function CampoFiltro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '11px 16px', borderRight: `1px solid ${LINE}`, minWidth: 0 }}>
      <div style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700, marginBottom: '6px' }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

// Desplegable propio en vez de <select> nativo. El nativo delega la lista al sistema
// operativo: mismo azul de selección, misma tipografía y mismo alto en cualquier tablero,
// así que dos productos distintos terminan viéndose iguales al abrirlo. Acá la lista es
// nuestra y usa los tokens de Pulse.
function SelectFiltro({ valor, onChange, opciones }: {
  valor: string
  onChange: (v: string) => void
  opciones: { id: string; label: string }[]
}) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement | null>(null)
  const actual = opciones.find(o => o.id === valor)

  // Cerrar al hacer clic afuera o con Escape. Sin esto el panel queda colgado cuando el
  // usuario se va a otro filtro, y se superponen dos listas.
  useEffect(() => {
    if (!abierto) return
    const afuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', afuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', afuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  return (
    <div ref={caja} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          width: '100%', padding: 0, border: 'none', background: 'transparent',
          fontSize: '14px', fontWeight: 600, color: INK, fontFamily: FONT_BODY,
          cursor: 'pointer', textAlign: 'left', minWidth: 0,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actual?.label ?? '—'}
        </span>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DIM}
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: '-6px', minWidth: 'calc(100% + 12px)',
            background: CARD_2, border: `1px solid ${LINE}`, borderRadius: '10px',
            boxShadow: '0 16px 34px rgba(0,0,0,0.55)', padding: '5px',
            zIndex: 50, maxHeight: '260px', overflowY: 'auto', whiteSpace: 'nowrap',
          }}
        >
          {opciones.map(o => {
            const activo = o.id === valor
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={activo}
                onClick={() => { onChange(o.id); setAbierto(false) }}
                className="pm-demo-opcion"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '8px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background: activo ? 'rgba(59,130,246,0.18)' : 'transparent',
                  color: activo ? BLUE : INK,
                  fontSize: '13px', fontWeight: activo ? 700 : 500,
                  fontFamily: FONT_BODY, textAlign: 'left',
                }}
              >
                <span style={{
                  width: '5px', height: '5px', flexShrink: 0,
                  background: activo ? BLUE : 'transparent',
                }} />
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Teal más claro que el original (#0D9488): sobre fondo oscuro ese verde se apaga y deja
// de leerse como etiqueta de texto.
const COLOR_WALKIN = '#2DD4BF'
const COLOR_DIGITAL = BLUE
const COLOR_CITAS = '#A78BFA'

// Card de volumen que además abre el total en sus dos puertas de entrada. La barra es una
// sola, partida: se ve de un vistazo qué proporción del número vino de cada lado.
function CardConOrigen({ label, valor, w, dg, pie }: { label: string; valor: number; w: number; dg: number; pie: string }) {
  const total = valor || 1
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: DIM, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, marginBottom: '6px' }}>{label}</div>
      <div style={{ fontFamily: FONT, fontSize: '26px', fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1 }}>{formatearNumero(valor)}</div>
      <div style={{ fontSize: '11.5px', color: DIM, margin: '5px 0 9px' }}>{pie}</div>

      <div style={{ display: 'flex', height: '7px', borderRadius: '4px', overflow: 'hidden', background: TRACK }}>
        <div className="pm-demo-barra" style={{ width: `${(w / total) * 100}%`, background: COLOR_WALKIN }} />
        <div className="pm-demo-barra" style={{ width: `${(dg / total) * 100}%`, background: COLOR_DIGITAL }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
        <span style={{ color: COLOR_WALKIN, fontWeight: 700 }}>{formatearNumero(w)} walk-in</span>
        <span style={{ color: COLOR_DIGITAL, fontWeight: 700 }}>{formatearNumero(dg)} digital</span>
      </div>
    </div>
  )
}

// Componente pedido explícitamente: deja escrito de dónde sale el total. No es un gráfico
// más — su trabajo es que nadie tenga que adivinar qué cuenta como oportunidad.
function ComposicionOrigen({ origen, total }: { origen: OrigenDemo; total: number }) {
  const grupos: CanalDigital['grupo'][] = ['redes', 'buscadores', 'sitio']

  return (
    <Panel titulo="De dónde salen las oportunidades" sub="Toda oportunidad entra por una de dos puertas. No hay una tercera.">

      {/* La ecuación, escrita */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '13px 15px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, marginBottom: '18px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '7px' }}>
          <span style={{ fontFamily: FONT, fontSize: '19px', fontWeight: 800, color: COLOR_WALKIN }}>{formatearNumero(origen.walkin.oportunidades)}</span>
          <span style={{ fontSize: '12px', color: DIM, fontWeight: 600 }}>walk-in</span>
        </span>
        <span style={{ fontSize: '15px', color: MUTED, fontWeight: 700 }}>+</span>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '7px' }}>
          <span style={{ fontFamily: FONT, fontSize: '19px', fontWeight: 800, color: COLOR_DIGITAL }}>{formatearNumero(origen.digital.oportunidades)}</span>
          <span style={{ fontSize: '12px', color: DIM, fontWeight: 600 }}>digital</span>
        </span>
        <span style={{ fontSize: '15px', color: MUTED, fontWeight: 700 }}>=</span>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '7px' }}>
          <span style={{ fontFamily: FONT, fontSize: '19px', fontWeight: 800, color: INK }}>{formatearNumero(total)}</span>
          <span style={{ fontSize: '12px', color: DIM, fontWeight: 600 }}>oportunidades</span>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>

        {/* Walk-in */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: COLOR_WALKIN, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: INK }}>Walk-in</span>
            <span style={{ marginLeft: 'auto', fontFamily: FONT, fontSize: '14px', fontWeight: 800, color: INK }}>{formatearPct(origen.walkin.share)}</span>
          </div>
          <div style={{ height: '8px', borderRadius: '4px', background: TRACK, overflow: 'hidden', marginBottom: '9px' }}>
            <div className="pm-demo-barra" style={{ height: '100%', width: `${origen.walkin.share * 100}%`, background: COLOR_WALKIN, borderRadius: '4px' }} />
          </div>
          <p style={{ fontSize: '12.5px', color: DIM, lineHeight: 1.55, margin: 0 }}>
            La persona entró físicamente a la vitrina. No hubo pauta de por medio: es tráfico
            de calle, referido o quien vuelve por su cuenta.
          </p>
        </div>

        {/* Digital, abierto por canal */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: COLOR_DIGITAL, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: INK }}>Digital</span>
            <span style={{ marginLeft: 'auto', fontFamily: FONT, fontSize: '14px', fontWeight: 800, color: INK }}>{formatearPct(origen.digital.share)}</span>
          </div>
          <div style={{ height: '8px', borderRadius: '4px', background: TRACK, overflow: 'hidden', marginBottom: '12px' }}>
            <div className="pm-demo-barra" style={{ height: '100%', width: `${origen.digital.share * 100}%`, background: COLOR_DIGITAL, borderRadius: '4px' }} />
          </div>

          {grupos.map(g => {
            const canales = origen.canales.filter(c => c.grupo === g)
            if (canales.length === 0) return null
            return (
              <div key={g} style={{ marginBottom: '11px' }}>
                <div style={{ fontSize: '10.5px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: '6px' }}>
                  {GRUPO_CANAL_LABEL[g]}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {canales.map(c => (
                    <span key={c.clave} style={{ display: 'inline-flex', alignItems: 'baseline', gap: '6px', padding: '4px 9px', borderRadius: '7px', border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.04)', fontSize: '11.5px', color: INK }}>
                      {c.label}
                      <span style={{ fontFamily: FONT, fontWeight: 800, color: COLOR_DIGITAL }}>{formatearNumero(c.valor)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p style={{ fontSize: '11.5px', color: MUTED, lineHeight: 1.55, marginTop: '12px', marginBottom: 0 }}>
        El walk-in pesa más a medida que se baja en el embudo: quien ya está parado frente al
        auto llega a la prueba y firma más que quien dejó un dato en un aviso. Por eso su
        participación en matrículas es mayor que en oportunidades.
      </p>
    </Panel>
  )
}

// Tile de tasa contra meta. El color no decora: azul cuando llega a la meta, rojo cuando
// no. Es la única lectura que un director necesita hacer de un vistazo.
function KpiTile({ k }: { k: KpiDemo }) {
  const cumple = k.cumplimiento >= 1
  const color = cumple ? BLUE : RED
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: '12px', padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '7px' }}>
        <span style={{ fontSize: '10.5px', color: DIM, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>{k.label}</span>
        <span style={{ fontSize: '10px', fontWeight: 800, color, background: cumple ? 'rgba(59,130,246,0.16)' : 'rgba(248,113,113,0.16)', padding: '2px 6px', borderRadius: '5px', whiteSpace: 'nowrap' }}>
          {Math.round(k.cumplimiento * 100)}%
        </span>
      </div>
      <div style={{ fontFamily: FONT, fontSize: '26px', fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {formatearPct(k.valor)}
      </div>
      <div style={{ height: '5px', borderRadius: '3px', background: TRACK, overflow: 'hidden', margin: '9px 0 6px' }}>
        <div className="pm-demo-barra" style={{ height: '100%', width: `${Math.min(100, k.cumplimiento * 100)}%`, borderRadius: '3px', background: color }} />
      </div>
      <div style={{ fontSize: '10.5px', color: DIM }}>Meta {formatearPct(k.meta)} · {k.pie}</div>
    </div>
  )
}

// Gestión diaria. SVG a mano en vez de una librería de charts: el proyecto no tiene ninguna
// instalada y esto son dos líneas y una serie de barras, no un sistema de visualización.
function GraficoDiario({ serie }: { serie: PuntoDia[] }) {
  const W = 620, H = 170, PB = 22, PT = 10
  const maxY = Math.max(...serie.map(p => p.oportunidades), 1)
  const x = (i: number) => (i / Math.max(serie.length - 1, 1)) * W
  const y = (v: number) => PT + (1 - v / maxY) * (H - PT - PB)

  const linea = (clave: keyof Omit<PuntoDia, 'dia'>) =>
    serie.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p[clave]).toFixed(1)}`).join(' ')

  const anchoBarra = Math.max(2, W / serie.length - 3)

  return (
    <div>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {[
          { label: 'Oportunidades', color: BLUE },
          { label: 'Citas', color: COLOR_CITAS },
          { label: 'Matrículas', color: COLOR_WALKIN },
        ].map(l => (
          <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: DIM }}>
            <span style={{ width: '9px', height: '3px', borderRadius: '2px', background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="170" role="img" aria-label="Movimiento diario de oportunidades, citas y matrículas">
        {[0.25, 0.5, 0.75, 1].map(g => (
          <line key={g} x1="0" x2={W} y1={y(maxY * g)} y2={y(maxY * g)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}
        {serie.map((p, i) => (
          <rect
            key={p.dia}
            x={x(i) - anchoBarra / 2} width={anchoBarra}
            y={y(p.matriculas)} height={Math.max(0, H - PB - y(p.matriculas))}
            fill={COLOR_WALKIN} opacity="0.45" rx="1"
          />
        ))}
        <path d={linea('citas')} fill="none" stroke={COLOR_CITAS} strokeWidth="2" strokeLinejoin="round" />
        <path d={linea('oportunidades')} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="0" x2={W} y1={H - PB} y2={H - PB} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {serie.filter((_, i) => i % 6 === 0).map((p, k) => (
          <text key={p.dia} x={x(k * 6)} y={H - 6} fontSize="10" fill={MUTED} textAnchor="middle">{p.dia}</text>
        ))}
      </svg>
    </div>
  )
}

function TablaAsesores({ filas }: { filas: AsesorDemo[] }) {
  const maxConv = Math.max(...filas.map(f => f.conversion), 0.0001)
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '460px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr 1fr', gap: '8px', paddingBottom: '8px', borderBottom: `1px solid ${LINE}`, fontSize: '10.5px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
          <span>Asesor</span>
          <span>Vitrina</span>
          <span style={{ textAlign: 'right' }}>Oport.</span>
          <span style={{ textAlign: 'right' }}>Matríc.</span>
          <span style={{ textAlign: 'right' }}>Conversión</span>
        </div>
        {filas.map(f => (
          <div key={f.alias} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr 1fr', gap: '8px', padding: '10px 0', borderBottom: `1px solid ${ROW_LINE}`, fontSize: '12.5px', color: INK, alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{f.alias}</span>
            <span style={{ color: DIM }}>{f.sede}</span>
            <span style={{ textAlign: 'right', color: DIM }}>{formatearNumero(f.oportunidades)}</span>
            <span style={{ textAlign: 'right', color: DIM }}>{formatearNumero(f.matriculas)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <span style={{ flex: 1, maxWidth: '60px', height: '5px', borderRadius: '3px', background: TRACK, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${(f.conversion / maxConv) * 100}%`, background: BLUE, borderRadius: '3px' }} />
              </span>
              <span style={{ fontWeight: 800, color: BLUE, minWidth: '34px', textAlign: 'right' }}>{formatearPct(f.conversion)}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: MUTED, marginTop: '10px', lineHeight: 1.5 }}>
        Los alias no corresponden a ninguna persona real. En tu cuenta verías tus asesores, con sus nombres y su histórico.
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
    border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.04)', color: INK,
    fontSize: '13.5px', fontFamily: FONT_BODY, outline: 'none',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: '11.5px', fontWeight: 600, color: DIM,
    marginBottom: '5px', fontFamily: FONT_BODY,
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', justifyContent: 'center', paddingTop: '30px' }}>
      {/* Velo sobre el panel difuminado: azul muy tenue sobre negro, para que el contenido
          de atrás se lea como apagado y el formulario quede al frente. No intercepta
          clicks — el panel de atrás ya está inerte. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(37,99,235,0.14) 0%, rgba(8,11,20,0.55) 100%)',
        }}
      />
      <form
        onSubmit={enviar}
        className="pm-demo-gate"
        style={{
          position: 'sticky', top: '30px', alignSelf: 'flex-start', zIndex: 1,
          width: '100%', maxWidth: '440px', height: 'fit-content',
          background: CARD, border: `1px solid ${LINE}`, borderRadius: '18px',
          padding: '26px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
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
          <div style={{ marginTop: '14px', fontSize: '12.5px', color: RED, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.30)', borderRadius: '9px', padding: '9px 12px', lineHeight: 1.5 }}>
            {error}{' '}
            <a href={whatsappFallback} target="_blank" rel="noopener noreferrer" style={{ color: RED, fontWeight: 700 }}>
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

        <div style={{ marginTop: '11px', fontSize: '11.5px', color: MUTED, textAlign: 'center', lineHeight: 1.5 }}>
          Usamos tus datos solo para contactarte. No vas a ver información de ningún otro concesionario.
        </div>
      </form>
    </div>
  )
}

function Panel({ titulo, sub, children }: { titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: '16px', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: INK }}>{titulo}</div>
        <div style={{ fontSize: '12.5px', color: DIM, marginTop: '3px' }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}
