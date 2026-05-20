'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ArrowUpCircle, ArrowDownCircle, X, Loader2, Search, Pencil, Trash2, ArrowLeftRight } from 'lucide-react'

type Conta = { id: string; nome: string }
type Transacao = {
  id: string; tipo: string; descricao: string; valor: number; data: string
  observacao: string; conta_id: string
  contas: { nome: string } | null
  categorias: { nome: string } | null
}

const categoriasPadrao = {
  receita: ['Salário','Freelance','Investimentos','Presente','Outros'],
  despesa: ['Alimentação','Transporte','Moradia','Saúde','Educação','Lazer','Roupas','Contas','Outros'],
}

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function Modal({ onClose, onSave, contas, initial }: {
  onClose:()=>void; onSave:()=>void; contas:Conta[]; initial?:Transacao|null
}) {
  const supabase = createClient()
  const [tipo, setTipo] = useState<'receita'|'despesa'>(initial?.tipo==='receita'?'receita':'despesa')
  const [descricao, setDescricao] = useState(initial?.descricao||'')
  const [valor, setValor] = useState(initial?.valor?.toString()||'')
  const [data, setData] = useState(initial?.data||new Date().toISOString().split('T')[0])
  const [contaId, setContaId] = useState(initial?.conta_id||contas[0]?.id||'')
  const [categoria, setCategoria] = useState((initial?.categorias as any)?.nome||'')
  const [observacao, setObservacao] = useState(initial?.observacao||'')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!descricao.trim()||!valor||!contaId) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const valorNum = parseFloat(valor.replace(',','.'))

    let categoriaId = null
    if (categoria) {
      const { data: catExist } = await supabase.from('categorias').select('id').eq('user_id', user!.id).eq('nome', categoria).eq('tipo', tipo).single()
      if (catExist) { categoriaId = catExist.id }
      else {
        const { data: newCat } = await supabase.from('categorias').insert({ user_id: user!.id, nome: categoria, tipo }).select('id').single()
        categoriaId = newCat?.id
      }
    }

    if (initial) {
      // Reverte saldo antigo
      const { data: contaAntiga } = await supabase.from('contas').select('saldo').eq('id', initial.conta_id).single()
      if (contaAntiga) {
        const saldoRevertido = initial.tipo==='receita' ? contaAntiga.saldo - initial.valor : contaAntiga.saldo + initial.valor
        await supabase.from('contas').update({ saldo: saldoRevertido }).eq('id', initial.conta_id)
      }
      // Atualiza transação
      await supabase.from('transacoes').update({ conta_id: contaId, categoria_id: categoriaId, tipo, descricao, valor: valorNum, data, observacao }).eq('id', initial.id)
    } else {
      await supabase.from('transacoes').insert({ user_id: user!.id, conta_id: contaId, categoria_id: categoriaId, tipo, descricao, valor: valorNum, data, observacao })
    }

    // Aplica novo saldo
    const { data: conta } = await supabase.from('contas').select('saldo').eq('id', contaId).single()
    if (conta) {
      const novoSaldo = tipo==='receita' ? conta.saldo + valorNum : conta.saldo - valorNum
      await supabase.from('contas').update({ saldo: novoSaldo }).eq('id', contaId)
    }

    setLoading(false); onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border max-h-[90vh] overflow-y-auto" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>{initial?'Editar Transação':'Nova Transação'}</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="flex gap-2 mb-4">
          {(['receita','despesa'] as const).map(t => (
            <button key={t} onClick={()=>{ setTipo(t); setCategoria('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                tipo===t ? t==='receita'?'bg-emerald-500/20 text-emerald-500 border-emerald-500/40':'bg-red-500/20 text-red-400 border-red-500/40'
                : 'text-slate-400 border-slate-300'
              }`}
              style={tipo!==t?{ borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>
              {t==='receita'?'↑ Receita':'↓ Despesa'}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {[
            { label:'Descrição', el: <input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Aluguel, Salário..." className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
            { label:'Valor (R$)', el: <input type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" step="0.01" min="0" className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
            { label:'Data', el: <input type="date" value={data} onChange={e=>setData(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
          ].map(({ label, el }) => (
            <div key={label}>
              <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>{label}</label>
              {el}
            </div>
          ))}
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Conta</label>
            <select value={contaId} onChange={e=>setContaId(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Categoria</label>
            <div className="flex flex-wrap gap-2">
              {categoriasPadrao[tipo].map(cat => (
                <button key={cat} onClick={()=>setCategoria(cat===categoria?'':cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition border ${categoria===cat?'bg-emerald-500/20 text-emerald-500 border-emerald-500/40':''}`}
                  style={categoria!==cat?{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Observação (opcional)</label>
            <input value={observacao} onChange={e=>setObservacao(e.target.value)} placeholder="Alguma nota..."
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm transition" style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!descricao||!valor||!contaId}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null} Salvar
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
  const [editando, setEditando] = useState<Transacao|null>(null)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busca, setBusca] = useState('')
  const hoje = new Date()
  const [filtroMes, setFiltroMes] = useState(hoje.getMonth())
  const [filtroAno, setFiltroAno] = useState(hoje.getFullYear())

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: t },{ data: c }] = await Promise.all([
      supabase.from('transacoes').select('*, contas(nome), categorias(nome)').eq('user_id', user!.id).order('data', { ascending:false }).order('created_at', { ascending:false }),
      supabase.from('contas').select('id, nome').eq('user_id', user!.id),
    ])
    setTransacoes(t||[])
    setContas(c||[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (t: Transacao) => {
    if (!confirm('Excluir esta transação?')) return
    // Reverte saldo
    const { data: conta } = await supabase.from('contas').select('saldo').eq('id', t.conta_id).single()
    if (conta) {
      const novoSaldo = t.tipo==='receita' ? conta.saldo - t.valor : conta.saldo + t.valor
      await supabase.from('contas').update({ saldo: novoSaldo }).eq('id', t.conta_id)
    }
    await supabase.from('transacoes').delete().eq('id', t.id)
    fetchData()
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

  const filtradas = transacoes.filter(t => {
    const d = new Date(t.data+'T12:00:00')
    const matchMes = d.getMonth()===filtroMes && d.getFullYear()===filtroAno
    const matchTipo = filtroTipo==='todos' || t.tipo===filtroTipo
    const matchBusca = t.descricao.toLowerCase().includes(busca.toLowerCase())
    return matchMes && matchTipo && matchBusca
  })

  const totalReceitas = filtradas.filter(t=>t.tipo==='receita').reduce((a,t)=>a+t.valor,0)
  const totalDespesas = filtradas.filter(t=>t.tipo==='despesa').reduce((a,t)=>a+t.valor,0)

  const anos = Array.from(new Set(transacoes.map(t => new Date(t.data+'T12:00:00').getFullYear()))).sort((a,b)=>b-a)
  if (!anos.includes(filtroAno)) anos.unshift(filtroAno)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-primary)' }}>Transações</h1>
          <p className="mt-1" style={{ color:'var(--text-secondary)' }}>Receitas e despesas</p>
        </div>
        <button onClick={()=>{ setEditando(null); setShowModal(true) }} disabled={contas.length===0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition disabled:opacity-50">
          <Plus className="w-4 h-4"/> Nova Transação
        </button>
      </div>

      {contas.length===0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 rounded-xl px-4 py-3 text-sm mb-6">
          Cadastre pelo menos uma conta antes de adicionar transações.
        </div>
      )}

      {/* Filtro de mês */}
      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <select value={filtroMes} onChange={e=>setFiltroMes(parseInt(e.target.value))}
          className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
          style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
          {meses.map((m,i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={filtroAno} onChange={e=>setFiltroAno(parseInt(e.target.value))}
          className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
          style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Total Receitas', value:fmt(totalReceitas), color:'text-emerald-500' },
          { label:'Total Despesas', value:fmt(totalDespesas), color:'text-red-400' },
          { label:'Balanço', value:fmt(totalReceitas-totalDespesas), color:totalReceitas-totalDespesas>=0?'text-emerald-500':'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
            <p className="text-xs" style={{ color:'var(--text-secondary)' }}>{label}</p>
            <p className={`font-bold text-lg mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'var(--text-muted)' }}/>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar transação..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
            style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-primary)' }}/>
        </div>
        {['todos','receita','despesa'].map(f => (
          <button key={f} onClick={()=>setFiltroTipo(f)}
            className={`px-4 py-2.5 rounded-xl text-sm transition border ${filtroTipo===f?'bg-emerald-500/20 text-emerald-500 border-emerald-500/40':''}`}
            style={filtroTipo!==f?{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>
            {f==='todos'?'Todos':f==='receita'?'Receitas':'Despesas'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin"/></div>
      ) : filtradas.length===0 ? (
        <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          <ArrowDownCircle className="w-12 h-12 mx-auto mb-4" style={{ color:'var(--text-muted)' }}/>
          <p style={{ color:'var(--text-secondary)' }}>Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          {filtradas.map((t,i) => (
            <div key={t.id} className={`flex items-center justify-between px-5 py-4 ${i!==filtradas.length-1?'border-b':''}`} style={{ borderColor:'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.tipo==='receita'?'bg-emerald-500/10':t.tipo==='transferencia'?'bg-blue-500/10':'bg-red-500/10'}`}>
                  {t.tipo==='receita' ? <ArrowUpCircle className="w-5 h-5 text-emerald-500"/>
                    : t.tipo==='transferencia' ? <ArrowLeftRight className="w-5 h-5 text-blue-400"/>
                    : <ArrowDownCircle className="w-5 h-5 text-red-400"/>}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{t.descricao}</p>
                  <p className="text-xs" style={{ color:'var(--text-muted)' }}>
                    {t.categorias?.nome && <span>{t.categorias.nome} · </span>}
                    {t.contas?.nome && <span>{t.contas.nome} · </span>}
                    {new Date(t.data+'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-semibold ${t.tipo==='receita'?'text-emerald-500':t.tipo==='transferencia'?'text-blue-400':'text-red-400'}`}>
                  {t.tipo==='receita'?'+':t.tipo==='transferencia'?'⇄':'-'}{fmt(t.valor)}
                </p>
                {t.tipo!=='transferencia' && (
                  <>
                    <button onClick={()=>{ setEditando(t); setShowModal(true) }}
                      className="p-1.5 rounded-lg transition hover:bg-emerald-500/10" style={{ color:'var(--text-secondary)' }}>
                      <Pencil className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={()=>handleDelete(t)}
                      className="p-1.5 rounded-lg transition hover:bg-red-500/10 hover:text-red-400" style={{ color:'var(--text-secondary)' }}>
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <Modal onClose={()=>setShowModal(false)} onSave={()=>{ setShowModal(false); fetchData() }} contas={contas} initial={editando}/>}
    </div>
  )
}
