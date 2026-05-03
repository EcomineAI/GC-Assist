import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useSettings } from '../context/SettingsContext'
import { useChat } from '../context/ChatContext'
import Tooltip from '../components/Tooltip'

export default function SettingsPage() {
  const { isDark, toggleTheme, colorTheme, setColorTheme } = useTheme()
  const { clearMessages, activeProvider, activeModel } = useChat()
  const { 
    ttsVoice, setTtsVoice, 
    ttsRate, setTtsRate, 
    ttsPitch, setTtsPitch,
    fontSize, setFontSize,
    highContrast, setHighContrast,
    reducedMotion, setReducedMotion
  } = useSettings()

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showAuthorInfo, setShowAuthorInfo] = useState(false)
  const [showVoiceSheet, setShowVoiceSheet] = useState(false)

  const handleClear = () => {
    clearMessages()
    setShowClearConfirm(false)
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* — Appearance — */}
      <div className="settings-section">
        <div className="settings-section-title">Appearance</div>
        <div className="settings-group">
          <Tooltip text="Switch between Light and Dark mode" position="bottom" fullWidth={true}>
            <div className="settings-row" onClick={toggleTheme}>
              <div className="settings-row-left">
                <div className="settings-row-label">Dark Mode</div>
                <div className="settings-row-sublabel">Switch to a darker interface</div>
              </div>
              <div className="settings-row-right">
                <button
                  id="toggle-dark-mode"
                  className={`toggle ${isDark ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleTheme() }}
                  aria-label="Toggle dark mode"
                >
                  <div className="toggle-knob" />
                </button>
              </div>
            </div>
          </Tooltip>

          {!isDark && (
            <Tooltip text="Change the app accent color" position="bottom" fullWidth={true}>
              <div className="settings-row" style={{ cursor: 'default' }}>
                <div className="settings-row-left">
                  <div className="settings-row-label">Theme Color</div>
                  <div className="settings-row-sublabel">Personalize your accent color</div>
                </div>
                <div className="settings-row-right" style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { id: 'purple', color: '#7C3AED' },
                    { id: 'green', color: '#10B981' },
                    { id: 'blue', color: '#3B82F6' }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setColorTheme(theme.id)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: theme.color,
                        border: colorTheme === theme.id ? '2px solid var(--color-text)' : '2px solid transparent',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        transform: colorTheme === theme.id ? 'scale(1.15)' : 'scale(1)'
                      }}
                      aria-label={`Select ${theme.id} theme`}
                    />
                  ))}
                </div>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* — AI Model — */}
      <div className="settings-section">
        <div className="settings-section-title">AI Model</div>
        <div className="settings-group">
          <Tooltip text="Current AI intelligence provider" position="bottom" fullWidth={true}>
            <div className="settings-row" style={{ cursor: 'default' }}>
              <div className="settings-row-left">
                <div className="settings-row-label">Language Model</div>
                <div className="settings-row-sublabel">
                  {activeProvider === 'Groq API' ? `(${activeModel})` : '(Local)'}
                </div>
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* — Voice Assistant — */}
      <div className="settings-section">
        <div className="settings-section-title">Voice Assistant</div>
        <div className="settings-group">
          <Tooltip text="Change the gender of the AI voice" position="bottom" fullWidth={true}>
            <div className="settings-row" onClick={() => setShowVoiceSheet(true)} style={{ cursor: 'pointer' }}>
              <div className="settings-row-left">
                <div className="settings-row-label">Voice Tone</div>
                <div className="settings-row-sublabel">Select the TTS voice gender</div>
              </div>
              <div className="settings-row-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-2)', fontSize: '14px' }}>
                <span style={{ textTransform: 'capitalize' }}>{ttsVoice === 'boy' ? 'Boy (Default)' : 'Girl'}</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </Tooltip>

          <Tooltip text="Adjust how fast the AI speaks" position="bottom" fullWidth={true}>
            <div className="settings-row" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="settings-row-label">Speech Speed</div>
                <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>{ttsRate}x</div>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="3.0" 
                step="0.1" 
                value={ttsRate} 
                onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>
          </Tooltip>

          <Tooltip text="Adjust the tone and depth of the voice" position="bottom" fullWidth={true}>
            <div className="settings-row" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="settings-row-label">Voice Pitch</div>
                <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>{ttsPitch}</div>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.05" 
                value={ttsPitch} 
                onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* — Accessibility — */}
      <div className="settings-section">
        <div className="settings-section-title">Accessibility</div>
        <div className="settings-group">
          <div className="settings-row" onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'normal')} style={{ cursor: 'pointer' }} title="Increase text size for better readability">
            <div className="settings-row-left">
              <div className="settings-row-label">Text Size</div>
              <div className="settings-row-sublabel">Switch to larger text</div>
            </div>
            <div className="settings-row-right">
              <div style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{fontSize}</div>
            </div>
          </div>

          <div className="settings-row" onClick={() => setHighContrast(!highContrast)} style={{ cursor: 'pointer' }} title="Enhance colors and borders for better visibility">
            <div className="settings-row-left">
              <div className="settings-row-label">High Contrast</div>
              <div className="settings-row-sublabel">Improve color visibility</div>
            </div>
            <div className="settings-row-right">
              <button className={`toggle ${highContrast ? 'active' : ''}`} aria-label="Toggle high contrast">
                <div className="toggle-knob" />
              </button>
            </div>
          </div>

          <div className="settings-row" onClick={() => setReducedMotion(!reducedMotion)} style={{ cursor: 'pointer' }} title="Disable animations for a more stable experience">
            <div className="settings-row-left">
              <div className="settings-row-label">Reduced Motion</div>
              <div className="settings-row-sublabel">Minimize interface animations</div>
            </div>
            <div className="settings-row-right">
              <button className={`toggle ${reducedMotion ? 'active' : ''}`} aria-label="Toggle reduced motion">
                <div className="toggle-knob" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* — App Info — */}
      <div className="settings-section">
        <div className="settings-section-title">App Info</div>
        <div className="settings-group">
          <div className="settings-row" style={{ cursor: 'default' }}>
            <div className="settings-row-left">
              <div className="settings-row-label">GC Assist v1.0.10</div>
            </div>
          </div>
          <div className="settings-row" onClick={() => setShowAuthorInfo(true)} style={{ cursor: 'pointer' }} title="Learn more about the developer">
            <div className="settings-row-left">
              <div className="settings-row-label">Built by EcomineAi (Abello)</div>
              <div className="settings-row-sublabel">June Vic M. Abello</div>
            </div>
            <div className="settings-row-right">
              <ChevronRight />
            </div>
          </div>
          <div className="settings-row" style={{ cursor: 'default' }}>
            <div className="settings-row-left">
              <div className="settings-row-label">Gordon College, Olongapo City</div>
            </div>
          </div>
          <div className="settings-row" onClick={() => setShowFeedback(true)} title="Tell us what you think!">
            <div className="settings-row-left">
              <div className="settings-row-label">Send Feedback</div>
              <div className="settings-row-sublabel">Report bugs or suggest improvements</div>
            </div>
            <div className="settings-row-right">
              <ChevronRight />
            </div>
          </div>
        </div>
      </div>

      {/* — Data & Privacy — */}
      <div className="settings-section">
        <div className="settings-section-title">Data & Privacy</div>
        <div className="settings-group">
          <Tooltip text="Warning: This will delete all your chats" position="top" fullWidth={true}>
            <div className="settings-row settings-row--danger" onClick={() => setShowClearConfirm(true)}>
              <div className="settings-row-left">
                <div className="settings-row-label">Clear Chat History</div>
                <div className="settings-row-sublabel">Delete all conversations</div>
              </div>
            </div>
          </Tooltip>
          <Tooltip text="Reset all settings to factory defaults" position="top" fullWidth={true}>
            <div className="settings-row" onClick={() => { localStorage.clear(); window.location.reload(); }}>
              <div className="settings-row-left">
                <div className="settings-row-label">Reset All Settings</div>
                <div className="settings-row-sublabel">Wipe cache and restore defaults</div>
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* ===== MODALS / SHEETS ===== */}

      {/* Voice Selection Sheet */}
      <AnimatePresence>
        {showVoiceSheet && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVoiceSheet(false)}
          >
            <motion.div
              className="sheet"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="sheet-title">Voice Tone</div>
              <div className="sheet-body">
                Select the voice for the text-to-speech assistant.
              </div>
              <div className="sheet-actions" style={{ flexDirection: 'column' }}>
                <button
                  className={`btn ${ttsVoice === 'boy' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setTtsVoice('boy'); setShowVoiceSheet(false) }}
                >
                  Boy (Default)
                </button>
                <button
                  className={`btn ${ttsVoice === 'girl' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setTtsVoice('girl'); setShowVoiceSheet(false) }}
                >
                  Girl
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Confirm */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              className="sheet"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="sheet-title">Clear all conversations?</div>
              <div className="sheet-body">
                This can't be undone. All your chat messages will be permanently deleted.
              </div>
              <div className="sheet-actions">
                <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleClear}>Clear</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Sheet */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              className="sheet"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="sheet-title">Send Feedback</div>
              <div className="sheet-body">
                Have a suggestion or found a bug? Reach out to the school admin in GC
              </div>
              <div className="sheet-actions" style={{ flexDirection: 'column' }}>
                <a href="https://github.com/EcomineAI" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                  <ExternalLink size={16} /> Open GitHub
                </a>
                <button className="btn btn-secondary" onClick={() => setShowFeedback(false)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Author Info Sheet */}
      <AnimatePresence>
        {showAuthorInfo && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthorInfo(false)}
          >
            <motion.div
              className="sheet"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="sheet-title">About the Creator</div>
              <div className="sheet-body">
                This system was built by June Vic M. Abello (EcomineAI). Check out more projects on GitHub!
              </div>
              <div className="sheet-actions" style={{ flexDirection: 'column' }}>
                <a href="https://github.com/EcomineAI" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                  <ExternalLink size={16} /> Visit GitHub Profile
                </a>
                <button className="btn btn-secondary" onClick={() => setShowAuthorInfo(false)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
