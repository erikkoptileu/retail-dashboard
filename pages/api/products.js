import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, quantity, initial_price, summ')

  const map = {}
  items?.forEach(i => {
    const name = i.product_name || 'Без названия'
    if (!map[name]) map[name] = { quantity: 0, revenue: 0, orders: 0 }
    map[name].quantity += i.quantity || 0
    map[name].revenue  += i.summ      || 0
    map[name].orders   += 1
    if (!map[name].price) map[name].price = i.initial_price
  })

  const products = Object.entries(map)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)

  res.json({ products })
}
