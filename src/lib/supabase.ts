import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Types ──────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Credits {
  user_id: string
  balance: number
  total_purchased: number
  total_used: number
}

export interface Generation {
  id: string
  user_id: string
  prompt: string
  model: string
  provider: string
  size: string
  style: string | null
  image_url: string | null
  credits_used: number
  created_at: string
}
