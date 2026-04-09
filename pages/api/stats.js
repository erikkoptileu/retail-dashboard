import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  const [ordersRes, itemsRes, customersRes] = await Promise.all([
    supabase.from('orders').select('id, total_summ, created_at, status, city, utm_source'),
    supabase.from('order_items').select('product_name, quantity, summ'),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
  ])

  const orders = ordersRes.data || []
  const items  = itemsRes.data  || []

  // Ключевые метрики
  const totalRevenue   = orders.reduce((s, o) => s + (o.total_summ || 0), 0)
  const ordersCount    = orders.length
  const avgCheck       = ordersCount ? Math.round(totalRevenue / ordersCount) : 0
  const customersCount = customersRes.count || 0

  // Заказы по дням (для графика)
  const byDate = {}
  orders.forEach(o => {
    const date = o.created_at?.slice(0, 10)
    if (!date) return
    if (!byDate[date]) byDate[date] = { orders: 0, revenue: 0 }
    byDate[date].orders++
    byDate[date].revenue += o.total_summ || 0
  })

  // Топ-5 товаров по выручке
  const productMap = {}
  items.forEach(i => {
    const name = i.product_name || 'Без названия'
    if (!productMap[name]) productMap[name] = { quantity: 0, revenue: 0 }
    productMap[name].quantity += i.quantity || 0
    productMap[name].revenue  += i.summ      || 0
  })
  const topProducts = Object.entries(productMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Заказы по статусам
  const byStatus = {}
  orders.forEach(o => {
    const s = o.status || 'unknown'
    byStatus[s] = (byStatus[s] || 0) + 1
  })

  // Источники трафика
  const byUtm = {}
  orders.forEach(o => {
    const s = o.utm_source || 'прямой'
    byUtm[s] = (byUtm[s] || 0) + 1
  })

  res.json({
    metrics: { totalRevenue, ordersCount, avgCheck, customersCount },
    byDate,
    topProducts,
    byStatus,
    byUtm,
  })
}
