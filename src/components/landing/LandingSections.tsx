'use client'

// ─── Cómo Funciona ───────────────────────────────────────────────────────────
export function ComoFuncionaSection() {
  const steps = [
    {
      num: '01',
      icon: '🪄',
      title: 'Crea tu landing',
      desc: 'Personaliza tu página con foto, productos y colores. La IA extrae tus productos automáticamente desde PDF, Excel, imagen o texto.',
    },
    {
      num: '02',
      icon: '🔗',
      title: 'Comparte el enlace',
      desc: 'Publica tu URL en redes sociales, WhatsApp o Meta Ads. Los leads llenan el formulario y tú recibes la alerta.',
    },
    {
      num: '03',
      icon: '⚡',
      title: 'El sistema trabaja solo',
      desc: 'El lead recibe SMS en 30 segundos. Tú recibes un WhatsApp. El lead entra automáticamente a tu pipeline.',
    },
  ]

  return (
    <section id="como-funciona" className="w-full" style={{ background: 'var(--light-bg)' }}>
      
      <div className="max-w-6xl mx-auto px-6 py-28 text-center">

        <div className="text-xs font-bold tracking-widest uppercase mb-4 text-[var(--orange)]">
          Cómo funciona
        </div>

        <h2 className="max-w-3xl mx-auto"
          style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontSize: 'clamp(32px,5vw,54px)',
            fontWeight: 700,
            letterSpacing: '-1.5px',
            color: 'var(--light-text)'
          }}>
          Configura en 3 pasos.<br />Vende desde el día 1.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          {steps.map(s => (
            <div key={s.num}
              className="relative overflow-hidden rounded-2xl p-9 text-left transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'var(--light-card)',
                border: '1px solid var(--light-border)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>

              <div className="absolute top-5 right-6 text-6xl font-bold text-black/5">
                {s.num}
              </div>

              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5 bg-[var(--orange-light)]">
                {s.icon}
              </div>

              <h3 className="text-lg font-bold mb-2.5 text-[var(--light-text)]">
                {s.title}
              </h3>

              <p className="text-sm leading-relaxed text-[var(--light-text2)]">
                {s.desc}
              </p>

            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
// ─── Catálogo IA ─────────────────────────────────────────────────────────────
const formatos = [
  { icon: '🖼️', cls: 'bg-blue-50',   name: 'Imagen / Foto',   sub: 'Foto de tu catálogo físico o banner' },
  { icon: '📄', cls: 'bg-red-50',    name: 'PDF',              sub: 'Brochure, lista de precios, ficha' },
  { icon: '📊', cls: 'bg-green-50',  name: 'Excel / XLSX',     sub: 'Tu inventario o lista de productos' },
  { icon: '📋', cls: 'bg-teal-50',   name: 'CSV',              sub: 'Exportación de cualquier sistema' },
  { icon: '✏️', cls: 'bg-purple-50', name: 'Texto libre',      sub: 'Pega tu lista directamente' },
  { icon: '🔗', cls: 'bg-yellow-50', name: 'URL / Link',       sub: 'Enlace a tu catálogo online' },
]

const demoProducts = [
  { thumb: '🚗', bg: 'rgba(59,130,246,0.15)', name: 'Toyota Corolla 2024 — LE',     price: '$89.900.000 COP' },
  { thumb: '🏠', bg: 'rgba(34,197,94,0.15)',  name: 'Apto 3 hab. — Laureles 85m²', price: '$450.000.000 COP' },
  { thumb: '📦', bg: 'rgba(168,85,247,0.15)', name: 'Nevera Samsung 400L Inverter', price: '$2.899.000 COP' },
]

export function CatalogoIASection() {
  return (
    <section id="catalogo-ia" className="w-full"
      style={{ background: 'var(--light-bg)' }}>
      <div className="rounded-3xl overflow-hidden relative"
        style={{ background: 'var(--light-card)', border: '1px solid var(--light-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,43,0.06) 0%, transparent 70%)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 p-16 items-center">
          {/* Left */}
          <div>
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--orange)' }}>✨ Catálogo IA</div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--light-text)', marginBottom: 20 }}>
              Tu catálogo listo en<br /><span style={{ color: 'var(--orange)' }}>2 minutos</span>,<br />desde cualquier fuente.
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--light-text2)' }}>
              Olvida copiar y pegar productos uno por uno. Ventas10x usa inteligencia artificial para leer y
              extraer automáticamente nombres, precios, descripciones e imágenes desde cualquier formato que ya tengas.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {formatos.map(f => (
                <div key={f.name} className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 cursor-default"
                  style={{ background: 'var(--light-bg)', border: '1px solid var(--light-border)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--orange-light)'; e.currentTarget.style.borderColor = 'rgba(255,107,43,0.2)'; e.currentTarget.style.transform = 'translateX(4px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--light-bg)'; e.currentTarget.style.borderColor = 'var(--light-border)'; e.currentTarget.style.transform = 'none' }}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${f.cls}`}>{f.icon}</div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--light-text)' }}>{f.name}</div>
                    <div className="text-xs" style={{ color: 'var(--light-muted)' }}>{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <a href="/auth/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--orange)', textDecoration: 'none' }}>
              Probar Catálogo IA gratis →
            </a>
          </div>

          {/* Right — demo */}
          <div className="relative">
            <div className="absolute -top-2.5 -right-2.5 z-10 text-xs font-bold text-white px-3 py-1 rounded-full"
              style={{ background: 'var(--orange)', boxShadow: '0 4px 16px rgba(255,107,43,0.4)' }}>
              ⚡ Powered by IA
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-xs" style={{ color: '#777' }}>Catálogo IA — ventas10x.co/dashboard/catalogo</span>
              </div>
              <div className="p-5">
                <div className="rounded-xl p-5 text-center mb-4" style={{ border: '2px dashed rgba(255,107,43,0.3)', background: 'rgba(255,107,43,0.04)' }}>
                  <div className="text-3xl mb-2">📤</div>
                  <p className="text-xs" style={{ color: '#888' }}>Sube tu archivo o pega texto</p>
                  <div className="text-xs font-semibold mt-1" style={{ color: 'var(--orange)' }}>PDF · Excel · CSV · Imagen · Texto · URL</div>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-4" style={{ background: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0 pulse-dot" style={{ background: 'var(--teal)' }} />
                  <p className="text-xs font-medium" style={{ color: 'var(--teal)' }}>IA extrayendo productos… 3 encontrados</p>
                </div>
                <div className="flex flex-col gap-2">
                  {demoProducts.map(p => (
                    <div key={p.name} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-9 h-9 rounded-md flex items-center justify-center text-lg flex-shrink-0" style={{ background: p.bg }}>{p.thumb}</div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold" style={{ color: '#eee' }}>{p.name}</div>
                        <div className="text-xs" style={{ color: 'var(--teal)' }}>{p.price}</div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--teal)' }}>IA ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Funciones ───────────────────────────────────────────────────────────────
const funciones = [
  { icon: '🪄', badge: 'Incluido',  badgeCls: 'bg-orange-50 text-orange-500',  title: 'Landing personalizada',   desc: 'Tu página con foto, productos, colores de marca y formulario de leads. Lista en minutos.' },
  { icon: '✨', badge: 'IA',        badgeCls: 'bg-blue-50 text-blue-500',      title: 'Catálogo IA',             desc: 'Sube tu PDF, Excel, imagen o texto y la IA extrae nombres, precios y descripciones automáticamente.' },
  { icon: '🤖', badge: 'Nuevo',     badgeCls: 'bg-teal-50 text-teal-600',      title: 'Bot IA por industria',    desc: 'Chat widget en tu landing que califica leads, responde dudas del catálogo y agenda citas.', highlight: true },
  { icon: '📋', badge: 'Visual',    badgeCls: 'bg-purple-50 text-purple-600',  title: 'Pipeline Kanban',         desc: 'Arrastra prospectos entre etapas. Nuevo → Contactado → Interesado → Cerrado.' },
  { icon: '📊', badge: 'Tiempo real',badgeCls: 'bg-yellow-50 text-yellow-600', title: 'Dashboard de métricas',  desc: 'Leads recibidos, leads cerrados y días de trial en tiempo real.' },
  { icon: '🔒', badge: 'Seguro',    badgeCls: 'bg-red-50 text-red-500',        title: 'Control de acceso',       desc: 'Cada vendedor ve solo sus datos. Tú ves todo desde el panel de admin.' },
]

export function FuncionesSection() {
  return (
    <section id="funciones" className="w-full bg-[var(--light-bg)]">

      <div className="max-w-6xl mx-auto px-6 py-28 text-center">

        {/* HEADER */}
        <div className="mb-16">
          <div className="text-xs font-bold tracking-widest uppercase mb-4 text-[var(--orange)]">
            Funciones
          </div>

          <h2
            className="max-w-3xl mx-auto"
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: 'clamp(32px,5vw,54px)',
              fontWeight: 700,
              letterSpacing: '-1.5px',
              color: 'var(--light-text)'
            }}
          >
            Todo lo que necesitas.<br />
            Nada que no necesitas.
          </h2>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12 text-left">
          {funciones.map(f => (
            <div
              key={f.title}
              className="p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={
                f.highlight
                  ? {
                      background: 'linear-gradient(135deg,#0d1f16,#0f1a28)',
                      border: '1px solid rgba(0,184,148,0.25)'
                    }
                  : {
                      background: 'var(--light-card)',
                      border: '1px solid var(--light-border)'
                    }
              }
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: f.highlight
                      ? 'rgba(0,184,148,0.12)'
                      : 'var(--orange-light)'
                  }}
                >
                  {f.icon}
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${f.badgeCls}`}>
                  {f.badge}
                </span>
              </div>

              <h3
                className="font-bold mb-2"
                style={{
                  fontSize: 17,
                  color: f.highlight ? '#fff' : 'var(--light-text)'
                }}
              >
                {f.title}
              </h3>

              <p
                className="text-xs leading-relaxed"
                style={{
                  color: f.highlight ? '#aaa' : 'var(--light-text2)'
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}