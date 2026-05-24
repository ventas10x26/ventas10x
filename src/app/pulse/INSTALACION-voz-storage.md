# Storage: historial de voz del asesor (Pulse Motor)

Cada grabación en **Mi agente → Voz** se guarda en:

| Dónde | Qué |
|-------|-----|
| **Supabase Storage** | Bucket `pulse-agente-voz` → `{email_slug}/{fecha}_{uuid}.webm` |
| **Supabase DB** | Tabla `pulse_waitlist` → columna `metadata` → array `voz_historial` |

## Crear el bucket (una vez)

1. Supabase Dashboard → **Storage** → **New bucket**
2. Nombre: `pulse-agente-voz`
3. **Public bucket**: puede estar en privado; la app usa URLs firmadas (1 h) para reproducir.
4. Políticas: el backend usa `SUPABASE_SERVICE_ROLE_KEY`, no hace falta policy pública para subir.

## Variables en Vercel / `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Grabaciones anteriores (solo texto)

Las muestras del onboarding previo al deploy aparecen como **“Solo transcripción”** sin ▶ Escuchar. Una nueva grabación en `/pulse/agente` guarda audio + texto.
