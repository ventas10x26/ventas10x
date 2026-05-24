import { createClient as createAdmin, type SupabaseClient } from '@supabase/supabase-js'
import {
  PULSE_VOZ_BUCKET,
  normalizarVozHistorial,
  type PulseAgentMetadata,
  type PulseVozMuestraPublica,
} from '@/lib/pulse-agent'

export async function historialConUrlsFirmadas(
  supabaseAdmin: SupabaseClient,
  meta: PulseAgentMetadata
): Promise<PulseVozMuestraPublica[]> {
  const lista = normalizarVozHistorial(meta.voz_historial)

  const conUrls = await Promise.all(
    lista.map(async (m) => {
      if (!m.storage_path || m.solo_transcripcion) {
        return { ...m, audio_url: null }
      }
      const { data, error } = await supabaseAdmin.storage
        .from(PULSE_VOZ_BUCKET)
        .createSignedUrl(m.storage_path, 3600)
      if (error) {
        console.warn('[pulse-voz-storage] signed url:', m.storage_path, error.message)
        return { ...m, audio_url: null }
      }
      return { ...m, audio_url: data.signedUrl }
    })
  )

  return conUrls
}
