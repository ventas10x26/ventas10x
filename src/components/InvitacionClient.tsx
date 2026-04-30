// Ruta destino: src/components/InvitacionClient.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type InvitationInfo = {
  email: string
  rol: string
  org_nombre: string
  inviter_nombre: string
  expires_at: string
}

export function InvitacionClient({ token }: { token: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aceptando, setAceptando] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [usuarioActivo, setUsuarioActivo] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/team/invitation/${token}`).then((r) => r.json()),
      supabase.auth.getUser(),
    ])
      .then(([data, { data: userData }]) => {
        if (data.ok) {
          setInvitation(data.invitation)
        } else {
          setError(data.error || 'Invitación no válida')
        }
        if (userData.user) {
          setUserEmail(userData.user.email || null)
          setUsuarioActivo(true)
        }
      })
      .catch(() => setError('Error al cargar la invitación'))
      .finally(() => setLoading(false))
  }, [token, supabase])

  const aceptar = async () => {
    setAceptando(true)
    setError(null)
    try {
      const res = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al aceptar')
      router.push('/dashboard?bienvenida=team')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setAceptando(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f7f6f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ color: '#888' }}>Cargando invitación...</div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            background: '#fff',
            border: '0.5px solid rgba(0,0,0,.08)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>😕</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.5rem', color: '#0f1c2e' }}>
            Invitación no válida
          </h1>
          <p style={{ fontSize: '14px', color: '#5a6a7c', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {error || 'Esta invitación no existe o ya expiró.'}
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: '#0f1c2e',
              color: '#fff',
              textDecoration: 'none',
              padding: '11px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  const emailMismatch = usuarioActivo && userEmail?.toLowerCase() !== invitation.email.toLowerCase()
  const usuarioNoLogueado = !usuarioActivo

  return (
    <div style={containerStyle}>
      <div
        style={{
          background: '#fff',
          border: '0.5px solid rgba(0,0,0,.08)',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          width: '100%',
          maxWidth: '460px',
        }}
      >

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="13" fill="#FF6B2B" />
              <rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)" />
              <rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)" />
              <rect x="28" y="16" width="7" height="28" rx="2" fill="white" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-.02em' }}>
              Ventas<span style={{ color: '#FF6B2B' }}>10x</span>
            </span>
          </div>
        </div>

        {/* Mensaje principal */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f1c2e', lineHeight: 1.3, marginBottom: '8px', letterSpacing: '-.01em' }}>
            <strong>{invitation.inviter_nombre}</strong> te invitó
            <br />
            a unirte a <strong>{invitation.org_nombre}</strong>
          </h1>
          <p style={{ fontSize: '14px', color: '#5a6a7c' }}>
            como{' '}
            <span
              style={{
                background: '#fff5ef',
                color: '#FF6B2B',
                padding: '3px 10px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {invitation.rol}
            </span>
          </p>
        </div>

        {/* Beneficios */}
        <div
          style={{
            background: '#fff5ef',
            border: '1px solid #ffd5be',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: 600, marginBottom: '8px' }}>
            ✦ Como {invitation.rol} podrás:
          </div>
          <div style={{ fontSize: '13px', color: '#5a6a7c', lineHeight: 1.7 }}>
            ✓ Ver y editar el catálogo<br />
            ✓ Gestionar leads y pipeline<br />
            ✓ Personalizar la landing<br />
            ✓ Configurar el bot IA
          </div>
        </div>

        {/* Caso 1: Usuario no logueado */}
        {usuarioNoLogueado && (
          <>
            <p style={{ fontSize: '13px', color: '#5a6a7c', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.5 }}>
              Esta invitación es para <strong style={{ color: '#0f1c2e' }}>{invitation.email}</strong>.
              <br />
              Inicia sesión o crea tu cuenta para aceptar.
            </p>

            <Link
              href={`/auth/login?next=/invitacion/${token}`}
              style={{
                display: 'block',
                background: '#FF6B2B',
                color: '#fff',
                textAlign: 'center',
                padding: '13px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                marginBottom: '8px',
              }}
            >
              Iniciar sesión y aceptar →
            </Link>

            <Link
              href={`/auth/register?invite=${token}`}
              style={{
                display: 'block',
                background: '#fff',
                color: '#0f1c2e',
                textAlign: 'center',
                padding: '13px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid #e5e7eb',
              }}
            >
              Crear cuenta nueva
            </Link>
          </>
        )}

        {/* Caso 2: Email no coincide */}
        {emailMismatch && (
          <>
            <div
              style={{
                background: '#FCEBEB',
                color: '#A32D2D',
                border: '0.5px solid #F09595',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '13px',
                marginBottom: '1rem',
                lineHeight: 1.5,
              }}
            >
              Esta invitación es para <strong>{invitation.email}</strong> pero estás logueado como{' '}
              <strong>{userEmail}</strong>.
              <br />
              Cierra sesión y vuelve a entrar con la cuenta correcta.
            </div>

            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.reload()
              }}
              style={{
                width: '100%',
                background: '#0f1c2e',
                color: '#fff',
                border: 'none',
                padding: '13px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cerrar sesión
            </button>
          </>
        )}

        {/* Caso 3: Usuario logueado y email coincide */}
        {usuarioActivo && !emailMismatch && (
          <>
            {error && (
              <div
                style={{
                  background: '#FCEBEB',
                  color: '#A32D2D',
                  border: '0.5px solid #F09595',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  marginBottom: '1rem',
                }}
              >
                ❌ {error}
              </div>
            )}

            <button
              onClick={aceptar}
              disabled={aceptando}
              style={{
                width: '100%',
                background: '#FF6B2B',
                color: '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: aceptando ? 'wait' : 'pointer',
                opacity: aceptando ? 0.7 : 1,
                boxShadow: '0 8px 18px rgba(255,107,43,0.25)',
              }}
            >
              {aceptando ? 'Aceptando...' : 'Aceptar invitación →'}
            </button>
          </>
        )}

      </div>
    </div>
  )
}
