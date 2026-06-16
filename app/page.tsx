// app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const WHATSAPP_NUMBER = '2250777665671'

export default function LandingPage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    { icon: '⚡', title: '60 secondes chrono', desc: "Devis complet et professionnel en moins d'une minute. Plus besoin de Word ou Excel." },
    { icon: '📱', title: 'Mobile-first', desc: 'Conçu pour Android, même avec une connexion 3G lente. Fonctionne sur tous les téléphones.' },
    { icon: '💬', title: 'WhatsApp direct', desc: 'Envoyez votre PDF professionnel à votre client en un seul clic depuis WhatsApp.' },
    { icon: '🤖', title: 'IA intégrée', desc: "Décrivez votre travail en français, l'IA structure automatiquement votre devis complet." },
    { icon: '💰', title: 'FCFA natif', desc: 'Conçu pour le marché africain. Calcul TVA, remise et total en FCFA automatiquement.' },
    { icon: '📄', title: 'PDF professionnel', desc: 'Votre logo, vos couleurs, vos coordonnées. Un devis qui inspire confiance à vos clients.' },
  ]

  const steps = [
    { n: '1', title: 'Décrivez votre prestation', desc: "Entrez le nom de votre client et vos services. L'IA peut même le faire pour vous." },
    { n: '2', title: 'Devis généré automatiquement', desc: 'Calcul TVA, remise et total TTC en temps réel. Votre devis est prêt en 60 secondes.' },
    { n: '3', title: 'Envoyez sur WhatsApp', desc: 'Téléchargez le PDF et envoyez-le directement à votre client via WhatsApp.' },
  ]

  const faqs = [
    ['Est-ce vraiment gratuit ?', 'Oui, le plan gratuit vous permet de créer 3 devis par mois sans carte bancaire ni engagement. Le plan Premium à 9 500 FCFA/mois lève toutes les limites.'],
    ['Comment fonctionne le paiement Premium ?', 'Vous payez via Wave CI, Orange Money ou MTN MoMo. Paiement 100% sécurisé via FedaPay, plateforme certifiée en Afrique de l\'Ouest.'],
    ['Est-ce que ça marche sur Android ?', 'Oui, DevisAfrik est conçu mobile-first et fonctionne parfaitement sur tous les téléphones Android, même les entrées de gamme avec une connexion 3G.'],
    ['Mes données sont-elles en sécurité ?', 'Vos devis et données clients sont sauvegardés dans le cloud et accessibles partout. Nous n\'avons jamais accès à vos informations clients.'],
    ['Puis-je ajouter mon logo sur les devis ?', 'Oui, avec le plan Premium vous pouvez ajouter votre logo et personnaliser les couleurs de vos devis PDF.'],
    ['Comment contacter le support ?', 'Notre équipe est disponible sur WhatsApp 7j/7. Cliquez sur le bouton WhatsApp en bas de page pour nous contacter directement.'],
  ]

  const testimonials = [
    { name: 'Sékou Coulibaly', role: 'Électricien, Abidjan', text: "Mes clients me prennent au sérieux maintenant. J'ai décroché 3 gros contrats grâce à mes devis professionnels DevisAfrik.", avatar: 'SC' },
    { name: 'Fatoumata Bah', role: 'Graphiste freelance, Dakar', text: 'Je partage mes devis directement sur WhatsApp. Mes clients répondent beaucoup plus vite et me paient sans discussion.', avatar: 'FB' },
    { name: 'Moussa Kaboré', role: 'Plombier, Ouagadougou', text: 'Simple, rapide, professionnel. En 2 minutes mon devis est prêt. Même mes clients en province sont impressionnés.', avatar: 'MK' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-jakarta), sans-serif', overflowX: 'hidden' }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <img src="/logo-new.png" alt="DevisAfrik" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />

          <div className="header-desktop-btns" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#25D366', color: '#fff', textDecoration: 'none' }}>
              💬 WhatsApp
            </a>
            <button onClick={() => router.push('/login')}
              style={{ padding: '9px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
              Connexion
            </button>
            <button onClick={() => router.push('/register')}
              style={{ padding: '9px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer' }}>
              Commencer gratuitement
            </button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="header-mobile-btn"
            style={{ display: 'none', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--blue)', padding: '4px 8px' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div className="header-mobile-menu" style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 600, background: '#25D366', color: '#fff', textDecoration: 'none' }}>
              💬 Nous contacter sur WhatsApp
            </a>
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
      <section style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)', padding: '64px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,107,53,0.2)', color: '#FF6B35', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            🌍 Fait pour les entrepreneurs d'Afrique francophone
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
            Créez des devis professionnels<br />
            <span style={{ color: '#FF6B35' }}>en moins de 60 secondes</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            Le seul logiciel de devis conçu pour les artisans, freelances et PME d'Afrique francophone. PDF professionnel + envoi WhatsApp en 1 clic.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <button onClick={() => router.push('/register')}
              style={{ padding: '15px 28px', borderRadius: 10, fontSize: 16, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer', minWidth: 240 }}>
              🚀 Commencer gratuitement
            </button>
            <button onClick={() => router.push('/login')}
              style={{ padding: '15px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, background: 'transparent', color: '#fff', cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.3)', minWidth: 160 }}>
              Se connecter
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
            ✅ Gratuit · 3 devis/mois · Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--orange)', padding: '24px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {[['2 000+', 'Devis créés'], ['500+', 'Entrepreneurs actifs'], ['9 500 FCFA', 'Plan Premium/mois']].map(([val, lbl]) => (
            <div key={lbl}>
              <div style={{ fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 800, color: '#fff' }}>{val}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCREENSHOT DASHBOARD ── */}
      <section style={{ background: '#F0F4FF', padding: '60px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>
            Votre tableau de bord professionnel
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 40, fontSize: 15 }}>
            Suivez vos devis, vos revenus et vos clients depuis votre téléphone
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxWidth: 360, margin: '0 auto' }}>
              <img src="/screenshot-dashboard.jpg" alt="Tableau de bord DevisAfrik" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '📊', title: 'Statistiques en temps réel', desc: 'Visualisez vos revenus encaissés, devis acceptés et payés en un coup d\'œil.' },
                { icon: '📄', title: 'Gestion complète des devis', desc: 'Créez, modifiez, dupliquez et suivez le statut de tous vos devis depuis votre téléphone.' },
                { icon: '👥', title: 'Carnet de clients intégré', desc: 'Sauvegardez vos clients et retrouvez-les en un clic pour vos prochains devis.' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blue)', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SCREENSHOT PDF ── */}
      <section style={{ background: 'var(--blue)', padding: '60px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Des devis PDF qui impressionnent vos clients
          </h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: 40, fontSize: 15 }}>
            Votre logo, vos couleurs, votre cachet professionnel — prêt à envoyer sur WhatsApp
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '🎨', title: 'Votre logo et vos couleurs', desc: 'Personnalisez vos devis avec votre identité visuelle pour un rendu 100% professionnel.' },
                { icon: '🧮', title: 'Calcul automatique TVA', desc: 'Sous-total HT, TVA 18%, remises — tout est calculé automatiquement sans erreur.' },
                { icon: '✍️', title: 'Signature client incluse', desc: 'Zone de signature intégrée sur chaque devis pour une validation formelle.' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxWidth: 400, margin: '0 auto' }}>
              <img src="/screenshot-pdf.jpg" alt="Exemple devis PDF DevisAfrik" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── SCREENSHOT CREATION DEVIS ── */}
      <section style={{ padding: '60px 16px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>
            Création de devis ultra-simple
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 40, fontSize: 15 }}>
            Téléchargez le PDF ou envoyez directement sur WhatsApp en 1 clic
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', maxWidth: 360, margin: '0 auto' }}>
              <img src="/screenshot-devis.jpg" alt="Création devis DevisAfrik" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '🤖', title: 'Génération IA en 1 phrase', desc: 'Décrivez votre prestation en français, l\'IA génère automatiquement toutes les lignes de votre devis.' },
                { icon: '📲', title: 'Envoi WhatsApp en 1 clic', desc: 'Le message professionnel avec le récapitulatif est prêt. Il vous suffit de cliquer sur Envoyer.' },
                { icon: '💾', title: 'Sauvegarde automatique', desc: 'Vos devis sont sauvegardés dans le cloud. Reprenez un devis là où vous l\'avez laissé.' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blue)', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section style={{ padding: '60px 16px', background: '#F8F9FA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>Tout ce qu'il vous faut</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 40 }}>Pensé pour votre réalité quotidienne en Afrique</p>
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
      <section style={{ padding: '60px 16px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>Ils utilisent DevisAfrik</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 40 }}>Des entrepreneurs comme vous, partout en Afrique francophone</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 34, color: 'var(--orange)', marginBottom: 10 }}>"</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 18, fontStyle: 'italic' }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--orange)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.avatar}</div>
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

      {/* ── TARIFS ── */}
      <section style={{ background: '#F8F9FA', padding: '60px 16px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'var(--blue)', marginBottom: 8 }}>Tarif simple et transparent</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>Commencez gratuitement, passez Premium quand vous êtes prêt</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Gratuit */}
            <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Gratuit</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--blue)', marginBottom: 4 }}>0 <span style={{ fontSize: 14, fontWeight: 500 }}>FCFA</span></div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Pour toujours</div>
              {['3 devis par mois', 'Génération PDF', 'Partage WhatsApp', 'Gestion clients'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: '#10B981' }}>✅</span> {f}
                </div>
              ))}
              <button onClick={() => router.push('/register')}
                style={{ width: '100%', marginTop: 20, padding: '11px', borderRadius: 9, fontSize: 14, fontWeight: 700, background: 'transparent', color: 'var(--blue)', border: '2px solid var(--blue)', cursor: 'pointer' }}>
                Commencer gratuitement
              </button>
            </div>
            {/* Premium */}
            <div style={{ background: 'var(--blue)', border: '2px solid var(--orange)', borderRadius: 18, padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 14px', borderBottomLeftRadius: 12 }}>⭐ POPULAIRE</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Premium</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>9 500 <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>FCFA</span></div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>par mois</div>
              {['Devis illimités', 'Logo personnalisé', 'Génération IA avancée', 'Statistiques complètes', 'Historique des statuts', 'Support WhatsApp prioritaire'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 14, color: '#fff' }}>
                  <span style={{ color: 'var(--orange)' }}>⭐</span> {f}
                </div>
              ))}
              <button onClick={() => router.push('/register')}
                style={{ width: '100%', marginTop: 20, padding: '11px', borderRadius: 9, fontSize: 14, fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Essayer Premium →
              </button>
              <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                💙 Wave CI · 🟠 Orange Money · 🟡 MTN MoMo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '60px 16px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: 'clamp(22px, 4vw, 28px)', color: 'var(--blue)', marginBottom: 8 }}>
            Questions fréquentes
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 36 }}>Tout ce que vous voulez savoir avant de commencer</p>
          {faqs.map(([q, a], i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#fff', fontWeight: 600, fontSize: 14, color: 'var(--blue)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 12 }}>
                <span>{q}</span>
                <span style={{ fontSize: 20, color: 'var(--orange)', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 18px 14px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, background: '#FAFAFA' }}>{a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A8E 100%)', padding: '60px 16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Prêt à professionnaliser votre activité ?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
          Rejoignez des centaines d'entrepreneurs africains qui créent des devis professionnels avec DevisAfrik.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/register')}
            style={{ padding: '16px 32px', borderRadius: 10, fontSize: 16, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer', minWidth: 260 }}>
            🚀 Créer mon compte gratuitement →
          </button>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600, background: '#25D366', color: '#fff', textDecoration: 'none', minWidth: 200 }}>
            💬 Nous contacter
          </a>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 16 }}>
          Gratuit · Sans carte bancaire · Annulation à tout moment
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0F1F33', padding: '40px 16px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 32 }}>
            <div>
              <div style={{ background: '#fff', borderRadius: 8, padding: '4px 8px', display: 'inline-flex', marginBottom: 12 }}>
                <img src="/logo-new.png" alt="DevisAfrik" style={{ height: 36, width: 'auto' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, maxWidth: 260, lineHeight: 1.6 }}>
                Le logiciel de devis conçu pour les entrepreneurs d'Afrique francophone.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Liens rapides</div>
              {[['Connexion', '/login'], ['Inscription gratuite', '/register'], ['Tarifs', '/subscription']].map(([label, path]) => (
                <span key={label} onClick={() => router.push(path)}
                  style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                  {label}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Support</div>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                💬 WhatsApp Support
              </a>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Disponible 7j/7</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>© 2026 DevisAfrik — Conçu avec ❤️ pour l'Afrique francophone</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>🌍 Côte d'Ivoire · Sénégal · Mali · Cameroun</p>
          </div>
        </div>
      </footer>

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