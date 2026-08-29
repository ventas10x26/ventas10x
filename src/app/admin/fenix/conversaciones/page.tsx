// Ruta destino: src/app/admin/fenix/conversaciones/page.tsx
// Bandeja de conversaciones de Fénix (leads y deudores). Ver el comentario
// en FenixConversacionesClient.tsx para el porqué de que sea de solo
// lectura por ahora.
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { obtenerConversacionesFenix } from '@/lib/fenix-conversaciones-list'
import { FenixConversacionesClient } from '@/components/admin/FenixConversacionesClient'

export const dynamic = 'force-dynamic'

export default async function AdminFenixConversacionesPage() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    // Mismo criterio que /admin/fenix/page.tsx: /dashboard no existe bajo
    // el dominio de Fénix (el middleware lo reescribiría a algo inexistente).
    const host = (await headers()).get('host') || ''
    const esFenix = host.includes('app.consultoresfenix.com') || host.includes('fenix.localhost')
    redirect(esFenix ? '/auth/login' : '/dashboard')
  }

  const conversaciones = await obtenerConversacionesFenix()

  return <FenixConversacionesClient initialConversaciones={conversaciones} />
}
