import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const PLANOS: Record<number, number> = {
  15: 30,
  30: 60,
  45: 90,
  60: 120,
  75: 150,
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { bolao_id, plano } = await request.json()
    if (!PLANOS[plano]) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

    const valor = PLANOS[plano]

    const { data: profile } = await supabase
      .from('profiles').select('nome, email').eq('id', user.id).single()

    console.log('Token presente:', !!process.env.MP_ACCESS_TOKEN_PLANO)

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_PLANO}`,
      },
      body: JSON.stringify({
        items: [{
          title: `Bolão Copa 2026 — Plano até ${plano} pessoas`,
          quantity: 1,
          unit_price: valor,
          currency_id: 'BRL',
        }],
        payment_methods: {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'ticket' },
          ],
        },
        payer: {
          email: profile?.email || user.email,
          name: profile?.nome || '',
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/admin?plano=aprovado`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/admin?plano=recusado`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/admin?plano=pendente`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook`,
        metadata: { user_id: user.id, bolao_id, tipo: 'plano', plano },
      }),
    })

    const preference = await mpResponse.json()
    console.log('MP response:', JSON.stringify(preference))

    if (!preference.id) return NextResponse.json({ error: 'Erro ao criar preferência' }, { status: 500 })

    await supabase.from('boloes').update({
      status_plano: 'pendente',
      mp_preference_id_plano: preference.id,
    }).eq('id', bolao_id)

    return NextResponse.json({ init_point: preference.init_point })

  } catch (error) {
    console.error('Erro plano/criar:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}