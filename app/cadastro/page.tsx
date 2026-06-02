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
    <main className="min-h-screen bg-[#0f5030] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-white text-2xl font-semibold">Bolão Copa 2026</h1>
          <p className="text-green-300 text-sm mt-1">Crie sua conta e participe</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleCadastro} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Nome</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" required className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 transition-colors" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Confirmar senha</label>
              <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repita a senha" required className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 transition-colors" />
            </div>
            {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}
            <button type="submit" disabled={carregando} className="bg-[#1a6b3c] text-white rounded-xl py-3 font-semibold text-sm mt-1 disabled:opacity-60 active:scale-95 transition-transform">
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem conta? <a href="/login" className="text-green-700 font-medium">Entrar</a>
          </p>
        </div>
      </div>
    </main>
  )
}
