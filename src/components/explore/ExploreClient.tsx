// Ruta destino: src/components/explore/ExploreClient.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const DARK = '#0b1120'
const ORANGE = '#FF6B2B'

type Perfil = {
  id: string
  nombre: string | null
  apellido: string | null
  empresa: string | null
  avatar_url: string | null
  slug: string | null
  industria: string | null
}

type Producto = {
  id: string
  nombre: string
  precio: string | null
  descripcion: string | null
  imagen_principal: string | null
}

type Post = {
  id: string
  tipo: 'publicacion' | 'producto' | 'deal' | 'metrica'
  titulo: string | null
  contenido: string
  imagen_url: string | null
  deal_valor: number | null
  deal_industria: string | null
  metrica_tipo: string | null
  metrica_valor: number | null
  likes_count: number
  created_at: string
  vendedor_id: string
  profiles: Perfil
  productos: Producto | null
}

type ConexionForm = {
  nombre: string
  whatsapp: string
  email: string
  mensaje: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

function formatPeso(val: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

const TIPO_COLORS: Record<string, string> = {
  publicacion: '#3b82f6',
  producto: '#8b5cf6',
  deal: '#22c55e',
  metrica: '#f59e0b',
}
const TIPO_LABELS: Record<string, string> = {
  publicacion: '📝 Publicación',
  producto: '📦 Producto',
  deal: '🏆 Deal cerrado',
  metrica: '📊 Métrica',
}

function AvatarVendedor({ perfil, size = 40 }: { perfil: Perfil; size?: number }) {
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'
  const initials = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return perfil.avatar_url
    ? <img src={perfil.avatar_url} alt={nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
}

function PostCard({ post, onConectar }: { post: Post; onConectar: (post: Post) => void }) {
  const perfil = post.profiles
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'
  const color = TIPO_COLORS[post.tipo] || ORANGE

  return (
    <div style={{
      background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9',
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header del post */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/u/${perfil.slug || ''}`}>
          <AvatarVendedor perfil={perfil} size={44} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Link href={`/u/${perfil.slug || ''}`} style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>
              {nombre}
            </Link>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 8px',
              borderRadius: '999px', background: `${color}15`, color,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {TIPO_LABELS[post.tipo]}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            {perfil.empresa && `${perfil.empresa} · `}{perfil.industria && `${perfil.industria} · `}{timeAgo(post.created_at)}
          </div>
        </div>
      </div>

      {/* Contenido según tipo */}
      {post.tipo === 'deal' && (
        <div style={{ margin: '0 20px 12px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '4px' }}>🏆 DEAL CERRADO</div>
          {post.deal_valor && <div style={{ fontSize: '28px', fontWeight: 900, color: '#15803d', letterSpacing: '-0.03em' }}>{formatPeso(post.deal_valor)}</div>}
          {post.deal_industria && <div style={{ fontSize: '13px', color: '#4ade80', marginTop: '2px' }}>{post.deal_industria}</div>}
        </div>
      )}

      {post.tipo === 'metrica' && (
        <div style={{ margin: '0 20px 12px', padding: '16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', marginBottom: '4px' }}>📊 {post.metrica_tipo?.toUpperCase()}</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#b45309', letterSpacing: '-0.03em' }}>{post.metrica_valor}</div>
        </div>
      )}

      {post.tipo === 'producto' && post.productos && (
        <div style={{ margin: '0 20px 12px', display: 'flex', gap: '12px', padding: '14px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '14px' }}>
          {post.productos.imagen_principal && (
            <img src={post.productos.imagen_principal} alt={post.productos.nombre} style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{post.productos.nombre}</div>
            {post.productos.precio && <div style={{ fontSize: '16px', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>{post.productos.precio}</div>}
            {post.productos.descripcion && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>{post.productos.descripcion.slice(0, 80)}...</div>}
          </div>
        </div>
      )}

      {/* Imagen del post */}
      {post.imagen_url && (
        <img src={post.imagen_url} alt="" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover' }} />
      )}

      {/* Texto */}
      <div style={{ padding: '0 20px 12px' }}>
        {post.titulo && <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{post.titulo}</div>}
        <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.65 }}>{post.contenido}</div>
      </div>

      {/* Footer — acciones */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#94a3b8' }}>
          <span>❤️</span> {post.likes_count}
        </div>
        <div style={{ flex: 1 }} />
        <a
          href={`https://wa.me/${(perfil as Perfil & { whatsapp?: string }).whatsapp?.replace(/\D/g, '') || ''}`}
          target="_blank" rel="noopener noreferrer"
          style={{ padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', borderRadius: '10px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          💬 WhatsApp
        </a>
        <button
          onClick={() => onConectar(post)}
          style={{ padding: '8px 16px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          Conectar →
        </button>
      </div>
    </div>
  )
}

function ModalConectar({ post, onClose }: { post: Post; onClose: () => void }) {
  const [form, setForm] = useState<ConexionForm>({ nombre: '', whatsapp: '', email: '', mensaje: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const perfil = post.profiles
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'el asesor'

  const enviar = async () => {
    if (!form.nombre.trim()) return
    setEnviando(true)
    try {
      await fetch('/api/feed/conexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendedor_id: post.vendedor_id,
          post_id: post.id,
          nombre: form.nombre,
          whatsapp: form.whatsapp,
          email: form.email,
          mensaje: form.mensaje,
          producto_interes: post.productos?.nombre || post.titulo || null,
          fuente: 'explore',
        }),
      })
      setEnviado(true)
    } catch {
      // silencioso
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        {enviado ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>¡Conexión enviada!</h3>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>{nombre} recibirá tu interés y te contactará pronto.</p>
            <button onClick={onClose} style={{ marginTop: '20px', padding: '12px 28px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Cerrar</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <AvatarVendedor perfil={perfil} size={48} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Conectar con {nombre}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{perfil.empresa || perfil.industria || 'Asesor Ventas10x'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'nombre', label: 'Tu nombre *', placeholder: 'Juan García', type: 'text' },
                { key: 'whatsapp', label: 'WhatsApp', placeholder: '+57 300 000 0000', type: 'tel' },
                { key: 'email', label: 'Email', placeholder: 'juan@empresa.com', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof ConexionForm]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Mensaje (opcional)</label>
                <textarea
                  placeholder={`Hola ${perfil.nombre}, me interesa...`}
                  value={form.mensaje}
                  onChange={e => setForm(prev => ({ ...prev, mensaje: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button
                onClick={enviar}
                disabled={enviando || !form.nombre.trim()}
                style={{ flex: 2, padding: '12px', background: form.nombre.trim() ? ORANGE : '#e2e8f0', color: form.nombre.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: form.nombre.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}
              >
                {enviando ? 'Enviando...' : 'Conectar con ' + (perfil.nombre || 'asesor') + ' →'}
              </button>
            </div>

            {/* También por WA directo */}
            <a
              href={`https://wa.me/${(perfil as Perfil & { whatsapp?: string }).whatsapp?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(`Hola ${perfil.nombre}, vi tu publicación en Ventas10x y me interesa`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}
            >
              📱 O escríbele directo por WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export function ExploreClient() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [postConectar, setPostConectar] = useState<Post | null>(null)

  const cargarPosts = useCallback(async (p = 1, tipo: string | null = null, reset = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (tipo) params.set('tipo', tipo)
      const res = await fetch(`/api/feed/posts?${params}`)
      const data = await res.json()
      setPosts(prev => reset ? data.posts : [...prev, ...data.posts])
      setHasMore(data.hasMore)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPosts(1, filtroTipo, true)
    setPage(1)
  }, [filtroTipo, cargarPosts])

  const cargarMas = () => {
    const nextPage = page + 1
    setPage(nextPage)
    cargarPosts(nextPage, filtroTipo)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)" }}>

      {/* Nav */}
      <nav style={{ background: DARK, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="30" height="30" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontWeight: 800, fontSize: '17px', color: '#fff' }}>Ventas<span style={{ color: ORANGE }}>10x</span> <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', fontWeight: 400 }}>/ Explorar</span></span>
        </Link>
        <Link href="/auth/register" style={{ background: ORANGE, color: '#fff', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
          Crear mi perfil →
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ background: DARK, padding: '3rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,107,43,.12)', border: '1px solid rgba(255,107,43,.3)', borderRadius: '20px', padding: '5px 14px', marginBottom: '1.5rem', fontSize: '12px', color: '#FF8C42', fontWeight: 600 }}>
            🌎 Red de vendedores en Latam
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1rem' }}>
            Descubre asesores,<br /><span style={{ color: ORANGE }}>productos y oportunidades.</span>
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,.55)', lineHeight: 1.7 }}>
            Conecta con vendedores reales. Ve sus productos, sus logros y contáctalos directo.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '12px 1.5rem', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {[
          { key: null, label: '🌐 Todo' },
          { key: 'publicacion', label: '📝 Publicaciones' },
          { key: 'producto', label: '📦 Productos' },
          { key: 'deal', label: '🏆 Deals cerrados' },
          { key: 'metrica', label: '📊 Métricas' },
        ].map(f => (
          <button
            key={String(f.key)}
            onClick={() => setFiltroTipo(f.key)}
            style={{
              padding: '7px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
              background: filtroTipo === f.key ? DARK : '#f8fafc',
              color: filtroTipo === f.key ? '#fff' : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>
        {loading && posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>
            Cargando feed...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>El feed está creciendo</div>
            <div style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '24px' }}>Sé el primero en publicar y atraer prospectos.</div>
            <Link href="/auth/register" style={{ padding: '12px 28px', background: ORANGE, color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>
              Crear mi perfil gratis →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onConectar={setPostConectar} />
            ))}

            {hasMore && (
              <button
                onClick={cargarMas}
                disabled={loading}
                style={{ padding: '14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {loading ? 'Cargando...' : 'Ver más publicaciones'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* CTA flotante */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 40 }}>
        <Link href="/auth/register" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: ORANGE, color: '#fff', padding: '14px 20px', borderRadius: '100px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,107,43,0.4)' }}>
          ✦ Publicar en el feed
        </Link>
      </div>

      {/* Modal conectar */}
      {postConectar && <ModalConectar post={postConectar} onClose={() => setPostConectar(null)} />}
    </div>
  )
}
