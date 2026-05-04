// Ruta destino: src/components/landing/RedSocialSection.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const ORANGE = '#FF6B2B'
const DARK = '#0b1120'

type Perfil = {
  nombre: string | null
  apellido: string | null
  empresa: string | null
  avatar_url: string | null
  slug: string | null
  industria: string | null
}

type Post = {
  id: string
  tipo: string
  titulo: string | null
  contenido: string
  imagen_url: string | null
  deal_valor: number | null
  likes_count: number
  created_at: string
  profiles: Perfil
}

const TIPO_COLORS: Record<string, string> = {
  publicacion: '#3b82f6',
  producto: '#8b5cf6',
  deal: '#22c55e',
  metrica: '#f59e0b',
}
const TIPO_LABELS: Record<string, string> = {
  publicacion: '📝 Post',
  producto: '📦 Producto',
  deal: '🏆 Deal',
  metrica: '📊 Métrica',
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

function MiniPostCard({ post }: { post: Post }) {
  const perfil = post.profiles
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'
  const initials = nombre.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const color = TIPO_COLORS[post.tipo] || ORANGE

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #f1f5f9',
      overflow: 'hidden',
      flexShrink: 0,
      width: '300px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Imagen */}
      {post.imagen_url && (
        <div style={{ height: '160px', overflow: 'hidden' }}>
          <img
            src={post.imagen_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      <div style={{ padding: '14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          {perfil.avatar_url
            ? <img src={perfil.avatar_url} alt={nombre} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{perfil.empresa || perfil.industria || 'Asesor'} · {timeAgo(post.created_at)}</div>
          </div>
          <span style={{
            fontSize: '9px', fontWeight: 700, padding: '2px 7px',
            borderRadius: '999px', background: `${color}15`, color,
            textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
          }}>
            {TIPO_LABELS[post.tipo]}
          </span>
        </div>

        {/* Deal highlight */}
        {post.tipo === 'deal' && post.deal_valor && (
          <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '10px', marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a' }}>🏆 DEAL CERRADO</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#15803d' }}>
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(post.deal_valor)}
            </div>
          </div>
        )}

        {/* Contenido */}
        {post.titulo && <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{post.titulo}</div>}
        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.contenido}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>❤️ {post.likes_count}</span>
          <Link
            href={`/u/${perfil.slug || ''}`}
            style={{ fontSize: '12px', fontWeight: 600, color: ORANGE, textDecoration: 'none' }}
          >
            Ver perfil →
          </Link>
        </div>
      </div>
    </div>
  )
}

export function RedSocialSection() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/feed/posts?page=1')
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Duplicar para carrusel infinito
  const allPosts = [...posts, ...posts]

  return (
    <div style={{ background: DARK, padding: '6rem 0', borderTop: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', marginBottom: '3rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.12em', color: ORANGE, marginBottom: '1rem', textTransform: 'uppercase' }}>
            Red social de ventas
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-.03em', color: '#fff', margin: 0, lineHeight: 1.1 }}>
            Lo que está pasando<br />
            <span style={{ color: ORANGE }}>en Ventas10x ahora.</span>
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,.5)', marginTop: '1rem', maxWidth: '480px', lineHeight: 1.7, fontWeight: 400 }}>
            Deals cerrados, productos nuevos y métricas reales de vendedores en toda Latam. Únete y empieza a publicar.
          </p>
        </div>
        <Link href="/explore" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)',
          color: '#fff', padding: '12px 24px', borderRadius: '12px',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          Ver feed completo →
        </Link>
      </div>

      {/* Stats rápidas */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { valor: posts.filter(p => p.tipo === 'deal').length + '+', label: 'Deals publicados', color: '#22c55e' },
            { valor: posts.filter(p => p.tipo === 'producto').length + '+', label: 'Productos en el feed', color: '#8b5cf6' },
            { valor: posts.length + '+', label: 'Publicaciones activas', color: '#3b82f6' },
            { valor: '🌎', label: 'Colombia · México · Perú', color: ORANGE },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: s.color }}>{s.valor}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Carrusel fila 1 — izquierda */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '14px' }}>
          Cargando feed...
        </div>
      ) : (
        <>
          <div style={{ overflow: 'hidden', marginBottom: '16px', paddingLeft: '2rem' }}>
            <div style={{ display: 'flex', gap: '16px', animation: 'feedLeft 35s linear infinite', width: 'max-content' }}>
              {allPosts.slice(0, Math.ceil(allPosts.length / 2) * 2).map((post, i) => (
                <MiniPostCard key={`${post.id}-${i}`} post={post} />
              ))}
            </div>
          </div>

          {/* Carrusel fila 2 — derecha */}
          <div style={{ overflow: 'hidden', paddingLeft: '2rem' }}>
            <div style={{ display: 'flex', gap: '16px', animation: 'feedRight 35s linear infinite', width: 'max-content' }}>
              {[...allPosts].reverse().map((post, i) => (
                <MiniPostCard key={`${post.id}-r-${i}`} post={post} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* CTA */}
      <div style={{ maxWidth: '1100px', margin: '3rem auto 0', padding: '0 2rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/auth/register" style={{
          background: ORANGE, color: '#fff', padding: '14px 28px',
          borderRadius: '12px', fontSize: '15px', fontWeight: 700,
          textDecoration: 'none', display: 'inline-block',
          boxShadow: `0 6px 24px rgba(255,107,43,0.35)`,
        }}>
          Crear mi perfil y publicar →
        </Link>
        <Link href="/explore" style={{
          background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
          color: '#fff', padding: '14px 28px', borderRadius: '12px',
          fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-block',
        }}>
          Explorar el feed
        </Link>
      </div>

      <style>{`
        @keyframes feedLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes feedRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
