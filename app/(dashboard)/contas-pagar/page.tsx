'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, CalendarClock, X, Loader2, CheckCircle, Clock, AlertTriangle, Trash2, Pencil } from 'lucide-react'

type ContaPagar = { id:string; descricao:string; valor:number; vencimento:string; status:string; recorrente:boolean }

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function Modal({ onClose, onSave, initial }: { onClose:()=>void; onSave:()=>void; initial?:ContaPagar|null }) {
  const supabase = createClient()
  const [descricao, setDescricao] = useState(initial?.descricao||'')
  const [valor, setValor] = useState(initial?.valor?.toString()||'')
  const [vencimento, setVencimento] = useState(initial?.vencimento||new Date().toISOString().split('T')[0])
  const [recorrente, setRecorrente] = useState(initial?.recorrente||false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!descricao.trim()||!valor) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { descricao, valor:parseFloat(valor), vencimento, recorrente, user_id:user!.id, status:'pendente' }
    if (initial) { await supabase.from('contas_pagar').update({ descricao, valor:parseFloat(valor), vencimento, recorrente }).eq('id', initial.id) }
    else { await supabase.from('contas_pagar').insert(payload) }
    setLoading(false); onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>{initial?'Editar Conta':'Nova Conta a Pagar'}</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          {[
            { label:'Descrição', el:<input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Aluguel, Internet..." className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
            { label:'Valor (R$)', el:<input type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
            { label:'Vencimento', el:<input type="date" value={vencimento} onChange={e=>setVencimento(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
          ].map(({ label, el }) => (
            <div key={label}><label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>{label}</label>{el}</div>
          ))}
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={()=>setRecorrente(!recorrente)} className={`w-11 h-6 rounded-full transition relative ${recorrente?'bg-emerald-500':'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${recorrente?'left-6':'left-1'}`}/>
            </div>
            <span className="text-sm" style={{ color:'var(--text-secondary)' }}>Recorrente (todo mês)</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!descricao||!valor}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null}{initial?'Salvar':'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getStatus(vencimento:string, status:string) {
  if (status==='pago') return { label:'Pago', color:'text-emerald-500', bg:'bg-emerald-500/10', icon:CheckCircle }
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const venc = new Date(vencimento+'T12:00:00')
  const diff = Math.ceil((venc.getTime()-hoje.getTime())/(1000*60*60*24))
  if (diff<0) return { label:'Vencido', color:'text-red-400', bg:'bg-red-500/10', icon:AlertTriangle }
  if (diff<=3) return { label:`Vence em ${diff}d`, color:'text-yellow-500', bg:'bg-yellow-500/10', icon:AlertTriangle }
  return { label:'Pendente', color:'text-slate-400', bg:'bg-slate-500/10', icon:Clock }
}

export default function ContasPagarPage() {
  const supabase = createClient()
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<ContaPagar|null>(null)
  const [filtro, setFiltro] = useState('todos')
  const hoje = new Date()
  const [filtroMes, setFiltroMes] = useState(hoje.getMonth())
  const [filtroAno, setFiltroAno] = useState(hoje.getFullYear())

  const fetchContas = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('contas_pagar').select('*').eq('user_id', user!.id).order('vencimento')
    setContas(data||[])
    setLoading(false)
  }

  useEffect(() => { fetchContas() }, [])

  const marcarPago = async (id:string, statusAtual:string) => {
    await supabase.from('contas_pagar').update({ status:statusAtual==='pago'?'pendente':'pago' }).eq('id', id)
    fetchContas()
  }

  const handleDelete = async (id:string) => {
    if (!confirm('Excluir esta conta?')) return
    await supabase.from('contas_pagar').delete().eq('id', id)
    fetchContas()
  }

  const fmt = (v:number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

  const anos = Array.from(new Set(contas.map(c => new Date(c.vencimento+'T12:00:00').getFullYear()))).sort((a,b)=>b-a)
  if (!anos.includes(filtroAno)) anos.unshift(filtroAno)

  const filtradas = contas.filter(c => {
    const d = new Date(c.vencimento+'T12:00:00')
    const matchMes = d.getMonth()===filtroMes && d.getFullYear()===filtroAno
    const matchStatus = filtro==='todos' || (filtro==='pendente'&&c.status!=='pago') || (filtro==='pago'&&c.status==='pago')
    return matchMes && matchStatus
  })

  const totalPendente = filtradas.filter(c=>c.status!=='pago').reduce((a,c)=>a+c.valor,0)
  const totalPago = filtradas.filter(c=>c.status==='pago').reduce((a,c)=>a+c.valor,0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-primary)' }}>Contas a Pagar</h1>
          <p className="mt-1" style={{ color:'var(--text-secondary)' }}>Vencimentos e pagamentos</p>
        </div>
        <button onClick={()=>{ setEditando(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
          <Plus className="w-4 h-4"/> Nova Conta
        </button>
      </div>

      {/* Filtro mês */}
      <div className="flex gap-3 mb-6">
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
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-4 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          <p className="text-xs" style={{ color:'var(--text-secondary)' }}>A Pagar</p>
          <p className="text-red-400 font-bold text-xl mt-1">{fmt(totalPendente)}</p>
          <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>{filtradas.filter(c=>c.status!=='pago').length} pendentes</p>
        </div>
        <div className="rounded-2xl p-4 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          <p className="text-xs" style={{ color:'var(--text-secondary)' }}>Pago no mês</p>
          <p className="text-emerald-500 font-bold text-xl mt-1">{fmt(totalPago)}</p>
          <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>{filtradas.filter(c=>c.status==='pago').length} pagos</p>
        </div>
      </div>

      {/* Filtros status */}
      <div className="flex gap-2 mb-4">
        {[['todos','Todos'],['pendente','Pendentes'],['pago','Pagos']].map(([v,l]) => (
          <button key={v} onClick={()=>setFiltro(v)}
            className={`px-4 py-2 rounded-xl text-sm transition border ${filtro===v?'bg-emerald-500/20 text-emerald-500 border-emerald-500/40':''}`}
            style={filtro!==v?{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>
            {l}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin"/></div>
      ) : filtradas.length===0 ? (
        <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          <CalendarClock className="w-12 h-12 mx-auto mb-4" style={{ color:'var(--text-muted)' }}/>
          <p style={{ color:'var(--text-secondary)' }}>Nenhuma conta encontrada</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          {filtradas.map((c,i) => {
            const st = getStatus(c.vencimento, c.status)
            const Icon = st.icon
            return (
              <div key={c.id} className={`flex items-center justify-between px-5 py-4 ${i!==filtradas.length-1?'border-b':''} ${c.status==='pago'?'opacity-60':''}`} style={{ borderColor:'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <button onClick={()=>marcarPago(c.id, c.status)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${st.bg} hover:opacity-80`}>
                    <Icon className={`w-5 h-5 ${st.color}`}/>
                  </button>
                  <div>
                    <p className={`text-sm font-medium ${c.status==='pago'?'line-through':''}`} style={{ color:c.status==='pago'?'var(--text-muted)':'var(--text-primary)' }}>{c.descricao}</p>
                    <p className="text-xs" style={{ color:'var(--text-muted)' }}>
                      Vence {new Date(c.vencimento+'T12:00:00').toLocaleDateString('pt-BR')}
                      {c.recorrente&&' · Recorrente'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-sm" style={{ color:c.status==='pago'?'var(--text-muted)':'var(--text-primary)' }}>{fmt(c.valor)}</p>
                  <span className={`text-xs px-2 py-1 rounded-lg ${st.bg} ${st.color}`}>{st.label}</span>
                  <button onClick={()=>{ setEditando(c); setShowModal(true) }} className="p-1.5 rounded-lg transition hover:bg-emerald-500/10" style={{ color:'var(--text-secondary)' }}>
                    <Pencil className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={()=>handleDelete(c.id)} className="p-1.5 rounded-lg transition hover:bg-red-500/10 hover:text-red-400" style={{ color:'var(--text-secondary)' }}>
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <Modal onClose={()=>setShowModal(false)} onSave={()=>{ setShowModal(false); fetchContas() }} initial={editando}/>}
    </div>
  )
}
