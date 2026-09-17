// Ruta destino: src/app/admin/fenix/deudores/page.tsx
// Ver comentario en FenixDeudoresClient.tsx para el detalle de las dos
// formas de importar. telefono y conversacion_id llegan por query string
// cuando se abre desde el botón "Crear como deudor" de
// /admin/fenix/conversaciones.
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { obtenerClientesDeuda } from '@/lib/fenix-deudores'
import { FenixDeudoresClient } from '@/components/admin/FenixDeudoresClient'

export const dynamic = 'force-dynamic'

export default async function AdminFenixDeudoresPage({
  searchParams,
}: {
  searchParams: Promise<{ telefono?: string; conversacion_id?: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    const host = (await headers()).get('host') || ''
    const esFenix = host.includes('app.consultoresfenix.com') || host.includes('fenix.localhost')
    redirect(esFenix ? '/auth/login' : '/dashboard')
  }

  const [registros, sp] = await Promise.all([obtenerClientesDeuda(), searchParams])

  return (
    <FenixDeudoresClient
      initialRegistros={registros}
      prefillTelefono={sp.telefono}
      conversacionId={sp.conversacion_id}
    />
  )
}
