'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Wallet, Pencil, Trash2, X, Loader2, Building2, PiggyBank, Briefcase, ArrowLeftRight } from 'lucide-react'

type Conta = { id: string; nome: string; tipo: string; saldo: number; cor: string }

const tipos = [
  { value: 'corrente', label: 'Conta Corrente', icon: Building2 },
  { value: 'poupanca', label: 'Poupança', icon: PiggyBank },
  { value: 'carteira', label: 'Carteira', icon: Wallet },
  { value: 'outro', label: 'Outro', icon: Briefcase },
]
const cores = ['#10b981','#6366f1','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6']
const tipoLabel: Record<string,string> = { corrente:'Conta Corrente', poupanca:'Poupança', carteira:'Carteira', outro:'Outro' }

function ModalConta({ onClose, onSave, initial }: { onClose:()=>void; onSave:()=>void; initial?:Conta|null }) {
  const supabase = createClient()
  const [nome, setNome] = useState(initial?.nome||'')
  const [tipo, setTipo] = useState(initial?.tipo||'corrente')
  const [saldo, setSaldo] = useState(initial?.saldo?.toString()||'0')
  const [cor, setCor] = useState(initial?.cor||'#10b981')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!nome.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { nome, tipo, saldo: parseFloat(saldo)||0, cor, user_id: user!.id }
    if (initial) { await supabase.from('contas').update(payload).eq('id', initial.id) }
    else { await supabase.from('contas').insert(payload) }
    setLoading(false); onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>{initial?'Editar Conta':'Nova Conta'}</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Nome da conta</label>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Nubank, Bradesco..."
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {tipos.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={()=>setTipo(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${tipo===value?'border-emerald-500 bg-emerald-500/10 text-emerald-500':'border-slate-300 text-slate-500 hover:border-slate-400'}`}
                  style={tipo!==value?{ borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>
                  <Icon className="w-4 h-4"/> {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Saldo inicial (R$)</label>
            <input type="number" value={saldo} onChange={e=>setSaldo(e.target.value)} step="0.01"
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Cor</label>
            <div className="flex gap-2 flex-wrap">
              {cores.map(c => (
                <button key={c} onClick={()=>setCor(c)} style={{ backgroundColor:c }}
                  className={`w-8 h-8 rounded-full transition ${cor===c?'ring-2 ring-emerald-500 ring-offset-2':''}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm transition"
            style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!nome.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null}
            {initial?'Salvar':'Criar Conta'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalTransferencia({ contas, onClose, onSave }: { contas:Conta[]; onClose:()=>void; onSave:()=>void }) {
  const supabase = createClient()
  const [origem, setOrigem] = useState(contas[0]?.id||'')
  const [destino, setDestino] = useState(contas[1]?.id||contas[0]?.id||'')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('Transferência')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSave = async () => {
    if (!valor || origem === destino) { setErro(origem===destino?'Selecione contas diferentes.':'Informe o valor.'); return }
    const valorNum = parseFloat(valor)
    const contaOrigem = contas.find(c => c.id === origem)
    if (contaOrigem && contaOrigem.saldo < valorNum) { setErro('Saldo insuficiente na conta de origem.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Atualiza saldos
    const cOrigem = contas.find(c => c.id === origem)!
    const cDestino = contas.find(c => c.id === destino)!
    await supabase.from('contas').update({ saldo: cOrigem.saldo - valorNum }).eq('id', origem)
    await supabase.from('contas').update({ saldo: cDestino.saldo + valorNum }).eq('id', destino)

    // Registra como transações
    const hoje = new Date().toISOString().split('T')[0]
    await supabase.from('transacoes').insert([
      { user_id: user!.id, conta_id: origem, tipo: 'transferencia', descricao: `${descricao} → ${cDestino.nome}`, valor: valorNum, data: hoje },
      { user_id: user!.id, conta_id: destino, tipo: 'transferencia', descricao: `${descricao} ← ${cOrigem.nome}`, valor: valorNum, data: hoje },
    ])

    setLoading(false); onSave()
  }

  const contaOrigem = contas.find(c => c.id === origem)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>Transferência entre Contas</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Conta de origem</label>
            <select value={origem} onChange={e=>setOrigem(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome} — {fmt(c.saldo)}</option>)}
            </select>
          </div>
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-emerald-500"/>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Conta de destino</label>
            <select value={destino} onChange={e=>setDestino(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome} — {fmt(c.saldo)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Valor (R$)</label>
            <input type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" step="0.01"
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }} />
            {contaOrigem && <p className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>Saldo disponível: {fmt(contaOrigem.saldo)}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Descrição</label>
            <input value={descricao} onChange={e=>setDescricao(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }} />
          </div>
          {erro && <p className="text-red-400 text-sm">{erro}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm transition"
            style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!valor}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null}
            Transferir
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContasPage() {
  const supabase = createClient()
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTransf, setShowTransf] = useState(false)
  const [editando, setEditando] = useState<Conta|null>(null)

  const fetchContas = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('contas').select('*').eq('user_id', user!.id).order('created_at')
    setContas(data||[])
    setLoading(false)
  }

  useEffect(() => { fetchContas() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta conta?')) return
    await supabase.from('contas').delete().eq('id', id)
    fetchContas()
  }

  const saldoTotal = contas.reduce((acc,c) => acc+c.saldo, 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-primary)' }}>Contas</h1>
          <p className="mt-1" style={{ color:'var(--text-secondary)' }}>Gerencie suas contas bancárias e saldos</p>
        </div>
        <div className="flex gap-2">
          {contas.length >= 2 && (
            <button onClick={()=>setShowTransf(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition"
              style={{ borderColor:'var(--border)', color:'var(--text-secondary)', backgroundColor:'var(--bg-card)' }}>
              <ArrowLeftRight className="w-4 h-4"/> Transferir
            </button>
          )}
          <button onClick={()=>{ setEditando(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
            <Plus className="w-4 h-4"/> Nova Conta
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-6 mb-6 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <p className="text-sm" style={{ color:'var(--text-secondary)' }}>Saldo Total</p>
        <p className="text-3xl font-bold text-emerald-500 mt-1">{fmt(saldoTotal)}</p>
        <p className="text-sm mt-1" style={{ color:'var(--text-muted)' }}>{contas.length} {contas.length===1?'conta':'contas'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin"/></div>
      ) : contas.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          <Wallet className="w-12 h-12 mx-auto mb-4" style={{ color:'var(--text-muted)' }}/>
          <p style={{ color:'var(--text-secondary)' }}>Nenhuma conta cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contas.map(conta => (
            <div key={conta.id} className="rounded-2xl p-5 border flex flex-col gap-4" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor:conta.cor+'22' }}>
                    <Wallet className="w-5 h-5" style={{ color:conta.cor }}/>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color:'var(--text-primary)' }}>{conta.nome}</p>
                    <p className="text-xs" style={{ color:'var(--text-muted)' }}>{tipoLabel[conta.tipo]||conta.tipo}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>{ setEditando(conta); setShowModal(true) }}
                    className="p-2 rounded-lg transition hover:bg-emerald-500/10" style={{ color:'var(--text-secondary)' }}>
                    <Pencil className="w-4 h-4"/>
                  </button>
                  <button onClick={()=>handleDelete(conta.id)}
                    className="p-2 rounded-lg transition hover:bg-red-500/10 hover:text-red-400" style={{ color:'var(--text-secondary)' }}>
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color:'var(--text-muted)' }}>Saldo</p>
                <p className={`text-xl font-bold ${conta.saldo>=0?'text-emerald-500':'text-red-400'}`}>{fmt(conta.saldo)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ModalConta onClose={()=>setShowModal(false)} onSave={()=>{ setShowModal(false); fetchContas() }} initial={editando}/>}
      {showTransf && <ModalTransferencia contas={contas} onClose={()=>setShowTransf(false)} onSave={()=>{ setShowTransf(false); fetchContas() }}/>}
    </div>
  )
}
