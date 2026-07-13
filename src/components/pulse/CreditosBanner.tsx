'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CREDITOS_CONFIG } from '@/lib/pulse/creditos-config'

const FONT      = "var(--font-inter), sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

interface CreditosData {
  saldo: number
  saldo_total: number
}

interface Props {
  onAgotado?: () => void
}

export default function CreditosBanner({ onAgotado }: Props) {
  const [creditos, setCreditos]       = useState<CreditosData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('pulse_creditos')
        .select('saldo, saldo_total')
        .eq('user_id', user.id)
        .single()

      const row = data as CreditosData | null
      if (row) {
        setCreditos(row)
        if (row.saldo <= 0) {
          setShowPaywall(true)
          onAgotado?.()
        }
      }
      setLoading(false)
    }

    cargar()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('creditos-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pulse_creditos',
      }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nuevo = (payload.new as any) as CreditosData
        setCreditos(nuevo)
        if (nuevo.saldo <= 0) {
          setShowPaywall(true)
          onAgotado?.()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [onAgotado])

  if (loading || !creditos) return null

  const { saldo, saldo_total } = creditos
  const porcentaje = Math.min(100, Math.round((saldo / Math.max(saldo_total, CREDITOS_CONFIG.BIENVENIDA)) * 100))
  const esCritico  = saldo <= CREDITOS_CONFIG.ALERTA_CRITICO
  const esBajo     = saldo <= CREDITOS_CONFIG.ALERTA_BAJO && !esCritico

  const colorBarra   = esCritico ? '#f87171' : esBajo ? '#fbbf24' : '#10b981'
  const colorTexto   = esCritico ? '#f87171' : esBajo ? '#fbbf24' : '#6ee7b7'
  const bgBanner     = esCritico ? 'rgba(248,113,113,0.06)' : esBajo ? 'rgba(251,191,36,0.06)' : 'rgba(16,185,129,0.04)'
  const borderBanner = esCritico ? 'rgba(248,113,113,0.2)'  : esBajo ? 'rgba(251,191,36,0.2)'  : 'rgba(16,185,129,0.12)'

  return (
    <>
      {/* Banner de créditos */}
      <div style={{ background: bgBanner, border: `1px solid ${borderBanner}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: FONT_BODY, marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', flexShrink: 0 }}>
          {esCritico ? '🔴' : esBajo ? '🟡' : '⚡'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Créditos disponibles</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: colorTexto, fontFamily: FONT }}>
              {saldo.toLocaleString('es-CO')} créditos
            </span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${porcentaje}%`, background: colorBarra, borderRadius: '2px', transition: 'width .5s ease' }} />
          </div>
          {esCritico && <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px' }}>⚠ Créditos casi agotados — activá tu plan para seguir sin interrupciones</p>}
          {esBajo    && <p style={{ fontSize: '11px', color: '#fbbf24', marginTop: '5px' }}>Créditos bajos — considerá activar el plan ilimitado</p>}
        </div>
        {(esCritico || esBajo) && (
          <a href="/pulse/pricing" style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '8px', background: esCritico ? 'linear-gradient(135deg,#f87171,#ef4444)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            Activar plan →
          </a>
        )}
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,15,26,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0d1b2e', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '460px', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>🔴</div>
            <h2 style={{ fontFamily: FONT, fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>Tus créditos se agotaron</h2>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '8px' }}>
              Usaste todos tus créditos gratuitos — eso significa que tu agente respondió activamente leads por vos. 🎉
            </p>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '28px' }}>
              Activá tu plan por <strong style={{ color: '#10b981' }}>$99.000/mes</strong> para responder leads ilimitados, sin interrupciones.
            </p>
            <a href="/pulse/pricing" style={{ display: 'block', padding: '15px', borderRadius: '12px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '16px', fontWeight: 700, textDecoration: 'none', fontFamily: FONT, boxShadow: '0 4px 20px rgba(16,185,129,0.35)', marginBottom: '12px' }}>
              Activar plan — $99.000/mes →
            </a>
            <p style={{ fontSize: '11px', color: '#334155' }}>Sin tarjeta para empezar · Cancelás cuando querás · Garantía 7 días</p>
            <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>El math</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>1 venta extra recuperada</span>
                <span style={{ color: '#6ee7b7', fontWeight: 700 }}>+$500.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Pulse Motor / mes</span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>−$99.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Tu ganancia neta</span>
                <span style={{ color: '#10b981', fontWeight: 800, fontFamily: FONT }}>+$401.000</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
