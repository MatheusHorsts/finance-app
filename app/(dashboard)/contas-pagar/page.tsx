'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, CalendarClock, X, Loader2, CheckCircle, Clock, AlertTriangle, Trash2, Pencil } from 'lucide-react'

type ContaPagar = {
  id: string
  descricao: string
  valor: number
  vencimento: string
  status: string
  recorrente: boolean
}

function Modal({ onClose, onSave, initial }: { onClose: () => void; onSave: () => void; initial?: ContaPagar | null }) {
  const supabase = createClient()
  const [descricao, setDescricao] = useState(initial?.descricao || '')
  const [valor, setValor] = useState(initial?.valor?.toString() || '')
  const [vencimento, setVencimento] = useState(initial?.vencimento || new Date().toISOString().split('T')[0])
  const [recorrente, setRecorrente] = useState(initial?.recorrente || false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!descricao.trim() || !valor) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { descricao, valor: parseFloat(valor), vencimento, recorrente, user_id: user!.id, status: 'pendente' }
    if (initial) {
      await supabase.from('contas_pagar').update({ descricao, valor: parseFloat(valor), vencimento, recorrente }).eq('id', initial.id)
    } else {
      await supabase.from('contas_pagar').insert(payload)
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">{initial ? 'Editar Conta' : 'Nova Conta a Pagar'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Aluguel, Internet..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Valor (R$)</label>
            <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Vencimento</label>
            <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setRecorrente(!recorrente)} className={`w-11 h-6 rounded-full transition relative ${recorrente ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${recorrente ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-slate-300 text-sm">Recorrente (todo mês)</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !descricao || !valor}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {initial ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getStatus(vencimento: string, status: string) {
  if (status === 'pago') return { label: 'Pago', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle }
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const venc = new Date(vencimento + 'T12:00:00')
  const diff = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Vencido', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle }
  if (diff <= 3) return { label: `Vence em ${diff}d`, color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: AlertTriangle }
  return { label: 'Pendente', color: 'text-slate-400', bg: 'bg-slate-500/10', icon: Clock }
}

export default function ContasPagarPage() {
  const supabase = createClient()
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<ContaPagar | null>(null)
  const [filtro, setFiltro] = useState('todos')

  const fetchContas = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('contas_pagar').select('*').eq('user_id', user!.id).order('vencimento')
    setContas(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchContas() }, [])

  const marcarPago = async (id: string, statusAtual: string) => {
    const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago'
    await supabase.from('contas_pagar').update({ status: novoStatus }).eq('id', id)
    fetchContas()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta conta?')) return
    await supabase.from('contas_pagar').delete().eq('id', id)
    fetchContas()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const filtradas = contas.filter(c => {
    if (filtro === 'pendente') return c.status !== 'pago'
    if (filtro === 'pago') return c.status === 'pago'
    return true
  })

  const totalPendente = contas.filter(c => c.status !== 'pago').reduce((a, c) => a + c.valor, 0)
  const totalPago = contas.filter(c => c.status === 'pago').reduce((a, c) => a + c.valor, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Contas a Pagar</h1>
          <p className="text-slate-400 mt-1">Vencimentos e pagamentos</p>
        </div>
        <button onClick={() => { setEditando(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
          <Plus className="w-4 h-4" /> Nova Conta
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">A Pagar</p>
          <p className="text-red-400 font-bold text-xl mt-1">{fmt(totalPendente)}</p>
          <p className="text-slate-500 text-xs mt-1">{contas.filter(c => c.status !== 'pago').length} pendentes</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Pago no mês</p>
          <p className="text-emerald-400 font-bold text-xl mt-1">{fmt(totalPago)}</p>
          <p className="text-slate-500 text-xs mt-1">{contas.filter(c => c.status === 'pago').length} pagos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {[['todos','Todos'],['pendente','Pendentes'],['pago','Pagos']].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)}
            className={`px-4 py-2 rounded-xl text-sm transition ${filtro === v ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : filtradas.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <CalendarClock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma conta encontrada</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {filtradas.map((c, i) => {
            const st = getStatus(c.vencimento, c.status)
            const Icon = st.icon
            return (
              <div key={c.id} className={`flex items-center justify-between px-5 py-4 ${i !== filtradas.length - 1 ? 'border-b border-slate-800' : ''} ${c.status === 'pago' ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => marcarPago(c.id, c.status)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${st.bg} hover:opacity-80`}>
                    <Icon className={`w-5 h-5 ${st.color}`} />
                  </button>
                  <div>
                    <p className={`text-sm font-medium ${c.status === 'pago' ? 'line-through text-slate-500' : 'text-white'}`}>{c.descricao}</p>
                    <p className="text-slate-500 text-xs">
                      Vence {new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {c.recorrente && ' · Recorrente'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-semibold text-sm ${c.status === 'pago' ? 'text-slate-500' : 'text-white'}`}>{fmt(c.valor)}</p>
                  <span className={`text-xs px-2 py-1 rounded-lg ${st.bg} ${st.color}`}>{st.label}</span>
                  <button onClick={() => { setEditando(c); setShowModal(true) }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchContas() }} initial={editando} />}
    </div>
  )
}
