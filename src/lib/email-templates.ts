// Ruta destino: src/lib/email-templates.ts
// Templates HTML para todos los emails. Tono: coach de ventas directo.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

type DatosVendedor = {
  nombre: string
  primerNombre: string
  email: string
  slug: string
  empresa: string | null
}

// ═════════════════════════════════════════════════════════════════════════
// COMPONENTES BASE
// ═════════════════════════════════════════════════════════════════════════

const wrap = (contenido: string) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9;padding:2rem;">
  ${contenido}
  ${footer()}
</div>
`

const header = (titulo: string, subtitulo: string, emoji: string = '🚀') => `
<div style="background:#0f1c2e;border-radius:20px;padding:2.5rem;margin-bottom:1.5rem;text-align:center;">
  <div style="font-size:48px;margin-bottom:1rem;line-height:1;">${emoji}</div>
  <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 12px;letter-spacing:-.02em;line-height:1.3;">
    ${titulo}
  </h1>
  <p style="color:rgba(255,255,255,.65);font-size:15px;margin:0;line-height:1.6;">
    ${subtitulo}
  </p>
</div>
`

const cta = (href: string, texto: string) => `
<a href="${href}" style="display:block;background:#FF6B2B;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:14px;font-weight:700;font-size:16px;margin-bottom:1rem;">
  ${texto}
</a>
`

const ctaSecundario = (href: string, texto: string) => `
<a href="${href}" style="display:block;background:#fff;color:#0f1c2e;text-decoration:none;text-align:center;padding:14px;border-radius:14px;font-weight:600;font-size:14px;margin-bottom:1rem;border:1px solid #e5e7eb;">
  ${texto}
</a>
`

const card = (contenido: string) => `
<div style="background:#fff;border-radius:16px;padding:1.75rem;margin-bottom:1.5rem;border:0.5px solid #e5e7eb;">
  ${contenido}
</div>
`

const cardOrange = (contenido: string) => `
<div style="background:linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem;border:1px solid #fdba74;">
  ${contenido}
</div>
`

const footer = () => `
<div style="background:#fff;border-radius:16px;padding:1.25rem;border:0.5px solid #e5e7eb;margin-bottom:1.5rem;">
  <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
    ¿Necesitas ayuda? Escríbeme al <a href="https://wa.me/573004339418" style="color:#FF6B2B;font-weight:600;">WhatsApp</a> o responde este email.
  </p>
  <div style="margin-top:1rem;display:flex;align-items:center;gap:10px;">
    <div style="width:36px;height:36px;border-radius:50%;background:#FF6B2B;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;">R</div>
    <div>
      <div style="font-size:13px;font-weight:700;color:#111827;">Ricardo Zambrano</div>
      <div style="font-size:12px;color:#9ca3af;">Fundador · Ventas10x</div>
    </div>
  </div>
</div>
<p style="text-align:center;color:#9ca3af;font-size:12px;">
  Ventas10x · <a href="https://ventas10x.co" style="color:#FF6B2B;">ventas10x.co</a>
