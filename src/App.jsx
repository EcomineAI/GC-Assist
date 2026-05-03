import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation, Link, useNavigate, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  MessageCircle, LayoutGrid, SlidersHorizontal, Zap, 
  User, LogOut, History, X, Smile, Ghost, Cat, Dog, 
  Bird, Rocket, Star, Coffee, Moon, Sun, ChevronRight, Heart, Shield, FileText
} from 'lucide-react'
import ChatPage from './pages/ChatPage'
import ExplorePage from './pages/ExplorePage'
import SettingsPage from './pages/SettingsPage'
import { useChat } from './context/ChatContext'
import { useTheme } from './context/ThemeContext'
import { useSettings } from './context/SettingsContext'
import { useAuth } from './context/AuthContext'
import TermsModal from './components/TermsModal'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminPage from './pages/AdminPage'
import ChangelogPage from './pages/ChangelogPage'
import { supabase } from './lib/supabase'

const navItems = [
  { to: '/', label: 'Chat', icon: MessageCircle },
  { to: '/explore', label: 'Explore', icon: LayoutGrid },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal },
  { to: '/changelog', label: 'Updates', icon: FileText },
]

const AVATARS = [
  { id: 'smile', icon: Smile, color: '#FCD34D' },
  { id: 'ghost', icon: Ghost, color: '#94A3B8' },
  { id: 'cat', icon: Cat, color: '#FB923C' },
  { id: 'dog', icon: Dog, color: '#A8A29E' },
  { id: 'bird', icon: Bird, color: '#60A5FA' },
  { id: 'rocket', icon: Rocket, color: '#F87171' },
  { id: 'star', icon: Star, color: '#FDE047' },
  { id: 'coffee', icon: Coffee, color: '#78350F' },
  { id: 'moon', icon: Moon, color: '#818CF8' },
  { id: 'sun', icon: Sun, color: '#FBBF24' },
]

function FeedbackHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory()
    }
  }, [isOpen, user])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Failed to fetch feedback history:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="history-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 2000 }}
        >
          <motion.div 
            className="history-popup feedback-history-popup"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="history-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} />
                <h2>Feedback History</h2>
              </div>
              <button onClick={onClose} className="history-close-btn"><X size={20} /></button>
            </div>

            <div className="history-list">
              {loading ? (
                <div className="history-empty"><Loader2 className="spin" /></div>
              ) : history.length === 0 ? (
                <div className="history-empty">
                  <Heart size={32} opacity={0.3} />
                  <p>No feedback given yet.</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="history-item feedback-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="feedback-item-header">
                      <span className={`feedback-badge ${item.is_like ? 'like' : 'dislike'}`}>
                        {item.is_like ? 'Liked' : 'Disliked'}
                      </span>
                      <span className="history-item-date">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', borderLeft: '2px solid var(--color-primary)', paddingLeft: '8px' }}>
                      <strong>Q:</strong> {item.user_question}
                    </div>
                    
                    <div className="feedback-item-msg" style={{ fontSize: '13px' }}>
                      <strong>A:</strong> {item.ai_response.length > 150 ? item.ai_response.substring(0, 150) + '...' : item.ai_response}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Loader2({ className }) {
  return <Zap className={`spin ${className}`} size={24} />
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut, updateProfile } = useAuth()

  useEffect(() => {
    if (user && user.email.toLowerCase() === 'admin@gmail.com' && location.pathname === '/') {
      navigate('/admin')
    }
  }, [user, location.pathname, navigate])

  const { activeProvider, activeModel } = useChat()
  const { isDark, colorTheme } = useTheme()
  const { hasAcceptedTerms, setHasAcceptedTerms } = useSettings()

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false)

  const isGroq = activeProvider === 'Groq API'
  const badgeLabel = isGroq ? `(${activeModel})` : '(Local)'
  const badgeClass = `sidebar-footer-badge${isGroq ? ' sidebar-footer-badge--groq' : ''}`

  const getLogo = () => {
    if (isDark) return '/logo.png'
    if (colorTheme === 'green') return '/greenlogo.png'
    if (colorTheme === 'blue') return '/bluelogo.png'
    return '/logo.png'
  }

  const logoPath = getLogo()

  const handleAvatarSelect = async (avatarId) => {
    try {
      await updateProfile({ avatar: avatarId })
      setShowProfileMenu(false)
    } catch (err) {
      console.error('Failed to update avatar:', err)
    }
  }

  const userAvatarId = user?.user_metadata?.avatar || 'smile'
  const UserAvatarIcon = AVATARS.find(a => a.id === userAvatarId)?.icon || Smile
  const userAvatarColor = AVATARS.find(a => a.id === userAvatarId)?.color || 'var(--color-primary)'

  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname)

  return (
    <div className="app-shell">
      <AnimatePresence>
        {!hasAcceptedTerms && !isAuthPage && (
          <TermsModal onAccept={() => setHasAcceptedTerms(true)} />
        )}
      </AnimatePresence>

      <FeedbackHistoryModal 
        isOpen={showFeedbackHistory} 
        onClose={() => setShowFeedbackHistory(false)} 
      />

      {/* Profile Sidebar Item / Menu */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logoPath} alt="GC Assist" className="sidebar-logo-img" />
          <span className="sidebar-brand-text">GC Assist</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
          
          {/* Admin Panel Button (only for admin) */}
          {(user && user.email.toLowerCase() === 'admin@gmail.com') && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={{ color: 'var(--color-primary)' }}
            >
              <Shield size={20} />
              Admin Panel
            </NavLink>
          )}

          {/* Profile Section */}
          {user ? (
            <div className="sidebar-profile-section" style={{ marginTop: 'auto' }}>
              <button 
                className={`sidebar-link profile-trigger ${showProfileMenu ? 'active' : ''}`}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="user-avatar-small" style={{ backgroundColor: userAvatarColor }}>
                  <UserAvatarIcon size={16} color="#fff" />
                </div>
                <span className="sidebar-profile-name">
                  {user.email.split('@')[0]}
                </span>
                <ChevronRight size={14} className={`profile-chevron ${showProfileMenu ? 'open' : ''}`} />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    className="profile-menu-dropdown"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  >
                    <div className="profile-menu-header">Choose Avatar</div>
                    <div className="avatar-grid">
                      {AVATARS.map(a => (
                        <button 
                          key={a.id} 
                          className={`avatar-option ${userAvatarId === a.id ? 'selected' : ''}`}
                          onClick={() => handleAvatarSelect(a.id)}
                          style={{ color: a.color }}
                        >
                          <a.icon size={20} />
                        </button>
                      ))}
                    </div>
                    
                    <div className="profile-menu-divider" />
                    
                    <button className="profile-menu-item" onClick={() => { setShowFeedbackHistory(true); setShowProfileMenu(false); }}>
                      <History size={16} />
                      View Feedback History
                    </button>
                    
                    <button className="profile-menu-item logout-item" onClick={() => { localStorage.removeItem('isAdmin'); signOut(); }}>
                      <LogOut size={16} />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="sidebar-link"
              style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}
            >
              <User />
              Log in
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div>Gordon College, Olongapo City</div>
          <div className={badgeClass}>
            <Zap style={{ width: 12, height: 12 }} />
            {badgeLabel}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Routes location={location}>
              <Route path="/" element={<ChatPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
        {user ? (
          <button className="bottom-nav-item" onClick={() => setShowProfileMenu(true)}>
            <div className="user-avatar-small" style={{ backgroundColor: userAvatarColor, width: 24, height: 24 }}>
              <UserAvatarIcon size={14} color="#fff" />
            </div>
            <span>Profile</span>
          </button>
        ) : (
          <NavLink to="/login" className="bottom-nav-item">
            <User />
            <span>Login</span>
          </NavLink>
        )}
      </nav>
    </div>
  )
}
