import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import styles from '../styles/Products.module.css'

const Bar = dynamic(() => import('react-chartjs-2').then(m => m.Bar), { ssr: false })

const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(n))
const COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#be185d','#0f766e']

export default function Products() {
  const [products, setProducts]  = useState([])
  const [loading, setLoading]    = useState(true)
  const [chartsReady, setCharts] = useState(false)
  const [sortBy, setSortBy]      = useState('revenue')

  useEffect(() => {
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
      setCharts(true)
    })
    fetch('/api/products').then(r => r.json()).then(d => {
      setProducts(d.products || [])
      setLoading(false)
    })
  }, [])

  const sorted = [...products].sort((a, b) => b[sortBy] - a[sortBy])
  const top8   = sorted.slice(0, 8)
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const totalQty     = products.reduce((s, p) => s + p.quantity, 0)

  const barData = {
    labels: top8.map(p => p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name),
    datasets: [{
      label: sortBy === 'revenue' ? 'Выручка (₸)' : 'Кол-во (шт.)',
      data: top8.map(p => p[sortBy]),
      backgroundColor: top8.map((_, i) => COLORS[i % COLORS.length] + 'cc'),
      borderRadius: 6,
      borderSkipped: false,
    }],
  }

  const barOptions = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff', borderColor: '#e8eaf0', borderWidth: 1,
        titleColor: '#374151', bodyColor: '#6b7280',
        callbacks: {
          label: ctx => sortBy === 'revenue' ? ` ${fmt(ctx.raw)} ₸` : ` ${ctx.raw} шт.`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#9ca3af', callback: v => sortBy === 'revenue' ? fmt(v/1000)+'k' : v },
           grid: { color: '#f3f4f6' } },
      y: { ticks: { color: '#374151', font: { size: 12 } }, grid: { display: false } },
    },
  }

  return (
    <Layout title="Товары" subtitle={`${products.length} позиций`}>

      {/* KPI */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiVal}>{products.length}</div>
          <div className={styles.kpiLabel}>Позиций</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiVal}>{fmt(totalRevenue)} ₸</div>
          <div className={styles.kpiLabel}>Общая выручка</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiVal}>{totalQty} шт.</div>
          <div className={styles.kpiLabel}>Продано всего</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiVal}>{products.length ? fmt(totalRevenue / products.length) : 0} ₸</div>
          <div className={styles.kpiLabel}>Средняя выручка</div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Топ-8 товаров</h2>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${sortBy === 'revenue' ? styles.tabActive : ''}`}
              onClick={() => setSortBy('revenue')}>По выручке</button>
            <button
              className={`${styles.tab} ${sortBy === 'quantity' ? styles.tabActive : ''}`}
              onClick={() => setSortBy('quantity')}>По кол-ву</button>
          </div>
        </div>
        <div className={styles.chartWrap}>
          {chartsReady && <Bar data={barData} options={barOptions} />}
        </div>
      </div>

      {/* Table */}
      <div className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardHeader}>
          <h2>Все товары</h2>
          <div className={styles.tabs}>
            {['revenue','quantity','orders'].map(k => (
              <button key={k}
                className={`${styles.tab} ${sortBy === k ? styles.tabActive : ''}`}
                onClick={() => setSortBy(k)}>
                {{ revenue: 'Выручка', quantity: 'Кол-во', orders: 'Заказы' }[k]}
              </button>
            ))}
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>#</th><th>Товар</th><th>Цена</th><th>Продано</th><th>Заказов</th><th>Выручка</th><th>Доля</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding: 24, color:'#9ca3af' }}>Загрузка...</td></tr>
            ) : sorted.map((p, i) => {
              const share = totalRevenue ? Math.round(p.revenue / totalRevenue * 100) : 0
              return (
                <tr key={i}>
                  <td className={styles.rank}>{i + 1}</td>
                  <td className={styles.pname}>{p.name}</td>
                  <td>{fmt(p.price)} ₸</td>
                  <td>{p.quantity} шт.</td>
                  <td>{p.orders}</td>
                  <td className={styles.money}>{fmt(p.revenue)} ₸</td>
                  <td>
                    <div className={styles.shareWrap}>
                      <div className={styles.shareBar}>
                        <div className={styles.shareFill}
                          style={{ width: `${share}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className={styles.sharePct}>{share}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
