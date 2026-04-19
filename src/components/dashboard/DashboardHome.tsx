'use client'

import { useRouter } from 'next/navigation'
import { PlanBadge } from '@/components/ui/PlanBadge'
import type { Suscripcion } from '@/types/database'

interface Props {
  nombre: string
  slug: string
  sus: Suscripcion | null
  totalLeads: number
  userId: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

const QUICK_ACTIONS = [
  { href: '/dashboard/catalogo', icon: '✦', title: 'Subir catálogo', desc: 'IA extrae tus productos' },
  { href: '/dashboard/leads', icon: '◎', title: 'Ver mis leads', desc: 'Todos tus prospectos' },
  { href: '/dashboard/landing-editor', icon: '◈', title: 'Editar landing', desc: 'Personaliza tu página' },
  { href: '/dashboard/pipeline', icon: '⊟', title: 'Pipeline', desc: 'Gestiona tus etapas' },
]

export function DashboardHome({ nombre, slug, sus, totalLeads, userId }: Props) {
  const router = useRouter()
  const landingUrl = `${BASE_URL}/u/${slug}`
  const diasRestantes = sus?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sus.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  const copyUrl = () => {
    navigator.clipboard.writeText(landingUrl)
    alert('¡Enlace copiado!')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Welcome card */}
      <div className="rounded-3xl p-6 mb-6" style={{ background: '#0f1a2e' }}>
        <h1 className="text-2xl font-display font-bold text-white mb-1">
          Hola, {nombre.split(' ')[0]} 👋
        </h1>
        <p className="text-sm" style={{ color: '#B5D4F4' }}>
          Tu sistema de ventas está activo. Aquí tienes el resumen de tu cuenta.
        </p>
      </div>

      {/* Plan banner */}
      <PlanBadge
        plan={sus?.plan || 'gratuito'}
        estado={sus?.estado || 'gratuito'}
        diasRestantes={diasRestantes}
        onUpgrade={() => router.push('/precios')}
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { n: totalLeads, l: 'Leads recibidos' },
          { n: 0, l: 'Leads este mes' },
          { n: 0, l: 'Leads cerrados' },
          { n: diasRestantes, l: 'Días de prueba', color: '#FF6B2B' },
        ].map((m, i) => (
          <div key={i} className="card p-5">
            <div className="text-2xl font-display font-bold mb-1" style={{ color: m.color || '#185FA5' }}>{m.n}</div>
            <div className="text-xs text-gray-500">{m.l}</div>
          </div>
        ))}
      </div>

      {/* URL landing */}
      {slug && (
        <>
          <div className="text-sm font-semibold text-gray-800 mb-3">Tu URL de landing personalizada</div>
          <div className="card p-4 mb-6 flex items-center gap-3 flex-wrap">
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">Comparte este enlace con tus prospectos</div>
              <div className="text-sm font-medium text-blue-600 break-all">{landingUrl}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={copyUrl} className="text-xs font-semibold px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                Copiar
              </button>
              <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                Ver landing →
              </a>
            </div>
          </div>
        </>
      )}

      {/* Acciones rápidas */}
      <div className="text-sm font-semibold text-gray-800 mb-3">Acciones rápidas</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(a => (
          <button
            key={a.href}
            onClick={() => router.push(a.href)}
            className="card p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3 text-blue-600 group-hover:bg-blue-100 transition-colors">
              {a.icon}
            </div>
            <div className="text-sm font-semibold text-gray-800 mb-0.5">{a.title}</div>
            <div className="text-xs text-gray-500">{a.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
