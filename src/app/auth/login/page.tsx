'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message.includes('Invalid') ? 'Correo o contraseña incorrectos' : error.message)
      setLoading(false)
    } else {
      router.push('/dashboard'); router.refresh()
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <h2 className="text-xl font-display font-bold text-center text-gray-900 mb-1">Bienvenido de vuelta</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Ingresa a tu cuenta para continuar</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Correo electrónico</label>
            <input type="email" className="input" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"/>
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input type="password" className="input" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/>
          </div>
          <div className="text-right">
            <Link href="/auth/forgot" className="text-xs text-blue-600 font-medium hover:underline">¿Olvidaste tu contraseña?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-secondary w-full disabled:opacity-50">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-xs text-gray-400">o</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continuar con Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿No tienes cuenta? <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  )
}
