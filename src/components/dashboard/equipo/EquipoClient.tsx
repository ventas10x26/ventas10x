// Ruta destino: src/components/dashboard/equipo/EquipoClient.tsx

'use client'

import { useEffect, useState } from 'react'

type Miembro = {
  id: string
  user_id: string
  rol: 'owner' | 'admin' | 'viewer'
  joined_at: string
  profile: {
    id: string
    nombre: string | null
    apellido: string | null
    slug: string | null
    avatar_url: string | null
  } | null
}

type Invitacion = {
  id: string
  email: string
  rol: string
  expires_at: string
  created_at: string
}

type Org = {
  id: string
  nombre: string
  owner_id: string
}

const ROL_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  viewer: 'Solo lectura',
}

const ROL_COLORS: Record<string, { bg: string; text: string }> = {
  owner: { bg: '#fff5ef', text: '#c2410c' },
  admin: { bg: '#dbeafe', text: '#1d4ed8' },
  viewer: { bg: '#f3f4f6', text: '#4b5563' },
}

export function EquipoClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [org, setOrg] = useState<Org | null>(null)
  const [miRol, setMiRol] = useState<'owner' | 'admin' | 'viewer'>('viewer')
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargar = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/team/members')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      setOrg(data.org)
      setMiRol(data.miRol)
      setMiembros(data.miembros || [])
      setInvitaciones(data.invitaciones || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const puedeInvitar = miRol === 'owner' || miRol === 'admin'

  const quitarMiembro = async (userId: string, nombre: string) => {
    if (!confirm(`¿Quitar a ${nombre} del equipo?`)) return
    try {
      const res = await fetch(`/api/team/members/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al quitar miembro')
      setSuccess('Miembro quitado del equipo')
      setTimeout(() => setSuccess(null), 3000)
      cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    }
  }

  const cancelarInvitacion = async (invitationId: string, email: string) => {
    if (!confirm(`¿Cancelar invitación a ${email}?`)) return
    try {
      // Para cancelar usamos el mismo endpoint pero marcando como expirada
      // Por ahora simplemente la quitamos vía endpoint dedicado (lo creamos abajo si quieres)
      // Workaround: marcar como usada
      const res = await fetch(`/api/team/invitation-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invitationId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cancelar')
      }
      setSuccess('Invitación cancelada')
      setTimeout(() => setSuccess(null), 3000)
      cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    }
  }

  const diasRestantes = (fecha: string): string => {
    const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)
    if (dias <= 0) return 'Expirada'
    if (dias === 1) return 'Expira mañana'
    return `Expira en ${dias} días`
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">👥 Tu equipo</h1>
          <p className="text-sm text-gray-500">
            {org?.nombre || 'Mi empresa'}
          </p>
        </div>
        {puedeInvitar && (
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <span>+</span> Invitar miembro
          </button>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          ✅ {success}
        </div>
      )}

      {/* Lista de miembros */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Miembros ({miembros.length})
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {miembros.map((m) => {
            const nombre = m.profile
              ? [m.profile.nombre, m.profile.apellido].filter(Boolean).join(' ').trim() || m.profile.slug || 'Sin nombre'
              : 'Sin perfil'
            const initials = nombre.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
            const colors = ROL_COLORS[m.rol]
            const puedeQuitar =
              puedeInvitar &&
              m.rol !== 'owner' &&
              !(miRol === 'admin' && m.rol === 'admin')

            return (
              <div key={m.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                  {m.profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.profile.avatar_url} alt={nombre} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{nombre}</div>
                  <div className="text-xs text-gray-500">
                    Se unió {new Date(m.joined_at).toLocaleDateString('es-CO')}
                  </div>
                </div>

                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {ROL_LABELS[m.rol]}
                </span>

                {puedeQuitar && (
                  <button
                    onClick={() => quitarMiembro(m.user_id, nombre)}
                    className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Quitar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Invitaciones pendientes */}
      {invitaciones.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50 flex items-center gap-2">
            <span>📧</span>
            <span className="text-sm font-semibold text-gray-700">
              Invitaciones pendientes ({invitaciones.length})
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {invitaciones.map((inv) => (
              <div key={inv.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
                  ⏳
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{inv.email}</div>
                  <div className="text-xs text-gray-500">{diasRestantes(inv.expires_at)}</div>
                </div>

                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: ROL_COLORS[inv.rol]?.bg, color: ROL_COLORS[inv.rol]?.text }}
                >
                  {ROL_LABELS[inv.rol]}
                </span>

                {puedeInvitar && (
                  <button
                    onClick={() => cancelarInvitacion(inv.id, inv.email)}
                    className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de invitar */}
      {modalAbierto && (
        <ModalInvitar
          onClose={() => setModalAbierto(false)}
          onSuccess={() => {
            setSuccess('Invitación enviada por email')
            setTimeout(() => setSuccess(null), 3000)
            setModalAbierto(false)
            cargar()
          }}
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────
// Modal de invitación
// ────────────────────────────────────────────
function ModalInvitar({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<'admin' | 'viewer'>('admin')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async () => {
    if (!email.trim()) {
      setError('Ingresa un email válido')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), rol }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar invitación')
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => !enviando && onClose()}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          ✉ Invitar al equipo
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Le enviaremos un email con un enlace para unirse.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
            ❌ {error}
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">
            Email de la persona
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="carlos@empresa.com"
            disabled={enviando}
            autoFocus
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
          />
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-700 block mb-2">
            Permisos
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setRol('admin')}
              type="button"
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                rol === 'admin' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-sm text-gray-900">Admin</div>
              <div className="text-xs text-gray-500">
                Puede ver y editar productos, leads, landing y bot.
              </div>
            </button>
            <button
              onClick={() => setRol('viewer')}
              type="button"
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                rol === 'viewer' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-sm text-gray-900">Solo lectura</div>
              <div className="text-xs text-gray-500">
                Solo puede ver. No puede editar nada.
              </div>
            </button>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={enviando}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={enviando || !email.trim()}
            className="px-5 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </div>
      </div>
    </div>
  )
}
