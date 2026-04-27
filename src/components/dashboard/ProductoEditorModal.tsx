// Ruta destino: src/components/dashboard/ProductoEditorModal.tsx
// Reemplaza el archivo. Cambios principales:
// - "Descripción corta" ahora es un TEXTAREA grande (4 líneas iniciales)
// - Botón "✨ Mejorar formato con IA" cuando hay texto suficiente
// - Vista previa antes de aplicar la mejora con botones aceptar/rechazar

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
  const [nombre, setNombre] = useState(producto?.nombre || '')
  const [precio, setPrecio] = useState(producto?.precio || '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion || '')

  const [imagenPrincipal, setImagenPrincipal] = useState(producto?.imagen_principal || '')
  const [imagenesAdicionales, setImagenesAdicionales] = useState<string[]>(
    producto?.imagenes_adicionales || []
  )

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState<'principal' | 'adicional' | null>(null)

  // ── Estado del mejorador de descripción ──
  const [mejorando, setMejorando] = useState(false)
  const [mejoraSugerida, setMejoraSugerida] = useState<{
    nueva: string
    formato: string
    explicacion: string
  } | null>(null)

  // ── Búsqueda Unsplash con IA ──
  const [mostrarUnsplash, setMostrarUnsplash] = useState(false)
  const [rolUnsplash, setRolUnsplash] = useState<'principal' | 'adicional'>('principal')
  const [queryUnsplash, setQueryUnsplash] = useState('')
  const [resultadosUnsplash, setResultadosUnsplash] = useState<ImagenUnsplash[]>([])
  const [buscandoUnsplash, setBuscandoUnsplash] = useState(false)
  const [explicacionIA, setExplicacionIA] = useState<string | null>(null)
  const [queryUsado, setQueryUsado] = useState<string | null>(null)

  const filePrincipalRef = useRef<HTMLInputElement>(null)
  const fileAdicionalRef = useRef<HTMLInputElement>(null)

  const productoId = producto?.id

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

  // ── Llamar a la IA para mejorar formato ──
  const mejorarFormatoConIA = async () => {
    if (!productoId) {
      setError('Guarda el producto primero antes de mejorar la descripción')
      return
    }
    if (!descripcion.trim() || descripcion.trim().length < 30) {
      setError('La descripción debe tener al menos 30 caracteres')
      return
    }

    setMejorando(true)
    setError(null)
    setMejoraSugerida(null)

    try {
      const res = await fetch(`/api/productos/${productoId}/mejorar-descripcion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al mejorar')

      setMejoraSugerida({
        nueva: data.descripcionMejorada,
        formato: data.formatoUsado,
        explicacion: data.explicacion,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al conectar con la IA')
    } finally {
      setMejorando(false)
    }
  }

  const aplicarMejora = () => {
    if (!mejoraSugerida) return
    setDescripcion(mejoraSugerida.nueva)
    setMejoraSugerida(null)
  }

  const rechazarMejora = () => setMejoraSugerida(null)

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

  const abrirUnsplash = (rol: 'principal' | 'adicional') => {
    if (!productoId) {
      setError('Guarda el producto primero antes de buscar imágenes')
      return
    }
    setRolUnsplash(rol)
    setMostrarUnsplash(true)
    setQueryUnsplash(nombre)
    setResultadosUnsplash([])
    setExplicacionIA(null)
    setQueryUsado(null)
  }

  const buscarConIA = async () => {
    if (!queryUnsplash.trim()) return
    setBuscandoUnsplash(true)
    setExplicacionIA(null)
    setQueryUsado(null)
    setResultadosUnsplash([])

    try {
      const resRefinar = await fetch('/api/landing/ia-refinar-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryUnsplash,
          contexto: descripcion ? `Producto: ${nombre}. ${descripcion}` : `Producto: ${nombre}`,
        }),
      })
      const refinado = await resRefinar.json()

      if (refinado.error || !refinado.principal) {
        setError('Error al refinar búsqueda con IA')
        return
      }

      setExplicacionIA(refinado.explicacion || null)

      const queriesAIntentar: string[] = [
        refinado.principal,
        ...(refinado.alternativas || []),
      ]

      let imagenesEncontradas: ImagenUnsplash[] = []
      let queryFinal = queriesAIntentar[0]

      for (const q of queriesAIntentar) {
        const resBuscar = await fetch('/api/landing/ia-buscar-imagenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            orientation: 'landscape',
            perPage: 9,
          }),
        })
        const dataBuscar = await resBuscar.json()

        if (dataBuscar.imagenes && dataBuscar.imagenes.length > 0) {
          imagenesEncontradas = dataBuscar.imagenes
          queryFinal = q
          break
        }
      }

      setResultadosUnsplash(imagenesEncontradas)
      setQueryUsado(queryFinal)
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

  const onDropPrincipal = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      subirArchivo(file, 'principal')
    }
  }

  const puedeMejorar = descripcion.trim().length >= 30 && modo === 'editar'

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

          {/* Datos básicos */}
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

            <div>
              <label style={lbl}>Precio</label>
              <input
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                placeholder="$85.000.000"
                maxLength={50}
                style={{ ...inp, maxWidth: '240px' }}
              />
            </div>

            {/* ─── Descripción con mejora IA ─── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ ...lbl, marginBottom: 0 }}>
                  Descripción <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.7rem' }}>({descripcion.length}/1000)</span>
                </label>

                {puedeMejorar && (
                  <button
                    onClick={mejorarFormatoConIA}
                    disabled={mejorando || mejoraSugerida !== null}
                    style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '6px',
                      background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
                      color: '#fff', border: 'none',
                      cursor: (mejorando || mejoraSugerida) ? 'not-allowed' : 'pointer',
                      opacity: (mejorando || mejoraSugerida) ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {mejorando ? (
                      <>
                        <span style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                        Mejorando...
                      </>
                    ) : '✨ Mejorar formato'}
                  </button>
                )}
              </div>

              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="ej. Vehículo compacto con motor 1.0 GDi. Disponible en versiones Concept, Drive y GT-Line. Características: pantalla táctil, conectividad CarPlay..."
                maxLength={1000}
                rows={4}
                style={{ ...inp, minHeight: '100px', resize: 'vertical', lineHeight: 1.55 }}
              />

              {modo === 'editar' && !puedeMejorar && descripcion.trim().length > 0 && (
                <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                  💡 Escribe al menos 30 caracteres para usar &quot;✨ Mejorar formato&quot;
                </p>
              )}

              {modo === 'crear' && (
                <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                  💡 Después de crear el producto, podrás usar IA para mejorar el formato.
                </p>
              )}

              {/* Preview de mejora sugerida */}
              {mejoraSugerida && (
                <div style={{
                  marginTop: '0.75rem',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '12px',
                  padding: '1rem',
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#9a3412', marginBottom: '0.5rem' }}>
                    <strong>✨ Mejora sugerida</strong> · formato: {mejoraSugerida.formato}
                  </div>
                  {mejoraSugerida.explicacion && (
                    <div style={{ fontSize: '0.7rem', color: '#9a3412', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                      💡 {mejoraSugerida.explicacion}
                    </div>
                  )}

                  <div style={{
                    background: '#fff',
                    border: '1px solid #fed7aa',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    marginBottom: '0.75rem',
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}>
                    {mejoraSugerida.nueva}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={rechazarMejora}
                      style={{
                        padding: '6px 14px', borderRadius: '8px',
                        background: 'transparent', color: '#9a3412',
                        border: '1px solid #fed7aa',
                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      ✕ Rechazar
                    </button>
                    <button
                      onClick={aplicarMejora}
                      style={{
                        padding: '6px 14px', borderRadius: '8px',
                        background: '#FF6B2B', color: '#fff',
                        border: 'none',
                        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      ✓ Aplicar mejora
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
                        style={btnIA}
                      >
                        ✨ Buscar con IA
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                          border: '2px dashed #FF6B2B', background: '#fff7f3',
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          gap: '0.25rem', color: '#FF6B2B', fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>✨</span>
                        Buscar IA
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {modo === 'crear' && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fcd34d',
              borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem',
              fontSize: '0.85rem', color: '#92400e',
            }}>
              💡 Después de crear el producto podrás agregar imágenes y mejorar el formato con IA.
            </div>
          )}

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

        {/* ─── Modal de Unsplash con búsqueda IA ─── */}
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
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f1c2e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ✨ Buscar imágenes con IA · {rolUnsplash === 'principal' ? 'Imagen principal' : 'Galería'}
                </h3>
                <button onClick={() => setMostrarUnsplash(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>×</button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  value={queryUnsplash}
                  onChange={e => setQueryUnsplash(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarConIA()}
                  placeholder="Describe lo que buscas (en español está bien)..."
                  style={{ ...inp, flex: 1 }}
                  disabled={buscandoUnsplash}
                />
                <button
                  onClick={buscarConIA}
                  disabled={buscandoUnsplash || !queryUnsplash.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    padding: '0 1.25rem', fontSize: '0.875rem', fontWeight: 700,
                    cursor: (buscandoUnsplash || !queryUnsplash.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (buscandoUnsplash || !queryUnsplash.trim()) ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {buscandoUnsplash ? (
                    <>
                      <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                      Buscando...
                    </>
                  ) : '✨ Buscar con IA'}
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                💡 La IA traduce tu búsqueda y mejora los términos para encontrar las mejores imágenes
              </p>

              {explicacionIA && (
                <div style={{
                  background: '#fff7ed', border: '1px solid #fed7aa',
                  borderRadius: '10px', padding: '0.75rem 1rem',
                  marginBottom: '1rem', fontSize: '0.8rem',
                }}>
                  <div style={{ color: '#9a3412', marginBottom: '4px' }}>
                    <strong>✨ IA:</strong> {explicacionIA}
                  </div>
                  {queryUsado && (
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Buscando: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', color: '#FF6B2B', fontWeight: 600 }}>{queryUsado}</code>
                    </div>
                  )}
                </div>
              )}

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

              {resultadosUnsplash.length === 0 && !buscandoUnsplash && queryUsado && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                  <div style={{ fontSize: '0.875rem' }}>
                    No encontré imágenes. Intenta con otra búsqueda.
                  </div>
                </div>
              )}

              {resultadosUnsplash.length === 0 && !buscandoUnsplash && !queryUsado && (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem', fontSize: '0.875rem' }}>
                  Escribe lo que buscas y presiona &quot;Buscar con IA&quot;
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
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

const btnIA: React.CSSProperties = {
  padding: '0.55rem 1rem',
  background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
  color: '#fff', border: 'none', borderRadius: '8px',
  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(255,107,43,.25)',
}
