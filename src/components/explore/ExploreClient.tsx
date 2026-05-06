// Ruta destino: src/components/explore/ExploreClient.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const DARK = '#0b1120'
const DARK2 = '#0f1c2e'
const ORANGE = '#FF6B2B'

type Perfil = {
  id: string
  nombre: string | null
  apellido: string | null
  empresa: string | null
  avatar_url: string | null
  slug: string | null
  industria: string | null
  whatsapp: string | null
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
type ConexionForm = { nombre: string; whatsapp: string; email: string; mensaje: string }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function formatPeso(val: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  publicacion: { label: 'Post', color: '#60a5fa', bg: 'rgba(96,165,250,.12)' },
  producto: { label: 'Producto', color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
  deal: { label: 'Deal', color: '#34d399', bg: 'rgba(52,211,153,.12)' },
  metrica: { label: 'Métrica', color: '#fbbf24', bg: 'rgba(251,191,36,.12)' },
}

function Avatar({ perfil, size = 40 }: { perfil: Perfil; size?: number }) {
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'
  const initials = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return perfil.avatar_url
    ? <img src={perfil.avatar_url} alt={nombre} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
}

// ── Modal de post completo ──
function PostModal({ post, onClose, onConectar }: { post: Post; onClose: () => void; onConectar: () => void }) {
  const perfil = post.profiles
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'
  const cfg = TIPO_CONFIG[post.tipo] || TIPO_CONFIG.publicacion

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: DARK2, borderRadius: '20px', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 40px 100px rgba(0,0,0,.6)' }}>

        {/* Imagen izquierda */}
        {post.imagen_url ? (
          <div style={{ flex: '0 0 55%', background: '#000', position: 'relative' }}>
            <img src={post.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ flex: '0 0 55%', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            {post.tipo === 'deal' && post.deal_valor && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
                <div style={{ fontSize: '42px', fontWeight: 900, color: '#34d399', letterSpacing: '-0.04em' }}>{formatPeso(post.deal_valor)}</div>
                <div style={{ fontSize: '16px', color: 'rgba(255,255,255,.5)', marginTop: '8px' }}>Deal cerrado</div>
              </div>
            )}
            {post.tipo === 'metrica' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '56px', fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.04em' }}>{post.metrica_valor}</div>
                <div style={{ fontSize: '16px', color: 'rgba(255,255,255,.5)', marginTop: '8px' }}>{post.metrica_tipo}</div>
              </div>
            )}
            {(post.tipo === 'publicacion' || post.tipo === 'producto') && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>
                <div style={{ fontSize: '64px' }}>✦</div>
              </div>
            )}
          </div>
        )}

        {/* Contenido derecho */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href={`/u/${perfil.slug || ''}`} onClick={onClose}>
              <Avatar perfil={perfil} size={42} />
            </Link>
            <div style={{ flex: 1 }}>
              <Link href={`/u/${perfil.slug || ''}`} onClick={onClose} style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', textDecoration: 'none', display: 'block' }}>{nombre}</Link>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>{perfil.empresa || perfil.industria}</div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          {/* Contenido */}
          <div style={{ padding: '20px', flex: 1 }}>
            {post.titulo && <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>{post.titulo}</div>}
            {post.productos && (
              <div style={{ background: 'rgba(167,139,250,.1)', border: '1px solid rgba(167,139,250,.2)', borderRadius: '12px', padding: '14px', marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                {post.productos.imagen_principal && <img src={post.productos.imagen_principal} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>{post.productos.nombre}</div>
                  {post.productos.precio && <div style={{ fontSize: '16px', fontWeight: 800, color: '#a78bfa', marginTop: '2px' }}>{post.productos.precio}</div>}
                </div>
              </div>
            )}
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', lineHeight: 1.7 }}>{post.contenido}</p>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)', marginTop: '12px' }}>{timeAgo(post.created_at)}</div>
          </div>

          {/* Acciones */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: '10px' }}>
            <a
              href={perfil.whatsapp ? `https://wa.me/${perfil.whatsapp.replace(/\D/g, '')}` : '/auth/register'}
              target={perfil.whatsapp ? '_blank' : '_self'}
              rel="noopener noreferrer"
              style={{ flex: 1, padding: '11px', background: '#25D366', color: '#fff', borderRadius: '12px', textDecoration: 'none', textAlign: 'center', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WhatsApp
            </a>
            <button onClick={() => { if (!window.__v10x_logueado) { window.location.href = '/auth/register'; return; } onConectar() }} style={{ flex: 1, padding: '11px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${ORANGE}40` }}>
              Conectar →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal conectar ──
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
        body: JSON.stringify({ vendedor_id: post.vendedor_id, post_id: post.id, ...form, producto_interes: post.productos?.nombre || post.titulo || null, fuente: 'explore' }),
      })
      setEnviado(true)
    } finally { setEnviando(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: DARK2, borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '28px', border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 40px 80px rgba(0,0,0,.5)' }}>
        {enviado ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>¡Conexión enviada!</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>{nombre} recibirá tu interés pronto.</p>
            <button onClick={onClose} style={{ marginTop: '20px', padding: '12px 28px', background: ORANGE, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Cerrar</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Avatar perfil={perfil} size={44} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Conectar con {nombre}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>{perfil.empresa || perfil.industria || 'Asesor Ventas10x'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { key: 'nombre', label: 'Tu nombre *', placeholder: 'Juan García', type: 'text' },
                { key: 'whatsapp', label: 'WhatsApp', placeholder: '+57 300 000 0000', type: 'tel' },
                { key: 'email', label: 'Email', placeholder: 'juan@empresa.com', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key as keyof ConexionForm]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#f1f5f9' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Mensaje</label>
                <textarea placeholder={`Hola ${perfil.nombre}, me interesa...`} value={form.mensaje} onChange={e => setForm(prev => ({ ...prev, mensaje: e.target.value }))}
                  rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', color: '#f1f5f9' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', color: '#94a3b8' }}>Cancelar</button>
              <button onClick={enviar} disabled={enviando || !form.nombre.trim()} style={{ flex: 2, padding: '12px', background: form.nombre.trim() ? ORANGE : 'rgba(255,255,255,.1)', color: form.nombre.trim() ? '#fff' : '#475569', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: form.nombre.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                {enviando ? 'Enviando...' : `Conectar con ${perfil.nombre || 'asesor'} →`}
              </button>
            </div>
            <a href={perfil.whatsapp ? `https://wa.me/${perfil.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + (perfil.nombre || '') + ', vi tu publicación en Ventas10x')}` : '/auth/register'}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#34d399', textDecoration: 'none', fontWeight: 600 }}>
              📱 O escríbele directo por WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  )
}

// ── Card de post — grid ──
function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const perfil = post.profiles
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'
  const cfg = TIPO_CONFIG[post.tipo] || TIPO_CONFIG.publicacion
  const tieneImagen = !!post.imagen_url

  return (
    <div onClick={onClick} style={{ background: DARK2, borderRadius: '16px', border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }} className="post-card">

      {/* Imagen o placeholder */}
      <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', background: DARK }}>
        {tieneImagen ? (
          <img src={post.imagen_url!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} className="post-img" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            {post.tipo === 'deal' && post.deal_valor && (
              <>
                <div style={{ fontSize: '28px' }}>🏆</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399', letterSpacing: '-0.02em' }}>{formatPeso(post.deal_valor).replace('COP', '').trim()}</div>
              </>
            )}
            {post.tipo === 'metrica' && (
              <>
                <div style={{ fontSize: '28px' }}>📊</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#fbbf24' }}>{post.metrica_valor}</div>
              </>
            )}
            {(post.tipo === 'publicacion' || post.tipo === 'producto') && (
              <div style={{ fontSize: '36px', opacity: 0.3 }}>✦</div>
            )}
          </div>
        )}

        {/* Overlay al hover */}
        <div className="post-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 700 }}>
            ❤️ <span>{post.likes_count}</span>
          </div>
        </div>

        {/* Badge tipo */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '3px 8px', borderRadius: '999px', background: cfg.bg, backdropFilter: 'blur(8px)', border: `1px solid ${cfg.color}40`, fontSize: '10px', fontWeight: 700, color: cfg.color }}>
          {cfg.label}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar perfil={perfil} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.35)' }}>{timeAgo(post.created_at)}</div>
          </div>
        </div>
        {(post.titulo || post.contenido) && (
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginTop: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.titulo || post.contenido}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──
export function ExploreClient() {
  const [posts, setPosts] = useState<Post[]>([])
  const [logueado, setLogueado] = useState(false)

  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [postDetalle, setPostDetalle] = useState<Post | null>(null)
  const [postConectar, setPostConectar] = useState<Post | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { setLogueado(!!d.user); (window as any).__v10x_logueado = !!d.user }).catch(() => {})
  }, [])

  const cargarPosts = useCallback(async (p = 1, tipo: string | null = null, reset = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (tipo) params.set('tipo', tipo)
      const res = await fetch(`/api/feed/posts?${params}`)
      const data = await res.json()
      setPosts(prev => reset ? data.posts : [...prev, ...data.posts])
      setHasMore(data.hasMore)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { cargarPosts(1, filtroTipo, true); setPage(1) }, [filtroTipo, cargarPosts])

  // Asesores únicos del feed
  const asesores = Array.from(new Map(posts.map(p => [p.vendedor_id, p.profiles])).values()).slice(0, 8)

  const FILTROS = [
    { key: null, label: 'Todo' },
    { key: 'producto', label: '📦 Productos' },
    { key: 'deal', label: '🏆 Deals' },
    { key: 'publicacion', label: '📝 Posts' },
    { key: 'metrica', label: '📊 Métricas' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: DARK, fontFamily: "'Inter', system-ui, sans-serif", color: '#f1f5f9' }}>

      {/* Nav */}
      <nav style={{ background: 'rgba(11,17,32,.95)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>Ventas<span style={{ color: ORANGE }}>10x</span></span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)', fontWeight: 400, marginLeft: '4px' }}>/ Explorar</span>
        </Link>

        {/* Filtros en nav */}
        <div style={{ display: 'flex', gap: '4px' }} className="nav-filters">
          {FILTROS.map(f => (
            <button key={String(f.key)} onClick={() => setFiltroTipo(f.key)}
              style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filtroTipo === f.key ? ORANGE : 'rgba(255,255,255,.06)', color: filtroTipo === f.key ? '#fff' : 'rgba(255,255,255,.5)', transition: 'all 0.15s' }}>
              {f.label}
            </button>
          ))}
        </div>

        <Link href="/auth/register" style={{ background: ORANGE, color: '#fff', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 14px ${ORANGE}40` }}>
          Crear perfil →
        </Link>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px', alignItems: 'start' }} className='explore-layout'>

        {/* Feed principal — grid */}
        <div>
          {/* Hero banner */}
          <div style={{ background: `linear-gradient(135deg, ${DARK2} 0%, #1a0f2e 100%)`, borderRadius: '20px', padding: '28px 32px', marginBottom: '28px', border: '1px solid rgba(255,255,255,.07)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: `${ORANGE}15`, pointerEvents: 'none' }} />
            <div style={{ fontSize: '11px', fontWeight: 700, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Red social de ventas</div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Descubre asesores,<br />productos y oportunidades.
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.45)', margin: 0 }}>
              {posts.length}+ publicaciones · Vendedores reales de Latam
            </p>
          </div>

          {/* Grid de posts */}
          {loading && posts.length === 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }} className='posts-grid'>
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ background: DARK2, borderRadius: '16px', aspectRatio: '1', animation: 'pulse 1.5s ease-in-out infinite', border: '1px solid rgba(255,255,255,.05)' }} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: DARK2, borderRadius: '20px', border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>El feed está creciendo</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', marginBottom: '24px' }}>Sé el primero en publicar.</div>
              <Link href="/auth/register" style={{ padding: '12px 28px', background: ORANGE, color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                Crear mi perfil gratis →
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }} className='posts-grid'>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onClick={() => setPostDetalle(post)} />
                ))}
              </div>
              {hasMore && (
                <button onClick={() => { const next = page + 1; setPage(next); cargarPosts(next, filtroTipo) }} disabled={loading}
                  style={{ display: 'block', width: '100%', marginTop: '20px', padding: '14px', background: DARK2, border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', color: 'rgba(255,255,255,.5)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {loading ? 'Cargando...' : 'Ver más publicaciones'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: '76px', display: 'flex', flexDirection: 'column', gap: '20px' }} className='explore-sidebar'>

          {/* Asesores activos */}
          <div style={{ background: DARK2, borderRadius: '16px', border: '1px solid rgba(255,255,255,.07)', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asesores activos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {asesores.map(perfil => {
                const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'
                return (
                  <div key={perfil.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link href={`/u/${perfil.slug || ''}`}>
                      <Avatar perfil={perfil} size={38} />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/u/${perfil.slug || ''}`} style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</Link>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)' }}>{perfil.empresa || perfil.industria || 'Asesor'}</div>
                    </div>
                    <Link href={`/u/${perfil.slug || ''}`} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)', textDecoration: 'none', flexShrink: 0, border: '1px solid rgba(255,255,255,.08)' }}>
                      Ver →
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CTA registro */}
          <div style={{ background: `linear-gradient(135deg, ${ORANGE}20, ${ORANGE}08)`, borderRadius: '16px', border: `1px solid ${ORANGE}30`, padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px', lineHeight: 1.2 }}>¿Eres asesor?<br />Publica gratis.</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)', marginBottom: '16px', lineHeight: 1.5 }}>Crea tu perfil, sube tus productos y empieza a recibir leads hoy.</div>
            <Link href="/auth/register" style={{ display: 'block', padding: '11px', background: ORANGE, color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', textAlign: 'center', boxShadow: `0 4px 14px ${ORANGE}40` }}>
              Crear cuenta gratis →
            </Link>
          </div>

          {/* Stats */}
          <div style={{ background: DARK2, borderRadius: '16px', border: '1px solid rgba(255,255,255,.07)', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>En el feed</div>
            {[
              { label: 'Deals cerrados', val: posts.filter(p => p.tipo === 'deal').length, color: '#34d399' },
              { label: 'Productos', val: posts.filter(p => p.tipo === 'producto').length, color: '#a78bfa' },
              { label: 'Publicaciones', val: posts.filter(p => p.tipo === 'publicacion').length, color: '#60a5fa' },
              { label: 'Métricas', val: posts.filter(p => p.tipo === 'metrica').length, color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)' }}>{s.label}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA flotante mobile */}
      <div className="mobile-cta" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 40, display: 'none' }}>
        <Link href="/auth/register" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: ORANGE, color: '#fff', padding: '13px 20px', borderRadius: '100px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: `0 8px 24px ${ORANGE}50` }}>
          ✦ Publicar
        </Link>
      </div>

      {/* Modales */}
      {postDetalle && (
        <PostModal
          post={postDetalle}
          onClose={() => setPostDetalle(null)}
          onConectar={() => { setPostConectar(postDetalle); setPostDetalle(null) }}
        />
      )}
      {postConectar && <ModalConectar post={postConectar} onClose={() => setPostConectar(null)} />}

      <style>{`
        .post-card:hover { border-color: rgba(255,255,255,.15) !important; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.3); }
        .post-card:hover .post-overlay { opacity: 1 !important; }
        .post-card:hover .post-img { transform: scale(1.05); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 900px) {
          .nav-filters { display: none !important; }
        }
        @media (max-width: 768px) {
          .explore-layout { grid-template-columns: 1fr !important; padding: 16px 12px !important; gap: 20px !important; }
          .explore-sidebar { position: static !important; top: auto !important; }
          .posts-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .mobile-cta { display: flex !important; }
        }
        @media (max-width: 480px) {
          .posts-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
        }
      `}</style>
    </div>
  )
}
