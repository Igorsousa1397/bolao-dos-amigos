'use client'
import Header from '@/app/components/Header'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type RankingItem = {
  user_id: string
  nome: string
  total_pontos: number
  placares_exatos: number
  ganhadores_certos: number
  posicao: number
  sou_eu?: boolean
}

export default function RankingPage() {
  const supabase = createClient()
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [minha, setMinha] = useState<RankingItem | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('ranking')
        .select('*')
        .order('posicao')

      if (!data) return

      const comEu = data.map((r: any) => ({ ...r, sou_eu: r.user_id === user.id }))
      setRanking(comEu)
      setMinha(comEu.find((r: any) => r.user_id === user.id) || null)
      setCarregando(false)
    }
    load()
  }, [])

  function medalha(pos: number) {
    if (pos === 1) return '🥇'
    if (pos === 2) return '🥈'
    if (pos === 3) return '🥉'
    return `${pos}º`
  }

  function iniciais(nome: string) {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const cores = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-purple-100 text-purple-700',
    'bg-yellow-100 text-yellow-700',
  ]

  return (
    <div>
      <div className="bg-[#1a6b3c] pt-12 pb-6 px-4 text-center">
        <h1 className="text-white text-xl font-semibold mb-4">Ranking</h1>

        {minha && (
          <div className="bg-white/15 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs mb-1">Sua posição</p>
              <p className="text-white text-2xl font-semibold">{medalha(minha.posicao)}</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-xs mb-1">Pontos</p>
              <p className="text-yellow-300 text-2xl font-semibold">{minha.total_pontos}</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-xs mb-1">Exatos</p>
              <p className="text-white text-2xl font-semibold">{minha.placares_exatos}</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-xs mb-1">Ganhador</p>
              <p className="text-white text-2xl font-semibold">{minha.ganhadores_certos}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="flex justify-between text-xs text-gray-400 font-medium px-2 mb-2">
          <span>Jogador</span>
          <div className="flex gap-6">
            <span>Exatos</span>
            <span>Pts</span>
          </div>
        </div>

        {carregando ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {ranking.map((r, i) => (
              <div
                key={r.user_id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < ranking.length - 1 ? 'border-b border-gray-50' : ''
                } ${r.sou_eu ? 'bg-green-50' : ''}`}
              >
                <div className="w-8 text-center text-sm font-semibold text-gray-400">
                  {medalha(r.posicao)}
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${cores[i % cores.length]}`}>
                  {iniciais(r.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${r.sou_eu ? 'text-green-800' : 'text-gray-800'}`}>
                    {r.nome} {r.sou_eu ? '⭐' : ''}
                  </p>
                  <p className="text-xs text-gray-400">{r.ganhadores_certos} ganhadores certos</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm text-gray-400 w-8 text-center">{r.placares_exatos}</span>
                  <span className={`text-base font-semibold w-10 text-right ${r.sou_eu ? 'text-green-700' : 'text-gray-800'}`}>
                    {r.total_pontos}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Pontuação</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Placar exato</span>
              <span className="font-semibold text-green-700">+3 pts</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Ganhador certo</span>
              <span className="font-semibold text-amber-600">+1 pt</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Errou</span>
              <span className="text-gray-400">0 pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