</p>
`

// ═════════════════════════════════════════════════════════════════════════
// EMAIL 1: WELCOME (Día 0)
// ═════════════════════════════════════════════════════════════════════════

export function templateWelcome(v: DatosVendedor): { asunto: string; html: string } {
  const landingUrl = `${BASE_URL}/u/${v.slug}`

  return {
    asunto: `${v.primerNombre}, tu landing de ventas ya está lista 🚀`,
    html: wrap(`
      ${header(
        `${v.primerNombre}, bienvenido a Ventas10x`,
        `Tu kit completo de ventas digitales está listo. <strong style="color:#FF6B2B;">14 días gratis</strong> para activarlo.`,
        '🚀'
      )}

      ${cardOrange(`
        <div style="font-size:13px;font-weight:800;color:#9a3412;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">
          ⚡ TU LANDING DE CONVERSIÓN
        </div>
        <div style="font-size:15px;color:#0f1c2e;font-weight:700;margin-bottom:6px;">Ya está lista para recibir leads:</div>
        <div style="background:#fff;padding:10px 14px;border-radius:10px;font-family:monospace;font-size:13px;color:#FF6B2B;font-weight:700;word-break:break-all;border:1px solid #fdba74;">
          ${landingUrl}
        </div>
      `)}

      ${card(`
        <h2 style="font-size:17px;font-weight:800;color:#111827;margin:0 0 1rem;">Tu kit de ventas digital incluye:</h2>
        <div style="display:flex;flex-direction:column;gap:.875rem;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:#fff7f3;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🎨</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">Landing personalizada</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.5;">Diseñada para convertir visitas en prospectos calificados.</div>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:#fff7f3;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🤖</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">Bot IA en WhatsApp 24/7</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.5;">Captura y califica leads mientras duermes.</div>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:#fff7f3;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">✨</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">Catálogo IA</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.5;">Sube tus productos en cualquier formato. La IA los organiza por ti.</div>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:#fff7f3;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">📊</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">Pipeline visual</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.5;">Gestiona tus leads de "nuevo" hasta "vendido" sin perder ninguno.</div>
            </div>
          </div>
        </div>
      `)}

      ${card(`
        <h3 style="font-size:15px;font-weight:800;color:#111827;margin:0 0 8px;">📌 Empieza así:</h3>
        <p style="font-size:13px;color:#6b7280;margin:0 0 1rem;line-height:1.6;">
          La forma más rápida de ver el sistema funcionando es:
        </p>
        <ol style="margin:0;padding-left:1.25rem;color:#374151;font-size:13px;line-height:1.8;">
          <li><strong>Sube tu catálogo</strong> (texto, foto, PDF, Excel)</li>
          <li><strong>Configura tu Bot IA</strong> con tu industria</li>
          <li><strong>Comparte tu landing</strong> en WhatsApp y redes</li>
        </ol>
      `)}

      ${cta(`${BASE_URL}/dashboard`, '🎯 Ir a mi dashboard →')}
      ${ctaSecundario(landingUrl, '👁️ Ver mi landing pública')}
    `),
  }
}

// ═════════════════════════════════════════════════════════════════════════
// EMAIL 2: PERSONALIZAR LANDING (Día 1)
// ═════════════════════════════════════════════════════════════════════════

export function templatePersonalizarLanding(v: DatosVendedor): { asunto: string; html: string } {
  const landingUrl = `${BASE_URL}/u/${v.slug}`

  return {
    asunto: `${v.primerNombre}, así convertirás tu landing en una máquina de leads`,
    html: wrap(`
      ${header(
        `Tu landing necesita 5 minutos`,
        `${v.primerNombre}, una landing personalizada convierte <strong style="color:#FF6B2B;">3x más</strong> que una genérica.`,
        '🎨'
      )}

      ${card(`
        <h2 style="font-size:17px;font-weight:800;color:#111827;margin:0 0 1rem;">Lo que vas a personalizar:</h2>
        <div style="display:flex;flex-direction:column;gap:.875rem;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;color:#1e40af;font-weight:800;font-size:13px;flex-shrink:0;">1</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">Foto profesional + tu nombre</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.5;">La gente compra a personas, no a empresas. Tu cara genera confianza.</div>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;color:#1e40af;font-weight:800;font-size:13px;flex-shrink:0;">2</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">Título que vende</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.5;">No "Soy asesor de ventas". Sí "Te ayudo a comprar tu primer carro sin score crediticio".</div>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;color:#1e40af;font-weight:800;font-size:13px;flex-shrink:0;">3</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">Tu catálogo de productos</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.5;">La IA lo extrae de cualquier formato. Solo súbelo y listo.</div>
            </div>
          </div>
        </div>
      `)}

      ${cardOrange(`
        <div style="font-size:13px;font-weight:800;color:#9a3412;margin-bottom:6px;">💡 TIP DE COACH</div>
        <p style="font-size:14px;color:#0f1c2e;margin:0;line-height:1.5;">
          <strong>El editor con IA</strong> te permite cambiar todo escribiendo en lenguaje natural. Ejemplo: <em>"hazme una landing más juvenil con colores azul y blanco"</em>.
        </p>
      `)}

      ${cta(`${BASE_URL}/dashboard/landing-editor`, '🎨 Personalizar mi landing →')}
      ${ctaSecundario(landingUrl, '👁️ Ver cómo está ahora')}
    `),
  }
}

// ═════════════════════════════════════════════════════════════════════════
// EMAIL 3: CREAR BOT IA (Día 3)
// ═════════════════════════════════════════════════════════════════════════

export function templateCrearBot(v: DatosVendedor): { asunto: string; html: string } {
  return {
    asunto: `${v.primerNombre}, tu Bot IA cierra ventas mientras duermes`,
    html: wrap(`
      ${header(
        `Tu Bot IA está sin activar`,
        `${v.primerNombre}, el 67% de leads se pierden por no responder rápido. <strong style="color:#FF6B2B;">Tu Bot lo soluciona.</strong>`,
        '🤖'
      )}

      ${card(`
        <h2 style="font-size:17px;font-weight:800;color:#111827;margin:0 0 1rem;">Lo que tu Bot IA va a hacer hoy:</h2>
        <div style="display:flex;flex-direction:column;gap:.75rem;">
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f0fdf4;border-radius:10px;border:1px solid #86efac;">
            <span style="font-size:22px;">⚡</span>
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:700;color:#0f1c2e;">Responder en menos de 1 minuto</div>
              <div style="font-size:12px;color:#166534;">No hay competencia que iguale eso.</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f0fdf4;border-radius:10px;border:1px solid #86efac;">
            <span style="font-size:22px;">🎯</span>
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:700;color:#0f1c2e;">Calificar prospectos automáticamente</div>
              <div style="font-size:12px;color:#166534;">Identifica los serios de los curiosos.</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f0fdf4;border-radius:10px;border:1px solid #86efac;">
            <span style="font-size:22px;">📅</span>
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:700;color:#0f1c2e;">Agendar demos sin tu intervención</div>
              <div style="font-size:12px;color:#166534;">Tú solo cierras la venta.</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f0fdf4;border-radius:10px;border:1px solid #86efac;">
            <span style="font-size:22px;">🌙</span>
            <div style="flex:1;">
              <div style="font-size:14px;font-weight:700;color:#0f1c2e;">Trabajar 24/7 sin parar</div>
              <div style="font-size:12px;color:#166534;">Mientras duermes, los leads siguen llegando.</div>
            </div>
          </div>
        </div>
      `)}

      ${cardOrange(`
        <div style="font-size:13px;font-weight:800;color:#9a3412;margin-bottom:6px;">⏱ DATO CONCRETO</div>
        <p style="font-size:14px;color:#0f1c2e;margin:0;line-height:1.5;">
          Configurar tu Bot toma <strong>5 minutos</strong>. La IA te guía paso a paso. No necesitas saber programar nada.
        </p>
      `)}

      ${cta(`${BASE_URL}/dashboard/bot/nuevo`, '🤖 Crear mi Bot IA en 5 min →')}
    `),
  }
}

// ═════════════════════════════════════════════════════════════════════════
// EMAIL 4: VIRALIZAR LANDING (Día 7)
// ═════════════════════════════════════════════════════════════════════════

export function templateViralizar(v: DatosVendedor): { asunto: string; html: string } {
  const landingUrl = `${BASE_URL}/u/${v.slug}`
  const wppShare = `https://wa.me/?text=${encodeURIComponent(`Mira mi catálogo: ${landingUrl}`)}`

  return {
    asunto: `${v.primerNombre}, 5 formas de viralizar tu landing (1 cuesta $0)`,
    html: wrap(`
      ${header(
        `Tu landing es tu nuevo CV`,
        `${v.primerNombre}, te enseño cómo asesores como tú generan <strong style="color:#FF6B2B;">10-30 leads al mes</strong> con su landing.`,
        '📲'
      )}

      ${card(`
        <h2 style="font-size:17px;font-weight:800;color:#111827;margin:0 0 1rem;">Las 5 formas de viralizar:</h2>

        <div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #f3f4f6;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="background:#FF6B2B;color:#fff;font-size:12px;font-weight:800;padding:2px 8px;border-radius:6px;">1</span>
            <span style="font-size:15px;font-weight:800;color:#0f1c2e;">Estado de WhatsApp</span>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0 0 8px;line-height:1.5;">
            Sube cada 2-3 días un producto distinto con el link a tu landing. Tus contactos lo verán pasivamente.
          </p>
        </div>

        <div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #f3f4f6;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="background:#FF6B2B;color:#fff;font-size:12px;font-weight:800;padding:2px 8px;border-radius:6px;">2</span>
            <span style="font-size:15px;font-weight:800;color:#0f1c2e;">Bio de Instagram / Facebook</span>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0 0 8px;line-height:1.5;">
            Pon tu landing en el "link in bio". Cada post lleva tráfico calificado a tu sistema.
          </p>
        </div>

        <div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #f3f4f6;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="background:#FF6B2B;color:#fff;font-size:12px;font-weight:800;padding:2px 8px;border-radius:6px;">3</span>
            <span style="font-size:15px;font-weight:800;color:#0f1c2e;">Firma de email</span>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0 0 8px;line-height:1.5;">
            Cada email que envías es una oportunidad. Pon tu landing en tu firma automática.
          </p>
        </div>

        <div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #f3f4f6;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="background:#FF6B2B;color:#fff;font-size:12px;font-weight:800;padding:2px 8px;border-radius:6px;">4</span>
            <span style="font-size:15px;font-weight:800;color:#0f1c2e;">Pauta digital con presupuesto bajo</span>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0 0 8px;line-height:1.5;">
            Con $30-50.000/día en Meta Ads dirigiendo a tu landing, puedes generar 5-15 leads diarios calificados.
          </p>
        </div>

        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="background:#FF6B2B;color:#fff;font-size:12px;font-weight:800;padding:2px 8px;border-radius:6px;">5</span>
            <span style="font-size:15px;font-weight:800;color:#0f1c2e;">Red de referidos</span>
          </div>
          <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">
            Comparte el link con 10 conocidos por WhatsApp con un mensaje personal. Pídeles que lo compartan si conocen alguien interesado.
          </p>
        </div>
      `)}

      ${cardOrange(`
        <div style="font-size:13px;font-weight:800;color:#9a3412;margin-bottom:6px;">⚡ ACCIÓN AHORA (30 segundos)</div>
        <p style="font-size:14px;color:#0f1c2e;margin:0 0 12px;line-height:1.5;">
          Comparte tu landing por WhatsApp con 5 conocidos. La forma más fácil de empezar.
        </p>
        <a href="${wppShare}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;">
          📲 Compartir por WhatsApp
        </a>
      `)}

      ${cta(`${BASE_URL}/dashboard`, '📊 Ver mi dashboard →')}
    `),
  }
}

