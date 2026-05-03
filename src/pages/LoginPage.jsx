import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { signIn } = useAuth()
  const navigate = useNavigate()
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
    setLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      
      if (email.toLowerCase() === 'admin@gmail.com') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in')
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
        <Link to="/" className="auth-back-link" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        
        <div className="auth-header">
          <img src={getLogo()} alt="GC Assist" className="auth-logo" />
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to continue to GC Assist</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

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

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="auth-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <Loader2 className="spin" size={20} /> : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </div>
      </motion.div>
    </div>
  )
}
