'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Wallet, Pencil, Trash2, X, Loader2, Building2, PiggyBank, Briefcase } from 'lucide-react'

type Conta = {
  id: string
  nome: string
  tipo: string
  saldo: number
  cor: string
}

const tipos = [
  { value: 'corrente', label: 'Conta Corrente', icon: Building2 },
  { value: 'poupanca', label: 'Poupança', icon: PiggyBank },
  { value: 'carteira', label: 'Carteira', icon: Wallet },
  { value: 'outro', label: 'Outro', icon: Briefcase },
]

const cores = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

function Modal({ onClose, onSave, initial }: {
  onClose: () => void
  onSave: () => void
  initial?: Conta | null
}) {
  const supabase = createClient()
  const [nome, setNome] = useState(initial?.nome || '')
  const [tipo, setTipo] = useState(initial?.tipo || 'corrente')
  const [saldo, setSaldo] = useState(initial?.saldo?.toString() || '0')
  const [cor, setCor] = useState(initial?.cor || '#10b981')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!nome.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { nome, tipo, saldo: parseFloat(saldo) || 0, cor, user_id: user!.id }

    if (initial) {
      await supabase.from('contas').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('contas').insert(payload)
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">{initial ? 'Editar Conta' : 'Nova Conta'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Nome da conta</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Nubank, Bradesco..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {tipos.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTipo(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${
                    tipo === value
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Saldo inicial (R$)</label>
            <input
              type="number"
              value={saldo}
              onChange={e => setSaldo(e.target.value)}
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {cores.map(c => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition ${cor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={loading || !nome.trim()}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {initial ? 'Salvar' : 'Criar Conta'}
          </button>
        </div>
      </div>
    </div>
  )
}

const tipoLabel: Record<string, string> = {
  corrente: 'Conta Corrente', poupanca: 'Poupança', carteira: 'Carteira', outro: 'Outro'
}

export default function ContasPage() {
  const supabase = createClient()
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)

  const fetchContas = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('contas').select('*').eq('user_id', user!.id).order('created_at')
    setContas(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchContas() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta conta?')) return
    await supabase.from('contas').delete().eq('id', id)
    fetchContas()
  }

  const saldoTotal = contas.reduce((acc, c) => acc + c.saldo, 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Contas</h1>
          <p className="text-slate-400 mt-1">Gerencie suas contas bancárias e saldos</p>
        </div>
        <button
          onClick={() => { setEditando(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition"
        >
          <Plus className="w-4 h-4" /> Nova Conta
        </button>
      </div>

      {/* Saldo total */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <p className="text-slate-400 text-sm">Saldo Total</p>
        <p className="text-3xl font-bold text-emerald-400 mt-1">{fmt(saldoTotal)}</p>
        <p className="text-slate-500 text-sm mt-1">{contas.length} {contas.length === 1 ? 'conta' : 'contas'}</p>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : contas.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma conta cadastrada</p>
          <p className="text-slate-600 text-sm mt-1">Clique em "Nova Conta" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contas.map(conta => (
            <div key={conta.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: conta.cor + '22' }}>
                    <Wallet className="w-5 h-5" style={{ color: conta.cor }} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{conta.nome}</p>
                    <p className="text-slate-500 text-xs">{tipoLabel[conta.tipo] || conta.tipo}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditando(conta); setShowModal(true) }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(conta.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Saldo</p>
                <p className={`text-xl font-bold ${conta.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(conta.saldo)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchContas() }}
          initial={editando}
        />
      )}
    </div>
  )
}
