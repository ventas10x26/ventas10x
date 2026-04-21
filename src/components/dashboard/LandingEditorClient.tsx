'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ConfigForm = {
  titulo: string
  subtitulo: string
  producto: string
  color_acento: string
}

type Props = {
  slug: string
  configInicial: ConfigForm
}

const COLORES_SUGERIDOS = [
  { nombre: 'Naranja', hex: '#FF6B2B' },
  { nombre: 'Azul', hex: '#185FA5' },
  { nombre: 'Verde', hex: '#00BF63' },
  { nombre: 'Rojo', hex: '#E74C3C' },
  { nombre: 'Morado', hex: '#7C3AED' },
  { nombre: 'Rosa', hex: '#EC4899' },
]

export function LandingEditorClient({ slug, configInicial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ConfigForm>(configInicial)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const hayCambios =
    form.titulo !== configInicial.titulo ||
    form.subtitulo !== configInicial.subtitulo ||
    form.producto !== configInicial.producto ||
    form.color_acento !== configInicial.color_acento

  const actualizar = (campo: keyof ConfigForm, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setMensaje(null)
  }

  const guardar = async () => {
    setGuardando(true)
    setMensaje(null)
    try {
      const res = await fetch('/api/landing/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      setMensaje({ tipo: 'ok', texto: 'Cambios guardados.' })
      setTimeout(() => setPreviewKey((k) => k + 1), 300)
      router.refresh()
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al guardar' })
    } finally {
      setGuardando(false)
    }
  }

  const refrescarPreview = () => {
    setPreviewKey((k) => k + 1)
  }

  if (!slug) {
    return (
      <div className="px-6 py-8 md:px-10">
        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Configura tu URL</h2>
          <a href="/dashboard/perfil" className="btn-primary inline-block">Ir a Mi Perfil</a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 md:px-10">
      <header className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-brand-navy">Mi landing</h1>
          <p className="mt-1 text-sm text-gray-500">URL: <a href={"/u/" + slug} target="_blank" rel="noopener noreferrer" className="font-mono text-brand-orange hover:underline">ventas10x.co/u/{slug}</a></p>
        </div>
        <a href={"/u/" + slug} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2 !px-4 !text-sm">Abrir en nueva pestaña</a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-brand-navy">Textos</h2>
            <div>
              <label className="label">Título principal</label>
              <textarea value={form.titulo} onChange={(e) => actualizar('titulo', e.target.value)} rows={2} className="input" placeholder="Tu solución, personalizada." maxLength={120} />
              <p className="text-xs text-gray-500 mt-1">Puedes usar {"{producto}"} como placeholder.</p>
            </div>
            <div>
              <label className="label">Subtítulo</label>
              <textarea value={form.subtitulo} onChange={(e) => actualizar('subtitulo', e.target.value)} rows={3} className="input" placeholder="Escríbeme ahora..." maxLength={200} />
            </div>
            <div>
              <label className="label">Palabra clave del producto</label>
              <input value={form.producto} onChange={(e) => actualizar('producto', e.target.value)} className="input" placeholder="autos, electrodomésticos..." maxLength={40} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Color principal</h2>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              {COLORES_SUGERIDOS.map((c) => (
                <button key={c.hex} onClick={() => actualizar('color_acento', c.hex)} className={"flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all " + (form.color_acento.toLowerCase() === c.hex.toLowerCase() ? 'border-gray-900' : 'border-gray-200 hover:border-gray-300')}>
                  <span className="w-5 h-5 rounded-full border border-gray-200" style={{ background: c.hex }} />
                  <span className="text-xs font-medium">{c.nombre}</span>
                </button>
              ))}
            </div>
            <label className="label">O color custom (hex)</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color_acento} onChange={(e) => actualizar('color_acento', e.target.value)} className="w-14 h-10 rounded-lg border border-gray-200 cursor-pointer" />
              <input value={form.color_acento} onChange={(e) => actualizar('color_acento', e.target.value)} className="input font-mono text-sm" placeholder="#FF6B2B" maxLength={7} />
            </div>
          </section>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              {mensaje && (<span className={"text-sm " + (mensaje.tipo === 'ok' ? 'text-green-600' : 'text-red-600')}>{mensaje.tipo === 'ok' ? 'OK' : 'Error'}: {mensaje.texto}</span>)}
            </div>
            <div className="flex items-center gap-2">
              {hayCambios && (<span className="text-xs text-gray-500">Hay cambios sin guardar</span>)}
              <button onClick={guardar} disabled={guardando || !hayCambios} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-navy">Vista previa</h2>
            <button onClick={refrescarPreview} className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium">Refrescar</button>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-card">
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center"><span className="text-xs text-gray-500 font-mono">ventas10x.co/u/{slug}</span></div>
            </div>
            <iframe key={previewKey} src={"/u/" + slug + "?preview=" + previewKey} className="w-full h-[700px] bg-white" title="Preview" />
          </div>
          <p className="text-xs text-gray-500 text-center">Guarda los cambios y el preview se actualiza.</p>
        </div>
      </div>
    </div>
  )
}
