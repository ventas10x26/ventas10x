'use client'

import { useEffect, useState, useRef } from 'react'

const DARK = '#0f1c2e'
const ORANGE = '#FF6B2B'

const CHAT_SEQUENCE = [
  { role: 'user', text: 'Crea un producto: Kia Sportage 2024 a $85.000.000' },
  { role: 'ai', text: '✅ Listo! Creé el producto **Kia Sportage 2024** a $85.000.000. ¿Quieres que busque una imagen profesional?' },
  { role: 'user', text: 'Sí, busca una foto para el producto' },
  { role: 'ai', text: '📸 Encontré 6 imágenes de alta calidad. Aplicando la mejor a tu catálogo...' },
  { role: 'user', text: 'Mejora el título de mi landing' },
  { role: 'ai', text: '✨ Título actualizado: "Tu próximo Kia, al mejor precio de Colombia". ¿Lo guardamos?' },
]

const METRICS = [
  { label: 'Hoy', value: 24, color: ORANGE },
  { label: '7 días', value: 187, color: '#3b82f6' },
  { label: '30 días', value: 612, color: '#10b981' },
]

const PIPELINE = [
  { etapa: 'Nuevos', count: 8, color: '#6366f1' },
  { etapa: 'Contactados', count: 5, color: ORANGE },
  { etapa: 'Interesados', count: 3, color: '#10b981' },
  { etapa: 'Cerrados', count: 2, color: '#f59e0b' },
]

export default function DashboardIASection() {
  const [visibleMsgs, setVisibleMsgs] = useState(0)
  const [typing, setTyping] = useState(false)
  const [titleText, setTitleText] = useState('Vende más con tu catálogo digital')
  const [productAdded, setProductAdded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    let msgIdx = 0
    const run = () => {
      if (msgIdx >= CHAT_SEQUENCE.length) {
        setTimeout(() => {
          setVisibleMsgs(0)
          setTyping(false)
          setProductAdded(false)
          setTitleText('Vende más con tu catálogo digital')
          msgIdx = 0
          setTimeout(run, 1000)
        }, 4000)
        return
      }
      const msg = CHAT_SEQUENCE[msgIdx]
      if (msg.role === 'ai') {
        setTyping(true)
        setTimeout(() => {
          setTyping(false)
          setVisibleMsgs(v => v + 1)
          if (msgIdx === 1) setProductAdded(true)
          if (msgIdx === 5) setTitleText('Tu próximo Kia, al mejor precio de Colombia')
          msgIdx++
          setTimeout(run, msg.text.length * 18 + 800)
        }, 1200)
      } else {
        setVisibleMsgs(v => v + 1)
        msgIdx++
        setTimeout(run, 600)
      }
    }
    const t = setTimeout(run, 800)
    return () => clearTimeout(t)
  }, [isVisible])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [visibleMsgs, typing])

  const shownMsgs = CHAT_SEQUENCE.slice(0, visibleMsgs)

  return (
    <div
      ref={sectionRef}
      style={{
        background: DARK,
        padding: '6rem 2rem',
        borderTop: '1px solid rgba(255,255,255,.07)',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3.5rem' }}>
          <div style={{
            fontSize: '12px', fontWeight: 700, letterSpacing: '.12em',
            color: ORANGE, marginBottom: '1rem', textTransform: 'uppercase'
          }}>
            Dashboard inteligente
          </div>
          <h2 style={{
            fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800,
            letterSpacing: '-.03em', color: '#fff', marginBottom: '1rem'
          }}>
            Tu asistente IA trabaja<br />
            <span style={{ color: ORANGE }}>mientras tú vendes.</span>
          </h2>
          <p style={{
            fontSize: '18px', color: 'rgba(255,255,255,.6)',
            maxWidth: '520px', lineHeight: 1.7, fontWeight: 400
          }}>
            Crea productos, mejora tu landing, gestiona leads y analiza métricas — todo desde el chat.
          </p>
        </div>

        {/* Main mockup grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}>

          {/* LEFT: Chat IA */}
          <div style={{
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            {/* Chat header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,.08)',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: ORANGE, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff'
              }}>IA</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Asistente Ventas10x</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Activo
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              style={{
                padding: '1rem', height: '320px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '10px',
                scrollBehavior: 'smooth',
              }}
            >
              {shownMsgs.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeUp .3s ease',
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? ORANGE
                      : 'rgba(255,255,255,.1)',
                    color: '#fff',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}>
                    {msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeUp .3s ease' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(255,255,255,.1)',
                    display: 'flex', gap: '4px', alignItems: 'center'
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'rgba(255,255,255,.5)',
                        animation: `bounce .8s ${i * .15}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid rgba(255,255,255,.08)',
              display: 'flex', gap: '8px'
            }}>
              <div style={{
                flex: 1, background: 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: '10px', padding: '8px 12px',
                fontSize: '12px', color: 'rgba(255,255,255,.35)',
              }}>
                Escribe un comando a la IA...
              </div>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: ORANGE, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* RIGHT: Dashboard panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Métricas */}
            <div style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: '16px', padding: '1.25rem',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                📊 Visitas a tu landing
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                {METRICS.map(m => (
                  <div key={m.label} style={{
                    background: 'rgba(255,255,255,.06)', borderRadius: '12px',
                    padding: '12px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', marginTop: '2px' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Producto añadido */}
            <div style={{
              background: 'rgba(255,255,255,.04)',
              border: `1px solid ${productAdded ? 'rgba(16,185,129,.4)' : 'rgba(255,255,255,.1)'}`,
              borderRadius: '16px', padding: '1.25rem',
              transition: 'border-color .5s ease',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                ✦ Catálogo
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Kia Picanto 2023', 'Kia Sonet 2024', 'Kia Seltos'].map(p => (
                  <div key={p} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'rgba(255,255,255,.06)', borderRadius: '10px'
                  }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)' }}>{p}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>Activo</span>
                  </div>
                ))}
                {productAdded && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(16,185,129,.15)',
                    border: '1px solid rgba(16,185,129,.3)',
                    borderRadius: '10px',
                    animation: 'fadeUp .4s ease',
                  }}>
                    <span style={{ fontSize: '13px', color: '#6ee7b7', fontWeight: 600 }}>Kia Sportage 2024</span>
                    <span style={{ fontSize: '11px', color: '#10b981' }}>+ Nuevo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Landing title */}
            <div style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: '16px', padding: '1.25rem',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                ◈ Tu landing
              </div>
              <div style={{
                fontSize: '15px', fontWeight: 700, color: '#fff',
                transition: 'color .3s',
                lineHeight: 1.4,
              }}>
                {titleText}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)', marginTop: '6px' }}>
                ventas10x.co/u/concesionario-kia
              </div>
            </div>

          </div>
        </div>

        {/* Feature pills */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '10px',
          marginTop: '2.5rem',
        }}>
          {[
            '🤖 Chat IA en español',
            '📦 Crea productos con voz',
            '✨ Mejora tu landing al instante',
            '📊 Métricas en tiempo real',
            '🔗 Pipeline integrado',
            '📸 Imágenes automáticas',
          ].map(f => (
            <div key={f} style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: '20px',
              fontSize: '13px',
              color: 'rgba(255,255,255,.72)',
              fontWeight: 500,
            }}>{f}</div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
