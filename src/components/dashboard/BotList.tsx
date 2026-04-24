'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Bot {
  id: string
  nombre: string
  empresa: string
  industria: string
  tono: string
  bienvenida: string
  productos: string
  faqs: string
  whatsapp: string
  activo: boolean
  created_at: string
}

interface Props {
  bots: Bot[]
  userId: string
}

const INDUSTRIA_ICONS: Record<string, string> = {
  Automotriz: '🚗', Inmobiliaria: '🏠', Retail: '👗', Alimentos: '🍔',
  Salud: '💊', Servicios: '🛠️', Tecnología: '💻', Educación: '🎓',
  Fitness: '🏋️', Turismo: '✈️',
}

export function BotList({ bots: initialBots, userId }: Props) {
  const router = useRouter()
  const [bots, setBots] = useState(initialBots)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const toggleActivo = async (bot: Bot) => {
    setToggling(bot.id)
    try {
      const res = await fetch('/api/bot-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bot.id, activo: !bot.activo }),
      })
      if (res.ok) {
        setBots(prev => prev.map(b => b.id === bot.id ? { ...b, activo: !b.activo } : b))
      }
    } finally {
      setToggling(null)
    }
  }

  const deleteBot = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este bot?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/bot-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setBots(prev => prev.filter(b => b.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const copyLink = (bot: Bot) => {
    const link = `${window.location.origin}/bot/${bot.id}`
    navigator.clipboard.writeText(link)
    setCopied(bot.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: "var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginBottom: '.25rem', letterSpacing: '-.02em' }}>
            🤖 Mis Bots IA
          </h1>
          <p style={{ fontSize: '15px', color: '#6b7280' }}>
            {bots.length === 0 ? 'Crea tu primer bot y empieza a prospectar' : `${bots.length} bot${bots.length > 1 ? 's' : ''} configurado${bots.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/dashboard/bot/nuevo" style={{ background: '#FF6B2B', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          + Crear nuevo bot
        </Link>
      </div>

      {/* Empty state */}
      {bots.length === 0 && (
        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: '56px', marginBottom: '1rem' }}>🤖</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '.75rem' }}>Aún no tienes bots creados</h2>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Crea tu primer asistente IA y empieza a prospectar en WhatsApp 24/7 en menos de 5 minutos.
          </p>
          <Link href="/dashboard/bot/nuevo" style={{ background: '#FF6B2B', color: '#fff', padding: '14px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Crear mi primer bot →
          </Link>
        </div>
      )}

      {/* Lista de bots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {bots.map(bot => (
          <div key={bot.id} style={{ background: '#fff', border: bot.activo ? '0.5px solid #e5e7eb' : '0.5px solid #f3f4f6', borderRadius: '20px', padding: '1.5rem 2rem', boxShadow: '0 1px 4px rgba(0,0,0,.04)', opacity: bot.activo ? 1 : .65, transition: 'opacity .2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>

              {/* Info */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: bot.activo ? 'linear-gradient(135deg,#FF6B2B,#ff9a5c)' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {INDUSTRIA_ICONS[bot.industria] || '🤖'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '17px', fontWeight: 800, color: '#111827' }}>{bot.nombre}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: bot.activo ? '#f0fdf4' : '#f9fafb', color: bot.activo ? '#16a34a' : '#9ca3af', border: `1px solid ${bot.activo ? '#86efac' : '#e5e7eb'}` }}>
                      {bot.activo ? '● Activo' : '○ Inactivo'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>{bot.empresa} · {bot.industria} · Tono {bot.tono}</div>
                  {bot.whatsapp && (
                    <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>📱 {bot.whatsapp}</div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => copyLink(bot)} style={{ fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                  {copied === bot.id ? '✅ Copiado' : '🔗 Copiar link'}
                </button>
                <a href={`/bot/${bot.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f0fdf4', color: '#16a34a', textDecoration: 'none' }}>
                  👁️ Ver bot
                </a>
                <button
                  onClick={() => toggleActivo(bot)}
                  disabled={toggling === bot.id}
                  style={{ fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: bot.activo ? '#fff7f3' : '#f0fdf4', color: bot.activo ? '#FF6B2B' : '#16a34a', cursor: 'pointer' }}>
                  {toggling === bot.id ? '...' : bot.activo ? 'Pausar' : 'Activar'}
                </button>
                <Link href={`/dashboard/bot/${bot.id}/editar`} style={{ fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', textDecoration: 'none' }}>
                  ✏️ Editar
                </Link>
                <button
                  onClick={() => deleteBot(bot.id)}
                  disabled={deleting === bot.id}
                  style={{ fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer' }}>
                  {deleting === bot.id ? '...' : '🗑️'}
                </button>
              </div>
            </div>

            {/* Preview del mensaje de bienvenida */}
            {bot.bienvenida && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid #f3f4f6' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Mensaje de bienvenida</div>
                <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '10px 14px', borderRadius: '10px', borderLeft: '3px solid #FF6B2B' }}>
                  {bot.bienvenida}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
