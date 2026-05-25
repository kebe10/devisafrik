// components/MobileNav.tsx
'use client'

import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()

  // Cacher sur les pages publiques
  const publicPages = ['/', '/login', '/register']
  if (publicPages.includes(pathname)) return null

  return null // La nav est déjà dans AppLayout
}