'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SeccionesEditor } from './SeccionesEditor'
import { BloqueStats } from './landing-editor/BloqueStats'
import { BloqueComoFunciona } from './landing-editor/BloqueComoFunciona'
import { BloqueTestimonios } from './landing-editor/BloqueTestimonios'
import { BloqueCTAyBadge } from './landing-editor/BloqueCTAyBadge'
import { BloquesActivos, type BloquesConfig } from './landing-editor/BloquesActivos'

type Stat = { valor: string; label: string }
type Paso = { titulo: string; descripcion: string }

type ConfigForm = {
  titulo: string
  subtitulo: string
  producto: string
  color_acento: string
  imagen_hero?: string
  imagen_logo?: string
  imagenes_galeria?: string[]
  // Campos Fase 1+2
  stats?: Stat[]
  como_funciona?: Paso[]
  bloques_activos?: BloquesConfig
  badge_promo?: string
  cta_principal_texto?: string
  cta_principal_microcopy?: string
}

type Testimonio = {
  id: string
  nombre_cliente: string
  texto: string
  rating: number
  avatar_url: string | null
}

type Props = {
  slug: string
  configInicial: ConfigForm
  industria?: string
  empresa?: string
  nombreVendedor?: string
  testimoniosIniciales?: Testimonio[]
}

type ChatMsg = { role: 'user' | 'ai'; text: string }

type ImagenUnsplash = {
  id: string
  url: string
  thumb: string
  alt: string
  autor: string
  autorUrl: string
}

type TipoImagen = 'hero' | 'logo' | 'galeria'

// Tipos para comandos de productos
type ComandoProducto =
  | { accion: 'crear'; nombre: string; precio?: string; descripcion?: string; buscar_imagen?: string }
  | { accion: 'actualizar'; nombre_aproximado?: string; nuevo_nombre?: string; precio?: string; descripcion?: string }
  | { accion: 'eliminar'; nombre_aproximado?: string }
  | { accion: 'agregar_imagen'; nombre_aproximado?: string; rol: 'principal' | 'adicional'; query_imagen: string }

type ImagenProducto = {
  id: string
  url: string
  thumb: string
  alt: string
  autor: string
}

const COLORES_SUGERIDOS = [
  { nombre: 'Naranja', hex: '#FF6B2B' },
  { nombre: 'Azul', hex: '#185FA5' },
  { nombre: 'Verde', hex: '#00BF63' },
  { nombre: 'Rojo', hex: '#E74C3C' },
  { nombre: 'Morado', hex: '#7C3AED' },
  { nombre: 'Rosa', hex: '#EC4899' },
]

