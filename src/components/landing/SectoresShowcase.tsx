// Ruta destino: src/components/landing/SectoresShowcase.tsx
'use client'
import { useState, useEffect } from 'react'

const SECTORES = [
  {
    key: 'automotriz',
    icon: '🚗',
    sector: 'Automotriz',
    color: '#3b82f6',
    asesor: 'Carlos Mejía',
    empresa: 'KIA Bogotá',
    badge: '43 personas cotizaron esta semana',
    titulo: 'Si no encuentro tu vehículo ideal, te digo exactamente por qué.',
    subtitulo: 'Sin compromiso. Sin rodeos. Solo respuestas claras.',
    opciones: ['SUV / Camioneta', 'Sedán / Compacto', 'Eléctrico / Híbrido', 'Solo cotizando'],
    cta: 'WhatsApp directo',
    stat: '43 leads · esta semana',
  },
  {
    key: 'finca_raiz',
    icon: '🏠',
    sector: 'Finca Raíz',
    color: '#8b5cf6',
    asesor: 'Sandra Gómez',
    empresa: 'Inmobiliaria Élite',
    badge: '12 propiedades disponibles hoy',
    titulo: 'El apartamento que buscas ya está esperándote.',
    subtitulo: 'Te muestro 3 opciones que se ajustan a tu presupuesto hoy mismo.',
    opciones: ['Comprar apartamento', 'Comprar casa', 'Arrendar', 'Solo mirando'],
    cta: 'Agendar visita',
    stat: '18 visitas · esta semana',
  },
  {
    key: 'salud',
    icon: '🩺',
    sector: 'Salud',
    color: '#22c55e',
    asesor: 'Dra. María Torres',
    empresa: 'Clínica Bienestar',
    badge: '36 pacientes atendidos esta semana',
    titulo: 'Tu salud primero. Te orientamos sin costo ni compromiso.',
    subtitulo: 'Información clara. Atención oportuna.',
    opciones: ['Consulta médica', 'Procedimiento', 'Medicamento', 'Solo información'],
    cta: 'Reservar cita',
    stat: '36 citas · esta semana',
  },
  {
    key: 'transporte',
    icon: '🚛',
    sector: 'Transporte',
    color: '#f59e0b',
    asesor: 'Diego Vargas',
    empresa: 'Logística Express',
    badge: '120 envíos completados esta semana',
    titulo: 'Tu carga llega a tiempo o te devolvemos el dinero.',
    subtitulo: 'Cobertura nacional. Tracking en tiempo real. Sin sorpresas.',
    opciones: ['Carga nacional', 'Última milla', 'Mudanza', 'Cotizar ahora'],
    cta: 'Cotizar envío',
    stat: '120 envíos · esta semana',
  },
  {
    key: 'retail',
    icon: '🛍️',
    sector: 'Retail',
    color: '#ef4444',
    asesor: 'Ana Rodríguez',
    empresa: 'Tienda AnaStyle',
    badge: '89 pedidos despachados esta semana',
    titulo: 'Lo que buscas, hoy mismo en tu puerta.',
    subtitulo: 'Stock confirmado. Envío el mismo día. Pago seguro.',
    opciones: ['Ver catálogo', 'Precio y stock', 'Envíos y garantías', 'Solo mirando'],
    cta: 'Ver disponibilidad',
    stat: '89 pedidos · esta semana',
  },
  {
    key: 'tecnologia',
    icon: '💻',
    sector: 'Tecnología',
    color: '#06b6d4',
    asesor: 'Felipe Castro',
    empresa: 'DevSolutions',
    badge: '8 demos agendadas esta semana',
    titulo: 'Tu negocio, 10x más eficiente con IA.',
    subtitulo: 'Implementación en una semana. Soporte real. Resultados medibles.',
    opciones: ['Solicitar demo', 'Ver precios', 'Integración', 'Solo explorando'],
    cta: 'Agendar demo',
    stat: '8 demos · esta semana',
  },
  {
    key: 'educacion',
    icon: '🎓',
    sector: 'Educación',
    color: '#ec4899',
    asesor: 'Prof. Laura Ríos',
    empresa: 'Academia Futuro',
    badge: '54 estudiantes inscritos este mes',
    titulo: 'Aprende a tu ritmo. Certifícate y transforma tu carrera.',
    subtitulo: 'Clases en vivo, grabadas y con tutor personal.',
    opciones: ['Ver cursos', 'Fechas y precios', 'Becas disponibles', 'Solo informarme'],
    cta: 'Inscribirme ahora',
    stat: '54 inscritos · este mes',
  },
  {
    key: 'belleza',
    icon: '✨',
    sector: 'Belleza',
    color: '#a855f7',
    asesor: 'Valentina Cruz',
    empresa: 'Studio Val',
    badge: '67 citas completadas esta semana',
    titulo: 'Date un momento para ti. Mereces sentirte increíble.',
    subtitulo: 'Confirmación inmediata. Recordatorios por WhatsApp.',
    opciones: ['Agendar cita', 'Ver servicios', 'Precios', 'Solo mirando'],
    cta: 'Reservar mi cita',
    stat: '67 citas · esta semana',
  },
]

