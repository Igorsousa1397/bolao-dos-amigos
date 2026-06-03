import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: existing } = await supabase
    .from('pagamentos')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing?.status === 'aprovado') {
    return NextResponse.json({ error: 'Já pago' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, email, bolao_id')
    .eq('id', user.id)
    .single()

  let valorInscricao = 100.00
  if (profile?.bolao_id) {
    const { data: bolao } = await supabase
      .from('boloes')
      .select('valor_inscricao')
      .eq('id', profile.bolao_id)
      .single()
    if (bolao) valorInscricao = bolao.valor_inscricao
  }

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [{
        title: 'Bolão Copa 2026 — Inscrição',
        quantity: 1,
        unit_price: valorInscricao,
        currency_id: 'BRL',
      }],
      payment_methods: {
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' },
        ],
        default_payment_method_id: 'pix',
      },
      payer: {
        email: profile?.email || user.email,
        name: profile?.nome || '',
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento?status=approved`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento?status=rejected`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook`,
      metadata: { user_id: user.id },
    }),
  })

  const preference = await mpResponse.json()

  if (!preference.id) {
    return NextResponse.json({ error: 'Erro ao criar preferência' }, { status: 500 })
  }

  await supabase.from('pagamentos').upsert({
    user_id: user.id,
    mp_preference_id: preference.id,
    valor: valorInscricao,
    status: 'pendente',
  }, { onConflict: 'user_id' })

  return NextResponse.json({
    preference_id: preference.id,
    init_point: preference.init_point,
    sandbox_init_point: preference.sandbox_init_point,
  })
}