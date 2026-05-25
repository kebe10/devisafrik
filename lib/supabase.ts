// lib/supabase.ts
// Client Supabase centralisé — DevisAfrik MVP
// Version simplifiée — compatible Client Components

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Client navigateur (à utiliser dans tous les 'use client') ──
export const supabase = createClient(supabaseUrl, supabaseAnon)

// Alias pour compatibilité
export const createBrowserClient = () => createClient(supabaseUrl, supabaseAnon)

// ── Client admin (API Routes uniquement) ───────────────────────
export const createAdminClient = () =>
  createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

// ── Types ──────────────────────────────────────────────────────
export type Plan        = 'free' | 'premium'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid'

export interface Organization {
  id:                    string
  name:                  string
  logo_url?:             string
  address?:              string
  phone?:                string
  whatsapp_number?:      string
  email?:                string
  rccm?:                 string
  default_currency:      string
  default_tax_rate:      number
  default_payment_terms: string
  devis_color:           string
  devis_footer?:         string
  plan:                  Plan
  plan_expires_at?:      string
  created_at:            string
}

export interface Client {
  id:               string
  organization_id:  string
  name:             string
  email?:           string
  phone?:           string
  whatsapp_number?: string
  address?:         string
  company_name?:    string
  created_at:       string
}

export interface QuoteItem {
  id:          string
  quote_id:    string
  description: string
  quantity:    number
  unit:        string
  unit_price:  number
  total:       number
  sort_order:  number
}

export interface Quote {
  id:              string
  organization_id: string
  client_id?:      string
  quote_number:    string
  title?:          string
  status:          QuoteStatus
  currency:        string
  tax_rate:        number
  discount_amount: number
  subtotal:        number
  tax_amount:      number
  total:           number
  payment_terms?:  string
  validity_days:   number
  notes?:          string
  pdf_url?:        string
  created_at:      string
  updated_at:      string
  client?:         Client
  items?:          QuoteItem[]
}

export interface DashboardStats {
  total_quotes:    number
  draft_count:     number
  sent_count:      number
  accepted_count:  number
  paid_count:      number
  total_revenue:   number
  pending_revenue: number
  month_quotes:    number
}

// ── Helpers ─────────────────────────────────────────────────────
export const formatCFA = (amount: number): string =>
  new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'

export const formatAmount = (amount: number, currency: string = 'XOF'): string => {
  const symbols: Record<string, string> = {
    XOF: 'FCFA',
    XAF: 'FCFA',
    EUR: '€',
    USD: '$',
    GHS: 'GH₵',
    NGN: '₦',
  }
  const symbol = symbols[currency] || currency
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.round(amount))
  
  // Symbole avant ou après selon la devise
  if (['EUR', 'USD', 'GHS', 'NGN'].includes(currency)) {
    return `${symbol} ${formatted}`
  }
  return `${formatted} ${symbol}`
}

export const QUOTE_STATUSES = {
  draft:    { label: 'Brouillon', color: '#6B7280', bg: '#F3F4F6' },
  sent:     { label: 'Envoyé',    color: '#2D5A8E', bg: '#EFF6FF' },
  accepted: { label: 'Accepté',   color: '#059669', bg: '#ECFDF5' },
  paid:     { label: 'Payé',      color: '#065F46', bg: '#D1FAE5' },
  rejected: { label: 'Refusé',    color: '#DC2626', bg: '#FEF2F2' },
}