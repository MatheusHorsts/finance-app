'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Target, X, Loader2, Trash2, Pencil, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react'

type Objetivo = {
  id: string; nome: string; descricao: string; valor_meta: number
  valor_atual: number; prazo: string; cor: string; status: string
}
type Movimento = { id: string; tipo: string; valor: number; descricao: string; data: string }

const cores = ['#10b981','#6366f1','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316']

function ModalObjetivo({ onClose, onSave, initial }: { onClose:()=>void; onSave:()=>void; initial?:Objetivo|null }) {
  const supabase = createClient()
  const [nome, setNome] = useState(initial?.nome||'')
  const [descricao, setDescricao] = useState(initial?.descricao||'')
  const [valorMeta, setValorMeta] = useState(initial?.valor_meta?.toString()||'')
  const [prazo, setPrazo] = useState(initial?.prazo||'')
  const [cor, setCor] = useState(initial?.cor||'#10b981')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!nome||!valorMeta) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { nome, descricao, valor_meta: parseFloat(valorMeta), prazo: prazo||null, cor, user_id: user!.id }
    if (initial) { await supabase.from('objetivos').update(payload).eq('id', initial.id) }
    else { await supabase.from('objetivos').insert(payload) }
    setLoading(false); onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>{initial?'Editar Objetivo':'Novo Objetivo'}</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Nome do objetivo</label>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Viagem, Carro, Reserva..."
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Descrição (opcional)</label>
            <input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Detalhes do objetivo..."
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Valor da meta (R$)</label>
            <input type="number" value={valorMeta} onChange={e=>setValorMeta(e.target.value)} placeholder="0,00" step="0.01"
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Prazo (opcional)</label>
            <input type="date" value={prazo} onChange={e=>setPrazo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Cor</label>
            <div className="flex gap-2 flex-wrap">
              {cores.map(c => (
                <button key={c} onClick={()=>setCor(c)} style={{ backgroundColor:c }}
                  className={`w-8 h-8 rounded-full transition ${cor===c?'ring-2 ring-emerald-500 ring-offset-2':''}`}/>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!nome||!valorMeta}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null}{initial?'Salvar':'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalMovimento({ objetivo, onClose, onSave }: { objetivo:Objetivo; onClose:()=>void; onSave:()=>void }) {
  const supabase = createClient()
  const [tipo, setTipo] = useState<'deposito'|'retirada'>('deposito')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSave = async () => {
    if (!valor) return
    const valorNum = parseFloat(valor)
    if (tipo==='retirada' && valorNum > objetivo.valor_atual) { setErro('Saldo insuficiente no objetivo.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('objetivos_movimentos').insert({ objetivo_id: objetivo.id, user_id: user!.id, tipo, valor: valorNum, descricao, data: new Date().toISOString().split('T')[0] })
    const novoValor = tipo==='deposito' ? objetivo.valor_atual + valorNum : objetivo.valor_atual - valorNum
    const novoStatus = novoValor >= objetivo.valor_meta ? 'concluido' : 'ativo'
    await supabase.from('objetivos').update({ valor_atual: novoValor, status: novoStatus }).eq('id', objetivo.id)
    setLoading(false); onSave()
  }

  const fmt = (v:number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>Movimentar — {objetivo.nome}</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <p className="text-sm mb-4" style={{ color:'var(--text-secondary)' }}>Saldo atual: <span className="font-semibold text-emerald-500">{fmt(objetivo.valor_atual)}</span></p>
        <div className="flex gap-2 mb-4">
          {(['deposito','retirada'] as const).map(t => (
            <button key={t} onClick={()=>{ setTipo(t); setErro('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                tipo===t ? t==='deposito'?'bg-emerald-500/20 text-emerald-500 border-emerald-500/40':'bg-red-500/20 text-red-400 border-red-500/40' : ''}`}
              style={tipo!==t?{ borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>
              {t==='deposito'?'↑ Depositar':'↓ Retirar'}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Valor (R$)</label>
            <input type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" step="0.01"
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Descrição (opcional)</label>
            <input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Mesada, Sobra do mês..."
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/>
          </div>
          {erro && <p className="text-red-400 text-sm">{erro}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!valor}
            className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${tipo==='deposito'?'bg-emerald-500 hover:bg-emerald-400':'bg-red-500 hover:bg-red-400'}`}>
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null}{tipo==='deposito'?'Depositar':'Retirar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalHistorico({ objetivo, onClose }: { objetivo:Objetivo; onClose:()=>void }) {
  const supabase = createClient()
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('objetivos_movimentos').select('*').eq('objetivo_id', objetivo.id).order('created_at', { ascending:false })
      .then(({ data }) => { setMovimentos(data||[]); setLoading(false) })
  }, [])

  const fmt = (v:number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border max-h-[80vh] flex flex-col" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>Histórico — {objetivo.nome}</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-emerald-500 animate-spin"/></div>
          : movimentos.length===0 ? <p className="text-center py-8 text-sm" style={{ color:'var(--text-muted)' }}>Nenhuma movimentação</p>
          : movimentos.map((m,i) => (
            <div key={m.id} className={`flex items-center justify-between py-3 ${i!==movimentos.length-1?'border-b':''}`} style={{ borderColor:'var(--border)' }}>
              <div className="flex items-center gap-3">
                {m.tipo==='deposito' ? <ArrowUpCircle className="w-5 h-5 text-emerald-500"/> : <ArrowDownCircle className="w-5 h-5 text-red-400"/>}
                <div>
                  <p className="text-sm" style={{ color:'var(--text-primary)' }}>{m.descricao||( m.tipo==='deposito'?'Depósito':'Retirada')}</p>
                  <p className="text-xs" style={{ color:'var(--text-muted)' }}>{new Date(m.data+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <p className={`font-semibold text-sm ${m.tipo==='deposito'?'text-emerald-500':'text-red-400'}`}>
                {m.tipo==='deposito'?'+':'-'}{fmt(m.valor)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ObjetivosPage() {
  const supabase = createClient()
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Objetivo|null>(null)
  const [movimentando, setMovimentando] = useState<Objetivo|null>(null)
  const [historico, setHistorico] = useState<Objetivo|null>(null)

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('objetivos').select('*').eq('user_id', user!.id).order('created_at')
    setObjetivos(data||[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id:string) => {
    if (!confirm('Excluir este objetivo?')) return
    await supabase.from('objetivos').delete().eq('id', id)
    fetchData()
  }

  const fmt = (v:number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

  const totalGuardado = objetivos.reduce((a,o)=>a+o.valor_atual, 0)
  const totalMeta = objetivos.reduce((a,o)=>a+o.valor_meta, 0)
  const concluidos = objetivos.filter(o=>o.status==='concluido').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-primary)' }}>Objetivos</h1>
          <p className="mt-1" style={{ color:'var(--text-secondary)' }}>Metas financeiras e progresso</p>
        </div>
        <button onClick={()=>{ setEditando(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
          <Plus className="w-4 h-4"/> Novo Objetivo
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Total Guardado', value:fmt(totalGuardado), color:'text-emerald-500' },
          { label:'Total das Metas', value:fmt(totalMeta), color:'text-blue-400' },
          { label:'Concluídos', value:`${concluidos} de ${objetivos.length}`, color:'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
            <p className="text-xs" style={{ color:'var(--text-secondary)' }}>{label}</p>
            <p className={`font-bold text-xl mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin"/></div>
      ) : objetivos.length===0 ? (
        <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          <Target className="w-12 h-12 mx-auto mb-4" style={{ color:'var(--text-muted)' }}/>
          <p style={{ color:'var(--text-secondary)' }}>Nenhum objetivo cadastrado</p>
          <p className="text-sm mt-1" style={{ color:'var(--text-muted)' }}>Clique em "Novo Objetivo" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objetivos.map(obj => {
            const pct = Math.min((obj.valor_atual/obj.valor_meta)*100, 100)
            const faltam = Math.max(obj.valor_meta - obj.valor_atual, 0)
            const concluido = obj.status==='concluido'
            const hoje = new Date()
            const prazoDate = obj.prazo ? new Date(obj.prazo+'T12:00:00') : null
            const diasRestantes = prazoDate ? Math.ceil((prazoDate.getTime()-hoje.getTime())/(1000*60*60*24)) : null

            // Estimativa mensal necessária
            let mensalNecessario = null
            if (diasRestantes && diasRestantes > 0 && faltam > 0) {
              const mesesRestantes = diasRestantes / 30
              mensalNecessario = faltam / mesesRestantes
            }

            return (
              <div key={obj.id} className={`rounded-2xl p-5 border ${concluido?'opacity-80':''}`} style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor:obj.cor+'22' }}>
                      {concluido ? <TrendingUp className="w-5 h-5" style={{ color:obj.cor }}/> : <Target className="w-5 h-5" style={{ color:obj.cor }}/>}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color:'var(--text-primary)' }}>{obj.nome}</p>
                      {obj.descricao && <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{obj.descricao}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={()=>setEditando(obj)||setShowModal(true)}
                      className="p-1.5 rounded-lg transition hover:bg-emerald-500/10" style={{ color:'var(--text-secondary)' }}>
                      <Pencil className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={()=>handleDelete(obj.id)}
                      className="p-1.5 rounded-lg transition hover:bg-red-500/10 hover:text-red-400" style={{ color:'var(--text-secondary)' }}>
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </div>

                {/* Progresso */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color:'var(--text-secondary)' }}>
                      <span className="font-semibold" style={{ color:'var(--text-primary)' }}>{fmt(obj.valor_atual)}</span> de {fmt(obj.valor_meta)}
                    </span>
                    <span className="font-semibold" style={{ color:obj.cor }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor:'var(--bg-input)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor:obj.cor }}/>
                  </div>
                </div>

                {/* Info */}
                <div className="flex justify-between items-center text-xs mb-4" style={{ color:'var(--text-muted)' }}>
                  <span>Falta: <span className="font-medium text-red-400">{fmt(faltam)}</span></span>
                  {prazoDate && (
                    <span className={diasRestantes && diasRestantes < 30 ? 'text-yellow-500 font-medium' : ''}>
                      {diasRestantes && diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Prazo vencido'}
                    </span>
                  )}
                </div>

                {mensalNecessario && !concluido && (
                  <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor:'var(--bg-input)', color:'var(--text-secondary)' }}>
                    💡 Poupe <span className="font-semibold text-emerald-500">{fmt(mensalNecessario)}/mês</span> para alcançar no prazo
                  </p>
                )}

                {concluido && (
                  <p className="text-xs mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium text-center">
                    🎉 Objetivo concluído!
                  </p>
                )}

                {/* Ações */}
                <div className="flex gap-2">
                  {!concluido && (
                    <button onClick={()=>setMovimentando(obj)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium transition">
                      + Depositar / Retirar
                    </button>
                  )}
                  <button onClick={()=>setHistorico(obj)}
                    className="px-3 py-2 rounded-xl text-xs font-medium border transition"
                    style={{ borderColor:'var(--border)', color:'var(--text-secondary)', backgroundColor:'var(--bg-input)' }}>
                    Histórico
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <ModalObjetivo onClose={()=>{ setShowModal(false); setEditando(null) }} onSave={()=>{ setShowModal(false); setEditando(null); fetchData() }} initial={editando}/>}
      {movimentando && <ModalMovimento objetivo={movimentando} onClose={()=>setMovimentando(null)} onSave={()=>{ setMovimentando(null); fetchData() }}/>}
      {historico && <ModalHistorico objetivo={historico} onClose={()=>setHistorico(null)}/>}
    </div>
  )
}
