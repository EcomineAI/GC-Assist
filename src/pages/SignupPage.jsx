import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Mail, Lock, Loader2, ArrowLeft, ShieldCheck, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1) // 1: Info, 2: OTP
  const [showPassword, setShowPassword] = useState(false)
  
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUp, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const { isDark, colorTheme } = useTheme()

  const getLogo = () => {
    if (isDark) return '/logo.png'
    if (colorTheme === 'green') return '/greenlogo.png'
    if (colorTheme === 'blue') return '/bluelogo.png'
    return '/logo.png'
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    
    // Domain restriction logic
    const lowerEmail = email.toLowerCase()
    if (!lowerEmail.endsWith('@gmail.com') && !lowerEmail.endsWith('@gordoncollege.edu.ph')) {
      return setError('Only @gmail.com and @gordoncollege.edu.ph addresses are allowed.')
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (password.length < 8 || !hasLetter || !hasNumber) {
      return setError('Password must be at least 8 characters long and contain both letters and numbers.')
    }

    setLoading(true)
    
    try {
      const { error } = await signUp(email, password)
      if (error) throw error
      
      // Artificial delay for better UX as requested
      await new Promise(r => setTimeout(r, 1200))
      
      setStep(2)
      setMsg('Verification code sent to ' + email)
    } catch (err) {
      setError(err.message || 'Failed to create an account')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await verifyOtp(email, otp, 'signup')
      if (error) throw error
      
      setMsg('Account verified successfully!')
      await new Promise(r => setTimeout(r, 1500))
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)
    try {
      const { error } = await signUp(email, password)
      if (error) throw error
      setMsg('A new code has been sent.')
    } catch (err) {
      setError(err.message)
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
          <h1 className="auth-title">{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
          <p className="auth-subtitle">
            {step === 1 ? 'Join the GC Assist community' : 'Enter the 6-digit code sent to your Gmail'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {msg && <div className="auth-error" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }}>{msg}</div>}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="step1"
              className="auth-form" 
              onSubmit={handleSignup}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
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
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Use your @gmail.com or @gordoncollege.edu.ph
                </span>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="auth-input" 
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="Create password"
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

              <div className="auth-input-group">
                <label className="auth-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
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
                    <UserPlus size={20} />
                    Continue
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              className="auth-form" 
              onSubmit={handleVerify}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="auth-input-group">
                <label className="auth-label">Verification Code</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    className="auth-input" 
                    style={{ paddingLeft: '2.75rem', textAlign: 'center', letterSpacing: '0.2rem', fontWeight: 'bold' }}
                    placeholder="Enter Code"
                    maxLength={10}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? <Loader2 className="spin" size={20} /> : 'Verify Account'}
              </button>

              <button 
                type="button" 
                className="auth-link" 
                onClick={handleResend} 
                disabled={loading}
                style={{ fontSize: '0.875rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Resend Code
              </button>

              <button 
                type="button" 
                className="auth-footer" 
                onClick={() => setStep(1)}
                style={{ cursor: 'pointer', border: 'none', background: 'none', width: '100%' }}
              >
                Use a different email
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </div>
      </motion.div>
    </div>
  )
}
