'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Lock, Check, ChevronDown } from 'lucide-react'

type Time = { id: string; nome: string; codigo: string }

const BANDEIRAS: Record<string, string> = {
  BRA:'🇧🇷',ARG:'🇦🇷',FRA:'🇫🇷',ESP:'🇪🇸',GER:'🇩🇪',ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  POR:'🇵🇹',ITA:'🇮🇹',NED:'🇳🇱',BEL:'🇧🇪',URU:'🇺🇾',MEX:'🇲🇽',
  USA:'🇺🇸',CAN:'🇨🇦',COL:'🇨🇴',CHI:'🇨🇱',PAR:'🇵🇾',ECU:'🇪🇨',
  PER:'🇵🇪',BOL:'🇧🇴',VEN:'🇻🇪',CRC:'🇨🇷',PAN:'🇵🇦',HON:'🇭🇳',
  JAM:'🇯🇲',CUB:'🇨🇺',MAR:'🇲🇦',SEN:'🇸🇳',EGY:'🇪🇬',RSA:'🇿🇦',
  JPN:'🇯🇵',KOR:'🇰🇷',AUS:'🇦🇺',IDN:'🇮🇩',IRN:'🇮🇷',KSA:'🇸🇦',
  IRQ:'🇮🇶',JOR:'🇯🇴',TUR:'🇹🇷',AUT:'🇦🇹',DEN:'🇩🇰',SRB:'🇷🇸',
  CRO:'🇭🇷',ROU:'🇷🇴',ALB:'🇦🇱',UKR:'🇺🇦',NZL:'🇳🇿',QAT:'🇶🇦', 
  SUI:'🇨🇭',CUW:'🇨🇼', CIV:'🇨🇮', TUN:'🇹🇳', CPV:'🇨🇻', ALG:'🇩🇿',
  NOR:'🇳🇴', RDC:'🇨🇩', GHA:'🇬🇭', UZB:'🇺🇿', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', HTI:'🇭🇹',
  CZE:'🇨🇿', BIH:'🇧🇦', SWE:'🇸🇪',
}

