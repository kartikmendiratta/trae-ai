import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface Profile {
  id: string
  email: string
  role: 'admin' | 'agent' | 'customer'
  full_name: string | null
  created_at: string
}

export interface Ticket {
  id: number
  customer_id: string
  subject: string
  description: string
  status: 'open' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  sentiment_score: number | null
  tags: string | null
  created_at: string
  profiles?: Profile
}

export interface Message {
  id: number
  ticket_id: number
  sender_id: string
  content: string
  is_internal: boolean
  created_at: string
  profiles?: Profile
}
