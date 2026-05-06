// Ruta destino: src/app/privacidad/page.tsx
import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidad · Ventas10x',
  description: 'Política de privacidad y tratamiento de datos de Ventas10x',
}

const SECTIONS = [
  {
    titulo: '1. Información que recopilamos',
    contenido: `Ventas10x recopila información que usted nos proporciona directamente al registrarse, como nombre, correo electrónico y número de WhatsApp. También recopilamos información generada por el uso de la plataforma, como leads recibidos, productos publicados y visitas a su página de ventas. Cuando inicia sesión con Google, recibimos su nombre y correo electrónico de acuerdo con los permisos que usted otorga.`,
  },
  {
    titulo: '2. Cómo usamos su información',
    contenido: `Utilizamos su información para: (a) proveer y mejorar los servicios de Ventas10x; (b) personalizar su experiencia y su landing page de ventas; (c) enviarle notificaciones sobre leads y actividad en su cuenta; (d) comunicarle actualizaciones importantes del servicio; (e) cumplir con obligaciones legales aplicables en Colombia y Latinoamérica.`,
  },
  {
    titulo: '3. Compartir información con terceros',
    contenido: `No vendemos, arrendamos ni compartimos su información personal con terceros con fines comerciales. Podemos compartir información con proveedores de servicios que nos ayudan a operar la plataforma (como Supabase para base de datos, Resend para emails y Vercel para hosting), quienes están obligados a mantener la confidencialidad de su información. Los leads que lleguen a través de su landing pública serán visibles solo para usted.`,
  },
  {
    titulo: '4. Datos de sus leads y clientes',
    contenido: `Cuando un visitante deja sus datos en su landing de Ventas10x, usted es el responsable de tratar esa información de acuerdo con la ley colombiana de protección de datos (Ley 1581 de 2012) y las leyes aplicables en su país. Ventas10x actúa como encargado del tratamiento. Le recomendamos informar a sus leads sobre cómo usará sus datos.`,
  },
  {
    titulo: '5. Seguridad',
    contenido: `Implementamos medidas técnicas y organizativas para proteger su información, incluyendo cifrado en tránsito (HTTPS), autenticación segura y control de acceso por roles. Sin embargo, ningún sistema es 100% seguro. Le recomendamos usar contraseñas fuertes y no compartir sus credenciales.`,
  },
  {
    titulo: '6. Retención de datos',
    contenido: `Conservamos su información mientras su cuenta esté activa. Si cancela su cuenta, eliminaremos o anonimizaremos sus datos personales en un plazo de 30 días, salvo que la ley nos obligue a conservarlos por más tiempo.`,
  },
  {
    titulo: '7. Sus derechos',
    contenido: `De acuerdo con la Ley 1581 de 2012 (Colombia) y normativas similares en Latinoamérica, usted tiene derecho a: acceder a sus datos personales, corregirlos, suprimirlos, revocar la autorización de tratamiento y presentar quejas ante la Superintendencia de Industria y Comercio. Para ejercer estos derechos, escríbanos a hola@ventas10x.co.`,
  },
  {
    titulo: '8. Cookies',
    contenido: `Ventas10x utiliza cookies esenciales para mantener su sesión activa y cookies de análisis para entender cómo se usa la plataforma. No usamos cookies de publicidad de terceros. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del servicio.`,
  },
  {
    titulo: '9. Cambios a esta política',
    contenido: `Podemos actualizar esta política ocasionalmente. Le notificaremos por email si los cambios son significativos. La versión vigente siempre estará disponible en ventas10x.co/privacidad.`,
  },
  {
    titulo: '10. Contacto',
    contenido: `Si tiene preguntas sobre esta política o el tratamiento de sus datos, contáctenos en: hola@ventas10x.co · ventas10x.co`,
  },
]

export default function PrivacidadPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', fontFamily: "'Inter', system-ui, sans-serif", color: '#f1f5f9' }}>

      {/* Nav */}
      <nav style={{ background: 'rgba(11,17,32,.97)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(14px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>Ventas<span style={{ color: '#FF6B2B' }}>10x</span></span>
        </Link>
        <Link href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>← Volver al inicio</Link>
      </nav>

      {/* Contenido */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B2B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Legal</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Política de Privacidad
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7 }}>
            Última actualización: Mayo 2026 · Ventas10x · ventas10x.co
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginTop: '16px' }}>
            En Ventas10x nos comprometemos a proteger su privacidad. Esta política explica cómo recopilamos, usamos y protegemos su información personal cuando usa nuestra plataforma.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {SECTIONS.map(sec => (
            <div key={sec.titulo} style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: '28px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px' }}>{sec.titulo}</h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.55)', lineHeight: 1.8 }}>{sec.contenido}</p>
            </div>
          ))}
        </div>

        {/* Footer doc */}
        <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(255,107,43,.08)', border: '1px solid rgba(255,107,43,.2)', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', marginBottom: '8px' }}>¿Preguntas sobre privacidad?</div>
          <a href="mailto:hola@ventas10x.co" style={{ fontSize: '16px', fontWeight: 700, color: '#FF6B2B', textDecoration: 'none' }}>hola@ventas10x.co</a>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/terminos" style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>Términos y condiciones</Link>
          <Link href="/" style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>Inicio</Link>
          <Link href="/explore" style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>Explorar</Link>
        </div>
      </div>
    </div>
  )
}
