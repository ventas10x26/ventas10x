// Ruta destino: src/components/admin/FenixWhatsappConnect.tsx
// Adaptación de src/components/pulse/PulseWhatsappConnect.tsx para Fenix.
// Diferencias clave frente al original de Pulse:
// - No recibe `email`: Fenix usa una sola instancia de WhatsApp para todo
//   el equipo de cobro, no una por vendedor (ver /api/fenix/whatsapp/instance).
// - Recibe los tokens de color `c` del padre (FenixAgenteClient) para
//   respetar el tema claro/oscuro en vez de los colores fijos oscuros
//   que usa el original de Pulse.
'use client'

import { useState, useEffect, useCallback, type CSSProperties } from 'react'

type EstadoConexion = 'loading' | 'no_instance' | 'qr_ready' | 'connected' | 'error'

type ColorTokens = {
  cardBg: string
  border: string
  ink: string
  ink2: string
  ink3: string
}

type Props = {
  c: ColorTokens
  onEstadoChange?: (conectado: boolean) => void
}

export function FenixWhatsappConnect({ c, onEstadoChange }: Props) {
  const [estado, setEstado] = useState<EstadoConexion>('loading')
  const [qr, setQr] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)
  const [polling, setPolling] = useState(false)
  const [codigoCopiado, setCodigoCopiado] = useState(false)

  const verificarEstado = useCallback(async () => {
    try {
      const res = await fetch('/api/fenix/whatsapp/instance')
      const data = await res.json()

      if (data.connected) {
        setEstado('connected')
        setPhone(data.phone)
        setQr(null)
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
  }, [onEstadoChange])

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
      const res = await fetch('/api/fenix/whatsapp/instance', { method: 'POST' })
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
    await fetch('/api/fenix/whatsapp/instance', { method: 'DELETE' })
    setEstado('no_instance')
    setQr(null)
    setPhone(null)
    onEstadoChange?.(false)
  }

  const copiarCodigo = async () => {
    if (!pairingCode) return
    try {
      await navigator.clipboard.writeText(pairingCode)
      setCodigoCopiado(true)
      setTimeout(() => setCodigoCopiado(false), 1800)
    } catch { /* sin permiso de portapapeles: el texto sigue seleccionable a mano */ }
  }

  const ACCENT = '#F5821F'
  const gradBtn = `linear-gradient(135deg, ${ACCENT}, #d96b0f)`

  const labelStyle: CSSProperties = {
    display: 'block', fontSize: 11.5, fontWeight: 700, color: c.ink2,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em',
  }

  return (
    <section style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>📱</span>
        <h2 style={{ fontSize: 14.5, fontWeight: 800, margin: 0, color: c.ink }}>Conexión WhatsApp</h2>
        <span style={{
          fontSize: 9, fontWeight: 800,
          color: estado === 'connected' ? '#16a34a' : ACCENT,
          background: estado === 'connected' ? 'rgba(22,163,74,0.12)' : `${ACCENT}15`,
          border: `1px solid ${estado === 'connected' ? 'rgba(22,163,74,0.3)' : `${ACCENT}40`}`,
          padding: '4px 10px', borderRadius: 999,
        }}>
          {estado === 'connected' ? 'CONECTADO' : estado === 'qr_ready' ? 'ESPERANDO QR' : estado === 'loading' ? 'CARGANDO' : 'DESCONECTADO'}
        </span>
      </div>

      {estado === 'connected' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 8px #16a34a' }} />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.ink }}>WhatsApp conectado ✓</p>
              {phone && <p style={{ margin: 0, fontSize: 12, color: c.ink3 }}>{phone}</p>}
              <p style={{ margin: '4px 0 0', fontSize: 12, color: c.ink3 }}>El bot responde automáticamente a los deudores que escriban</p>
            </div>
          </div>
          <button onClick={desconectar} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: 'transparent', color: c.ink2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Desconectar
          </button>
        </div>
      )}

      {estado === 'no_instance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: c.ink2, margin: 0, lineHeight: 1.6 }}>
            Conecta el WhatsApp del equipo de cobro para que el agente IA responda automáticamente a los deudores.{' '}
            <strong style={{ color: c.ink }}>Sin número nuevo, sin SIM card</strong> — solo escaneas un QR desde el teléfono.
          </p>
          <button onClick={conectar} disabled={creando} style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 10, border: 'none', background: gradBtn, color: '#fff', fontSize: 14, fontWeight: 700, cursor: creando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 14px ${ACCENT}40` }}>
            {creando ? 'Generando QR…' : '📱 Conectar WhatsApp'}
          </button>
        </div>
      )}

      {estado === 'qr_ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
            <p style={{ fontSize: 13, color: '#d97706', margin: 0, fontWeight: 600 }}>Esperando escaneo del QR...</p>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {qr && (
              <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block' }}>
                <img src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`} alt="WhatsApp QR" style={{ width: 200, height: 200, display: 'block' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={labelStyle}>Cómo escanear</p>
              {['Abre WhatsApp en el celular del equipo de cobro', 'Toca los ⋮ (3 puntos) → Dispositivos vinculados', 'Toca "Vincular un dispositivo"', 'Apunta la cámara al QR de esta pantalla'].map((paso, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: gradBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: c.ink2, lineHeight: 1.5 }}>{paso}</span>
                </div>
              ))}
              {pairingCode && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 10.5, color: ACCENT, fontWeight: 700, margin: '0 0 4px', letterSpacing: 0.5 }}>CÓDIGO TÉCNICO</p>
                    <p style={{ fontSize: 12, color: c.ink, margin: 0, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pairingCode}</p>
                  </div>
                  <button
                    onClick={copiarCodigo}
                    title="Copiar código completo"
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, border: `1px solid ${codigoCopiado ? 'rgba(22,163,74,0.4)' : `${ACCENT}40`}`, background: 'transparent', color: codigoCopiado ? '#16a34a' : ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {codigoCopiado ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    )}
                    {codigoCopiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={verificarEstado} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${ACCENT}`, background: `${ACCENT}10`, color: ACCENT, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Verificar conexión</button>
            <button onClick={conectar} disabled={creando} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${c.border}`, background: 'transparent', color: c.ink3, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Regenerar QR</button>
          </div>
          {polling && <p style={{ fontSize: 11, color: c.ink3, margin: 0 }}>Verificando automáticamente cada 4 segundos…</p>}
        </div>
      )}

      {estado === 'loading' && <p style={{ fontSize: 13, color: c.ink3, margin: 0 }}>Verificando estado de conexión…</p>}
      {estado === 'error' && error && <p style={{ fontSize: 12, color: '#dc2626', margin: '8px 0 0' }}>{error}</p>}
    </section>
  )
}
