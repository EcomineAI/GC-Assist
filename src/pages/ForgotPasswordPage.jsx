import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { resetPassword } = useAuth()
  const { isDark, colorTheme } = useTheme()

  const getLogo = () => {
    if (isDark) return '/logo.png'
    if (colorTheme === 'green') return '/greenlogo.png'
    if (colorTheme === 'blue') return '/bluelogo.png'
    return '/logo.png'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    setLoading(true)
    
    try {
      const { error } = await resetPassword(email)
      if (error) throw error
      setMsg('Password reset link sent! Please check your email.')
    } catch (err) {
      setError(err.message || 'Failed to send reset link')
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
        <Link to="/login" className="auth-back-link" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        
        <div className="auth-header">
          <img src={getLogo()} alt="GC Assist" className="auth-logo" />
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">We'll send you a link to reset it</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {msg && <div className="auth-error" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }}>{msg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input 
                type="email" 
                className="auth-input" 
                style={{ paddingLeft: '2.75rem' }}
                placeholder="name@gordoncollege.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <Loader2 className="spin" size={20} /> : (
              <>
                <Send size={20} />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password? <Link to="/login" className="auth-link">Log in</Link>
        </div>
      </motion.div>
    </div>
  )
}
