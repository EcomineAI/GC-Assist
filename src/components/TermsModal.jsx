import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Info, Check, LogIn, ChevronDown } from 'lucide-react'

export default function TermsModal({ onAccept, onClose, viewOnly = false }) {
  const [checked, setChecked] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = useRef(null)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
      setScrollProgress(progress)

      // If within 20px of bottom, consider it scrolled
      if (scrollHeight - scrollTop <= clientHeight + 30) {
        setHasScrolledToBottom(true)
      }
    }
  }

  // Initial check if content is small enough that it doesn't need scrolling
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current
      if (scrollHeight <= clientHeight) {
        setHasScrolledToBottom(true)
        setScrollProgress(100)
      }
    }
  }, [])

  return (
    <motion.div 
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
    >
      <motion.div 
        className="sheet"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 250 }}
        style={{ 
          maxWidth: '500px', 
          margin: '0 auto', 
          padding: '24px', 
          borderRadius: '32px 32px 0 0',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="sheet-handle" style={{ width: '40px', height: '5px', borderRadius: '10px', background: 'var(--color-separator)', margin: '-8px auto 20px' }} />

        <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '14px', 
            background: 'var(--color-primary-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 20px var(--color-primary-glow)'
          }}>
            <ShieldCheck size={26} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800 }}>Terms of Service</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', letterSpacing: '0.02em' }}>VERSION 1.4 — UPDATED MAY 2026</span>
          </div>
        </div>

        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          <div className="scroll-progress-container">
            <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
          </div>

          <div 
            className="sheet-body custom-scrollbar" 
            ref={scrollRef}
            onScroll={handleScroll}
            style={{ 
              maxHeight: '40vh', 
              overflowY: 'auto', 
              fontSize: '14px', 
              color: 'var(--text-1)', 
              lineHeight: '1.7', 
              padding: '16px',
              scrollBehavior: 'smooth'
            }}
          >
            <p style={{ marginTop: 0 }}>Welcome to <strong>GC Assist</strong>. By using this service, you agree to our approach to data privacy and service quality.</p>
            
            <div style={{ background: 'var(--color-primary-light)', padding: '16px', borderRadius: '16px', margin: '20px 0', border: '1px solid var(--color-primary-border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
                <LogIn size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Become a Feedbacker
                </p>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-1)', opacity: 0.85, position: 'relative', zIndex: 1 }}>
                Help us build a better campus AI. Logged-in users can participate in our feedback program to earn exclusive community badges.
              </p>
              <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                <ShieldCheck size={80} color="var(--color-primary)" />
              </div>
            </div>

            <h4 style={{ margin: '24px 0 10px', fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>1. Anonymized Data</h4>
            <p>To improve accuracy, we collect anonymized logs of AI interactions. This data contains no personal identifiers and is used solely for system refinement and research purposes.</p>

            <h4 style={{ margin: '24px 0 10px', fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>2. Local-First Processing</h4>
            <p>Your privacy is our priority. Whenever possible, chat processing happens locally on your machine or via secured, encrypted tunnels to your dedicated LM Studio instance.</p>

            <h4 style={{ margin: '24px 0 10px', fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>3. User Conduct</h4>
            <p>Please use this tool responsibly for campus information. Automated scraping or malicious use of the API is strictly prohibited.</p>
            
            <div style={{ height: '40px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-2)', textAlign: 'center', opacity: 0.6 }}>
              You have reached the end of the policy.
            </p>
          </div>

          {!hasScrolledToBottom && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ 
                position: 'absolute', 
                bottom: '12px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                background: 'var(--color-primary)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              Scroll to continue <ChevronDown size={12} />
            </motion.div>
          )}
        </div>

        <div className="sheet-actions" style={{ marginTop: '24px' }}>
          {!viewOnly ? (
            <AnimatePresence mode="wait">
              {hasScrolledToBottom ? (
                <motion.div
                  key="accept-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, type: 'spring' }}
                >
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      cursor: 'pointer',
                      marginBottom: '20px',
                      userSelect: 'none',
                      padding: '12px',
                      borderRadius: '16px',
                      background: checked ? 'var(--color-primary-light)' : 'transparent',
                      border: `1px solid ${checked ? 'var(--color-primary-border)' : 'transparent'}`,
                      transition: 'all 0.3s'
                    }}
                  >
                    <div 
                      onClick={(e) => { e.preventDefault(); setChecked(!checked); }}
                      style={{
                        width: '24px',
                        height: '24px',
                        flexShrink: 0,
                        borderRadius: '8px',
                        border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: checked ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {checked && <Check size={14} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '13px', color: checked ? 'var(--color-primary)' : 'var(--text-2)', fontWeight: 600 }}>
                      I agree to the terms and data collection
                    </span>
                  </label>

                  <button 
                    className="btn btn-primary" 
                    onClick={onAccept}
                    disabled={!checked}
                    style={{ 
                      width: '100%', 
                      padding: '18px', 
                      borderRadius: '18px',
                      fontWeight: 800,
                      fontSize: '16px',
                      boxShadow: checked ? '0 12px 28px var(--color-primary-glow)' : 'none',
                      transform: checked ? 'scale(1)' : 'scale(0.98)',
                      transition: 'all 0.3s'
                    }}
                  >
                    Accept and Continue
                  </button>
                </motion.div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '14px', padding: '16px 0', fontWeight: 500, opacity: 0.7 }}>
                  Please read the terms to proceed
                </div>
              )}
            </AnimatePresence>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={onClose}
              style={{ width: '100%', padding: '18px', borderRadius: '18px', fontWeight: 800 }}
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
