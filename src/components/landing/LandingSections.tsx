const formatos = [
  { icon: '🖼️', cls: 'bg-blue-50',   name: 'Imagen / Foto',   sub: 'Foto de tu catálogo físico o banner' },
  { icon: '📄', cls: 'bg-red-50',    name: 'PDF',              sub: 'Brochure, lista de precios, ficha' },
  { icon: '📊', cls: 'bg-green-50',  name: 'Excel / XLSX',     sub: 'Tu inventario o lista de productos' },
  { icon: '📋', cls: 'bg-teal-50',   name: 'CSV',              sub: 'Exportación de cualquier sistema' },
  { icon: '✏️', cls: 'bg-purple-50', name: 'Texto libre',      sub: 'Pega tu lista directamente' },
  { icon: '🔗', cls: 'bg-yellow-50', name: 'URL / Link',       sub: 'Enlace a tu catálogo online' },
]

const demoProducts = [
  { thumb: '🚗', bg: 'rgba(59,130,246,0.15)', name: 'Toyota Corolla 2024 — LE', price: '$89.900.000 COP' },
  { thumb: '🏠', bg: 'rgba(34,197,94,0.15)',  name: 'Apto 3 hab. — Laureles 85m²', price: '$450.000.000 COP' },
  { thumb: '📦', bg: 'rgba(168,85,247,0.15)', name: 'Nevera Samsung 400L Inverter', price: '$2.899.000 COP' },
]

export function CatalogoIASection() {
  return (
    <section id="catalogo-ia" style={{ background: 'var(--light-bg)', padding: '0 1rem' }}>
      <div style={{ background: 'var(--light-card)', border: '1px solid var(--light-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      <div id="catalogo-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
          {/* Left */}
          <div style={{ padding: '2rem 1.5rem' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: '12px' }}>✨ Catálogo IA</div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(28px,4vw,46px)', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--light-text)', marginBottom: 20 }}>
              Tu catálogo listo en<br /><span style={{ color: 'var(--orange)' }}>2 minutos</span>,<br />desde cualquier fuente.
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--light-text2)', marginBottom: '2rem' }}>
              Olvida copiar y pegar productos uno por uno. Ventas10x usa inteligencia artificial para leer y
              extraer automáticamente nombres, precios, descripciones e imágenes desde cualquier formato que ya tengas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
              {formatos.map(f => (
                <div key={f.name}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'var(--light-bg)', border: '1px solid var(--light-border)', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--orange-light)'; e.currentTarget.style.borderColor = 'rgba(255,107,43,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--light-bg)'; e.currentTarget.style.borderColor = 'var(--light-border)' }}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${f.cls}`}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--light-text)' }}>{f.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--light-muted)' }}>{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <a href="/auth/register"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#fff', background: 'var(--orange)', textDecoration: 'none' }}>
              Probar Catálogo IA gratis →
            </a>
          </div>

          {/* Right — demo — oculto en mobile */}
          <div style={{ display: 'none', position: 'relative', padding: '2rem 1.5rem' }} id="catalogo-demo-desktop">
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', zIndex: 10, fontSize: '11px', fontWeight: 700, color: '#fff', padding: '4px 12px', borderRadius: '20px', background: 'var(--orange)', boxShadow: '0 4px 16px rgba(255,107,43,0.4)' }}>
              ⚡ Powered by IA
            </div>
            <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#777' }}>Catálogo IA — ventas10x.co</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px', border: '2px dashed rgba(255,107,43,0.3)', background: 'rgba(255,107,43,0.04)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📤</div>
                  <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Sube tu archivo o pega texto</p>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: 'var(--orange)' }}>PDF · Excel · CSV · Imagen · Texto · URL</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', background: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--teal)', margin: 0 }}>IA extrayendo productos… 3 encontrados</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {demoProducts.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, background: p.bg }}>{p.thumb}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#eee' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--teal)' }}>{p.price}</div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: 'rgba(0,184,148,0.1)', color: 'var(--teal)' }}>IA ✓</span>
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
