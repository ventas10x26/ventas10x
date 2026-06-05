'use client'
// Ruta destino: src/components/pulse/ClientVoiceWidget.tsx
// Wrapper que evita hydration mismatch y doble montaje en React Strict Mode

import dynamic from 'next/dynamic'

const VoiceWidget = dynamic(() => import('./VoiceWidget'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 border border-white/10 w-full max-w-sm mx-auto">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Agente de voz KIA</p>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 animate-pulse" />
      <p className="text-xs text-slate-600">Cargando...</p>
    </div>
  ),
})

export default function ClientVoiceWidget(props: { slug: string; nombreAsesor?: string; colorPrimario?: string }) {
  return <VoiceWidget {...props} />
}
