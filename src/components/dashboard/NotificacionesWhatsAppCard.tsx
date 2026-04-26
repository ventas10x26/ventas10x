// Ruta destino: src/components/dashboard/NotificacionesWhatsAppCard.tsx
// Card para que el vendedor configure CallMeBot desde su perfil.
// Tutorial paso a paso + campos de API key/teléfono + botón de prueba.

'use client'

import { useState } from 'react'

type Props = {
  apiKeyInicial: string
  telefonoInicial: string
  activaInicial: boolean
}

export function NotificacionesWhatsAppCard({
  apiKeyInicial,
  telefonoInicial,
  activaInicial,
}: Props) {
  const [apikey, setApikey] = useState(apiKeyInicial || '')
  const [telefono, setTelefono] = useState(telefonoInicial || '')
  const [activa, setActiva] = useState(activaInicial)
  const [mostrarTutorial, setMostrarTutorial] = useState(!apiKeyInicial)

  const [guardando, setGuardando] = useState(false)
  const [probando, setProbando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const guardar = async () => {
    setGuardando(true)
    setMensaje(null)
    try {
      const res = await fetch('/api/notificaciones-whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callmebot_apikey: apikey,
          callmebot_telefono: telefono,
          notif_whatsapp_activa: activa,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      setMensaje({ tipo: 'ok', texto: '✅ Configuración guardada' })
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error' })
    } finally {
      setGuardando(false)
    }
  }

  const probar = async () => {
    if (!apikey.trim() || !telefono.trim()) {
      setMensaje({ tipo: 'error', texto: 'Completa API key y teléfono primero' })
      return
    }
    setProbando(true)
    setMensaje(null)
    try {
      // Primero guardar lo que tenga
      await fetch('/api/notificaciones-whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callmebot_apikey: apikey,
          callmebot_telefono: telefono,
        }),
      })

      // Luego probar
      const res = await fetch('/api/notificaciones-whatsapp', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al probar')
      setMensaje({ tipo: 'ok', texto: data.mensaje || '✅ Mensaje enviado' })
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al probar' })
    } finally {
      setProbando(false)
    }
  }

  const yaConfigurado = apiKeyInicial.length > 0

  return (
    <div className="card p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div>
          <h2 className="text-lg font-semibold text-brand-navy" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>📲</span>
            Notificaciones por WhatsApp
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recibe un mensaje en tu WhatsApp cuando llegue un lead nuevo desde tu bot
          </p>
        </div>

        {yaConfigurado && (
          <span style={{
            fontSize: '0.7rem', fontWeight: 700,
            padding: '4px 10px', borderRadius: '999px',
            background: activa ? 'rgba(16,185,129,.12)' : 'rgba(156,163,175,.12)',
            color: activa ? '#059669' : '#6b7280',
          }}>
            {activa ? '● Activo' : '○ Desactivado'}
          </span>
        )}
      </div>

      {/* Tutorial */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => setMostrarTutorial(!mostrarTutorial)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: 'none',
            color: '#FF6B2B', fontSize: '0.85rem', fontWeight: 600,
            cursor: 'pointer', padding: 0,
          }}
        >
          {mostrarTutorial ? '▼' : '▶'} Cómo configurarlo (5 minutos)
        </button>

        {mostrarTutorial && (
          <div style={{
            marginTop: '0.75rem',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            fontSize: '0.85rem',
            color: '#7c2d12',
            lineHeight: 1.7,
          }}>
            <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
              CallMeBot es un servicio gratuito de notificaciones por WhatsApp. Cada usuario debe activarlo así:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong style={{ color: '#9a3412' }}>Paso 1.</strong> Guarda este número en tus contactos:
                <div style={{
                  marginTop: '4px',
                  background: '#fff', borderRadius: '8px',
                  padding: '6px 12px', fontFamily: 'monospace',
                  fontSize: '0.95rem', color: '#FF6B2B', fontWeight: 700,
                  display: 'inline-block',
                }}>
                  +34 644 51 95 23
                </div>
              </div>

              <div>
                <strong style={{ color: '#9a3412' }}>Paso 2.</strong> Envíale este mensaje exacto desde tu WhatsApp (importante: respetar mayúsculas y espacios):
                <div style={{
                  marginTop: '4px',
                  background: '#fff', borderRadius: '8px',
                  padding: '6px 12px', fontFamily: 'monospace',
                  fontSize: '0.85rem', color: '#0f1c2e',
                  display: 'inline-block',
                }}>
                  Autorizo a callmebot a enviarme mensajes
                </div>
              </div>

              <div>
                <strong style={{ color: '#9a3412' }}>Paso 3.</strong> Espera la respuesta (1-2 minutos). Te enviarán un mensaje con tu <strong>API key personal</strong>.
              </div>

              <div>
                <strong style={{ color: '#9a3412' }}>Paso 4.</strong> Pega aquí abajo tu <strong>API key</strong> y tu <strong>número con código de país</strong> (sin +).
              </div>

              <div>
                <strong style={{ color: '#9a3412' }}>Paso 5.</strong> Click en <strong>&quot;Enviar prueba&quot;</strong>. Si te llega un WhatsApp, ¡todo listo!
              </div>
            </div>

            <a
              href="https://www.callmebot.com/blog/free-api-whatsapp-messages/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '0.75rem',
                color: '#9a3412',
                fontSize: '0.75rem',
                textDecoration: 'underline',
              }}
            >
              📖 Ver guía oficial de CallMeBot →
            </a>
          </div>
        )}
      </div>

      {/* Campos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={lbl}>
            Mi número de WhatsApp <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.7rem' }}>(con código de país, sin +)</span>
          </label>
          <input
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="ej. 573001234567"
            style={inp}
          />
          <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
            Para Colombia: 57 + tu número (10 dígitos). Ej: 573001234567
          </p>
        </div>

        <div>
          <label style={lbl}>
            API Key de CallMeBot
          </label>
          <input
            value={apikey}
            onChange={e => setApikey(e.target.value)}
            placeholder="ej. 1234567"
            style={inp}
          />
          <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
            La recibes por WhatsApp después del paso 2 del tutorial
          </p>
        </div>

        {/* Toggle activa */}
        <div style={{
          background: '#f9fafb', padding: '0.75rem 1rem', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '0.5rem',
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              Notificaciones activas
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {activa
                ? 'Recibirás un WhatsApp cada lead nuevo'
                : 'Las notificaciones por WhatsApp están pausadas'}
            </div>
          </div>
          <button
            onClick={() => setActiva(!activa)}
            disabled={!apikey || !telefono}
            style={{
              width: '44px', height: '24px',
              background: activa ? '#10b981' : '#d1d5db',
              borderRadius: '12px', border: 'none',
              cursor: (!apikey || !telefono) ? 'not-allowed' : 'pointer',
              position: 'relative', transition: 'background .2s',
              opacity: (!apikey || !telefono) ? 0.5 : 1,
            }}
          >
            <span style={{
              position: 'absolute', top: '2px',
              left: activa ? '22px' : '2px',
              width: '20px', height: '20px', background: '#fff', borderRadius: '50%',
              transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)',
            }} />
          </button>
        </div>

        {mensaje && (
          <div style={{
            padding: '0.6rem 1rem',
            background: mensaje.tipo === 'ok' ? '#f0fdf4' : '#fee2e2',
            color: mensaje.tipo === 'ok' ? '#166534' : '#991b1b',
            border: `1px solid ${mensaje.tipo === 'ok' ? '#86efac' : '#fca5a5'}`,
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}>
            {mensaje.texto}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={probar}
            disabled={probando || !apikey || !telefono}
            style={{
              padding: '0.6rem 1rem',
              background: '#25D366', color: '#fff',
              border: 'none', borderRadius: '10px',
              fontSize: '0.85rem', fontWeight: 700,
              cursor: probando ? 'wait' : 'pointer',
              opacity: probando || !apikey || !telefono ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {probando ? 'Enviando...' : '💬 Enviar prueba'}
          </button>

          <button
            onClick={guardar}
            disabled={guardando}
            className="btn-primary !text-sm"
            style={{ opacity: guardando ? 0.7 : 1 }}
          >
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  fontSize: '0.85rem', fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: '4px',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.875rem',
  border: '1px solid #e5e7eb', borderRadius: '8px',
  fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
}
