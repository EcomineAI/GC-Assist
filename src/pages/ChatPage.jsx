import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, ThumbsUp, ThumbsDown, Copy, Check, ChevronDown, ChevronUp, Zap, AlertTriangle, Plus, History, X, Clock, ArrowLeft, MessageSquare, Brain, Search, Edit3, Square, Volume2, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useChat } from '../context/ChatContext'
import { useSettings } from '../context/SettingsContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Tooltip from '../components/Tooltip'

const ALL_SUGGESTIONS = [
  'Enrollment requirements',
  'Academic calendar',
  'What courses are offered?',
  'Where is the library located?',
  'How do I pay tuition?',
  'Student organizations on campus',
  'Gordon College mission & vision',
]

const LOADING_PHASES = {
  searching: {
    icon: <Search size={18} />,
    label: 'Searching knowledge base',
    sublabel: 'Finding relevant GC information...',
  },
  analyzing: {
    icon: <Brain size={18} />,
    label: 'Analyzing context',
    sublabel: 'Reading through sources...',
  },
  typing: {
    icon: <Edit3 size={18} />,
    label: 'Typing response',
    sublabel: 'Generating answer...',
  },
}

// ─── Sub-components ───────────────────────────────────────────

function HistoryPanel({ isOpen, onClose, sessions, activeId, onSelect }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="history-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="history-popup"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="history-header">
              <h2>Chat History</h2>
              <button className="history-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div className="history-list">
              {sessions.length === 0 ? (
                <div className="history-empty">
                  <MessageSquare size={32} />
                  <p>No past sessions yet.</p>
                </div>
              ) : (
                sessions.map(s => (
                  <button
                    key={s.id}
                    className={`history-item ${activeId === s.id ? 'active' : ''}`}
                    onClick={() => { onSelect(s.id); onClose() }}
                  >
                    <span className="history-item-title">{s.title}</span>
                    <span className="history-item-date">
                      {new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TokenBar({ pct, warning, blocked, tokens, max, showAdvanced }) {
  if (tokens === 0) return null
  if (!showAdvanced && !warning && !blocked) return null
  return (
    <motion.div
      className={`token-bar-wrap ${warning ? 'token-bar-warn' : ''} ${blocked ? 'token-bar-blocked' : ''}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="token-bar-info">
        {blocked ? (
          <><AlertTriangle size={13} /> Session limit reached — clear chat to continue</>
        ) : warning ? (
          <><AlertTriangle size={13} /> Approaching session limit ({tokens.toLocaleString()} / {max.toLocaleString()} tokens)</>
        ) : (
          <><Zap size={13} /> {tokens.toLocaleString()} / {max.toLocaleString()} tokens used</>
        )}
      </div>
      {showAdvanced && (
        <div className="token-bar-track">
          <motion.div
            className="token-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}
    </motion.div>
  )
}

function ThinkingBlock({ thinking }) {
  const [open, setOpen] = useState(false)
  if (!thinking) return null
  return (
    <div className="thinking-block">
      <button className="thinking-toggle" onClick={() => setOpen(o => !o)}>
        <span className="thinking-icon"><Brain size={14} /></span>
        <span>Model reasoning</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="thinking-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <pre>{thinking}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SourceBadges({ sources, onLinkClick }) {
  if (!sources || sources.length === 0) return null
  const visible = sources.filter(s => s.label && s.label.length > 1).slice(0, 4)
  if (visible.length === 0) return null
  return (
    <div className="source-badges">
      <span className="source-badges-label">Sources</span>
      {visible.map((s, i) => {
        let url = s.url || s.source
        const isGCDomain = url && url.includes('gordoncollege.edu.ph')
        
        // Ensure protocol for GC links
        if (isGCDomain && !url.startsWith('http')) {
          url = 'https://' + url
        }

        const isLink = url && (url.startsWith('http://') || url.startsWith('https://'))
        const displayLabel = s.label || s.source || 'GC Website'
        const cleanLabel = displayLabel
          .replace(/https?:\/\/gordoncollege\.edu\.ph\/w3\//gi, '')
          .replace(/gordoncollege\.edu\.ph\/w3\//gi, '')
          .replace(/\//g, ' › ')
          .replace(/-/g, ' ')
          .trim() || 'GC Website'
          
        return isLink ? (
          <button
            key={i}
            onClick={() => onLinkClick(url)}
            className="source-badge"
            style={{ cursor: 'pointer', border: 'none', background: 'var(--color-primary-light)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 500 }}
          >
            {cleanLabel}
          </button>
        ) : (
          <span key={i} className="source-badge source-badge--local">
            {cleanLabel}
          </span>
        )
      })}
    </div>
  )
}

function ExternalLinkModal({ url, onConfirm, onCancel }) {
  if (!url) return null
  return (
    <motion.div 
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div 
        className="sheet"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '400px', margin: '0 auto' }}
      >
        <div className="sheet-handle" />
        <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExternalLink size={20} />
          External Link
        </div>
        <div className="sheet-body" style={{ fontSize: '14px', lineHeight: '1.5' }}>
          You are about to visit an external website:<br />
          <strong style={{ color: 'var(--color-primary)', wordBreak: 'break-all' }}>{url}</strong>
          <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)' }}>
            This will open the official Gordon College website in a new tab.
          </p>
        </div>
        <div className="sheet-actions" style={{ marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>Go to Website</button>
        </div>
      </motion.div>
    </motion.div>
  )
}



function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <Tooltip text={copied ? "Copied!" : "Copy response"}>
      <button className="msg-action-btn" onClick={handleCopy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </Tooltip>
  )
}

function VoiceVisualizer({ isPlaying }) {
  const { reducedMotion } = useSettings()
  const isAnimate = isPlaying && !reducedMotion
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '2px', 
      height: '14px',
      padding: '0 2px'
    }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            width: '2.5px',
            background: isPlaying ? '#22c55e' : 'currentColor',
            borderRadius: '1px',
            boxShadow: isPlaying ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none'
          }}
          animate={isAnimate ? {
            height: ['4px', '14px', '7px', '12px', '4px'],
          } : {
            height: isPlaying ? '14px' : '4px'
          }}
          transition={isAnimate ? {
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          } : { duration: 0.2 }}
        />
      ))}
    </div>
  )
}

function TTSButton({ text }) {
  const { ttsVoice, ttsRate, ttsPitch } = useSettings()
  const [isPlaying, setIsPlaying] = useState(false)

  const handleTogglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    // Clean markdown before speaking
    const cleanText = text
      .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove link URLs, keep text
      .replace(/[*_~`#]/g, '') // remove basic markdown formatting
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    // Choose voice based on ttsVoice setting
    const allVoices = window.speechSynthesis.getVoices()
    const englishVoices = allVoices.filter(v => v.lang.startsWith('en'))
    const voices = englishVoices.length > 0 ? englishVoices : allVoices
    
    let selectedVoice = null
    const qualityKeywords = ['google', 'natural', 'online', 'premium', 'enhanced', 'neural']
    
    if (ttsVoice === 'boy') {
      const boyVoices = voices.filter(v => v.name.toLowerCase().match(/(david|male|guy|mark|george|ryan|andrew|brian|james|thomas|guy)/))
      selectedVoice = boyVoices.find(v => qualityKeywords.some(k => v.name.toLowerCase().includes(k))) || boyVoices[0]
    } else {
      const girlVoices = voices.filter(v => v.name.toLowerCase().match(/(zira|female|girl|samantha|jenny|hazel|aria|karen|linda|heather|sara)/))
      selectedVoice = girlVoices.find(v => qualityKeywords.some(k => v.name.toLowerCase().includes(k))) || girlVoices[0]
    }
    
    // Fallback if no specific gendered voice found
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0]
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
    }
    
    utterance.rate = ttsRate; 
    utterance.pitch = ttsPitch; 
    utterance.volume = 0.9; 
    
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }

  useEffect(() => {
    return () => {
      if (isPlaying) window.speechSynthesis.cancel()
    }
  }, [isPlaying])

  return (
    <Tooltip text={isPlaying ? "Stop reading" : "Read aloud"}>
      <button 
        className={`msg-action-btn ${isPlaying ? 'active-up' : ''}`} 
        onClick={handleTogglePlay} 
        style={{ 
          position: 'relative', 
          overflow: 'hidden',
          background: isPlaying ? 'rgba(34, 197, 94, 0.1)' : '',
          borderColor: isPlaying ? 'rgba(34, 197, 94, 0.3)' : ''
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isPlaying ? 'playing' : 'idle'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isPlaying ? <VoiceVisualizer isPlaying={isPlaying} /> : <Volume2 size={14} />}
          </motion.div>
        </AnimatePresence>
      </button>
    </Tooltip>
  )
}

function FeedbackButtons({ msgId, feedback, setFeedback, disabled, user, navigate, messages }) {
  const handleFeedback = async (type) => {
    if (disabled) return
    if (!user) {
      navigate('/login')
      return
    }
    
    const isLike = type === 'up'
    const currentFeedback = feedback === type ? null : type
    setFeedback(msgId, currentFeedback)

    if (currentFeedback) {
      try {
        // Find the AI message and the User message before it
        const msgIndex = messages.findIndex(m => m.id === msgId)
        if (msgIndex > 0) {
          const aiMsg = messages[msgIndex]
          const userMsg = messages[msgIndex - 1]
          
          await supabase.from('feedback').upsert({
            user_id: user.id,
            user_question: userMsg.content,
            ai_response: aiMsg.content,
            is_like: isLike
          }, { 
            onConflict: 'user_id,user_question,ai_response' 
          })
        }
      } catch (err) {
        console.error('Failed to save feedback to DB:', err)
      }
    }
  }

  return (
    <div className="msg-feedback">
      <button
        className={`msg-action-btn ${feedback === 'up' ? 'active-up' : ''}`}
        onClick={() => handleFeedback('up')}
        title="Good response"
        disabled={disabled}
      >
        <ThumbsUp size={14} />
      </button>
      <button
        className={`msg-action-btn ${feedback === 'down' ? 'active-down' : ''}`}
        onClick={() => handleFeedback('down')}
        title="Bad response"
        disabled={disabled}
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  )
}

function LoadingIndicator({ phase }) {
  const info = LOADING_PHASES[phase] || LOADING_PHASES.searching
  return (
    <div className="loading-indicator">
      <motion.span
        className="loading-icon"
        key={phase}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {info.icon}
      </motion.span>
      <div className="loading-text">
        <motion.span
          className="loading-label"
          key={`label-${phase}`}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          {info.label}
        </motion.span>
        <span className="loading-sublabel">{info.sublabel}</span>
      </div>
      <div className="loading-dots">
        <span /><span /><span />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function ChatPage() {
  const {
    messages, isLoading, loadingPhase, activeProvider, activeModel,
    sessionTokens, maxSessionTokens, tokenPct, tokenWarning, tokenBlocked,
    sessionsHistory, viewingHistoryId, kbTimestamp,
    sendMessage, setFeedback, startNewSession, viewHistory, resumeCurrentSession, stopGeneration
  } = useChat()

  const { showAdvanced } = useSettings()

  const { isDark, colorTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const getLogo = () => {
    if (isDark) return '/logo.png'
    if (colorTheme === 'green') return '/greenlogo.png'
    if (colorTheme === 'blue') return '/bluelogo.png'
    return '/logo.png'
  }
  const logoPath = getLogo()

  const [input, setInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [pendingLink, setPendingLink] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const handleLinkConfirm = () => {
    if (pendingLink) {
      window.open(pendingLink, '_blank', 'noopener,noreferrer')
      setPendingLink(null)
    }
  }
  const [heroSuggestions, setHeroSuggestions] = useState([])

  // Randomize hero chips on mount
  useEffect(() => {
    const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random())
    setHeroSuggestions(shuffled.slice(0, 4))
  }, [])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const location = useLocation()
  const handledPrefillRef = useRef(null)

  const viewingSession = viewingHistoryId ? sessionsHistory.find(s => s.id === viewingHistoryId) : null
  const activeMessages = viewingSession ? viewingSession.messages : messages
  const hasMessages = activeMessages.length > 0
  const isHistoryMode = !!viewingSession

  useEffect(() => {
    if (location.state?.prefill && !isHistoryMode && handledPrefillRef.current !== location.key) {
      handledPrefillRef.current = location.key
      sendMessage(location.state.prefill)
      window.history.replaceState({}, '')
    }
  }, [location.state, location.key, isHistoryMode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages, isLoading])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading || tokenBlocked || isHistoryMode) return
    sendMessage(trimmed)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-page">
      {/* Top Bar */}
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>
        <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logoPath} alt="GC" className="top-bar-logo" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="top-bar-title">GC Assist</span>
            <div className="top-bar-info-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 500, opacity: 0.8 }}>
              <span className="version-pill" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '1px 5px', borderRadius: '4px', scale: '0.9', transformOrigin: 'left' }}>v1.41.1</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="Knowledge Base last updated">
                <Clock size={10} />
                {(kbTimestamp || currentTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {(kbTimestamp || currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <div className="top-bar-actions">
          {!isHistoryMode && messages.length > 0 && (
            <Tooltip text="Start a fresh conversation">
              <button className="top-action-btn new-chat-btn" onClick={startNewSession}>
                <Plus size={18} />
                <span className="hide-mobile">New Chat</span>
              </button>
            </Tooltip>
          )}
          <Tooltip text="Browse previous chat sessions">
            <button className="top-action-btn" onClick={() => setShowHistory(true)}>
              <History size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Info Banner: either Token Bar or History Mode Warning */}
      {isHistoryMode ? (
        <div className="history-banner">
          <Clock size={14} />
          Viewing Past Session: {viewingSession.title}
        </div>
      ) : (
        <TokenBar
          pct={tokenPct}
          warning={tokenWarning}
          blocked={tokenBlocked}
          tokens={sessionTokens}
          max={maxSessionTokens}
          showAdvanced={showAdvanced}
        />
      )}

      {/* Hero */}
      <AnimatePresence>
        {!hasMessages && !isHistoryMode && (
          <motion.div
            className="chat-hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
             transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <img src={logoPath} alt="GC Assist" className="chat-hero-logo" />
            <h1 className="chat-hero-heading">What can I help you with?</h1>
            <p className="chat-hero-sub">Your AI-powered campus assistant</p>
            <div className="chat-hero-chips">
              {heroSuggestions.map((text) => (
                <motion.button
                  key={text}
                  className="chip"
                  onClick={() => sendMessage(text)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      {hasMessages && (
        <div className="chat-messages">
          {activeMessages.map((msg, i) => (
            <motion.div
              key={msg.id}
              className={`message message--${msg.role === 'user' ? 'user' : 'ai'} ${isHistoryMode ? 'history-message' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i === activeMessages.length - 1 ? 0.05 : 0 }}
            >
              {msg.role === 'assistant' && (
                <img src={logoPath} alt="GC" className="message-avatar-img" />
              )}

              <div className="message-ai-wrap">
                {/* Thinking block */}
                {msg.role === 'assistant' && <ThinkingBlock thinking={msg.thinking} />}

                {/* Bubble */}
                <div className="message-bubble">
                  {msg.role === 'assistant' ? (
                    <div className="markdown-content">
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => {
                            let href = props.href
                            if (href && !href.startsWith('http')) {
                              href = 'https://' + href.replace(/^\/+/, '')
                            }
                            return (
                              <a 
                                {...props} 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault()
                                  setPendingLink(href)
                                }}
                              >
                                {props.children}
                              </a>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* AI message footer */}
                {msg.role === 'assistant' && (
                  <div className="msg-footer-section" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="msg-footer">
                      <SourceBadges sources={msg.sources} onLinkClick={setPendingLink} />
                      <div className="msg-actions">
                        {showAdvanced && msg.tokensUsed > 0 && (
                          <span className="msg-tokens">{msg.tokensUsed} tokens</span>
                        )}
                        <TTSButton text={msg.content} />
                        <CopyButton text={msg.content} />
                        <FeedbackButtons
                           msgId={msg.id}
                           feedback={msg.feedback}
                           setFeedback={setFeedback}
                           disabled={isHistoryMode}
                           user={user}
                           navigate={navigate}
                           messages={activeMessages}
                         />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          <AnimatePresence>
            {isLoading && !isHistoryMode && (activeMessages.length === 0 || activeMessages[activeMessages.length - 1].role !== 'assistant') && (
              <motion.div
                className="message message--ai"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <img src={logoPath} alt="GC" className="message-avatar-img" />
                <div className="message-ai-wrap">
                  <div className="message-bubble loading-bubble">
                    <LoadingIndicator phase={loadingPhase} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Bar or Resume Action */}
      {isHistoryMode ? (
        <div className="history-resume-bar">
          <button className="resume-current-btn" onClick={resumeCurrentSession}>
            <ArrowLeft size={16} />
            Back to Active Chat
          </button>
        </div>
      ) : (
        <div className={`chat-input-bar ${tokenBlocked ? 'has-limit' : ''}`}>
          {tokenBlocked && (
            <div className="token-blocked-msg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} />
                Session limit reached.
              </span>
              <button
                onClick={startNewSession}
                className="btn btn-primary"
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  minHeight: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} /> New Chat
              </button>
            </div>
          )}
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              className="chat-input"
              placeholder={tokenBlocked ? 'Session limit reached...' : 'Ask anything about Gordon College...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              disabled={tokenBlocked}
            />
            <Tooltip text={isLoading ? "Cancel generation" : "Send message (Enter)"}>
              <button
                id="chat-send"
                className={`chat-send-btn ${isLoading ? 'generating' : ''}`}
                onClick={isLoading ? stopGeneration : handleSend}
                disabled={(!input.trim() && !isLoading) || tokenBlocked}
                aria-label={isLoading ? "Cancel generation" : "Send message"}
              >
                {isLoading ? <Square size={14} fill="currentColor" /> : <ArrowUp />}
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Side Panel for History */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        sessions={sessionsHistory}
        activeId={viewingHistoryId}
        onSelect={viewHistory}
      />

      <AnimatePresence>
        {pendingLink && (
          <ExternalLinkModal 
            url={pendingLink} 
            onConfirm={handleLinkConfirm} 
            onCancel={() => setPendingLink(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
