// Ruta destino: src/components/landing/LandingPage.tsx
'use client'

import { useState } from 'react'
import type { Profile, LandingConfig, Producto } from '@/types/database'
import { ProductoCard } from './ProductoCard'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface Props {
  profile: Pick<Profile, 'id' | 'nombre' | 'apellido' | 'empresa' | 'avatar_url'>
  config: LandingConfig | null
  productos: Producto[]
  slug: string
}

export function LandingPage({ profile, config, productos, slug }: Props) {
  const [nombre, setNombre] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [interes, setInteres] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const vendedorNombre = [profile.nombre, profile.apellido].filter(Boolean).join(' ')
  const acento = config?.color_acento || '#FF6B2B'
  const titulo = config?.titulo || 'Tu solución, personalizada.'
  const subtitulo = config?.subtitulo || 'Escríbeme ahora y te respondo en menos de 30 minutos.'
  const producto = config?.producto || 'productos y servicios'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !whatsapp) return
    setLoading(true); setError('')

    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        vendedor_id: profile.id,
        nombre,
        whatsapp,
        producto: interes || null,
        fuente: 'landing',
        slug_origen: slug,
        etapa: 'nuevo',
      }),
    })

    if (!res.ok) {
      setError('Error al enviar. Intenta de nuevo.')
      setLoading(false)
      return
    }

    fetch(`${SUPABASE_URL}/functions/v1/notificar-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        vendedor_id: profile.id,
        lead_nombre: nombre,
        lead_whatsapp: whatsapp,
        lead_producto: interes,
      }),
    }).catch(() => {})

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0"
            style={{ background: acento }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={vendedorNombre} className="w-full h-full object-cover"/>
              : vendedorNombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
            }
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{vendedorNombre}</div>
            <div className="text-xs text-gray-500">{profile.empresa || 'Asesor Ventas10x'}</div>
          </div>
        </div>
        <a href="#cta" className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
          style={{ background: acento }}>
          Solicitar cotización →
        </a>
      </nav>

      {/* Hero */}
      <div className="py-20 px-6 text-center border-b border-gray-100">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6 border"
          style={{ background: `${acento}15`, color: acento, borderColor: `${acento}40` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: acento }}/>
          Asesor verificado · {profile.empresa || 'Ventas10x'}
        </div>
        <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-gray-900 mb-4 leading-tight tracking-tight max-w-2xl mx-auto">
          {titulo.replace(/\{producto\}/g, producto)}
        </h1>
        <p className="text-lg text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">{subtitulo}</p>
        <a href="#cta" className="inline-block text-white font-bold px-8 py-4 rounded-2xl text-base transition-opacity hover:opacity-90"
          style={{ background: acento }}>
          Solicitar cotización →
        </a>
      </div>

      {/* Productos con galería */}
      {productos.length > 0 && (
        <div className="py-16 px-6 bg-gray-50 border-b border-gray-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-2">
              Productos disponibles
            </h2>
            <p className="text-gray-500 text-center mb-8 text-sm">
              Estos son los {producto.toLowerCase()} que puedes cotizar conmigo hoy.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {productos.map(p => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  colorAcento={acento}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Form */}
      <div id="cta" className="py-16 px-6" style={{ background: '#0f1a2e' }}>
        <div className="max-w-md mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#B5D4F4' }}>
            Contáctame ahora
          </span>
          <h2 className="text-2xl font-display font-bold text-white mt-3 mb-2">
            ¿Listo para tu cotización?
          </h2>
          <p className="text-sm mb-8" style={{ color: '#B5D4F4' }}>
            Llena el formulario y te respondo en menos de 30 minutos.
          </p>

          {success ? (
            <div className="bg-green-900/30 border border-green-500/30 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">✓</div>
              <div className="text-white font-semibold">¡Solicitud enviada!</div>
              <div className="text-green-300 text-sm mt-1">
                Te contactamos en menos de 30 minutos por WhatsApp.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Tu nombre completo" value={nombre}
                onChange={e => setNombre(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', borderColor: '#0C447C' }}/>

              <input type="tel" placeholder="Tu WhatsApp (+57 300...)" value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', borderColor: '#0C447C' }}/>

              <input type="text" placeholder={`¿Qué ${producto.toLowerCase()} necesitas? (opcional)`}
                value={interes} onChange={e => setInteres(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', borderColor: '#0C447C' }}/>

              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: acento }}>
                {loading ? 'Enviando...' : 'Solicitar cotización →'}
              </button>
            </form>
          )}
          <p className="text-xs mt-4" style={{ color: '#0C447C' }}>
            Sin compromisos · Respuesta en 30 min · 100% gratuito
          </p>
        </div>
      </div>

      <footer className="px-6 py-4 border-t border-gray-100 text-center text-xs text-gray-400">
        Powered by{' '}
        <a href="https://ventas10x.co" className="font-semibold text-gray-600 hover:text-gray-900">
          Ventas10x
        </a>
      </footer>
    </div>
  )
}
