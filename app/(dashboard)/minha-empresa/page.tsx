'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Plus, X, Loader2, Pencil, Trash2, CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react'

type Empresa = { id:string; nome:string; cnpj:string; tipo:string; teto_faturamento:number }
type Faturamento = { id:string; descricao:string; valor:number; data:string; ano:number }
type ContaPagar = { id:string; descricao:string; valor:number; vencimento:string; status:string; recorrente:boolean }

const tiposEmpresa = ['MEI','ME','EPP','LTDA','SA','Outro']
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const anoAtual = new Date().getFullYear()
const mesAtual = new Date().getMonth()

function ModalEmpresa({ onClose, onSave, initial }: { onClose:()=>void; onSave:()=>void; initial?:Empresa|null }) {
  const supabase = createClient()
  const [nome, setNome] = useState(initial?.nome||'')
  const [cnpj, setCnpj] = useState(initial?.cnpj||'')
  const [tipo, setTipo] = useState(initial?.tipo||'MEI')
  const [teto, setTeto] = useState(initial?.teto_faturamento?.toString()||'81000')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!nome) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { nome, cnpj, tipo, teto_faturamento: parseFloat(teto)||81000, user_id: user!.id }
    if (initial) { await supabase.from('empresas').update(payload).eq('id', initial.id) }
    else { await supabase.from('empresas').insert(payload) }
    setLoading(false); onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>{initial?'Editar Empresa':'Nova Empresa'}</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Nome da empresa</label>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Minha Empresa LTDA" className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/></div>
          <div><label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>CNPJ</label>
            <input value={cnpj} onChange={e=>setCnpj(e.target.value)} placeholder="XX.XXX.XXX/0001-XX" className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/></div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {tiposEmpresa.map(t => (
                <button key={t} onClick={()=>{ setTipo(t); if(t==='MEI') setTeto('81000') }}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition ${tipo===t?'bg-emerald-500/20 text-emerald-500 border-emerald-500/40':''}`}
                  style={tipo!==t?{ borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>{t}</button>
              ))}
            </div>
          </div>
          <div><label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Teto de faturamento anual (R$)</label>
            <input type="number" value={teto} onChange={e=>setTeto(e.target.value)} placeholder="81000" className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!nome} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null}{initial?'Salvar':'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalFaturamento({ empresaId, onClose, onSave }: { empresaId:string; onClose:()=>void; onSave:()=>void }) {
  const supabase = createClient()
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!descricao||!valor) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ano = new Date(data+'T12:00:00').getFullYear()
    await supabase.from('empresa_faturamentos').insert({ empresa_id: empresaId, user_id: user!.id, descricao, valor: parseFloat(valor), data, ano })
    setLoading(false); onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>Novo Faturamento</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          {[
            { label:'Descrição', el:<input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Nota fiscal #001..." className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
            { label:'Valor (R$)', el:<input type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
            { label:'Data', el:<input type="date" value={data} onChange={e=>setData(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/> },
          ].map(({ label, el }) => <div key={label}><label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>{label}</label>{el}</div>)}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!descricao||!valor} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null}Registrar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalContaPagar({ empresaId, onClose, onSave, initial }: { empresaId:string; onClose:()=>void; onSave:()=>void; initial?:ContaPagar|null }) {
  const supabase = createClient()
  const [descricao, setDescricao] = useState(initial?.descricao||'')
  const [valor, setValor] = useState(initial?.valor?.toString()||'')
  const [vencimento, setVencimento] = useState(initial?.vencimento||new Date().toISOString().split('T')[0])
  const [recorrente, setRecorrente] = useState(initial?.recorrente||false)
  const [repeticoes, setRepeticoes] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!descricao||!valor) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (initial) {
      await supabase.from('empresa_contas_pagar').update({ descricao, valor: parseFloat(valor), vencimento, recorrente }).eq('id', initial.id)
    } else if (recorrente && repeticoes > 1) {
      // Gera múltiplas contas
      const baseDate = new Date(vencimento + 'T12:00:00')
      const inserts = Array.from({ length: repeticoes }, (_, i) => {
        const d = new Date(baseDate)
        d.setMonth(d.getMonth() + i)
        const ano = d.getFullYear()
        const mes = String(d.getMonth() + 1).padStart(2, '0')
        const dia = String(d.getDate()).padStart(2, '0')
        return {
          empresa_id: empresaId,
          user_id: user!.id,
          descricao: `${descricao} (${i + 1}/${repeticoes})`,
          valor: parseFloat(valor),
          vencimento: `${ano}-${mes}-${dia}`,
          recorrente: true,
          status: 'pendente'
        }
      })
      await supabase.from('empresa_contas_pagar').insert(inserts)
    } else {
      await supabase.from('empresa_contas_pagar').insert({ empresa_id: empresaId, user_id: user!.id, descricao, valor: parseFloat(valor), vencimento, recorrente, status: 'pendente' })
    }
    setLoading(false); onSave()
  }

  // Preview das datas geradas
  const previewDatas = recorrente && repeticoes > 1 ? Array.from({ length: Math.min(repeticoes, 4) }, (_, i) => {
    const d = new Date(vencimento + 'T12:00:00')
    d.setMonth(d.getMonth() + i)
    return d.toLocaleDateString('pt-BR')
  }) : []

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md p-6 border max-h-[90vh] overflow-y-auto" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg" style={{ color:'var(--text-primary)' }}>{initial?'Editar':'Nova'} Conta a Pagar</h2>
          <button onClick={onClose} style={{ color:'var(--text-secondary)' }}><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Descrição</label>
            <input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: DAS MEI, Contador..." className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/></div>
          <div><label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>Valor (R$)</label>
            <input type="number" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" step="0.01" className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/></div>
          <div><label className="block text-sm mb-1.5" style={{ color:'var(--text-secondary)' }}>1º Vencimento</label>
            <input type="date" value={vencimento} onChange={e=>setVencimento(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-primary)' }}/></div>

          {/* Toggle recorrente */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={()=>setRecorrente(!recorrente)} className={`w-11 h-6 rounded-full transition relative ${recorrente?'bg-emerald-500':'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${recorrente?'left-6':'left-1'}`}/>
            </div>
            <span className="text-sm" style={{ color:'var(--text-secondary)' }}>Recorrente (gerar múltiplas cobranças)</span>
          </label>

          {/* Box de repetições — aparece só quando recorrente ativo */}
          {recorrente && !initial && (
            <div className="rounded-xl p-4 border" style={{ backgroundColor:'var(--bg-input)', borderColor:'var(--border)' }}>
              <label className="block text-sm font-medium mb-3" style={{ color:'var(--text-primary)' }}>
                Quantas vezes repetir? <span className="text-emerald-500">{repeticoes}x</span>
              </label>
              {/* Botões de 1 a 12 */}
              <div className="grid grid-cols-6 gap-2 mb-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={()=>setRepeticoes(n)}
                    className={`py-2 rounded-lg text-sm font-medium border transition ${repeticoes===n?'bg-emerald-500 text-white border-emerald-500':'border-slate-300'}`}
                    style={repeticoes!==n?{ borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>
                    {n}x
                  </button>
                ))}
              </div>

              {/* Preview das datas */}
              {repeticoes > 1 && (
                <div className="mt-2">
                  <p className="text-xs font-medium mb-2" style={{ color:'var(--text-secondary)' }}>Preview das datas geradas:</p>
                  <div className="space-y-1">
                    {previewDatas.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color:'var(--text-secondary)' }}>
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-medium">{i+1}</span>
                        {descricao||'Conta'} ({i+1}/{repeticoes}) — vence {d}
                      </div>
                    ))}
                    {repeticoes > 4 && <p className="text-xs" style={{ color:'var(--text-muted)' }}>...e mais {repeticoes - 4} conta(s)</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor:'var(--border)', color:'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!descricao||!valor}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:null}
            {recorrente && repeticoes > 1 ? `Gerar ${repeticoes} contas` : initial?'Salvar':'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getStatusConta(vencimento:string, status:string) {
  if (status==='pago') return { label:'Pago', color:'text-emerald-500', bg:'bg-emerald-500/10', icon:CheckCircle }
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const venc = new Date(vencimento+'T12:00:00')
  const diff = Math.ceil((venc.getTime()-hoje.getTime())/(1000*60*60*24))
  if (diff<0) return { label:'Vencido', color:'text-red-400', bg:'bg-red-500/10', icon:AlertTriangle }
  if (diff<=3) return { label:`Vence em ${diff}d`, color:'text-yellow-500', bg:'bg-yellow-500/10', icon:AlertTriangle }
  return { label:'Pendente', color:'text-slate-400', bg:'bg-slate-500/10', icon:Clock }
}

export default function MinhaEmpresaPage() {
  const supabase = createClient()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa|null>(null)
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([])
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'faturamento'|'contas'>('faturamento')
  const [anoFiltro, setAnoFiltro] = useState(anoAtual)
  const [mesFiltroFat, setMesFiltroFat] = useState(-1) // -1 = todos os meses
  const [mesFiltroConta, setMesFiltroConta] = useState(mesAtual)
  const [anoFiltroConta, setAnoFiltroConta] = useState(anoAtual)
  const [showModalEmpresa, setShowModalEmpresa] = useState(false)
  const [showModalFat, setShowModalFat] = useState(false)
  const [showModalConta, setShowModalConta] = useState(false)
  const [editandoEmpresa, setEditandoEmpresa] = useState<Empresa|null>(null)
  const [editandoConta, setEditandoConta] = useState<ContaPagar|null>(null)

  const fetchData = async (empId?: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: emps } = await supabase.from('empresas').select('*').eq('user_id', user!.id).order('created_at')
    setEmpresas(emps||[])
    const emp = empId ? (emps||[]).find(e=>e.id===empId) : empresaSelecionada || (emps||[])[0]
    if (emp) {
      setEmpresaSelecionada(emp)
      const [{ data: fats },{ data: contas }] = await Promise.all([
        supabase.from('empresa_faturamentos').select('*').eq('empresa_id', emp.id).order('data', { ascending:false }),
        supabase.from('empresa_contas_pagar').select('*').eq('empresa_id', emp.id).order('vencimento'),
      ])
      setFaturamentos(fats||[])
      setContasPagar(contas||[])
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const selecionarEmpresa = async (emp: Empresa) => {
    setEmpresaSelecionada(emp)
    const [{ data: fats },{ data: contas }] = await Promise.all([
      supabase.from('empresa_faturamentos').select('*').eq('empresa_id', emp.id).order('data', { ascending:false }),
      supabase.from('empresa_contas_pagar').select('*').eq('empresa_id', emp.id).order('vencimento'),
    ])
    setFaturamentos(fats||[])
    setContasPagar(contas||[])
  }

  const marcarPago = async (id:string, statusAtual:string) => {
    await supabase.from('empresa_contas_pagar').update({ status: statusAtual==='pago'?'pendente':'pago' }).eq('id', id)
    fetchData()
  }

  const fmt = (v:number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

  // Filtros faturamento
  const fatsDoAno = faturamentos.filter(f => {
    const d = new Date(f.data+'T12:00:00')
    const matchAno = d.getFullYear() === anoFiltro
    const matchMes = mesFiltroFat === -1 || d.getMonth() === mesFiltroFat
    return matchAno && matchMes
  })
  const totalFaturadoAno = faturamentos.filter(f=>new Date(f.data+'T12:00:00').getFullYear()===anoFiltro).reduce((a,f)=>a+f.valor,0)
  const teto = empresaSelecionada?.teto_faturamento || 81000
  const pctTeto = Math.min((totalFaturadoAno/teto)*100, 100)
  const anos = Array.from(new Set(faturamentos.map(f=>new Date(f.data+'T12:00:00').getFullYear()))).sort((a,b)=>b-a)
  if (!anos.includes(anoFiltro)) anos.unshift(anoFiltro)

  // Filtros contas a pagar
  const contasFiltradas = contasPagar.filter(c => {
    const d = new Date(c.vencimento+'T12:00:00')
    return d.getMonth() === mesFiltroConta && d.getFullYear() === anoFiltroConta
  })
  const anosContas = Array.from(new Set(contasPagar.map(c=>new Date(c.vencimento+'T12:00:00').getFullYear()))).sort((a,b)=>b-a)
  if (!anosContas.includes(anoFiltroConta)) anosContas.unshift(anoFiltroConta)
  const totalPendente = contasFiltradas.filter(c=>c.status!=='pago').reduce((a,c)=>a+c.valor,0)
  const totalPago = contasFiltradas.filter(c=>c.status==='pago').reduce((a,c)=>a+c.valor,0)

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin"/></div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-primary)' }}>Minha Empresa</h1>
          <p className="mt-1" style={{ color:'var(--text-secondary)' }}>Faturamento, contas e dados empresariais</p>
        </div>
        <button onClick={()=>{ setEditandoEmpresa(null); setShowModalEmpresa(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
          <Plus className="w-4 h-4"/> Nova Empresa
        </button>
      </div>

      {empresas.length===0 ? (
        <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color:'var(--text-muted)' }}/>
          <p style={{ color:'var(--text-secondary)' }}>Nenhuma empresa cadastrada</p>
        </div>
      ) : (
        <>
          {empresas.length > 1 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {empresas.map(emp => (
                <button key={emp.id} onClick={()=>selecionarEmpresa(emp)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${empresaSelecionada?.id===emp.id?'bg-emerald-500/20 text-emerald-500 border-emerald-500/40':''}`}
                  style={empresaSelecionada?.id!==emp.id?{ borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>
                  {emp.nome}
                </button>
              ))}
            </div>
          )}

          {empresaSelecionada && (
            <>
              {/* Card empresa */}
              <div className="rounded-2xl p-5 border mb-6" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-emerald-500"/>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color:'var(--text-primary)' }}>{empresaSelecionada.nome}</h2>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-sm px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium">{empresaSelecionada.tipo}</span>
                        {empresaSelecionada.cnpj && <span className="text-sm" style={{ color:'var(--text-secondary)' }}>CNPJ: {empresaSelecionada.cnpj}</span>}
                        <span className="text-sm" style={{ color:'var(--text-secondary)' }}>Teto: {fmt(teto)}/ano</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>{ setEditandoEmpresa(empresaSelecionada); setShowModalEmpresa(true) }}
                    className="p-2 rounded-lg transition hover:bg-emerald-500/10" style={{ color:'var(--text-secondary)' }}>
                    <Pencil className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Abas */}
              <div className="flex gap-2 mb-6">
                {[['faturamento','Faturamento'],['contas','Contas a Pagar']].map(([v,l]) => (
                  <button key={v} onClick={()=>setAba(v as any)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${aba===v?'bg-emerald-500/20 text-emerald-500 border-emerald-500/40':''}`}
                    style={aba!==v?{ borderColor:'var(--border)', color:'var(--text-secondary)' }:{}}>{l}</button>
                ))}
              </div>

              {/* ABA FATURAMENTO */}
              {aba==='faturamento' && (
                <>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex gap-2">
                      <select value={anoFiltro} onChange={e=>setAnoFiltro(parseInt(e.target.value))}
                        className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
                        style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
                        {anos.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <select value={mesFiltroFat} onChange={e=>setMesFiltroFat(parseInt(e.target.value))}
                        className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
                        style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
                        <option value={-1}>Todos os meses</option>
                        {meses.map((m,i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                    </div>
                    <button onClick={()=>setShowModalFat(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
                      <Plus className="w-4 h-4"/> Registrar Faturamento
                    </button>
                  </div>

                  {/* Barra teto anual */}
                  <div className="rounded-2xl p-5 border mb-4" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500"/>
                        <span className="font-semibold" style={{ color:'var(--text-primary)' }}>Faturamento {anoFiltro}</span>
                      </div>
                      <span className={`text-sm font-semibold ${pctTeto>90?'text-red-400':pctTeto>70?'text-yellow-500':'text-emerald-500'}`}>{pctTeto.toFixed(1)}% do teto</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor:'var(--bg-input)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width:`${pctTeto}%`, backgroundColor:pctTeto>90?'#ef4444':pctTeto>70?'#f59e0b':'#10b981' }}/>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color:'var(--text-secondary)' }}>Faturado: <span className="font-bold" style={{ color:'var(--text-primary)' }}>{fmt(totalFaturadoAno)}</span></span>
                      <span style={{ color:'var(--text-secondary)' }}>Disponível: <span className="font-bold text-emerald-500">{fmt(Math.max(teto-totalFaturadoAno,0))}</span></span>
                    </div>
                    {pctTeto>90 && <p className="text-red-400 text-xs mt-2 font-medium">⚠️ Atenção: você está próximo do teto de faturamento!</p>}
                  </div>

                  {fatsDoAno.length===0 ? (
                    <div className="rounded-2xl p-8 text-center border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                      <p style={{ color:'var(--text-secondary)' }}>Nenhum faturamento no período</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                      {fatsDoAno.map((f,i) => (
                        <div key={f.id} className={`flex items-center justify-between px-5 py-4 ${i!==fatsDoAno.length-1?'border-b':''}`} style={{ borderColor:'var(--border)' }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{f.descricao}</p>
                            <p className="text-xs" style={{ color:'var(--text-muted)' }}>{new Date(f.data+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-emerald-500">+{fmt(f.valor)}</p>
                            <button onClick={async()=>{ if(confirm('Excluir?')) { await supabase.from('empresa_faturamentos').delete().eq('id',f.id); fetchData() } }}
                              className="p-1.5 rounded-lg transition hover:bg-red-500/10 hover:text-red-400" style={{ color:'var(--text-secondary)' }}>
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ABA CONTAS A PAGAR */}
              {aba==='contas' && (
                <>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex gap-2">
                      <select value={mesFiltroConta} onChange={e=>setMesFiltroConta(parseInt(e.target.value))}
                        className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
                        style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
                        {meses.map((m,i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                      <select value={anoFiltroConta} onChange={e=>setAnoFiltroConta(parseInt(e.target.value))}
                        className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-emerald-500 transition"
                        style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
                        {anosContas.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <button onClick={()=>{ setEditandoConta(null); setShowModalConta(true) }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition">
                      <Plus className="w-4 h-4"/> Nova Conta
                    </button>
                  </div>

                  {/* Resumo mês */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-xl p-4 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                      <p className="text-xs" style={{ color:'var(--text-secondary)' }}>A Pagar</p>
                      <p className="text-red-400 font-bold text-lg mt-1">{fmt(totalPendente)}</p>
                      <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{contasFiltradas.filter(c=>c.status!=='pago').length} pendentes</p>
                    </div>
                    <div className="rounded-xl p-4 border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                      <p className="text-xs" style={{ color:'var(--text-secondary)' }}>Pago</p>
                      <p className="text-emerald-500 font-bold text-lg mt-1">{fmt(totalPago)}</p>
                      <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{contasFiltradas.filter(c=>c.status==='pago').length} pagos</p>
                    </div>
                  </div>

                  {contasFiltradas.length===0 ? (
                    <div className="rounded-2xl p-8 text-center border" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                      <p style={{ color:'var(--text-secondary)' }}>Nenhuma conta em {meses[mesFiltroConta]}/{anoFiltroConta}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor:'var(--bg-card)', borderColor:'var(--border)' }}>
                      {contasFiltradas.map((c,i) => {
                        const st = getStatusConta(c.vencimento, c.status)
                        const Icon = st.icon
                        return (
                          <div key={c.id} className={`flex items-center justify-between px-5 py-4 ${i!==contasFiltradas.length-1?'border-b':''} ${c.status==='pago'?'opacity-60':''}`} style={{ borderColor:'var(--border)' }}>
                            <div className="flex items-center gap-3">
                              <button onClick={()=>marcarPago(c.id, c.status)} className={`w-9 h-9 rounded-xl flex items-center justify-center ${st.bg} hover:opacity-80 transition`}>
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
                              <button onClick={()=>{ setEditandoConta(c); setShowModalConta(true) }} className="p-1.5 rounded-lg transition hover:bg-emerald-500/10" style={{ color:'var(--text-secondary)' }}>
                                <Pencil className="w-3.5 h-3.5"/>
                              </button>
                              <button onClick={async()=>{ if(confirm('Excluir?')) { await supabase.from('empresa_contas_pagar').delete().eq('id',c.id); fetchData() } }} className="p-1.5 rounded-lg transition hover:bg-red-500/10 hover:text-red-400" style={{ color:'var(--text-secondary)' }}>
                                <Trash2 className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {showModalEmpresa && <ModalEmpresa onClose={()=>setShowModalEmpresa(false)} onSave={()=>{ setShowModalEmpresa(false); fetchData() }} initial={editandoEmpresa}/>}
      {showModalFat && empresaSelecionada && <ModalFaturamento empresaId={empresaSelecionada.id} onClose={()=>setShowModalFat(false)} onSave={()=>{ setShowModalFat(false); fetchData() }}/>}
      {showModalConta && empresaSelecionada && <ModalContaPagar empresaId={empresaSelecionada.id} onClose={()=>setShowModalConta(false)} onSave={()=>{ setShowModalConta(false); fetchData() }} initial={editandoConta}/>}
    </div>
  )
}
