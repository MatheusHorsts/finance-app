'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTheme } from '@/components/ThemeProvider'

type Props = {
  data: { nome: string; valor: number; cor: string }[]
}

const CORES_PADRAO = ['#10b981','#6366f1','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16']

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function GraficoGastos({ data }: Props) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-muted)' }}>
        Nenhum gasto registrado ainda
      </div>
    )
  }

  const dataComCores = data.map((d, i) => ({
    ...d,
    cor: d.cor || CORES_PADRAO[i % CORES_PADRAO.length]
  }))

  const total = data.reduce((a, d) => a + d.valor, 0)

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center">
      <div className="w-full lg:w-64 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataComCores}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="valor"
              nameKey="nome"
            >
              {dataComCores.map((entry, index) => (
                <Cell key={index} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => fmt(Number(value))}
              contentStyle={{
                backgroundColor: isLight ? '#fff' : '#1e293b',
                border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                borderRadius: '12px',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontSize: '14px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="flex-1 space-y-2 w-full">
        {dataComCores.map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.cor }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{d.nome}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(d.valor)}</span>
              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{((d.valor / total) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total</span>
            <span className="text-base font-bold text-red-400">{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
