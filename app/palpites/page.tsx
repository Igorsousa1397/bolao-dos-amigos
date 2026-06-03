'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/app/components/Header'
import { AlertCircle, Check, ChevronDown, Lock, Users, Radio } from 'lucide-react'
import PalpiteExtra from '@/app/components/PalpiteExtra'
import PalpiteOuro from '@/app/components/PalpiteOuro'

type Time = { id: string; nome: string; codigo: string }
type Jogo = {
  id: string; fase: string; data_hora: string; status: string
  gols_casa: number | null; gols_fora: number | null
  time_casa_id: string; time_fora_id: string
  time_casa?: Time; time_fora?: Time
  palpite?: { gols_casa: number; gols_fora: number } | null
  palpite_aberto: boolean
  extras?: any[] 
}
type PalpiteTodos = {
  user_id: string
  nome: string
  gols_casa: number
  gols_fora: number
  pontos: number | null
}

const FASES = [
  { key: 'grupos',         label: 'Fase de grupos' },
  { key: 'segunda_rodada', label: '2ª rodada' },
  { key: 'oitavas',        label: 'Oitavas de final' },
  { key: 'quartas',        label: 'Quartas de final' },
  { key: 'semi',           label: 'Semifinal' },
  { key: 'final',          label: 'Final' },
]

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
}

function GrupoData({ data, jogos, userId, pagou, onSalvo, habilitarExtra, valorExtra2, valorExtra3, valorExtra4 }: {
  data: string; jogos: Jogo[]; userId: string; pagou: boolean; habilitarExtra: boolean
  valorExtra2: number; valorExtra3: number; valorExtra4: number
  onSalvo: (id: string, casa: number, fora: number) => void
}){
  const [aberto, setAberto] = useState(false)
  const temPendente = jogos.some(j => j.palpite_aberto && pagou && !j.palpite)

  return (
    <div className="mb-2">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm mb-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 capitalize">{data}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{jogos.length} jogo{jogos.length > 1 ? 's' : ''}</span>
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {aberto && jogos.map(j => (
        <JogoCard key={j.id} jogo={j} userId={userId} pagou={pagou} onSalvo={onSalvo} 
          habilitarExtra={habilitarExtra} valorExtra2={valorExtra2} valorExtra3={valorExtra3} valorExtra4={valorExtra4} />
      ))}
    </div>
  )
}

