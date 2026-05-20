'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, LineChart, X, Loader2, Trash2, Pencil, TrendingUp, TrendingDown } from 'lucide-react'

type Investimento = {
  id: string
  nome: string
  tipo: string
  valor_investido: number
  valor_atual: number
  data_inicio: string
  instituicao: string
}

const tipos = [
  { value: 'renda_fixa', label: 'Renda Fixa' },
  { value: 'renda_variavel', label: 'Renda Variável' },
  { value: 'fundo', label: 'Fundo' },
  { value: 'criptomoeda', label: 'Criptomoeda' },
  { value: 'outro', label: 'Outro' },
]

const tipoLabel: Record<string, string> = {
  renda_fixa: 'Renda Fixa', renda_variavel: 'Renda Variável', fundo: 'Fundo', criptomoeda: 'Criptomoeda', outro: 'Outro'
}

const tipoCores: Record<string, string> = {
  renda_fixa: '#10b981', renda_variavel: '#6366f1', fundo: '#f59e0b', criptomoeda: '#f97316', outro: '#8b5cf6'
}

function Modal({ onClose, onSave, initial }: { onClose: () => void; onSave: () => void; initial?: Investimento | null }) {
  const supabase = createClient()
  const [nome, setNome] = useState(initial?.nome || '')
  const [tipo, setTipo] = useState(initial?.tipo || 'renda_fixa')
  const [valorInvestido, setValorInvestido] = useState(initial?.valor_investido?.toString() || '')
  const [valorAtual, setValorAtual] = useState(initial?.valor_atual?.toString() || '')
  const [dataInicio, setDataInicio] = useState(initial?.data_inicio || new Date().toISOString().split('T')[0])
  const [instituicao, setInstituicao] = useState(initial?.instituicao || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!nome || !valorInvestido) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      nome, tipo,
      valor_investido: parseFloat(valorInvestido),
      valor_atual: parseFloat(valorAtual || valorInvestido),
      data_inicio: dataInicio,
      instituicao,
      user_id: user!.id
    }
    if (initial) {
      await supabase.from('investimentos').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('investimentos').insert(payload)
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">{initial ? 'Editar Investimento' : 'Novo Investimento'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Tesouro Selic, PETR4..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {tipos.map(t => (
                <button key={t.value} onClick={() => setTipo(t.value)}
                  className={`py-2 px-3 rounded-xl text-xs transition ${tipo === t.value ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Valor investido (R$)</label>
              <input type="number" value={valorInvestido} onChange={e => setValorInvestido(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Valor atual (R$)</label>
              <input type="number" value={valorAtual} onChange={e => setValorAtual(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Instituição</label>
            <input value={instituicao} onChange={e => setInstituicao(e.target.value)} placeholder="Ex: XP, Rico, Nubank..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Data de início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !nome || !valorInvestido}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {initial ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InvestimentosPage() {
  const supabase = createClient()
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Investimento | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('investimentos').select('*').eq('user_id', user!.id).order('created_at')
    setInvestimentos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este investimento?')) return
    await supabase.from('investimentos').delete().eq('id', id)
    fetchData()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtPct = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%'

  const totalInvestido = investimentos.reduce((a, i) => a + i.valor_investido, 0)
  const totalAtual = investimentos.reduce((a, i) => a + i.valor_atual, 0)
  const rendimento = totalInvestido > 0 ? ((totalAtual - totalInvestido) / totalInvestido) * 100 : 0

  // Agrupa por tipo
  const porTipo = tipos.map(t => ({
    ...t,
    total: investimentos.filter(i => i.tipo === t.value).reduce((a, i) => a + i.valor_atual, 0),
    count: investimentos.filter(i => i.tipo === t.value).length,
  })).filter(t => t.count > 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Investimentos</h1>
          <p className="text-slate-400 mt-1">Carteira e rendimentos</p>
        </div>
        <button onClick={() => { setEditando(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
          <Plus className="w-4 h-4" /> Novo Investimento
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Total Investido</p>
          <p className="text-white font-bold text-xl mt-1">{fmt(totalInvestido)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Valor Atual</p>
          <p className="text-purple-400 font-bold text-xl mt-1">{fmt(totalAtual)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Rendimento</p>
          <div className="flex items-center gap-1 mt-1">
            {rendimento >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
            <p className={`font-bold text-xl ${rendimento >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPct(rendimento)}</p>
          </div>
          <p className={`text-xs mt-0.5 ${totalAtual - totalInvestido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(totalAtual - totalInvestido)}</p>
        </div>
      </div>

      {/* Por tipo */}
      {porTipo.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <p className="text-white font-medium mb-4">Distribuição por tipo</p>
          <div className="space-y-3">
            {porTipo.map(t => (
              <div key={t.value}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{t.label}</span>
                  <span className="text-slate-400">{fmt(t.total)} · {totalAtual > 0 ? ((t.total / totalAtual) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${totalAtual > 0 ? (t.total / totalAtual) * 100 : 0}%`, backgroundColor: tipoCores[t.value] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : investimentos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <LineChart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhum investimento cadastrado</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {investimentos.map((inv, i) => {
            const rend = inv.valor_investido > 0 ? ((inv.valor_atual - inv.valor_investido) / inv.valor_investido) * 100 : 0
            const cor = tipoCores[inv.tipo] || '#8b5cf6'
            return (
              <div key={inv.id} className={`flex items-center justify-between px-5 py-4 ${i !== investimentos.length - 1 ? 'border-b border-slate-800' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: cor + '22' }}>
                    <LineChart className="w-4 h-4" style={{ color: cor }} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{inv.nome}</p>
                    <p className="text-slate-500 text-xs">{tipoLabel[inv.tipo]}{inv.instituicao ? ` · ${inv.instituicao}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{fmt(inv.valor_atual)}</p>
                    <p className={`text-xs ${rend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPct(rend)}</p>
                  </div>
                  <button onClick={() => { setEditando(inv); setShowModal(true) }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(inv.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchData() }} initial={editando} />}
    </div>
  )
}
