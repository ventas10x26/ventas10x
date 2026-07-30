'use client'

// Ruta destino: src/app/pulse/demo/page.tsx
//
// Demo público del panel de concesionario. No pide login a propósito: sirve para mandarle
// el link en frío a un prospecto que todavía no tiene cuenta.
//
// Todos los datos salen de ./datos.ts y son sintéticos — ver la regla dura documentada ahí.
// No agregar acá ninguna cifra, nombre de sede/asesor/marca/modelo que venga de un cliente
// real, ni siquiera "de ejemplo": esta pantalla es pública.

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  PERIODOS, SEDES_OPCIONES, calcularDemo,
  calcularKpis, calcularAsesores, serieDiaria, calcularOrigen,
  formatearNumero, formatearPct, formatearMillones,
  type PeriodoId, type SedeId, type KpiDemo, type AsesorDemo, type PuntoDia,
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

  // Vista "solo panel": la que se abre en pestaña nueva. Deja el panel sin el encabezado
  // de marketing, para poder proyectarlo en una reunión sin el titular de venta arriba.
  // Se lee de window y no con useSearchParams para no tener que envolver la página en un
  // Suspense solo por esto.
  const [soloPanel, setSoloPanel] = useState(false)
  const marcoRef = useRef<HTMLDivElement | null>(null)
  const [enPantallaCompleta, setEnPantallaCompleta] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_DESBLOQUEO) === '1') setDesbloqueado(true)
    } catch { /* modo incógnito o storage bloqueado: se pide el registro igual */ }
    try {
      setSoloPanel(new URLSearchParams(window.location.search).get('vista') === 'panel')
    } catch { /* si no se puede leer la query, se muestra la página completa */ }
  }, [])

  // El estado de pantalla completa lo manda el navegador, no el botón: se puede salir con
  // Escape sin pasar por nuestro handler, y si no escuchamos el evento el rótulo miente.
  useEffect(() => {
    const alCambiar = () => setEnPantallaCompleta(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', alCambiar)
    return () => document.removeEventListener('fullscreenchange', alCambiar)
  }, [])

  const alternarPantallaCompleta = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (marcoRef.current) await marcoRef.current.requestFullscreen()
    } catch { /* el navegador puede negarlo (permiso o iframe): no rompemos la página */ }
  }

  const [seccion, setSeccion] = useState<SeccionId>('resumen')

  const d = useMemo(() => calcularDemo(sede, periodo), [sede, periodo])
  const kpis = useMemo(() => calcularKpis(d), [d])
  const asesores = useMemo(() => calcularAsesores(sede, periodo), [sede, periodo])
  const serie = useMemo(() => serieDiaria(d, sede), [d, sede])
  const origen = useMemo(() => calcularOrigen(d), [d])
  const maxEmbudo = d.embudo[0].valor || 1

  return (
    <div style={{ background: '#f8f9fb', minHeight: '100vh', fontFamily: FONT_BODY }}>
      <style>{`
        .pm-demo-chip { transition: border-color .15s ease, color .15s ease, background .15s ease; }
        .pm-demo-barra { transition: width .35s cubic-bezier(.2,.7,.3,1); }
        .pm-demo-cta { transition: transform .15s ease, box-shadow .15s ease; }
        .pm-demo-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(37,99,235,0.32); }
        .pm-demo-nav { transition: background .15s ease, color .15s ease; }
        .pm-demo-nav:hover { background: rgba(255,255,255,0.06) !important; color: #fff !important; }
        .pm-demo-accion { transition: border-color .15s ease, color .15s ease; }
        .pm-demo-accion:hover { border-color: #2563EB !important; color: #2563EB !important; }
        /* En pantalla completa el marco ocupa todo: sin el scroll propio, las secciones
           largas quedarían cortadas contra el borde de la pantalla. */
        .pm-demo-app:fullscreen { border: none; border-radius: 0; height: 100%; overflow: auto; }
        .pm-demo-app:fullscreen .pm-demo-side { height: 100%; }
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
        {!soloPanel && (
          <>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONT_BODY }}>
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

        {/* Marco de aplicación: barra lateral + contenido. La idea es que se lea como el
            producto abierto, no como una lámina de marketing con gráficos. */}
        <div ref={marcoRef} className="pm-demo-app" style={{ display: 'grid', gridTemplateColumns: '212px 1fr', gap: '0', border: `1px solid ${LINE}`, borderRadius: enPantallaCompleta ? '0' : '16px', overflow: 'hidden', background: '#fff' }}>

          {/* Navegación del workspace */}
          <aside className="pm-demo-side" style={{ background: '#0f1729', padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ padding: '0 10px 14px', display: 'flex', alignItems: 'center', gap: '9px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M13.5 1.5 4.2 13.1a.8.8 0 0 0 .62 1.3h4.6l-1.02 7.3a.5.5 0 0 0 .9.36l9.3-11.6a.8.8 0 0 0-.62-1.3h-4.6l1.02-7.3a.5.5 0 0 0-.9-.36Z" />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: '13px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Panel demo</div>
                <div style={{ fontSize: '10.5px', color: '#7c8db5' }}>Análisis 360°</div>
              </div>
            </div>

            <div style={{ padding: '0 10px 8px', fontSize: '10px', color: '#5c6d94', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Workspace</div>
            {SECCIONES.map(s => (
              <button
                key={s.id}
                onClick={() => setSeccion(s.id)}
                className="pm-demo-nav"
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
                  padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: seccion === s.id ? 'rgba(37,99,235,0.22)' : 'transparent',
                  color: seccion === s.id ? '#fff' : '#93a3c4',
                  fontSize: '12.5px', fontWeight: seccion === s.id ? 700 : 500,
                  fontFamily: FONT_BODY, textAlign: 'left',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: '13px', width: '16px', flexShrink: 0 }}>{s.icono}</span>
                {s.label}
              </button>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', fontSize: '11px', color: '#93a3c4', lineHeight: 1.5 }}>
                Cifras simuladas. Tus datos quedan solo en tu cuenta.
              </div>
            </div>
          </aside>

          {/* Contenido */}
          <div style={{ minWidth: 0, background: '#f8f9fb' }}>

            {/* Barra de estado + filtros */}
            <div style={{ background: '#fff', borderBottom: `1px solid ${LINE}`, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div style={{ fontFamily: FONT, fontSize: '17px', fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>
                  {SECCIONES.find(s => s.id === seccion)?.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '999px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: BLUE, flexShrink: 0 }} />
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: BLUE }}>
                      {formatearNumero(d.totales.oportunidades)} oportunidades
                    </span>
                  </div>

                  <button
                    onClick={alternarPantallaCompleta}
                    className="pm-demo-accion"
                    title={enPantallaCompleta ? 'Salir de pantalla completa' : 'Ver el panel en pantalla completa'}
                    style={accionBarra}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {enPantallaCompleta
                        ? <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
                        : <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />}
                    </svg>
                    {enPantallaCompleta ? 'Salir' : 'Pantalla completa'}
                  </button>

                  {/* Abre el panel sin el encabezado de venta, para proyectarlo o compartirlo. */}
                  <a
                    href="/pulse/demo?vista=panel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pm-demo-accion"
                    title="Abrir el panel solo, en una pestaña nueva"
                    style={{ ...accionBarra, textDecoration: 'none' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 3h6v6M10 14 21 3M18 13v8H3V6h8" />
                    </svg>
                    Abrir en pestaña
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <Filtro titulo="Vitrina" opciones={SEDES_OPCIONES.map(s => ({ id: s.id, label: s.label }))} activo={sede} onPick={id => setSede(id as SedeId)} />
                <Filtro titulo="Periodo" opciones={PERIODOS.map(p => ({ id: p.id, label: p.label }))} activo={periodo} onPick={id => setPeriodo(id as PeriodoId)} />
              </div>
            </div>

            <div style={{ padding: '18px' }}>

            {seccion === 'resumen' && (
              <>
                {/* Tasas contra meta */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  {kpis.map(k => <KpiTile key={k.clave} k={k} />)}
                </div>

                {/* Volumen absoluto */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'Oportunidades', valor: d.totales.oportunidades, pie: 'entraron al embudo' },
                    { label: 'Show up', valor: d.totales.showUp, pie: 'llegaron a la vitrina' },
                    { label: 'Pedidos', valor: d.totales.pedidos, pie: 'con anticipo o reserva' },
                    { label: 'Matrículas', valor: d.totales.matriculas, pie: 'entregadas y registradas' },
                  ].map(k => (
                    <div key={k.label} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '11px', color: DIM, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, marginBottom: '6px' }}>{k.label}</div>
                      <div style={{ fontFamily: FONT, fontSize: '26px', fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1 }}>{formatearNumero(k.valor)}</div>
                      <div style={{ fontSize: '11.5px', color: DIM, marginTop: '5px' }}>{k.pie}</div>
                    </div>
                  ))}
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
                <Panel titulo="Origen de la oportunidad" sub="De dónde llega el lead antes de entrar al embudo">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {origen.map(o => (
                      <div key={o.label}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '13px', color: INK, fontWeight: 600 }}>{o.label}</span>
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: DIM }}>{formatearNumero(o.valor)}</span>
                            <span style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: INK }}>{formatearPct(o.share)}</span>
                          </span>
                        </div>
                        <div style={{ height: '9px', borderRadius: '5px', background: '#eef2f7', overflow: 'hidden' }}>
                          <div className="pm-demo-barra" style={{ height: '100%', width: `${o.share * 100}%`, borderRadius: '5px', background: `linear-gradient(90deg, ${BLUE}, ${BLUE_2})` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
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
            )}

            {(seccion === 'resumen' || seccion === 'vitrinas') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

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
            )}

            </div>{/* fin del padding de contenido */}
          </div>{/* fin de la columna de contenido */}
        </div>{/* fin del marco de aplicación */}

        {/* Cierre */}
        <div style={{ display: soloPanel ? 'none' : 'flex', marginTop: '28px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: '16px', padding: '26px', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
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
  border: `1px solid ${LINE}`, background: '#fff', color: DIM,
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

// Tile de tasa contra meta. El color no decora: azul cuando llega a la meta, rojo cuando
// no. Es la única lectura que un director necesita hacer de un vistazo.
function KpiTile({ k }: { k: KpiDemo }) {
  const cumple = k.cumplimiento >= 1
  const color = cumple ? BLUE : '#e5484d'
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: '12px', padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '7px' }}>
        <span style={{ fontSize: '10.5px', color: DIM, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>{k.label}</span>
        <span style={{ fontSize: '10px', fontWeight: 800, color, background: cumple ? 'rgba(37,99,235,0.10)' : 'rgba(229,72,77,0.10)', padding: '2px 6px', borderRadius: '5px', whiteSpace: 'nowrap' }}>
          {Math.round(k.cumplimiento * 100)}%
        </span>
      </div>
      <div style={{ fontFamily: FONT, fontSize: '26px', fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {formatearPct(k.valor)}
      </div>
      <div style={{ height: '5px', borderRadius: '3px', background: '#eef2f7', overflow: 'hidden', margin: '9px 0 6px' }}>
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
          { label: 'Citas', color: '#7C3AED' },
          { label: 'Matrículas', color: '#0D9488' },
        ].map(l => (
          <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: DIM }}>
            <span style={{ width: '9px', height: '3px', borderRadius: '2px', background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="170" role="img" aria-label="Movimiento diario de oportunidades, citas y matrículas">
        {[0.25, 0.5, 0.75, 1].map(g => (
          <line key={g} x1="0" x2={W} y1={y(maxY * g)} y2={y(maxY * g)} stroke="#eef2f7" strokeWidth="1" />
        ))}
        {serie.map((p, i) => (
          <rect
            key={p.dia}
            x={x(i) - anchoBarra / 2} width={anchoBarra}
            y={y(p.matriculas)} height={Math.max(0, H - PB - y(p.matriculas))}
            fill="#0D9488" opacity="0.5" rx="1"
          />
        ))}
        <path d={linea('citas')} fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinejoin="round" />
        <path d={linea('oportunidades')} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="0" x2={W} y1={H - PB} y2={H - PB} stroke={LINE} strokeWidth="1" />
        {serie.filter((_, i) => i % 6 === 0).map((p, k) => (
          <text key={p.dia} x={x(k * 6)} y={H - 6} fontSize="10" fill="#94a3b8" textAnchor="middle">{p.dia}</text>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr 1fr', gap: '8px', paddingBottom: '8px', borderBottom: `1px solid ${LINE}`, fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
          <span>Asesor</span>
          <span>Vitrina</span>
          <span style={{ textAlign: 'right' }}>Oport.</span>
          <span style={{ textAlign: 'right' }}>Matríc.</span>
          <span style={{ textAlign: 'right' }}>Conversión</span>
        </div>
        {filas.map(f => (
          <div key={f.alias} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr 1fr', gap: '8px', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px', color: INK, alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{f.alias}</span>
            <span style={{ color: DIM }}>{f.sede}</span>
            <span style={{ textAlign: 'right', color: DIM }}>{formatearNumero(f.oportunidades)}</span>
            <span style={{ textAlign: 'right', color: DIM }}>{formatearNumero(f.matriculas)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <span style={{ flex: 1, maxWidth: '60px', height: '5px', borderRadius: '3px', background: '#eef2f7', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${(f.conversion / maxConv) * 100}%`, background: BLUE, borderRadius: '3px' }} />
              </span>
              <span style={{ fontWeight: 800, color: BLUE, minWidth: '34px', textAlign: 'right' }}>{formatearPct(f.conversion)}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', lineHeight: 1.5 }}>
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
    border: `1px solid ${LINE}`, background: '#fff', color: INK,
    fontSize: '13.5px', fontFamily: FONT_BODY, outline: 'none',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569',
    marginBottom: '5px', fontFamily: FONT_BODY,
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', justifyContent: 'center', paddingTop: '30px' }}>
      {/* Velo sobre el panel difuminado: azul muy tenue con algo de oscuridad, para
          que el contenido de atrás se lea como apagado y el formulario quede al
          frente. No intercepta clicks — el panel de atrás ya está inerte. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(37,99,235,0.13) 0%, rgba(37,99,235,0.09) 100%), rgba(10,14,26,0.22)',
        }}
      />
      <form
        onSubmit={enviar}
        style={{
          position: 'sticky', top: '30px', alignSelf: 'flex-start', zIndex: 1,
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
