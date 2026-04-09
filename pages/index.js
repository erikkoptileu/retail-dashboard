import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import styles from '../styles/Home.module.css'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend
)

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { style: 'decimal' }).format(Math.round(n)) + ' ₸'

const STATUS_LABELS = {
  new: 'Новый', complete: 'Выполнен', delivering: 'Доставляется',
  'cancel-other': 'Отменён', 'no-call': 'Недозвон',
  'offer-analog': 'Предложить замену', prepayed: 'Предоплата',
}

export default function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className={styles.loader}>
      <div className={styles.spinner} />
      <p>Загрузка данных...</p>
    </div>
  )

  const { metrics, byDate, topProducts, byStatus, byUtm } = data

  // График заказов по дням
  const dates   = Object.keys(byDate).sort()
  const barData = {
    labels: dates.map(d => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Выручка (₸)',
        data: dates.map(d => byDate[d].revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Заказы',
        data: dates.map(d => byDate[d].orders),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 6,
        yAxisID: 'y1',
      },
    ],
  }

  const barOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top' } },
    scales: {
      y:  { type: 'linear', position: 'left',  ticks: { callback: v => (v/1000).toFixed(0) + 'k ₸' } },
      y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { stepSize: 1 } },
    },
  }

  // Дограф по UTM
  const utmColors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4']
  const utmKeys = Object.keys(byUtm)
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

      {/* Метрики */}
      <div className={styles.metrics}>
        <MetricCard label="Общая выручка"      value={fmt(metrics.totalRevenue)} icon="💰" color="#6366f1" />
        <MetricCard label="Заказов"             value={metrics.ordersCount}       icon="📦" color="#22c55e" />
        <MetricCard label="Средний чек"         value={fmt(metrics.avgCheck)}     icon="📊" color="#f59e0b" />
        <MetricCard label="Клиентов"            value={metrics.customersCount}    icon="👥" color="#ef4444" />
      </div>

      {/* График */}
      <div className={styles.card}>
        <h2>Заказы по дням</h2>
        <Bar data={barData} options={barOptions} />
      </div>

      <div className={styles.row}>
        {/* Топ товаров */}
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

        {/* UTM */}
        <div className={styles.card} style={{ flex: 1 }}>
          <h2>Источники заказов</h2>
          <Doughnut data={donutData} options={{ plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>

      {/* Статусы */}
      <div className={styles.card}>
        <h2>Статусы заказов</h2>
        <div className={styles.statuses}>
          {Object.entries(byStatus)
            .sort((a, b) => b[1] - a[1])
            .map(([s, count]) => (
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
