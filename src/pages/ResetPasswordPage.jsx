import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const { isDark, colorTheme } = useTheme()

  const getLogo = () => {
    if (isDark) return '/logo.png'
    if (colorTheme === 'green') return '/greenlogo.png'
    if (colorTheme === 'blue') return '/bluelogo.png'
    return '/logo.png'
  }

  useEffect(() => {
    // Check if there is a hash in the URL containing the access token (Supabase standard behavior)
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Ready to reset password
      }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')

    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setLoading(true)
    
    try {
      const { error } = await updatePassword(password)
      if (error) throw error
      setMsg('Password updated successfully! Redirecting...')
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-bg-blob auth-bg-blob-1" />
      <div className="auth-bg-blob auth-bg-blob-2" />
      
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-header">
          <img src={getLogo()} alt="GC Assist" className="auth-logo" />
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-subtitle">Enter your new secure password below</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {msg && <div className="auth-error" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }}>{msg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input 
                type="password" 
                className="auth-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="auth-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <Loader2 className="spin" size={20} /> : (
              <>
                <Lock size={20} />
                Update Password
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
