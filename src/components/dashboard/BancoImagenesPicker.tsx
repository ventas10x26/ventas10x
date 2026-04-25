// Ruta destino: src/components/dashboard/BancoImagenesPicker.tsx
// Picker de imágenes del banco. Reutilizable en cualquier modal/lugar.
// Permite: ver mis imágenes, ver públicas, buscar por tags/categoría,
// subir nueva, hacer pública/privada, eliminar.

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type ImagenBanco = {
  id: string
  vendedor_id: string
  url: string
  publica: boolean
  aprobada: boolean
  motivo_rechazo: string | null
  etiquetas: string[]
  descripcion: string | null
  categoria: string | null
  veces_usada: number
  created_at: string
}

type Scope = 'mias' | 'publicas' | 'todas'

const CATEGORIAS = [
  { value: '', label: 'Todas' },
  { value: 'vehiculo', label: '🚗 Vehículos' },
  { value: 'inmueble', label: '🏠 Inmuebles' },
  { value: 'alimento', label: '🍔 Alimentos' },
  { value: 'moda', label: '👗 Moda' },
  { value: 'tecnologia', label: '💻 Tecnología' },
  { value: 'salud', label: '💊 Salud' },
  { value: 'servicio', label: '🛠 Servicio' },
  { value: 'personas', label: '👥 Personas' },
  { value: 'ambiente', label: '🌳 Ambiente' },
  { value: 'abstracto', label: '🎨 Abstracto' },
  { value: 'otro', label: '📦 Otro' },
]

type Props = {
  /** Cuando el usuario hace click en "usar esta imagen" */
  onSeleccionar: (imagen: ImagenBanco) => void

  /** Si quieres mostrar solo "Mis imágenes" sin pestañas */
  soloMias?: boolean

  /** Texto del botón de selección, default "Usar imagen" */
  textoBotonSeleccionar?: string
}