function JogoCard({ jogo, userId, pagou, onSalvo, habilitarExtra, valorExtra2, valorExtra3, valorExtra4 }: {
  jogo: Jogo; userId: string; pagou: boolean; habilitarExtra: boolean
  valorExtra2: number; valorExtra3: number; valorExtra4: number
  onSalvo: (id: string, casa: number, fora: number) => void
}) {
  const supabase = createClient()
  const [casa, setCasa] = useState<string>(jogo.palpite?.gols_casa?.toString() ?? '')
  const [fora, setFora] = useState<string>(jogo.palpite?.gols_fora?.toString() ?? '')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [aba, setAba] = useState<'meu' | 'todos'>('meu')
  const [palpitesTodos, setPalpitesTodos] = useState<PalpiteTodos[]>([])
  const [loadingTodos, setLoadingTodos] = useState(false)
  const [golsCasaLive, setGolsCasaLive] = useState(jogo.gols_casa)
  const [golsForaLive, setGolsForaLive] = useState(jogo.gols_fora)
  const [statusLive, setStatusLive] = useState(jogo.status)

  const dataJogo = new Date(jogo.data_hora)
  const diff = dataJogo.getTime() - Date.now()
  const horas = Math.floor(diff / 1000 / 60 / 60)
  const minutos = Math.floor((diff / 1000 / 60) % 60)
  const prazoPassou = diff <= 60 * 60 * 1000 || statusLive === 'encerrado' || statusLive === 'em_andamento'
  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`jogo-${jogo.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'jogos',
        filter: `id=eq.${jogo.id}`,
      }, payload => {
        setGolsCasaLive(payload.new.gols_casa)
        setGolsForaLive(payload.new.gols_fora)
        setStatusLive(payload.new.status)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [jogo.id])

  // Busca palpites de todos ao clicar na aba
  async function loadTodos() {
    if (palpitesTodos.length > 0) return
    setLoadingTodos(true)
    const { data } = await supabase
      .from('palpites')
      .select('user_id, gols_casa, gols_fora, pontos, profiles(nome)')
      .eq('jogo_id', jogo.id)
    if (data) {
      setPalpitesTodos(data.map((p: any) => ({
        user_id: p.user_id,
        nome: p.profiles?.nome || 'Usuário',
        gols_casa: p.gols_casa,
        gols_fora: p.gols_fora,
        pontos: p.pontos,
      })))
    }
    setLoadingTodos(false)
  }

  async function salvar() {
    if (casa === '' || fora === '') return
    setSalvando(true)
    await supabase.from('palpites').upsert(
      { user_id: userId, jogo_id: jogo.id, gols_casa: Number(casa), gols_fora: Number(fora) },
      { onConflict: 'user_id,jogo_id' }
    )
    setSalvando(false)
    setEditando(false)
    onSalvo(jogo.id, Number(casa), Number(fora))
  }

  const temPalpite = jogo.palpite != null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 mb-3 shadow-sm overflow-hidden">
      {/* Meta */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <span className="text-xs text-gray-400 font-medium">
          {dataJogo.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
        <div className="flex items-center gap-1.5">
          {statusLive === 'em_andamento' && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-semibold animate-pulse">
              <Radio size={11} /> AO VIVO
            </span>
          )}
          <span className="text-xs text-gray-400">
            {dataJogo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
          </span>
        </div>
      </div>

      {/* Placar ao vivo */}
      {(statusLive === 'em_andamento' || statusLive === 'encerrado') && (
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-2">
            <span className="text-white font-bold text-xl">{golsCasaLive ?? 0}</span>
            <span className="text-gray-500">–</span>
            <span className="text-white font-bold text-xl">{golsForaLive ?? 0}</span>
          </div>
          {statusLive === 'encerrado' && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Encerrado</span>
          )}
        </div>
      )}

      {/* Times + inputs */}
      <div className="flex items-center justify-between gap-2 px-4 pb-3">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{BANDEIRAS[jogo.time_casa?.codigo || ''] || '🏳️'}</span>
          <span className="text-xs text-gray-500 text-center leading-tight">{jogo.time_casa?.nome}</span>
        </div>
        <div className="flex items-center gap-2">
          {jogo.palpite_aberto && pagou ? (
            <>
              <input type="number" min="0" max="20" value={casa}
                onChange={e => { setCasa(e.target.value); setEditando(true) }}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-green-400 rounded-xl outline-none focus:border-green-600 text-green-700 bg-green-50" />
              <span className="text-gray-300 text-lg font-light">×</span>
              <input type="number" min="0" max="20" value={fora}
                onChange={e => { setFora(e.target.value); setEditando(true) }}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-green-400 rounded-xl outline-none focus:border-green-600 text-green-700 bg-green-50" />
            </>
          ) : (
            <>
              <div className="w-12 h-12 flex items-center justify-center text-xl font-bold bg-gray-50 rounded-xl text-gray-300 border border-gray-100">
                {temPalpite ? jogo.palpite!.gols_casa : '–'}
              </div>
              <span className="text-gray-300 text-lg font-light">×</span>
              <div className="w-12 h-12 flex items-center justify-center text-xl font-bold bg-gray-50 rounded-xl text-gray-300 border border-gray-100">
                {temPalpite ? jogo.palpite!.gols_fora : '–'}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-3xl">{BANDEIRAS[jogo.time_fora?.codigo || ''] || '🏳️'}</span>
          <span className="text-xs text-gray-500 text-center leading-tight">{jogo.time_fora?.nome}</span>
        </div>
      </div>

      {/* Pílulas de aba — só após o prazo */}
      {prazoPassou ? (
        <>
          <div className="flex mx-4 mb-3 bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setAba('meu')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                aba === 'meu' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
              }`}
            >
              Meu palpite
            </button>
            <button
              onClick={() => { setAba('todos'); loadTodos() }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                aba === 'todos' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
              }`}
            >
              Todos
            </button>
          </div>

          {aba === 'meu' && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {statusLive === 'encerrado' ? 'Jogo encerrado' : 'Em andamento'}
                </span>
                {temPalpite && !editando && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                    <Check size={11} /> salvo
                  </span>
                )}
              </div>
            </div>
          )}

          {aba === 'todos' && (
            <div className="px-4 pb-4">
              {loadingTodos ? (
                <p className="text-xs text-gray-400 text-center py-2">Carregando...</p>
              ) : palpitesTodos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Nenhum palpite registrado</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {palpitesTodos
                    .sort((a, b) => (b.pontos ?? -1) - (a.pontos ?? -1))
                    .map(p => (
                      <div key={p.user_id}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs ${
                          p.user_id === userId ? 'bg-green-50 border border-green-100' : 'bg-gray-50'
                        }`}>
                        <span className={`font-medium ${p.user_id === userId ? 'text-green-700' : 'text-gray-700'}`}>
                          {p.nome} {p.user_id === userId ? '(você)' : ''}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-600">{p.gols_casa} × {p.gols_fora}</span>
                          {p.pontos !== null && (
                            <span className={`font-bold px-2 py-0.5 rounded-lg ${
                              p.pontos === 3 ? 'bg-green-100 text-green-700' :
                              p.pontos === 1 ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>+{p.pontos}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Footer normal antes do prazo */
        <div className="px-4 pb-4 flex items-center justify-between min-h-[36px]">
          <span className="text-xs text-gray-400">
            {jogo.palpite_aberto && pagou
              ? diff > 0 ? (
                horas >= 24 
                  ? `Fecha em ${Math.floor(horas / 24)}d`
                  : `Fecha em ${horas}h ${minutos}m`
              ) : 'Prazo encerrado'
              : !pagou ? '' : 'Prazo encerrado'}
          </span>
          <div className="flex items-center gap-2">
            {temPalpite && !editando && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                <Check size={11} /> salvo
              </span>
            )}
            {jogo.palpite_aberto && pagou && editando && (
              <button onClick={salvar} disabled={salvando || casa === '' || fora === ''}
                className="bg-[#1a6b3c] text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
                {salvando ? '...' : 'Salvar'}
              </button>
            )}
          </div>
        </div>
      )}

      {habilitarExtra && <PalpiteExtra
        jogoId={jogo.id}
        extras={jogo.extras || []}
        palpiteAberto={jogo.palpite_aberto && pagou}
        onPago={() => {}}
        valorExtra2={valorExtra2}
        valorExtra3={valorExtra3}
        valorExtra4={valorExtra4}
      />}
    </div>
  )
}


export default function PalpitesPage() {
  const supabase = createClient()
  const [faseAtiva, setFaseAtiva] = useState('grupos')
  const [fasesLiberadas, setFasesLiberadas] = useState<string[]>([])
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [pagou, setPagou] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [habilitarExtra, setHabilitarExtra] = useState(true)
  const [valorExtra2, setValorExtra2] = useState(10)
  const [valorExtra3, setValorExtra3] = useState(15)
  const [valorExtra4, setValorExtra4] = useState(20)
  const [habilitarOuro, setHabilitarOuro] = useState(true)
  const [nomeBolao, setNomeBolao] = useState('')
  

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const [{ data: fases }, { data: pag }, { data: profileData }] = await Promise.all([
        supabase.from('fases').select('fase').eq('liberada', true),
        supabase.from('pagamentos').select('status').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('bolao_id').eq('id', user.id).single(),
      ])

      let bolaoConfig: any = { nome: '', habilitar_palpite_extra: true, habilitar_palpite_ouro: true, valor_palpite_extra_2: 10, valor_palpite_extra_3: 15, valor_palpite_extra_4: 20 }
      if (profileData?.bolao_id) {
        const { data: bolao } = await supabase
            .from('boloes')
.select('nome, habilitar_palpite_extra, habilitar_palpite_ouro, valor_palpite_extra_2, valor_palpite_extra_3, valor_palpite_extra_4')            .eq('id', profileData.bolao_id)
            .single()
        if (bolao) bolaoConfig = bolao
        setNomeBolao(bolao?.nome || '')
      }

      setHabilitarExtra(bolaoConfig.habilitar_palpite_extra)
      setValorExtra2(bolaoConfig.valor_palpite_extra_2 ?? 10)
      setValorExtra3(bolaoConfig.valor_palpite_extra_3 ?? 15)
      setValorExtra4(bolaoConfig.valor_palpite_extra_4 ?? 20)
      setHabilitarOuro(bolaoConfig.habilitar_palpite_ouro)
      setFasesLiberadas((fases || []).map((f: any) => f.fase))
      setPagou(pag?.status === 'aprovado')
      setCarregando(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!userId) return
    async function loadJogos() {
      setCarregando(true)
      const { data: jogosData } = await supabase
        .from('jogos')
        .select('id, fase, data_hora, status, gols_casa, gols_fora, time_casa_id, time_fora_id')
        .eq('fase', faseAtiva)
        .order('data_hora')

      if (!jogosData || jogosData.length === 0) {
        setJogos([]); setCarregando(false); return
      }

      const timeIds = [...new Set([
        ...jogosData.map((j: any) => j.time_casa_id),
        ...jogosData.map((j: any) => j.time_fora_id),
      ])]
      const { data: times } = await supabase.from('times').select('id, nome, codigo').in('id', timeIds)
      const timesMap: Record<string, Time> = {}
      ;(times || []).forEach((t: any) => { timesMap[t.id] = t })

      const ids = jogosData.map((j: any) => j.id)
      const { data: palpites } = await supabase
        .from('palpites').select('jogo_id, gols_casa, gols_fora')
        .eq('user_id', userId).in('jogo_id', ids)
      const palpiteMap: Record<string, any> = {}
      ;(palpites || []).forEach((p: any) => { palpiteMap[p.jogo_id] = p })

      // ← busca extras
      const { data: extrasData } = await supabase
        .from('palpites_extras')
        .select('numero, gols_casa, gols_fora, status_pagamento, pontos, jogo_id')
        .eq('user_id', userId)
        .in('jogo_id', ids)
      const extrasMap: Record<string, any[]> = {}
      ;(extrasData || []).forEach((e: any) => {
        if (!extrasMap[e.jogo_id]) extrasMap[e.jogo_id] = []
        extrasMap[e.jogo_id].push(e)
      })

      const agora = new Date()
      setJogos(jogosData.map((j: any) => ({
        ...j,
        time_casa: timesMap[j.time_casa_id],
        time_fora: timesMap[j.time_fora_id],
        palpite: palpiteMap[j.id] || null,
        extras: extrasMap[j.id] || [],  // ← adiciona extras
        palpite_aberto: new Date(j.data_hora) > new Date(agora.getTime() + 24 * 60 * 60 * 1000) && j.status === 'agendado',
      })))
      setCarregando(false)
    }
    loadJogos()
  }, [faseAtiva, userId])

  function onSalvo(id: string, casa: number, fora: number) {
    setJogos(prev => prev.map(j => j.id === id
      ? { ...j, palpite: { gols_casa: casa, gols_fora: fora } } : j
    ))
  }

  const faseAtualLabel = FASES.find(f => f.key === faseAtiva)?.label || 'Fase de grupos'

  return (
    <div>
      <Header titulo="Palpites" subtitulo={nomeBolao || 'Copa do Mundo 2026'} />

      {!pagou && !carregando && (
        <div className="mx-4 mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Pagamento pendente</p>
            <p className="text-xs text-amber-600 mt-0.5">Faça o pagamento de R$ 100 para liberar seus palpites.</p>
          </div>
        </div>
      )}

      {pagou && userId && (
        <div className="mt-4">
          {habilitarOuro && <PalpiteOuro userId={userId} pagou={pagou} />}
        </div>
      )}

      <div className="px-4 mt-4 relative">
        <button onClick={() => setDropdownAberto(!dropdownAberto)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm">
          <span className="text-sm font-semibold text-gray-800">{faseAtualLabel}</span>
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${dropdownAberto ? 'rotate-180' : ''}`} />
        </button>

        {dropdownAberto && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden">
            {FASES.map(f => {
              const liberada = fasesLiberadas.includes(f.key)
              const ativa = faseAtiva === f.key
              return (
                <button key={f.key}
                  onClick={() => { if (liberada) { setFaseAtiva(f.key); setDropdownAberto(false) } }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm border-b border-gray-50 last:border-0 transition-colors ${
                    ativa ? 'bg-green-50 text-green-700 font-semibold'
                    : liberada ? 'text-gray-700 hover:bg-gray-50'
                    : 'text-gray-300 cursor-not-allowed'
                  }`}>
                  <span>{f.label}</span>
                  {!liberada && <Lock size={13} className="text-gray-300" />}
                  {ativa && <Check size={14} className="text-green-600" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-4 pt-3" onClick={() => dropdownAberto && setDropdownAberto(false)}>
        {carregando ? (
          <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
        ) : !fasesLiberadas.includes(faseAtiva) ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Lock size={24} className="text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 font-medium">Fase não liberada</p>
            <p className="text-gray-400 text-sm mt-1">O admin libera em breve.</p>
          </div>
        ) : jogos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Nenhum jogo cadastrado nesta fase.</p>
          </div>
        ) : (() => {
          // Agrupa jogos por data
          const grupos = jogos.reduce((acc, j) => {
            const data = new Date(j.data_hora).toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long'
            })
            if (!acc[data]) acc[data] = []
            acc[data].push(j)
            return acc
          }, {} as Record<string, Jogo[]>)

          return Object.entries(grupos).map(([data, jogosData]) => (
            <GrupoData key={data} data={data} jogos={jogosData} userId={userId!} pagou={pagou} onSalvo={onSalvo} 
              habilitarExtra={habilitarExtra} valorExtra2={valorExtra2} valorExtra3={valorExtra3} valorExtra4={valorExtra4} />
          ))
        })()}
      </div>
    </div>
  )
}
