'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha !== confirmar) { setErro('As senhas não coincidem'); return }
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres'); return }
    setCarregando(true)
    const { error } = await supabase.auth.signUp({
      email, password: senha, options: { data: { nome } }
    })
    if (error) {
      setErro(error.message === 'User already registered' ? 'Este e-mail já está cadastrado' : 'Erro ao criar conta. Tente novamente.')
      setCarregando(false)
      return
    }
    router.push('/palpites')
    router.refresh()
  }

  return (
  <main className="login-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)' }} />

    <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px 24px' }}>
      <div style={{ position: 'absolute', top: '48px', left: 0, right: 0, textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Copa do Mundo</p>
        <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 700, letterSpacing: '-1px' }}>Bolão</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '8px' }}>Crie sua conta e participe</p>
      </div>

      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" required
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha (mínimo 6 caracteres)" required
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Confirmar senha" required
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />

        {erro && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>{erro}</p>}

        <button type="button" onClick={handleCadastro} disabled={carregando}
          style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 600, padding: '14px', borderRadius: '16px', fontSize: '14px', border: 'none', cursor: 'pointer', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
          Já tem conta?{' '}
          <a href="/login" style={{ color: 'white', fontWeight: 500 }}>Entrar</a>
        </p>
      </div>
    </div>
  </main>
)
}
