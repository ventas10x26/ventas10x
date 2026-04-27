// Ruta destino: src/app/admin/pagos/page.tsx
// Lista de pagos pendientes para revisar

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { AdminPagosClient } from '@/components/admin/AdminPagosClient'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminPagosPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/dashboard')

  // Cargar todos los pagos con datos del vendedor (vía service role)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pagos } = await (supabaseService.from('pagos') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Cargar info de los vendedores (en batch)
  const vendedorIds = Array.from(new Set((pagos || []).map((p: { vendedor_id: string }) => p.vendedor_id)))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabaseService.from('profiles') as any)
    .select('id, nombre, apellido, empresa, slug')
    .in('id', vendedorIds.length > 0 ? vendedorIds : ['00000000-0000-0000-0000-000000000000'])

  // Map de profiles para acceso rápido
  type ProfileLite = { id: string; nombre: string | null; apellido: string | null; empresa: string | null; slug: string | null }
  const profilesMap = new Map<string, ProfileLite>()
  ;(profiles || []).forEach((p: ProfileLite) => profilesMap.set(p.id, p))

  // Generar URLs firmadas para los comprobantes (válidas 1 hora)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pagosConProfile = await Promise.all((pagos || []).map(async (pago: any) => {
    let comprobanteUrl: string | null = pago.comprobante_url

    if (pago.comprobante_storage_path) {
      const { data: signed } = await supabaseService.storage
        .from('comprobantes-pago')
        .createSignedUrl(pago.comprobante_storage_path, 60 * 60)
      if (signed?.signedUrl) comprobanteUrl = signed.signedUrl
    }

    const profile = profilesMap.get(pago.vendedor_id) || null

    return {
      ...pago,
      vendedor_nombre: profile
        ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Sin nombre'
        : 'Vendedor desconocido',
      vendedor_empresa: profile?.empresa || null,
      vendedor_slug: profile?.slug || null,
      comprobante_url_firmada: comprobanteUrl,
    }
  }))

  return (
    <AdminPagosClient
      pagos={pagosConProfile}
      adminEmail={admin.email}
    />
  )
}
