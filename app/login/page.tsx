'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const conviteParam = searchParams.get('convite')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [recuperando, setRecuperando] = useState(false)
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false)
  const [carregandoRecuperacao, setCarregandoRecuperacao] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (loginError) { setErro('E-mail ou senha incorretos'); setCarregando(false); return }
    const codigo = conviteParam
    if (codigo) {
      router.push(`/entrar/${codigo}`)
    } else {
      router.push('/palpites')
    }
  }

  async function handleGoogle() {
    const next = conviteParam ? `/entrar/${conviteParam}` : '/palpites'
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    })
  }

  async function handleRecuperacao() {
    if (!email) { setErro('Digite seu e-mail primeiro'); return }
    setCarregandoRecuperacao(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/redefinir-senha`,
    })
    setCarregandoRecuperacao(false)
    setRecuperacaoEnviada(true)
  }

  return (
    <main className="login-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px 24px' }}>
        <div style={{ position: 'absolute', top: '48px', left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Copa do Mundo</p>
          <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 700, letterSpacing: '-1px' }}>Bolão</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '8px' }}>Faça seus palpites e concorra</p>
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>

          {recuperacaoEnviada ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>E-mail enviado! ✉️</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
              <button onClick={() => { setRecuperando(false); setRecuperacaoEnviada(false) }}
                style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
                Voltar ao login
              </button>
            </div>
          ) : recuperando ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'white', fontSize: '16px', fontWeight: 600, textAlign: 'center', marginBottom: '4px' }}>Recuperar senha</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textAlign: 'center', marginBottom: '4px' }}>Digite seu e-mail para receber o link de redefinição.</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              {erro && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>{erro}</p>}
              <button type="button" onClick={handleRecuperacao} disabled={carregandoRecuperacao}
                style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 600, padding: '14px', borderRadius: '16px', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                {carregandoRecuperacao ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
              <button onClick={() => { setRecuperando(false); setErro('') }}
                style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', textAlign: 'center' }}>
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
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
                <div style={{ position: 'relative' }}>
                  <input type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" required
                    style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 48px 14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '12px', padding: 0 }}>
                    {mostrarSenha ? 'ocultar' : 'ver'}
                  </button>
                </div>
                <button type="button" onClick={() => { setRecuperando(true); setErro('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'right', padding: 0, marginTop: '-4px' }}>
                  Esqueci minha senha
                </button>
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
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}