// Ruta destino: src/components/dashboard/PerfilClient.tsx
// REEMPLAZA. Cambios:
// - Agrega el card NotificacionesWhatsAppCard al final
// - Recibe la config inicial de CallMeBot vía props

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotificacionesWhatsAppCard } from './NotificacionesWhatsAppCard'

type ProfileForm = {
  nombre: string
  apellido: string
  empresa: string
  whatsapp: string
  slug: string
}

type CallMeBotConfig = {
  apikey: string
  telefono: string
  activa: boolean
}

type Props = {
  email: string
  avatarUrl: string | null
  initials: string
  profileInicial: ProfileForm
  callmebotInicial?: CallMeBotConfig
}

export function PerfilClient({
  email,
  avatarUrl,
  initials,
  profileInicial,
  callmebotInicial,
}: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ProfileForm>(profileInicial)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const slugOriginal = profileInicial.slug
  const slugCambio = form.slug !== slugOriginal && slugOriginal.length > 0

  const actualizar = (campo: keyof ProfileForm, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setMensaje(null)
  }

  const guardar = async () => {
    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      setMensaje({ tipo: 'ok', texto: 'Perfil actualizado correctamente.' })
      router.refresh()
    } catch (e) {
      setMensaje({
        tipo: 'error',
        texto: e instanceof Error ? e.message : 'Error al guardar',
      })
    } finally {
      setGuardando(false)
    }
  }

  const cerrarSesion = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const onSlugChange = (valor: string) => {
    const limpio = valor
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 30)
    actualizar('slug', limpio)
  }

  return (
    <div className="px-6 py-8 md:px-10 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-brand-navy">Mi perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Información de tu cuenta y datos para tu landing pública.
        </p>
      </header>

      {/* Avatar + email */}
      <section className="card p-6 mb-6 flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-brand-orange text-white flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-gray-500">Correo electrónico</p>
          <p className="font-semibold text-brand-navy">{email}</p>
        </div>
      </section>

      {/* Datos personales */}
      <section className="card p-6 mb-6 space-y-4">
        <h2 className="text-lg font-semibold text-brand-navy mb-2">Datos personales</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => actualizar('nombre', e.target.value)}
              className="input"
              placeholder="Tu nombre"
              maxLength={50}
            />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input
              value={form.apellido}
              onChange={(e) => actualizar('apellido', e.target.value)}
              className="input"
              placeholder="Tu apellido"
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label className="label">Empresa</label>
          <input
            value={form.empresa}
            onChange={(e) => actualizar('empresa', e.target.value)}
            className="input"
            placeholder="Nombre de tu empresa o negocio"
            maxLength={80}
          />
        </div>

        <div>
          <label className="label">WhatsApp</label>
          <input
            value={form.whatsapp}
            onChange={(e) => actualizar('whatsapp', e.target.value)}
            className="input"
            placeholder="+57 300 000 0000"
            maxLength={30}
          />
          <p className="text-xs text-gray-500 mt-1">
            Incluye código de país. Este será el número donde te contacten los prospectos.
          </p>
        </div>
      </section>

      {/* URL pública */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-2">Tu URL pública</h2>
        <p className="text-sm text-gray-500 mb-4">
          Este es el enlace que compartes con tus prospectos para llegar a tu landing.
        </p>

        <label className="label">Slug de la URL</label>
        <div className="flex rounded-xl shadow-sm">
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
            ventas10x.co/u/
          </span>
          <input
            value={form.slug}
            onChange={(e) => onSlugChange(e.target.value)}
            className="flex-1 px-4 py-3 rounded-r-xl border border-gray-200 text-gray-900 text-sm font-mono outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
            placeholder="mi-negocio"
            maxLength={30}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Solo minúsculas, números y guiones. Máximo 30 caracteres.
        </p>

        {slugCambio && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            ⚠️ <strong>Cambiar el slug rompe tu URL anterior</strong>. Si ya compartiste
            <span className="font-mono"> ventas10x.co/u/{slugOriginal}</span>, esos links
            dejarán de funcionar.
          </div>
        )}
      </section>

      {/* Acciones perfil */}
      <section className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <button
          onClick={cerrarSesion}
          className="text-sm font-medium text-gray-500 hover:text-red-500"
        >
          Cerrar sesión
        </button>

        <div className="flex items-center gap-3">
          {mensaje && (
            <span className={`text-sm ${mensaje.tipo === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {mensaje.tipo === 'ok' ? '✓' : '⚠️'} {mensaje.texto}
            </span>
          )}
          <button
            onClick={guardar}
            disabled={guardando}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </section>

      {/* ─── NUEVA SECCIÓN: Notificaciones WhatsApp ─── */}
      <NotificacionesWhatsAppCard
        apiKeyInicial={callmebotInicial?.apikey ?? ''}
        telefonoInicial={callmebotInicial?.telefono ?? ''}
        activaInicial={callmebotInicial?.activa ?? false}
      />
    </div>
  )
}