// ═════════════════════════════════════════════════════════════════════════
// EMAIL 5: PRE-VENCIMIENTO (Día 12, 2 días antes de fin de trial)
// ═════════════════════════════════════════════════════════════════════════

export function templatePreVencimiento(v: DatosVendedor, diasRestantes: number): { asunto: string; html: string } {
  return {
    asunto: `${v.primerNombre}, ${diasRestantes} días para que termine tu trial ⏰`,
    html: wrap(`
      ${header(
        `Tu trial termina en ${diasRestantes} días`,
        `${v.primerNombre}, no pierdas el sistema que ya tienes funcionando. <strong style="color:#FF6B2B;">Activa tu plan hoy.</strong>`,
        '⏰'
      )}

      ${card(`
        <h2 style="font-size:17px;font-weight:800;color:#111827;margin:0 0 1rem;">Lo que pierdes si no activas:</h2>
        <div style="display:flex;flex-direction:column;gap:.75rem;">
          <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fef2f2;border-radius:10px;border:1px solid #fca5a5;">
            <span style="font-size:18px;">❌</span>
            <span style="font-size:13px;color:#991b1b;flex:1;">Tu landing pública deja de recibir leads</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fef2f2;border-radius:10px;border:1px solid #fca5a5;">
            <span style="font-size:18px;">❌</span>
            <span style="font-size:13px;color:#991b1b;flex:1;">Tu Bot IA se desactiva</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fef2f2;border-radius:10px;border:1px solid #fca5a5;">
            <span style="font-size:18px;">❌</span>
            <span style="font-size:13px;color:#991b1b;flex:1;">No podrás crear nuevos productos</span>
          </div>
        </div>
      `)}

      ${cardOrange(`
        <div style="font-size:13px;font-weight:800;color:#9a3412;margin-bottom:8px;">🎯 PLANES DISPONIBLES</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="background:#fff;padding:12px 14px;border-radius:10px;border:1px solid #fdba74;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:14px;font-weight:800;color:#0f1c2e;">🚀 Starter</div>
                <div style="font-size:11px;color:#6b7280;">Para asesores que están empezando</div>
              </div>
              <div style="font-size:18px;font-weight:800;color:#FF6B2B;">$49.000<span style="font-size:11px;color:#9ca3af;">/mes</span></div>
            </div>
          </div>
          <div style="background:#fff;padding:12px 14px;border-radius:10px;border:2px solid #FF6B2B;position:relative;">
            <div style="position:absolute;top:-8px;right:10px;background:#FF6B2B;color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;">RECOMENDADO</div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:14px;font-weight:800;color:#0f1c2e;">⭐ Pro</div>
                <div style="font-size:11px;color:#6b7280;">Para escalar con productos ilimitados</div>
              </div>
              <div style="font-size:18px;font-weight:800;color:#FF6B2B;">$99.000<span style="font-size:11px;color:#9ca3af;">/mes</span></div>
            </div>
          </div>
        </div>
      `)}

      ${cta(`${BASE_URL}/dashboard/planes`, '💎 Activar mi plan ahora →')}

      <p style="text-align:center;font-size:12px;color:#9ca3af;margin:0 0 1rem;">
        Pago fácil con QR Nequi · Activación inmediata
      </p>
    `),
  }
}