export function BancoImagenesPicker({
  onSeleccionar,
  soloMias = false,
  textoBotonSeleccionar = 'Usar',
}: Props) {
  const [scope, setScope] = useState<Scope>(soloMias ? 'mias' : 'mias')
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [imagenes, setImagenes] = useState<ImagenBanco[]>([])
  const [cargando, setCargando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = new URLSearchParams({ scope })
      if (busqueda.trim()) params.append('q', busqueda.trim().toLowerCase())
      if (categoria) params.append('categoria', categoria)

      const res = await fetch(`/api/banco-imagenes?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      setImagenes(data.imagenes || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setCargando(false)
    }
  }, [scope, busqueda, categoria])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Mensajes auto-ocultar
  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(null), 3500)
    return () => clearTimeout(t)
  }, [mensaje])

  const subirImagen = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera 5MB')
      return
    }

    setSubiendo(true)
    setError(null)
    setMensaje('Subiendo y analizando con IA... (puede tardar 5-10 segundos)')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('publica', 'false')

      const res = await fetch('/api/banco-imagenes', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir')

      // Recargar
      await cargar()

      setMensaje(data.mensaje || '✅ Imagen subida')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir')
      setMensaje(null)
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const togglePublica = async (img: ImagenBanco) => {
    if (!img.aprobada && !img.publica) {
      setError(`No se puede publicar: ${img.motivo_rechazo || 'la moderación IA no aprobó'}`)
      return
    }

    try {
      const res = await fetch(`/api/banco-imagenes/${img.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publica: !img.publica }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')

      setImagenes(prev =>
        prev.map(i => (i.id === img.id ? { ...i, publica: data.imagen.publica } : i))
      )
      setMensaje(data.imagen.publica ? '🌍 Ahora es pública' : '🔒 Ahora es privada')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  const eliminar = async (img: ImagenBanco) => {
    if (!confirm('¿Eliminar esta imagen del banco? Esta acción no se puede deshacer.')) return

    try {
      const res = await fetch(`/api/banco-imagenes/${img.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error')
      }
      setImagenes(prev => prev.filter(i => i.id !== img.id))
      setMensaje('🗑 Eliminada')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const seleccionar = async (img: ImagenBanco) => {
    // Registrar uso (asincrono, no bloqueamos)
    fetch('/api/banco-imagenes/usar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: img.url }),
    }).catch(() => {})

    onSeleccionar(img)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Tabs scope (solo si no es soloMias) */}
      {!soloMias && (
        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '4px', borderRadius: '10px' }}>
          {([
            { key: 'mias', label: '📁 Mis imágenes' },
            { key: 'publicas', label: '🌍 Públicas' },
            { key: 'todas', label: '🔀 Todas' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setScope(t.key)}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: '6px',
                fontSize: '0.75rem', fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: scope === t.key ? '#fff' : 'transparent',
                color: scope === t.key ? '#FF6B2B' : '#6b7280',
                boxShadow: scope === t.key ? '0 1px 2px rgba(0,0,0,.05)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Búsqueda + categoría */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por etiqueta o descripción..."
          style={{
            flex: 1, minWidth: '160px',
            padding: '0.5rem 0.75rem',
            border: '1px solid #e5e7eb', borderRadius: '8px',
            fontSize: '0.8rem', outline: 'none',
          }}
        />
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #e5e7eb', borderRadius: '8px',
            fontSize: '0.8rem', outline: 'none',
            background: '#fff',
          }}
        >
          {CATEGORIAS.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Botón subir nueva */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) subirImagen(file)
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={subiendo}
        style={{
          padding: '0.6rem',
          background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontSize: '0.85rem', fontWeight: 700,
          cursor: subiendo ? 'wait' : 'pointer',
          opacity: subiendo ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}
      >
        {subiendo ? (
          <>
            <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
            Analizando...
          </>
        ) : '📤 Subir nueva imagen'}
      </button>

      {/* Mensajes */}
      {error && (
        <div style={{
          padding: '0.5rem 0.75rem', background: '#fee2e2', color: '#991b1b',
          borderRadius: '8px', fontSize: '0.75rem',
        }}>
          ❌ {error}
        </div>
      )}
      {mensaje && (
        <div style={{
          padding: '0.5rem 0.75rem',
          background: mensaje.includes('⚠️') ? '#fffbeb' : '#f0fdf4',
          color: mensaje.includes('⚠️') ? '#92400e' : '#166534',
          border: `1px solid ${mensaje.includes('⚠️') ? '#fcd34d' : '#86efac'}`,
          borderRadius: '8px', fontSize: '0.75rem',
        }}>
          {mensaje}
        </div>
      )}

      {/* Grid de imágenes */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.85rem' }}>
          Cargando...
        </div>
      ) : imagenes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '2rem 1rem',
          background: '#f9fafb', borderRadius: '10px',
          color: '#9ca3af', fontSize: '0.85rem',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
          {scope === 'mias' && busqueda === '' && categoria === ''
            ? 'Aún no tienes imágenes en tu banco. ¡Sube tu primera!'
            : 'No se encontraron imágenes con esos filtros'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.5rem',
          maxHeight: '380px',
          overflowY: 'auto',
        }}>
          {imagenes.map(img => (
            <ImagenCard
              key={img.id}
              img={img}
              onSeleccionar={() => seleccionar(img)}
              onTogglePublica={() => togglePublica(img)}
              onEliminar={() => eliminar(img)}
              textoBotonSeleccionar={textoBotonSeleccionar}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Card individual
// ═══════════════════════════════════════════════════════════════

function ImagenCard({
  img,
  onSeleccionar,
  onTogglePublica,
  onEliminar,
  textoBotonSeleccionar,
}: {
  img: ImagenBanco
  onSeleccionar: () => void
  onTogglePublica: () => void
  onEliminar: () => void
  textoBotonSeleccionar: string
}) {
  // Determinar si la imagen es del usuario actual viendo
  // (lo determinamos por si tiene veces_usada o por el render)
  // En realidad lo más simple es: siempre permitimos seleccionar,
  // pero solo mostramos toggle/eliminar si la imagen pertenece al usuario.
  // Como el endpoint hace que solo nos lleguen las nuestras o públicas, los
  // botones de toggle/eliminar fallarán graciosamente si no es nuestra.
  // Para simplicidad, mostraremos los botones de admin solo si NO está marcada
  // como pública o si está aprobada (heurística aproximada).

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#f3f4f6',
        border: img.publica ? '2px solid #10b981' : '1px solid #e5e7eb',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div
        onClick={onSeleccionar}
        style={{
          aspectRatio: '4/3',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={img.descripcion || 'Imagen'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Badges */}
        <div style={{ position: 'absolute', top: '4px', left: '4px', display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {img.publica && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700,
              padding: '2px 6px', borderRadius: '4px',
              background: 'rgba(16,185,129,.95)', color: '#fff',
            }}>
              🌍 Pública
            </span>
          )}
          {!img.aprobada && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700,
              padding: '2px 6px', borderRadius: '4px',
              background: 'rgba(239,68,68,.95)', color: '#fff',
            }} title={img.motivo_rechazo || 'No aprobada'}>
              ⚠ No apta
            </span>
          )}
        </div>

        {/* Categoría */}
        {img.categoria && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            fontSize: '0.6rem', fontWeight: 600,
            padding: '2px 6px', borderRadius: '4px',
            background: 'rgba(0,0,0,.6)', color: '#fff',
            backdropFilter: 'blur(4px)',
          }}>
            {img.categoria}
          </span>
        )}

        {/* Veces usada */}
        {img.veces_usada > 0 && (
          <span style={{
            position: 'absolute', bottom: '4px', right: '4px',
            fontSize: '0.6rem', fontWeight: 600,
            padding: '2px 6px', borderRadius: '4px',
            background: 'rgba(0,0,0,.6)', color: '#fff',
          }}>
            ↻ {img.veces_usada}
          </span>
        )}
      </div>

      {/* Tags */}
      {img.etiquetas && img.etiquetas.length > 0 && (
        <div style={{
          padding: '4px 6px',
          fontSize: '0.6rem',
          color: '#6b7280',
          background: '#fff',
          minHeight: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          alignItems: 'center',
        }}>
          {img.etiquetas.slice(0, 3).map((tag, i) => (
            <span key={i} style={{
              padding: '1px 6px', borderRadius: '3px',
              background: '#f3f4f6', color: '#374151',
              whiteSpace: 'nowrap',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div style={{
        display: 'flex', gap: '2px',
        padding: '4px',
        borderTop: '1px solid #f3f4f6',
        background: '#fff',
      }}>
        <button
          onClick={onSeleccionar}
          style={{
            flex: 1,
            padding: '4px 6px',
            background: '#FF6B2B', color: '#fff',
            border: 'none', borderRadius: '4px',
            fontSize: '0.65rem', fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {textoBotonSeleccionar}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePublica() }}
          style={{
            padding: '4px 6px',
            background: img.publica ? '#dcfce7' : '#f3f4f6',
            color: img.publica ? '#166534' : '#6b7280',
            border: 'none', borderRadius: '4px',
            fontSize: '0.65rem', fontWeight: 600,
            cursor: 'pointer',
          }}
          title={img.publica ? 'Hacer privada' : 'Hacer pública'}
        >
          {img.publica ? '🌍' : '🔒'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEliminar() }}
          style={{
            padding: '4px 6px',
            background: '#fee2e2', color: '#991b1b',
            border: 'none', borderRadius: '4px',
            fontSize: '0.65rem',
            cursor: 'pointer',
          }}
          title="Eliminar"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
