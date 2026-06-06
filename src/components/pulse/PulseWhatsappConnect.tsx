// src/components/pulse/PulseWhatsappConnect.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'

type EstadoConexion = 'loading' | 'no_instance' | 'qr_ready' | 'connected' | 'error'

type Props = {
  email: string
  onConnected?: (phone: string) => void
  onEstadoChange?: (conectado: boolean) => void  // ← nuevo: notifica al padre
}

export function PulseWhatsappConnect({ email, onConnected, onEstadoChange }: Props) {
  const [estado, setEstado] = useState<EstadoConexion>('loading')
  const [qr, setQr] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)
  const [polling, setPolling] = useState(false)

  const verificarEstado = useCallback(async () => {
    try {
      const res = await fetch(`/api/pulse/whatsapp/instance?email=${encodeURIComponent(email)}`)
      const data = await res.json()

      if (data.connected) {
        setEstado('connected')
        setPhone(data.phone)
        setQr(null)
        onConnected?.(data.phone)
        onEstadoChange?.(true)
        return true
      }

      if (data.status === 'qr_ready' && data.qr) {
        setEstado('qr_ready')
        setQr(data.qr)
        setPairingCode(data.pairingCode)
      } else if (data.status === 'no_instance') {
        setEstado('no_instance')
      }

      onEstadoChange?.(false)
      return false
    } catch {
      setError('Error al verificar estado')
      setEstado('error')
      onEstadoChange?.(false)
      return false
    }
  }, [email, onConnected, onEstadoChange])

  useEffect(() => { verificarEstado() }, [verificarEstado])

  useEffect(() => {
    if (estado !== 'qr_ready') { setPolling(false); return }
    setPolling(true)
    const interval = setInterval(async () => {
      const conectado = await verificarEstado()
      if (conectado) clearInterval(interval)
    }, 4000)
    return () => clearInterval(interval)
  }, [estado, verificarEstado])

  const conectar = async () => {
    setCreando(true)
    setError('')
    try {
      const res = await fetch('/api/pulse/whatsapp/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.qr) {
        setQr(data.qr)
        setPairingCode(data.pairingCode)
        setEstado('qr_ready')
      } else {
        await verificarEstado()
      }
    } catch {
      setError('No se pudo crear la conexión')
      setEstado('error')
    } finally {
      setCreando(false)
    }
  }

  const desconectar = async () => {
    if (!confirm('¿Desconectar WhatsApp? El bot dejará de responder automáticamente.')) return
    await fetch(`/api/pulse/whatsapp/instance?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
    setEstado('no_instance')
    setQr(null)
    setPhone(null)
    onEstadoChange?.(false)
  }

  const C = { blue: '#0ea5e9', green: '#10b981', gradBtn: 'linear-gradient(135deg, #0ea5e9, #059669)' }

  return (
    <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>📱</span>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#fff' }}>Conexión WhatsApp</h2>
        <span style={{
          fontSize: 9, fontWeight: 800,
          color: estado === 'connected' ? '#10b981' : '#f97316',
          background: estado === 'connected' ? 'rgba(16,185,129,0.12)' : 'rgba(249,115,22,0.12)',
          border: `1px solid ${estado === 'connected' ? 'rgba(16,185,129,0.3)' : 'rgba(249,115,22,0.3)'}`,
          padding: '4px 10px', borderRadius: 999,
        }}>
          {estado === 'connected' ? 'CONECTADO' : estado === 'qr_ready' ? 'ESPERANDO QR' : estado === 'loading' ? 'CARGANDO' : 'DESCONECTADO'}
        </span>
      </div>

      {estado === 'connected' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>WhatsApp conectado ✓</p>
              {phone && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{phone}</p>}
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>El bot responde automáticamente a tus leads</p>
            </div>
          </div>
          <button onClick={desconectar} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Desconectar
          </button>
        </div>
      )}

      {estado === 'no_instance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Conecta tu WhatsApp actual para que el agente IA responda automáticamente a tus leads.{' '}
            <strong style={{ color: '#e2e8f0' }}>Sin número nuevo, sin SIM card</strong> — solo escaneas un QR desde tu teléfono.
          </p>
          <button onClick={conectar} disabled={creando} style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 10, border: 'none', background: C.gradBtn, color: '#fff', fontSize: 14, fontWeight: 700, cursor: creando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(14,165,233,0.25)' }}>
            {creando ? 'Generando QR…' : '📱 Conectar mi WhatsApp'}
          </button>
        </div>
      )}

      {estado === 'qr_ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <p style={{ fontSize: 13, color: '#fbbf24', margin: 0, fontWeight: 600 }}>Esperando escaneo del QR...</p>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {qr && (
              <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block' }}>
                <img src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`} alt="WhatsApp QR" style={{ width: 200, height: 200, display: 'block' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px' }}>Cómo escanear:</p>
              {['Abre WhatsApp en tu celular', 'Toca los ⋮ (3 puntos) → Dispositivos vinculados', 'Toca "Vincular un dispositivo"', 'Apunta la cámara al QR de esta pantalla'].map((paso, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: C.gradBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{paso}</span>
                </div>
              ))}
              {pairingCode && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8 }}>
                  <p style={{ fontSize: 11, color: C.blue, fontWeight: 700, margin: '0 0 4px', letterSpacing: 0.5 }}>CÓDIGO ALTERNATIVO</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'monospace', letterSpacing: 4 }}>{pairingCode}</p>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={verificarEstado} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.blue}`, background: 'rgba(14,165,233,0.1)', color: C.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Verificar conexión</button>
            <button onClick={conectar} disabled={creando} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Regenerar QR</button>
          </div>
          {polling && <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>Verificando automáticamente cada 4 segundos…</p>}
        </div>
      )}

      {estado === 'loading' && <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Verificando estado de conexión…</p>}
      {error && <p style={{ fontSize: 12, color: '#f87171', margin: '8px 0 0' }}>{error}</p>}
    </div>
  )
}
