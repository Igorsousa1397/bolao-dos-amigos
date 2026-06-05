'use client'

import { useState } from 'react'
import { Plus, X, Clock, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Extra = {
  numero: number
  gols_casa: number
  gols_fora: number
  status_pagamento: string
  pontos: number | null
}

export default function PalpiteExtra({
  jogoId, bolaoId, userId, chavePix, extras, palpiteAberto, onPedido,
  valorExtra2 = 10, valorExtra3 = 15, valorExtra4 = 20,
}: {
  jogoId: string
  bolaoId: string | null
  userId: string
  chavePix?: string
  extras: Extra[]
  palpiteAberto: boolean
  onPedido?: () => void
  valorExtra2?: number
  valorExtra3?: number
  valorExtra4?: number
}) {
  const supabase = createClient()
  const [aberto, setAberto] = useState(false)
  const [casa, setCasa] = useState('')
  const [fora, setFora] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [pixCopiado, setPixCopiado] = useState(false)
  // cópia local para refletir o pedido na hora, sem recarregar tudo
  const [extrasLocais, setExtrasLocais] = useState<Extra[]>(extras)

  const VALORES: Record<number, number> = { 2: valorExtra2, 3: valorExtra3, 4: valorExtra4 }

  const aprovados = extrasLocais.filter(e => e.status_pagamento === 'aprovado')
  const pendentes = extrasLocais.filter(e => e.status_pagamento === 'pendente')
  // próximo número considera aprovados E pendentes (não deixa pedir dois #2)
  const proximoNumero = extrasLocais.length + 2
  const maxAtingido = proximoNumero > 4

  async function pedirExtra() {
    if (casa === '' || fora === '') return
    if (!bolaoId) { setErro('Bolão não identificado'); return }
    setProcessando(true); setErro('')

    const { error } = await supabase.from('palpites_extras').insert({
      user_id: userId,
      bolao_id: bolaoId,
      jogo_id: jogoId,
      numero: proximoNumero,
      gols_casa: Number(casa),
      gols_fora: Number(fora),
      valor_pago: VALORES[proximoNumero],
      status_pagamento: 'pendente',
    })

    if (error) {
      setErro('Erro ao registrar palpite')
      setProcessando(false)
      return
    }

    // reflete localmente como pendente
    setExtrasLocais(prev => [...prev, {
      numero: proximoNumero,
      gols_casa: Number(casa),
      gols_fora: Number(fora),
      status_pagamento: 'pendente',
      pontos: null,
    }])
    setCasa(''); setFora('')
    setAberto(false)
    setProcessando(false)
    onPedido?.()
  }

  async function copiarPix() {
    if (!chavePix) return
    await navigator.clipboard.writeText(chavePix)
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 2000)
  }

  if (!palpiteAberto) return null

  return (
    <div className="mt-3 border-t border-gray-50 pt-3 px-4 pb-3">
      {/* aprovados */}
      {aprovados.map(e => (
        <div key={`a-${e.numero}`} className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span className="text-green-600 font-medium">Palpite #{e.numero}</span>
          <span className="font-semibold text-gray-600">{e.gols_casa} × {e.gols_fora}</span>
          {e.pontos !== null && (
            <span className={`font-semibold ${e.pontos > 0 ? 'text-green-600' : 'text-gray-400'}`}>+{e.pontos} pts</span>
          )}
        </div>
      ))}

      {/* pendentes — aguardando aprovação do admin */}
      {pendentes.map(e => (
        <div key={`p-${e.numero}`} className="flex items-center justify-between text-xs mb-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
          <span className="flex items-center gap-1 text-amber-700 font-medium"><Clock size={12} /> Palpite #{e.numero}</span>
          <span className="font-semibold text-amber-700">{e.gols_casa} × {e.gols_fora}</span>
          <span className="text-amber-600">Aguardando aprovação</span>
        </div>
      ))}

      {!maxAtingido && !aberto && (
        <button onClick={() => setAberto(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-green-700 bg-green-50 rounded-xl border border-green-100 active:scale-95 transition-transform">
          <Plus size={15} />
          Adicionar palpite (R$ {VALORES[proximoNumero]})
        </button>
      )}

      {maxAtingido && (
        <p className="text-xs text-gray-400 text-center py-1">Máximo de palpites atingido</p>
      )}

      {aberto && (
        <div className="bg-gray-50 rounded-xl p-3 mt-2">
          <div className="relative flex items-center justify-center mb-3">
            <span className="text-sm font-semibold text-gray-800">Palpite adicional #{proximoNumero}</span>
            <button onClick={() => setAberto(false)} className="absolute right-0">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <input type="number" min="0" max="20" placeholder="0" value={casa}
              onChange={e => setCasa(e.target.value)}
              className="w-12 h-12 text-center text-xl font-semibold border-2 border-green-300 rounded-xl outline-none focus:border-green-500 bg-white text-green-700" />
            <span className="text-gray-300 text-lg">×</span>
            <input type="number" min="0" max="20" placeholder="0" value={fora}
              onChange={e => setFora(e.target.value)}
              className="w-12 h-12 text-center text-xl font-semibold border-2 border-green-300 rounded-xl outline-none focus:border-green-500 bg-white text-green-700" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2.5 mb-2">
            <p className="text-xs text-gray-500 mb-1.5">
              Pague <span className="font-semibold text-gray-700">R$ {VALORES[proximoNumero]}</span> via PIX e envie o comprovante ao admin. O palpite vale após a aprovação.
            </p>
            {chavePix ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-xs text-gray-700 bg-gray-50 rounded-md px-2 py-1.5 break-all">{chavePix}</span>
                <button onClick={copiarPix}
                  className="flex items-center gap-1 text-xs font-semibold text-[#1a6b3c] border border-[#1a6b3c] rounded-md px-2.5 py-1.5 active:scale-95 transition-transform">
                  {pixCopiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                </button>
              </div>
            ) : (
              <p className="text-xs text-amber-600">Chave PIX não configurada pelo admin.</p>
            )}
          </div>
          {erro && <p className="text-xs text-red-500 text-center mb-2">{erro}</p>}
          <button onClick={pedirExtra} disabled={processando || casa === '' || fora === ''}
            className="w-full bg-[#1a6b3c] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
            {processando ? 'Registrando...' : `Confirmar palpite #${proximoNumero}`}
          </button>
        </div>
      )}
    </div>
  )
}
