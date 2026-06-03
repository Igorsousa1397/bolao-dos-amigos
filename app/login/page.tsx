'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (loginError) { setErro('E-mail ou senha incorretos'); setCarregando(false); return }

    const codigo = localStorage.getItem('convite_codigo')
    if (codigo) {
      localStorage.removeItem('convite_codigo')
      router.push(`/entrar/${codigo}`)
    } else {
      router.push('/palpites')
    }
    router.refresh()
  }

  async function handleGoogle() {
    const codigo = localStorage.getItem('convite_codigo')
    const redirectTo = codigo
      ? `${location.origin}/auth/callback?convite=${codigo}`
      : `${location.origin}/auth/callback`

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
  }

  return (
    <main className="login-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px 24px' }}>
        <div style={{
          position: 'absolute',
          top: '48px',
          left: 0,
          right: 0,
          textAlign: 'center'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Copa do Mundo</p>
          <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 700, letterSpacing: '-1px' }}>Bolão</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '8px' }}>Faça seus palpites e concorra</p>
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>
          <button onClick={handleGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'white', color: '#374151', fontWeight: 500, padding: '14px', borderRadius: '16px', fontSize: '14px', border: 'none', cursor: 'pointer', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" required
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            {erro && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>{erro}</p>}
            <button type="button" onClick={handleLogin} disabled={carregando}
              style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 600, padding: '14px', borderRadius: '16px', fontSize: '14px', border: 'none', cursor: 'pointer', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '20px' }}>
            Não tem conta?{' '}
            <a href="/cadastro" style={{ color: 'white', fontWeight: 500 }}>Cadastre-se</a>
          </p>
        </div>
      </div>
    </main>
  )
}
