'use client'
// Ruta destino: src/components/pulse/VoiceWidget.tsx
// Usa el widget nativo de ElevenLabs via web component

import { useEffect, useRef } from 'react'

interface Props {
  slug?: string
  nombreAsesor?: string
  colorPrimario?: string
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'agent-id'?: string
      }, HTMLElement>
    }
  }
}

export default function VoiceWidget({ nombreAsesor = 'tu asesor KIA' }: Props) {
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (scriptLoaded.current) return
    scriptLoaded.current = true

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
    script.async = true
    script.type = 'text/javascript'
    document.head.appendChild(script)

    return () => {
      // No remover el script — el web component lo necesita
    }
  }, [])

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_4101ktatgmnyfh9r4jjrzm8zjvzn'

  return (
    <div className="w-full flex flex-col items-center gap-3 py-4">
      <p className="text-sm text-slate-400 text-center">
        Habla directamente con {nombreAsesor}
      </p>
      <elevenlabs-convai agent-id={agentId} />
    </div>
  )
}
