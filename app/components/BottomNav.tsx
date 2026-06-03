'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PenLine, BarChart2, CreditCard, User, X, LogOut, ShieldCheck, Camera, BookOpen } from 'lucide-react'
import Image from 'next/image'

type Profile = { nome: string; email: string; avatar_url: string | null; is_admin: boolean }

export default function BottomNav() {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menu, setMenu] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('nome, email, avatar_url, is_admin')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    load()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const urlComCache = `${publicUrl}?t=${Date.now()}`

      await supabase.from('profiles')
        .update({ avatar_url: urlComCache })
        .eq('id', user.id)

      setProfile(prev => prev ? { ...prev, avatar_url: urlComCache } : null)
    }
    setUploading(false)
  }

  function iniciais(nome: string) {
    return nome?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  const items = [
    { href: '/palpites',  label: 'Palpites',  Icon: PenLine },
    { href: '/ranking',   label: 'Ranking',   Icon: BarChart2 },
    { href: '/pagamento', label: 'Pagamento', Icon: CreditCard },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50">
        {items.map(({ href, label, Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                active ? 'text-green-700' : 'text-gray-400'
              }`}>
              <Icon size={22} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMenu(true)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors text-gray-400">
          {profile?.avatar_url ? (
            <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200">
              <Image src={profile.avatar_url} alt="avatar" width={24} height={24} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-[9px] font-semibold text-green-700">{iniciais(profile?.nome || '')}</span>
            </div>
          )}
          <span className="text-[11px] font-medium">Perfil</span>
        </button>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setMenu(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

            {/* Avatar + nome */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {profile?.avatar_url ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100">
                    <Image src={profile.avatar_url} alt="avatar" width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center border border-gray-100">
                    <span className="text-xl font-semibold text-green-700">{iniciais(profile?.nome || '')}</span>
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-green-700 rounded-full flex items-center justify-center shadow-md"
                >
                  <Camera size={12} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{profile?.nome}</p>
                <p className="text-sm text-gray-400 truncate">{profile?.email}</p>
                {uploading && <p className="text-xs text-green-600 mt-0.5">Enviando foto...</p>}
              </div>
            </div>

            {profile?.is_admin && (
            <Link href="/admin" onClick={() => setMenu(false)}
              className="w-full flex items-center gap-4 py-4 border-b border-gray-50">
              <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
                <ShieldCheck size={20} className="text-green-700" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Painel Admin</p>
                <p className="text-xs text-gray-400">Gerencie fases e resultados</p>
              </div>
            </Link>
          )}

          <Link href="/regras" onClick={() => setMenu(false)}
            className="w-full flex items-center gap-4 py-4 border-b border-gray-50">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <BookOpen size={20} className="text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Regras</p>
              <p className="text-xs text-gray-400">Pontuação e premiação</p>
            </div>
          </Link>

            <button onClick={sair}
              className="w-full flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <LogOut size={20} className="text-red-500" strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-red-500">Sair da conta</p>
                <p className="text-xs text-gray-400">Encerrar sessão atual</p>
              </div>
            </button>

            <button onClick={() => setMenu(false)}
              className="w-full flex items-center justify-center gap-2 py-4 text-gray-400 text-sm mt-2">
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
