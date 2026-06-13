// app/auth/confirm/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [])
  return null
}