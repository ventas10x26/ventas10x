'use client'

import { useState, useEffect, useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import {
  F_DISPLAY, F_MONO, F_BODY, SEGMENTS,
  PulseStyles, PulseHeader, PulseFooter,
  useUsuarioLogueado, useSectionScrollSpy, usePulseTheme,
  SegIcon, SchemaPreview, WhatsAppMiniPreview,
} from './_shared/sections'
import { PulsePrototipos } from '@/components/pulse/PulsePrototipos'

// La landing pública ahora termina en "Segmentos" (screen 1): cada card lleva a su
// propia landing dedicada (/pulse/concesionario, /pulse/asesor) con el contenido
// profundo clasificado por segmento — ver "ajusta toda la arquitectura" en el pedido
// del usuario. El resto de las secciones (Por qué, Ecosistema, Actividad en vivo,
// Integraciones, Testimonios, Cumplimiento, Precios) vive en esas dos landings.
const NAV_ITEMS = [
  { label:'Plataforma', href:'#plataforma' },
  { label:'Segmentos', href:'#segmentos' },
  { label:'Prototipos', href:'#prototipos' },
  { label:'Para concesionarios', href:'/pulse/concesionario' },
  { label:'Para asesores', href:'/pulse/asesor' },
]

// ─── Espejo de mercado (sección entre Hero y Segmentos) — 3 estudios de madurez de IA
// independientes, uno por país prioritario del roadmap de expansión LatAm (ver hoja de
// ruta: México/Chile como beachhead, Colombia como base). Se muestran los 3 juntos, no uno
// solo, para que el punto sea válido sin importar desde qué país llegue el visitante —
// evita el geo-mismatch de citar un único país en una landing global. Cada dato con su
// fuente real; nunca fabricar un número acá. Ver arquetipo-marca-pulsemotor.md.
const MARKET_STATS = [
  { pais:'Colombia', bandera:'🇨🇴', dato:'7 de cada 10 empresas no supera el 20% de madurez analítica — el freno no son las herramientas, es la falta de datos organizados e integrados.', fuente:'Fuente: Sinnetic, 2026' },
  { pais:'México', bandera:'🇲🇽', dato:'69% señala la gestión y el acceso a los datos como su principal obstáculo para adoptar IA.', fuente:'Fuente: ServiceNow Enterprise AI Maturity Index, 2026' },
  { pais:'Chile', bandera:'🇨🇱', dato:'64% todavía trabaja con datos fragmentados o parcialmente integrados.', fuente:'Fuente: CDTIC-PwC Chile, 2026' },
] as const

// Ritmo del pase de lectura de las cards de arriba. La duración de cada una sale del
// largo de SU texto, no de un intervalo fijo: la de Colombia es tres veces más larga que
// la de Chile, y con un intervalo parejo o se corta la primera o se hace eterna la última.
// ~130 ms por palabra es deliberadamente más rápido que la lectura real (~300 ms/palabra):
// acá el pase marca el orden y el ritmo, el visitante no tiene que terminar cada card antes
// de que avance el foco. El medio segundo de base evita que la card corta apenas parpadee.
const MS_POR_PALABRA = 130
const MS_BASE = 500
const duracionLectura = (texto: string) => MS_BASE + texto.trim().split(/\s+/).length * MS_POR_PALABRA

export default function PulseMotorLanding() {
  const usuarioLogueado = useUsuarioLogueado()
  const { theme, toggleTheme } = usePulseTheme()
  const [visible, setVisible]                 = useState(false)
  const activeSection = useSectionScrollSpy(NAV_ITEMS)

  const heroScroll      = useScrollProgress<HTMLDivElement>()
  const heroPanel      = useReveal<HTMLDivElement>()
  // Video real del panel en el slot del hero. Arranca silenciado porque los
  // navegadores no permiten autoplay con sonido bajo ninguna circunstancia —
  // el boton de abajo lo desmutea con gesto explicito del usuario, que es la
  // unica forma en que el audio puede sonar.
  const heroVideoRef    = useRef<HTMLVideoElement>(null)
  const [conSonido, setConSonido] = useState(false)
  const alternarSonido = () => {
    if (!heroVideoRef.current) return
    const next = !conSonido
    heroVideoRef.current.muted = !next
    setConSonido(next)
  }
  const dataStatReveal  = useReveal<HTMLDivElement>()
  // Ref propio para la grilla de cards, aparte del reveal del bloque entero: el bloque
  // entra en viewport con el titular, cuando las cards todavía están abajo del pliegue, y
  // el pase de lectura arrancaría sin que nadie lo vea.
  const espejoCards     = useReveal<HTMLDivElement>(0.35)
  const [cardLeyendo, setCardLeyendo] = useState(-1)
  const segHeader       = useReveal<HTMLDivElement>()
  const segGrid         = useReveal<HTMLDivElement>()

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  const v = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  })

  // Pase de lectura del espejo de mercado: enciende las cards una por una, cada una
  // durante lo que cuesta leer su propio texto. Corre una sola vez —useReveal desconecta
  // el observer al primer cruce— y no vuelve atrás: una vez leída, la card queda oscura.
  useEffect(() => {
    if (!espejoCards.inView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCardLeyendo(MARKET_STATS.length)   // estado final, sin recorrido
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    let acumulado = 0
    MARKET_STATS.forEach((m, i) => {
      timers.push(setTimeout(() => setCardLeyendo(i), acumulado))
      acumulado += duracionLectura(m.dato)
    })
    // Un tick final más allá de la última card: sin esto el foco se queda clavado en la
    // tercera —levantada 3px— mientras las otras dos ya asentaron, y el cierre queda
    // desparejo. El estado final tiene que ser las tres iguales, que es justo el argumento.
    timers.push(setTimeout(() => setCardLeyendo(MARKET_STATS.length), acumulado))
    return () => timers.forEach(clearTimeout)
  }, [espejoCards.inView])

  // Hero pineado (scroll-jacking): "grow" agranda el panel de tool-calls como si fuera
  // el video reproduciéndose; "tilt" lo inclina en 3D y cruza al esquema real de DataBridge.
  const heroP = heroScroll.progress
  const grow = Math.min(1, Math.max(0, (heroP - 0.12) / 0.38))
  const tilt = Math.min(1, Math.max(0, (heroP - 0.55) / 0.4))
  // Destello blanco a mitad del giro (pico en tilt=0.5, cero en los extremos) — refuerzo
  // funcional para que el momento exacto del scroll que dispara el giro 3D sea inconfundible.
  const flash = Math.max(0, 1 - Math.abs(tilt - 0.5) * 2)

  return (
    <>
      <PulseStyles />

      <div className="pulse-theme-root" data-theme={theme} style={{ minHeight:'100vh', color:'var(--ink)', fontFamily:F_BODY, lineHeight:1.5 }}>

        <PulseHeader navItems={NAV_ITEMS} activeSection={activeSection} usuarioLogueado={usuarioLogueado} theme={theme} onToggleTheme={toggleTheme} />

        {/* HERO — sección pineada: el panel de tool-calls se agranda "reproduciéndose"
            y después se inclina en 3D revelando el esquema real de DataBridge, al ritmo
            del scroll. Con prefers-reduced-motion queda como el hero estático de siempre. */}
        <div ref={heroScroll.ref} style={heroScroll.reduced ? undefined : { height:'300vh', position:'relative' }}>
        <section id="plataforma" style={heroScroll.reduced ? { maxWidth:'1280px', margin:'0 auto', padding:'64px 24px 40px' } : {
          position:'sticky', top:0, height:'100vh', overflow:'hidden',
          maxWidth:'1280px', margin:'0 auto', padding:'0 40px', display:'flex', alignItems:'center',
        }}>
          <div className="hero-grid" style={{ display:'flex', gap:'56px', alignItems:'center', width:'100%' }}>
            <div style={heroScroll.reduced ? { flex:'1', minWidth:'320px' } : {
              flex:'1', minWidth:'320px',
              opacity: Math.max(0.4, 1 - grow / 0.7),
              transform: `translateY(${-28 * grow}px)`,
              pointerEvents: grow > 0.6 ? 'none' : undefined,
            }}>
              <div style={{ ...v(100), marginBottom:'24px' }}>
                <span className="badge guard-sweep"><span className="live-dot" />Agente activo · 24/7/365</span>
              </div>
              <h1 style={{ ...v(250), fontFamily:F_DISPLAY, fontSize:'clamp(44px,6.2vw,80px)', fontWeight:800, lineHeight:1.02, letterSpacing:'-1.5px', margin:'0 0 20px', color:'var(--ink)' }}>
                El copiloto que <span className="grad-blue">nunca deja de cerrar.</span>
              </h1>
              <p style={{ ...v(400), fontSize:'clamp(16px,1.6vw,18px)', color:'var(--ink-dim)', maxWidth:'520px', margin:'0 0 28px', lineHeight:1.65 }}>
                Pulse Motor despliega agentes autónomos que gestionan cada lead del sector automotriz: vehículo nuevo, versiones, financiación, accesorios, retomas y pólizas — todo el contexto 360° en una sola conversación.
              </p>
              <div style={{ ...v(550), display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'20px' }}>
                <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'14px 28px', textDecoration:'none' }}>Desplegar agente<span className="btn-arrow">→</span></a>
                <a href="#segmentos" className="pm-btn pm-btn-dark" style={{ display:'inline-flex', width:'auto', padding:'14px 24px', textDecoration:'none' }}>Ver segmentos</a>
              </div>
              <p style={{ ...v(700), fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO, marginBottom:'36px' }}>WhatsApp Business · DMS · CRM · Aliados financieros</p>
              <a href="#segmentos" className="scroll-cue" style={{ opacity:(visible?1:0) * (heroScroll.reduced ? 1 : (1 - grow)), transition:'opacity 0.7s ease 850ms' }}>
                Descubrí tu segmento
                <span aria-hidden="true">⌄</span>
              </a>
            </div>

            {/* Panel hero: video real del panel de demo, en un marco de "ventana de
                app" — mismo contenedor (max-width 460px) y mismo comportamiento de
                scroll (agrandado + inclinado en 3D) que tenia el panel simulado
                anterior. La diferencia es el contenido: antes eran dos vistas
                animadas (un log falso y un diagrama), ahora es la grabacion real
                del producto funcionando. */}
            <div
              ref={heroPanel.ref}
              className={`reveal${heroPanel.inView?' in':''}`}
              // paddingTop empuja el marco hacia abajo para que la barra de titulo
              // quede a la altura del H1, no del badge de arriba — el video real
              // (720x960, retrato) es bastante mas alto que el panel simulado
              // anterior (412px fijos), y sin este ajuste el marco arrancaba mas
              // arriba que el propio badge "Agente activo", descompensando la
              // columna contra el ritmo vertical del texto.
              style={heroScroll.reduced ? { flex:'1', minWidth:'320px', maxWidth:'460px', paddingTop:'96px' } : {
                flex:'1', minWidth:'320px', maxWidth:'460px', paddingTop:'96px',
                transform: `perspective(1200px) translateX(${-26 * grow + 8 * tilt}%) scale(${1 + 0.55 * grow - 0.4 * tilt}) rotateY(${20 * tilt}deg) rotateX(${-9 * tilt}deg)`,
                willChange:'transform',
              }}
            >
              <div className="panel" style={{
                position:'relative', overflow:'hidden', minHeight: heroScroll.reduced ? undefined : '412px',
                boxShadow: heroScroll.reduced ? undefined : `0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3), 0 0 ${56 * flash}px ${6 * flash}px rgba(255,255,255,${0.6 * flash})`,
              }}>
                {/* Barra de titulo tipo "ventana de app": los tres puntos son la
                    convencion universal de "esto es una ventana real", no un
                    gesto de marca — por eso van en semaforo clasico y no en
                    azul. La URL que muestra es la real, no un nombre inventado:
                    si alguien la escribe en su navegador, llega al panel de
                    verdad. */}
                <div className="panel-head">
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'9px', minWidth:0 }}>
                    <span aria-hidden="true" style={{ display:'inline-flex', gap:'5px', flexShrink:0 }}>
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#F87171' }} />
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#FBBF24' }} />
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#34D399' }} />
                    </span>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>pulsemotor.co/pulse/demo</span>
                  </span>
                  <button
                    type="button"
                    onClick={alternarSonido}
                    aria-label={conSonido ? 'Silenciar el video' : 'Activar el sonido'}
                    title={conSonido ? 'Silenciar' : 'Activar sonido'}
                    style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--panel-ink-dim)', padding:'2px', display:'flex', flexShrink:0 }}
                  >
                    {conSonido ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="m23 9-6 6M17 9l6 6" /></svg>
                    )}
                  </button>
                </div>

                {/* El icono chico de la barra de titulo se perdia de vista — este
                    boton flota sobre el video mismo, grande y con texto, para que
                    nadie tenga dudas de que hay sonido para activar. Fondo con
                    blur para que se lea encima de cualquier fotograma, y un
                    resplandor pulsante sutil que llama el ojo sin ser invasivo. */}
                <div style={{ position:'relative' }}>
                  <video
                    ref={heroVideoRef}
                    src="/pulse/hero-demo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    style={{ display:'block', width:'100%', height:'auto' }}
                  />
                  <button
                    type="button"
                    onClick={alternarSonido}
                    className="pm-vol-btn"
                    aria-label={conSonido ? 'Silenciar el video' : 'Subir el volumen'}
                    style={{
                      position:'absolute', right:'14px', bottom:'14px', zIndex:2,
                      display:'inline-flex', alignItems:'center', gap:'8px',
                      padding:'10px 18px', borderRadius:'999px',
                      border:'1px solid rgba(255,255,255,.22)',
                      background:'rgba(10,14,24,.74)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
                      color:'#fff', fontSize:'13px', fontWeight:700, fontFamily:F_BODY, cursor:'pointer',
                      boxShadow:'0 8px 24px rgba(0,0,0,.35)',
                    }}
                  >
                    {conSonido ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="m23 9-6 6M17 9l6 6" /></svg>
                    )}
                    {conSonido ? 'Silenciar' : 'Subir volumen'}
                  </button>
                  <style>{`
                    .pm-vol-btn { transition: transform .15s ease, background .15s ease; animation: pm-vol-pulse 2.6s ease-in-out infinite; }
                    .pm-vol-btn:hover { transform: translateY(-1px); background: rgba(15,20,32,.86) !important; }
                    @keyframes pm-vol-pulse {
                      0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,.35), 0 0 0 0 rgba(59,130,246,.35); }
                      50% { box-shadow: 0 8px 24px rgba(0,0,0,.35), 0 0 0 8px rgba(59,130,246,0); }
                    }
                    @media (prefers-reduced-motion: reduce) { .pm-vol-btn { animation: none; } }
                  `}</style>
                </div>

                <div className="agent-log-footer">
                  <span><span className="live-dot" style={{ background:'var(--blue)' }} /> GRABACIÓN REAL DEL PANEL</span>
                  <span style={{ color:'var(--panel-ink-dim)', fontSize:'12px' }}>Sin actores, sin guion</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        </div>

        {/* ESPEJO DE MERCADO — antes citaba un solo país (Chile), lo que sonaba ajeno a
            cualquier visitante de otro mercado de LatAm. Ahora triangula el mismo hallazgo
            con 3 estudios independientes (CO/MX/CL) enmarcados por un dato regional — más
            persuasivo que un país solo, y sigue sin requerir geolocalización. Ver
            arquetipo-marca-pulsemotor.md, sección "Uso de estudios de madurez de IA por
            mercado" — regla: nunca fabricar un dato, citar siempre la fuente, y solo afirmar
            lo que el producto resuelve de forma directa. */}
        <section style={{ maxWidth:'1280px', margin:'0 auto', padding:'56px 24px', borderTop:'1px solid var(--line)' }}>
          <div ref={dataStatReveal.ref} className={`reveal${dataStatReveal.inView?' in':''}`}>
            <p className="kicker">No es un caso aislado</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(24px,3.2vw,38px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.22, color:'var(--ink)', margin:'0 0 14px', maxWidth:'760px' }}>
              El mismo problema, en toda la región.
            </h2>
            <p style={{ fontSize:'15.5px', color:'var(--ink-dim)', lineHeight:1.65, margin:'0 0 32px', maxWidth:'680px' }}>
              44% de los líderes tecnológicos de LatAm enfrenta dificultades con la calidad y disponibilidad de sus datos (NTT Data + MIT Español, 2026). No es una excepción de un solo país:
            </p>

            <div ref={espejoCards.ref} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', marginBottom:'32px' }} className="insumos-grid">
              {MARKET_STATS.map((m,mi) => {
                const leyendo = mi === cardLeyendo
                const leida   = mi <= cardLeyendo
                return (
                  <div key={m.pais} className={`espejo-card${leida?' leida':''}${leyendo?' leyendo':''}`}>
                    <p className="espejo-pais" style={{ fontFamily:F_MONO, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700, margin:'0 0 12px' }}>{m.bandera} {m.pais}</p>
                    <p className="espejo-dato" style={{ fontSize:'14px', lineHeight:1.55, margin:'0 0 14px' }}>{m.dato}</p>
                    <p className="espejo-fuente" style={{ fontFamily:F_MONO, fontSize:'10.5px', margin:0 }}>{m.fuente}</p>
                    <span className="espejo-barra" style={{ animationDuration:`${duracionLectura(m.dato)}ms` }} />
                  </div>
                )
              })}
            </div>

            <p style={{ fontSize:'15.5px', color:'var(--ink-dim)', lineHeight:1.65, margin:'0 0 24px', maxWidth:'680px' }}>
              Es el mismo patrón que vemos en cada concesionario, sin importar el país: el Excel de retomas, el CRM de leads y el DMS nunca se cruzan. Pulse Motor no te pide migrar nada — subís lo que ya tenés y la IA encuentra las relaciones.
            </p>
            <a href="/pulse/databridge" className="pm-btn-outline" style={{ display:'inline-flex', width:'auto', padding:'11px 20px', fontSize:'13px', borderRadius:'6px', textDecoration:'none' }}>Probar con tus datos<span className="btn-arrow">→</span></a>
          </div>
        </section>

        {/* SEGMENTOS — "screen 1": la home se detiene acá. Cada card es un link completo
            a su propia landing dedicada, donde vive todo el contenido profundo clasificado
            por segmento (Por qué, Ecosistema, Actividad en vivo, Integraciones, Testimonios,
            Cumplimiento, Precios). */}
        <section id="segmentos" style={{ maxWidth:'1280px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div ref={segHeader.ref} className={`reveal${segHeader.inView?' in':''}`} style={{ marginBottom:'44px' }}>
            <p className="kicker">Dos segmentos, un agente</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(30px,4vw,52px)', fontWeight:800, letterSpacing:'-.5px', lineHeight:1.1, color:'var(--ink)' }}>
              Para concesionarios y para vendedores independientes.
            </h2>
          </div>
          <div ref={segGrid.ref} className="seg-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
            {SEGMENTS.map((s,i) => (
              <a key={s.titulo} href={s.href} className={`seg-card seg-card-${s.tagColor} reveal${segGrid.inView?' in':''}`} style={{ transitionDelay:`${i*140}ms` }}>
                <span className="seg-card-arrow" aria-hidden="true">↗</span>
                <div className="seg-card-icon"><SegIcon variant={s.tagColor} /></div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom:'14px' }}>
                  <span className={`seg-tag ${s.tagColor}`} style={{ marginBottom:0 }}>{s.tag}</span>
                  <span className="badge" style={{ padding:'4px 10px', fontSize:'10px', border:'1px solid var(--seg-badge-border)', color:'var(--seg-badge-ink)' }}><span className="live-dot on-tint" />{s.liveStat}</span>
                </div>
                <h3 className="seg-card-title" style={{ fontWeight:800, fontFamily:F_DISPLAY, marginBottom:'4px', color:'var(--ink)' }}>{s.titulo}</h3>
                <p className="seg-card-subtitle" style={{ fontFamily:F_MONO, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'16px' }}>{s.subtitulo}</p>
                <p style={{ fontSize:'14px', color:'var(--ink-dim)', lineHeight:1.6, marginBottom:'18px' }}>{s.desc}</p>
                <div style={{ marginBottom:'22px' }}>
                  {s.bullets.map((b,bi) => (
                    <div key={b} className={`seg-check reveal${segGrid.inView?' in':''}`} style={{ transitionDelay:`${i*140 + 200 + bi*80}ms` }}>
                      <span className="mark seg-check-mark">✓</span><span>{b}</span>
                    </div>
                  ))}
                </div>
                {s.diagram && <SchemaPreview />}
                {s.chat && <WhatsAppMiniPreview active={segGrid.inView} />}
                <span className={s.ctaClass} style={{ display:'inline-flex', width:'auto', padding:'11px 20px', fontSize:'13px', borderRadius:'6px' }}>{s.cta}<span className="btn-arrow">→</span></span>
              </a>
            ))}
          </div>
        </section>

        {/* PROTOTIPOS — va DESPUÉS de Segmentos a propósito: recién cuando el visitante
            se reconoció en un segmento tiene sentido mostrarle el panel, y cada tarjeta
            entra directo a su módulo del demo. */}
        <PulsePrototipos />

        <PulseFooter />
      </div>
    </>
  )
}
