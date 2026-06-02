'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
}

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [aba, setAba] = useState<'fases' | 'jogos' | 'pagamentos'>('fases')
  const [fases, setFases] = useState<Fase[]>([])
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [faseJogos, setFaseJogos] = useState('grupos')
  const [salvando, setSalvando] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Record<string, { casa: string; fora: string }>>({})
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function verificarAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/palpites'); return }
      setCarregando(false)
      loadFases()
    }
    verificarAdmin()
  }, [])

  async function loadFases() {
    const { data } = await supabase.from('fases').select('*').order('ordem')
    setFases(data || [])
  }

  async function loadJogos(fase: string) {
    const { data: jogosData } = await supabase
      .from('jogos')
      .select('id, fase, data_hora, status, gols_casa, gols_fora, time_casa_id, time_fora_id')
      .eq('fase', fase)
      .order('data_hora')

    if (!jogosData) return

    const timeIds = [...new Set([
      ...jogosData.map((j: any) => j.time_casa_id),
      ...jogosData.map((j: any) => j.time_fora_id),
    ])]
    const { data: times } = await supabase
      .from('times').select('id, nome, codigo').in('id', timeIds)
    const timesMap: Record<string, any> = {}
    ;(times || []).forEach((t: any) => { timesMap[t.id] = t })

    setJogos(jogosData.map((j: any) => ({
      ...j,
      time_casa: timesMap[j.time_casa_id],
      time_fora: timesMap[j.time_fora_id],
    })))
  }

  async function loadPagamentos() {
    const { data } = await supabase
      .from('pagamentos')
      .select('id, valor, status, pago_em, profiles(nome, email)')
      .order('created_at', { ascending: false })
    setPagamentos((data || []) as any)
  }

  useEffect(() => {
    if (aba === 'jogos') loadJogos(faseJogos)
    if (aba === 'pagamentos') loadPagamentos()
  }, [aba, faseJogos])

  async function toggleFase(fase: Fase) {
    setSalvando(fase.id)
    await supabase.from('fases').update({
      liberada: !fase.liberada,
      liberada_em: !fase.liberada ? new Date().toISOString() : null,
    }).eq('id', fase.id)
    await loadFases()
    setSalvando(null)
  }

  async function salvarResultado(jogo: Jogo) {
    const r = resultado[jogo.id]
    if (!r || r.casa === '' || r.fora === '') return
    setSalvando(jogo.id)
    await supabase.from('jogos').update({
      gols_casa: Number(r.casa),
      gols_fora: Number(r.fora),
      status: 'encerrado',
    }).eq('id', jogo.id)
    await supabase.rpc('apurar_jogo', { p_jogo_id: jogo.id })
    await loadJogos(faseJogos)
    setResultado(prev => { const n = { ...prev }; delete n[jogo.id]; return n })
    setSalvando(null)
  }

  async function aprovarPagamento(id: string) {
    setSalvando(id)
    await supabase.from('pagamentos').update({
      status: 'aprovado',
      pago_em: new Date().toISOString(),
    }).eq('id', id)
    await loadPagamentos()
    setSalvando(null)
  }

  if (carregando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Verificando acesso...</p>
    </div>
  )

  return (
    <div>
      <div className="bg-[#1a6b3c] pt-12 pb-0 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-semibold">Admin</h1>
          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">🔐 Admin</span>
        </div>
        <div className="flex">
          {(['fases', 'jogos', 'pagamentos'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                aba === a ? 'border-white text-white' : 'border-transparent text-white/50'
              }`}>
              {a === 'fases' ? 'Fases' : a === 'jogos' ? 'Jogos' : 'Pagamentos'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">

        {aba === 'fases' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {fases.map((f, i) => (
              <div key={f.id} className={`flex items-center justify-between px-4 py-4 ${i < fases.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{FASE_LABELS[f.fase]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.liberada ? '✅ Liberada' : '🔒 Bloqueada'}</p>
                </div>
                <button
                  onClick={() => toggleFase(f)}
                  disabled={salvando === f.id}
                  className={`w-12 h-6 rounded-full relative transition-colors ${f.liberada ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${f.liberada ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {aba === 'jogos' && (
          <>
            <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
              {Object.entries(FASE_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => setFaseJogos(key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                    faseJogos === key ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {jogos.map(j => (
              <div key={j.id} className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>{new Date(j.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span className={`font-medium ${j.status === 'encerrado' ? 'text-green-600' : 'text-amber-500'}`}>
                    {j.status === 'encerrado' ? '✓ Encerrado' : 'Agendado'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-2xl">{BANDEIRAS[j.time_casa?.codigo || ''] || '🏳️'}</span>
                    <span className="text-xs text-gray-500 text-center">{j.time_casa?.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {j.status === 'encerrado' ? (
                      <span className="text-lg font-semibold text-gray-700">{j.gols_casa} × {j.gols_fora}</span>
                    ) : (
                      <>
                        <input type="number" min="0" max="20" placeholder="–"
                          value={resultado[j.id]?.casa ?? ''}
                          onChange={e => setResultado(prev => ({ ...prev, [j.id]: { ...prev[j.id], casa: e.target.value } }))}
                          className="w-12 h-10 text-center text-lg font-semibold border border-gray-200 rounded-xl outline-none focus:border-green-500" />
                        <span className="text-gray-300">×</span>
                        <input type="number" min="0" max="20" placeholder="–"
                          value={resultado[j.id]?.fora ?? ''}
                          onChange={e => setResultado(prev => ({ ...prev, [j.id]: { ...prev[j.id], fora: e.target.value } }))}
                          className="w-12 h-10 text-center text-lg font-semibold border border-gray-200 rounded-xl outline-none focus:border-green-500" />
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-2xl">{BANDEIRAS[j.time_fora?.codigo || ''] || '🏳️'}</span>
                    <span className="text-xs text-gray-500 text-center">{j.time_fora?.nome}</span>
                  </div>
                </div>

                {j.status !== 'encerrado' && (
                  <button
                    onClick={() => salvarResultado(j)}
                    disabled={salvando === j.id || !resultado[j.id]?.casa || !resultado[j.id]?.fora}
                    className="w-full bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                  >
                    {salvando === j.id ? 'Salvando...' : 'Salvar resultado e pontuar'}
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {aba === 'pagamentos' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {pagamentos.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Nenhum pagamento ainda</p>
            ) : pagamentos.map((p, i) => (
              <div key={p.id} className={`px-4 py-4 ${i < pagamentos.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.profiles?.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{p.profiles?.email}</p>
                    {p.pago_em && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(p.pago_em).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {p.status === 'aprovado' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓ Pago</span>
                    ) : p.status === 'pendente' ? (
                      <button
                        onClick={() => aprovarPagamento(p.id)}
                        disabled={salvando === p.id}
                        className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium active:scale-95 transition-transform"
                      >
                        {salvando === p.id ? '...' : 'Aprovar'}
                      </button>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Recusado</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
