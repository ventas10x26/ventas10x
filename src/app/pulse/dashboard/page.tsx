// Ruta destino: src/app/pulse/dashboard/page.tsx
//
// Dashboard de Pulse Motor:
// - Lista de leads del vendedor
// - Botón "+ Nuevo lead"
// - Métrica simple de tiempo de respuesta (placeholder hasta semana 5)

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  nombre: string | null
  telefono: string | null
  modelo: string | null
  score: number | null
  estado: string
  texto_origen: string
  canal: string | null
  capturado_at: string
  contactado_at: string | null
  created_at: string
}

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  nuevo: { label: 'Nuevo', color: '#f97316' },
  contactado: { label: 'Contactado', color: '#3b82f6' },
  test_drive: { label: 'Test Drive', color: '#a855f7' },
  cerrado: { label: 'Cerrado', color: '#22c55e' },
  perdido: { label: 'Perdido', color: '#64748b' },
}

export default function PulseDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; nombre: string } | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [showNuevoLead, setShowNuevoLead] = useState(false)
  const [textoNuevoLead, setTextoNuevoLead] = useState('')
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/pulse/signup')
        return
      }
      setUser({
        id: authUser.id,
        nombre: (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'Vendedor',
      })
      await cargarLeads()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pulse/leads')
      const data = await res.json()
      if (data.ok) {
        setLeads(data.leads || [])
      }
    } catch (e) {
      console.error('cargar leads:', e)
    } finally {
      setLoading(false)
    }
  }

  const crearLead = async () => {
    if (!textoNuevoLead.trim() || textoNuevoLead.trim().length < 10) return
    setCreando(true)
    try {
      const res = await fetch('/api/pulse/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto_origen: textoNuevoLead.trim(),
          canal: 'otro',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setTextoNuevoLead('')
        setShowNuevoLead(false)
        await cargarLeads()
      }
    } catch (e) {
      console.error('crear lead:', e)
    } finally {
      setCreando(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/pulse')
  }

  const leadsFiltrados =
    filtroEstado === 'todos' ? leads : leads.filter((l) => l.estado === filtroEstado)

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1100px',
          margin: '0 auto',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              fontWeight: 800,
            }}
          >
            ⚡
          </div>
          <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Pulse Motor
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            Hola, {user.nombre.split(' ')[0]}
          </span>
          <button
            onClick={logout}
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              fontFamily: 'inherit',
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Métricas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          <div style={metricCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              Leads totales
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{leads.length}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              Sin contactar
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fdba74' }}>
              {leads.filter((l) => l.estado === 'nuevo').length}
            </div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              En seguimiento
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa' }}>
              {leads.filter((l) => l.estado === 'contactado' || l.estado === 'test_drive').length}
            </div>
          </div>
          <div style={metricCardStyle}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              Cerrados
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#4ade80' }}>
              {leads.filter((l) => l.estado === 'cerrado').length}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['todos', 'nuevo', 'contactado', 'test_drive', 'cerrado', 'perdido'].map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: filtroEstado === e ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                  color: filtroEstado === e ? '#fdba74' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {e === 'todos' ? 'Todos' : ESTADO_LABELS[e]?.label || e}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNuevoLead(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Nuevo lead
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
            Cargando leads...
          </p>
        ) : leadsFiltrados.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '14px',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 6px' }}>
              {filtroEstado === 'todos' ? 'No tenés leads todavía' : 'No hay leads en este estado'}
            </p>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0' }}>
              {filtroEstado === 'todos' && 'Click en "+ Nuevo lead" para empezar'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leadsFiltrados.map((lead) => {
              const estado = ESTADO_LABELS[lead.estado] || ESTADO_LABELS.nuevo
              return (
                <div
                  key={lead.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '15px', color: '#fff' }}>
                        {lead.nombre || 'Sin nombre'}
                      </strong>
                      {lead.modelo && (
                        <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                          · {lead.modelo}
                        </span>
                      )}
                      {lead.telefono && (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          · {lead.telefono}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '999px',
                        background: `${estado.color}22`,
                        color: estado.color,
                      }}
                    >
                      {estado.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0', lineHeight: '1.5' }}>
                    {lead.texto_origen.length > 140
                      ? lead.texto_origen.substring(0, 140) + '...'
                      : lead.texto_origen}
                  </p>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(lead.created_at).toLocaleString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal nuevo lead */}
        {showNuevoLead && (
          <div
            onClick={() => !creando && setShowNuevoLead(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '520px',
                width: '100%',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
                Nuevo lead
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
                Pegá el texto del lead. La IA va a extraer los datos automáticamente.
              </p>
              <textarea
                value={textoNuevoLead}
                onChange={(e) => setTextoNuevoLead(e.target.value)}
                placeholder="Ej: Andrea Gómez, +57 311 234 5678, pregunta por la Seltos 2026 desde Mercado Libre..."
                rows={5}
                disabled={creando}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowNuevoLead(false)}
                  disabled={creando}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={crearLead}
                  disabled={creando || !textoNuevoLead.trim()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      creando || !textoNuevoLead.trim()
                        ? '#475569'
                        : 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: creando || !textoNuevoLead.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {creando ? 'Guardando...' : 'Guardar lead'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const metricCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '14px 16px',
}
