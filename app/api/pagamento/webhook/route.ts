import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  // Valida assinatura
  const secret = process.env.MP_WEBHOOK_SECRET
  if (secret) {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const url = new URL(request.url)
    const dataId = url.searchParams.get('data.id')

    if (xSignature && xRequestId) {
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1]};`
      const expectedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
      const receivedHash = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1]
      if (expectedHash !== receivedHash) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }
  }

  const { type, data } = await request.json()
  if (type !== 'payment') return NextResponse.json({ ok: true })

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
    headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  })
  const payment = await mpResponse.json()

  const supabase = await createClient()
  const userId = payment.metadata?.user_id
  const tipo = payment.metadata?.tipo
  const novoStatus = payment.status === 'approved' ? 'aprovado' : 'pendente'

  if (tipo === 'palpite_extra') {
    const extraId = payment.metadata?.palpite_extra_id
    await supabase.from('palpites_extras')
      .update({ status_pagamento: novoStatus })
      .eq('id', extraId)
  } else {
    await supabase.from('pagamentos').update({
      mp_payment_id: String(payment.id),
      status: novoStatus,
      pago_em: novoStatus === 'aprovado' ? new Date().toISOString() : null,
    }).eq('user_id', userId)
  }

  return NextResponse.json({ ok: true })
}