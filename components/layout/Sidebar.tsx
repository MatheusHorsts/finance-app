'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import {
  TrendingUp, LayoutDashboard, Wallet, ArrowLeftRight,
  CalendarClock, CreditCard, LineChart, AlertCircle, LogOut,
  Sun, Moon, Target, Building2
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contas', label: 'Contas', icon: Wallet },
  { href: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { href: '/contas-pagar', label: 'Contas a Pagar', icon: CalendarClock },
  { href: '/cartao', label: 'Cartão de Crédito', icon: CreditCard },
  { href: '/investimentos', label: 'Investimentos', icon: LineChart },
  { href: '/dividas', label: 'Dívidas', icon: AlertCircle },
  { href: '/objetivos', label: 'Objetivos', icon: Target },
  { href: '/minha-empresa', label: 'Minha Empresa', icon: Building2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isLight = theme === 'light'

  return (
    <aside className={`w-64 flex flex-col h-screen sticky top-0 transition-colors ${isLight ? 'bg-white border-r border-slate-200' : 'bg-slate-900 border-r border-slate-800'}`}>
      {/* Logo */}
      <div className={`p-6 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Finance</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className={`p-4 border-t space-y-1 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full ${
            isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {isLight ? 'Tema Escuro' : 'Tema Claro'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
