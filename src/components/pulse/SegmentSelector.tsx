'use client'

import { useState } from 'react'

export function SegmentSelector() {
  const [elegido, setElegido] = useState<'asesor' | 'concesionario' | null>(null)
  const [showModal, setShowModal] = useState(false)

  const pickConcesionario = () => {
    setElegido('concesionario')
    setShowModal(true)
  }

  const pickAsesor = () => {
    setElegido('asesor')
    setTimeout(() => {
      document.getElementById('pm-hero-headline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const cerrar = () => {
    setShowModal(false)
    setElegido(null)
  }

  const base: React.CSSProperties = {
    borderRadius: '18px', padding: 0, cursor: 'pointer', textAlign: 'left',
    position: 'relative', overflow: 'hidden', width: '100%',
    background: 'transparent', border: 'none', outline: 'none',
  }

  const inner = (active: boolean, color: 'b' | 'a'): React.CSSProperties => ({
    borderRadius: '18px', padding: '28px', position: 'relative', zIndex: 1,
    background: active
      ? (color === 'b' ? 'rgba(16,185,129,0.06)' : 'rgba(14,165,233,0.06)')
      : 'rgba(255,255,255,0.03)',
    border: active
      ? (color === 'b' ? '1.5px solid rgba(16,185,129,0.7)' : '1.5px solid rgba(14,165,233,0.7)')
      : '1px solid rgba(255,255,255,0.07)',
    transition: 'all .2s',
  })

  const icnStyle = (active: boolean, color: 'b' | 'a'): React.CSSProperties => ({
    width: '52px', height: '52px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1.25rem', position: 'relative',
    background: active
      ? (color === 'b' ? 'rgba(16,185,129,0.18)' : 'rgba(14,165,233,0.18)')
      : (color === 'b' ? 'rgba(16,185,129,0.08)' : 'rgba(14,165,233,0.08)'),
    border: `1px solid ${active
      ? (color === 'b' ? 'rgba(16,185,129,0.5)' : 'rgba(14,165,233,0.5)')
      : (color === 'b' ? 'rgba(16,185,129,0.15)' : 'rgba(14,165,233,0.15)')}`,
    animation: active ? (color === 'b' ? 'pulseG 2s ease-in-out infinite' : 'pulseB 2s ease-in-out infinite') : 'none',
  })

  const tagStyle = (active: boolean, color: 'b' | 'a'): React.CSSProperties => ({
    fontSize: '11px', fontWeight: 600,
    color: color === 'b' ? '#6ee7b7' : '#7dd3fc',
    background: active
      ? (color === 'b' ? 'rgba(16,185,129,0.18)' : 'rgba(14,165,233,0.18)')
      : (color === 'b' ? 'rgba(16,185,129,0.08)' : 'rgba(14,165,233,0.08)'),
    border: `1px solid ${active
      ? (color === 'b' ? 'rgba(16,185,129,0.4)' : 'rgba(14,165,233,0.4)')
      : (color === 'b' ? 'rgba(16,185,129,0.2)' : 'rgba(14,165,233,0.2)')}`,
    borderRadius: '6px', padding: '3px 9px', transition: 'all .2s',
  })

  const cornerColor = (active: boolean, color: 'b' | 'a') =>
    active ? (color === 'b' ? 'rgba(16,185,129,0.5)' : 'rgba(14,165,233,0.5)') : 'transparent'

  const corners = (active: boolean, color: 'b' | 'a') => (
    <>
      {[
        { top: '7px', left: '7px', borderTop: `1.5px solid ${cornerColor(active, color)}`, borderLeft: `1.5px solid ${cornerColor(active, color)}`, borderRadius: '3px 0 0 0' },
        { top: '7px', right: '7px', borderTop: `1.5px solid ${cornerColor(active, color)}`, borderRight: `1.5px solid ${cornerColor(active, color)}`, borderRadius: '0 3px 0 0' },
        { bottom: '7px', left: '7px', borderBottom: `1.5px solid ${cornerColor(active, color)}`, borderLeft: `1.5px solid ${cornerColor(active, color)}`, borderRadius: '0 0 0 3px' },
        { bottom: '7px', right: '7px', borderBottom: `1.5px solid ${cornerColor(active, color)}`, borderRight: `1.5px solid ${cornerColor(active, color)}`, borderRadius: '0 0 3px 0' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: '12px', height: '12px', transition: 'border-color .3s', pointerEvents: 'none', zIndex: 3, ...s }} />
      ))}
    </>
  )

  return (
    <>
      <style>{`
        @keyframes pulseG{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.35)}50%{box-shadow:0 0 0 10px rgba(16,185,129,0)}}
        @keyframes pulseB{0%,100%{box-shadow:0 0 0 0 rgba(14,165,233,0.35)}50%{box-shadow:0 0 0 10px rgba(14,165,233,0)}}
        @keyframes scanG{0%{transform:translateY(-100%);opacity:.5}100%{transform:translateY(300%);opacity:0}}
        @keyframes scanB{0%{transform:translateY(-100%);opacity:.5}100%{transform:translateY(300%);opacity:0}}
        @keyframes dotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
        @keyframes badgePop{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}
      `}</style>

      <div style={{ width: '100%', padding: '2.5rem 0 1.5rem' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#475569', textAlign: 'center', marginBottom: '1.5rem' }}>
          Antes de continuar
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>

          {/* ── CONCESIONARIO (izquierda) ── */}
          <button onClick={pickConcesionario} style={base}
            onMouseEnter={e => { if (elegido !== 'concesionario') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (elegido !== 'concesionario') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
          >
            {elegido === 'concesionario' && (
              <div style={{ position: 'absolute', left: 0, right: 0, height: '80px', background: 'linear-gradient(180deg,transparent,rgba(16,185,129,0.1),transparent)', animation: 'scanG 2.2s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
            )}
            {corners(elegido === 'concesionario', 'b')}
            <div className="seg-inner" style={inner(elegido === 'concesionario', 'b')}>
              <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#6ee7b7', background: elegido === 'concesionario' ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.12)', border: `1px solid ${elegido === 'concesionario' ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '6px', padding: '2px 9px', animation: 'badgePop .4s ease both' }}>Nuevo</div>
              <div style={icnStyle(elegido === 'concesionario', 'b')}>
                <span style={{ fontSize: '22px' }}>🏢</span>
                {elegido === 'concesionario' && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', position: 'absolute', top: '6px', right: '6px', animation: 'dotPulse 1.2s ease-in-out infinite' }} />}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px', fontFamily: "'Syne',sans-serif", letterSpacing: '-.2px' }}>Soy el concesionario</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '1rem' }}>Visibilidad 360° del negocio: inventario, retomas, financiación, pólizas y accesorios.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['DataBridge 360', 'Todos los asesores', 'BI en tiempo real'].map(t => (
                  <span key={t} style={tagStyle(elegido === 'concesionario', 'b')}>{t}</span>
                ))}
              </div>
              {elegido === 'concesionario' && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#6ee7b7' }}>→ Ver detalle</div>}
            </div>
          </button>

          {/* ── ASESOR (derecha) ── */}
          <button onClick={pickAsesor} style={base}
            onMouseEnter={e => { if (elegido !== 'asesor') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (elegido !== 'asesor') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
          >
            {elegido === 'asesor' && (
              <div style={{ position: 'absolute', left: 0, right: 0, height: '80px', background: 'linear-gradient(180deg,transparent,rgba(14,165,233,0.1),transparent)', animation: 'scanB 2.2s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
            )}
            {corners(elegido === 'asesor', 'a')}
            <div className="seg-inner" style={inner(elegido === 'asesor', 'a')}>
              <div style={icnStyle(elegido === 'asesor', 'a')}>
                <span style={{ fontSize: '22px' }}>👤</span>
                {elegido === 'asesor' && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0ea5e9', position: 'absolute', top: '6px', right: '6px', animation: 'dotPulse 1.2s ease-in-out infinite' }} />}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px', fontFamily: "'Syne',sans-serif", letterSpacing: '-.2px' }}>Soy asesor de ventas</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '1rem' }}>Un agente IA en mi WhatsApp que responde leads mientras trabajo en el concesionario.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['WhatsApp propio', 'Follow-up automático', '$99k/mes'].map(t => (
                  <span key={t} style={tagStyle(elegido === 'asesor', 'a')}>{t}</span>
                ))}
              </div>
              {elegido === 'asesor' && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#7dd3fc' }}>↓ Ver más abajo</div>}
            </div>
          </button>
        </div>
      </div>

      {/* Modal DataBridge 360 */}
      {showModal && (
        <div onClick={cerrar} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,15,26,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d1b2e', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={cerrar} aria-label="Cerrar" style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '30px', height: '30px', color: '#64748b', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>×</button>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#10b981', marginBottom: '6px' }}>Para el concesionario</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', fontFamily: "'Syne',sans-serif", marginBottom: '10px', letterSpacing: '-.3px' }}>DataBridge 360</p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem' }}>Un tablero único que conecta todas las líneas de negocio del concesionario en tiempo real.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '1.25rem' }}>
              {[
                { icon: '🚗', name: 'Vehículos nuevos', sub: 'Inventario, reservas y asignaciones' },
                { icon: '🔄', name: 'Retomas', sub: 'Usados, avalúos y oportunidades' },
                { icon: '🏦', name: 'Financiación', sub: 'Solicitudes, bancos y aprobaciones' },
                { icon: '🛡️', name: 'Pólizas', sub: 'Colisión, todo riesgo y renovaciones' },
                { icon: '🔧', name: 'Accesorios', sub: 'Stock, ventas cruzadas y comisiones' },
                { icon: '📊', name: 'Analítica', sub: 'Métricas por asesor y línea' },
              ].map(m => (
                <div key={m.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '16px', marginBottom: '5px' }}>{m.icon}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '3px', fontFamily: "'Syne',sans-serif" }}>{m.name}</div>
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
            <a href="mailto:hola@pulsemotor.co?subject=Quiero DataBridge 360 para mi concesionario" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontFamily: "'Syne',sans-serif", marginBottom: '8px' }}>
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
