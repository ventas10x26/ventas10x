// Ruta destino: src/app/admin/pulse/databridge/page.tsx
//
// Índice de TODOS los proyectos de DataBridge, de todos los usuarios -- a diferencia del
// índice "Tus proyectos" dentro de /pulse/databridge (que cada usuario ve filtrado a los
// suyos, vía user_id en la propia query), esta vista usa el service role para saltar RLS
// y mostrar la operación completa. Gate de admin igual que /admin/fenix (getCurrentAdmin).
//
// pulse_databridge_proyectos no guarda el email del dueño directamente -- se resuelve acá
// con auth.admin.listUsers() y se cruza por user_id, en vez de sumar una columna nueva
// solo para este panel de solo lectura.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { AdminDatabridgeClient } from '@/components/admin/AdminDatabridgeClient'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminPulseDatabridgePage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/dashboard')

  const { data: proyectos } = await supabaseService
    .from('pulse_databridge_proyectos')
    .select('id, user_id, nombre, tablas, relaciones, created_at')
    .order('created_at', { ascending: false })

  // listUsers pagina de a 50 por defecto -- perPage alto de una sola pasada alcanza
  // sobra para el volumen actual de cuentas; si esto crece mucho, acá es donde paginar.
  const { data: usersData } = await supabaseService.auth.admin.listUsers({ perPage: 1000 })
  const emailPorId = new Map((usersData?.users || []).map(u => [u.id, u.email || 'sin email']))

  const proyectosConUsuario = (proyectos || []).map(p => ({
    id: p.id as string,
    nombre: p.nombre as string,
    createdAt: p.created_at as string,
    tablas: Array.isArray(p.tablas) ? p.tablas.length : 0,
    relaciones: Array.isArray(p.relaciones) ? p.relaciones.length : 0,
    userEmail: emailPorId.get(p.user_id as string) || 'usuario eliminado',
  }))

  return <AdminDatabridgeClient proyectos={proyectosConUsuario} />
}
