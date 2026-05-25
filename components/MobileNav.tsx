// components/MobileNav.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MobileNav() {
  const router   = useRouter()
  const pathname = usePathname()

  const items = [
    { icon: '🏠', label: 'Accueil', path: '/dashboard' },
    { icon: '📄', label: 'Devis',   path: '/quotes' },
    { icon: '➕', label: 'Nouveau', path: '/quotes/new', highlight: true },
    { icon: '👥', label: 'Clients', path: '/clients' },
    { icon: '⚙️', label: 'Réglages',path: '/settings' },
  ]

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/')

  return (
    <nav className="mobile-nav">
      {items.map(item => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={isActive(item.path) ? 'nav-active' : ''}
          style={item.highlight ? {
            background: 'var(--orange)',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginTop: -16,
            boxShadow: '0 4px 12px rgba(255,107,53,0.4)',
          } : {}}
        >
          <span className="nav-icon">{item.icon}</span>
          {!item.highlight && <span>{item.label}</span>}
        </button>
      ))}
    </nav>
  )
}