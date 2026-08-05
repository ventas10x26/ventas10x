'use client'

import { useState, useEffect } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import {
  F_DISPLAY, F_MONO, F_BODY, AGENT_LOG_STEPS, SEGMENTS,
  PulseStyles, PulseHeader, PulseFooter,
  useUsuarioLogueado, useSectionScrollSpy, usePulseTheme,
  SegIcon, SchemaPreview, WhatsAppMiniPreview, DataBridgeMiniDiagram,
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

export default function PulseMotorLanding() {
  const usuarioLogueado = useUsuarioLogueado()
  const { theme, toggleTheme } = usePulseTheme()
  const [visible, setVisible]                 = useState(false)
  const activeSection = useSectionScrollSpy(NAV_ITEMS)

  const heroScroll      = useScrollProgress<HTMLDivElement>()
  const heroPanel      = useReveal<HTMLDivElement>()
  const dataStatReveal  = useReveal<HTMLDivElement>()
  const segHeader       = useReveal<HTMLDivElement>()
  const segGrid         = useReveal<HTMLDivElement>()

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  const v = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  })

  // Hero pineado (scroll-jacking): "grow" agranda el panel de tool-calls como si fuera
  // el video reproduciéndose; "tilt" lo inclina en 3D y cruza al esquema real de DataBridge.
  const heroP = heroScroll.progress
  const grow = Math.min(1, Math.max(0, (heroP - 0.12) / 0.38))
  const tilt = Math.min(1, Math.max(0, (heroP - 0.55) / 0.4))
  const crossfade = Math.min(1, Math.max(0, (tilt - 0.25) / 0.75))
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
          maxWidth:'1280px', margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center',
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

            {/* Panel hero: log vertical de pasos del agente, que al hacer scroll se agranda,
                se inclina en 3D y cruza al esquema real detectado por DataBridge. */}
            <div
              ref={heroPanel.ref}
              className={`reveal${heroPanel.inView?' in':''}`}
              style={heroScroll.reduced ? { flex:'1', minWidth:'320px', maxWidth:'460px' } : {
                flex:'1', minWidth:'320px', maxWidth:'460px',
                transform: `perspective(1200px) translateX(${-26 * grow + 8 * tilt}%) scale(${1 + 0.55 * grow - 0.4 * tilt}) rotateY(${20 * tilt}deg) rotateX(${-9 * tilt}deg)`,
                willChange:'transform',
              }}
            >
              <div className="panel" style={{
                position:'relative', minHeight: heroScroll.reduced ? undefined : '412px',
                boxShadow: heroScroll.reduced ? undefined : `0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3), 0 0 ${56 * flash}px ${6 * flash}px rgba(255,255,255,${0.6 * flash})`,
              }}>
                <div style={heroScroll.reduced ? undefined : { opacity:1 - crossfade, pointerEvents: crossfade > 0.5 ? 'none' : undefined, position: heroScroll.reduced ? undefined : 'absolute', inset: heroScroll.reduced ? undefined : 0 }}>
                  <div className="panel-head">
                    <span>📄 pulse_agent_v4.2.log</span>
                    <span style={{ letterSpacing:'2px', color:'var(--panel-ink-dim)' }}>···</span>
                  </div>
                  <div style={{ padding:'18px 18px 6px' }}>
                    {AGENT_LOG_STEPS.map((s, i) => (
                      <div key={s.titulo} className={`reveal agent-log-step${heroPanel.inView ? ' in' : ''}${i === 1 ? ' agent-log-step-active' : ''}`} style={{ transitionDelay:`${i * 180}ms` }}>
                        <div className="agent-log-icon">{s.icon}</div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:'13px', fontWeight:600, color:'var(--panel-ink)' }}>{s.titulo}</div>
                          <div style={{ fontSize:'12px', color:'var(--panel-ink-dim)', fontFamily:F_MONO }}>{s.dato}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="agent-log-footer">
                    <span><span className="live-dot" style={{ background:'var(--blue)' }} /> SISTEMA EN LÍNEA</span>
                    <span><strong style={{ color:'var(--blue)', fontSize:'14px' }}>99.8%</strong> <span style={{ color:'var(--panel-ink-dim)' }}>PRECISIÓN</span></span>
                  </div>
                </div>

                {!heroScroll.reduced && (
                  <div style={{ opacity:crossfade, pointerEvents: crossfade > 0.5 ? undefined : 'none', position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div className="panel-head"><span>DataBridge · Esquema detectado</span><span style={{ color:'var(--blue)' }}>✓ 5 tablas</span></div>
                    <DataBridgeMiniDiagram />
                    <div style={{ padding:'14px 18px', fontSize:'12px', color:'var(--panel-ink-dim)', fontFamily:F_MONO, borderTop:'1px solid var(--panel-line)' }}>
                      Detectado desde tu Excel o DMS — sin escribir una sola línea de SQL.
                    </div>
                  </div>
                )}
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

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', marginBottom:'32px' }} className="insumos-grid">
              {MARKET_STATS.map((m,mi) => (
                <div key={m.pais} style={{ border:'1px solid var(--line)', borderRadius:'8px', padding:'22px 20px' }}>
                  <p style={{ fontFamily:F_MONO, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', color:'var(--blue)', fontWeight:700, margin:'0 0 12px' }}>{m.bandera} {m.pais}</p>
                  <p style={{ fontSize:'14px', color:'var(--ink)', lineHeight:1.55, margin:'0 0 14px' }}>{m.dato}</p>
                  <p style={{ fontFamily:F_MONO, fontSize:'10.5px', color:'var(--ink-dim)', margin:0 }}>{m.fuente}</p>
                </div>
              ))}
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
