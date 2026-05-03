import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase;

try {
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    throw new Error('Invalid Supabase URL. Please check your .env file or Vercel Environment Variables.')
  }
  console.log('[Supabase] Initializing with URL:', supabaseUrl)
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (err) {
  console.error('Failed to initialize Supabase:', err.message)
  // Fallback to a dummy object to prevent crashes, but auth will not work
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
      signUp: () => Promise.reject(new Error('Supabase not configured')),
      signOut: () => Promise.resolve(),
      resetPasswordForEmail: () => Promise.reject(new Error('Supabase not configured')),
      updateUser: () => Promise.reject(new Error('Supabase not configured')),
      verifyOtp: () => Promise.reject(new Error('Supabase not configured')),
    }
  }
}

export { supabase }
