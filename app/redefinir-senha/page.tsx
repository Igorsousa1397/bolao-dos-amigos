'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function handleRedefinir() {
    if (senha !== confirmar) { setErro('As senhas não coincidem'); return }
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres'); return }
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) { setErro('Erro ao redefinir senha. Tente novamente.'); setCarregando(false); return }
    setSucesso(true)
    setTimeout(() => router.push('/palpites'), 2000)
  }

  return (
    <main className="login-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {sucesso ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Senha redefinida! ✅</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Redirecionando...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'white', fontSize: '18px', fontWeight: 600, textAlign: 'center', marginBottom: '4px' }}>Nova senha</p>
              <div style={{ position: 'relative' }}>
                <input type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Nova senha"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 48px 14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '12px', padding: 0 }}>
                  {mostrarSenha ? 'ocultar' : 'ver'}
                </button>
              </div>
              <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Confirmar nova senha"
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '16px', padding: '14px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              {erro && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>{erro}</p>}
              <button type="button" onClick={handleRedefinir} disabled={carregando}
                style={{ width: '100%', background: '#1a6b3c', color: 'white', fontWeight: 600, padding: '14px', borderRadius: '16px', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                {carregando ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}