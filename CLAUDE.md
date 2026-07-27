# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Inicia el servidor de desarrollo (Next.js 15)
npm run build    # Build de producción
npm run lint     # ESLint
```

No hay suite de tests configurada.

## Arquitectura

**Dos productos en un mismo repo/deploy:**

| Dominio | Rutas | Descripción |
|---|---|---|
| `ventas10x.co` | `src/app/(todo excepto /pulse)` | SaaS para asesores de ventas |
| `pulsemotor.co` | `src/app/pulse/**` | CRM automotriz para concesionarios |

El middleware (`src/middleware.ts`) detecta el hostname y reescribe las rutas de `pulsemotor.co` a `/pulse/*`. Las rutas de Ventas10x pasan por `updateSession` de Supabase para auth; las de Pulse no requieren esa sesión.

## Supabase: tres clientes distintos

- **`createClient()` de `@/lib/supabase/server`** → server components y route handlers; respeta RLS con la sesión del usuario.
- **`createClient()` de `@/lib/supabase/client`** → componentes cliente.
- **`createAdmin()` de `@supabase/supabase-js` con `SUPABASE_SERVICE_ROLE_KEY`** → bypassa RLS; se usa para operaciones administrativas o cuando no hay sesión disponible (e.g., `getActiveOrg`, log de logins).

## Multi-tenant (organizaciones)

El dashboard filtra datos por `org_id`, no por `user_id`. La función `getActiveOrg()` (`src/lib/get-active-org.ts`) resuelve la org activa del usuario leyendo la cookie `org_activa_id` y validando membresía en `org_members`. La suscripción siempre se consulta por `owner_id` de la org, no por el usuario logueado.

Tablas clave: `organizaciones`, `org_members` (rol: `owner` | `admin` | `viewer`).

## Pulse Motor: tablas prefijadas

Las tablas de Pulse Motor llevan prefijo `pulse_`: `pulse_leads`, `pulse_eventos`, etc. El tipo de Supabase aún no incluye estas tablas, por eso se usan casts `as any` en las queries — patrón esperado, no es deuda técnica pendiente.

## IA (Anthropic)

El cliente singleton vive en `src/lib/anthropic.ts`. El modelo por defecto es `claude-haiku-4-5-20251001` (definido como `CLAUDE_MODEL`). Todos los route handlers de IA importan de ahí.

## Suscripciones y planes

Los planes se definen en `src/lib/suscripciones.ts` (`trial` → `starter` → `pro` → `enterprise`). El pago se hace por Nequi (comprobante manual); el admin aprueba/rechaza en `/admin/pagos`. No hay integración con pasarela de pago automática activa.

Para bloquear features por plan, usa el componente `<BloqueoFeature>` (`src/components/dashboard/BloqueoFeature.tsx`).

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_BASE_URL          # https://ventas10x.co en producción
SUPABASE_SERVICE_ROLE_KEY     # Solo server-side
ANTHROPIC_API_KEY
ADMIN_EMAILS                  # Emails separados por coma para acceso /admin
RESEND_API_KEY                # Envío de emails
PULSE_LEADS_EMAIL             # Opcional. Destino de las solicitudes de demo de Pulse Motor
                              # (separadas por coma). Si falta, cae al primero de ADMIN_EMAILS.
```

## Patrones de rutas API

- Auth en route handlers: `supabase.auth.getUser()` → si no hay usuario, responder `401`.
- Ownership en queries: siempre filtrar por `vendedor_id` o `org_id` con el id del usuario/org activa antes de operar.
- Params en Next.js 15: `params` es una `Promise`, se desestructura con `await params`.

## Imágenes OG dinámicas

Generadas en `src/app/og/[slug]/route.tsx` (por vendedor) y `src/app/og/home/route.tsx` (landing principal). Usan `ImageResponse` de Next.js.

## Landing pública por vendedor

`/u/[slug]` renderiza la landing del vendedor con datos de `landing_config`, `productos` y `landing_secciones`. El slug pertenece al `profiles` del owner de la org.

## Bugs pendientes conocidos

1. **Bot no asigna `org_id` al crear leads** — fix parcial en `leads/page.tsx` usando `.or()` para consultar por `vendedor_id` o `org_id`; pendiente corregir en origen.
2. **`/icon.png` devuelve 404** — el favicon declarado en el layout no existe en `public/`.
3. **`getActiveOrg()` falla para usuarios invitados** — si el miembro aún no tiene fila en `org_members` confirmada, la función devuelve `null` y redirige a onboarding.
4. **Autogeneración IA consume créditos sin persistir** — el endpoint `PATCH` de configuración de autogeneración llama a la API de Anthropic pero no guarda el resultado si falla la escritura posterior.
5. **Logs de debug en `register/page.tsx`** — `console.log` de datos de registro pendientes de remover antes de producción.
6. **WhatsApp bot (Baileys + Railway) no iniciado** — la infraestructura del bot de WhatsApp con Baileys está planificada pero no desplegada; las notificaciones de WhatsApp actuales van por API de tercero.
7. **Dashboard Analytics no iniciado** — las vistas de leads y conversiones en `/dashboard/metricas` tienen UI placeholder; la lógica de agregación no está implementada.
