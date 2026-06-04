// Ruta destino: src/app/pulse/pipeline/page.tsx
// REEMPLAZA el archivo actual.
//
// Mismo pipeline Kanban pero envuelto en PulseAppShell.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'
import { PulsePipelineKanban, type PulseLead } from '@/components/pulse/PulsePipelineKanban'

export default function PulsePipelinePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; nombre: string; email: string } | null>(null)
  const [leads, setLeads] = useState<PulseLead[]>([])
  const [loading, setLoading] = useState(true)
  const [showNuevoLead, setShowNuevoLead] = useState(false)
  const [textoNuevoLead, setTextoNuevoLead] = useState('')
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/pulse/login')
        return
      }
      setUser({
        id: authUser.id,
        nombre: (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'Vendedor',
        email: authUser.email || '',
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
        // Disparar trigger después de cerrar modal
        if (data.lead?.id) {
          setTimeout(() => {
            fetch('/api/pulse/leads/trigger', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lead_id: data.lead.id }),
            }).catch(e => console.error('trigger error:', e))
          }, 500)
        }
      }
    } catch (e) {
      console.error('crear lead:', e)
    } finally {
      setCreando(false)
    }
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <PulseAppShell userName={user.nombre} userEmail={user.email}>
      <div style={{ padding: '24px' }}>
        {/* Heading + acción */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              Pipeline
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Arrastrá leads entre columnas para mover su estado.
            </p>
          </div>
          <button onClick={() => setShowNuevoLead(true)} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nuevo lead
          </button>
        </div>

        {loading ? (
          <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '60px' }}>Cargando pipeline...</p>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '14px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '15px', color: '#cbd5e1', margin: '0 0 6px' }}>No tenés leads todavía</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>Click en &quot;+ Nuevo lead&quot; para empezar</p>
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
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowNuevoLead(false)} disabled={creando} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={crearLead} disabled={creando || !textoNuevoLead.trim()} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: creando || !textoNuevoLead.trim() ? '#475569' : 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: creando || !textoNuevoLead.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {creando ? 'Guardando...' : 'Guardar lead'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PulseAppShell>
  )
}
