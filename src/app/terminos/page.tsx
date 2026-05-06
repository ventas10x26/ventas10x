// Ruta destino: src/app/terminos/page.tsx
import Link from 'next/link'

export const metadata = {
  title: 'Términos y Condiciones · Ventas10x',
  description: 'Términos y condiciones de uso de la plataforma Ventas10x',
}

const SECTIONS = [
  {
    titulo: '1. Aceptación de los términos',
    contenido: `Al registrarse y usar Ventas10x, usted acepta estos términos en su totalidad. Si no está de acuerdo con alguna parte, no debe usar la plataforma. Estos términos aplican a todos los usuarios, incluyendo vendedores, asesores y visitantes de las landing pages.`,
  },
  {
    titulo: '2. Descripción del servicio',
    contenido: `Ventas10x es una plataforma SaaS que permite a vendedores y asesores comerciales crear su página de ventas personalizada, gestionar un catálogo de productos, recibir leads a través de un bot con inteligencia artificial, y gestionar su pipeline de ventas. El servicio se presta bajo modalidad de suscripción con diferentes planes.`,
  },
  {
    titulo: '3. Registro y cuenta',
    contenido: `Para usar Ventas10x debe crear una cuenta con información veraz y actualizada. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas desde su cuenta. Notifíquenos inmediatamente si detecta uso no autorizado a hola@ventas10x.co. Nos reservamos el derecho de suspender cuentas que violen estos términos.`,
  },
  {
    titulo: '4. Planes y pagos',
    contenido: `Ventas10x ofrece un período de prueba gratuito de 14 días. Pasado este período, debe contratar uno de nuestros planes de pago para continuar usando el servicio. Los precios están publicados en ventas10x.co/dashboard/planes y pueden cambiar con previo aviso de 30 días. Los pagos son en pesos colombianos (COP) o dólares (USD) según el método elegido. No hay reembolsos por períodos parciales.`,
  },
  {
    titulo: '5. Uso aceptable',
    contenido: `Usted se compromete a usar Ventas10x únicamente para actividades comerciales legítimas. Está prohibido: publicar contenido falso, engañoso o fraudulento; usar la plataforma para spam o comunicaciones no solicitadas masivas; intentar vulnerar la seguridad de la plataforma; revender o sublicenciar el servicio sin autorización; publicar contenido que infrinja derechos de terceros.`,
  },
  {
    titulo: '6. Contenido del usuario',
    contenido: `Usted conserva los derechos sobre el contenido que publica en Ventas10x (productos, imágenes, descripciones). Al publicarlo, nos otorga una licencia no exclusiva para mostrar ese contenido en la plataforma y en la red social de Ventas10x. Es responsable de que su contenido no infrinja derechos de terceros ni leyes aplicables.`,
  },
  {
    titulo: '7. Privacidad y datos de leads',
    contenido: `El tratamiento de datos personales se rige por nuestra Política de Privacidad disponible en ventas10x.co/privacidad. Los datos de sus leads son suyos — usted es el responsable de tratarlos conforme a la Ley 1581 de 2012 y normativas aplicables. Ventas10x actúa como encargado del tratamiento.`,
  },
  {
    titulo: '8. Disponibilidad del servicio',
    contenido: `Nos esforzamos por mantener Ventas10x disponible 24/7, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos programados con previo aviso. No somos responsables por pérdidas derivadas de interrupciones del servicio fuera de nuestro control.`,
  },
  {
    titulo: '9. Limitación de responsabilidad',
    contenido: `Ventas10x se provee "tal como está". No garantizamos que el servicio generará ventas o leads específicos. Nuestra responsabilidad total ante usted no superará el valor pagado en los últimos 3 meses de suscripción. No somos responsables por daños indirectos, lucro cesante o pérdida de datos.`,
  },
  {
    titulo: '10. Cancelación',
    contenido: `Puede cancelar su suscripción en cualquier momento desde su panel en /dashboard/mi-suscripcion. La cancelación será efectiva al final del período facturado. Nos reservamos el derecho de cancelar cuentas que violen estos términos, con o sin previo aviso según la gravedad.`,
  },
  {
    titulo: '11. Modificaciones',
    contenido: `Podemos modificar estos términos con previo aviso de 15 días por email. El uso continuado del servicio después de los cambios implica aceptación. Si no está de acuerdo, puede cancelar su cuenta antes de que los cambios entren en vigor.`,
  },
  {
    titulo: '12. Ley aplicable',
    contenido: `Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se resolverá en los tribunales competentes de la ciudad de Cali, Colombia, salvo acuerdo en contrario.`,
  },
]

export default function TerminosPage() {
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

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B2B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Legal</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Términos y Condiciones
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7 }}>
            Última actualización: Mayo 2026 · Ventas10x · ventas10x.co
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginTop: '16px' }}>
            Estos términos regulan el uso de Ventas10x, la plataforma de ventas para asesores y vendedores en Latinoamérica. Léalos con atención antes de usar el servicio.
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

        <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(255,107,43,.08)', border: '1px solid rgba(255,107,43,.2)', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', marginBottom: '8px' }}>¿Preguntas sobre estos términos?</div>
          <a href="mailto:hola@ventas10x.co" style={{ fontSize: '16px', fontWeight: 700, color: '#FF6B2B', textDecoration: 'none' }}>hola@ventas10x.co</a>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/privacidad" style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>Política de privacidad</Link>
          <Link href="/" style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>Inicio</Link>
          <Link href="/explore" style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>Explorar</Link>
        </div>
      </div>
    </div>
  )
}
