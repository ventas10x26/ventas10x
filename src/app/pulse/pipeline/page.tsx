// Ruta destino: src/app/pulse/pipeline/page.tsx
//
// Página del pipeline Kanban de Pulse Motor.
// Carga leads del vendedor y los pasa al componente Kanban.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PulsePipelineKanban, type PulseLead } from '@/components/pulse/PulsePipelineKanban'

export default function PulsePipelinePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; nombre: string } | null>(null)
  const [leads, setLeads] = useState<PulseLead[]>([])
  const [loading, setLoading] = useState(true)
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
      if (data.ok) setLeads(data.leads || [])
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
        body: JSON.stringify({ texto_origen: textoNuevoLead.trim(), canal: 'otro' }),
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

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1400px', margin: '0 auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 800 }}>⚡</div>
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.5px' }}>Pulse Motor</span>
          </div>
          <nav style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
            <a href="/pulse/dashboard" style={navLinkStyle(false)}>Lista</a>
            <a href="/pulse/pipeline" style={navLinkStyle(true)}>Pipeline</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setShowNuevoLead(true)} style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nuevo lead
          </button>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Hola, {user.nombre.split(' ')[0]}</span>
          <button onClick={logout} style={{ fontSize: '12px', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit' }}>Salir</button>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '60px' }}>
            Cargando pipeline...
          </p>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '14px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '15px', color: '#cbd5e1', margin: '0 0 6px' }}>No tenés leads todavía</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>Click en "+ Nuevo lead" para empezar</p>
            <button onClick={() => setShowNuevoLead(true)} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Crear mi primer lead
            </button>
          </div>
        ) : (
          <PulsePipelineKanban
            initialLeads={leads}
            userId={user.id}
            onLeadUpdated={cargarLeads}
          />
        )}

        {/* Modal nuevo lead */}
        {showNuevoLead && (
          <div onClick={() => !creando && setShowNuevoLead(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 50 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '100%' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>Nuevo lead</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>Pegá el texto del lead. La IA va a extraer los datos automáticamente.</p>
              <textarea
                value={textoNuevoLead}
                onChange={(e) => setTextoNuevoLead(e.target.value)}
                placeholder="Ej: Andrea Gómez, +57 311 234 5678, pregunta por la Seltos 2026..."
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
                <button onClick={() => setShowNuevoLead(false)} disabled={creando} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button
                  onClick={crearLead}
                  disabled={creando || !textoNuevoLead.trim()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: creando || !textoNuevoLead.trim() ? '#475569' : 'linear-gradient(135deg, #f97316, #ea580c)',
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

function navLinkStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    color: active ? '#fdba74' : '#94a3b8',
    background: active ? 'rgba(249,115,22,0.1)' : 'transparent',
    borderRadius: '8px',
    textDecoration: 'none',
  }
}
