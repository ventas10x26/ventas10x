// Ruta destino: src/app/por-que/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavResponsive } from '@/components/NavResponsive'

export const metadata: Metadata = {
  title: 'Por qué existe Ventas10x · La historia detrás del producto',
  description: 'El problema real de los vendedores en Latinoamérica y cómo Ventas10x lo resuelve con landing personalizada, catálogo IA y bot de WhatsApp.',
}

const DARK = '#0b1120'
const ACCENT = '#FF6B2B'

export default function PorQuePage() {
  return (
    <div style={{
      fontFamily: "var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)",
      background: DARK,
      minHeight: '100vh',
      color: '#fff',
    }}>

      <NavResponsive
        links={[
          { href: '/', label: '← Inicio' },
          { href: '#problema', label: 'El problema' },
          { href: '#solucion', label: 'La solución' },
          { href: '#sectores', label: 'Sectores' },
          { href: '/auth/login', label: 'Ingresar' },
        ]}
        ctaHref="/auth/register"
        ctaLabel="Probar gratis"
      />

      {/* ── HERO ── */}
      <section style={{ padding: '7rem 2rem 5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-200px', right: '-100px',
          width: '700px', height: '700px', borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}12 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,107,43,.1)', border: '1px solid rgba(255,107,43,.3)',
            borderRadius: '20px', padding: '6px 16px', marginBottom: '2rem',
            fontSize: '13px', color: '#FF8C42', fontWeight: 600,
          }}>
            🧠 La historia detrás del producto
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 5.5vw, 72px)', fontWeight: 800,
            lineHeight: 1.0, letterSpacing: '-.05em', marginBottom: '1.5rem',
          }}>
            El vendedor latinoamericano<br />
            <span style={{ color: ACCENT }}>merece mejores herramientas.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(17px, 1.8vw, 21px)', color: 'rgba(255,255,255,.6)',
            lineHeight: 1.8, maxWidth: '620px', marginBottom: '3rem',
          }}>
            En Colombia y Latam, miles de asesores comerciales talentosos pierden ventas
            no por falta de habilidad — sino por falta de infraestructura digital.
            Ventas10x nació para cambiar eso.
          </p>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { num: '78%', label: 'de vendedores no tiene presencia digital propia' },
              { num: '3x', label: 'más cierres con seguimiento automatizado' },
              { num: '48h', label: 'promedio para configurar y lanzar tu landing' },
            ].map(s => (
              <div key={s.num} style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: '14px', padding: '16px 24px',
              }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginTop: '4px', maxWidth: '160px', lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EL PROBLEMA ── */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              El problema real
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.1, margin: 0 }}>
              ¿Cómo vende hoy un asesor<br />en Latinoamérica?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { emoji: '📱', titulo: 'Un número de WhatsApp', desc: 'Su única herramienta digital es su teléfono. No tiene manera de mostrar su catálogo de forma profesional ni capturar datos del prospecto.' },
              { emoji: '🗂️', titulo: 'Excel para los leads', desc: 'El seguimiento de prospectos vive en hojas de cálculo, notas del celular o simplemente en la memoria. La mayoría de leads se pierden.' },
              { emoji: '⏰', titulo: 'Tiempo perdido respondiendo', desc: 'Responde las mismas preguntas una y otra vez: precio, disponibilidad, características. Tiempo que debería usar en cerrar ventas.' },
              { emoji: '🏢', titulo: 'Dependiente de la empresa', desc: 'Si trabaja con una marca grande, no tiene identidad propia. Si se va, pierde todo. No construye su propio activo digital.' },
              { emoji: '📉', titulo: 'Sin datos, sin estrategia', desc: 'No sabe cuántas personas vieron su catálogo, cuánto tiempo tarda en cerrar, qué productos interesan más. Vende a ciegas.' },
              { emoji: '🤼', titulo: 'Compite con precio', desc: 'Sin diferenciación digital, la única forma de competir es bajando el precio. El mejor asesor pierde ante el que oferta menos.' },
            ].map(p => (
              <div key={p.titulo} style={{
                background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.12)',
                borderRadius: '16px', padding: '24px',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{p.emoji}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>{p.titulo}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.65 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LA OPORTUNIDAD ── */}
      <section style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            La oportunidad
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            El vendedor que usa IA<br />
            <span style={{ color: ACCENT }}>cierra 3x más negocios.</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,.6)', lineHeight: 1.8, marginBottom: '3rem' }}>
            No porque sea más inteligente. Sino porque tiene infraestructura que trabaja por él
            mientras duerme: su landing captura leads, su bot responde consultas,
            su CRM le recuerda a quién llamar mañana.
          </p>

          {/* Timeline narrativo */}
          <div style={{ textAlign: 'left', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '19px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg, #FF6B2B, #FF6B2B40)', borderRadius: '2px' }} />
            {[
              { hora: '9:00 AM', titulo: 'El cliente busca en Google', desc: 'Encuentra la landing de tu asesor. Ve el catálogo, lee testimonios, entiende el proceso. Ya está calificado antes de escribir.' },
              { hora: '9:03 AM', titulo: 'El bot responde al instante', desc: 'Mientras el asesor está en otra reunión, la IA responde preguntas, muestra productos relevantes y captura los datos del prospecto.' },
              { hora: '9:15 AM', titulo: 'El lead aparece en el CRM', desc: 'El asesor ve en su pipeline: nuevo lead con nombre, teléfono, producto de interés y toda la conversación con el bot. Listo para cerrar.' },
              { hora: '10:00 AM', titulo: 'El asesor llama para cerrar', desc: 'No para presentarse. No para explicar qué vende. Solo para resolver la última duda y tomar el pedido. El sistema hizo todo lo demás.' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '24px', marginBottom: '32px', position: 'relative' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 800, color: '#fff', zIndex: 1,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, paddingTop: '8px' }}>
                  <div style={{ fontSize: '12px', color: ACCENT, fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>{t.hora}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>{t.titulo}</div>
                  <div style={{ fontSize: '15px', color: 'rgba(255,255,255,.55)', lineHeight: 1.65 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LA SOLUCIÓN: 4 PILARES ── */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              La solución completa
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.1, margin: 0 }}>
              Cuatro pilares que trabajan juntos
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              {
                num: '01',
                icon: '🌐',
                titulo: 'Landing por sector',
                color: '#3b82f6',
                puntos: [
                  'URL propia: ventas10x.co/u/tuslug',
                  'Hero con título generado por IA',
                  'Diseño adaptado a tu industria',
                  'SEO automático para Google',
                  'Testimonios, FAQ y CTA secciones',
                ],
                desc: 'Tu página de ventas personal. Lista en minutos, sin saber diseño ni código.',
              },
              {
                num: '02',
                icon: '📦',
                titulo: 'Catálogo inteligente',
                color: '#8b5cf6',
                puntos: [
                  'Sube productos con imagen y precio',
                  'La IA escribe descripciones por ti',
                  'Botón de cotización por WhatsApp',
                  'Catálogo visible en tu landing',
                  'Stock y disponibilidad en tiempo real',
                ],
                desc: 'Tu inventario digital. La IA lo describe, tú lo vendes.',
              },
              {
                num: '03',
                icon: '🤖',
                titulo: 'Bot IA de WhatsApp',
                color: '#22c55e',
                puntos: [
                  'Responde preguntas 24/7',
                  'Muestra catálogo al prospecto',
                  'Captura leads automáticamente',
                  'Habla como tú, con tu tono',
                  'Pasa al asesor cuando es necesario',
                ],
                desc: 'Tu asesor digital que nunca duerme y nunca pierde un lead.',
              },
              {
                num: '04',
                icon: '📊',
                titulo: 'CRM y Pipeline',
                color: '#f59e0b',
                puntos: [
                  'Pipeline Kanban con 6 etapas',
                  'Timeline de actividades por lead',
                  'Recordatorios de seguimiento',
                  'Métricas de conversión en tiempo real',
                  'Multi-org para equipos y agencias',
                ],
                desc: 'Tu centro de control. Cada lead, cada interacción, cada oportunidad.',
              },
            ].map(p => (
              <div key={p.num} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: '20px', padding: '28px', position: 'relative', overflow: 'hidden',
              }}>
                {/* Número decorativo */}
                <div style={{
                  position: 'absolute', top: '16px', right: '20px',
                  fontSize: '56px', fontWeight: 900, color: 'rgba(255,255,255,.04)',
                  lineHeight: 1, letterSpacing: '-0.05em',
                }}>
                  {p.num}
                </div>

                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: `${p.color}20`, border: `1px solid ${p.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '16px',
                }}>
                  {p.icon}
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: p.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Pilar {p.num}
                </div>

                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {p.titulo}
                </div>

                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.45)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {p.desc}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {p.puntos.map(punto => (
                    <div key={punto} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,.6)' }}>
                      <span style={{ color: p.color, flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {punto}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTORES ── */}
      <section style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Diseñado por sector
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.1, margin: 0 }}>
              Una herramienta que habla<br />el idioma de tu industria
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { emoji: '🚗', sector: 'Automotriz', ejemplo: 'Asesores KIA, Chevrolet, BMW', color: '#3b82f6' },
              { emoji: '🏠', sector: 'Inmobiliaria', ejemplo: 'Agentes y constructoras', color: '#8b5cf6' },
              { emoji: '🩺', sector: 'Salud', ejemplo: 'Médicos, odontólogos, spas', color: '#22c55e' },
              { emoji: '🛍️', sector: 'Retail', ejemplo: 'Tiendas y distribuidores', color: '#f59e0b' },
              { emoji: '💻', sector: 'Tecnología', ejemplo: 'SaaS y agencias digitales', color: '#06b6d4' },
              { emoji: '✨', sector: 'Belleza', ejemplo: 'Estéticas y peluquerías', color: '#ec4899' },
              { emoji: '💼', sector: 'Servicios', ejemplo: 'Consultores y freelancers', color: '#f97316' },
              { emoji: '⭐', sector: 'Y más...', ejemplo: 'Tema genérico para cualquier industria', color: '#94a3b8' },
            ].map(s => (
              <div key={s.sector} style={{
                background: `${s.color}08`, border: `1px solid ${s.color}25`,
                borderRadius: '14px', padding: '20px 18px',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.emoji}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>{s.sector}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', lineHeight: 1.4 }}>{s.ejemplo}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISION ── */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Nuestra visión
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 52px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            El futuro de las ventas en Latam<br />
            <span style={{ color: ACCENT }}>es personal, digital y con IA.</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,.55)', lineHeight: 1.85, marginBottom: '3rem' }}>
            No creemos en reemplazar al vendedor. Creemos en amplificarlo.
            La relación humana sigue siendo el corazón de toda venta.
            Ventas10x le da al asesor el tiempo, los datos y la infraestructura
            para que esa relación sea más productiva, más rápida y más rentable.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', marginBottom: '3rem' }}>
            {[
              { titulo: 'Para el asesor independiente', desc: 'Construye su marca personal, su catálogo y su base de clientes. Independiente de cualquier empresa.' },
              { titulo: 'Para el equipo de ventas', desc: 'Manager y asesores en una misma plataforma. Visibilidad total del pipeline sin reuniones de seguimiento.' },
              { titulo: 'Para la empresa o agencia', desc: 'Gestiona múltiples asesores y clientes desde un solo dashboard. Escala sin caos.' },
            ].map(v => (
              <div key={v.titulo} style={{
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
                borderRadius: '14px', padding: '20px 22px',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: ACCENT, flexShrink: 0, marginTop: '7px',
                }} />
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>{v.titulo}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '6rem 2rem 5rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.05, marginBottom: '1.25rem' }}>
            ¿Listo para vender<br />
            <span style={{ color: ACCENT }}>con ventaja?</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            14 días gratis. Sin tarjeta. Tu landing activa en menos de 48 horas.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{
              background: ACCENT, color: '#fff', padding: '18px 42px',
              borderRadius: '14px', fontSize: '17px', fontWeight: 700,
              textDecoration: 'none', display: 'inline-block',
              boxShadow: `0 8px 32px ${ACCENT}40`,
            }}>
              Crear cuenta gratis →
            </Link>
            <Link href="/" style={{
              background: 'rgba(255,255,255,.07)', color: '#fff',
              padding: '18px 32px', borderRadius: '14px', fontSize: '17px',
              fontWeight: 600, textDecoration: 'none', display: 'inline-block',
              border: '1px solid rgba(255,255,255,.12)',
            }}>
              Ver el producto
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.3)' }}>
          © 2025 Ventas10x · Hecho en Colombia para Latam
        </div>
      </footer>
    </div>
  )
}
