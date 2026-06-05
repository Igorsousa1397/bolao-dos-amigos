'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, Check, Copy } from 'lucide-react'

type Fase = { id: string; fase: string; liberada: boolean; ordem: number }
type Jogo = {
  id: string; fase: string; data_hora: string; status: string
  gols_casa: number | null; gols_fora: number | null
  time_casa_id: string; time_fora_id: string
  time_casa?: { nome: string; codigo: string }
  time_fora?: { nome: string; codigo: string }
}
type Pagamento = {
  id: string; valor: number; status: string; pago_em: string | null
  profiles: { nome: string; email: string }
}

const FASE_LABELS: Record<string, string> = {
  grupos: 'Fase de grupos',
  segunda_rodada: '2ª rodada',
  oitavas: 'Oitavas de final',
  quartas: 'Quartas de final',
  semi: 'Semifinal',
  final: 'Final',
}

const BANDEIRAS: Record<string, string> = {
  BRA:'🇧🇷',ARG:'🇦🇷',FRA:'🇫🇷',ESP:'🇪🇸',GER:'🇩🇪',ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  POR:'🇵🇹',ITA:'🇮🇹',NED:'🇳🇱',BEL:'🇧🇪',URU:'🇺🇾',MEX:'🇲🇽',
  USA:'🇺🇸',CAN:'🇨🇦',COL:'🇨🇴',CHI:'🇨🇱',PAR:'🇵🇾',ECU:'🇪🇨',
  PER:'🇵🇪',BOL:'🇧🇴',VEN:'🇻🇪',CRC:'🇨🇷',PAN:'🇵🇦',HON:'🇭🇳',
  JAM:'🇯🇲',CUB:'🇨🇺',MAR:'🇲🇦',SEN:'🇸🇳',EGY:'🇪🇬',RSA:'🇿🇦',
  JPN:'🇯🇵',KOR:'🇰🇷',AUS:'🇦🇺',IDN:'🇮🇩',IRN:'🇮🇷',KSA:'🇸🇦',
  IRQ:'🇮🇶',JOR:'🇯🇴',TUR:'🇹🇷',AUT:'🇦🇹',DEN:'🇩🇰',SRB:'🇷🇸',
  CRO:'🇭🇷',ROU:'🇷🇴',ALB:'🇦🇱',UKR:'🇺🇦',NZL:'🇳🇿',
  QAT:'🇶🇦',SUI:'🇨🇭',CUW:'🇨🇼',CIV:'🇨🇮',TUN:'🇹🇳',
  CPV:'🇨🇻',ALG:'🇩🇿',NOR:'🇳🇴',RDC:'🇨🇩',GHA:'🇬🇭',
  UZB:'🇺🇿',SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',HTI:'🇭🇹',
  CZE:'🇨🇿',BIH:'🇧🇦',SWE:'🇸🇪',
}

