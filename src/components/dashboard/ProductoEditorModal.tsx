// Ruta destino: src/components/dashboard/ProductoEditorModal.tsx
// REEMPLAZA. Cambios principales:
// - Modal de imagen unificado con 3 tabs: 📁 Subir · 🖼 Mi banco · ✨ Unsplash
// - Al subir un archivo, se sube directamente al banco automáticamente
// - El picker de banco permite seleccionar imágenes existentes

'use client'

import { useState, useRef } from 'react'
import type { Producto } from '@/types/database'
import { BancoImagenesPicker } from './BancoImagenesPicker'

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

type TabImagen = 'subir' | 'banco' | 'unsplash'

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
  const [aplicandoUrl, setAplicandoUrl] = useState(false)

  // Mejora de descripción
  const [mejorando, setMejorando] = useState(false)
  const [mejoraSugerida, setMejoraSugerida] = useState<{
    nueva: string
    formato: string
    explicacion: string
  } | null>(null)

  // Modal de selección de imagen
  const [modalImagenAbierto, setModalImagenAbierto] = useState(false)
  const [rolImagen, setRolImagen] = useState<'principal' | 'adicional'>('principal')
  const [tabImagen, setTabImagen] = useState<TabImagen>('banco')

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

  const abrirModalImagen = (rol: 'principal' | 'adicional') => {
    if (!productoId) {
      setError('Guarda el producto primero antes de agregar imágenes')
      return
    }
    setRolImagen(rol)
    setTabImagen('banco')
    setModalImagenAbierto(true)
  }

  // Cuando se selecciona una imagen del banco o Unsplash
  const aplicarImagenAlProducto = async (url: string) => {
    if (!productoId) return
    setAplicandoUrl(true)
    setError(null)
    try {
      const res = await fetch(`/api/productos/${productoId}/imagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: rolImagen, url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al aplicar imagen')

      if (rolImagen === 'principal') {
        setImagenPrincipal(data.url || url)
      } else {
        setImagenesAdicionales(prev => [...prev, data.url || url])
      }
      setModalImagenAbierto(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al aplicar')
    } finally {
      setAplicandoUrl(false)
    }
  }

  const eliminarImagen = async (url: string, rol: 'principal' | 'adicional') => {
    if (!productoId) return
    if (!confirm('¿Eliminar esta imagen del producto?\n\n(Sigue disponible en tu banco)')) return

    try {
      const res = await fetch(`/api/productos/${productoId}/imagen`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, rol }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }

      if (rol === 'principal') {
        setImagenPrincipal('')
      } else {
        setImagenesAdicionales(prev => prev.filter(u => u !== url))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
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

            {/* Descripción con IA */}
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
                placeholder="ej. Vehículo compacto con motor 1.0 GDi..."
                maxLength={1000}
                rows={4}
                style={{ ...inp, minHeight: '100px', resize: 'vertical', lineHeight: 1.55 }}
              />

              {mejoraSugerida && (
                <div style={{
                  marginTop: '0.75rem', background: '#fff7ed',
                  border: '1px solid #fed7aa', borderRadius: '12px', padding: '1rem',
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
                    background: '#fff', border: '1px solid #fed7aa', borderRadius: '8px',
                    padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#374151',
                    whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: '0.75rem',
                    maxHeight: '280px', overflowY: 'auto',
                  }}>
                    {mejoraSugerida.nueva}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button onClick={rechazarMejora} style={{
                      padding: '6px 14px', borderRadius: '8px',
                      background: 'transparent', color: '#9a3412',
                      border: '1px solid #fed7aa',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    }}>
                      ✕ Rechazar
                    </button>
                    <button onClick={aplicarMejora} style={{
                      padding: '6px 14px', borderRadius: '8px',
                      background: '#FF6B2B', color: '#fff', border: 'none',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    }}>
                      ✓ Aplicar mejora
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {modo === 'editar' && productoId && (
            <>
              {/* Imagen principal */}
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
                      title="Quitar del producto"
                    >
                      🗑
                    </button>
                    <button
                      onClick={() => abrirModalImagen('principal')}
                      style={{
                        position: 'absolute', bottom: '8px', right: '8px',
                        padding: '6px 12px', borderRadius: '8px',
                        background: 'rgba(0,0,0,.7)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontSize: '0.7rem', fontWeight: 600,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      🔄 Cambiar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => abrirModalImagen('principal')}
                    style={{
                      width: '100%', maxWidth: '320px',
                      aspectRatio: '4/3',
                      border: '2px dashed #d1d5db', borderRadius: '12px',
                      background: '#f9fafb',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: '0.5rem', color: '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '2.5rem' }}>📷</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>+ Agregar imagen</span>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      Subir · Banco · Unsplash
                    </span>
                  </button>
                )}
              </div>

              {/* Galería */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f1c2e', marginBottom: '0.75rem' }}>
                  Galería ({imagenesAdicionales.length}/{MAX_ADICIONALES})
                </h4>

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
                    <button
                      onClick={() => abrirModalImagen('adicional')}
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
                      <span style={{ fontSize: '1.5rem' }}>+</span>
                      Agregar
                    </button>
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
              💡 Después de crear el producto podrás agregar imágenes desde tu banco, Unsplash o subiendo archivos.
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

        {/* ─── Modal de selección de imagen con tabs ─── */}
        {modalImagenAbierto && productoId && (
          <ModalSeleccionImagen
            rol={rolImagen}
            tab={tabImagen}
            onTabChange={setTabImagen}
            onClose={() => setModalImagenAbierto(false)}
            onAplicar={aplicarImagenAlProducto}
            aplicandoUrl={aplicandoUrl}
            nombreProducto={nombre}
            descripcionProducto={descripcion}
          />
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Modal de selección de imagen (3 tabs)
// ═══════════════════════════════════════════════════════════════

function ModalSeleccionImagen({
  rol,
  tab,
  onTabChange,
  onClose,
  onAplicar,
  aplicandoUrl,
  nombreProducto,
  descripcionProducto,
}: {
  rol: 'principal' | 'adicional'
  tab: TabImagen
  onTabChange: (t: TabImagen) => void
  onClose: () => void
  onAplicar: (url: string) => void
  aplicandoUrl: boolean
  nombreProducto: string
  descripcionProducto: string
}) {
  return (
    <div
      onClick={onClose}
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
          maxWidth: '760px', width: '100%',
          maxHeight: '88vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f1c2e' }}>
            Agregar imagen · {rol === 'principal' ? 'Principal' : 'Galería'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}>
          {([
            { key: 'banco', label: '🖼 Mi banco' },
            { key: 'subir', label: '📁 Subir archivo' },
            { key: 'unsplash', label: '✨ Unsplash IA' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#FF6B2B' : '#6b7280',
                border: 'none',
                borderBottom: tab === t.key ? '2px solid #FF6B2B' : '2px solid transparent',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {tab === 'banco' && (
            <BancoImagenesPicker
              onSeleccionar={(img) => onAplicar(img.url)}
              textoBotonSeleccionar={aplicandoUrl ? '...' : 'Usar'}
            />
          )}

          {tab === 'subir' && (
            <SubirArchivoTab onAplicar={onAplicar} aplicandoUrl={aplicandoUrl} />
          )}

          {tab === 'unsplash' && (
            <UnsplashTab
              nombreProducto={nombreProducto}
              descripcionProducto={descripcionProducto}
              onAplicar={onAplicar}
              aplicandoUrl={aplicandoUrl}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Tab: Subir archivo
// ═══════════════════════════════════════════════════════════════

function SubirArchivoTab({ onAplicar, aplicandoUrl }: { onAplicar: (url: string) => void; aplicandoUrl: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const subir = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera 5MB')
      return
    }
    setSubiendo(true)
    setError(null)
    setMensaje('Subiendo y analizando con IA... (5-10 segundos)')

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

      setMensaje(data.mensaje || '✅ Imagen subida y guardada en tu banco')

      // Aplicar al producto automáticamente
      if (data.imagen?.url) {
        setTimeout(() => onAplicar(data.imagen.url), 500)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir')
      setMensaje(null)
    } finally {
      setSubiendo(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) subir(file)
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) subir(f)
        }}
      />

      <div
        onClick={() => !subiendo && !aplicandoUrl && fileRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: '2px dashed #d1d5db',
          borderRadius: '12px',
          padding: '3rem 1rem',
          textAlign: 'center',
          background: '#f9fafb',
          cursor: subiendo || aplicandoUrl ? 'wait' : 'pointer',
          opacity: subiendo || aplicandoUrl ? 0.7 : 1,
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {subiendo ? '⏳' : '📤'}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
          {subiendo ? 'Analizando con IA...' : 'Arrastra una imagen o click aquí'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          JPG, PNG o WebP · máx 5MB
        </div>
        <div style={{ fontSize: '0.7rem', color: '#FF6B2B', marginTop: '0.75rem', fontWeight: 600 }}>
          ✨ Se guardará automáticamente en tu banco con etiquetas IA
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '0.6rem 1rem', background: '#fee2e2', color: '#991b1b',
          borderRadius: '8px', fontSize: '0.8rem',
        }}>
          ❌ {error}
        </div>
      )}

      {mensaje && (
        <div style={{
          marginTop: '1rem',
          padding: '0.6rem 1rem',
          background: mensaje.includes('⚠️') ? '#fffbeb' : '#f0fdf4',
          color: mensaje.includes('⚠️') ? '#92400e' : '#166534',
          border: `1px solid ${mensaje.includes('⚠️') ? '#fcd34d' : '#86efac'}`,
          borderRadius: '8px', fontSize: '0.8rem',
        }}>
          {mensaje}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Tab: Unsplash con IA
// ═══════════════════════════════════════════════════════════════

function UnsplashTab({
  nombreProducto,
  descripcionProducto,
  onAplicar,
  aplicandoUrl,
}: {
  nombreProducto: string
  descripcionProducto: string
  onAplicar: (url: string) => void
  aplicandoUrl: boolean
}) {
  const [query, setQuery] = useState(nombreProducto)
  const [resultados, setResultados] = useState<ImagenUnsplash[]>([])
  const [buscando, setBuscando] = useState(false)
  const [explicacion, setExplicacion] = useState<string | null>(null)
  const [queryUsado, setQueryUsado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const buscarConIA = async () => {
    if (!query.trim()) return
    setBuscando(true)
    setExplicacion(null)
    setQueryUsado(null)
    setResultados([])
    setError(null)

    try {
      const resRefinar = await fetch('/api/landing/ia-refinar-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          contexto: descripcionProducto
            ? `Producto: ${nombreProducto}. ${descripcionProducto}`
            : `Producto: ${nombreProducto}`,
        }),
      })
      const refinado = await resRefinar.json()
      if (refinado.error || !refinado.principal) {
        setError('Error al refinar búsqueda con IA')
        return
      }

      setExplicacion(refinado.explicacion || null)

      const queries: string[] = [refinado.principal, ...(refinado.alternativas || [])]
      let imagenes: ImagenUnsplash[] = []
      let queryFinal = queries[0]

      for (const q of queries) {
        const resBuscar = await fetch('/api/landing/ia-buscar-imagenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, orientation: 'landscape', perPage: 9 }),
        })
        const dataBuscar = await resBuscar.json()
        if (dataBuscar.imagenes && dataBuscar.imagenes.length > 0) {
          imagenes = dataBuscar.imagenes
          queryFinal = q
          break
        }
      }

      setResultados(imagenes)
      setQueryUsado(queryFinal)
    } catch {
      setError('Error al buscar imágenes')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscarConIA()}
          placeholder="Describe lo que buscas (en español está bien)..."
          style={{ ...inp, flex: 1 }}
          disabled={buscando}
        />
        <button
          onClick={buscarConIA}
          disabled={buscando || !query.trim()}
          style={{
            background: 'linear-gradient(135deg, #FF6B2B 0%, #FF8C42 100%)',
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '0 1.25rem', fontSize: '0.875rem', fontWeight: 700,
            cursor: (buscando || !query.trim()) ? 'not-allowed' : 'pointer',
            opacity: (buscando || !query.trim()) ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          {buscando ? (
            <>
              <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
              Buscando...
            </>
          ) : '✨ Buscar con IA'}
        </button>
      </div>

      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
        💡 La IA traduce tu búsqueda y mejora los términos para mejores resultados
      </p>

      {error && (
        <div style={{
          padding: '0.6rem 1rem', background: '#fee2e2', color: '#991b1b',
          borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem',
        }}>❌ {error}</div>
      )}

      {explicacion && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa',
          borderRadius: '10px', padding: '0.75rem 1rem',
          marginBottom: '1rem', fontSize: '0.8rem',
        }}>
          <div style={{ color: '#9a3412', marginBottom: '4px' }}>
            <strong>✨ IA:</strong> {explicacion}
          </div>
          {queryUsado && (
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              Buscando: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', color: '#FF6B2B', fontWeight: 600 }}>{queryUsado}</code>
            </div>
          )}
        </div>
      )}

      {resultados.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
          {resultados.map(img => (
            <button
              key={img.id}
              onClick={() => onAplicar(img.url)}
              disabled={aplicandoUrl}
              style={{
                position: 'relative', aspectRatio: '4/3', overflow: 'hidden',
                borderRadius: '8px', border: '1px solid #e5e7eb',
                cursor: aplicandoUrl ? 'wait' : 'pointer', padding: 0,
                opacity: aplicandoUrl ? 0.5 : 1,
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

      {resultados.length === 0 && !buscando && queryUsado && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <div style={{ fontSize: '0.875rem' }}>
            No encontré imágenes. Intenta con otra búsqueda.
          </div>
        </div>
      )}
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
