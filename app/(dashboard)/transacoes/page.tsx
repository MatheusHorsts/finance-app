'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ArrowUpCircle, ArrowDownCircle, X, Loader2, Search, Filter } from 'lucide-react'

type Conta = { id: string; nome: string }
type Transacao = {
  id: string
  tipo: string
  descricao: string
  valor: number
  data: string
  observacao: string
  contas: { nome: string } | null
  categorias: { nome: string } | null
}

const categoriasPadrao = {
  receita: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
  despesa: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Roupas', 'Contas', 'Outros'],
}

function Modal({ onClose, onSave, contas }: { onClose: () => void; onSave: () => void; contas: Conta[] }) {
  const supabase = createClient()
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [contaId, setContaId] = useState(contas[0]?.id || '')
  const [categoria, setCategoria] = useState('')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!descricao.trim() || !valor || !contaId) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Busca ou cria categoria
    let categoriaId = null
    if (categoria) {
      const { data: catExist } = await supabase.from('categorias').select('id').eq('user_id', user!.id).eq('nome', categoria).eq('tipo', tipo).single()
      if (catExist) {
        categoriaId = catExist.id
      } else {
        const { data: newCat } = await supabase.from('categorias').insert({ user_id: user!.id, nome: categoria, tipo }).select('id').single()
        categoriaId = newCat?.id
      }
    }

    const valorNum = parseFloat(valor.replace(',', '.'))

    // Insere transação
    await supabase.from('transacoes').insert({
      user_id: user!.id,
      conta_id: contaId,
      categoria_id: categoriaId,
      tipo,
      descricao,
      valor: valorNum,
      data,
      observacao,
    })

    // Atualiza saldo da conta
    const { data: conta } = await supabase.from('contas').select('saldo').eq('id', contaId).single()
    if (conta) {
      const novoSaldo = tipo === 'receita' ? conta.saldo + valorNum : conta.saldo - valorNum
      await supabase.from('contas').update({ saldo: novoSaldo }).eq('id', contaId)
    }

    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">Nova Transação</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Tipo */}
        <div className="flex gap-2 mb-4">
          {(['receita', 'despesa'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTipo(t); setCategoria('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                tipo === t
                  ? t === 'receita' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Aluguel, Salário..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Valor (R$)</label>
            <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" step="0.01" min="0" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition" />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Conta</label>
            <select value={contaId} onChange={e => setContaId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition">
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {categoriasPadrao[tipo].map(cat => (
                <button key={cat} onClick={() => setCategoria(cat === categoria ? '' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${categoria === cat ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Observação (opcional)</label>
            <input value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Alguma nota..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !descricao || !valor || !contaId}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TransacoesPage() {
  const supabase = createClient()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busca, setBusca] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('transacoes').select('*, contas(nome), categorias(nome)').eq('user_id', user!.id).order('data', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('contas').select('id, nome').eq('user_id', user!.id),
    ])
    setTransacoes(t || [])
    setContas(c || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const filtradas = transacoes.filter(t => {
    const matchTipo = filtroTipo === 'todos' || t.tipo === filtroTipo
    const matchBusca = t.descricao.toLowerCase().includes(busca.toLowerCase())
    return matchTipo && matchBusca
  })

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-slate-400 mt-1">Receitas e despesas</p>
        </div>
        <button onClick={() => setShowModal(true)} disabled={contas.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" /> Nova Transação
        </button>
      </div>

      {contas.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl px-4 py-3 text-sm mb-6">
          Você precisa cadastrar pelo menos uma conta antes de adicionar transações.
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Total Receitas</p>
          <p className="text-emerald-400 font-bold text-lg mt-1">{fmt(totalReceitas)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Total Despesas</p>
          <p className="text-red-400 font-bold text-lg mt-1">{fmt(totalDespesas)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Balanço</p>
          <p className={`font-bold text-lg mt-1 ${totalReceitas - totalDespesas >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(totalReceitas - totalDespesas)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar transação..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm" />
        </div>
        {['todos', 'receita', 'despesa'].map(f => (
          <button key={f} onClick={() => setFiltroTipo(f)}
            className={`px-4 py-2.5 rounded-xl text-sm transition ${filtroTipo === f ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'}`}>
            {f === 'todos' ? 'Todos' : f === 'receita' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : filtradas.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <ArrowDownCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {filtradas.map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between px-5 py-4 ${i !== filtradas.length - 1 ? 'border-b border-slate-800' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.tipo === 'receita' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {t.tipo === 'receita'
                    ? <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                    : <ArrowDownCircle className="w-5 h-5 text-red-400" />}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.descricao}</p>
                  <p className="text-slate-500 text-xs">
                    {t.categorias?.nome && <span>{t.categorias.nome} · </span>}
                    {t.contas?.nome && <span>{t.contas.nome} · </span>}
                    {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <p className={`font-semibold ${t.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchData() }} contas={contas} />}
    </div>
  )
}
