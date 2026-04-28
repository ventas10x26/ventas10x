# 📧 Sistema de Email Push Educativo — Ventas10x

Sistema completo de **6 emails educativos** que acompañan al vendedor durante su trial (14 días) y lo guían hacia la conversión a plan pagado.

---

## 🎯 Secuencia de emails

| # | Día | Email | Trigger | CTA |
|---|-----|-------|---------|-----|
| 1 | 0 | 🚀 Welcome + tu landing | Inmediato al registro | Ir al dashboard |
| 2 | +1 | 🎨 Personaliza tu landing | Cron, si NO editó landing | Editar landing |
| 3 | +3 | 🤖 Activa tu Bot IA | Cron, si NO creó bot | Crear bot |
| 4 | +7 | 📲 5 formas de viralizar | Cron, a TODOS | Compartir landing |
| 5 | +12 | ⏰ 2 días para fin de trial | Cron, si trial activo | Activar plan |
| 6 | +14/15 | ⏸️ Trial vencido | Cron, si trial expiró | Reactivar |

**Tono:** Coach de ventas — directo, orientado a resultados, con datos específicos.

---

## 📦 Archivos a copiar

| # | Archivo | Destino | Acción |
|---|---------|---------|--------|
| 1 | `01-MIGRACION-EMAILS.sql` | Supabase SQL Editor | EJECUTAR |
| 2 | `lib-email-helpers.ts` | `src/lib/email-helpers.ts` | NUEVO |
| 3 | `lib-email-templates.ts` | `src/lib/email-templates.ts` | NUEVO |
| 4 | `api-welcome-email.ts` | `src/app/api/welcome-email/route.ts` | REEMPLAZA |
| 5 | `api-cron-onboarding.ts` | `src/app/api/cron/onboarding-reminder/route.ts` | REEMPLAZA |
| 6 | `api-admin-enviar-manual.ts` | `src/app/api/admin/emails/enviar-manual/route.ts` | NUEVO |
| 7 | `PATCH-register-page.md` | (instrucciones manuales) | LEE |

---

## 🚀 Pasos de instalación

### 1. Crear tabla `emails_enviados` en Supabase

Ejecuta `01-MIGRACION-EMAILS.sql` en SQL Editor.

Al final debe mostrar:
```
estado          | total_emails
"Tabla creada"  | 0
```

### 2. Crear los 2 helpers nuevos

Crea los archivos:
- `src/lib/email-helpers.ts` ← contenido de `lib-email-helpers.ts`
- `src/lib/email-templates.ts` ← contenido de `lib-email-templates.ts`

### 3. Reemplazar 2 endpoints existentes

- `src/app/api/welcome-email/route.ts` ← reemplazar con `api-welcome-email.ts`
- `src/app/api/cron/onboarding-reminder/route.ts` ← reemplazar con `api-cron-onboarding.ts`

### 4. Crear endpoint admin para reenvío manual

```bash
mkdir -p src/app/api/admin/emails/enviar-manual
```

Copiar `api-admin-enviar-manual.ts` a `src/app/api/admin/emails/enviar-manual/route.ts`

### 5. Actualizar register page (opcional pero recomendado)

Lee `PATCH-register-page.md` y haz el cambio mínimo. Si no lo haces, el sistema funciona igual (solo será un poco más lento al buscar el userId).

### 6. Build + deploy

```bash
npm run build

git add .
git commit -m "feat: sistema de email push educativo (6 emails) con tracking"
git push origin main
```

---

## 🧪 Cómo probar

### Test 1: Welcome email manual

```bash
# Después del deploy, prueba enviar welcome
curl -X POST https://ventas10x.co/api/welcome-email \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ricardo","email":"ricaza81@gmail.com"}'
```

Verifica que:
- ✅ Llega el email
- ✅ Se registra en `emails_enviados`
- ✅ Si lo llamas 2 veces, la segunda dice "ya enviado"

### Test 2: Cron diario

El cron corre automáticamente todos los días a las 10am UTC (5am Colombia).

Para forzarlo manualmente desde Vercel:
1. Ve a Vercel → tu proyecto → **Cron Jobs**
2. Click en `/api/cron/onboarding-reminder` → **Run now**
3. Mira los logs

O desde terminal:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" \
  https://ventas10x.co/api/cron/onboarding-reminder
```

(donde `TU_CRON_SECRET` es la variable de entorno de Vercel)

### Test 3: Reenvío manual desde admin

```bash
curl -X POST https://ventas10x.co/api/admin/emails/enviar-manual \
  -H "Content-Type: application/json" \
  -H "Cookie: tu_session_cookie" \
  -d '{
    "vendedor_id": "ID-del-vendedor",
    "tipo": "personalizar_landing",
    "forzar": true
  }'
```

Esto te permite reenviar cualquier email a cualquier vendedor (forzando incluso si ya lo recibió).

---

## 📊 Verificar tracking

Después de un par de días, en Supabase SQL Editor:

```sql
-- Ver todos los emails enviados
SELECT 
  ee.tipo,
  ee.asunto,
  ee.email,
  p.slug,
  ee.enviado_at
FROM emails_enviados ee
LEFT JOIN profiles p ON p.id = ee.vendedor_id
ORDER BY ee.enviado_at DESC
LIMIT 50;

-- Estadísticas por tipo
SELECT 
  tipo,
  COUNT(*) as total
FROM emails_enviados
GROUP BY tipo
ORDER BY total DESC;

-- Vendedores que NO recibieron welcome
SELECT p.slug, p.nombre, p.created_at
FROM profiles p
LEFT JOIN emails_enviados ee 
  ON ee.vendedor_id = p.id AND ee.tipo = 'welcome'
WHERE ee.id IS NULL;
```

---

## ⚠️ Notas importantes

### Sobre el tracking

- Los emails de tipo **único** (welcome, personalizar_landing, crear_bot, viralizar, pre_vencimiento, trial_vencido) **solo se envían 1 vez por vendedor**
- Si el cron corre 2 días seguidos, la segunda vez detecta que ya se envió y lo omite
- Para reenviar manualmente, usa el endpoint admin con `forzar: true`

### Sobre el cron

- Corre **1 vez al día** (10am UTC = 5am Colombia)
- Evalúa **TODOS los profiles** y decide qué email enviar a cada uno
- Si un vendedor cumple criterios para 2 emails el mismo día (raro), envía ambos

### Sobre los días

- "Día 1" = 24-48 horas después del registro
- "Día 3" = entre 72-96 horas después
- etc.

Si el vendedor se registra en domingo, el email del día 1 le llega lunes a las 5am.

---

## 🎁 Lo que viene en Fase 2 (Entrega 2)

Cuando confirmes que esto funciona, te entrego:

1. **Panel admin de emails** (`/admin/emails`) — UI para ver historial + reenviar
2. **Métricas:** open rate, click rate (con webhook de Resend)
3. **A/B testing** de subject lines
4. **Email para clientes que NO usan el sistema en X días** (re-engagement)

---

## 💡 Ideas a futuro

- Permitir al vendedor **deshabilitar emails** desde su perfil
- Email semanal con métricas (`Esta semana recibiste X leads, ganaste Y`)
- Email mensual con progress report
- Webhook de Resend para tracking de opens/clicks

---

## 🛡 Seguridad

- ✅ Endpoint cron protegido por `CRON_SECRET`
- ✅ Endpoint admin verifica `getCurrentAdmin()` antes de cualquier acción
- ✅ Tabla `emails_enviados` con RLS (vendedor solo ve los suyos)
- ✅ Service role key NUNCA expuesta al cliente
