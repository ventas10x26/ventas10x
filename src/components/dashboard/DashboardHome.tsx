// Ruta destino: src/components/dashboard/DashboardHome.tsx
// REEMPLAZA. Cambio único:
// - Línea 50-51: sus.trial_ends_at → sus.fecha_fin

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlanBadge } from '@/components/ui/PlanBadge'
import Link from 'next/link'
import type { Suscripcion } from '@/types/database'

interface Bot {
  id: string
  nombre: string
  industria: string
  activo: boolean
}

interface Props {
  nombre: string
  slug: string
  sus: Suscripcion | null
  totalLeads: number
  userId: string
  bots: Bot[]
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

const INDUSTRIA_ICONS: Record<string, string> = {
  Automotriz: '🚗', Inmobiliaria: '🏠', Retail: '👗', Alimentos: '🍔',
  Salud: '💊', Servicios: '🛠️', Tecnología: '💻', Educación: '🎓',
  Fitness: '🏋️', Turismo: '✈️',
}

const QUICK_ACTIONS = [
  { href: '/dashboard/catalogo', icon: '✦', title: 'Subir catálogo', desc: 'IA extrae tus productos', color: 'blue' },
  { href: '/dashboard/leads', icon: '◎', title: 'Ver mis leads', desc: 'Todos tus prospectos', color: 'blue' },
  { href: '/dashboard/bot/nuevo', icon: '🤖', title: 'Crear Bot IA', desc: 'Configura tu asistente', color: 'orange' },
  { href: '/dashboard/landing-editor', icon: '◈', title: 'Editar landing', desc: 'Personaliza tu página', color: 'blue' },
  { href: '/dashboard/pipeline', icon: '⊟', title: 'Pipeline', desc: 'Gestiona tus etapas', color: 'blue' },
]

export function DashboardHome({ nombre, slug, sus, totalLeads, bots }: Props) {
  const router = useRouter()
  const [copiado, setCopiado] = useState(false)

  const landingUrl = `${BASE_URL}/u/${slug}`
  // ─── CAMBIO: trial_ends_at → fecha_fin ───
  const diasRestantes = sus?.fecha_fin
    ? Math.max(0, Math.ceil((new Date(sus.fecha_fin).getTime() - Date.now()) / 86400000))
    : 0

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(landingUrl)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // ignorar
    }
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
        plan={sus?.plan || 'trial'}
        estado={sus?.estado || 'activa'}
        diasRestantes={diasRestantes}
        onUpgrade={() => router.push('/dashboard/planes')}
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

      {/* URL de landing */}
      {slug && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-gray-800 mb-3">🔗 Tu URL de landing personalizada</div>
          <div
            className="flex items-center gap-3 flex-wrap"
            style={{
              background: 'linear-gradient(135deg, #0f1c2e 0%, #1a1a2e 100%)',
              border: '1px solid rgba(29,78,216,.25)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', marginBottom: '4px' }}>
                Comparte este enlace con tus prospectos
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#93c5fd',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}>
                {landingUrl}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={copyUrl}
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,.12)',
                  background: copiado ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.06)',
                  color: copiado ? '#86efac' : 'rgba(255,255,255,.8)',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
              <a
                href={landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(29,78,216,.4)',
                  background: 'rgba(29,78,216,.18)',
                  color: '#93c5fd',
                  textDecoration: 'none',
                }}
              >
                Ver landing →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bots activos o CTA para crear */}
      {bots.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-800">🤖 Mis Bots IA</div>
            <Link href="/dashboard/bot" className="text-xs font-semibold text-orange-500 hover:text-orange-600">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {bots.slice(0, 2).map(bot => (
              <div key={bot.id} style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1a1a2e 100%)', border: '1px solid rgba(255,107,43,.2)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bot.activo ? 'linear-gradient(135deg,#FF6B2B,#ff9a5c)' : 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {INDUSTRIA_ICONS[bot.industria] || '🤖'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px', letterSpacing: '-.01em' }} className="truncate">{bot.nombre}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: bot.activo ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.08)', color: bot.activo ? '#4ade80' : 'rgba(255,255,255,.4)', border: `1px solid ${bot.activo ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.1)'}` }}>
                      {bot.activo ? '● Activo' : '○ Inactivo'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)' }}>{bot.industria}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${BASE_URL}/bot/${bot.id}`).then(() => alert('¡Link copiado!'))}
                    style={{ fontSize: '12px', fontWeight: 600, padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.7)', cursor: 'pointer' }}>
                    🔗
                  </button>
                  <a href={`/bot/${bot.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: 600, padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(74,222,128,.25)', background: 'rgba(74,222,128,.1)', color: '#4ade80', textDecoration: 'none' }}>
                    👁️
                  </a>
                  <Link href={`/dashboard/bot/${bot.id}/editar`} style={{ fontSize: '12px', fontWeight: 600, padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,107,43,.25)', background: 'rgba(255,107,43,.1)', color: '#FF8C42', textDecoration: 'none' }}>
                    ✏️
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {bots.length > 2 && (
            <Link href="/dashboard/bot" className="block text-center text-xs text-gray-400 mt-2 hover:text-gray-600">
              +{bots.length - 2} bots más →
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1a0d06 100%)', border: '1px solid rgba(255,107,43,.25)' }}>
          <div>
            <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">🤖 Bot IA</div>
            <div className="text-white font-bold text-lg mb-1">Crea tu asistente de ventas personalizado</div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,.6)' }}>Prospecta en WhatsApp 24/7 — configúralo en menos de 5 minutos.</div>
          </div>
          <button
            onClick={() => router.push('/dashboard/bot/nuevo')}
            className="flex-shrink-0 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: '#FF6B2B' }}>
            Crear mi bot →
          </button>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="text-sm font-semibold text-gray-800 mb-3">Acciones rápidas</div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {QUICK_ACTIONS.map(a => (
          <button
            key={a.href}
            onClick={() => router.push(a.href)}
            className={`card p-4 text-left transition-all group ${
              a.color === 'orange'
                ? 'hover:border-orange-200 hover:shadow-sm'
                : 'hover:border-blue-200 hover:shadow-sm'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors text-sm ${
              a.color === 'orange'
                ? 'bg-orange-50 text-orange-500 group-hover:bg-orange-100'
                : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
            }`}>
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
