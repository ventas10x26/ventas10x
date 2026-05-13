// Ruta destino: src/app/pulse/perfil/page.tsx
//
// Mi cuenta: datos del vendedor + cambiar contraseña + logout

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'

export default function PulsePerfilPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<{
    nombre: string
    email: string
    marca: string
    concesionario: string
    whatsapp: string
    earlyAdopter: boolean
  } | null>(null)

  // Cambio de contraseña
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/pulse/login')
        return
      }
      const meta = authUser.user_metadata || {}
      setUser({
        nombre: (meta.full_name as string) || authUser.email?.split('@')[0] || 'Vendedor',
        email: authUser.email || '',
        marca: (meta.pulse_marca as string) || '',
        concesionario: (meta.pulse_concesionario as string) || '',
        whatsapp: (meta.pulse_whatsapp as string) || '',
        earlyAdopter: !!meta.pulse_early_adopter,
      })
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nuevaPassword.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.')
      setEstado('error')
      return
    }
    setEstado('enviando')
    setMensaje('')
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
      if (error) {
        setMensaje(error.message)
        setEstado('error')
        return
      }
      setMensaje('✅ Contraseña actualizada correctamente')
      setEstado('ok')
      setNuevaPassword('')
      setTimeout(() => setEstado('idle'), 4000)
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'Error inesperado')
      setEstado('error')
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
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Mi cuenta
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 32px' }}>
          Datos de tu cuenta de Pulse Motor.
        </p>

        {/* Datos del vendedor */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px', color: '#fff' }}>
            Datos personales
          </h2>
          <DatoFila label="Nombre" valor={user.nombre} />
          <DatoFila label="Email" valor={user.email} />
          <DatoFila label="Marca" valor={user.marca || '—'} />
          <DatoFila label="Concesionario" valor={user.concesionario || '—'} />
          <DatoFila label="WhatsApp" valor={user.whatsapp || '—'} ultimo />
        </div>

        {/* Plan */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px', color: '#fff' }}>
            Tu plan
          </h2>
          {user.earlyAdopter ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1))',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <strong style={{ fontSize: '14px', color: '#fdba74' }}>Early Adopter</strong>
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                Precio especial $9 USD/mes los primeros 3 meses (después $14).
                Estás entre los primeros 30 vendedores en probar Pulse Motor.
              </p>
            </div>
          ) : (
            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
              <strong style={{ fontSize: '14px', color: '#fff' }}>Pulse Pro</strong>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
                $14 USD/mes
              </p>
            </div>
          )}
        </div>

        {/* Cambio de contraseña */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
            Cambiar contraseña
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px' }}>
            Mínimo 6 caracteres.
          </p>
          <form onSubmit={cambiarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              minLength={6}
              required
              disabled={estado === 'enviando'}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={estado === 'enviando' || nuevaPassword.length < 6}
              style={{
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                background: estado === 'enviando' || nuevaPassword.length < 6 ? '#475569' : 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: estado === 'enviando' || nuevaPassword.length < 6 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                alignSelf: 'flex-start',
              }}
            >
              {estado === 'enviando' ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
            {mensaje && (
              <p style={{ fontSize: '12px', color: estado === 'ok' ? '#4ade80' : '#fca5a5', margin: '4px 0 0' }}>
                {mensaje}
              </p>
            )}
          </form>
        </div>
      </div>
    </PulseAppShell>
  )
}

function DatoFila({ label, valor, ultimo = false }: { label: string; valor: string; ultimo?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: ultimo ? 'none' : '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{valor}</span>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '16px',
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.3)',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  maxWidth: '320px',
  boxSizing: 'border-box',
}
