import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  const { data } = await supabase
    .from('orders')
    .select('id, number, first_name, last_name, phone, status, total_summ, created_at, city, utm_source')
    .order('created_at', { ascending: false })

  res.json({ orders: data || [] })
}
