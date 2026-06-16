// components/AppLayout.tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AppLayoutProps {
  children: React.ReactNode
  org?: { name: string; plan: string } | null
}

export default function AppLayout({ children, org }: AppLayoutProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { key: 'dashboard',    icon: '🏠', label: 'Tableau de bord', path: '/dashboard' },
    { key: 'quotes',       icon: '📄', label: 'Devis',           path: '/quotes' },
    { key: 'services',     icon: '🛠️', label: 'Catalogue',       path: '/services' },
    { key: 'clients',      icon: '👥', label: 'Clients',         path: '/clients' },
    { key: 'settings',     icon: '⚙️', label: 'Paramètres',      path: '/settings' },
    { key: 'subscription', icon: '⭐', label: 'Tarifs',          path: '/subscription' },
  ]

  const isActive = (path: string) =>
    pathname === path || (path !== '/dashboard' && pathname.startsWith(path))

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navigate = (path: string) => {
    setMenuOpen(false)
    router.push(path)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── SIDEBAR DESKTOP ─────────────────────────────────── */}
      <div style={{
        width: 220, background: 'var(--blue)', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}
        className="sidebar-desktop"
      >
        {/* Logo */}
         <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
           <div style={{ background: '#fff', borderRadius: 8, padding: '4px 8px', display: 'inline-flex' }}>
            <img src="/logo-new.png" alt="DevisAfrik" style={{ height: 30, width: 'auto', objectFit: 'contain' }} />
          </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
             {org?.name || '...'}
          </div>
         </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px' }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                width: '100%', padding: '10px 12px', borderRadius: 9,
                marginBottom: 2, border: 'none', textAlign: 'left',
                fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
                background: isActive(item.path) ? 'rgba(255,255,255,0.14)' : 'transparent',
                color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.55)',
                fontWeight: isActive(item.path) ? 600 : 400,
                transition: 'all .15s',
              }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Plan + Déconnexion */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 9, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
              Plan {org?.plan === 'premium' ? 'Premium ⭐' : 'Gratuit'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
              {org?.plan === 'premium' ? 'Devis illimités' : '3 devis/mois'}
            </div>
          </div>
          <button onClick={logout}
            style={{
              width: '100%', padding: '9px', borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── HEADER MOBILE ───────────────────────────────────── */}
      <div className="mobile-header" style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0,
        background: 'var(--blue)', zIndex: 99,
        padding: '0 16px', height: 56,
        alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo-new.png" alt="DevisAfrik" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
         </div>
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: '#fff', fontSize: 20, cursor: 'pointer',
            width: 40, height: 40, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MENU MOBILE OVERLAY ─────────────────────────────── */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
          className="mobile-overlay"
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 56, left: 0, right: 0,
              background: 'var(--blue)', padding: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '14px 16px', borderRadius: 9,
                  marginBottom: 2, border: 'none', textAlign: 'left',
                  fontFamily: 'inherit', fontSize: 15, cursor: 'pointer',
                  background: isActive(item.path) ? 'rgba(255,255,255,0.14)' : 'transparent',
                  color: isActive(item.path) ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontWeight: isActive(item.path) ? 600 : 400,
                }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
            <button onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '14px 16px', borderRadius: 9,
                border: 'none', textAlign: 'left', fontFamily: 'inherit',
                fontSize: 15, cursor: 'pointer', background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
              }}>
              🚪 Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENU PRINCIPAL ───────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
        className="app-content">
        {children}
      </div>

      {/* ── NAV MOBILE BAS D'ÉCRAN ──────────────────────────── */}
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--blue)', zIndex: 99,
        padding: '8px 4px 16px',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.15)',
      }}>
        {/* Dashboard */}
        <button onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: isActive('/dashboard') ? '#fff' : 'rgba(255,255,255,0.5)', background: isActive('/dashboard') ? 'rgba(255,255,255,0.12)' : 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10, fontFamily: 'inherit' }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Accueil</span>
        </button>
        {/* Devis */}
        <button onClick={() => navigate('/quotes')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: isActive('/quotes') ? '#fff' : 'rgba(255,255,255,0.5)', background: isActive('/quotes') ? 'rgba(255,255,255,0.12)' : 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10, fontFamily: 'inherit' }}>
          <span style={{ fontSize: 22 }}>📄</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Devis</span>
        </button>
        {/* Bouton nouveau devis central */}
        <button onClick={() => navigate('/quotes/new')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'var(--orange)', border: 'none', cursor: 'pointer', width: 52, height: 52, borderRadius: '50%', marginTop: -16, boxShadow: '0 4px 14px rgba(255,107,53,0.5)', color: '#fff', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 24 }}>➕</span>
        </button>
        {/* Catalogue */}
        <button onClick={() => navigate('/services')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: isActive('/services') ? '#fff' : 'rgba(255,255,255,0.5)', background: isActive('/services') ? 'rgba(255,255,255,0.12)' : 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10, fontFamily: 'inherit' }}>
          <span style={{ fontSize: 22 }}>🛠️</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Catalogue</span>
        </button>
        {/* Clients */}
        <button onClick={() => navigate('/clients')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: isActive('/clients') ? '#fff' : 'rgba(255,255,255,0.5)', background: isActive('/clients') ? 'rgba(255,255,255,0.12)' : 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 10, fontFamily: 'inherit' }}>
          <span style={{ fontSize: 22 }}>👥</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Clients</span>
        </button>
      </nav>
    </div>
  )
}