// ═════════════════════════════════════════════════════════════════════════
// EMAIL 6: TRIAL VENCIDO (Día 14)
// ═════════════════════════════════════════════════════════════════════════

export function templateTrialVencido(v: DatosVendedor): { asunto: string; html: string } {
  return {
    asunto: `${v.primerNombre}, tu trial expiró – 1 día para reactivar`,
    html: wrap(`
      ${header(
        `Tu trial expiró`,
        `${v.primerNombre}, tu sistema ya no está recibiendo leads. <strong style="color:#FF6B2B;">Reactívalo ahora.</strong>`,
        '⏸️'
      )}

      ${card(`
        <p style="font-size:14px;color:#374151;margin:0 0 1rem;line-height:1.6;">
          Tu landing y tu Bot IA están en pausa. Esto significa que:
        </p>
        <ul style="margin:0;padding-left:1.25rem;color:#374151;font-size:13px;line-height:1.8;">
          <li>Las personas que visitan tu landing ven un mensaje de "no disponible"</li>
          <li>Tu Bot IA no responde mensajes de WhatsApp</li>
          <li>Tu pipeline está congelado, no recibirás nuevos prospectos</li>
        </ul>
      `)}

      ${cardOrange(`
        <div style="font-size:13px;font-weight:800;color:#9a3412;margin-bottom:8px;">⚡ RECUPERA TODO EN 1 MINUTO</div>
        <p style="font-size:14px;color:#0f1c2e;margin:0;line-height:1.5;">
          Tu configuración (productos, bot, landing) sigue intacta. Solo activa tu plan y todo vuelve a funcionar al instante.
        </p>
      `)}

      ${cta(`${BASE_URL}/dashboard/planes`, '🚀 Reactivar mi plan →')}
    `),
  }
}
