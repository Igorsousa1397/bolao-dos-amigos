'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Flame } from 'lucide-react'

type LugarPremio = { lugar: number; pct: number }

type PremiacaoProps = {
  bolaoId: string | null
  valorInscricao: number
  habilitarAzarao: boolean
  // legado: aceito mas não é mais a fonte principal
  valorAzarao?: number
}


const PREMIACAO_PADRAO: LugarPremio[] = [
  { lugar: 1, pct: 60 },
  { lugar: 2, pct: 25 },
  { lugar: 3, pct: 15 },
]

// medalha p/ os 3 primeiros, depois número
function medalhaLugar(lugar: number) {
  if (lugar === 1) return '🥇'
  if (lugar === 2) return '🥈'
  if (lugar === 3) return '🥉'
  return `${lugar}º`
}
function corLugar(lugar: number) {
  if (lugar === 1) return 'bg-yellow-400'
  if (lugar === 2) return 'bg-gray-400'
  if (lugar === 3) return 'bg-amber-600'
  return 'bg-green-400'
}

export default function Premiacao({
  bolaoId,
  valorInscricao,
  habilitarAzarao,
  valorAzarao = 50,
}: PremiacaoProps) {
  const supabase = createClient()
  const [total, setTotal] = useState(0)
  const [totalInscricoes, setTotalInscricoes] = useState(0)
  const [totalExtras, setTotalExtras] = useState(0)
  const [participantes, setParticipantes] = useState(0)
  const [lugares, setLugares] = useState<LugarPremio[]>(PREMIACAO_PADRAO)
  const [azaraoPct, setAzaraoPct] = useState(50)

  useEffect(() => {
    async function load() {
      if (!bolaoId) return

      // config de premiação do bolão (JSONB + azarao_pct)
      const { data: bolao } = await supabase
        .from('boloes')
        .select('premiacao, azarao_pct')
        .eq('id', bolaoId)
        .single()

      if (bolao?.premiacao && Array.isArray(bolao.premiacao) && bolao.premiacao.length > 0) {
        // ordena por lugar pra exibir 1º, 2º, 3º...
        const ord = [...bolao.premiacao].sort((a: any, b: any) => a.lugar - b.lugar)
        setLugares(ord)
      } else {
        setLugares(PREMIACAO_PADRAO)
      }
      if (bolao?.azarao_pct != null) setAzaraoPct(Number(bolao.azarao_pct))

      // membros aprovados DESTE bolão (count por bolão, não global)
      const { data: membros } = await supabase
        .from('bolao_membros')
        .select('user_id')
        .eq('bolao_id', bolaoId)
      const userIds = (membros || []).map((m: any) => m.user_id)
      if (userIds.length === 0) {
        setParticipantes(0)
        setTotalInscricoes(0)
        setTotalExtras(0)
        setTotal(0)
        return
      }

      const { count } = await supabase
        .from('pagamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aprovado')
        .in('user_id', userIds)

      const qtd = count || 0
      const inscricoes = qtd * valorInscricao

      // soma dos palpites extras APROVADOS deste bolão
      const { data: extras } = await supabase
        .from('palpites_extras')
        .select('valor_pago')
        .eq('bolao_id', bolaoId)
        .eq('status_pagamento', 'aprovado')
      const somaExtras = (extras || []).reduce((s: number, e: any) => s + (Number(e.valor_pago) || 0), 0)

      setParticipantes(qtd)
      setTotalInscricoes(inscricoes)
      setTotalExtras(somaExtras)
      setTotal(inscricoes + somaExtras)
    }
    load()
  }, [bolaoId, valorInscricao])

  // azarão = % do valor da inscrição (default 50%)
  const valorAzaraoCalc = habilitarAzarao ? (valorInscricao * azaraoPct) / 100 : 0
  const descontoAzarao = valorAzaraoCalc
  const premioLiquido = Math.max(0, total - descontoAzarao)

  const premios = lugares.map(l => ({
    emoji: medalhaLugar(l.lugar),
    label: `${l.lugar}º lugar`,
    pct: l.pct,
    valor: (premioLiquido * l.pct) / 100,
    cor: corLugar(l.lugar),
  }))

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

      {/* Lugares premiados (dinâmico) */}
      <div className="flex flex-col gap-3 mb-4">
        {premios.map(p => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="text-xl w-7">{p.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">{p.label}</span>
                <span className="text-sm font-semibold text-gray-800">{fmt(p.valor)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${p.cor}`} style={{ width: `${Math.min(p.pct, 100)}%` }} />
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
          <span className="text-sm font-bold text-orange-700">{fmt(valorAzaraoCalc)}</span>
        </div>
      )}

      {/* Resumo */}
      <div className="border-t border-gray-50 pt-3 flex flex-col gap-1.5">
        {totalExtras > 0 ? (
          <>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Inscrições</span>
              <span className="font-medium text-gray-600">{fmt(totalInscricoes)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Palpites extras</span>
              <span className="font-medium text-gray-600">{fmt(totalExtras)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-50">
              <span>Total arrecadado</span>
              <span className="font-medium text-gray-700">{fmt(total)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Total arrecadado</span>
            <span className="font-medium text-gray-600">{fmt(total)}</span>
          </div>
        )}
        {habilitarAzarao && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Azarão ({azaraoPct}% da inscrição)</span>
            <span className="font-medium text-orange-500">− {fmt(valorAzaraoCalc)}</span>
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
