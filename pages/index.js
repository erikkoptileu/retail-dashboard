import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'

const Bar      = dynamic(() => import('react-chartjs-2').then(m => m.Bar),      { ssr: false })
const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), { ssr: false })

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₸'

const STATUS_LABELS = {
  new: 'Новый', complete: 'Выполнен', delivering: 'Доставляется',
  'cancel-other': 'Отменён', 'no-call': 'Недозвон',
  'offer-analog': 'Предложить замену', prepayed: 'Предоплата',
}

export default function Home() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [chartsReady, setCharts]  = useState(false)

  useEffect(() => {
    // Регистрируем Chart.js только на клиенте, до рендера графиков
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement,
      ArcElement, LineElement, PointElement, Title, Tooltip, Legend }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, ArcElement,
                     LineElement, PointElement, Title, Tooltip, Legend)
      setCharts(true)
    })

    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className={styles.loader}>
      <div className={styles.spinner} />
      <p>Загрузка данных...</p>
    </div>
  )

  if (error) return (
    <div className={styles.loader}>
      <p style={{ color: '#ef4444' }}>Ошибка: {error}</p>
    </div>
  )

  const { metrics, byDate, topProducts, byStatus, byUtm } = data

  const dates   = Object.keys(byDate).sort()
  const barData = {
    labels: dates.map(d =>
      new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: 'Выручка (₸)',
        data: dates.map(d => byDate[d].revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Заказы',
        data: dates.map(d => byDate[d].orders),
        backgroundColor: 'rgba(34, 197, 94, 0.85)',
        borderRadius: 6,
        yAxisID: 'y1',
      },
    ],
  }

  const barOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top', labels: { color: '#94a3b8' } } },
    scales: {
      x:  { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
      y:  { type: 'linear', position: 'left',  ticks: { color: '#64748b', callback: v => (v/1000).toFixed(0) + 'k' }, grid: { color: '#1e293b' } },
      y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#64748b', stepSize: 1 } },
    },
  }

  const utmColors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4']
  const utmKeys   = Object.keys(byUtm)
  const donutData = {
    labels: utmKeys,
    datasets: [{
      data: utmKeys.map(k => byUtm[k]),
      backgroundColor: utmColors,
      borderWidth: 0,
    }],
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Аналитика продаж</h1>
        <span className={styles.badge}>RetailCRM → Supabase</span>
      </header>

      <div className={styles.metrics}>
        <MetricCard label="Общая выручка"  value={fmt(metrics.totalRevenue)}   icon="💰" color="#6366f1" />
        <MetricCard label="Заказов"         value={metrics.ordersCount}          icon="📦" color="#22c55e" />
        <MetricCard label="Средний чек"     value={fmt(metrics.avgCheck)}        icon="📊" color="#f59e0b" />
        <MetricCard label="Клиентов"        value={metrics.customersCount}       icon="👥" color="#ef4444" />
      </div>

      <div className={styles.card}>
        <h2>Заказы по дням</h2>
        {chartsReady && <Bar data={barData} options={barOptions} />}
      </div>

      <div className={styles.row}>
        <div className={styles.card} style={{ flex: 2 }}>
          <h2>Топ товаров по выручке</h2>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Товар</th><th>Кол-во</th><th>Выручка</th></tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i}>
                  <td className={styles.rank}>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.quantity} шт.</td>
                  <td className={styles.money}>{fmt(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.card} style={{ flex: 1 }}>
          <h2>Источники заказов</h2>
          {chartsReady && <Doughnut
            data={donutData}
            options={{ plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }}
          />}
        </div>
      </div>

      <div className={styles.card}>
        <h2>Статусы заказов</h2>
        <div className={styles.statuses}>
          {Object.entries(byStatus).sort((a,b) => b[1]-a[1]).map(([s, count]) => (
            <div key={s} className={styles.statusItem}>
              <span className={styles.statusDot} />
              <span>{STATUS_LABELS[s] || s}</span>
              <span className={styles.statusCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon, color }) {
  return (
    <div className={styles.metricCard} style={{ borderTopColor: color }}>
      <div className={styles.metricIcon}>{icon}</div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
    </div>
  )
}
