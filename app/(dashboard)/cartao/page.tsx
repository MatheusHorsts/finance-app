'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, CreditCard, X, Loader2, Trash2, Pencil, ShoppingCart } from 'lucide-react'

type Cartao = {
  id: string
  nome: string
  bandeira: string
  limite: number
  limite_usado: number
  vencimento_fatura: number
  fechamento_fatura: number
  cor: string
}

type GastoCartao = {
  id: string
  descricao: string
  valor: number
  data: string
  parcelas: number
  parcela_atual: number
  categorias: { nome: string } | null
}

const cores = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6']
const bandeiras = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard']

function ModalCartao({ onClose, onSave, initial }: { onClose: () => void; onSave: () => void; initial?: Cartao | null }) {
  const supabase = createClient()
  const [nome, setNome] = useState(initial?.nome || '')
  const [bandeira, setBandeira] = useState(initial?.bandeira || 'Visa')
  const [limite, setLimite] = useState(initial?.limite?.toString() || '')
  const [vencimento, setVencimento] = useState(initial?.vencimento_fatura?.toString() || '10')
  const [fechamento, setFechamento] = useState(initial?.fechamento_fatura?.toString() || '3')
  const [cor, setCor] = useState(initial?.cor || '#6366f1')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!nome || !limite) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { nome, bandeira, limite: parseFloat(limite), vencimento_fatura: parseInt(vencimento), fechamento_fatura: parseInt(fechamento), cor, user_id: user!.id }
    if (initial) {
      await supabase.from('cartoes').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('cartoes').insert(payload)
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">{initial ? 'Editar Cartão' : 'Novo Cartão'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Nome do cartão</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Nubank, Inter..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Bandeira</label>
            <div className="flex gap-2 flex-wrap">
              {bandeiras.map(b => (
                <button key={b} onClick={() => setBandeira(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${bandeira === b ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Limite (R$)</label>
            <input type="number" value={limite} onChange={e => setLimite(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Dia fechamento</label>
              <input type="number" value={fechamento} onChange={e => setFechamento(e.target.value)} min="1" max="31" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Dia vencimento</label>
              <input type="number" value={vencimento} onChange={e => setVencimento(e.target.value)} min="1" max="31" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Cor</label>
            <div className="flex gap-2">
              {cores.map(c => (
                <button key={c} onClick={() => setCor(c)} style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition ${cor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !nome || !limite}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {initial ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalGasto({ cartaoId, onClose, onSave }: { cartaoId: string; onClose: () => void; onSave: () => void }) {
  const supabase = createClient()
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [parcelas, setParcelas] = useState('1')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!descricao || !valor) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const valorNum = parseFloat(valor)
    await supabase.from('gastos_cartao').insert({ user_id: user!.id, cartao_id: cartaoId, descricao, valor: valorNum, data, parcelas: parseInt(parcelas) })
    // Atualiza limite usado
    const { data: cartao } = await supabase.from('cartoes').select('limite_usado').eq('id', cartaoId).single()
    if (cartao) await supabase.from('cartoes').update({ limite_usado: cartao.limite_usado + valorNum }).eq('id', cartaoId)
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">Novo Gasto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Supermercado, Netflix..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Valor (R$)</label>
            <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Parcelas</label>
            <select value={parcelas} onChange={e => setParcelas(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x {n > 1 ? `de R$ ${(parseFloat(valor||'0')/n).toFixed(2)}` : '(à vista)'}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !descricao || !valor}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartaoPage() {
  const supabase = createClient()
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [gastos, setGastos] = useState<Record<string, GastoCartao[]>>({})
  const [loading, setLoading] = useState(true)
  const [showModalCartao, setShowModalCartao] = useState(false)
  const [showModalGasto, setShowModalGasto] = useState<string | null>(null)
  const [editando, setEditando] = useState<Cartao | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: c } = await supabase.from('cartoes').select('*').eq('user_id', user!.id).order('created_at')
    setCartoes(c || [])
    const gastosMap: Record<string, GastoCartao[]> = {}
    for (const cartao of (c || [])) {
      const { data: g } = await supabase.from('gastos_cartao').select('*, categorias(nome)').eq('cartao_id', cartao.id).order('data', { ascending: false })
      gastosMap[cartao.id] = g || []
    }
    setGastos(gastosMap)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cartão?')) return
    await supabase.from('cartoes').delete().eq('id', id)
    fetchData()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Cartão de Crédito</h1>
          <p className="text-slate-400 mt-1">Faturas e gastos</p>
        </div>
        <button onClick={() => { setEditando(null); setShowModalCartao(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
          <Plus className="w-4 h-4" /> Novo Cartão
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : cartoes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhum cartão cadastrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cartoes.map(cartao => {
            const pct = Math.min((cartao.limite_usado / cartao.limite) * 100, 100)
            const disponivel = cartao.limite - cartao.limite_usado
            const gastosCartao = gastos[cartao.id] || []
            return (
              <div key={cartao.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Header do cartão */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cartao.cor + '22' }}>
                        <CreditCard className="w-5 h-5" style={{ color: cartao.cor }} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{cartao.nome}</p>
                        <p className="text-slate-500 text-xs">{cartao.bandeira} · Fecha dia {cartao.fechamento_fatura} · Vence dia {cartao.vencimento_fatura}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setShowModalGasto(cartao.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs transition">
                        <Plus className="w-3 h-3" /> Gasto
                      </button>
                      <button onClick={() => { setEditando(cartao); setShowModalCartao(true) }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cartao.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Barra de uso */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Usado: <span className="text-white font-medium">{fmt(cartao.limite_usado)}</span></span>
                      <span className="text-slate-400">Disponível: <span className="text-emerald-400 font-medium">{fmt(disponivel)}</span></span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : cartao.cor }} />
                    </div>
                    <p className="text-slate-500 text-xs mt-1">Limite total: {fmt(cartao.limite)} · {pct.toFixed(0)}% usado</p>
                  </div>
                  {/* Toggle gastos */}
                  {gastosCartao.length > 0 && (
                    <button onClick={() => setExpandido(expandido === cartao.id ? null : cartao.id)}
                      className="text-xs text-slate-400 hover:text-white transition mt-1">
                      {expandido === cartao.id ? '▲ Ocultar' : `▼ Ver ${gastosCartao.length} gasto(s)`}
                    </button>
                  )}
                </div>
                {/* Lista de gastos */}
                {expandido === cartao.id && gastosCartao.length > 0 && (
                  <div className="border-t border-slate-800">
                    {gastosCartao.map((g, i) => (
                      <div key={g.id} className={`flex items-center justify-between px-5 py-3 ${i !== gastosCartao.length - 1 ? 'border-b border-slate-800/50' : ''}`}>
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-white text-sm">{g.descricao}</p>
                            <p className="text-slate-500 text-xs">{new Date(g.data + 'T12:00:00').toLocaleDateString('pt-BR')}{g.parcelas > 1 ? ` · ${g.parcelas}x` : ''}</p>
                          </div>
                        </div>
                        <p className="text-red-400 text-sm font-medium">-{fmt(g.valor)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModalCartao && <ModalCartao onClose={() => setShowModalCartao(false)} onSave={() => { setShowModalCartao(false); fetchData() }} initial={editando} />}
      {showModalGasto && <ModalGasto cartaoId={showModalGasto} onClose={() => setShowModalGasto(null)} onSave={() => { setShowModalGasto(null); fetchData() }} />}
    </div>
  )
}
