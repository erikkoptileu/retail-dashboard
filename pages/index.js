import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import styles from '../styles/Home.module.css'

const Line     = dynamic(() => import('react-chartjs-2').then(m => m.Line),     { ssr: false })
const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), { ssr: false })

const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(n))

const COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2']

const STATUS_LABELS = {
  new: 'Новый', complete: 'Выполнен', delivering: 'Доставляется',
  'cancel-other': 'Отменён', 'no-call': 'Недозвон',
  'offer-analog': 'Предложить замену', prepayed: 'Предоплата',
}

export default function Overview() {
  const [data, setData]          = useState(null)
  const [loading, setLoading]    = useState(true)
  const [chartsReady, setCharts] = useState(false)

  useEffect(() => {
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement,
      ArcElement, LineElement, PointElement, Filler, Title, Tooltip, Legend }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, ArcElement,
                     LineElement, PointElement, Filler, Title, Tooltip, Legend)
      setCharts(true)
    })
    fetch('/api/stats').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className={styles.splash}>
      <div className={styles.splashInner}>
        <div className={styles.spinner} /><p>Загрузка...</p>
      </div>
    </div>
  )

  const { metrics, byDate, topProducts, byStatus, byUtm } = data
  const dates = Object.keys(byDate).sort()
  const maxRev = topProducts[0]?.revenue || 1

  const lineData = {
    labels: dates.map(d => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Выручка',
        data: dates.map(d => byDate[d].revenue),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.08)',
        fill: true, tension: 0.4,
        pointRadius: 4, pointBackgroundColor: '#7c3aed',
        yAxisID: 'y',
      },
      {
        label: 'Заказы',
        data: dates.map(d => byDate[d].orders),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.06)',
        fill: true, tension: 0.4,
        pointRadius: 4, pointBackgroundColor: '#2563eb',
        yAxisID: 'y1',
      },
    ],
  }

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { color: '#6b7280', boxWidth: 10, padding: 16 } },
      tooltip: {
        backgroundColor: '#fff', borderColor: '#e8eaf0', borderWidth: 1,
        titleColor: '#374151', bodyColor: '#6b7280',
        callbacks: {
          label: ctx => ctx.datasetIndex === 0 ? ` ${fmt(ctx.raw)} ₸` : ` ${ctx.raw} зак.`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#9ca3af', font: { size: 12 } }, grid: { color: '#f3f4f6' } },
      y: { type: 'linear', position: 'left',
           ticks: { color: '#9ca3af', callback: v => fmt(v/1000) + 'k' }, grid: { color: '#f3f4f6' } },
      y1:{ type: 'linear', position: 'right',
           grid: { drawOnChartArea: false }, ticks: { color: '#9ca3af', stepSize: 1 } },
    },
  }

  const utmKeys   = Object.keys(byUtm)
  const donutData = {
    labels: utmKeys,
    datasets: [{ data: utmKeys.map(k => byUtm[k]), backgroundColor: COLORS, borderWidth: 0, hoverOffset: 5 }],
  }

  return (
    <Layout title="Обзор продаж" subtitle="Данные из RetailCRM · обновлено сегодня">

      {/* KPI */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Выручка',     value: `${fmt(metrics.totalRevenue)} ₸`, sub: 'всего',         icon: '💰', color: '#7c3aed' },
          { label: 'Заказов',     value: metrics.ordersCount,               sub: 'за период',     icon: '📦', color: '#2563eb' },
          { label: 'Средний чек', value: `${fmt(metrics.avgCheck)} ₸`,     sub: 'на заказ',      icon: '📈', color: '#059669' },
          { label: 'Клиентов',    value: metrics.customersCount,            sub: 'уникальных',    icon: '👥', color: '#d97706' },
        ].map(c => (
          <div key={c.label} className={styles.kpiCard}>
            <div className={styles.kpiAccent} style={{ background: c.color }} />
            <span className={styles.kpiIcon}>{c.icon}</span>
            <div className={styles.kpiValue}>{c.value}</div>
            <div className={styles.kpiLabel}>{c.label}</div>
            <div className={styles.kpiSub}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className={styles.chartRow}>
        <div className={styles.card} style={{ flex: 3 }}>
          <div className={styles.cardHeader}><h2>Динамика выручки и заказов</h2></div>
          <div className={styles.chartWrap}>
            {chartsReady && <Line data={lineData} options={lineOptions} />}
          </div>
        </div>
        <div className={styles.card} style={{ flex: 1, minWidth: 220 }}>
          <div className={styles.cardHeader}><h2>Источники</h2></div>
          <div className={styles.donutWrap}>
            {chartsReady && <Doughnut data={donutData} options={{
              cutout: '68%',
              plugins: { legend: { position: 'bottom', labels: { color: '#6b7280', padding: 12, boxWidth: 10 } } },
            }} />}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className={styles.bottomRow}>
        <div className={styles.card} style={{ flex: 2 }}>
          <div className={styles.cardHeader}>
            <h2>Топ товаров</h2>
            <span className={styles.cardTag}>по выручке</span>
          </div>
          <div className={styles.productList}>
            {topProducts.map((p, i) => (
              <div key={i} className={styles.productItem}>
                <div className={styles.productRank}>{i + 1}</div>
                <div className={styles.productInfo}>
                  <div className={styles.productName}>{p.name}</div>
                  <div className={styles.productBar}>
                    <div className={styles.productBarFill}
                      style={{ width: `${(p.revenue / maxRev) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
                <div className={styles.productStats}>
                  <div className={styles.productRevenue}>{fmt(p.revenue)} ₸</div>
                  <div className={styles.productQty}>{p.quantity} шт.</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card} style={{ flex: 1 }}>
          <div className={styles.cardHeader}><h2>Статусы заказов</h2></div>
          <div className={styles.statusList}>
            {Object.entries(byStatus).sort((a,b) => b[1]-a[1]).map(([s, count], i) => {
              const total = Object.values(byStatus).reduce((a,b) => a+b, 0)
              return (
                <div key={s} className={styles.statusRow}>
                  <div className={styles.statusLeft}>
                    <span className={styles.statusBullet} style={{ background: COLORS[i % COLORS.length] }} />
                    <span className={styles.statusLabel}>{STATUS_LABELS[s] || s}</span>
                  </div>
                  <div className={styles.statusRight}>
                    <div className={styles.statusTrack}>
                      <div className={styles.statusFill}
                        style={{ width: `${Math.round(count/total*100)}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
