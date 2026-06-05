'use client'
// Ruta destino: src/components/pulse/VoiceWidget.tsx
// Agente de voz con Vapi SDK

import { useState, useRef, useCallback, useEffect } from 'react'

type EstadoConexion = 'idle' | 'conectando' | 'activo' | 'error'

interface Props {
  slug?: string
  nombreAsesor?: string
  concesionario?: string
  colorPrimario?: string
}

export default function VoiceWidget({
  nombreAsesor = 'Sandra',
  concesionario = 'KIA',
  colorPrimario = '#0ea5e9'
}: Props) {
  const [estado, setEstado] = useState<EstadoConexion>('idle')
  const [duracion, setDuracion] = useState(0)
  const [volumen, setVolumen] = useState(0)

  const vapiRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { return () => { desconectar() } }, [])

  const desconectar = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (vapiRef.current) {
      try { vapiRef.current.stop() } catch {}
      vapiRef.current = null
    }
    setEstado('idle')
    setDuracion(0)
    setVolumen(0)
  }, [])

  async function iniciarLlamada() {
    try {
      setEstado('conectando')

      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
      if (!publicKey || !assistantId) throw new Error('Vapi keys no configuradas')

      const { default: Vapi } = await import('@vapi-ai/web')
      const vapi = new Vapi(publicKey)
      vapiRef.current = vapi

      vapi.on('call-start', () => {
        setEstado('activo')
        timerRef.current = setInterval(() => setDuracion(d => d + 1), 1000)
      })

      vapi.on('call-end', () => {
        desconectar()
      })

      vapi.on('error', (e: any) => {
        console.error('[vapi] error:', e)
        setEstado('error')
        setTimeout(() => setEstado('idle'), 3000)
      })

      vapi.on('volume-level', (v: number) => {
        setVolumen(v)
      })

      // Iniciar llamada con variables del asesor
      await vapi.start(assistantId, {
        variableValues: {
          nombre_asesor: nombreAsesor,
          concesionario: concesionario,
        },
      })

    } catch (e: any) {
      console.error('[vapi] error iniciando:', e)
      setEstado('error')
      setTimeout(() => setEstado('idle'), 3000)
    }
  }

  const fmt = (s: number) => Math.floor(s / 60).toString().padStart(2, '0') + ':' + (s % 60).toString().padStart(2, '0')
  const escala = 1 + volumen * 0.4

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 border border-white/10 w-full max-w-sm mx-auto">
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          {estado === 'idle' && 'Agente de voz'}
          {estado === 'conectando' && 'Conectando...'}
          {estado === 'activo' && 'En llamada · ' + fmt(duracion)}
          {estado === 'error' && 'Error de conexión'}
        </p>
        <p className="text-sm text-slate-300">
          {estado === 'idle' ? 'Escucha el saludo de ' + nombreAsesor : estado === 'activo' ? 'Hablando...' : ''}
        </p>
      </div>

      <button
        onClick={estado === 'idle' ? iniciarLlamada : desconectar}
        disabled={estado === 'conectando'}
        style={{
          transform: estado === 'activo' ? 'scale(' + escala + ')' : 'scale(1)',
          transition: 'transform 0.1s ease',
          background: estado === 'activo'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, ' + colorPrimario + ', #10b981)',
        }}
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative"
      >
        {estado === 'activo' && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} />
        )}
        {estado === 'conectando' ? (
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : estado === 'activo' ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
          </svg>
        )}
      </button>

      {estado === 'error' && (
        <p className="text-xs text-red-400 text-center">No se pudo conectar. Intenta de nuevo.</p>
      )}

      <p className="text-xs text-slate-600 text-center">
        {estado === 'idle' ? 'Toca para escuchar el saludo' : estado === 'activo' ? 'Toca para colgar' : ''}
      </p>
    </div>
  )
}
