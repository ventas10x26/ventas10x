import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Singleton: cada llamada a createBrowserClient() crea su propio GoTrueClient, y con ~20
// componentes llamando createClient() de forma independiente (PulseAppShell, CreditosPill,
// PaywallModal, cada página, etc.) todos competían por el mismo lock de sesión en
// localStorage — "Lock ... was not released" / "AbortError: Lock broken by another request
// with the 'steal' option" en la consola. Reutilizar una sola instancia lo elimina.
let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
