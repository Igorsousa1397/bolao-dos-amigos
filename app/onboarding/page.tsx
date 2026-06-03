'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Users, Plus, ArrowRight, Copy, Check } from 'lucide-react'

type Etapa = 'escolha' | 'criar' | 'entrar' | 'criado'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [etapa, setEtapa] = useState<Etapa>('escolha')
  const [nomeBolao, setNomeBolao] = useState('')
  const [valorInscricao, setValorInscricao] = useState('100')
  const [codigoConvite, setCodigoConvite] = useState('')
  const [bolaoLink, setBolaoLink] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function criarBolao() {
    if (!nomeBolao.trim()) { setErro('Digite o nome do bolão'); return }
    if (!valorInscricao || Number(valorInscricao) < 1) { setErro('Digite um valor válido'); return }
    setCarregando(true); setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: bolao, error } = await supabase
      .from('boloes')
      .insert({ nome: nomeBolao.trim(), admin_id: user.id, valor_inscricao: Number(valorInscricao) })
      .select().single()

    if (error || !bolao) { setErro('Erro ao criar bolão.'); setCarregando(false); return }

    await supabase.from('bolao_membros').insert({ bolao_id: bolao.id, user_id: user.id })
    await supabase.from('profiles').update({
      bolao_id: bolao.id, onboarding_completo: true, is_admin: true,
    }).eq('id', user.id)

    setBolaoLink(`${window.location.origin}/entrar/${bolao.codigo_convite}`)
    setEtapa('criado')
    setCarregando(false)
  }

  async function entrarBolao() {
    if (!codigoConvite.trim()) { setErro('Digite o código'); return }
    setCarregando(true); setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: bolao } = await supabase
      .from('boloes').select('id').eq('codigo_convite', codigoConvite.trim().toUpperCase()).eq('ativo', true).single()

    if (!bolao) { setErro('Código inválido'); setCarregando(false); return }

    const { error } = await supabase.from('bolao_membros').insert({ bolao_id: bolao.id, user_id: user.id })
    if (error) { setErro('Você já é membro deste bolão'); setCarregando(false); return }

    await supabase.from('profiles').update({ bolao_id: bolao.id, onboarding_completo: true }).eq('id', user.id)
    router.push('/palpites')
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(bolaoLink)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const bgStyle = {
    position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: "url('/copa.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top',
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', background: '#000' }}>
      <div style={bgStyle}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px 24px' }}>

        {etapa === 'escolha' && (
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Copa do Mundo 2026</p>
              <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 700 }}>Bem-vindo! 👋</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '8px' }}>O que você quer fazer?</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => setEtapa('criar')} style={{ width: '100%', background: '#1a6b3c', border: 'none', borderRadius: '20px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={24} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: 0 }}>Criar um bolão</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '2px 0 0' }}>Configure e convide seus amigos</p>
                </div>
                <ArrowRight size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
              </button>
              <button onClick={() => setEtapa('entrar')} style={{ width: '100%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={24} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: 0 }}>Entrar em um bolão</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '2px 0 0' }}>Tenho um código de convite</p>
                </div>
                <ArrowRight size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
              </button>
            </div>
          </div>
        )}

        {etapa === 'criar' && (
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <button onClick={() => { setEtapa('escolha'); setErro('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer', marginBottom: '24px' }}>← Voltar</button>
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Criar bolão</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '32px' }}>Configure seu bolão da Copa</p>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Nome do bolão</label>
                <input type="text" value={nomeBolao} onChange={e => setNomeBolao(e.target.value)} placeholder="Ex: Bolão do Escritório"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '14px', padding: '14px 16px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Valor de inscrição (R$)</label>
                <input type="number" value={valorInscricao} onChange={e => setValorInscricao(e.target.value)} min="1" placeholder="100"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '14px', padding: '14px 16px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {erro && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{erro}</p>}
              <button onClick={criarBolao} disabled={carregando}
                style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 700, padding: '16px', borderRadius: '14px', fontSize: '15px', border: 'none', cursor: 'pointer' }}>
                {carregando ? 'Criando...' : 'Criar bolão →'}
              </button>
            </div>
          </div>
        )}

        {etapa === 'entrar' && (
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <button onClick={() => { setEtapa('escolha'); setErro('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer', marginBottom: '24px' }}>← Voltar</button>
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Entrar no bolão</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '32px' }}>Use o código que recebeu</p>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Código de convite</label>
                <input type="text" value={codigoConvite} onChange={e => setCodigoConvite(e.target.value.toUpperCase())} placeholder="AB12CD34"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '14px', padding: '14px 16px', fontSize: '20px', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '4px', fontWeight: 700 }} />
              </div>
              {erro && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{erro}</p>}
              <button onClick={entrarBolao} disabled={carregando}
                style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 700, padding: '16px', borderRadius: '14px', fontSize: '15px', border: 'none', cursor: 'pointer' }}>
                {carregando ? 'Entrando...' : 'Entrar no bolão →'}
              </button>
            </div>
          </div>
        )}

        {etapa === 'criado' && (
          <div style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#1a6b3c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trophy size={36} color="white" />
            </div>
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Bolão criado! 🎉</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '32px' }}>Compartilhe o link para convidar seus amigos</p>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '16px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Link de convite</p>
              <p style={{ color: 'white', fontSize: '13px', wordBreak: 'break-all', marginBottom: '12px' }}>{bolaoLink}</p>
              <button onClick={copiarLink}
                style={{ width: '100%', background: copiado ? '#166534' : '#1a6b3c', color: 'white', fontWeight: 600, padding: '14px', borderRadius: '12px', fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {copiado ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar link</>}
              </button>
            </div>
            <button onClick={() => router.push('/palpites')}
              style={{ width: '100%', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, padding: '16px', borderRadius: '16px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
              Ir para os palpites →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
