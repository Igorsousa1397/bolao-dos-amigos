'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PLANOS = [
  { plano: 15, valor: 30 },
  { plano: 30, valor: 60 },
  { plano: 45, valor: 90 },
  { plano: 60, valor: 120 },
  { plano: 75, valor: 150 }
]

export default function UpgradePage() {
  const router = useRouter()
  const supabase = createClient()
  const [planoSelecionado, setPlanoSelecionado] = useState(15)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const valorPlano = PLANOS.find(p => p.plano === planoSelecionado)?.valor || 30

  async function pagar() {
    setCarregando(true)
    setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: bolao } = await supabase
      .from('boloes').select('id').eq('admin_id', user.id).order('created_at').limit(1).single()
    if (!bolao) { setErro('Bolão não encontrado'); setCarregando(false); return }

    const res = await fetch('/api/plano/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bolao_id: bolao.id, plano: planoSelecionado }),
    })
    const data = await res.json()
    if (data.init_point) {
      window.location.href = data.init_point
    } else {
      setErro('Erro ao processar pagamento.')
      setCarregando(false)
    }
  }

  return (
    <main className="login-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <button onClick={() => router.push('/admin')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer', marginBottom: '24px' }}>
            ← Voltar
          </button>
          <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Fazer upgrade</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>Escolha o plano para expandir seu bolão</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {PLANOS.map(({ plano, valor }) => (
              <button key={plano} onClick={() => setPlanoSelecionado(plano)}
                style={{ width: '100%', background: planoSelecionado === plano ? '#1a6b3c' : 'rgba(255,255,255,0.08)', border: `1px solid ${planoSelecionado === plano ? '#1a6b3c' : 'rgba(255,255,255,0.2)'}`, borderRadius: '16px', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: 0 }}>Até {plano} pessoas</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '2px 0 0' }}>R$ {(valor / plano).toFixed(2)} por pessoa</p>
                </div>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>R$ {valor}</span>
              </button>
            ))}
          </div>

          {erro && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{erro}</p>}

          <button onClick={pagar} disabled={carregando}
            style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 700, padding: '16px', borderRadius: '16px', fontSize: '15px', border: 'none', cursor: 'pointer', opacity: carregando ? 0.7 : 1 }}>
            {carregando ? 'Aguarde...' : `Pagar R$ ${valorPlano} via PIX`}
          </button>
        </div>
      </div>
    </main>
  )
}