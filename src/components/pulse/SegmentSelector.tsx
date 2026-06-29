'use client'

import { useState } from 'react'

export function SegmentSelector() {
  const [elegido, setElegido] = useState<'asesor' | 'concesionario' | null>(null)
  const [showModal, setShowModal] = useState(false)

  const pickAsesor = () => {
    setElegido('asesor')
    setTimeout(() => {
      document.getElementById('pm-hero-headline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const pickConcesionario = () => {
    setElegido('concesionario')
    setShowModal(true)
  }

  const cerrar = () => {
    setShowModal(false)
    setElegido(null)
  }

  const cardBase: React.CSSProperties = {
    borderRadius: '16px',
    padding: '28px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color .15s, background .15s',
    position: 'relative',
    width: '100%',
    fontFamily: "'DM Sans', sans-serif",
  }

  return (
    <>
      <div style={{ width: '100%', padding: '2rem 0 1rem' }}>

        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: '#64748b', textAlign: 'center', marginBottom: '1.25rem' }}>
          Antes de continuar
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>

          {/* Card Asesor */}
          <button
            onClick={pickAsesor}
            style={{
              ...cardBase,
              background: elegido === 'asesor' ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.03)',
              border: elegido === 'asesor' ? '1.5px solid rgba(14,165,233,0.5)' : '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => { if (elegido !== 'asesor') { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
            onMouseLeave={e => { if (elegido !== 'asesor') { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '1.1rem' }}>👤</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px', fontFamily: "'Syne', sans-serif" }}>Soy asesor de ventas</div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '1rem' }}>Quiero un agente IA en mi WhatsApp que responda leads mientras trabajo en el concesionario.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['WhatsApp propio', 'Follow-up automático', '$99k/mes'].map(t => (
                <span key={t} style={{ fontSize: '11px', fontWeight: 600, color: '#7dd3fc', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '6px', padding: '3px 9px' }}>{t}</span>
              ))}
            </div>
            {elegido === 'asesor' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '12px', fontSize: '12px', fontWeight: 600, color: '#7dd3fc' }}>
                ↓ Ver más abajo
              </div>
            )}
          </button>

          {/* Card Concesionario */}
          <button
            onClick={pickConcesionario}
            style={{
              ...cardBase,
              background: elegido === 'concesionario' ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
              border: elegido === 'concesionario' ? '1.5px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => { if (elegido !== 'concesionario') { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
            onMouseLeave={e => { if (elegido !== 'concesionario') { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}
          >
            <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#6ee7b7', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '2px 8px' }}>Nuevo</div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '1.1rem' }}>🏢</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px', fontFamily: "'Syne', sans-serif" }}>Soy el concesionario</div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '1rem' }}>Quiero visibilidad 360° del negocio: inventario, retomas, financiación, pólizas y accesorios.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['DataBridge 360', 'Todos los asesores', 'BI en tiempo real'].map(t => (
                <span key={t} style={{ fontSize: '11px', fontWeight: 600, color: '#6ee7b7', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '3px 9px' }}>{t}</span>
              ))}
            </div>
            {elegido === 'concesionario' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '12px', fontSize: '12px', fontWeight: 600, color: '#6ee7b7' }}>
                → Ver detalle
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Modal DataBridge 360 */}
      {showModal && (
        <div
          onClick={cerrar}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,15,26,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#0d1b2e', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
          >
            <button onClick={cerrar} aria-label="Cerrar" style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '30px', height: '30px', color: '#64748b', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>×</button>

            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#10b981', marginBottom: '6px' }}>Para el concesionario</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', fontFamily: "'Syne', sans-serif", marginBottom: '10px', letterSpacing: '-.3px' }}>DataBridge 360</p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem' }}>Un tablero único que conecta todas las líneas de negocio del concesionario en tiempo real.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '1.25rem' }}>
              {[
                { icon: '🚗', name: 'Vehículos nuevos', sub: 'Inventario, reservas y asignaciones' },
                { icon: '🔄', name: 'Retomas',          sub: 'Usados, avalúos y oportunidades' },
                { icon: '🏦', name: 'Financiación',     sub: 'Solicitudes, bancos y aprobaciones' },
                { icon: '🛡️', name: 'Pólizas',          sub: 'Colisión, todo riesgo y renovaciones' },
                { icon: '🔧', name: 'Accesorios',       sub: 'Stock, ventas cruzadas y comisiones' },
                { icon: '📊', name: 'Analítica',        sub: 'Métricas por asesor y línea' },
              ].map(m => (
                <div key={m.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '16px', marginBottom: '5px' }}>{m.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '3px', fontFamily: "'Syne', sans-serif" }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: '10px', padding: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚡</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#7dd3fc', marginBottom: '3px' }}>Agente WhatsApp incluido para cada asesor</div>
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>Responde leads en 30 segundos desde el número personal de cada asesor. Sin SIM nueva.</div>
              </div>
            </div>

            <a href="mailto:hola@pulsemotor.co?subject=Quiero DataBridge 360 para mi concesionario" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: "'Syne', sans-serif", marginBottom: '8px' }}>
              Solicitar demo →
            </a>
            <button onClick={cerrar} style={{ display: 'block', width: '100%', padding: '11px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Soy asesor, ver mi plan
            </button>
            <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', marginTop: '10px' }}>Precio a la medida · Sin compromiso · Demo en 48 horas</p>
          </div>
        </div>
      )}
    </>
  )
}
