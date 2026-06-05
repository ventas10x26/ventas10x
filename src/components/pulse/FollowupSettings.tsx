'use client'
// Ruta destino: src/components/pulse/FollowupSettings.tsx

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Config {
  followup_activo: boolean
  followup_horas: number
  followup_mensaje: string
}

interface Props {
  asesorId: string   // uuid de pulse_waitlist
  inicial: Config
}

const MENSAJE_DEFAULT = '¡Hola {nombre}! 👋 Soy {asesor} de KIA. Vi que estuviste interesado en el {modelo}. ¿Tienes alguna pregunta? Estoy aquí para ayudarte 🚗'
const HORAS = [1, 2, 3, 6, 12, 24]

export default function FollowupSettings({ asesorId, inicial }: Props) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [cfg, setCfg] = useState<Config>(inicial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function guardar() {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase
      .from('pulse_waitlist')
      .update({
        followup_activo: cfg.followup_activo,
        followup_horas: cfg.followup_horas,
        followup_mensaje: cfg.followup_mensaje,
      })
      .eq('id', asesorId)
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Follow-up automático</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            El bot reactivará leads inactivos y te avisará por WhatsApp y email
          </p>
        </div>
        <button
          onClick={() => setCfg(c => ({ ...c, followup_activo: !c.followup_activo }))}
          className={`relative w-12 h-6 rounded-full transition-colors ${cfg.followup_activo ? 'bg-emerald-500' : 'bg-slate-600'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.followup_activo ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {cfg.followup_activo && (
        <>
          {/* Horas */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              ⏱️ Enviar follow-up después de
            </label>
            <div className="flex gap-2 flex-wrap">
              {HORAS.map(h => (
                <button
                  key={h}
                  onClick={() => setCfg(c => ({ ...c, followup_horas: h }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cfg.followup_horas === h
                      ? 'bg-sky-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              💬 Mensaje de reactivación al lead
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Variables:{' '}
              <code className="text-sky-400">{'{nombre}'}</code>{' '}
              <code className="text-sky-400">{'{modelo}'}</code>{' '}
              <code className="text-sky-400">{'{asesor}'}</code>
            </p>
            <textarea
              rows={3}
              value={cfg.followup_mensaje}
              onChange={e => setCfg(c => ({ ...c, followup_mensaje: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors resize-none"
            />
            <button
              onClick={() => setCfg(c => ({ ...c, followup_mensaje: MENSAJE_DEFAULT }))}
              className="text-xs text-slate-500 hover:text-sky-400 mt-1 transition-colors"
            >
              ↺ Restaurar mensaje por defecto
            </button>
          </div>
        </>
      )}

      <button
        onClick={guardar}
        disabled={saving}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {saving ? 'Guardando…' : saved ? '✅ Guardado' : 'Guardar configuración'}
      </button>
    </div>
  )
}
