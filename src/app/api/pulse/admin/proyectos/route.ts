// Ruta destino: src/app/api/pulse/admin/proyectos/route.ts
//
// Lectura de TODOS los proyectos de DataBridge (de todos los usuarios) para la vista de
// administración -- mismo patrón que /api/pulse/admin/leads: pulse_databridge_proyectos
// tiene RLS activo filtrado por user_id (cada quien lee solo lo suyo), así que la vista
// de admin no puede consultar Supabase directo desde el cliente. Este endpoint valida el
// token de sesión y el correo contra PULSE_ADMIN_EMAILS antes de devolver nada, y usa el
// service role para saltar el filtro de user_id.
//
// pulse_databridge_proyectos no guarda el email del dueño -- se resuelve acá con
// auth.admin.listUsers() y se cruza por user_id, en vez de sumar una columna nueva solo
// para esta vista de solo lectura.
//
// "filas" (suma de filas de todas las tablas del proyecto) es la señal de seguimiento más
// útil: distingue quién subió una operación real de quién solo probó con pocas filas.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ADMINS = (process.env.PULSE_ADMIN_EMAILS || 'ricaza81@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

interface TablaGuardada { name: string; rows: unknown[] }

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) {
      return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })
    }

    const { data: { user }, error } = await admin.auth.getUser(token)
    if (error || !user?.email) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    if (!ADMINS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const { data: proyectos, error: errQuery } = await admin
      .from('pulse_databridge_proyectos')
      .select('id, user_id, nombre, tablas, relaciones, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (errQuery) throw new Error(errQuery.message)

    // listUsers pagina de a 50 por defecto -- perPage alto de una sola pasada alcanza
    // sobra para el volumen actual de cuentas; si esto crece mucho, acá es donde paginar.
    const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const emailPorId = new Map((usersData?.users || []).map(u => [u.id, u.email || 'sin email']))

    const resultado = (proyectos || []).map(p => {
      const tablas = (p.tablas || []) as TablaGuardada[]
      const filas = tablas.reduce((acc, t) => acc + (Array.isArray(t.rows) ? t.rows.length : 0), 0)
      return {
        id: p.id as string,
        nombre: p.nombre as string,
        userEmail: emailPorId.get(p.user_id as string) || 'usuario eliminado',
        tablas: tablas.length,
        relaciones: Array.isArray(p.relaciones) ? p.relaciones.length : 0,
        filas,
        createdAt: p.created_at as string,
        updatedAt: (p.updated_at as string) || (p.created_at as string),
      }
    })

    return NextResponse.json({ proyectos: resultado })
  } catch (e) {
    console.error('[api/pulse/admin/proyectos]', e)
    return NextResponse.json({ error: 'No pudimos leer los proyectos' }, { status: 500 })
  }
}