export function LandingEditorClient({
  slug,
  configInicial,
  industria,
  empresa,
  nombreVendedor,
  testimoniosIniciales = [],
}: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ConfigForm>(configInicial)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const [iaTab, setIaTab] = useState<'generar' | 'analizar' | 'chat'>('generar')
  const [iaLoading, setIaLoading] = useState(false)
  const [analisis, setAnalisis] = useState('')
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [iaOpen, setIaOpen] = useState(true)

  const [aplicandoMejoras, setAplicandoMejoras] = useState(false)
  const [snapshotPrevio, setSnapshotPrevio] = useState<{
    titulo: string; subtitulo: string; producto: string
  } | null>(null)

  const [imagenesEncontradas, setImagenesEncontradas] = useState<ImagenUnsplash[]>([])
  const [tipoImagenActiva, setTipoImagenActiva] = useState<TipoImagen | null>(null)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [tipoSubida, setTipoSubida] = useState<TipoImagen>('hero')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── NUEVO: imágenes de productos pendientes de seleccionar ──
  const [imagenesProducto, setImagenesProducto] = useState<{
    productoId: string
    productoNombre: string
    rol: 'principal' | 'adicional'
    imagenes: ImagenProducto[]
  } | null>(null)

  const hayCambios =
    form.titulo !== configInicial.titulo ||
    form.subtitulo !== configInicial.subtitulo ||
    form.producto !== configInicial.producto ||
    form.color_acento !== configInicial.color_acento

  const actualizar = <K extends keyof ConfigForm>(campo: K, valor: ConfigForm[K]) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
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
      setSnapshotPrevio(null)
      setTimeout(() => setPreviewKey(k => k + 1), 300)
      router.refresh()
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al guardar' })
    } finally {
      setGuardando(false)
    }
  }

  const generarContenido = async () => {
    setIaLoading(true)
    try {
      const res = await fetch('/api/landing/ia-generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, form }),
      })
      const data = await res.json()
      if (data.titulo) actualizar('titulo', data.titulo)
      if (data.subtitulo) actualizar('subtitulo', data.subtitulo)
      if (data.producto) actualizar('producto', data.producto)
      setMensaje({ tipo: 'ok', texto: 'Contenido generado. Revisa y guarda si te gusta.' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al generar contenido' })
    } finally {
      setIaLoading(false)
    }
  }

  const analizarLanding = async () => {
    setIaLoading(true)
    setAnalisis('')
    setSnapshotPrevio(null)
    try {
      const res = await fetch('/api/landing/ia-analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, form }),
      })
      const data = await res.json()
      setAnalisis(data.analisis || '')
    } catch {
      setAnalisis('Error al analizar. Intenta de nuevo.')
    } finally {
      setIaLoading(false)
    }
  }

  const aplicarMejoras = async () => {
    if (!analisis || aplicandoMejoras) return
    setAplicandoMejoras(true)
    setMensaje(null)
    setSnapshotPrevio({
      titulo: form.titulo || '',
      subtitulo: form.subtitulo || '',
      producto: form.producto || '',
    })
    try {
      const res = await fetch('/api/landing/ia-aplicar-mejoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, form, analisis }),
      })
      const data = await res.json()
      if (data.error) {
        setMensaje({ tipo: 'error', texto: data.error })
        setSnapshotPrevio(null)
        return
      }
      if (data.titulo) actualizar('titulo', data.titulo)
      if (data.subtitulo) actualizar('subtitulo', data.subtitulo)
      if (data.producto) actualizar('producto', data.producto)
      setMensaje({ tipo: 'ok', texto: 'Mejoras aplicadas. Revisa el preview y guarda si te gustan.' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al aplicar mejoras' })
      setSnapshotPrevio(null)
    } finally {
      setAplicandoMejoras(false)
    }
  }

  const deshacerMejoras = () => {
    if (!snapshotPrevio) return
    actualizar('titulo', snapshotPrevio.titulo)
    actualizar('subtitulo', snapshotPrevio.subtitulo)
    actualizar('producto', snapshotPrevio.producto)
    setSnapshotPrevio(null)
    setMensaje({ tipo: 'ok', texto: 'Cambios revertidos.' })
  }

  // ── NUEVO: Ejecutar comando de producto ──
  const ejecutarComandoProducto = async (cmd: ComandoProducto) => {
    try {
      const res = await fetch('/api/landing/ia-comandos-productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd),
      })
      const data = await res.json()

      if (!res.ok) {
        setChatMsgs(m => [...m, { role: 'ai', text: `❌ ${data.error || 'Error en el comando'}` }])
        return
      }

      // Mensaje según acción
      if (data.accion === 'crear') {
        let texto = `✅ Producto creado: **${data.producto.nombre}**`
        if (data.imagenSugerida) {
          // Aplicar imagen sugerida automáticamente
          await fetch(`/api/productos/${data.producto.id}/imagen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rol: 'principal', url: data.imagenSugerida.url }),
          })
          texto += `\n📷 Imagen aplicada (foto de ${data.imagenSugerida.autor} en Unsplash)`
        }
        setChatMsgs(m => [...m, { role: 'ai', text: texto }])
        setTimeout(() => setPreviewKey(k => k + 1), 500)
      } else if (data.accion === 'actualizar') {
        setChatMsgs(m => [...m, {
          role: 'ai',
          text: `✅ Producto **${data.producto.nombre}** actualizado.`,
        }])
        setTimeout(() => setPreviewKey(k => k + 1), 500)
      } else if (data.accion === 'eliminar') {
        setChatMsgs(m => [...m, {
          role: 'ai',
          text: `✅ Producto **${data.nombre}** eliminado.`,
        }])
        setTimeout(() => setPreviewKey(k => k + 1), 500)
      } else if (data.accion === 'agregar_imagen') {
        // Mostrar grid de imágenes para seleccionar
        setImagenesProducto({
          productoId: data.producto_id,
          productoNombre: data.producto_nombre,
          rol: data.rol,
          imagenes: data.imagenes,
        })
        setChatMsgs(m => [...m, {
          role: 'ai',
          text: `Aquí tienes opciones para **${data.producto_nombre}**. Selecciona una:`,
        }])
      }
    } catch {
      setChatMsgs(m => [...m, { role: 'ai', text: '❌ Error al ejecutar el comando' }])
    }
  }

  // ── Aplicar imagen seleccionada al producto ──
  const aplicarImagenAProducto = async (url: string) => {
    if (!imagenesProducto) return
    setSubiendoImagen(true)
    try {
      const res = await fetch(`/api/productos/${imagenesProducto.productoId}/imagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: imagenesProducto.rol, url }),
      })
      const data = await res.json()
      if (data.ok) {
        setChatMsgs(m => [...m, {
          role: 'ai',
          text: `✅ Imagen aplicada a **${imagenesProducto.productoNombre}** como ${imagenesProducto.rol}.`,
        }])
        setImagenesProducto(null)
        setTimeout(() => setPreviewKey(k => k + 1), 500)
      } else {
        setChatMsgs(m => [...m, { role: 'ai', text: `❌ ${data.error || 'Error al aplicar'}` }])
      }
    } catch {
      setChatMsgs(m => [...m, { role: 'ai', text: '❌ Error al aplicar imagen' }])
    } finally {
      setSubiendoImagen(false)
    }
  }

  const enviarChat = async () => {
    if (!chatInput.trim() || iaLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMsgs(m => [...m, { role: 'user', text: userMsg }])
    setIaLoading(true)
    setImagenesEncontradas([])

    try {
      const res = await fetch('/api/landing/ia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, form, message: userMsg, history: chatMsgs }),
      })
      const data = await res.json()

      setChatMsgs(m => [...m, { role: 'ai', text: data.reply }])

      if (data.titulo) actualizar('titulo', data.titulo)
      if (data.subtitulo) actualizar('subtitulo', data.subtitulo)
      if (data.producto) actualizar('producto', data.producto)

      if (data.buscarImagen) {
        setTipoImagenActiva(data.buscarImagen.tipo)
        await buscarImagenes(data.buscarImagen.query, data.buscarImagen.orientation)
      }

      // ── NUEVO: ejecutar comando de producto si vino ──
      if (data.comandoProducto) {
        await ejecutarComandoProducto(data.comandoProducto)
      }
    } catch {
      setChatMsgs(m => [...m, { role: 'ai', text: 'Error al conectar. Intenta de nuevo.' }])
    } finally {
      setIaLoading(false)
    }
  }

  const buscarImagenes = async (query: string, orientation = 'landscape') => {
    try {
      const res = await fetch('/api/landing/ia-buscar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, orientation, perPage: 6 }),
      })
      const data = await res.json()
      if (data.imagenes) setImagenesEncontradas(data.imagenes)
    } catch (e) {
      console.error('Error buscando imágenes:', e)
    }
  }

  const usarImagenUnsplash = async (url: string, tipo: TipoImagen) => {
    setSubiendoImagen(true)
    try {
      const res = await fetch('/api/landing/upload-imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, url }),
      })
      const data = await res.json()
      if (data.ok) {
        if (tipo === 'hero') actualizar('imagen_hero', data.url)
        if (tipo === 'logo') actualizar('imagen_logo', data.url)
        if (tipo === 'galeria') actualizar('imagenes_galeria', data.galeria)
        setChatMsgs(m => [...m, { role: 'ai', text: `✅ Imagen aplicada como ${tipo}.` }])
        setImagenesEncontradas([])
        setTipoImagenActiva(null)
        setTimeout(() => setPreviewKey(k => k + 1), 500)
      } else {
        setChatMsgs(m => [...m, { role: 'ai', text: `❌ ${data.error || 'Error'}` }])
      }
    } catch {
      setChatMsgs(m => [...m, { role: 'ai', text: '❌ Error al aplicar imagen' }])
    } finally {
      setSubiendoImagen(false)
    }
  }

  const subirArchivoChat = async (file: File, tipo: TipoImagen) => {
    if (file.size > 5 * 1024 * 1024) {
      setChatMsgs(m => [...m, { role: 'ai', text: '❌ La imagen supera 5MB' }])
      return
    }
    setSubiendoImagen(true)
    setChatMsgs(m => [...m, { role: 'user', text: `📎 Subiendo ${tipo}: ${file.name}` }])
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', tipo)
      const res = await fetch('/api/landing/upload-imagen', {
        method: 'POST', body: formData,
      })
      const data = await res.json()
      if (data.ok) {
        if (tipo === 'hero') actualizar('imagen_hero', data.url)
        if (tipo === 'logo') actualizar('imagen_logo', data.url)
        if (tipo === 'galeria') actualizar('imagenes_galeria', data.galeria)
        setChatMsgs(m => [...m, { role: 'ai', text: `✅ Imagen subida como ${tipo}.` }])
        setTimeout(() => setPreviewKey(k => k + 1), 500)
      } else {
        setChatMsgs(m => [...m, { role: 'ai', text: `❌ ${data.error || 'Error'}` }])
      }
    } catch {
      setChatMsgs(m => [...m, { role: 'ai', text: '❌ Error al subir' }])
    } finally {
      setSubiendoImagen(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/productos"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            📦 Gestionar productos
          </Link>
          <a href={"/u/" + slug} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2 !px-4 !text-sm">
            Abrir en nueva pestaña
          </a>
        </div>
      </header>

      {/* Panel IA */}
      <div style={{ background: 'linear-gradient(135deg,#0f1c2e 0%,#1a1a2e 100%)', border: '1px solid rgba(255,107,43,.25)', borderRadius: '20px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <button
          onClick={() => setIaOpen(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FF6B2B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✨</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>Asistente IA de Landing</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Genera, analiza y mejora tu página con IA</div>
            </div>
          </div>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '18px' }}>{iaOpen ? '▲' : '▼'}</span>
        </button>

        {iaOpen && (
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', background: 'rgba(255,255,255,.05)', borderRadius: '12px', padding: '4px' }}>
              {([
                { key: 'generar', label: '⚡ Generar' },
                { key: 'analizar', label: '🔍 Analizar' },
                { key: 'chat', label: '💬 Chat IA' },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setIaTab(t.key)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 700, transition: 'all .15s',
                    background: iaTab === t.key ? '#FF6B2B' : 'transparent',
                    color: iaTab === t.key ? '#fff' : 'rgba(255,255,255,.5)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {iaTab === 'generar' && (
              <div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)', marginBottom: '1rem', lineHeight: 1.6 }}>
                  La IA analizará tu industria, productos y perfil para generar contenido optimizado.
                </p>
                <button
                  onClick={generarContenido}
                  disabled={iaLoading}
                  style={{ background: '#FF6B2B', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: iaLoading ? .7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {iaLoading ? (
                    <>
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                      Generando...
                    </>
                  ) : '✨ Generar contenido con IA'}
                </button>
              </div>
            )}

            {iaTab === 'analizar' && (
              <div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)', marginBottom: '1rem', lineHeight: 1.6 }}>
                  La IA revisará tu landing y te dará un diagnóstico.
                </p>
                <button
                  onClick={analizarLanding}
                  disabled={iaLoading}
                  style={{ background: '#FF6B2B', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: iaLoading ? .7 : 1, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  {iaLoading ? 'Analizando...' : '🔍 Analizar mi landing'}
                </button>

                {analisis && (
                  <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px', padding: '1.25rem' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.85)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{analisis}</div>

                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {!snapshotPrevio ? (
                        <button
                          onClick={aplicarMejoras}
                          disabled={aplicandoMejoras}
                          style={{
                            background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
                            color: '#fff', border: 'none', borderRadius: '10px',
                            padding: '11px 22px', fontSize: '13px', fontWeight: 700,
                            cursor: aplicandoMejoras ? 'wait' : 'pointer',
                            opacity: aplicandoMejoras ? .7 : 1,
                          }}>
                          {aplicandoMejoras ? 'Aplicando...' : '✨ Aplicar mejoras'}
                        </button>
                      ) : (
                        <>
                          <div style={{ padding: '8px 14px', background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.4)', borderRadius: '10px', fontSize: '12px', color: '#86efac', fontWeight: 600 }}>
                            ✅ Mejoras aplicadas
                          </div>
                          <button
                            onClick={deshacerMejoras}
                            style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            ↩️ Deshacer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {iaTab === 'chat' && (
              <div>
                <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '1rem', minHeight: '180px', maxHeight: '380px', overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chatMsgs.length === 0 && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: '2rem' }}>
                      Pregúntame cómo mejorar tu landing...<br/>
                      <span style={{ fontSize: '12px' }}>
                        ej. &quot;Crea un producto de Kia a $85M&quot; · &quot;Agrega foto al Kia&quot; · &quot;Busca imagen para el hero&quot;
                      </span>
                    </div>
                  )}
                  {chatMsgs.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%', padding: '9px 13px', borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                        background: m.role === 'user' ? '#FF6B2B' : 'rgba(255,255,255,.1)',
                        fontSize: '13px', color: '#fff', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                      }}>
                        {m.role === 'ai' && <div style={{ fontSize: '10px', fontWeight: 700, color: '#FF8C42', marginBottom: '3px', letterSpacing: '.06em' }}>IA</div>}
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {/* Grid de imágenes para landing (hero/logo/galeria) */}
                  {imagenesEncontradas.length > 0 && tipoImagenActiva && (
                    <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', marginBottom: '8px' }}>
                        Selecciona una para usar como <strong style={{ color: '#FF8C42', textTransform: 'uppercase' }}>{tipoImagenActiva}</strong>:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {imagenesEncontradas.map(img => (
                          <button
                            key={img.id}
                            onClick={() => usarImagenUnsplash(img.url, tipoImagenActiva)}
                            disabled={subiendoImagen}
                            style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,.1)', background: '#222', cursor: subiendoImagen ? 'wait' : 'pointer', padding: 0, opacity: subiendoImagen ? .5 : 1 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.thumb} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)', padding: '3px 6px', fontSize: '9px', color: 'rgba(255,255,255,.8)', textAlign: 'left' }}>
                              📷 {img.autor}
                            </div>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { setImagenesEncontradas([]); setTipoImagenActiva(null) }} style={{ marginTop: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* NUEVO: Grid de imágenes para PRODUCTO */}
                  {imagenesProducto && (
                    <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(255,107,43,.08)', border: '1px solid rgba(255,107,43,.3)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.7)', marginBottom: '8px' }}>
                        Imágenes para <strong style={{ color: '#FF8C42' }}>{imagenesProducto.productoNombre}</strong> ({imagenesProducto.rol}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {imagenesProducto.imagenes.map(img => (
                          <button
                            key={img.id}
                            onClick={() => aplicarImagenAProducto(img.url)}
                            disabled={subiendoImagen}
                            style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,107,43,.3)', background: '#222', cursor: subiendoImagen ? 'wait' : 'pointer', padding: 0, opacity: subiendoImagen ? .5 : 1 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.thumb} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)', padding: '3px 6px', fontSize: '9px', color: 'rgba(255,255,255,.8)', textAlign: 'left' }}>
                              📷 {img.autor}
                            </div>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setImagenesProducto(null)} style={{ marginTop: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                        Cancelar
                      </button>
                    </div>
                  )}

                  {(iaLoading || subiendoImagen) && (
                    <div style={{ display: 'flex', gap: '4px', padding: '10px 13px', background: 'rgba(255,255,255,.1)', borderRadius: '4px 14px 14px 14px', maxWidth: '60px' }}>
                      {[0,1,2].map(d => <span key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B2B', display: 'inline-block', animation: `bounce 1.2s ease ${d*.25}s infinite` }} />)}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>Si subes imagen, será:</span>
                  {(['hero', 'logo', 'galeria'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTipoSubida(t)}
                      style={{
                        padding: '3px 10px', borderRadius: '6px', border: 'none',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        background: tipoSubida === t ? '#FF6B2B' : 'rgba(255,255,255,.08)',
                        color: tipoSubida === t ? '#fff' : 'rgba(255,255,255,.5)',
                        textTransform: 'capitalize',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    ref={fileInputRef}
                    type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) subirArchivoChat(f, tipoSubida) }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoImagen || iaLoading}
                    title="Adjuntar imagen"
                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: '16px', cursor: 'pointer', opacity: (subiendoImagen || iaLoading) ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📎
                  </button>

                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviarChat()}
                    placeholder="ej. Crea un producto de... · Agrega foto al... · Busca imagen para hero..."
                    disabled={iaLoading || subiendoImagen}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button
                    onClick={enviarChat}
                    disabled={iaLoading || subiendoImagen || !chatInput.trim()}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: chatInput.trim() ? '#FF6B2B' : 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ➤
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor de secciones dinámicas */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SeccionesEditor form={form} analisisPrevio={analisis} />
      </div>

      {/* Grid principal */}
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
              {mensaje && (<span className={"text-sm " + (mensaje.tipo === 'ok' ? 'text-green-600' : 'text-red-600')}>{mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}</span>)}
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
            <button onClick={() => setPreviewKey(k => k + 1)} className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium">Refrescar</button>
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

{/* ═════════ FASE 2: Bloques avanzados ═════════ */}
<div className="mt-8 space-y-4">
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-semibold text-brand-navy mb-1">Personalización avanzada</h2>
          <p className="text-sm text-gray-500 mb-6">
            Configura cada bloque de tu landing. Los cambios se guardan al hacer clic en &ldquo;Guardar cambios&rdquo;.
          </p>
        </div>

        <details className="card p-6" open>
          <summary className="text-lg font-semibold text-brand-navy cursor-pointer">📊 Stats sociales</summary>
          <div className="mt-4">
            <BloqueStats
              stats={form.stats || []}
              onChange={(s) => actualizar('stats', s)}
              industria={industria}
              empresa={empresa}
              nombreVendedor={nombreVendedor}
              productoPrincipal={form.producto}
            />
          </div>
        </details>

        <details className="card p-6">
          <summary className="text-lg font-semibold text-brand-navy cursor-pointer">🎯 Botón principal y badge</summary>
          <div className="mt-4">
            <BloqueCTAyBadge
              badge_promo={form.badge_promo || ''}
              cta_principal_texto={form.cta_principal_texto || 'Reservar mi cita'}
              cta_principal_microcopy={form.cta_principal_microcopy || 'Te respondo en 5 min por WhatsApp'}
              onChange={(campo, valor) => actualizar(campo, valor)}
            />
          </div>
        </details>

        <details className="card p-6">
          <summary className="text-lg font-semibold text-brand-navy cursor-pointer">🚀 Cómo funciona</summary>
          <div className="mt-4">
            <BloqueComoFunciona
              pasos={form.como_funciona || []}
              onChange={(p) => actualizar('como_funciona', p)}
              industria={industria}
              empresa={empresa}
              nombreVendedor={nombreVendedor}
              productoPrincipal={form.producto}
            />
          </div>
        </details>

        <details className="card p-6">
          <summary className="text-lg font-semibold text-brand-navy cursor-pointer">💬 Testimonios</summary>
          <div className="mt-4">
            <BloqueTestimonios testimoniosIniciales={testimoniosIniciales} />
          </div>
        </details>

        <details className="card p-6">
          <summary className="text-lg font-semibold text-brand-navy cursor-pointer">⚙️ Bloques activos</summary>
          <div className="mt-4">
            <BloquesActivos
              bloques={form.bloques_activos || {
                hero: true, stats: true, productos: true,
                como_funciona: true, testimonios: true, cta_cierre: true,
              }}
              onChange={(b) => actualizar('bloques_activos', b)}
            />
          </div>
        </details>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      `}</style>
    </div>
  )
}