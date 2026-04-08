import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Supabase] Missing environment variables.\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Quick connection test ─────────────────────────────────────────────────────
// Call this once from any component to verify the connection is working.
// Remove it after you've confirmed everything is connected.
//
// Usage:  import { testConnection } from '../lib/supabase'
//         testConnection()
//
export const testConnection = async () => {
  console.group('[Supabase] Connection Test')
  try {
    const { data, error } = await supabase.from('projects').select('count').limit(1)
    if (error) {
      console.error('❌ Connection FAILED:', error.message)
      console.error('   Code:', error.code)
      console.error('   Hint:', error.hint ?? '—')
    } else {
      console.log('✅ Connection SUCCESSFUL — projects table is reachable')
      console.log('   Response:', data)
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
  console.groupEnd()
}
