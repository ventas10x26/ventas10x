// Ruta destino: src/components/dashboard/BloqueoFeature.tsx
// Componente que envuelve elementos que requieren suscripción activa.
// Si el usuario no tiene plan activo, muestra overlay con CTA a planes.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { esSuscripcionActiva, type Suscripcion } from '@/lib/suscripciones'

type Props = {
  children: React.ReactNode
  /** Mensaje custom (default: "Renueva tu plan para continuar") */
  mensaje?: string
  /** Si true, solo muestra alerta inline (no oculta children) */
  modoSoloAlerta?: boolean
}

export function BloqueoFeature({ children, mensaje, modoSoloAlerta }: Props) {
  const [sub, setSub] = useState<Suscripcion | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/suscripciones/mi-plan')
      .then(r => r.json())
      .then(data => {
        if (data.suscripcion) setSub(data.suscripcion)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <>{children}</>

  const activa = esSuscripcionActiva(sub)

  // Si está activa, renderiza normal
  if (activa) return <>{children}</>

  // Modo solo alerta: muestra el banner pero deja todo accesible
  if (modoSoloAlerta) {
    return (
      <>
        <div style={{
          background: 'linear-gradient(135deg,#fee2e2 0%,#fca5a5 100%)',
          border: '1px solid #f87171',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>
            ⚠️ <strong>Plan vencido:</strong> {mensaje || 'Renueva para usar todas las funciones'}
          </div>
          <Link
            href="/dashboard/planes"
            style={{
              padding: '6px 14px',
              background: '#0f1c2e',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Renovar →
          </Link>
        </div>
        {children}
      </>
    )
  }

  // Modo bloqueo blando: oculta children, muestra CTA
  return (
    <div style={{
      background: '#fff',
      border: '2px dashed #f87171',
      borderRadius: '14px',
      padding: '2.5rem 1.5rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔒</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f1c2e', marginBottom: '0.5rem' }}>
        Esta función requiere plan activo
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.25rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
        {mensaje || 'Tu suscripción está vencida. Renueva tu plan para seguir creando productos, leads y usar todas las funciones del sistema.'}
      </p>
      <Link
        href="/dashboard/planes"
        style={{
          display: 'inline-block',
          padding: '12px 28px',
          background: 'linear-gradient(135deg,#FF6B2B 0%,#FF8C42 100%)',
          color: '#fff',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(255,107,43,.25)',
        }}
      >
        Renovar mi plan →
      </Link>
    </div>
  )
}
