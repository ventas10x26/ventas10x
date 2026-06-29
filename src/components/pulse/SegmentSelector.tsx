// Componente: SegmentSelector
// Se inserta justo después del badge del hero, antes del h1
// Cuando el usuario elige "asesor" → scroll suave al h1 existente
// Cuando elige "concesionario" → muestra overlay con info DataBridge 360

'use client'

import { useState } from 'react'

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

export function SegmentSelector() {
  const [elegido, setElegido] = useState<'asesor' | 'concesionario' | null>(null)
  const [showConcesionario, setShowConcesionario] = useState(false)

  const elegirAsesor = () => {
    setElegido('asesor')
    setTimeout(() => {
      document.getElementById('pm-hero-headline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const elegirConcesionario = () => {
    setElegido('concesionario')
    setShowConcesionario(true)
  }

  return (
    <>
      {/* ── Split selector ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        maxWidth: '640px',
        margin: '0 auto 36px',
        position: 'relative',
        zIndex: 2,
      }}>

        {/* Card Asesor */}
        <button
          onClick={elegirAsesor}
          style={{
            background: elegido === 'asesor'
              ? 'rgba(14,165,233,0.12)'
              : 'rgba(255,255,255,0.03)',
            border: elegido === 'asesor'
              ? '1.5px solid rgba(14,165,233,0.5)'
              : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px 18px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all .2s',
            fontFamily: FONT_BODY,
          }}
          onMouseEnter={e => {
            if (elegido !== 'asesor') {
              e.currentTarget.style.border = '1px solid rgba(14,165,233,0.3)'
              e.currentTarget.style.background = 'rgba(14,165,233,0.06)'
            }
          }}
          onMouseLeave={e => {
            if (elegido !== 'asesor') {
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            }
          }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', marginBottom: '12px',
          }}>👤</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '5px', fontFamily: FONT }}>
            Soy asesor de ventas
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' }}>
            Quiero un agente IA en mi WhatsApp que responda leads mientras trabajo.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {['WhatsApp propio', 'Follow-up auto', '$99k/mes'].map(t => (
              <span key={t} style={{
                fontSize: '10px', fontWeight: 600, color: '#7dd3fc',
                background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)',
                borderRadius: '6px', padding: '2px 7px',
              }}>{t}</span>
            ))}
          </div>
          {elegido === 'asesor' && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#0ea5e9', fontWeight: 600 }}>
              ↓ Seguí leyendo abajo
            </div>
          )}
        </button>

        {/* Card Concesionario */}
        <button
          onClick={elegirConcesionario}
          style={{
            background: elegido === 'concesionario'
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(255,255,255,0.03)',
            border: elegido === 'concesionario'
              ? '2px solid rgba(16,185,129,0.5)'
              : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px 18px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all .2s',
            fontFamily: FONT_BODY,
            position: 'relative',
          }}
          onMouseEnter={e => {
            if (elegido !== 'concesionario') {
              e.currentTarget.style.border = '1px solid rgba(16,185,129,0.3)'
              e.currentTarget.style.background = 'rgba(16,185,129,0.06)'
            }
          }}
          onMouseLeave={e => {
            if (elegido !== 'concesionario') {
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            }
          }}
        >
          {/* Badge Nuevo */}
          <div style={{
            position: 'absolute', top: '-10px', right: '14px',
            background: 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff', fontSize: '10px', fontWeight: 700,
            padding: '3px 10px', borderRadius: '999px', letterSpacing: '0.5px',
          }}>NUEVO</div>

          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', marginBottom: '12px',
          }}>🏢</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '5px', fontFamily: FONT }}>
            Soy el concesionario
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' }}>
            Quiero visibilidad 360° del negocio: inventario, retomas, financiación, pólizas y accesorios.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {['DataBridge 360', 'Todos los asesores', 'BI en tiempo real'].map(t => (
              <span key={t} style={{
                fontSize: '10px', fontWeight: 600, color: '#6ee7b7',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: '6px', padding: '2px 7px',
              }}>{t}</span>
            ))}
          </div>
          {elegido === 'concesionario' && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
              → Abriendo información…
            </div>
          )}
        </button>
      </div>

      {/* ── Modal DataBridge 360 ── */}
      {showConcesionario && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(8,15,26,0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setShowConcesionario(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d1b2e',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '24px',
              padding: '40px',
              width: '100%', maxWidth: '580px',
              maxHeight: '90vh', overflowY: 'auto',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowConcesionario(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', width: '32px', height: '32px',
                color: '#64748b', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_BODY,
              }}
            >×</button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg,#10b981,#0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0,
              }}>📊</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Para el concesionario</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', fontFamily: FONT, letterSpacing: '-.3px', lineHeight: 1.1 }}>DataBridge 360</div>
              </div>
            </div>

            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.7, marginBottom: '28px' }}>
              Visibilidad total del negocio automotriz en un solo tablero. Inventario, retomas, financiación, pólizas y accesorios — todo conectado, en tiempo real.
            </p>

            {/* Módulos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
              {[
                { icon: '🚗', title: 'Vehículos nuevos', desc: 'Inventario disponible, reservas y asignaciones en tiempo real' },
                { icon: '🔄', title: 'Retomas', desc: 'Gestión de usados, avalúos y oportunidades de negociación' },
                { icon: '🏦', title: 'Financiación', desc: 'Estado de solicitudes, bancos, tasas y aprobaciones' },
                { icon: '🛡️', title: 'Pólizas colisión', desc: 'Seguimiento de coberturas activas por cliente y vehículo' },
                { icon: '☂️', title: 'Pólizas todo riesgo', desc: 'Renovaciones, vencimientos y alertas automáticas' },
                { icon: '🔧', title: 'Accesorios', desc: 'Ventas cruzadas, stock y comisiones por asesor' },
              ].map(m => (
                <div key={m.title} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', padding: '14px',
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{m.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px', fontFamily: FONT }}>{m.title}</div>
                  <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Incluye agentes para asesores */}
            <div style={{
              background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.18)',
              borderRadius: '12px', padding: '16px', marginBottom: '24px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>⚡</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#7dd3fc', marginBottom: '4px' }}>
                  Incluye agente IA WhatsApp para cada asesor
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                  Cada asesor de tu equipo tiene su propio agente respondiendo leads en 30 segundos. Todo bajo el mismo plan.
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="mailto:hola@pulsemotor.co?subject=Quiero DataBridge 360 para mi concesionario"
                style={{
                  display: 'block', padding: '15px', borderRadius: '12px',
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  color: '#fff', fontSize: '15px', fontWeight: 700,
                  textDecoration: 'none', textAlign: 'center', fontFamily: FONT,
                  boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
                }}
              >
                Solicitar demo para mi concesionario →
              </a>
              <button
                onClick={() => setShowConcesionario(false)}
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', padding: '12px', color: '#64748b',
                  fontSize: '14px', cursor: 'pointer', fontFamily: FONT_BODY,
                }}
              >
                Soy asesor, ver mi plan →
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#1e293b', textAlign: 'center', marginTop: '12px' }}>
              Precio a la medida según número de asesores · Demo sin compromiso
            </p>
          </div>
        </div>
      )}
    </>
  )
}
