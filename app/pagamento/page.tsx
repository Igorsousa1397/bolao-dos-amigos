'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Premiacao from '@/app/components/Premiacao'

type StatusPag = 'carregando' | 'nao_iniciado' | 'pendente' | 'aprovado' | 'recusado'

export default function PagamentoPage() {
  const supabase = createClient()
  const [status, setStatus] = useState<StatusPag>('carregando')
  const [pagoEm, setPagoEm] = useState<string | null>(null)
  const [valorInscricao, setValorInscricao] = useState(100)
  const [chavePix, setChavePix] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles').select('bolao_id').eq('id', user.id).single()
      if (profile?.bolao_id) {
        const { data: bolao } = await supabase
          .from('boloes').select('valor_inscricao, chave_pix').eq('id', profile.bolao_id).single()
        if (bolao) {
          setValorInscricao(bolao.valor_inscricao)
          setChavePix(bolao.chave_pix || null)
        }
      }

      const { data } = await supabase
        .from('pagamentos')
        .select('status, pago_em')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!data || data.status === 'pendente') { setStatus('nao_iniciado'); return }
      setStatus(data.status as StatusPag)
      if (data.pago_em) {
        setPagoEm(new Date(data.pago_em).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric'
        }))
      }
    }
    load()
  }, [])

  async function copiarChave() {
    if (!chavePix) return
    await navigator.clipboard.writeText(chavePix)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div>
      <div className="bg-[#1a6b3c] pt-12 pb-6 px-4 text-center">
        <h1 className="text-white text-xl font-semibold">Pagamento</h1>
        <p className="text-green-300 text-sm mt-1">Inscrição no Bolão Copa 2026</p>
      </div>

      <div className="px-4 pt-6">
        {status === 'carregando' && (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        )}

        {status === 'aprovado' && (
          <>
            <Premiacao />
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-green-800 font-semibold text-lg">Pagamento confirmado!</h2>
              {pagoEm && <p className="text-green-600 text-sm mt-1">Pago em {pagoEm}</p>}
              <p className="text-green-700 text-sm mt-3">Você está inscrito e pode fazer seus palpites.</p>
            </div>
          </>
        )}

        {(status === 'nao_iniciado' || status === 'recusado') && (
          <>
            <Premiacao />
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h2 className="font-semibold text-gray-800 text-base mb-4">Bolão Copa 2026</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Inscrição</span>
                  <span className="font-semibold text-gray-800">R$ {valorInscricao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Acesso</span>
                  <span className="text-gray-700">Todas as fases</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pagamento via</span>
                  <span className="text-gray-700">PIX</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
                  <span className="text-gray-500">Prêmio estimado</span>
                  <span className="font-semibold text-green-700">100% do arrecadado</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {chavePix ? (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-green-800 mb-1">Chave PIX</p>
                  <p className="text-sm text-green-700 break-all mb-3">{chavePix}</p>
                  <button onClick={copiarChave}
                    className="w-full bg-[#1a6b3c] text-white font-semibold py-3 rounded-xl text-sm active:scale-95 transition-transform">
                    {copiado ? '✓ Chave copiada!' : 'Copiar chave PIX'}
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                  <p className="text-sm text-amber-700">O administrador ainda não cadastrou a chave PIX. Entre em contato para realizar o pagamento.</p>
                </div>
              )}
              <p className="text-center text-xs text-gray-400">
                Após o pagamento, aguarde a confirmação do administrador.
              </p>
            </div>
          </>
        )}

        {status === 'pendente' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">⏳</div>
            <h2 className="text-amber-800 font-semibold text-lg">Pagamento em processamento</h2>
            <p className="text-amber-700 text-sm mt-2">Assim que confirmado, sua inscrição será ativada automaticamente.</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm text-amber-700 underline">
              Verificar status
            </button>
          </div>
        )}
      </div>
    </div>
  )
}