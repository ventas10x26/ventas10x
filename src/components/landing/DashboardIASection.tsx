'use client'

import { useEffect, useState, useRef } from 'react'

const DARK = '#0f1c2e'
const ORANGE = '#FF6B2B'

const INDUSTRIAS = [
  {
    key: 'automotriz',
    icon: '🚗',
    label: 'Automotriz',
    color: '#3b82f6',
    slug: 'concesionario-kia',
    productos: ['Kia Picanto 2023', 'Kia Sonet 2024', 'Kia Seltos'],
    productoNuevo: 'Kia Sportage 2024',
    landingInicial: 'Vende más con tu catálogo digital',
    landingFinal: 'Tu próximo Kia, al mejor precio de Colombia',
    chat: [
      { role: 'user', text: 'Crea un producto: Kia Sportage 2024 a $85.000.000' },
      { role: 'ai', text: '✅ Listo! Creé el producto Kia Sportage 2024 a $85.000.000. ¿Busco una imagen profesional?' },
      { role: 'user', text: 'Sí, busca una foto para el producto' },
      { role: 'ai', text: '📸 Encontré 6 imágenes de alta calidad. Aplicando la mejor a tu catálogo...' },
      { role: 'user', text: 'Mejora el título de mi landing' },
      { role: 'ai', text: '✨ Título actualizado: "Tu próximo Kia, al mejor precio de Colombia". ¿Lo guardamos?' },
    ],
    metricas: [24, 187, 612],
  },
  {
    key: 'finca_raiz',
    icon: '🏠',
    label: 'Finca Raíz',
    color: '#8b5cf6',
    slug: 'sandra-gomez-inmobiliaria',
    productos: ['Apto 3 hab · Chapinero', 'Casa · Chía', 'Oficina · WTC'],
    productoNuevo: 'Penthouse · Usaquén',
    landingInicial: 'Encuentra tu propiedad ideal',
    landingFinal: 'El apartamento que buscas ya está esperándote',
    chat: [
      { role: 'user', text: 'Agrega propiedad: Penthouse en Usaquén, $1.200M' },
      { role: 'ai', text: '✅ Propiedad agregada: Penthouse · Usaquén a $1.200M. ¿Genero la descripción con IA?' },
      { role: 'user', text: 'Sí, genera una descripción vendedora' },
      { role: 'ai', text: '✍️ "Vive en las alturas de Usaquén. Terraza privada, vista 360°, acabados de lujo." ¿La usamos?' },
      { role: 'user', text: 'Perfecta. Actualiza el título de mi landing' },
      { role: 'ai', text: '🏠 Landing actualizada: "El apartamento que buscas ya está esperándote". ¡Publicado!' },
    ],
    metricas: [18, 134, 489],
  },
  {
    key: 'salud',
    icon: '🩺',
    label: 'Salud',
    color: '#22c55e',
    slug: 'dra-torres-bienestar',
    productos: ['Consulta general', 'Control preventivo', 'Laboratorios'],
    productoNuevo: 'Chequeo ejecutivo premium',
    landingInicial: 'Tu salud, en buenas manos',
    landingFinal: 'Te orientamos sin costo ni compromiso. Hoy.',
    chat: [
      { role: 'user', text: 'Crea servicio: Chequeo ejecutivo premium a $280.000' },
      { role: 'ai', text: '✅ Servicio creado: Chequeo ejecutivo premium. Incluyo descripción médica profesional.' },
      { role: 'user', text: '¿Cuántas citas tuve esta semana?' },
      { role: 'ai', text: '📊 Esta semana: 36 citas agendadas, 4 canceladas, 2 reagendadas. Tasa de asistencia: 88%.' },
      { role: 'user', text: 'Actualiza el CTA de mi landing para urgencia' },
      { role: 'ai', text: '✨ CTA actualizado: "Próxima cita disponible hoy · Cupos limitados". ¡Publicado!' },
    ],
    metricas: [36, 214, 831],
  },
  {
    key: 'transporte',
    icon: '🚛',
    label: 'Transporte',
    color: '#f59e0b',
    slug: 'logistica-express',
    productos: ['Carga nacional', 'Última milla', 'Mudanzas'],
    productoNuevo: 'Carga refrigerada',
    landingInicial: 'Envíos seguros a todo el país',
    landingFinal: 'Tu carga llega a tiempo o te devolvemos el dinero',
    chat: [
      { role: 'user', text: 'Agrega servicio: Carga refrigerada, desde $180.000' },
      { role: 'ai', text: '✅ Servicio agregado: Carga refrigerada. Cadena de frío garantizada. ¿Agrego cobertura?' },
      { role: 'user', text: '¿Cuántos envíos completamos esta semana?' },
      { role: 'ai', text: '📦 Esta semana: 120 envíos completados, 99.2% a tiempo, 0 reclamos activos. Excelente!' },
      { role: 'user', text: 'Ponle garantía al título de la landing' },
      { role: 'ai', text: '🚛 Título: "Tu carga llega a tiempo o te devolvemos el dinero". ¡Publicado!' },
    ],
    metricas: [42, 298, 1204],
  },
  {
    key: 'educacion',
    icon: '🎓',
    label: 'Educación',
    color: '#ec4899',
    slug: 'academia-futuro',
    productos: ['Excel avanzado', 'Power BI', 'Marketing digital'],
    productoNuevo: 'IA para negocios',
    landingInicial: 'Aprende y transforma tu carrera',
    landingFinal: 'Certifícate en 4 semanas. 100% online. Empieza hoy.',
    chat: [
      { role: 'user', text: 'Crea curso: IA para negocios, $320.000, 4 semanas' },
      { role: 'ai', text: '✅ Curso creado: IA para negocios. Generé temario de 12 módulos. ¿Lo publicamos?' },
      { role: 'user', text: '¿Cuántos estudiantes se inscribieron este mes?' },
      { role: 'ai', text: '🎓 Este mes: 54 inscritos, 3 cursos activos, $17.280.000 en ingresos. ¡Récord mensual!' },
      { role: 'user', text: 'Mejora el CTA con urgencia y beneficio claro' },
      { role: 'ai', text: '✨ "Certifícate en 4 semanas. 100% online. Empieza hoy." ¡Publicado con contador!' },
    ],
    metricas: [12, 54, 198],
  },
]

