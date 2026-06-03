'use client'
import Header from '@/app/components/Header'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Premiacao from '@/app/components/Premiacao'

type StatusPag = 'carregando' | 'nao_iniciado' | 'pendente' | 'aprovado' | 'recusado'

export default function PagamentoPage() {
  const supabase = createClient()
  const [status, setStatus] = useState<StatusPag>('carregando')
  const [pagoEm, setPagoEm] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [valorInscricao, setValorInscricao] = useState(100)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('bolao_id').eq('id', user.id).single()
      if (profile?.bolao_id) {
        const { data: bolao } = await supabase
          .from('boloes').select('valor_inscricao').eq('id', profile.bolao_id).single()
        if (bolao) setValorInscricao(bolao.valor_inscricao)
      }
    }
      if (!user) return

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

    const params = new URLSearchParams(window.location.search)
    if (params.get('status') === 'approved') {
      setStatus('aprovado')
    }
  }, [])

  async function pagar() {
    setProcessando(true)
    setErro('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/pagamento/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        setErro('Erro ao criar pagamento. Tente novamente.')
        setProcessando(false)
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setProcessando(false)
    }
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
            <p className="text-green-700 text-sm mt-3">
              Você está inscrito e pode fazer seus palpites.
            </p>
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

            {status === 'recusado' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm text-red-600">
                Pagamento recusado. Tente novamente.
              </div>
            )}

            {erro && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm text-red-600">
                {erro}
              </div>
            )}

            <button
              onClick={pagar}
              disabled={processando}
              className="w-full bg-[#009ee3] text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-60 active:scale-95 transition-transform text-base"
            >
              {processando ? (
                'Aguarde...'
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="white" opacity="0.3"/>
                    <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Pagar R$ {valorInscricao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via PIX
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Pagamento seguro via Mercado Pago · PIX
            </p>
          </>
        )}

        {status === 'pendente' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">⏳</div>
            <h2 className="text-amber-800 font-semibold text-lg">Pagamento em processamento</h2>
            <p className="text-amber-700 text-sm mt-2">
              Assim que confirmado, sua inscrição será ativada automaticamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-amber-700 underline"
            >
              Verificar status
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
