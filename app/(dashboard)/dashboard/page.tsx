import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Wallet, AlertCircle, CreditCard, LineChart } from 'lucide-react'

function StatCard({ title, value, icon: Icon, color, sub }: {
  title: string; value: string; icon: any; color: string; sub?: string
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch data
  const [{ data: contas }, { data: transacoes }, { data: contasPagar }, { data: cartoes }, { data: investimentos }, { data: dividas }] = await Promise.all([
    supabase.from('contas').select('saldo').eq('user_id', user!.id),
    supabase.from('transacoes').select('tipo, valor').eq('user_id', user!.id),
    supabase.from('contas_pagar').select('valor, status').eq('user_id', user!.id).eq('status', 'pendente'),
    supabase.from('cartoes').select('limite, limite_usado').eq('user_id', user!.id),
    supabase.from('investimentos').select('valor_atual').eq('user_id', user!.id),
    supabase.from('dividas').select('saldo_devedor').eq('user_id', user!.id),
  ])

  const saldoTotal = (contas || []).reduce((acc, c) => acc + (c.saldo || 0), 0)
  const totalReceitas = (transacoes || []).filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0)
  const totalDespesas = (transacoes || []).filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0)
  const totalPagar = (contasPagar || []).reduce((acc, c) => acc + c.valor, 0)
  const totalInvestido = (investimentos || []).reduce((acc, i) => acc + (i.valor_atual || 0), 0)
  const totalDividas = (dividas || []).reduce((acc, d) => acc + (d.saldo_devedor || 0), 0)

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Visão geral das suas finanças</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard title="Saldo Total" value={fmt(saldoTotal)} icon={Wallet} color="text-emerald-400" sub="Todas as contas" />
        <StatCard title="Receitas (mês)" value={fmt(totalReceitas)} icon={TrendingUp} color="text-blue-400" />
        <StatCard title="Despesas (mês)" value={fmt(totalDespesas)} icon={TrendingDown} color="text-red-400" />
        <StatCard title="Contas a Pagar" value={fmt(totalPagar)} icon={AlertCircle} color="text-yellow-400" sub={`${(contasPagar || []).length} pendentes`} />
        <StatCard title="Investimentos" value={fmt(totalInvestido)} icon={LineChart} color="text-purple-400" />
        <StatCard title="Dívidas" value={fmt(totalDividas)} icon={CreditCard} color="text-orange-400" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Resumo do mês</h2>
        <div className="flex gap-8">
          <div>
            <p className="text-slate-400 text-sm">Balanço</p>
            <p className={`text-xl font-bold ${totalReceitas - totalDespesas >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmt(totalReceitas - totalDespesas)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Taxa de economia</p>
            <p className="text-xl font-bold text-white">
              {totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
