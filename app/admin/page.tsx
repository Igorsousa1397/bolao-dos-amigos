'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, Check, Copy, Shield } from 'lucide-react'

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
  const [aba, setAba] = useState<'fases' | 'jogos' | 'pagamentos' | 'bolao'>('fases')
  const [bolao, setBolao] = useState<any>(null)
  const [nomeBolao, setNomeBolao] = useState('')
  const [valorBolao, setValorBolao] = useState('')
  const [salvandoBolao, setSalvandoBolao] = useState(false)
  const [copiado, setCopiado] = useState(false)
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
      .eq('fase', fase).order('data_hora')
    if (!jogosData) return
    const timeIds = [...new Set([...jogosData.map((j: any) => j.time_casa_id), ...jogosData.map((j: any) => j.time_fora_id)])]
    const { data: times } = await supabase.from('times').select('id, nome, codigo').in('id', timeIds)
    const timesMap: Record<string, any> = {}
    ;(times || []).forEach((t: any) => { timesMap[t.id] = t })
    setJogos(jogosData.map((j: any) => ({ ...j, time_casa: timesMap[j.time_casa_id], time_fora: timesMap[j.time_fora_id] })))
  }

  async function loadPagamentos() {
    const { data } = await supabase
      .from('pagamentos').select('id, valor, status, pago_em, profiles(nome, email)')
      .order('created_at', { ascending: false })
    setPagamentos((data || []) as any)
  }

  async function loadBolao() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('boloes').select('*').eq('admin_id', user.id).single()
    if (data) {
      setBolao(data)
      setNomeBolao(data.nome)
      setValorBolao(data.valor_inscricao.toString())
      setHabilitarAzarao(data.habilitar_azarao ?? true)
      setHabilitarOuro(data.habilitar_palpite_ouro ?? true)
      setHabilitarExtra(data.habilitar_palpite_extra ?? true)
    }
  }

  useEffect(() => {
    if (aba === 'jogos') loadJogos(faseJogos)
    if (aba === 'pagamentos') loadPagamentos()
    if (aba === 'bolao') loadBolao()
  }, [aba, faseJogos])

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

  async function aprovarPagamento(id: string) {
    setSalvando(id)
    await supabase.from('pagamentos').update({ status: 'aprovado', pago_em: new Date().toISOString() }).eq('id', id)
    await loadPagamentos()
    setSalvando(null)
  }

  async function salvarBolao() {
    if (!bolao) return
    setSalvandoBolao(true)
    await supabase.from('boloes').update({
      nome: nomeBolao, valor_inscricao: Number(valorBolao),
      habilitar_azarao: habilitarAzarao,
      habilitar_palpite_ouro: habilitarOuro,
      habilitar_palpite_extra: habilitarExtra,
    }).eq('id', bolao.id)
    setSalvandoBolao(false)
  }

  function copiarLink() {
    if (!bolao) return
    navigator.clipboard.writeText(`${window.location.origin}/entrar/${bolao.codigo_convite}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Agrupa jogos por data
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

  return (
    <div>
      <div className="bg-[#1a6b3c] pt-12 pb-0 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-semibold">Admin</h1>
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
            <Shield size={12} className="text-white" />
            <span className="text-xs text-white font-medium">Admin</span>
          </div>
        </div>
        <div className="flex overflow-x-auto">
          {(['fases', 'jogos', 'pagamentos', 'bolao'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                aba === a ? 'border-white text-white' : 'border-transparent text-white/50'
              }`}>
              {a === 'fases' ? 'Fases' : a === 'jogos' ? 'Jogos' : a === 'pagamentos' ? 'Pagamentos' : 'Bolão'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">

        {/* FASES */}
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

        {/* JOGOS */}
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

        {/* PAGAMENTOS */}
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
                    {p.pago_em && <p className="text-xs text-gray-400 mt-0.5">{new Date(p.pago_em).toLocaleDateString('pt-BR')}</p>}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {p.status === 'aprovado' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Pago</span>
                    ) : p.status === 'pendente' ? (
                      <button onClick={() => aprovarPagamento(p.id)} disabled={salvando === p.id}
                        className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium active:scale-95 transition-transform">
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

        {/* BOLÃO */}
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
                <button onClick={salvarBolao}
                  disabled={salvandoBolao || (bolao && nomeBolao === bolao.nome && valorBolao === bolao.valor_inscricao.toString())}
                  className="w-full bg-[#1a6b3c] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 active:scale-95 transition-transform">
                  {salvandoBolao ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Link de convite</h3>
              <p className="text-xs text-gray-400 mb-4">Compartilhe para convidar participantes</p>
              {bolao && (
                <>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 break-all mb-3">
                    {typeof window !== 'undefined' ? `${window.location.origin}/entrar/${bolao.codigo_convite}` : ''}
                  </div>
                  <button onClick={copiarLink}
                    className="w-full flex items-center justify-center gap-2 border border-[#1a6b3c] text-[#1a6b3c] font-semibold py-3 rounded-xl text-sm active:scale-95 transition-transform">
                    {copiado ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar link de convite</>}
                  </button>
                </>
              )}
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
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Azarão</p>
                    <p className="text-xs text-gray-400">R$ 50 fixo para o último lugar</p>
                  </div>
                  <button onClick={() => setHabilitarAzarao(!habilitarAzarao)}
                    className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${habilitarAzarao ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${habilitarAzarao ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <button onClick={salvarBolao} disabled={salvandoBolao}
                className="w-full mt-4 bg-[#1a6b3c] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 active:scale-95 transition-transform">
                {salvandoBolao ? 'Salvando...' : 'Salvar regras'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
