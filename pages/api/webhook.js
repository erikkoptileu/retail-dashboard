// RetailCRM Триггер → Telegram уведомление
// Endpoint: POST https://retail-dashboard-theta.vercel.app/api/webhook

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID
const MIN_AMOUNT     = 50000

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    // RetailCRM триггер шлёт параметры в query string
    const q = req.query

    // Также поддерживаем JSON body (для тестов)
    const body     = req.body || {}
    const order    = body.data?.order || body.order || {}

    const amount     = parseFloat(q.total      || order.totalSumm || order.summ || 0)
    const order_id   = q.order_id   || order.number || order.id || '?'
    const first_name = q.first_name || order.firstName || ''
    const last_name  = q.last_name  || order.lastName  || ''
    const phone      = q.phone      || order.phone     || '—'
    const city       = q.city       || order.delivery?.address?.city || '—'

    // Фильтр по сумме
    if (amount < MIN_AMOUNT) {
      return res.status(200).json({ ok: true, skipped: `amount ${amount} < ${MIN_AMOUNT}` })
    }

    const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(n))

    const text = [
      `🛒 <b>Новый заказ #${order_id}</b>`,
      ``,
      `👤 ${first_name} ${last_name}`,
      `📞 ${phone}`,
      `📍 ${city}`,
      ``,
      `💰 <b>Сумма: ${fmt(amount)} ₸</b>`,
      ``,
      `🔗 <a href="https://klimat-oktay.retailcrm.ru/orders/${order_id}">Открыть в CRM</a>`,
    ].join('\n')

    await sendTelegram(text)
    return res.status(200).json({ ok: true, notified: true, amount })

  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
