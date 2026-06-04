'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Flame } from 'lucide-react'

type PremiacaoProps = {
  bolaoId: string | null
  valorInscricao: number
  habilitarAzarao: boolean
  valorAzarao?: number
}

export default function Premiacao({
  bolaoId,
  valorInscricao,
  habilitarAzarao,
  valorAzarao = 50,
}: PremiacaoProps) {
  const supabase = createClient()
  const [total, setTotal] = useState(0)
  const [participantes, setParticipantes] = useState(0)

  useEffect(() => {
    async function load() {
      if (!bolaoId) return

      // membros aprovados DESTE bolão (count por bolão, não global)
      const { data: membros } = await supabase
        .from('bolao_membros')
        .select('user_id')
        .eq('bolao_id', bolaoId)
      const userIds = (membros || []).map((m: any) => m.user_id)
      if (userIds.length === 0) {
        setParticipantes(0)
        setTotal(0)
        return
      }

      const { count } = await supabase
        .from('pagamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aprovado')
        .in('user_id', userIds)

      const qtd = count || 0
      setParticipantes(qtd)
      setTotal(qtd * valorInscricao)
    }
    load()
  }, [bolaoId, valorInscricao])

  const descontoAzarao = habilitarAzarao ? valorAzarao : 0
  const premioLiquido = Math.max(0, total - descontoAzarao)

  const premios = [
    { emoji: '🥇', label: '1º lugar', pct: 60, valor: premioLiquido * 0.6, cor: 'bg-yellow-400' },
    { emoji: '🥈', label: '2º lugar', pct: 25, valor: premioLiquido * 0.25, cor: 'bg-gray-400' },
    { emoji: '🥉', label: '3º lugar', pct: 15, valor: premioLiquido * 0.15, cor: 'bg-amber-600' },
  ]

  function fmt(v: number) {
    return v > 0 ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" strokeWidth={1.5} />
          <h3 className="font-semibold text-gray-800">Premiação</h3>
        </div>
        <span className="text-xs text-gray-400">{participantes} inscritos</span>
      </div>

      {/* Top 3 */}
      <div className="flex flex-col gap-3 mb-4">
        {premios.map(p => (
          <div key={p.emoji} className="flex items-center gap-3">
            <span className="text-xl w-7">{p.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">{p.label}</span>
                <span className="text-sm font-semibold text-gray-800">{fmt(p.valor)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${p.cor}`} style={{ width: `${p.pct}%` }} />
              </div>
              <span className="text-xs text-gray-400">{p.pct}% do prêmio líquido</span>
            </div>
          </div>
        ))}
      </div>

      {/* Azarão — só aparece se habilitado */}
      {habilitarAzarao && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-orange-800">Azarão 🃏</p>
              <p className="text-xs text-orange-500">Quem ficar em último lugar</p>
            </div>
          </div>
          <span className="text-sm font-bold text-orange-700">{fmt(valorAzarao)}</span>
        </div>
      )}

      {/* Resumo */}
      <div className="border-t border-gray-50 pt-3 flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Total arrecadado</span>
          <span className="font-medium text-gray-600">{fmt(total)}</span>
        </div>
        {habilitarAzarao && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Azarão (fixo)</span>
            <span className="font-medium text-orange-500">− {fmt(valorAzarao)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-semibold text-gray-800 pt-1 border-t border-gray-50">
          <span>Prêmio líquido</span>
          <span className="text-green-700">{fmt(premioLiquido)}</span>
        </div>
      </div>
    </div>
  )
}
