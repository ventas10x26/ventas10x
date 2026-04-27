// Ruta destino: src/components/dashboard/SuscripcionBanner.tsx
// Banner sticky que aparece en el dashboard cuando el trial está por vencer
// o ya venció. Solo se muestra si aplica.

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  diasRestantes,
  esTrial,
  esSuscripcionActiva,
  necesitaRenovar,
  type Suscripcion,
} from '@/lib/suscripciones'

export function SuscripcionBanner() {
  const [sub, setSub] = useState<Suscripcion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [oculto, setOculto] = useState(false)

  useEffect(() => {
    fetch('/api/suscripciones/mi-plan')
      .then(r => r.json())
      .then(data => {
        if (data.suscripcion) setSub(data.suscripcion)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  if (cargando || oculto || !sub) return null

  const enTrial = esTrial(sub)
  const activa = esSuscripcionActiva(sub)
  const renovar = necesitaRenovar(sub)
  const dias = diasRestantes(sub.fecha_fin)

  // Solo mostrar si: trial por vencer, plan vencido, o renovar próximo
  if (!enTrial && activa && !renovar) return null
  if (enTrial && dias > 7) return null  // No molestar si quedan más de 7 días

  const config = !activa
    ? {
        emoji: '🚫',
        bg: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
        color: '#991b1b',
        titulo: 'Tu plan está vencido',
        texto: 'Reactiva tu suscripción para seguir usando todas las funciones',
        ctaTexto: 'Reactivar →',
      }
    : enTrial
    ? {
        emoji: '🎁',
        bg: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
        color: '#9a3412',
        titulo: dias <= 1 ? 'Tu trial vence hoy' : `Tu trial vence en ${dias} días`,
        texto: 'Suscríbete para no perder acceso a tus leads, productos y bot IA',
        ctaTexto: 'Ver planes →',
      }
    : {
        emoji: '⏰',
        bg: 'linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)',
        color: '#92400e',
        titulo: dias <= 1 ? 'Tu plan vence hoy' : `Tu plan vence en ${dias} días`,
        texto: 'Renueva ahora para no perder el acceso',
        ctaTexto: 'Renovar →',
      }

  return (
    <div style={{
      background: config.bg,
      borderBottom: `1px solid rgba(0,0,0,.08)`,
      padding: '0.75rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{config.emoji}</span>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: config.color }}>
            {config.titulo}
          </div>
          <div style={{ fontSize: '0.75rem', color: config.color, opacity: 0.8 }}>
            {config.texto}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link
          href="/dashboard/planes"
          style={{
            background: '#0f1c2e',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {config.ctaTexto}
        </Link>
        <button
          onClick={() => setOculto(true)}
          aria-label="Cerrar"
          style={{
            background: 'transparent',
            border: 'none',
            color: config.color,
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 8px',
            opacity: 0.5,
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
