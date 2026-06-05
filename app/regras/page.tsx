'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trophy, Target, X, Plus, RefreshCw } from 'lucide-react'

type LugarPremio = { lugar: number; pct: number }

const PREMIACAO_PADRAO: LugarPremio[] = [
  { lugar: 1, pct: 60 }, { lugar: 2, pct: 25 }, { lugar: 3, pct: 15 },
]

function medalhaLugar(lugar: number) {
  if (lugar === 1) return '🥇'
  if (lugar === 2) return '🥈'
  if (lugar === 3) return '🥉'
  return `${lugar}º`
}

export default function RegrasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [habilitarOuro, setHabilitarOuro] = useState(true)
  const [habilitarExtra, setHabilitarExtra] = useState(true)
  const [habilitarAzarao, setHabilitarAzarao] = useState(true)
  const [lugares, setLugares] = useState<LugarPremio[]>(PREMIACAO_PADRAO)
  const [azaraoPct, setAzaraoPct] = useState(50)
  const [valorExtra2, setValorExtra2] = useState(10)
  const [valorExtra3, setValorExtra3] = useState(15)
  const [valorExtra4, setValorExtra4] = useState(20)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('bolao_id').eq('id', user.id).single()
      if (!profile?.bolao_id) return
      const { data: bolao } = await supabase
        .from('boloes')
        .select('habilitar_palpite_ouro, habilitar_palpite_extra, habilitar_azarao, premiacao, azarao_pct, valor_palpite_extra_2, valor_palpite_extra_3, valor_palpite_extra_4')
        .eq('id', profile.bolao_id).single()
      if (bolao) {
        setHabilitarOuro(bolao.habilitar_palpite_ouro ?? true)
        setHabilitarExtra(bolao.habilitar_palpite_extra ?? true)
        setHabilitarAzarao(bolao.habilitar_azarao ?? true)
        if (Array.isArray(bolao.premiacao) && bolao.premiacao.length > 0) {
          setLugares([...bolao.premiacao].sort((a: any, b: any) => a.lugar - b.lugar))
        }
        if (bolao.azarao_pct != null) setAzaraoPct(Number(bolao.azarao_pct))
        setValorExtra2(Number(bolao.valor_palpite_extra_2 ?? 10))
        setValorExtra3(Number(bolao.valor_palpite_extra_3 ?? 15))
        setValorExtra4(Number(bolao.valor_palpite_extra_4 ?? 20))
      }
    }
    load()
  }, [])

  function fmtReal(v: number) {
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a6b3c] pt-10 pb-5 px-5 text-center">
        <h1 className="text-white text-2xl font-semibold tracking-tight">Regras do Bolão</h1>
        <p className="text-green-300 text-sm mt-0.5">Copa do Mundo 2026</p>
      </div>

      <div className="px-4 pt-5 pb-24">

        {/* Pontuação */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
              <Trophy size={20} className="text-green-700" strokeWidth={1.5} />
            </div>
            <h2 className="font-semibold text-gray-800">Pontuação</h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Placar exato</p>
                <p className="text-xs text-gray-400 mt-0.5">Ex: chutou 2×1 e foi 2×1</p>
              </div>
              <span className="text-base font-bold text-green-700">+3 pts</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Ganhador certo</p>
                <p className="text-xs text-gray-400 mt-0.5">Ex: chutou vitória do time A e ganhou</p>
              </div>
              <span className="text-base font-bold text-amber-600">+1 pt</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Errou</p>
                <p className="text-xs text-gray-400 mt-0.5">Ganhador ou placar errado</p>
              </div>
              <span className="text-base font-medium text-gray-400">0 pts</span>
            </div>
          </div>
        </div>

        {habilitarExtra && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Plus size={20} className="text-blue-600" strokeWidth={1.5} />
            </div>
            <h2 className="font-semibold text-gray-800">Palpites extras</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Aumente suas chances com palpites adicionais para o mesmo jogo. O melhor resultado entre todos os seus palpites é o que vale.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700">1º palpite</span>
              <span className="text-sm font-semibold text-green-700">Grátis</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700">2º palpite</span>
              <span className="text-sm font-semibold text-gray-700">{fmtReal(valorExtra2)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700">3º palpite</span>
              <span className="text-sm font-semibold text-gray-700">{fmtReal(valorExtra3)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700">4º palpite</span>
              <span className="text-sm font-semibold text-gray-700">{fmtReal(valorExtra4)}</span>
            </div>
          </div>
        </div>
      )}

        {/* Prazo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Target size={20} className="text-amber-600" strokeWidth={1.5} />
            </div>
            <h2 className="font-semibold text-gray-800">Prazo dos palpites</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">Os palpites fecham <strong className="text-gray-800">24 horas antes</strong> do início de cada jogo. Após esse horário não é possível inserir ou alterar palpites.</p>
        </div>

        {/* Premiação */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-yellow-50 flex items-center justify-center">
              <Trophy size={20} className="text-yellow-600" strokeWidth={1.5} />
            </div>
            <h2 className="font-semibold text-gray-800">Premiação</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            O valor arrecadado{habilitarAzarao ? `, menos o prêmio do azarão (${azaraoPct}% da inscrição),` : ''} é distribuído entre os {lugares.length === 1 ? 'premiados' : `${lugares.length} primeiros`} colocados{habilitarAzarao ? '. O último colocado leva o prêmio do azarão' : ''}.
          </p>
          <div className="flex flex-col gap-2">
            {lugares.map((l, i) => (
              <div key={l.lugar} className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${i === 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <span className="text-sm font-medium text-gray-700">{medalhaLugar(l.lugar)} {l.lugar}º lugar</span>
                <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-700' : 'text-gray-600'}`}>{l.pct}% do total</span>
              </div>
            ))}
          </div>
          {habilitarAzarao && (
            <div className="flex items-center justify-between py-2.5 px-3 bg-orange-50 rounded-xl mt-2">
              <span className="text-sm font-medium text-gray-700">🃏 Último lugar (Azarão)</span>
              <span className="text-sm font-bold text-orange-600">{azaraoPct}% da inscrição</span>
            </div>
          )}
        </div>

      {habilitarOuro && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-yellow-50 flex items-center justify-center">
              <span className="text-xl">⭐</span>
            </div>
            <h2 className="font-semibold text-gray-800">Palpite de Ouro</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            Antes do primeiro jogo da Copa, escolha os dois finalistas e o placar da final. Se acertar tudo, você ganha <strong className="text-gray-800">+50 pontos</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2.5 px-3 bg-yellow-50 rounded-xl">
              <span className="text-sm text-gray-700">Acertar finalistas + placar exato</span>
              <span className="text-sm font-bold text-yellow-600">+50 pts</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700">Não preencher ou errar</span>
              <span className="text-sm text-gray-400">0 pts</span>
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 px-3 py-2 rounded-xl">
            ⚠️ Prazo: deve ser feito antes do 1º jogo. Após isso não é possível preencher.
          </p>
        </div>
      )}

        {/* Desempate */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
              <RefreshCw size={20} className="text-purple-600" strokeWidth={1.5} />
            </div>
            <h2 className="font-semibold text-gray-800">Desempate</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">Em caso de empate em pontos, os critérios são aplicados na seguinte ordem:</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 py-2.5 px-3 bg-purple-50 rounded-xl">
              <span className="text-sm font-bold text-purple-700 w-6">1º</span>
              <span className="text-sm text-gray-700">Quem fizer mais pontos na <strong>primeira rodada</strong></span>
            </div>
            <div className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-bold text-purple-700 w-6">2º</span>
              <span className="text-sm text-gray-700">Quem fizer mais pontos na <strong>segunda rodada</strong></span>
            </div>
            <div className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-bold text-purple-700 w-6">3º</span>
              <span className="text-sm text-gray-700">Número de <strong>placares exatos</strong></span>
            </div>
            <div className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-bold text-purple-700 w-6">4º</span>
              <span className="text-sm text-gray-700">Número de <strong>ganhadores certos</strong></span>
            </div>
          </div>
        </div>

      </div>

      {/* Botão voltar fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button onClick={() => router.push('/palpites')}
          className="w-full bg-[#1a6b3c] text-white font-semibold py-4 rounded-2xl text-sm active:scale-95 transition-transform">
          Entendido, vamos jogar!
        </button>
      </div>
    </div>
  )
}