export default function DashboardIASection() {
  const [industriaIdx, setIndustriaIdx] = useState(0)
  const [visibleMsgs, setVisibleMsgs] = useState(0)
  const [typing, setTyping] = useState(false)
  const [titleText, setTitleText] = useState('')
  const [productAdded, setProductAdded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const runRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const industria = INDUSTRIAS[industriaIdx]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    // Reset state cuando cambia industria
    setVisibleMsgs(0)
    setTyping(false)
    setProductAdded(false)
    setTitleText(industria.landingInicial)

    if (runRef.current) clearTimeout(runRef.current)

    let msgIdx = 0
    const chat = industria.chat

    const run = () => {
      if (msgIdx >= chat.length) {
        // Ciclo completo — espera y pasa a siguiente industria
        runRef.current = setTimeout(() => {
          setIndustriaIdx(i => (i + 1) % INDUSTRIAS.length)
        }, 3500)
        return
      }

      const msg = chat[msgIdx]
      if (msg.role === 'ai') {
        setTyping(true)
        runRef.current = setTimeout(() => {
          setTyping(false)
          setVisibleMsgs(v => v + 1)
          if (msgIdx === 1) setProductAdded(true)
          if (msgIdx === chat.length - 1) setTitleText(industria.landingFinal)
          msgIdx++
          runRef.current = setTimeout(run, msg.text.length * 16 + 600)
        }, 1100)
      } else {
        setVisibleMsgs(v => v + 1)
        msgIdx++
        runRef.current = setTimeout(run, 550)
      }
    }

    runRef.current = setTimeout(run, 600)
    return () => { if (runRef.current) clearTimeout(runRef.current) }
  }, [isVisible, industriaIdx])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [visibleMsgs, typing])

  const shownMsgs = industria.chat.slice(0, visibleMsgs)

  return (
    <div ref={sectionRef} style={{ background: DARK, padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3.5rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.12em', color: ORANGE, marginBottom: '1rem', textTransform: 'uppercase' }}>
            Dashboard inteligente
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-.03em', color: '#fff', marginBottom: '1rem' }}>
            Tu asistente IA trabaja<br />
            <span style={{ color: ORANGE }}>mientras tú vendes.</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,.6)', maxWidth: '520px', lineHeight: 1.7, fontWeight: 400 }}>
            Crea productos, mejora tu landing, gestiona leads y analiza métricas — todo desde el chat.
          </p>

          {/* Selector de industrias */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            {INDUSTRIAS.map((ind, i) => (
              <button
                key={ind.key}
                onClick={() => setIndustriaIdx(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: industriaIdx === i ? ind.color : 'rgba(255,255,255,0.06)',
                  color: industriaIdx === i ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
              >
                {ind.icon} {ind.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-ia-grid">

          {/* Chat */}
          <div style={{
            background: '#fff', border: `1px solid ${industria.color}40`,
            borderRadius: '20px', overflow: 'hidden', transition: 'border-color 0.5s',
          }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>IA</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Asistente Ventas10x</div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  {industria.icon} {industria.label}
                </div>
              </div>
            </div>

            <div ref={chatRef} style={{ padding: '1rem', height: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', scrollBehavior: 'smooth' }}>
              {shownMsgs.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp .3s ease' }}>
                  <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: msg.role === 'user' ? ORANGE : '#f1f5f9', color: msg.role === 'user' ? '#fff' : '#1e293b', fontSize: '13px', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeUp .3s ease' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: '#f1f5f9', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,.5)', animation: `bounce .8s ${i * .15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', background: '#fff' }}>
              <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>
                Escribe un comando a la IA...
              </div>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Panel derecho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Métricas */}
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>📊 Visitas a tu landing</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                {[
                  { label: 'Hoy', value: industria.metricas[0], color: ORANGE },
                  { label: '7 días', value: industria.metricas[1], color: '#3b82f6' },
                  { label: '30 días', value: industria.metricas[2], color: '#10b981' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,.06)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', marginTop: '2px' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Catálogo */}
            <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${productAdded ? 'rgba(16,185,129,.4)' : 'rgba(255,255,255,.1)'}`, borderRadius: '16px', padding: '1.25rem', transition: 'border-color .5s ease' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>✦ Catálogo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {industria.productos.map(p => (
                  <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,.06)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)' }}>{p}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>Activo</span>
                  </div>
                ))}
                {productAdded && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', borderRadius: '10px', animation: 'fadeUp .4s ease' }}>
                    <span style={{ fontSize: '13px', color: '#6ee7b7', fontWeight: 600 }}>{industria.productoNuevo}</span>
                    <span style={{ fontSize: '11px', color: '#10b981' }}>+ Nuevo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Landing */}
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.08em' }}>◈ Tu landing</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', transition: 'all .4s', lineHeight: 1.4 }}>{titleText}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)', marginTop: '6px' }}>ventas10x.co/u/{industria.slug}</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '2.5rem' }}>
          {['🤖 Chat IA en español', '📦 Crea productos con voz', '✨ Mejora tu landing al instante', '📊 Métricas en tiempo real', '🔗 Pipeline integrado', '📸 Imágenes automáticas'].map(f => (
            <div key={f} style={{ padding: '8px 16px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px', fontSize: '13px', color: 'rgba(255,255,255,.72)', fontWeight: 500 }}>{f}</div>
          ))}
        </div>
      </div>

      <style>{`
        .dashboard-ia-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dashboard-ia-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); opacity:.5; } 40% { transform:translateY(-5px); opacity:1; } }
      `}</style>
    </div>
  )
}