function GrupoData({ data, jogos, resultado, setResultado, salvando, salvarResultado }: {
  data: string; jogos: Jogo[]
  resultado: Record<string, { casa: string; fora: string }>
  setResultado: any; salvando: string | null
  salvarResultado: (j: Jogo) => void
}) {
  const [aberto, setAberto] = useState(false)
  const pendentes = jogos.filter(j => j.status !== 'encerrado').length

  return (
    <div className="mb-2">
      <button onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm mb-2">
        <span className="text-sm font-semibold text-gray-800 capitalize">{data}</span>
        <div className="flex items-center gap-2">
          {pendentes > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{pendentes} pendente{pendentes > 1 ? 's' : ''}</span>
          )}
          <span className="text-xs text-gray-400">{jogos.length} jogo{jogos.length > 1 ? 's' : ''}</span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {aberto && jogos.map(j => (
        <div key={j.id} className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-3">
            <span>{new Date(j.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</span>
            <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
              j.status === 'encerrado' ? 'bg-green-100 text-green-700' :
              j.status === 'em_andamento' ? 'bg-red-100 text-red-600' :
              'bg-amber-100 text-amber-700'
            }`}>
              {j.status === 'encerrado' ? 'Encerrado' : j.status === 'em_andamento' ? 'Ao vivo' : 'Agendado'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-2xl">{BANDEIRAS[j.time_casa?.codigo || ''] || '🏳️'}</span>
              <span className="text-xs text-gray-500 text-center">{j.time_casa?.nome}</span>
            </div>
            <div className="flex items-center gap-2">
              {j.status === 'encerrado' ? (
                <span className="text-lg font-bold text-gray-800">{j.gols_casa} × {j.gols_fora}</span>
              ) : (
                <>
                  <input type="number" min="0" max="20" placeholder="–"
                    value={resultado[j.id]?.casa ?? ''}
                    onChange={e => setResultado((prev: any) => ({ ...prev, [j.id]: { ...prev[j.id], casa: e.target.value } }))}
                    className="w-12 h-10 text-center text-lg font-semibold border-2 border-green-200 rounded-xl outline-none focus:border-green-500 text-green-700 bg-green-50" />
                  <span className="text-gray-300 font-light">×</span>
                  <input type="number" min="0" max="20" placeholder="–"
                    value={resultado[j.id]?.fora ?? ''}
                    onChange={e => setResultado((prev: any) => ({ ...prev, [j.id]: { ...prev[j.id], fora: e.target.value } }))}
                    className="w-12 h-10 text-center text-lg font-semibold border-2 border-green-200 rounded-xl outline-none focus:border-green-500 text-green-700 bg-green-50" />
                </>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-2xl">{BANDEIRAS[j.time_fora?.codigo || ''] || '🏳️'}</span>
              <span className="text-xs text-gray-500 text-center">{j.time_fora?.nome}</span>
            </div>
          </div>

          {j.status !== 'encerrado' && (
            <button onClick={() => salvarResultado(j)}
              disabled={salvando === j.id || !resultado[j.id]?.casa || !resultado[j.id]?.fora}
              className="w-full bg-[#1a6b3c] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
              {salvando === j.id ? 'Salvando...' : 'Salvar resultado e pontuar'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [aba, setAba] = useState<'fases' | 'jogos' | 'pagamentos' | 'extras' | 'bolao'>('fases')
  const [boloes, setBoloes] = useState<any[]>([])
  const [bolaoSelecionadoId, setBolaoSelecionadoId] = useState<string | null>(null)
  const [dropdownBolaoAberto, setDropdownBolaoAberto] = useState(false)
  const [bolao, setBolao] = useState<any>(null)
  const [totalMembros, setTotalMembros] = useState(0)
  const [nomeBolao, setNomeBolao] = useState('')
  const [valorBolao, setValorBolao] = useState('')
  const [chavePix, setChavePix] = useState('')
  const [salvandoBolao, setSalvandoBolao] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [toast, setToast] = useState('')
  const [fases, setFases] = useState<Fase[]>([])
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [faseJogos, setFaseJogos] = useState('grupos')
  const [dropdownFaseAberto, setDropdownFaseAberto] = useState(false)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Record<string, { casa: string; fora: string }>>({})
  const [carregando, setCarregando] = useState(true)
  const [habilitarAzarao, setHabilitarAzarao] = useState(true)
  const [habilitarOuro, setHabilitarOuro] = useState(true)
  const [habilitarExtra, setHabilitarExtra] = useState(true)
  const [valorExtra2, setValorExtra2] = useState('10')
  const [valorExtra3, setValorExtra3] = useState('15')
  const [valorExtra4, setValorExtra4] = useState('20')
  const [confirmandoPlano, setConfirmandoPlano] = useState(false)
  const [lugares, setLugares] = useState<{ lugar: number; pct: number }[]>([
    { lugar: 1, pct: 60 }, { lugar: 2, pct: 25 }, { lugar: 3, pct: 15 },
  ])
  const [azaraoPct, setAzaraoPct] = useState('50')
  const MAX_LUGARES = 5
  const [extrasPedidos, setExtrasPedidos] = useState<any[]>([])
  const [expandidoExtra, setExpandidoExtra] = useState<string | null>(null)

  useEffect(() => {
    async function verificarAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/palpites'); return }

      const { data: boloesData } = await supabase
        .from('boloes').select('id, nome')
        .or(`admin_id.eq.${user.id},admins_extras.cs.{${user.id}}`)
        .order('created_at')
      if (boloesData && boloesData.length > 0) {
        setBoloes(boloesData)
        setBolaoSelecionadoId(boloesData[0].id)
      }

      setCarregando(false)
      loadFases()
    }
    verificarAdmin()
  }, [])

  const bolaoSelecionado = boloes.find(b => b.id === bolaoSelecionadoId)

  async function loadFases() {
    const { data } = await supabase.from('fases').select('*').order('ordem')
    setFases(data || [])
  }

  async function loadJogos(fase: string) {
    const { data: jogosData } = await supabase
      .from('jogos')
      .select('id, fase, data_hora, status, gols_casa, gols_fora, time_casa_id, time_fora_id')
      .eq('fase', fase).order('data_hora')
    if (!jogosData) return
    const timeIds = [...new Set([...jogosData.map((j: any) => j.time_casa_id), ...jogosData.map((j: any) => j.time_fora_id)])]
    const { data: times } = await supabase.from('times').select('id, nome, codigo').in('id', timeIds)
    const timesMap: Record<string, any> = {}
    ;(times || []).forEach((t: any) => { timesMap[t.id] = t })
    setJogos(jogosData.map((j: any) => ({ ...j, time_casa: timesMap[j.time_casa_id], time_fora: timesMap[j.time_fora_id] })))
  }

  async function loadPagamentos() {
    if (!bolaoSelecionadoId) return
    const { data, error } = await supabase
      .from('bolao_membros')
      .select('user_id, joined_at, profiles(nome, email)')
      .eq('bolao_id', bolaoSelecionadoId)
      .order('joined_at')
    if (error) { console.error('erro membros:', error); return }
    const userIds = (data || []).map((m: any) => m.user_id)
    const { data: pags } = await supabase
      .from('pagamentos')
      .select('user_id, id, status, pago_em')
      .in('user_id', userIds)
    const pagsMap: Record<string, any> = {}
    ;(pags || []).forEach((p: any) => { pagsMap[p.user_id] = p })
    setPagamentos((data || []).map((m: any) => ({ ...m, pagamento: pagsMap[m.user_id] || null })) as any)
  }

  async function loadExtras() {
    if (!bolaoSelecionadoId) return
    // pedidos de palpite extra deste bolão
    const { data, error } = await supabase
      .from('palpites_extras')
      .select('id, user_id, jogo_id, numero, gols_casa, gols_fora, valor_pago, status_pagamento, created_at')
      .eq('bolao_id', bolaoSelecionadoId)
      .order('created_at', { ascending: false })
    if (error) { console.error('erro extras:', error); return }
    const lista = data || []

    // nomes dos usuários
    const userIds = [...new Set(lista.map((e: any) => e.user_id))]
    const { data: profs } = await supabase.from('profiles').select('id, nome, email').in('id', userIds)
    const profMap: Record<string, any> = {}
    ;(profs || []).forEach((p: any) => { profMap[p.id] = p })

    // nomes dos jogos (times)
    const jogoIds = [...new Set(lista.map((e: any) => e.jogo_id))]
    const { data: jogosData } = await supabase
      .from('jogos').select('id, time_casa_id, time_fora_id').in('id', jogoIds)
    const timeIds = [...new Set([...(jogosData || []).map((j: any) => j.time_casa_id), ...(jogosData || []).map((j: any) => j.time_fora_id)])]
    const { data: times } = await supabase.from('times').select('id, nome').in('id', timeIds)
    const timeMap: Record<string, string> = {}
    ;(times || []).forEach((t: any) => { timeMap[t.id] = t.nome })
    const jogoMap: Record<string, string> = {}
    ;(jogosData || []).forEach((j: any) => { jogoMap[j.id] = `${timeMap[j.time_casa_id] || '?'} × ${timeMap[j.time_fora_id] || '?'}` })

    setExtrasPedidos(lista.map((e: any) => ({
      ...e,
      nome: profMap[e.user_id]?.nome || 'Usuário',
      email: profMap[e.user_id]?.email || '',
      jogoLabel: jogoMap[e.jogo_id] || 'Jogo',
    })))
  }

  async function toggleExtra(e: any) {
    setSalvando(e.id)
    const aprovado = e.status_pagamento === 'aprovado'
    await supabase.from('palpites_extras').update({
      status_pagamento: aprovado ? 'pendente' : 'aprovado',
    }).eq('id', e.id)
    await loadExtras()
    setSalvando(null)
  }

  async function loadBolao() {
    if (!bolaoSelecionadoId) return
    const { data } = await supabase.from('boloes').select('*').eq('id', bolaoSelecionadoId).single()
    if (data) {
      setBolao(data)
      setNomeBolao(data.nome)
      setValorBolao(data.valor_inscricao.toString())
      setHabilitarAzarao(data.habilitar_azarao ?? true)
      setHabilitarOuro(data.habilitar_palpite_ouro ?? true)
      setHabilitarExtra(data.habilitar_palpite_extra ?? true)
      setChavePix(data.chave_pix || '')
      setValorExtra2((data.valor_palpite_extra_2 ?? 10).toString())
      setValorExtra3((data.valor_palpite_extra_3 ?? 15).toString())
      setValorExtra4((data.valor_palpite_extra_4 ?? 20).toString())
      if (Array.isArray(data.premiacao) && data.premiacao.length > 0) {
        setLugares([...data.premiacao].sort((a: any, b: any) => a.lugar - b.lugar))
      } else {
        setLugares([{ lugar: 1, pct: 60 }, { lugar: 2, pct: 25 }, { lugar: 3, pct: 15 }])
      }
      setAzaraoPct((data.azarao_pct ?? 50).toString())
    }

    const { count } = await supabase
      .from('bolao_membros')
      .select('*', { count: 'exact', head: true })
      .eq('bolao_id', bolaoSelecionadoId)
    setTotalMembros(count || 0)
  }

  // Carrega dados conforme a aba e o bolão selecionado
  useEffect(() => {
    if (!bolaoSelecionadoId) return
    loadBolao()
    if (aba === 'jogos') loadJogos(faseJogos)
    if (aba === 'pagamentos') loadPagamentos()
    if (aba === 'extras') loadExtras()
  }, [aba, faseJogos, bolaoSelecionadoId])

  // Confirma upgrade de plano ao voltar do Mercado Pago
  useEffect(() => {
    if (!bolaoSelecionadoId) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('plano') !== 'aprovado') return

    let cancelado = false

    async function confirmarUpgrade() {
      setConfirmandoPlano(true)
      // webhook pode levar alguns segundos — tenta por ~15s
      for (let i = 0; i < 6 && !cancelado; i++) {
        const { data } = await supabase
          .from('boloes')
          .select('status_plano')
          .eq('id', bolaoSelecionadoId)
          .single()
        if (data?.status_plano === 'ativo') {
          await loadBolao()
          setToast('Plano atualizado com sucesso!')
          setTimeout(() => setToast(''), 3000)
          break
        }
        await new Promise(r => setTimeout(r, 2500))
      }
      if (!cancelado) {
        setConfirmandoPlano(false)
        router.replace('/admin') // limpa o ?plano= da URL
      }
    }

    confirmarUpgrade()
    return () => { cancelado = true }
  }, [bolaoSelecionadoId])

  async function toggleFase(fase: Fase) {
    setSalvando(fase.id)
    await supabase.from('fases').update({ liberada: !fase.liberada, liberada_em: !fase.liberada ? new Date().toISOString() : null }).eq('id', fase.id)
    await loadFases()
    setSalvando(null)
  }

  async function salvarResultado(jogo: Jogo) {
    const r = resultado[jogo.id]
    if (!r || r.casa === '' || r.fora === '') return
    setSalvando(jogo.id)
    await supabase.from('jogos').update({ gols_casa: Number(r.casa), gols_fora: Number(r.fora), status: 'encerrado' }).eq('id', jogo.id)
    await supabase.rpc('apurar_jogo', { p_jogo_id: jogo.id })
    await loadJogos(faseJogos)
    setResultado(prev => { const n = { ...prev }; delete n[jogo.id]; return n })
    setSalvando(null)
  }

  async function togglePagamento(p: any) {
    const key = p.pagamento?.id || p.user_id
    setSalvando(key)
    const pago = p.pagamento?.status === 'aprovado'

    if (p.pagamento?.id) {
      // já existe registro — alterna aprovado <-> pendente
      await supabase.from('pagamentos').update({
        status: pago ? 'pendente' : 'aprovado',
        pago_em: pago ? null : new Date().toISOString(),
      }).eq('id', p.pagamento.id)
    } else {
      // sem registro — cria já aprovado
      await supabase.from('pagamentos').insert({
        user_id: p.user_id,
        bolao_id: bolaoSelecionadoId,
        valor: bolao?.valor_inscricao ?? 100,
        status: 'aprovado',
        pago_em: new Date().toISOString(),
      })
    }
    await loadPagamentos()
    setSalvando(null)
  }

  async function salvarBolao() {
    if (!bolao) return
    setSalvandoBolao(true)
    await supabase.from('boloes').update({
      nome: nomeBolao,
      valor_inscricao: Number(valorBolao),
      chave_pix: chavePix,
      habilitar_azarao: habilitarAzarao,
      habilitar_palpite_ouro: habilitarOuro,
      habilitar_palpite_extra: habilitarExtra,
      valor_palpite_extra_2: Number(valorExtra2),
      valor_palpite_extra_3: Number(valorExtra3),
      valor_palpite_extra_4: Number(valorExtra4),
      premiacao: lugares.map(l => ({ lugar: l.lugar, pct: Number(l.pct) || 0 })),
      azarao_pct: Number(azaraoPct) || 0,
    }).eq('id', bolao.id)
    await loadBolao()
    setSalvandoBolao(false)
    setToast('Salvo com sucesso!')
    setTimeout(() => setToast(''), 3000)
  }

  function copiarLink() {
    if (!bolao) return
    navigator.clipboard.writeText(`${window.location.origin}/entrar/${bolao.codigo_convite}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const jogosPorData = jogos.reduce((acc, j) => {
    const data = new Date(j.data_hora).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    if (!acc[data]) acc[data] = []
    acc[data].push(j)
    return acc
  }, {} as Record<string, Jogo[]>)

  if (carregando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Verificando acesso...</p>
    </div>
  )

  const limiteAtingido = totalMembros >= (bolao?.plano || 5)
  const planoGratuito = (bolao?.plano || 5) <= 5

  return (
    <div>
      <div className="bg-[#1a6b3c] pt-12 pb-0 px-4">
        <div className="text-center mb-3">
          <h1 className="text-white text-xl font-semibold">Admin</h1>
        </div>

        {boloes.length > 1 && (
          <div className="relative mb-3">
            <button onClick={() => setDropdownBolaoAberto(!dropdownBolaoAberto)}
              className="w-full flex items-center justify-between bg-white/15 border border-white/20 rounded-xl px-4 py-2.5">
              <span className="text-white text-sm font-medium">{bolaoSelecionado?.nome || 'Selecionar bolão'}</span>
              <ChevronDown size={16} className={`text-white/70 transition-transform ${dropdownBolaoAberto ? 'rotate-180' : ''}`} />
            </button>
            {dropdownBolaoAberto && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden">
                {boloes.map(b => (
                  <button key={b.id} onClick={() => { setBolaoSelecionadoId(b.id); setDropdownBolaoAberto(false) }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-sm border-b border-gray-50 last:border-0 ${
                      bolaoSelecionadoId === b.id ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'
                    }`}>
                    {b.nome}
                    {bolaoSelecionadoId === b.id && <Check size={14} className="text-green-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex">
          {(['fases', 'jogos', 'pagamentos', 'extras', 'bolao'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors text-center ${
                aba === a ? 'border-white text-white' : 'border-transparent text-white/50'
              }`}>
              {a === 'fases' ? 'Fases' : a === 'jogos' ? 'Jogos' : a === 'pagamentos' ? 'Inscrições' : a === 'extras' ? 'Extras' : 'Bolão'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">

        {aba === 'fases' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {fases.map((f, i) => (
              <div key={f.id} className={`flex items-center justify-between px-4 py-4 ${i < fases.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{FASE_LABELS[f.fase]}</p>
                  <p className={`text-xs mt-0.5 ${f.liberada ? 'text-green-600' : 'text-gray-400'}`}>
                    {f.liberada ? 'Liberada' : 'Bloqueada'}
                  </p>
                </div>
                <button onClick={() => toggleFase(f)} disabled={salvando === f.id}
                  className={`w-12 h-6 rounded-full relative transition-colors ${f.liberada ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${f.liberada ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {aba === 'jogos' && (
          <div onClick={() => dropdownFaseAberto && setDropdownFaseAberto(false)}>
            <div className="relative mb-4">
              <button onClick={e => { e.stopPropagation(); setDropdownFaseAberto(!dropdownFaseAberto) }}
                className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm">
                <span className="text-sm font-semibold text-gray-800">{FASE_LABELS[faseJogos]}</span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${dropdownFaseAberto ? 'rotate-180' : ''}`} />
              </button>
              {dropdownFaseAberto && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden">
                  {Object.entries(FASE_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => { setFaseJogos(key); setDropdownFaseAberto(false) }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-sm border-b border-gray-50 last:border-0 transition-colors ${
                        faseJogos === key ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                      {label}
                      {faseJogos === key && <Check size={14} className="text-green-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {jogos.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Nenhum jogo nesta fase</p>
            ) : (
              Object.entries(jogosPorData).map(([data, jogosData]) => (
                <GrupoData key={data} data={data} jogos={jogosData}
                  resultado={resultado} setResultado={setResultado}
                  salvando={salvando} salvarResultado={salvarResultado} />
              ))
            )}
          </div>
        )}

        {aba === 'pagamentos' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {pagamentos.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Nenhum participante ainda</p>
            ) : pagamentos.map((p: any, i: number) => (
              <div key={p.user_id} className={`px-4 py-4 ${i < pagamentos.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.profiles?.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{p.profiles?.email}</p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {(() => {
                      const pago = p.pagamento?.status === 'aprovado'
                      const key = p.pagamento?.id || p.user_id
                      return (
                        <button onClick={() => togglePagamento(p)}
                          disabled={salvando === key}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors active:scale-95 ${
                            pago ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                          {salvando === key ? '...' : (pago ? '✓ Pago' : 'Marcar pago')}
                        </button>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === 'extras' && (
          <div className="flex flex-col gap-3">
            {extrasPedidos.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Nenhum palpite extra solicitado</p>
            ) : (
              <>
                <p className="text-xs text-gray-400 px-1">
                  {extrasPedidos.filter(e => e.status_pagamento === 'pendente').length} pendente(s) de aprovação
                </p>
                {extrasPedidos.map(e => {
                  const aprovado = e.status_pagamento === 'aprovado'
                  const expandido = expandidoExtra === e.id
                  return (
                    <div key={e.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <button onClick={() => setExpandidoExtra(expandido ? null : e.id)}
                        className="w-full flex items-center justify-between px-4 py-3.5">
                        <div className="min-w-0 text-left">
                          <p className="text-sm font-medium text-gray-800 truncate">{e.nome}</p>
                          <p className="text-xs text-gray-400 truncate">Palpite #{e.numero} · {e.jogoLabel}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${aprovado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {aprovado ? '✓ Pago' : 'Pendente'}
                          </span>
                          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandido ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {expandido && (
                        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                          <div className="flex flex-col gap-2 mb-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">E-mail</span>
                              <span className="text-gray-600">{e.email}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Jogo</span>
                              <span className="text-gray-600">{e.jogoLabel}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Palpite</span>
                              <span className="text-gray-800 font-semibold">{e.gols_casa} × {e.gols_fora}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Valor</span>
                              <span className="text-gray-600">R$ {Number(e.valor_pago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                          <button onClick={() => toggleExtra(e)} disabled={salvando === e.id}
                            className={`w-full text-sm font-semibold py-2.5 rounded-xl active:scale-95 transition-transform disabled:opacity-40 ${
                              aprovado ? 'bg-gray-100 text-gray-600' : 'bg-[#1a6b3c] text-white'
                            }`}>
                            {salvando === e.id ? '...' : (aprovado ? 'Marcar como pendente' : 'Aprovar pagamento')}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {aba === 'bolao' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Configurações</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">Nome do bolão</label>
                  <input type="text" value={nomeBolao} onChange={e => setNomeBolao(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">Valor de inscrição (R$)</label>
                  <input type="number" value={valorBolao} onChange={e => setValorBolao(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">Chave PIX</label>
                  <input type="text" value={chavePix} onChange={e => setChavePix(e.target.value)}
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-500" />
                  <p className="text-xs text-gray-400 mt-1">Os participantes verão essa chave para pagar a inscrição</p>
                </div>
                <button onClick={salvarBolao}
                  disabled={salvandoBolao || (bolao && nomeBolao === bolao.nome && valorBolao === bolao.valor_inscricao.toString() && chavePix === (bolao.chave_pix || ''))}
                  className="w-full bg-[#1a6b3c] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 active:scale-95 transition-transform">
                  {salvandoBolao ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-800">Link de convite</h3>
                {bolao && (planoGratuito ? (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">Plano gratuito · até 5</span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Plano pago · até {bolao.plano}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mb-2">Compartilhe para convidar participantes</p>
              <p className="text-xs text-gray-400 mb-4">
                {totalMembros}/{bolao?.plano || 5} participantes
              </p>
              {bolao && (
                <div className="flex flex-col gap-2">
                  {!limiteAtingido ? (
                    <>
                      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 break-all mb-1">
                        {typeof window !== 'undefined' ? `${window.location.origin}/entrar/${bolao.codigo_convite}` : ''}
                      </div>
                      <button onClick={copiarLink}
                        className="w-full flex items-center justify-center gap-2 border border-[#1a6b3c] text-[#1a6b3c] font-semibold py-3 rounded-xl text-sm active:scale-95 transition-transform">
                        {copiado ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar link de convite</>}
                      </button>
                    </>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 text-center mb-1">
                      Bolão lotado! Limite de {bolao.plano} participantes atingido.
                    </div>
                  )}

                  {planoGratuito && (
                    <button onClick={() => router.push('/upgrade')}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold py-3 rounded-xl text-sm active:scale-95 transition-transform">
                      🚀 Fazer upgrade do plano
                    </button>
                  )}
                  {planoGratuito && !limiteAtingido && (
                    <p className="text-xs text-gray-400 text-center">
                      Você pode aumentar o limite quando quiser, sem esperar lotar.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Premiação</h3>
              <p className="text-xs text-gray-400 mb-4">Defina os lugares premiados e a % de cada um (do total arrecadado)</p>

              <div className="flex flex-col gap-2">
                {lugares.map((l, idx) => (
                  <div key={l.lugar} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-16">{l.lugar}º lugar</span>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="number" min="0" max="100" value={l.pct}
                        onChange={e => setLugares(prev => prev.map((x, i) => i === idx ? { ...x, pct: Number(e.target.value) } : x))}
                        className="w-20 text-center text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-green-500 text-gray-800" />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                    {lugares.length > 1 && (
                      <button onClick={() => setLugares(prev => prev.filter((_, i) => i !== idx).map((x, i) => ({ ...x, lugar: i + 1 })))}
                        className="text-xs text-red-500 px-2 py-1 rounded-lg hover:bg-red-50">Remover</button>
                    )}
                  </div>
                ))}
              </div>

              {lugares.length < MAX_LUGARES && (
                <button onClick={() => setLugares(prev => [...prev, { lugar: prev.length + 1, pct: 0 }])}
                  className="mt-2 text-sm text-[#1a6b3c] font-medium px-2 py-1.5 rounded-lg hover:bg-green-50">
                  + Adicionar lugar
                </button>
              )}

              {(() => {
                const soma = lugares.reduce((s, l) => s + (Number(l.pct) || 0), 0)
                return (
                  <p className={`text-xs mt-2 ${soma === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                    Soma atual: {soma}% {soma === 100 ? '✓' : '(o ideal é somar 100%)'}
                  </p>
                )
              })()}

              <div className="border-t border-gray-50 mt-4 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 flex-1">Azarão (% da inscrição)</span>
                  <input type="number" min="0" max="100" value={azaraoPct}
                    onChange={e => setAzaraoPct(e.target.value)}
                    className="w-20 text-center text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-green-500 text-gray-800" />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Descontado do total e pago a quem ficar em último (se o azarão estiver ativo)</p>
              </div>

              <button onClick={salvarBolao} disabled={salvandoBolao}
                className="w-full mt-4 bg-[#1a6b3c] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 active:scale-95 transition-transform">
                {salvandoBolao ? 'Salvando...' : 'Salvar premiação'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Regras especiais</h3>
              <p className="text-xs text-gray-400 mb-4">Ative ou desative funcionalidades</p>
              <div className="flex flex-col">
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Placar exato</p>
                    <p className="text-xs text-gray-400">+3 pts — sempre ativo</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Padrão</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Ganhador certo</p>
                    <p className="text-xs text-gray-400">+1 pt — sempre ativo</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Padrão</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Palpite de Ouro</p>
                    <p className="text-xs text-gray-400">+50 pts pelos finalistas + placar</p>
                  </div>
                  <button onClick={() => setHabilitarOuro(!habilitarOuro)}
                    className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${habilitarOuro ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${habilitarOuro ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Palpites extras</p>
                    <p className="text-xs text-gray-400">Palpites adicionais pagos por jogo</p>
                  </div>
                  <button onClick={() => setHabilitarExtra(!habilitarExtra)}
                    className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${habilitarExtra ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${habilitarExtra ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {habilitarExtra && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-2 flex flex-col gap-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Valores dos palpites extras</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">2º palpite</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input type="number" value={valorExtra2} onChange={e => setValorExtra2(e.target.value)}
                          className="w-16 text-center text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-green-500 text-gray-800" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">3º palpite</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input type="number" value={valorExtra3} onChange={e => setValorExtra3(e.target.value)}
                          className="w-16 text-center text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-green-500 text-gray-800" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">4º palpite</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">R$</span>
                        <input type="number" value={valorExtra4} onChange={e => setValorExtra4(e.target.value)}
                          className="w-16 text-center text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-green-500 text-gray-800" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Azarão</p>
                    <p className="text-xs text-gray-400">% da inscrição para o último lugar (ajuste acima)</p>
                  </div>
                  <button onClick={() => setHabilitarAzarao(!habilitarAzarao)}
                    className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${habilitarAzarao ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${habilitarAzarao ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <button onClick={salvarBolao}
                disabled={salvandoBolao || (
                  bolao &&
                  habilitarOuro === (bolao.habilitar_palpite_ouro ?? true) &&
                  habilitarExtra === (bolao.habilitar_palpite_extra ?? true) &&
                  habilitarAzarao === (bolao.habilitar_azarao ?? true) &&
                  valorExtra2 === (bolao.valor_palpite_extra_2 ?? 10).toString() &&
                  valorExtra3 === (bolao.valor_palpite_extra_3 ?? 15).toString() &&
                  valorExtra4 === (bolao.valor_palpite_extra_4 ?? 20).toString()
                )}
                className="w-full mt-4 bg-[#1a6b3c] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 active:scale-95 transition-transform">
                {salvandoBolao ? 'Salvando...' : 'Salvar regras'}
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmandoPlano && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-sm font-medium px-4 py-3 text-center z-50">
          Confirmando pagamento do plano...
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-4 right-4 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-2xl text-center z-50 shadow-lg">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
