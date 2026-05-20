import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Wallet, AlertCircle, CreditCard, LineChart } from 'lucide-react'
import GraficoGastos from './GraficoGastos'

function StatCard({ title, value, icon: Icon, color, sub }: {
  title: string; value: string; icon: any; color: string; sub?: string
}) {
  return (
    <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-input)' }}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: contas },
    { data: transacoes },
    { data: contasPagar },
    { data: investimentos },
    { data: dividas },
    { data: gastosCartao },
  ] = await Promise.all([
    supabase.from('contas').select('saldo').eq('user_id', user!.id),
    supabase.from('transacoes').select('tipo, valor, categorias(nome)').eq('user_id', user!.id),
    supabase.from('contas_pagar').select('valor, status').eq('user_id', user!.id).eq('status', 'pendente'),
    supabase.from('investimentos').select('valor_atual').eq('user_id', user!.id),
    supabase.from('dividas').select('saldo_devedor').eq('user_id', user!.id),
    supabase.from('gastos_cartao').select('valor, categorias(nome)').eq('user_id', user!.id),
  ])

  const saldoTotal = (contas || []).reduce((acc, c) => acc + (c.saldo || 0), 0)
  const totalReceitas = (transacoes || []).filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0)
  const totalDespesas = (transacoes || []).filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0)
  const totalPagar = (contasPagar || []).reduce((acc, c) => acc + c.valor, 0)
  const totalInvestido = (investimentos || []).reduce((acc, i) => acc + (i.valor_atual || 0), 0)
  const totalDividas = (dividas || []).reduce((acc, d) => acc + (d.saldo_devedor || 0), 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Agrupa gastos por categoria (transações de despesa + gastos de cartão)
  const gastosPorCategoria: Record<string, number> = {}

  for (const t of (transacoes || []).filter(t => t.tipo === 'despesa')) {
    const cat = (t.categorias as any)?.nome || 'Sem categoria'
    gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + t.valor
  }

  for (const g of (gastosCartao || [])) {
    const cat = (g.categorias as any)?.nome || 'Cartão s/ categoria'
    gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + g.valor
  }

  const CORES = ['#ef4444','#f97316','#f59e0b','#6366f1','#8b5cf6','#ec4899','#3b82f6','#14b8a6','#10b981','#84cc16']
  const dadosGrafico = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, valor], i) => ({ nome, valor, cor: CORES[i % CORES.length] }))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-lg mt-1" style={{ color: 'var(--text-secondary)' }}>Visão geral das suas finanças</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard title="Saldo Total" value={fmt(saldoTotal)} icon={Wallet} color="text-emerald-400" sub="Todas as contas" />
        <StatCard title="Receitas (mês)" value={fmt(totalReceitas)} icon={TrendingUp} color="text-blue-400" />
        <StatCard title="Despesas (mês)" value={fmt(totalDespesas)} icon={TrendingDown} color="text-red-400" />
        <StatCard title="Contas a Pagar" value={fmt(totalPagar)} icon={AlertCircle} color="text-yellow-400" sub={`${(contasPagar || []).length} pendentes`} />
        <StatCard title="Investimentos" value={fmt(totalInvestido)} icon={LineChart} color="text-purple-400" />
        <StatCard title="Dívidas" value={fmt(totalDividas)} icon={CreditCard} color="text-orange-400" />
      </div>

      {/* Gráfico de gastos */}
      <div className="rounded-2xl p-6 border mb-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Gastos por Categoria</h2>
        <GraficoGastos data={dadosGrafico} />
      </div>

      {/* Resumo */}
      <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Resumo do mês</h2>
        <div className="flex gap-8">
          <div>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Balanço</p>
            <p className={`text-2xl font-bold ${totalReceitas - totalDespesas >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmt(totalReceitas - totalDespesas)}
            </p>
          </div>
          <div>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Taxa de economia</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