export default function PalpiteOuro({ userId, pagou }: { userId: string; pagou: boolean }) {
  const supabase = createClient()
  const [times, setTimes] = useState<Time[]>([])
  const [timeCasa, setTimeCasa] = useState('')
  const [timeFora, setTimeFora] = useState('')
  const [golsCasa, setGolsCasa] = useState('')
  const [golsFora, setGolsFora] = useState('')
  const [palpiteExistente, setPalpiteExistente] = useState<any>(null)
  const [prazoEncerrado, setPrazoEncerrado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [expandido, setExpandido] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: timesData } = await supabase
        .from('times').select('id, nome, codigo').order('nome')
      setTimes(timesData || [])

      const { data: existente } = await supabase
        .from('palpite_ouro')
        .select('*, time_casa:time_casa_id(nome,codigo), time_fora:time_fora_id(nome,codigo)')
        .eq('user_id', userId)
        .maybeSingle()
      setPalpiteExistente(existente)

      const { data: jogosAtivos } = await supabase
        .from('jogos').select('id').in('status', ['em_andamento', 'encerrado']).limit(1)
      setPrazoEncerrado((jogosAtivos || []).length > 0)
    }
    load()
  }, [userId])

  async function salvar() {
    if (!timeCasa || !timeFora || golsCasa === '' || golsFora === '') {
      setErro('Preencha todos os campos'); return
    }
    if (timeCasa === timeFora) { setErro('Escolha times diferentes'); return }
    setSalvando(true); setErro('')
    const { error } = await supabase.from('palpite_ouro').insert({
      user_id: userId, time_casa_id: timeCasa, time_fora_id: timeFora,
      gols_casa: Number(golsCasa), gols_fora: Number(golsFora),
    })
    if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }
    const { data: existente } = await supabase
      .from('palpite_ouro')
      .select('*, time_casa:time_casa_id(nome,codigo), time_fora:time_fora_id(nome,codigo)')
      .eq('user_id', userId).maybeSingle()
    setPalpiteExistente(existente)
    setSalvando(false)
  }

  if (!pagou) return null

  return (
    <div className="mx-4 mb-4">
      <div className="rounded-2xl overflow-hidden border border-yellow-200 bg-amber-50">
        {/* Header */}
        <button onClick={() => setExpandido(!expandido)}
          className="w-full flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Star size={20} className="text-yellow-500" fill="currentColor" />
            </div>
            <div className="text-left">
              <p className="text-yellow-900 font-bold text-sm">Palpite de Ouro ⭐</p>
              <p className="text-yellow-700/70 text-xs">Finalistas + placar → +50 pts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {palpiteExistente && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                <Check size={11} /> salvo
              </span>
            )}
            {prazoEncerrado && !palpiteExistente && (
              <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                <Lock size={11} /> encerrado
              </span>
            )}
            <ChevronDown size={16} className={`text-yellow-600 transition-transform ${expandido ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {expandido && (
          <div className="px-4 pb-4">
            <div className="h-px bg-yellow-200 mb-4" />

            {palpiteExistente ? (
              <div className="text-center">
                <p className="text-yellow-700/70 text-xs mb-3">Seu palpite para a final</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl">{BANDEIRAS[palpiteExistente.time_casa?.codigo] || '🏳️'}</span>
                    <span className="text-yellow-900 text-xs font-medium">{palpiteExistente.time_casa?.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 bg-white border border-yellow-200 rounded-xl flex items-center justify-center text-yellow-900 font-bold text-lg shadow-sm">
                      {palpiteExistente.gols_casa}
                    </div>
                    <span className="text-yellow-400 font-light">×</span>
                    <div className="w-11 h-11 bg-white border border-yellow-200 rounded-xl flex items-center justify-center text-yellow-900 font-bold text-lg shadow-sm">
                      {palpiteExistente.gols_fora}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl">{BANDEIRAS[palpiteExistente.time_fora?.codigo] || '🏳️'}</span>
                    <span className="text-yellow-900 text-xs font-medium">{palpiteExistente.time_fora?.nome}</span>
                  </div>
                </div>
                {palpiteExistente.apurado && (
                  <div className="mt-3 bg-yellow-100 border border-yellow-200 rounded-xl py-2 px-4">
                    <p className="text-yellow-700 font-bold text-lg">+{palpiteExistente.pontos} pts</p>
                  </div>
                )}
              </div>
            ) : prazoEncerrado ? (
              <div className="text-center py-3">
                <Lock size={24} className="text-yellow-400/50 mx-auto mb-2" />
                <p className="text-yellow-800/60 text-sm font-medium">Prazo encerrado</p>
                <p className="text-yellow-700/40 text-xs mt-1">Devia ser feito antes do 1º jogo</p>
              </div>
            ) : (
              <div>
                <p className="text-yellow-700/70 text-xs mb-4 text-center">
                  Escolha os finalistas e o placar. Vale antes do 1º jogo!
                </p>
                <div className="mb-3">
                  <label className="text-yellow-800/60 text-xs mb-1.5 block font-medium">Time 1 (mandante)</label>
                  <select value={timeCasa} onChange={e => setTimeCasa(e.target.value)}
                    className="w-full bg-white border border-yellow-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400">
                    <option value="">Selecione...</option>
                    {times.map(t => (
                      <option key={t.id} value={t.id}>{BANDEIRAS[t.codigo]} {t.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="text-yellow-800/60 text-xs mb-1.5 block font-medium">Time 2 (visitante)</label>
                  <select value={timeFora} onChange={e => setTimeFora(e.target.value)}
                    className="w-full bg-white border border-yellow-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400">
                    <option value="">Selecione...</option>
                    {times.map(t => (
                      <option key={t.id} value={t.id}>{BANDEIRAS[t.codigo]} {t.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="text-yellow-800/60 text-xs mb-1.5 block font-medium">Placar da final</label>
                  <div className="flex items-center gap-3 justify-center">
                    <input type="number" min="0" max="20" placeholder="0" value={golsCasa}
                      onChange={e => setGolsCasa(e.target.value)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-white border-2 border-yellow-300 rounded-xl outline-none focus:border-yellow-500 text-yellow-900" />
                    <span className="text-yellow-400 text-xl font-light">×</span>
                    <input type="number" min="0" max="20" placeholder="0" value={golsFora}
                      onChange={e => setGolsFora(e.target.value)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-white border-2 border-yellow-300 rounded-xl outline-none focus:border-yellow-500 text-yellow-900" />
                  </div>
                </div>
                {erro && <p className="text-red-500 text-xs text-center mb-3">{erro}</p>}
                <button onClick={salvar} disabled={salvando}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 rounded-xl text-sm disabled:opacity-50 active:scale-95 transition-all shadow-sm">
                  {salvando ? 'Salvando...' : '⭐ Confirmar palpite de ouro'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
