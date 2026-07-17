'use client'

import { useState, useEffect } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import {
  F_DISPLAY, F_MONO, F_BODY, TOOL_CALLS, SEGMENTS,
  PulseStyles, PulseHeader, PulseFooter,
  useUsuarioLogueado, useSectionScrollSpy,
  SegIcon, SchemaPreview, WhatsAppMiniPreview, DataBridgeMiniDiagram,
} from './_shared/sections'

// La landing pública ahora termina en "Segmentos" (screen 1): cada card lleva a su
// propia landing dedicada (/pulse/concesionario, /pulse/asesor) con el contenido
// profundo clasificado por segmento — ver "ajusta toda la arquitectura" en el pedido
// del usuario. El resto de las secciones (Por qué, Ecosistema, Actividad en vivo,
// Integraciones, Testimonios, Cumplimiento, Precios) vive en esas dos landings.
const NAV_ITEMS = [
  { label:'Plataforma', href:'#plataforma' },
  { label:'Segmentos', href:'#segmentos' },
  { label:'Para concesionarios', href:'/pulse/concesionario' },
  { label:'Para asesores', href:'/pulse/asesor' },
]

export default function PulseMotorLanding() {
  const usuarioLogueado = useUsuarioLogueado()
  const [visible, setVisible]                 = useState(false)
  const [toolCallsVisible, setToolCallsVisible] = useState<number[]>([])
  const activeSection = useSectionScrollSpy(NAV_ITEMS)

  const heroScroll      = useScrollProgress<HTMLDivElement>()
  const heroPanel      = useReveal<HTMLDivElement>()
  const segHeader       = useReveal<HTMLDivElement>()
  const segGrid         = useReveal<HTMLDivElement>()

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  // Timeline de tool-calls: se revela fila por fila cuando el panel del hero entra en viewport.
  useEffect(() => {
    if (!heroPanel.inView) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setToolCallsVisible(TOOL_CALLS.map((_,i)=>i)); return }
    const timers = TOOL_CALLS.map((_, i) => setTimeout(() => setToolCallsVisible(prev => [...prev, i]), 600 + i * 350))
    return () => timers.forEach(clearTimeout)
  }, [heroPanel.inView])

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

      <div style={{ minHeight:'100vh', background:'var(--bg-0)', color:'var(--ink)', fontFamily:F_BODY, lineHeight:1.5 }}>

        <PulseHeader navItems={NAV_ITEMS} activeSection={activeSection} usuarioLogueado={usuarioLogueado} />

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
              opacity: 1 - Math.min(1, grow / 0.7),
              transform: `translateY(${-28 * grow}px)`,
              pointerEvents: grow > 0.6 ? 'none' : undefined,
            }}>
              <div style={{ ...v(100), marginBottom:'24px' }}>
                <span className="badge guard-sweep"><span className="live-dot" />Agente activo · 24/7/365</span>
              </div>
              <h1 style={{ ...v(250), fontFamily:F_DISPLAY, fontSize:'clamp(44px,6.2vw,80px)', fontWeight:800, lineHeight:1.02, letterSpacing:'-1.5px', margin:'0 0 20px', color:'var(--ink)' }}>
                El copiloto que <span className="grad-amber">nunca deja de cerrar.</span>
              </h1>
              <p style={{ ...v(400), fontSize:'clamp(16px,1.6vw,18px)', color:'var(--ink-dim)', maxWidth:'520px', margin:'0 0 28px', lineHeight:1.65 }}>
                Pulse Motor despliega agentes autónomos que gestionan cada lead del sector automotriz: vehículo nuevo, versiones, financiación, accesorios, retomas y pólizas — todo el contexto 360° en una sola conversación.
              </p>
              <div style={{ ...v(550), display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'20px' }}>
                <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'14px 28px', textDecoration:'none' }}>Desplegar agente<span className="btn-arrow">→</span></a>
                <a href="#segmentos" className="pm-btn pm-btn-ghost" style={{ display:'inline-flex', width:'auto', padding:'14px 24px', textDecoration:'none' }}>Ver segmentos</a>
              </div>
              <p style={{ ...v(700), fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO, marginBottom:'36px' }}>WhatsApp Business · DMS · CRM · Aliados financieros</p>
              <a href="#segmentos" className="scroll-cue" style={{ opacity:(visible?1:0) * (heroScroll.reduced ? 1 : (1 - grow)), transition:'opacity 0.7s ease 850ms' }}>
                Descubrí tu segmento
                <span aria-hidden="true">⌄</span>
              </a>
            </div>

            {/* Panel hero: conversación + timeline de tool-calls, que al hacer scroll se
                agranda, se inclina en 3D y cruza al esquema real detectado por DataBridge. */}
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
                  <div className="panel-head"><span>Precio lead · Ruteo</span><span style={{ color:'var(--green)' }}>Live</span></div>
                  <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--line)' }}>
                    <div style={{ fontSize:'13px', color:'var(--ink)', marginBottom:'12px' }}>
                      <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--ink-dim)', marginRight:'8px' }}>[09:42]</span>
                      "Me interesa la SUV híbrida, tengo un sedán 2021 para retoma y necesito financiación a 60 meses."
                    </div>
                    <div style={{ fontFamily:F_MONO, fontSize:'10px', color:'var(--amber)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'10px' }}>Pulse Agent · Respondiendo</div>
                    <div style={{ fontSize:'13px', color:'var(--ink-dim)', lineHeight:1.6 }}>
                      Perfecto. Tasé preliminarmente su 2021 en $42.500.000. Con nuestro aliado bancario logro 1.9% MV y cuota cerrada con póliza todo riesgo. ¿Le envío la proyección por WhatsApp?
                    </div>
                  </div>
                  <div className="panel-head" style={{ borderBottom:'1px solid var(--line)' }}><span>Timeline · Ejecutado</span></div>
                  <div>
                    {TOOL_CALLS.map((t,i) => (
                      <div key={t.fn} className={`tool-row${toolCallsVisible.includes(i)?' in':''}`}>
                        <span className="fn"><span style={{ display:'inline-block', width:'6px', height:'6px', borderRadius:'50%', background:t.chip, marginRight:'8px' }} />{t.fn}</span>
                        <span className="ms"><span style={{ color:'var(--green)' }}>✓</span>{t.ms}ms</span>
                      </div>
                    ))}
                  </div>
                  {/* El trámite avanza: el auto recorre la pista al ritmo de los tool-calls ejecutados */}
                  <div className="tool-road" aria-hidden="true">
                    <span className="tool-road-car" style={{ left:`${6 + (toolCallsVisible.length / TOOL_CALLS.length) * 88}%` }}>🚗</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px' }}>
                    <span style={{ fontFamily:F_MONO, fontSize:'10px', color:'var(--ink-dim)', textTransform:'uppercase', letterSpacing:'.5px' }}>Conversión estimada</span>
                    <span className="grad-amber" style={{ fontFamily:F_DISPLAY, fontSize:'22px', fontWeight:800 }}>87%</span>
                  </div>
                </div>

                {!heroScroll.reduced && (
                  <div style={{ opacity:crossfade, pointerEvents: crossfade > 0.5 ? undefined : 'none', position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div className="panel-head"><span>DataBridge · Esquema detectado</span><span style={{ color:'var(--green)' }}>✓ 5 tablas</span></div>
                    <DataBridgeMiniDiagram />
                    <div style={{ padding:'14px 18px', fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO, borderTop:'1px solid var(--line)' }}>
                      Detectado desde tu Excel o DMS — sin escribir una sola línea de SQL.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </div>

        {/* SEGMENTOS — "screen 1": la home se detiene acá. Cada card es un link completo
            a su propia landing dedicada, donde vive todo el contenido profundo clasificado
            por segmento (Por qué, Ecosistema, Actividad en vivo, Integraciones, Testimonios,
            Cumplimiento, Precios). */}
        <section id="segmentos" style={{ maxWidth:'1280px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div ref={segHeader.ref} className={`reveal${segHeader.inView?' in':''}`} style={{ marginBottom:'44px' }}>
            <p className="kicker">Dos segmentos, un agente</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(30px,4vw,52px)', fontWeight:800, letterSpacing:'-.5px', lineHeight:1.1, color:'var(--ink)' }}>
              Diseñado para cómo realmente se vende.
            </h2>
          </div>
          <div ref={segGrid.ref} className="seg-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
            {SEGMENTS.map((s,i) => (
              <a key={s.titulo} href={s.href} className={`seg-card seg-card-${s.tagColor} reveal${segGrid.inView?' in':''}`} style={{ transitionDelay:`${i*140}ms` }}>
                <span className="seg-card-arrow" aria-hidden="true">↗</span>
                <div className="seg-card-icon"><SegIcon variant={s.tagColor} /></div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom:'14px' }}>
                  <span className={`seg-tag ${s.tagColor}`} style={{ marginBottom:0 }}>{s.tag}</span>
                  <span className="badge" style={{ padding:'4px 10px', fontSize:'10px', border:'1px solid rgba(255,255,255,0.35)', color:'#fff' }}><span className="live-dot on-gradient" />{s.liveStat}</span>
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

        <PulseFooter />
      </div>
    </>
  )
}
