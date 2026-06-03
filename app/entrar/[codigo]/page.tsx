'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, Trophy, Check } from 'lucide-react'

export default function EntrarPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [bolao, setBolao] = useState<any>(null)
  const [status, setStatus] = useState<'carregando' | 'encontrado' | 'ja_membro' | 'erro'>('carregando')
  const [entrando, setEntrando] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?convite=${codigo}`)
        return
      }

      // Busca o bolão pelo código
      const { data: bolaoData } = await supabase
        .from('boloes')
        .select('id, nome, valor_inscricao, codigo_convite')
        .eq('codigo_convite', codigo.toUpperCase())
        .eq('ativo', true)
        .single()

      if (!bolaoData) { setStatus('erro'); return }
      setBolao(bolaoData)

      // Verifica se já é membro
      const { data: membro } = await supabase
        .from('bolao_membros')
        .select('id')
        .eq('bolao_id', bolaoData.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (membro) { setStatus('ja_membro'); return }

      setStatus('encontrado')
    }
    load()
  }, [codigo])

  async function entrar() {
    setEntrando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !bolao) return

    const { error } = await supabase.from('bolao_membros').insert({
      bolao_id: bolao.id, user_id: user.id,
    })

    if (error) { setEntrando(false); return }

    await supabase.from('profiles').update({
      bolao_id: bolao.id,
      onboarding_completo: true,
    }).eq('id', user.id)

    const codigo = localStorage.getItem('convite_codigo')
    if (codigo) {
      localStorage.removeItem('convite_codigo')
      router.push(`/entrar/${codigo}`)
    } else {
      router.push('/palpites')
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', background: '#000' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "url('/copa.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

        {status === 'carregando' && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Carregando...</p>
        )}

        {status === 'erro' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Convite inválido</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>Este link de convite não existe ou expirou.</p>
            <button onClick={() => router.push('/login')}
              style={{ background: '#1a6b3c', color: 'white', fontWeight: 600, padding: '14px 32px', borderRadius: '14px', fontSize: '15px', border: 'none', cursor: 'pointer' }}>
              Ir para o início
            </button>
          </div>
        )}

        {status === 'ja_membro' && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '360px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#1a6b3c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={32} color="white" />
            </div>
            <p style={{ color: 'white', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Você já é membro!</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>{bolao?.nome}</p>
            <button onClick={() => router.push('/palpites')}
              style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 700, padding: '16px', borderRadius: '16px', fontSize: '15px', border: 'none', cursor: 'pointer' }}>
              Ir para os palpites →
            </button>
          </div>
        )}

        {status === 'encontrado' && bolao && (
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trophy size={32} color="white" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Você foi convidado para</p>
              <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{bolao.nome}</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Copa do Mundo 2026</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="rgba(255,255,255,0.5)" />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Inscrição</span>
                </div>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>
                  R$ {Number(bolao.valor_inscricao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'center' }}>
                Faça o pagamento após entrar para liberar seus palpites
              </p>
            </div>

            <button onClick={entrar} disabled={entrando}
              style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 700, padding: '18px', borderRadius: '16px', fontSize: '16px', border: 'none', cursor: 'pointer', opacity: entrando ? 0.7 : 1 }}>
              {entrando ? 'Entrando...' : 'Entrar no bolão →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
