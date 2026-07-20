import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type BusReport = {
  id: string
  from_place: string
  to_place: string
  bus_name: string
  arrival_time: string
  departure_time: string | null
  note: string | null
  created_at: string
}
