'use client'

import { useState } from 'react'
import { Plus, X, ChevronRight } from 'lucide-react'

type Extra = {
  numero: number
  gols_casa: number
  gols_fora: number
  status_pagamento: string
  pontos: number | null
}

const VALORES: Record<number, number> = { 2: 10, 3: 15, 4: 20 }

export default function PalpiteExtra({
  jogoId,
  extras,
  palpiteAberto,
  onPago,
}: {
  jogoId: string
  extras: Extra[]
  palpiteAberto: boolean
  onPago: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [numero, setNumero] = useState(2)
  const [casa, setCasa] = useState('')
  const [fora, setFora] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  const proximoNumero = extras.filter(e => e.status_pagamento === 'aprovado').length + 2
  const maxAtingido = proximoNumero > 4

  async function pagar() {
    if (casa === '' || fora === '') return
    setProcessando(true)
    setErro('')
    try {
      const res = await fetch('/api/palpite-extra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogo_id: jogoId,
          numero: proximoNumero,
          gols_casa: Number(casa),
          gols_fora: Number(fora),
        }),
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        setErro(data.error || 'Erro ao processar')
        setProcessando(false)
      }
    } catch {
      setErro('Erro de conexão')
      setProcessando(false)
    }
  }

  if (!palpiteAberto) return null

  return (
    <div className="mt-3 border-t border-gray-50 pt-3">
      {extras.filter(e => e.status_pagamento === 'aprovado').map(e => (
        <div key={e.numero} className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span className="text-blue-500 font-medium">Palpite #{e.numero}</span>
          <span className="font-semibold text-gray-600">{e.gols_casa} × {e.gols_fora}</span>
          {e.pontos !== null && (
            <span className={`font-semibold ${e.pontos > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              +{e.pontos} pts
            </span>
          )}
        </div>
      ))}

      {!maxAtingido && !aberto && (
        <button
          onClick={() => setAberto(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-green-700 bg-green-50 rounded-xl border border-green-100 active:scale-95 transition-transform"
        >
          <Plus size={15} />
          Adicionar palpite #{proximoNumero}
        </button>
      )}

      {maxAtingido && (
        <p className="text-xs text-gray-400 text-center py-1">Máximo de palpites atingido</p>
      )}

      {aberto && (
        <div className="bg-blue-50 rounded-xl p-3 mt-2">
          <div className="relative flex items-center justify-center mb-3">
            <span className="text-sm font-semibold text-gray-800">Palpite adicional</span>
            <button onClick={() => setAberto(false)} className="absolute right-0">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <input type="number" min="0" max="20" placeholder="0" value={casa}
              onChange={e => setCasa(e.target.value)}
              className="w-12 h-12 text-center text-xl font-semibold border border-blue-200 rounded-xl outline-none focus:border-blue-500 bg-white" />
            <span className="text-gray-300 text-lg">×</span>
            <input type="number" min="0" max="20" placeholder="0" value={fora}
              onChange={e => setFora(e.target.value)}
              className="w-12 h-12 text-center text-xl font-semibold border border-blue-200 rounded-xl outline-none focus:border-blue-500 bg-white" />
          </div>

          {erro && <p className="text-xs text-red-500 text-center mb-2">{erro}</p>}

          <button onClick={pagar} disabled={processando || casa === '' || fora === ''}
            className="w-full bg-[#1a6b3c] text-white text-sm font-semibold py-2.5 rounded-xl 
            disabled:opacity-40 active:scale-95 transition-transform">
            {processando ? 'Aguarde...' : `Pagar R$ ${VALORES[proximoNumero]} e confirmar`}
          </button>
        </div>
      )}
    </div>
  )
}
