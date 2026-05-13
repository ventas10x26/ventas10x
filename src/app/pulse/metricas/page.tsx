// Ruta destino: src/app/pulse/metricas/page.tsx
//
// Placeholder de Métricas. Contenido real viene en Pack 5/6.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'

export default function PulseMetricasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ nombre: string; email: string } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/pulse/login')
        return
      }
      setUser({
        nombre: (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'Vendedor',
        email: authUser.email || '',
      })
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <PulseAppShell userName={user.nombre} userEmail={user.email}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Tus métricas
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 32px' }}>
          Vas a poder medir tu performance real como vendedor.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '14px',
          padding: '60px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px' }}>
            Próximamente
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 auto 24px', maxWidth: '480px', lineHeight: '1.6' }}>
            Vas a ver tu Speed-to-Lead promedio, tasa de conversión, tiempo de cierre,
            y comparativo de tus mejores semanas. Todo automático.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            maxWidth: '640px',
            margin: '0 auto',
          }}>
            <MetricaPreview label="Speed-to-Lead" valor="-- min" subtitulo="Promedio de respuesta" />
            <MetricaPreview label="Tasa de cierre" valor="--%" subtitulo="Leads convertidos" />
            <MetricaPreview label="Esta semana" valor="--" subtitulo="Leads atendidos" />
          </div>
        </div>
      </div>
    </PulseAppShell>
  )
}

function MetricaPreview({ label, valor, subtitulo }: { label: string; valor: string; subtitulo: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '16px',
    }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>{valor}</div>
      <div style={{ fontSize: '10px', color: '#64748b' }}>{subtitulo}</div>
    </div>
  )
}
