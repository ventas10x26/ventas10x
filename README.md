# Ventas10x — Next.js

Plataforma SaaS de automatización de ventas para Latam.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Base de datos:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Estilos:** Tailwind CSS
- **Tipografía:** Syne (display) + DM Sans (body)
- **Deploy:** Vercel

## Estructura del proyecto

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          → Página de login
│   │   ├── register/       → Página de registro
│   │   ├── callback/       → Callback OAuth Google
│   │   └── signout/        → Route handler logout
│   ├── dashboard/
│   │   ├── page.tsx        → Resumen / Home
│   │   ├── leads/          → Tabla de leads
│   │   ├── pipeline/       → Kanban de etapas
│   │   ├── catalogo/       → Uploader catálogo IA
│   │   ├── landing-editor/ → Editor de landing
│   │   └── perfil/         → Perfil del vendedor
│   ├── u/[slug]/           → Landing dinámica por vendedor
│   ├── admin/              → Panel de administración
│   └── precios/            → Página de planes y pagos
├── components/
│   ├── ui/                 → Logo, PlanBadge, botones
│   ├── dashboard/          → DashboardLayout, DashboardHome, PipelineKanban
│   └── landing/            → LandingPage del vendedor
├── lib/
│   └── supabase/           → client.ts, server.ts, middleware.ts
├── types/
│   └── database.ts         → Tipos TypeScript de Supabase
└── middleware.ts            → Protección de rutas
```

## Variables de entorno

Crea `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_BASE_URL=https://ventas10x.co
ADMIN_EMAILS=tu@email.com
```

## Instalación y desarrollo

```bash
npm install
npm run dev
```

## Deploy en Vercel

1. Conecta el repo en vercel.com
2. Agrega las variables de entorno
3. Apunta el dominio ventas10x.co a Vercel

## URLs importantes

| Ruta | Descripción |
|---|---|
| `/` | Landing de Ventas10x (marketing) |
| `/auth/login` | Login |
| `/auth/register` | Registro |
| `/dashboard` | Dashboard del vendedor |
| `/dashboard/pipeline` | Kanban de leads |
| `/dashboard/catalogo` | Uploader catálogo IA |
| `/u/[slug]` | Landing dinámica por vendedor |
| `/admin` | Panel de administración |
| `/precios` | Planes y pagos Wompi |

## Edge Functions de Supabase (se mantienen igual)

- `analizar-catalogo` → Extrae productos del PDF/imagen con Claude
- `notificar-lead` → SMS al lead + WA al vendedor via Twilio
- `wompi-webhook` → Activa suscripciones al recibir pago
