import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Tooltip({ children, text, position = 'top', fullWidth = false }) {
  const [show, setShow] = useState(false)
  const timerRef = useRef(null)

  const handleShow = () => {
    timerRef.current = setTimeout(() => setShow(true), 400)
  }

  const handleHide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setShow(false)
  }

  // Position logic
  const positions = {
    top: { bottom: '100%', left: '50%', x: '-50%', y: -8 },
    bottom: { top: '100%', left: '50%', x: '-50%', y: 8 },
    left: { right: '100%', top: '50%', y: '-50%', x: -8 },
    right: { left: '100%', top: '50%', y: '-50%', x: 8 },
  }

  return (
    <div 
      className="tooltip-wrapper"
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onTouchStart={handleShow}
      onTouchEnd={handleHide}
      style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-flex', width: fullWidth ? '100%' : 'auto' }}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, ...positions[position] }}
            animate={{ opacity: 1, scale: 1, ...positions[position] }}
            exit={{ opacity: 0, scale: 0.8, ...positions[position] }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              zIndex: 1000,
              pointerEvents: 'none',
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
