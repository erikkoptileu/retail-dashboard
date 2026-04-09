import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/Layout.module.css'

const NAV = [
  { href: '/',         label: 'Обзор',   icon: '▦' },
  { href: '/sales',    label: 'Продажи', icon: '↗' },
  { href: '/products', label: 'Товары',  icon: '◉' },
]

export default function Layout({ children, title = 'Обзор', subtitle = '' }) {
  const router = useRouter()

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>Analytics</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(item => {
            const active = router.pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`${styles.navItem} ${active ? styles.navActive : ''}`}>
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.livedot} />
          <span>RetailCRM · Live</span>
        </div>
      </aside>

      <div className={styles.body}>
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>{title}</h1>
            {subtitle && <p className={styles.pageSub}>{subtitle}</p>}
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