function LandingMiniPreview({ sector, active }: { sector: typeof SECTORES[0]; active: boolean }) {
  return (
    <div style={{
      background: '#0b1120',
      borderRadius: '16px',
      padding: '20px',
      width: '300px',
      flexShrink: 0,
      border: active ? `1px solid ${sector.color}60` : '1px solid rgba(255,255,255,0.06)',
      transition: 'all 0.4s ease',
      transform: active ? 'scale(1.02)' : 'scale(1)',
      boxShadow: active ? `0 8px 32px ${sector.color}25` : 'none',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: `radial-gradient(circle, ${sector.color}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Nav mini */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: sector.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
          {sector.asesor[0]}
        </div>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{sector.asesor}</div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>{sector.empresa}</div>
        </div>
        <div style={{ marginLeft: 'auto', background: sector.color, borderRadius: '6px', padding: '3px 8px', fontSize: '9px', fontWeight: 700, color: '#fff' }}>
          Contactar
        </div>
      </div>

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${sector.color}40`,
        borderRadius: '100px', padding: '4px 10px', marginBottom: '12px',
      }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: '9px', color: '#e2e8f0', fontWeight: 600 }}>{sector.badge}</span>
      </div>

      {/* Título */}
      <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.02em' }}>
        {sector.titulo}
      </div>

      {/* Subtítulo */}
      <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
        {sector.subtitulo}
      </div>

      {/* Intent grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '12px' }}>
        {sector.opciones.map(op => (
          <div key={op} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px', padding: '5px 8px', fontSize: '8px', color: '#94a3b8', fontWeight: 500,
          }}>
            {op}
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ flex: 1, background: '#25D366', borderRadius: '8px', padding: '7px', fontSize: '9px', fontWeight: 700, color: '#fff', textAlign: 'center' }}>
          📱 {sector.cta}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px', fontSize: '9px', fontWeight: 600, color: '#cbd5e1', textAlign: 'center' }}>
          🤖 Chatear IA
        </div>
      </div>

      {/* Stat footer */}
      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: '9px', color: '#475569' }}>{sector.stat}</span>
      </div>
    </div>
  )
}

export function SectoresShowcase() {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx(i => (i + 1) % SECTORES.length)
    }, 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div id="sectores" style={{ background: '#0b1120', borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', padding: '5rem 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', marginBottom: '3rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.12em', color: '#FF6B2B', marginBottom: '1rem', textTransform: 'uppercase' }}>Sectores</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-.03em', color: '#fff', marginBottom: '.75rem' }}>
          Hecho para tu industria
        </h2>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,.55)', maxWidth: '520px', lineHeight: 1.7, fontWeight: 400 }}>
          Cada landing se adapta al lenguaje, los productos y el flujo de tu sector. Así se vería la tuya:
        </p>

        {/* Selector de sectores */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2rem' }}>
          {SECTORES.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setActiveIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: activeIdx === i ? s.color : 'rgba(255,255,255,0.06)',
                color: activeIdx === i ? '#fff' : 'rgba(255,255,255,0.5)',
                transform: activeIdx === i ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span>{s.icon}</span> {s.sector}
            </button>
          ))}
        </div>
      </div>

      {/* Preview activo — grande */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
          {/* Info del sector */}
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{SECTORES[activeIdx].icon}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: SECTORES[activeIdx].color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {SECTORES[activeIdx].sector}
            </div>
            <h3 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '12px' }}>
              {SECTORES[activeIdx].titulo}
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.65, marginBottom: '20px' }}>
              {SECTORES[activeIdx].subtitulo}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: '13px', color: '#475569' }}>{SECTORES[activeIdx].stat}</span>
            </div>
          </div>

          {/* Mini landing preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <LandingMiniPreview sector={SECTORES[activeIdx]} active={true} />
          </div>
        </div>
      </div>

      {/* Carrusel inferior — todas las previews */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: '16px', padding: '8px 2rem',
          animation: 'sectoresScroll 40s linear infinite',
          width: 'max-content',
        }}>
          {[...SECTORES, ...SECTORES].map((s, i) => (
            <LandingMiniPreview key={`${s.key}-${i}`} sector={s} active={activeIdx === i % SECTORES.length} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sectoresScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (max-width: 768px) {
          .sectores-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
