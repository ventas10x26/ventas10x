// Ruta destino: src/app/api/pulse/admin/leads/route.ts
//
// Lectura de leads para la vista de administración.
//
// POR QUÉ ESTE ENDPOINT EXISTE. La tabla pulse_contactos tiene RLS activo y cero
// políticas: nadie puede leerla desde el navegador, ni siquiera con sesión
// iniciada. Es la configuración correcta —son datos de terceros— pero implica
// que la vista de admin no puede consultar Supabase directo desde el cliente.
// Este endpoint es el único camino, y hace dos cosas antes de devolver nada:
// verifica que el token de sesión sea válido y que el correo esté en la lista de
// administradores.
//
// La lista sale de PULSE_ADMIN_EMAILS (separados por coma). Si la variable no
// está definida, cae al correo del fundador: preferible un valor por defecto
// restrictivo a que un descuido de configuración deje la bandeja abierta.

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

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) {
      return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })
    }

    // Se valida el token contra Supabase en vez de confiar en el cliente: el
    // navegador puede mandar cualquier cosa en la cabecera.
    const { data: { user }, error } = await admin.auth.getUser(token)
    if (error || !user?.email) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    if (!ADMINS.includes(user.email.toLowerCase())) {
      // 404 y no 403: a alguien que no es administrador no le confirmamos
      // siquiera que esta bandeja existe.
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const { data, error: errQuery } = await admin
      .from('pulse_contactos')
      .select('id, nombre, email, telefono, fuente, estado, notas, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (errQuery) throw new Error(errQuery.message)

    return NextResponse.json({ leads: data ?? [] })
  } catch (e) {
    console.error('[api/pulse/admin/leads]', e)
    return NextResponse.json({ error: 'No pudimos leer los contactos' }, { status: 500 })
  }
}
