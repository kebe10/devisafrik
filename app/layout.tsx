// app/layout.tsx
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'


const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'DevisAfrik — Devis professionnels en 60 secondes',
  description: 'Créez des devis professionnels et partagez-les sur WhatsApp. Conçu pour les entrepreneurs africains.',
  keywords: 'devis, facture, Afrique, FCFA, WhatsApp, freelance, artisan',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${font.variable} font-sans antialiased`}>
        {children}
        
      </body>
    </html>
  )
}