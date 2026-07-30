'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CREDITOS_CONFIG, creditosACop, formatearCop } from '@/lib/pulse/creditos-config'

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

  // Sistema monocromático (ver skill pulsemotor-design): azul para saldo sano y
  // para la alerta temprana, rojo solo para el estado crítico. Sin verde ni ámbar.
  const colorBarra   = esCritico ? '#e5484d' : '#2563EB'
  const colorTexto   = esCritico ? '#f2a3a5' : '#93b4fb'
  const bgBanner     = esCritico ? 'rgba(229,72,77,0.08)' : esBajo ? 'rgba(37,99,235,0.10)' : 'rgba(37,99,235,0.05)'
  const borderBanner = esCritico ? 'rgba(229,72,77,0.35)' : 'rgba(37,99,235,0.25)'

  const citasRestantes = Math.floor(saldo / CREDITOS_CONFIG.COSTO.CITA_AGENDADA)

  return (
    <>
      {/* Banner de créditos */}
      <div style={{ background: bgBanner, border: `1px solid ${borderBanner}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: FONT_BODY, marginBottom: '16px' }}>
        <div style={{ width: '9px', height: '9px', flexShrink: 0, background: esCritico ? '#e5484d' : '#2563EB' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
              Saldo · alcanza para {citasRestantes} cita{citasRestantes === 1 ? '' : 's'}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: colorTexto, fontFamily: FONT }}>
              {saldo.toLocaleString('es-CO')} créditos
            </span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${porcentaje}%`, background: colorBarra, borderRadius: '2px', transition: 'width .5s ease' }} />
          </div>
          {esCritico && <p style={{ fontSize: '11px', color: '#f2a3a5', marginTop: '5px' }}>No alcanza para cobrar la próxima cita — cargá saldo antes de que el agente se pause</p>}
          {esBajo    && <p style={{ fontSize: '11px', color: '#93b4fb', marginTop: '5px' }}>Conversar sigue siendo gratis; el saldo se usa al agendar o cerrar</p>}
        </div>
        {(esCritico || esBajo) && (
          <a href="/pulse/pricing" style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '6px', background: esCritico ? '#e5484d' : '#2563EB', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            Cargar saldo →
          </a>
        )}
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,15,26,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#14120F', border: '1px solid rgba(229,72,77,0.35)', borderRadius: '8px', padding: '40px', width: '100%', maxWidth: '460px', textAlign: 'center', boxShadow: '0 24px 48px rgba(0,0,0,0.45)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(229,72,77,0.12)', border: '2px solid #e5484d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 20px', color: '#e5484d' }}>●</div>
            <h2 style={{ fontFamily: FONT, fontSize: '22px', fontWeight: 800, color: '#F5F1E9', marginBottom: '10px' }}>Tu saldo se agotó</h2>
            <p style={{ fontSize: '15px', color: '#8A8578', lineHeight: 1.6, marginBottom: '8px' }}>
              Tu agente quedó en pausa y dejó de responder leads.
            </p>
            <p style={{ fontSize: '14px', color: '#8A8578', lineHeight: 1.6, marginBottom: '28px' }}>
              Cargá saldo para reactivarlo. Conversar no cuesta nada — se descuenta
              solo cuando un lead llega a test drive o se cierra la venta.
            </p>
            <a href="/pulse/pricing" style={{ display: 'block', padding: '14px', borderRadius: '6px', background: '#2563EB', color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', fontFamily: FONT, marginBottom: '12px' }}>
              Cargar saldo →
            </a>
            <p style={{ fontSize: '11px', color: '#8A8578' }}>Sin mensualidad · El saldo no vence · Pagás solo por resultado</p>
            <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '6px', textAlign: 'left' }}>
              <p style={{ fontSize: '11px', color: '#93b4fb', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cuánto te cuesta una cita</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#8A8578' }}>Cita agendada</span>
                <span style={{ color: '#F5F1E9', fontWeight: 700 }}>{formatearCop(creditosACop(CREDITOS_CONFIG.COSTO.CITA_AGENDADA))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: '#8A8578' }}>Venta cerrada</span>
                <span style={{ color: '#F5F1E9', fontWeight: 700 }}>{formatearCop(creditosACop(CREDITOS_CONFIG.COSTO.VENTA_CERRADA))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: '#F5F1E9', fontWeight: 600 }}>Mensajes y follow-up</span>
                <span style={{ color: '#2563EB', fontWeight: 800, fontFamily: FONT }}>$0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
