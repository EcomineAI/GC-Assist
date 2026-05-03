import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Safety timeout: if auth takes too long, stop blocking the app
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 3000)

    // Get current session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          console.log('[Auth] Initial session check:', session ? 'Session found' : 'No session')
          setSession(session)
          setUser(session?.user ?? null)
        }
      })
      .catch(err => {
        console.error('Supabase Auth Error:', err)
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
          clearTimeout(timeout)
        }
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signUp = async (email, password, metadata = {}) => {
    console.log('[Auth] Attempting signup for:', email)
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        }
      })
      console.log('[Auth] Signup result:', result)
      return result
    } catch (err) {
      console.error('[Auth] Signup exception:', err)
      throw err
    }
  }

  const signIn = async (email, password) => {
    return supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  const signOut = async () => {
    return supabase.auth.signOut()
  }

  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
  }

  const updatePassword = async (newPassword) => {
    return supabase.auth.updateUser({ password: newPassword })
  }

  const updateProfile = async (metadata) => {
    return supabase.auth.updateUser({ data: metadata })
  }

  const verifyOtp = async (email, token, type = 'signup') => {
    return supabase.auth.verifyOtp({
      email,
      token,
      type,
    })
  }

  const value = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    verifyOtp,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
