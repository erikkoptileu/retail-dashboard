// RetailCRM → Telegram уведомление
// Endpoint: POST https://retail-dashboard-theta.vercel.app/api/webhook

const TELEGRAM_TOKEN  = process.env.TELEGRAM_TOKEN
const TELEGRAM_CHAT   = process.env.TELEGRAM_CHAT_ID
const MIN_AMOUNT      = 50000

async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const body = req.body

    // RetailCRM шлёт: { event: "order.create", data: { order: {...} } }
    const event = body.event
    const order = body.data?.order || body.order

    if (!order) return res.status(200).json({ ok: true, skipped: 'no order data' })

    // Только события создания заказа
    if (event && !event.includes('order')) {
      return res.status(200).json({ ok: true, skipped: 'not an order event' })
    }

    const amount    = order.totalSumm || order.summ || 0
    const firstName = order.firstName || ''
    const lastName  = order.lastName  || ''
    const phone     = order.phone     || '—'
    const number    = order.number    || order.id || '?'
    const city      = order.delivery?.address?.city || '—'

    // Фильтр по сумме
    if (amount < MIN_AMOUNT) {
      return res.status(200).json({ ok: true, skipped: `amount ${amount} < ${MIN_AMOUNT}` })
    }

    const items = (order.items || [])
      .map(i => `• ${i.productName || i.offer?.name || 'Товар'} × ${i.quantity}`)
      .join('\n') || '—'

    const text = [
      `🛒 <b>Новый заказ #${number}</b>`,
      ``,
      `👤 ${firstName} ${lastName}`,
      `📞 ${phone}`,
      `📍 ${city}`,
      ``,
      `<b>Состав:</b>`,
      items,
      ``,
      `💰 <b>Сумма: ${new Intl.NumberFormat('ru-RU').format(amount)} ₸</b>`,
    ].join('\n')

    await sendTelegram(text)

    return res.status(200).json({ ok: true, notified: true, amount })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
