import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Info, Check, LogIn } from 'lucide-react'

export default function TermsModal({ onAccept, onClose, viewOnly = false }) {
  const [checked, setChecked] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollRef = useRef(null)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      // If within 20px of bottom, consider it scrolled
      if (scrollHeight - scrollTop <= clientHeight + 20) {
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
      }
    }
  }, [])

  return (
    <motion.div 
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div 
        className="sheet"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ maxWidth: '500px', margin: '0 auto', padding: '24px', borderRadius: '24px 24px 0 0' }}
      >
        <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'var(--color-primary-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <ShieldCheck size={24} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Terms & Data Usage</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Last updated: May 2026</span>
          </div>
        </div>
        
        <div 
          className="sheet-body custom-scrollbar" 
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ 
            maxHeight: '45vh', 
            overflowY: 'auto', 
            fontSize: '14px', 
            color: 'var(--text-1)', 
            lineHeight: '1.6', 
            paddingRight: '8px',
            marginBottom: '16px'
          }}
        >
          <p>Welcome to <strong>GC Assist</strong>. Before you continue, please review our terms regarding your interaction and data usage.</p>
          
          <div style={{ background: 'var(--color-primary-light)', padding: '16px', borderRadius: '16px', margin: '16px 0', border: '1px solid var(--color-primary-faint)' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              <LogIn size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>
                Become a Feedbacker!
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-1)', opacity: 0.8 }}>
              To help us build the best campus AI, we encourage you to log in. Registered users can submit direct feedback and help refine the system's accuracy.
            </p>
          </div>

          <h4 style={{ margin: '20px 0 8px', fontSize: '15px', fontWeight: 700 }}>1. Data Collection</h4>
          <p>We may collect anonymized conversation logs, model performance metrics, and general usage patterns. We do NOT collect personally identifiable information unless explicitly shared by you in the chat.</p>

          <h4 style={{ margin: '20px 0 8px', fontSize: '15px', fontWeight: 700 }}>2. Use of Information</h4>
          <p>The collected data is used exclusively to fine-tune our AI models, fix bugs, and enhance the overall campus information experience for all students.</p>

          <h4 style={{ margin: '20px 0 8px', fontSize: '15px', fontWeight: 700 }}>3. Privacy First</h4>
          <p>Your chat history is stored locally on your device unless you choose to share it. We prioritize local processing (LM Studio) whenever possible to keep your data under your control.</p>
          
          <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-2)', textAlign: 'center', opacity: 0.7 }}>
            --- End of Document ---
          </p>
        </div>

        <div className="sheet-actions" style={{ borderTop: '1px solid var(--color-separator)', paddingTop: '16px' }}>
          {!viewOnly ? (
            <AnimatePresence>
              {hasScrolledToBottom ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label 
                    className="checkbox-container"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      cursor: 'pointer',
                      marginBottom: '20px',
                      userSelect: 'none'
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
                    <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>
                      I agree to the terms and data collection policy
                    </span>
                  </label>

                  <button 
                    className="btn btn-primary" 
                    onClick={onAccept}
                    disabled={!checked}
                    style={{ 
                      width: '100%', 
                      padding: '16px', 
                      borderRadius: '16px',
                      fontWeight: 700,
                      fontSize: '16px',
                      boxShadow: checked ? '0 8px 24px var(--color-primary-faint)' : 'none',
                      transition: 'all 0.3s'
                    }}
                  >
                    Accept and Continue
                  </button>
                </motion.div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '13px', padding: '10px 0' }}>
                  Please scroll to the bottom to accept
                </div>
              )}
            </AnimatePresence>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={onClose}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 700 }}
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
