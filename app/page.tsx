// app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const features = [
    { icon: '⚡', title: '60 secondes', desc: "Devis complet et professionnel en moins d'une minute." },
    { icon: '📱', title: 'Mobile-first', desc: 'Conçu pour Android, même avec une connexion lente.' },
    { icon: '💬', title: 'WhatsApp direct', desc: 'Envoyez votre PDF client en un seul clic.' },
    { icon: '🤖', title: 'IA intégrée', desc: "Décrivez votre travail, l'IA structure votre devis." },
    { icon: '💰', title: 'FCFA natif', desc: 'Format africain, sans conversion ni complication.' },
    { icon: '🔒', title: 'Sécurisé', desc: 'Vos données protégées et sauvegardées en cloud.' },
  ]

  const steps = [
    { n: '1', title: 'Décrivez votre prestation', desc: 'Entrez le nom de votre client et vos services.' },
    { n: '2', title: 'Devis généré automatiquement', desc: 'Calcul TVA, remise et total en temps réel.' },
    { n: '3', title: 'Envoyez sur WhatsApp', desc: 'Un clic pour partager le PDF à votre client.' },
  ]

  const testimonials = [
    { name: 'Sékou Coulibaly', role: 'Électricien, Abidjan', text: "Mes clients me prennent au sérieux. J'ai gagné 3 gros contrats grâce à DevisAfrik.", avatar: 'SC' },
    { name: 'Fatoumata Bah', role: 'Graphiste freelance, Dakar', text: 'Je partage mes devis sur WhatsApp. Mes clients répondent beaucoup plus vite.', avatar: 'FB' },
    { name: 'Moussa Kaboré', role: 'Plombier, Ouagadougou', text: 'Simple, rapide, professionnel. Même mes clients en province sont impressionnés.', avatar: 'MK' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-jakarta), sans-serif', overflowX: 'hidden' }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           <img src="/logo-new.png" alt="DevisAfrik" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
         </div>

          {/* Boutons desktop */}
          <div className="header-desktop-btns" style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/login')}
              style={{ padding: '9px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
              Connexion
            </button>
            <button onClick={() => router.push('/register')}
              style={{ padding: '9px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--orange)', color: '#fff', cursor: 'pointer' }}>
              Commencer gratuitement
            </button>
          </div>

          {/* Bouton hamburger mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="header-mobile-btn"
            style={{ display: 'none', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--blue)', padding: '4px 8px' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <div className="header-mobile-menu" style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => { router.push('/login'); setMenuOpen(false) }}
              style={{ padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 600, background: 'transparent', color: 'var(--text)', border: '1.5px solid var(--border)', cursor: 'pointer', width: '100%' }}>
              Connexion
            </button>
            <button onClick={() => { router.push('/register'); setMenuOpen(false) }}
              style={{ padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer', width: '100%' }}>
              🚀 Commencer gratuitement
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)', padding: '60px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,107,53,0.2)', color: '#FF6B35', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            🇨🇮 Fait pour les entrepreneurs africains
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
            Créez des devis professionnels<br />
            <span style={{ color: '#FF6B35' }}>en moins de 60 secondes</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            Le seul logiciel de devis conçu pour les artisans, freelances et PME d'Afrique francophone.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/register')}
              style={{ padding: '15px 28px', borderRadius: 10, fontSize: 16, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer', width: 'auto', minWidth: 220 }}>
              🚀 Commencer gratuitement
            </button>
            <button onClick={() => router.push('/login')}
              style={{ padding: '15px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, background: 'transparent', color: '#fff', cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.3)', minWidth: 160 }}>
              Se connecter
            </button>
          </div>
          <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            Gratuit · 3 devis/mois · Aucune carte requise
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--orange)', padding: '24px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {[['2 000+', 'Devis créés'], ['500+', 'Entrepreneurs actifs'], ['97%', 'Clients satisfaits']].map(([val, lbl]) => (
            <div key={lbl}>
              <div style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: '#fff' }}>{val}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section style={{ padding: '60px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>Tout ce qu'il vous faut</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 40 }}>Pensé pour votre réalité quotidienne</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ background: '#F0F4FF', padding: '60px 16px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--blue)', marginBottom: 40 }}>Comment ça marche ?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
            {steps.map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--orange)', color: '#fff', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{s.n}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section style={{ padding: '60px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--blue)', marginBottom: 40 }}>Ils utilisent DevisAfrik</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 34, color: 'var(--orange)', marginBottom: 10 }}>"</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--orange)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background: 'var(--blue)', padding: '60px 16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>Prêt à professionnaliser votre activité ?</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 28 }}>Rejoignez 500+ entrepreneurs africains qui font confiance à DevisAfrik.</p>
        <button onClick={() => router.push('/register')}
          style={{ padding: '16px 32px', borderRadius: 10, fontSize: 16, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer', width: '100%', maxWidth: 360 }}>
          Créer mon compte gratuitement →
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0F1F33', padding: '28px 16px', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 6 }}>DevisAfrik</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>© 2026 DevisAfrik — Conçu avec ❤️ pour l'Afrique francophone</p>
      </footer>

      {/* ── CSS MEDIA QUERIES LANDING ── */}
      <style>{`
        @media (max-width: 768px) {
          .header-desktop-btns { display: none !important; }
          .header-mobile-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .header-mobile-menu { display: none !important; }
          .header-mobile-btn { display: none !important; }
        }
      `}</style>
    </div>
  )
}