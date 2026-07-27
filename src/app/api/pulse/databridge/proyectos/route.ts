// src/app/api/pulse/databridge/proyectos/route.ts
//
// POST: persiste un proyecto de DataBridge (tablas + relaciones) para el usuario logueado —
// hasta acá todo el flujo vivía solo en memoria del navegador y se perdía al refrescar.
// GET:  lista los proyectos guardados del usuario (para el índice de proyectos).
// PATCH: renombra un proyecto propio.
// DELETE: borra un proyecto propio.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const MAX_FILAS_POR_TABLA = 1000
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Pulse Motor <agente@ventas10x.co>'

interface SheetInput { name: string; rows: Record<string, unknown>[] }
interface FieldMatchInput { fieldA: string; fieldB: string; label: string; score: number }
interface TableRelationInput { a: string; b: string; matches: FieldMatchInput[] }

function htmlPanelListo(primerNombre: string, nombreProyecto: string, url: string, tablas: number, relaciones: number) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Tu panel ya está listo</title></head>
<body style="margin:0;padding:0;background:#0B0D0C;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#F3EFE7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0D0C;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="padding:0 0 28px 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="display:inline-table;">
              <tr>
                <td style="background:linear-gradient(135deg,#F2A93B,#C9770B);border-radius:10px;width:38px;height:38px;text-align:center;vertical-align:middle;font-size:19px;">⚡</td>
                <td style="padding-left:10px;font-size:18px;font-weight:700;letter-spacing:-0.3px;color:#F3EFE7;">Pulse Motor</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#14120F;border:1px solid #2A2620;border-top:3px solid #F2A93B;border-radius:16px;padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#F2A93B;letter-spacing:1.2px;text-transform:uppercase;">🚀 TU PANEL YA ESTÁ DESPLEGADO</p>
            <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;line-height:1.25;color:#F3EFE7;">${primerNombre}, "${nombreProyecto}" ya está corriendo</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#9B958A;line-height:1.65;">
              Detectamos <strong style="color:#F3EFE7;">${tablas} ${tablas === 1 ? 'tabla' : 'tablas'}</strong> y <strong style="color:#F3EFE7;">${relaciones} ${relaciones === 1 ? 'relación' : 'relaciones'}</strong> en tus datos, y ya armamos el panel — real, persistido, listo para que lo revises cuando quieras.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
              <tr>
                <td style="background:linear-gradient(135deg,#F2A93B,#C9770B);border-radius:10px;padding:13px 26px;">
                  <a href="${url}" style="color:#1a1204;font-size:14px;font-weight:700;text-decoration:none;">Ver mi panel →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 0 0;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#6B6459;">Pulse Motor · Hecho en Cali, Colombia 🇨🇴</p>
            <p style="margin:0;font-size:11px;color:#4A453D;">Recibiste este email porque desplegaste un panel en pulsemotor.co</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { nombre, sheets, relations } = await req.json() as {
      nombre?: string
      sheets: SheetInput[]
      relations: TableRelationInput[]
    }

    if (!Array.isArray(sheets) || sheets.length === 0) {
      return NextResponse.json({ error: 'Se necesita al menos una hoja con datos' }, { status: 400 })
    }

    const tablas = sheets.map(s => ({ name: s.name, rows: s.rows.slice(0, MAX_FILAS_POR_TABLA) }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_databridge_proyectos') as any)
      .insert({
        user_id: user.id,
        nombre: nombre?.trim() || 'Proyecto sin título',
        tablas,
        relaciones: relations || [],
      })
      .select('id')
      .single()

    if (error) {
      console.error('[pulse/databridge/proyectos POST] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire-and-forget: si el email falla no debe tumbar el despliegue, que ya se guardó.
    if (user.email) {
      const primerNombre = ((user.user_metadata?.full_name as string) || user.email.split('@')[0]).trim().split(/\s+/)[0]
      const nombreProyecto = nombre?.trim() || 'Proyecto sin título'
      const url = `https://pulsemotor.co/pulse/databridge/panel/${data.id}`
      resend.emails.send({
        from: FROM,
        to: [user.email],
        subject: `${primerNombre}, tu panel "${nombreProyecto}" ya está listo ⚡`,
        html: htmlPanelListo(primerNombre, nombreProyecto, url, tablas.length, (relations || []).length),
      }).catch(e => console.error('[pulse/databridge/proyectos POST] email error:', e))
    }

    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    console.error('[pulse/databridge/proyectos POST]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_databridge_proyectos') as any)
      .select('id, nombre, tablas, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[pulse/databridge/proyectos GET] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proyectos = (data || []).map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      created_at: p.created_at,
      tablas: Array.isArray(p.tablas) ? p.tablas.length : 0,
    }))

    return NextResponse.json({ ok: true, proyectos })
  } catch (e) {
    console.error('[pulse/databridge/proyectos GET]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}

// PATCH: renombra un proyecto. El filtro por user_id va en el propio update, no en una
// consulta previa, para que un id ajeno no coincida con ninguna fila en vez de depender
// de un chequeo aparte que se pueda olvidar.
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id, nombre } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

    const limpio = String(nombre ?? '').trim().slice(0, 120)
    if (!limpio) return NextResponse.json({ error: 'El nombre no puede quedar vacío' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_databridge_proyectos') as any)
      .update({ nombre: limpio })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')

    if (error) {
      console.error('[pulse/databridge/proyectos PATCH] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data?.length) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    return NextResponse.json({ ok: true, nombre: limpio })
  } catch (e) {
    console.error('[pulse/databridge/proyectos PATCH]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}

// DELETE: borra un proyecto del usuario. Mismo criterio que PATCH — el user_id forma parte
// del filtro de borrado, así un id de otra cuenta simplemente no matchea.
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_databridge_proyectos') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')

    if (error) {
      console.error('[pulse/databridge/proyectos DELETE] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data?.length) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[pulse/databridge/proyectos DELETE]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
