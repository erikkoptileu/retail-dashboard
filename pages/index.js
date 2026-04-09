import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'

const Line     = dynamic(() => import('react-chartjs-2').then(m => m.Line),     { ssr: false })
const Doughnut = dynamic(() => import('react-chartjs-2').then(m => m.Doughnut), { ssr: false })

const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n))

const STATUS_LABELS = {
  new: 'Новый', complete: 'Выполнен', delivering: 'Доставляется',
  'cancel-other': 'Отменён', 'no-call': 'Недозвон',
  'offer-analog': 'Предложить замену', prepayed: 'Предоплата',
  'assembling': 'Комплектуется', 'send-to-delivery': 'Передан в доставку',
}

const UTM_COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2']

export default function Home() {
  const [data, setData]          = useState(null)
  const [loading, setLoading]    = useState(true)
  const [error, setError]        = useState(null)
  const [chartsReady, setCharts] = useState(false)

  useEffect(() => {
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement,
      ArcElement, LineElement, PointElement, Filler, Title, Tooltip, Legend }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, ArcElement,
                     LineElement, PointElement, Filler, Title, Tooltip, Legend)
      setCharts(true)
    })
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className={styles.splash}>
      <div className={styles.splashInner}>
        <div className={styles.spinner} />
        <p>Загрузка данных...</p>
      </div>
    </div>
  )
  if (error) return (
    <div className={styles.splash}>
      <p style={{ color: '#ef4444' }}>Ошибка: {error}</p>
    </div>
  )

  const { metrics, byDate, topProducts, byStatus, byUtm } = data
  const dates = Object.keys(byDate).sort()

  // Area chart
  const lineData = {
    labels: dates.map(d =>
      new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: 'Выручка',
        data: dates.map(d => byDate[d].revenue),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#7c3aed',
        yAxisID: 'y',
      },
      {
        label: 'Заказы',
        data: dates.map(d => byDate[d].orders),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#2563eb',
        yAxisID: 'y1',
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', boxWidth: 12, padding: 20 },
      },
      tooltip: {
        backgroundColor: '#1e1e2e',
        borderColor: '#2d2d44',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        callbacks: {
          label: ctx =>
            ctx.datasetIndex === 0
              ? ` ${fmt(ctx.raw)} ₸`
              : ` ${ctx.raw} заказов`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 12 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        type: 'linear', position: 'left',
        ticks: { color: '#64748b', callback: v => fmt(v/1000) + 'k' },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y1: {
        type: 'linear', position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#64748b', stepSize: 1 },
      },
    },
  }

  // Donut
  const utmKeys = Object.keys(byUtm)
  const donutData = {
    labels: utmKeys,
    datasets: [{
      data: utmKeys.map(k => byUtm[k]),
      backgroundColor: UTM_COLORS,
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }
  const donutOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 16, boxWidth: 10 },
      },
    },
  }

  // Top products bar widths
  const maxRevenue = topProducts[0]?.revenue || 1

  return (
    <div className={styles.page}>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>Analytics</span>
        </div>
        <nav className={styles.nav}>
          <a className={`${styles.navItem} ${styles.navActive}`}>
            <span>▦</span> Обзор
          </a>
          <a className={styles.navItem}><span>↗</span> Продажи</a>
          <a className={styles.navItem}><span>◉</span> Товары</a>
          <a className={styles.navItem}><span>♟</span> Клиенты</a>
        </nav>
        <div className={styles.sidebarBadge}>
          <span className={styles.dot} />
          RetailCRM → Supabase
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>

        {/* Header */}
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>Обзор продаж</h1>
            <p className={styles.pageSubtitle}>Данные из RetailCRM · обновлено сегодня</p>
          </div>
          <div className={styles.syncBadge}>● Live</div>
        </div>

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <KPICard
            label="Общая выручка"
            value={`${fmt(metrics.totalRevenue)} ₸`}
            sub="все заказы"
            color="#7c3aed"
            icon="💰"
          />
          <KPICard
            label="Заказов"
            value={metrics.ordersCount}
            sub="за период"
            color="#2563eb"
            icon="📦"
          />
          <KPICard
            label="Средний чек"
            value={`${fmt(metrics.avgCheck)} ₸`}
            sub="на заказ"
            color="#059669"
            icon="📈"
          />
          <KPICard
            label="Клиентов"
            value={metrics.customersCount}
            sub="уникальных"
            color="#d97706"
            icon="👥"
          />
        </div>

        {/* Chart row */}
        <div className={styles.chartRow}>
          <div className={styles.card} style={{ flex: 3 }}>
            <div className={styles.cardHeader}>
              <h2>Динамика выручки и заказов</h2>
            </div>
            <div className={styles.chartWrap}>
              {chartsReady && <Line data={lineData} options={lineOptions} />}
            </div>
          </div>

          <div className={styles.card} style={{ flex: 1, minWidth: 220 }}>
            <div className={styles.cardHeader}>
              <h2>Источники</h2>
            </div>
            <div className={styles.donutWrap}>
              {chartsReady && <Doughnut data={donutData} options={donutOptions} />}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className={styles.bottomRow}>

          {/* Top products */}
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
                      <div
                        className={styles.productBarFill}
                        style={{
                          width: `${(p.revenue / maxRevenue) * 100}%`,
                          background: UTM_COLORS[i % UTM_COLORS.length],
                        }}
                      />
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

          {/* Statuses */}
          <div className={styles.card} style={{ flex: 1 }}>
            <div className={styles.cardHeader}>
              <h2>Статусы</h2>
            </div>
            <div className={styles.statusList}>
              {Object.entries(byStatus).sort((a,b) => b[1]-a[1]).map(([s, count], i) => {
                const total = Object.values(byStatus).reduce((a,b) => a+b, 0)
                const pct   = Math.round(count / total * 100)
                return (
                  <div key={s} className={styles.statusRow}>
                    <div className={styles.statusLeft}>
                      <span className={styles.statusBullet} style={{ background: UTM_COLORS[i % UTM_COLORS.length] }} />
                      <span className={styles.statusLabel}>{STATUS_LABELS[s] || s}</span>
                    </div>
                    <div className={styles.statusRight}>
                      <div className={styles.statusTrack}>
                        <div
                          className={styles.statusFill}
                          style={{ width: `${pct}%`, background: UTM_COLORS[i % UTM_COLORS.length] }}
                        />
                      </div>
                      <span className={styles.statusPct}>{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

function KPICard({ label, value, sub, color, icon }) {
  return (
    <div className={styles.kpiCard} style={{ '--accent': color }}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiIcon}>{icon}</span>
        <div className={styles.kpiGlow} style={{ background: color }} />
      </div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiSub}>{sub}</div>
    </div>
  )
}
