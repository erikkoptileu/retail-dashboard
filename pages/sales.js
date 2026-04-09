import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import styles from '../styles/Sales.module.css'

const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(n))

const STATUS_LABELS = {
  new: 'Новый', complete: 'Выполнен', delivering: 'Доставляется',
  'cancel-other': 'Отменён', 'no-call': 'Недозвон',
  'offer-analog': 'На замену', prepayed: 'Предоплата',
}
const STATUS_COLORS = {
  new: { bg: '#ede9fe', text: '#6d28d9' },
  complete: { bg: '#dcfce7', text: '#15803d' },
  delivering: { bg: '#dbeafe', text: '#1d4ed8' },
  'cancel-other': { bg: '#fee2e2', text: '#dc2626' },
  'no-call': { bg: '#fef9c3', text: '#a16207' },
  'offer-analog': { bg: '#fef3c7', text: '#d97706' },
  prepayed: { bg: '#f0fdf4', text: '#16a34a' },
}

export default function Sales() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => {
      setOrders(d.orders || [])
      setLoading(false)
    })
  }, [])

  const filtered = orders
    .filter(o => {
      const q = search.toLowerCase()
      return (
        !q ||
        `${o.first_name} ${o.last_name}`.toLowerCase().includes(q) ||
        (o.phone || '').includes(q) ||
        (o.number || '').includes(q)
      )
    })
    .sort((a, b) =>
      sortDir === 'desc'
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
    )

  const totalRevenue = filtered.reduce((s, o) => s + (o.total_summ || 0), 0)

  return (
    <Layout title="Продажи" subtitle={`${orders.length} заказов`}>
      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summCard}>
          <div className={styles.summVal}>{filtered.length}</div>
          <div className={styles.summLabel}>Заказов</div>
        </div>
        <div className={styles.summCard}>
          <div className={styles.summVal}>{fmt(totalRevenue)} ₸</div>
          <div className={styles.summLabel}>Выручка</div>
        </div>
        <div className={styles.summCard}>
          <div className={styles.summVal}>
            {filtered.length ? fmt(totalRevenue / filtered.length) : 0} ₸
          </div>
          <div className={styles.summLabel}>Средний чек</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Поиск по имени, телефону, номеру..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className={styles.sortBtn}
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
        >
          {sortDir === 'desc' ? '↓ Сначала новые' : '↑ Сначала старые'}
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.empty}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>Ничего не найдено</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Клиент</th>
                <th>Телефон</th>
                <th>Город</th>
                <th>Статус</th>
                <th>Сумма</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const sc = STATUS_COLORS[o.status] || { bg: '#f3f4f6', text: '#6b7280' }
                return (
                  <tr key={o.id}>
                    <td className={styles.num}>{o.number || o.id}</td>
                    <td className={styles.name}>{o.first_name} {o.last_name}</td>
                    <td className={styles.phone}>{o.phone}</td>
                    <td>{o.city || '—'}</td>
                    <td>
                      <span className={styles.badge} style={{ background: sc.bg, color: sc.text }}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className={styles.money}>{fmt(o.total_summ)} ₸</td>
                    <td className={styles.date}>
                      {o.created_at
                        ? new Date(o.created_at).toLocaleDateString('ru-RU')
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
