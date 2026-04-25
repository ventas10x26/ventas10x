// Ruta destino: src/components/dashboard/ProductoEditorModal.tsx
'use client'

import { useState, useRef } from 'react'
import type { Producto } from '@/types/database'

type Props = {
  modo: 'crear' | 'editar'
  producto?: Producto
  onClose: () => void
  onGuardado: (producto: Producto) => void
}

type ImagenUnsplash = {
  id: string
  url: string
  thumb: string
  alt: string
  autor: string
}

const MAX_ADICIONALES = 5

export function ProductoEditorModal({ modo, producto, onClose, onGuardado }: Props) {
  // Datos básicos
  const [nombre, setNombre] = useState(producto?.nombre || '')
  const [precio, setPrecio] = useState(producto?.precio || '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion || '')

  // Imágenes (solo se muestran/editan en modo "editar" porque necesitamos ID del producto)
  const [imagenPrincipal, setImagenPrincipal] = useState(producto?.imagen_principal || '')
  const [imagenesAdicionales, setImagenesAdicionales] = useState<string[]>(
    producto?.imagenes_adicionales || []
  )

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState<'principal' | 'adicional' | null>(null)

  // Búsqueda Unsplash
  const [mostrarUnsplash, setMostrarUnsplash] = useState(false)
  const [rolUnsplash, setRolUnsplash] = useState<'principal' | 'adicional'>('principal')
  const [queryUnsplash, setQueryUnsplash] = useState('')
  const [resultadosUnsplash, setResultadosUnsplash] = useState<ImagenUnsplash[]>([])
  const [buscandoUnsplash, setBuscandoUnsplash] = useState(false)

  const filePrincipalRef = useRef<HTMLInputElement>(null)
  const fileAdicionalRef = useRef<HTMLInputElement>(null)

  const productoId = producto?.id

  // ── Guardar (crear o actualizar datos básicos) ──
  const guardar = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      const url = modo === 'crear' ? '/api/productos' : `/api/productos/${productoId}`
      const method = modo === 'crear' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          precio: precio.trim() || null,
          descripcion: descripcion.trim() || null,
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      onGuardado(data.producto)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  // ── Subir archivo ──
  const subirArchivo = async (file: File, rol: 'principal' | 'adicional') => {
    if (!productoId) {
      setError('Guarda el producto primero antes de subir imágenes')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera 5MB')
      return
    }

    setSubiendo(rol)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('rol', rol)

      const res = await fetch(`/api/productos/${productoId}/imagen`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al subir')

      if (rol === 'principal') {
        setImagenPrincipal(data.url)
      } else {
        setImagenesAdicionales(prev => [...prev, data.url])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setSubiendo(null)
      if (filePrincipalRef.current) filePrincipalRef.current.value = ''
      if (fileAdicionalRef.current) fileAdicionalRef.current.value = ''
    }
  }

  // ── Eliminar imagen ──
  const eliminarImagen = async (url: string, rol: 'principal' | 'adicional') => {
    if (!productoId) return
    if (!confirm('¿Eliminar esta imagen?')) return

    try {
      const res = await fetch(`/api/productos/${productoId}/imagen`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, rol }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al eliminar')

      if (rol === 'principal') {
        setImagenPrincipal('')
      } else {
        setImagenesAdicionales(prev => prev.filter(u => u !== url))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  // ── Buscar en Unsplash ──
  const abrirUnsplash = (rol: 'principal' | 'adicional') => {
    if (!productoId) {
      setError('Guarda el producto primero antes de buscar imágenes')
      return
    }
    setRolUnsplash(rol)
    setMostrarUnsplash(true)
    // Pre-llenar query con el nombre del producto
    setQueryUnsplash(nombre)
    setResultadosUnsplash([])
  }

  const buscarUnsplash = async () => {
    if (!queryUnsplash.trim()) return
    setBuscandoUnsplash(true)
    try {
      const res = await fetch('/api/landing/ia-buscar-imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryUnsplash.trim(),
          orientation: 'landscape',
          perPage: 9,
        }),
      })
      const data = await res.json()
      setResultadosUnsplash(data.imagenes || [])
    } catch {
      setError('Error al buscar imágenes')
    } finally {
      setBuscandoUnsplash(false)
    }
  }

  const usarImagenUnsplash = async (url: string) => {
    if (!productoId) return
    setSubiendo(rolUnsplash)
    try {
      const res = await fetch(`/api/productos/${productoId}/imagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: rolUnsplash, url }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error')

      if (rolUnsplash === 'principal') {
        setImagenPrincipal(data.url)
      } else {
        setImagenesAdicionales(prev => [...prev, data.url])
      }
      setMostrarUnsplash(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubiendo(null)
    }
  }

  // ── Drag & drop file ──
  const onDropPrincipal = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      subirArchivo(file, 'principal')
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px',
          maxWidth: '720px', width: '100%',
          maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 5,
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f1c2e' }}>
            {modo === 'crear' ? '+ Nuevo producto' : 'Editar producto'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>
            ×
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              padding: '0.6rem 1rem', background: '#fee2e2', color: '#991b1b',
              borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem',
            }}>
              ❌ {error}
            </div>
          )}

          {/* ─── Datos básicos ─── */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>Nombre del producto *</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="ej. Kia Sportage 2024"
                maxLength={100}
                style={inp}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Precio</label>
                <input
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  placeholder="$85.000.000"
                  maxLength={50}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Descripción corta</label>
                <input
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="ej. SUV 5 plazas con financiación..."
                  maxLength={200}
                  style={inp}
                />
              </div>
            </div>
          </div>

          {/* ─── Imágenes (solo en modo editar) ─── */}
          {modo === 'editar' && productoId && (
            <>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f1c2e', marginBottom: '0.75rem' }}>
                  Imagen principal
                </h4>

                {imagenPrincipal ? (
                  <div style={{
                    position: 'relative', borderRadius: '12px', overflow: 'hidden',
                    aspectRatio: '4/3', maxWidth: '320px', background: '#f3f4f6',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagenPrincipal} alt="Principal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => eliminarImagen(imagenPrincipal, 'principal')}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'rgba(239,68,68,.95)', color: '#fff',
                        border: 'none', cursor: 'pointer', fontSize: '1rem',
                      }}
                      title="Eliminar"
                    >
                      🗑
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={onDropPrincipal}
                    onDragOver={e => e.preventDefault()}
                    style={{
                      border: '2px dashed #d1d5db', borderRadius: '12px',
                      padding: '2rem 1rem', textAlign: 'center', background: '#f9fafb',
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                      Arrastra una imagen aquí o:
                    </p>

                    <input
                      ref={filePrincipalRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) subirArchivo(file, 'principal')
                      }}
                    />

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => filePrincipalRef.current?.click()}
                        disabled={subiendo === 'principal'}
                        style={btnSecundario}
                      >
                        {subiendo === 'principal' ? 'Subiendo...' : '📁 Subir archivo'}
                      </button>
                      <button
                        onClick={() => abrirUnsplash('principal')}
                        disabled={subiendo === 'principal'}
                        style={btnSecundario}
                      >
                        🔍 Buscar en Unsplash
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Imágenes adicionales ─── */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f1c2e' }}>
                    Galería ({imagenesAdicionales.length}/{MAX_ADICIONALES})
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                  {imagenesAdicionales.map((url, i) => (
                    <div
                      key={url + i}
                      style={{
                        position: 'relative', borderRadius: '8px', overflow: 'hidden',
                        aspectRatio: '1/1', background: '#f3f4f6',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Galería ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => eliminarImagen(url, 'adicional')}
                        style={{
                          position: 'absolute', top: '4px', right: '4px',
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: 'rgba(239,68,68,.95)', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {imagenesAdicionales.length < MAX_ADICIONALES && (
                    <>
                      <input
                        ref={fileAdicionalRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) subirArchivo(file, 'adicional')
                        }}
                      />
                      <button
                        onClick={() => fileAdicionalRef.current?.click()}
                        disabled={subiendo === 'adicional'}
                        style={{
                          aspectRatio: '1/1', borderRadius: '8px',
                          border: '2px dashed #d1d5db', background: '#f9fafb',
                          cursor: subiendo === 'adicional' ? 'wait' : 'pointer',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          gap: '0.25rem', color: '#64748b', fontSize: '0.7rem',
                          opacity: subiendo === 'adicional' ? 0.6 : 1,
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>+</span>
                        Subir
                      </button>

                      <button
                        onClick={() => abrirUnsplash('adicional')}
                        disabled={subiendo === 'adicional'}
                        style={{
                          aspectRatio: '1/1', borderRadius: '8px',
                          border: '2px dashed #d1d5db', background: '#f9fafb',
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          gap: '0.25rem', color: '#64748b', fontSize: '0.7rem',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>🔍</span>
                        Unsplash
                      </button>
                    </>
                  )}
                </div>

                {imagenesAdicionales.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                    Hasta {MAX_ADICIONALES} imágenes adicionales para mostrar tu producto desde diferentes ángulos.
                  </p>
                )}
              </div>
            </>
          )}

          {modo === 'crear' && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fcd34d',
              borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem',
              fontSize: '0.85rem', color: '#92400e',
            }}>
              💡 Después de crear el producto podrás agregar imágenes.
            </div>
          )}

          {/* Botones finales */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} disabled={guardando} style={{ ...btnSecundario, padding: '0.7rem 1.25rem' }}>
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="btn-primary !text-sm"
              style={{ opacity: guardando ? 0.7 : 1 }}
            >
              {guardando ? 'Guardando...' : (modo === 'crear' ? 'Crear producto' : 'Guardar cambios')}
            </button>
          </div>
        </div>

        {/* ─── Modal de Unsplash ─── */}
        {mostrarUnsplash && (
          <div
            onClick={() => setMostrarUnsplash(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1100, padding: '1rem',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: '16px',
                maxWidth: '720px', width: '100%',
                maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f1c2e' }}>
                  Buscar en Unsplash · {rolUnsplash === 'principal' ? 'Imagen principal' : 'Galería'}
                </h3>
                <button onClick={() => setMostrarUnsplash(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>×</button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  value={queryUnsplash}
                  onChange={e => setQueryUnsplash(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarUnsplash()}
                  placeholder="ej. car, food, product..."
                  style={{ ...inp, flex: 1 }}
                />
                <button
                  onClick={buscarUnsplash}
                  disabled={buscandoUnsplash || !queryUnsplash.trim()}
                  className="btn-primary !text-sm"
                  style={{ opacity: (buscandoUnsplash || !queryUnsplash.trim()) ? 0.6 : 1 }}
                >
                  {buscandoUnsplash ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                💡 Tip: usa términos en inglés para mejores resultados
              </p>

              {resultadosUnsplash.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {resultadosUnsplash.map(img => (
                    <button
                      key={img.id}
                      onClick={() => usarImagenUnsplash(img.url)}
                      disabled={subiendo !== null}
                      style={{
                        position: 'relative', aspectRatio: '4/3', overflow: 'hidden',
                        borderRadius: '8px', border: '1px solid #e5e7eb',
                        cursor: subiendo ? 'wait' : 'pointer', padding: 0,
                        opacity: subiendo ? 0.5 : 1,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.thumb} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent)',
                        padding: '4px 6px', fontSize: '9px', color: 'rgba(255,255,255,.85)',
                        textAlign: 'left',
                      }}>
                        📷 {img.autor}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {resultadosUnsplash.length === 0 && !buscandoUnsplash && queryUnsplash && (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem', fontSize: '0.875rem' }}>
                  Presiona Buscar para ver resultados
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  fontSize: '0.8rem', fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: '4px',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.875rem',
  border: '1px solid #e5e7eb', borderRadius: '8px',
  fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
}

const btnSecundario: React.CSSProperties = {
  padding: '0.55rem 1rem', background: '#f3f4f6', color: '#374151',
  border: '1px solid #e5e7eb', borderRadius: '8px',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
}
