import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || 'https://cuctknvvcovirkjkzatp.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y3RrbnZ2Y292aXJramt6YXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzYwMzUsImV4cCI6MjA5NTM1MjAzNX0.yCWt5158EFWywpL-0th-HFVw6ETjYjMSB5G2-tzZjvs'

export const supabase = createClient(supabaseUrl, supabaseKey)
