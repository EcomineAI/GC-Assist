import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Info, Check } from 'lucide-react'

export default function TermsModal({ onAccept }) {
  const [checked, setChecked] = useState(false)

  return (
    <motion.div 
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div 
        className="sheet"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}
      >
        <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <ShieldCheck size={28} color="var(--color-primary)" />
          <span>Terms & Data Collection</span>
        </div>
        
        <div className="sheet-body" style={{ maxHeight: '50vh', overflowY: 'auto', fontSize: '14px', color: 'var(--text-1)', lineHeight: '1.6', paddingRight: '8px' }}>
          <p>Welcome to <strong>GC Assist</strong>. Before you continue, please review our terms regarding your interaction and data usage.</p>
          
          <div style={{ background: 'var(--color-primary-light)', padding: '12px', borderRadius: '8px', margin: '16px 0', display: 'flex', gap: '12px' }}>
            <Info size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-primary)' }}>
              To help improve the system's accuracy and performance, anonymous chat data may be collected for research and system refinement.
            </p>
          </div>

          <h4 style={{ margin: '16px 0 8px' }}>1. Data Collection</h4>
          <p>We may collect anonymized conversation logs, model performance metrics, and general usage patterns. We do NOT collect personally identifiable information unless explicitly shared by you in the chat.</p>

          <h4 style={{ margin: '16px 0 8px' }}>2. Use of Information</h4>
          <p>The collected data is used exclusively to fine-tune our AI models, fix bugs, and enhance the overall campus information experience for all students.</p>

          <h4 style={{ margin: '16px 0 8px' }}>3. Privacy First</h4>
          <p>Your chat history is stored locally on your device unless you choose to share it. We prioritize local processing (LM Studio) whenever possible to keep your data under your control.</p>
        </div>

        <div className="sheet-actions" style={{ marginTop: '24px', borderTop: '1px solid var(--color-separator)', paddingTop: '16px' }}>
          <label 
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
                borderRadius: '6px',
                border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: checked ? 'var(--color-primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              {checked && <Check size={14} color="white" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              I agree to the terms and data collection policy
            </span>
          </label>

          <button 
            className="btn btn-primary" 
            onClick={onAccept}
            disabled={!checked}
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontWeight: 600,
              opacity: checked ? 1 : 0.5,
              cursor: checked ? 'pointer' : 'not-allowed'
            }}
          >
            Accept and Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
