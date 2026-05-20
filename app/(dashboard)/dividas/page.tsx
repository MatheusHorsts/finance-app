'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, AlertCircle, X, Loader2, Trash2, Pencil, CheckCircle } from 'lucide-react'

type Divida = {
  id: string
  descricao: string
  credor: string
  valor_original: number
  saldo_devedor: number
  taxa_juros: number
  parcelas_total: number
  parcelas_pagas: number
  vencimento: string
  status: string
}

const statusCores: Record<string, { text: string; bg: string; label: string }> = {
  ativa: { text: 'text-red-400', bg: 'bg-red-500/10', label: 'Ativa' },
  quitada: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Quitada' },
  negociando: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Negociando' },
}

function Modal({ onClose, onSave, initial }: { onClose: () => void; onSave: () => void; initial?: Divida | null }) {
  const supabase = createClient()
  const [descricao, setDescricao] = useState(initial?.descricao || '')
  const [credor, setCredor] = useState(initial?.credor || '')
  const [valorOriginal, setValorOriginal] = useState(initial?.valor_original?.toString() || '')
  const [saldoDevedor, setSaldoDevedor] = useState(initial?.saldo_devedor?.toString() || '')
  const [taxaJuros, setTaxaJuros] = useState(initial?.taxa_juros?.toString() || '0')
  const [parcelasTotal, setParcelasTotal] = useState(initial?.parcelas_total?.toString() || '')
  const [parcelasPagas, setParcelasPagas] = useState(initial?.parcelas_pagas?.toString() || '0')
  const [vencimento, setVencimento] = useState(initial?.vencimento || '')
  const [status, setStatus] = useState(initial?.status || 'ativa')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!descricao || !credor || !valorOriginal) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      descricao, credor,
      valor_original: parseFloat(valorOriginal),
      saldo_devedor: parseFloat(saldoDevedor || valorOriginal),
      taxa_juros: parseFloat(taxaJuros) || 0,
      parcelas_total: parseInt(parcelasTotal) || null,
      parcelas_pagas: parseInt(parcelasPagas) || 0,
      vencimento: vencimento || null,
      status,
      user_id: user!.id
    }
    if (initial) {
      await supabase.from('dividas').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('dividas').insert(payload)
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">{initial ? 'Editar Dívida' : 'Nova Dívida'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Empréstimo pessoal, Financiamento..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Credor</label>
            <input value={credor} onChange={e => setCredor(e.target.value)} placeholder="Ex: Banco Itaú, Crefisa..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Valor original (R$)</label>
              <input type="number" value={valorOriginal} onChange={e => setValorOriginal(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Saldo devedor (R$)</label>
              <input type="number" value={saldoDevedor} onChange={e => setSaldoDevedor(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Juros ao mês (%)</label>
              <input type="number" value={taxaJuros} onChange={e => setTaxaJuros(e.target.value)} placeholder="0" step="0.01" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Vencimento</label>
              <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Total de parcelas</label>
              <input type="number" value={parcelasTotal} onChange={e => setParcelasTotal(e.target.value)} placeholder="Ex: 24" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Parcelas pagas</label>
              <input type="number" value={parcelasPagas} onChange={e => setParcelasPagas(e.target.value)} placeholder="0" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Status</label>
            <div className="flex gap-2">
              {Object.entries(statusCores).map(([v, s]) => (
                <button key={v} onClick={() => setStatus(v)}
                  className={`flex-1 py-2 rounded-xl text-xs transition ${status === v ? `${s.bg} ${s.text} border border-current` : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !descricao || !credor || !valorOriginal}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {initial ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DividasPage() {
  const supabase = createClient()
  const [dividas, setDividas] = useState<Divida[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Divida | null>(null)
  const [filtro, setFiltro] = useState('todos')

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('dividas').select('*').eq('user_id', user!.id).order('created_at')
    setDividas(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta dívida?')) return
    await supabase.from('dividas').delete().eq('id', id)
    fetchData()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const filtradas = dividas.filter(d => filtro === 'todos' || d.status === filtro)
  const totalDevedor = dividas.filter(d => d.status !== 'quitada').reduce((a, d) => a + d.saldo_devedor, 0)
  const totalQuitado = dividas.filter(d => d.status === 'quitada').reduce((a, d) => a + d.valor_original, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dívidas</h1>
          <p className="text-slate-400 mt-1">Controle seu saldo devedor</p>
        </div>
        <button onClick={() => { setEditando(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
          <Plus className="w-4 h-4" /> Nova Dívida
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Total em Dívidas</p>
          <p className="text-red-400 font-bold text-xl mt-1">{fmt(totalDevedor)}</p>
          <p className="text-slate-500 text-xs mt-1">{dividas.filter(d => d.status !== 'quitada').length} ativas</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs">Total Quitado</p>
          <p className="text-emerald-400 font-bold text-xl mt-1">{fmt(totalQuitado)}</p>
          <p className="text-slate-500 text-xs mt-1">{dividas.filter(d => d.status === 'quitada').length} quitadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {[['todos','Todas'],['ativa','Ativas'],['negociando','Negociando'],['quitada','Quitadas']].map(([v,l]) => (
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
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma dívida encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(d => {
            const pct = d.parcelas_total ? (d.parcelas_pagas / d.parcelas_total) * 100 : ((d.valor_original - d.saldo_devedor) / d.valor_original) * 100
            const st = statusCores[d.status] || statusCores.ativa
            return (
              <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${st.bg}`}>
                      {d.status === 'quitada' ? <CheckCircle className={`w-5 h-5 ${st.text}`} /> : <AlertCircle className={`w-5 h-5 ${st.text}`} />}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{d.descricao}</p>
                      <p className="text-slate-500 text-xs">{d.credor}{d.taxa_juros > 0 ? ` · ${d.taxa_juros}% a.m.` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-lg ${st.bg} ${st.text}`}>{st.label}</span>
                    <button onClick={() => { setEditando(d); setShowModal(true) }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Saldo devedor: <span className={`font-medium ${st.text}`}>{fmt(d.saldo_devedor)}</span></span>
                  {d.parcelas_total ? <span className="text-slate-500">{d.parcelas_pagas}/{d.parcelas_total} parcelas</span> : <span className="text-slate-500">Original: {fmt(d.valor_original)}</span>}
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.max(0, Math.min(pct, 100))}%` }} />
                </div>
                <p className="text-slate-600 text-xs mt-1">{Math.max(0, Math.min(pct, 100)).toFixed(0)}% quitado</p>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchData() }} initial={editando} />}
    </div>
  )
}
