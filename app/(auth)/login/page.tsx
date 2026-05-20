'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLight, setIsLight] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    setIsLight(saved === 'light')
    document.documentElement.classList.toggle('light', saved === 'light')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha inválidos.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${isLight ? 'bg-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Finance Manager</h1>
          <p className={`mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gestão de finanças pessoais</p>
        </div>

        <div className={`border rounded-2xl p-8 shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
          <h2 className={`text-xl font-semibold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>Entrar na conta</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'}`} />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Senha</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition pr-12 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
