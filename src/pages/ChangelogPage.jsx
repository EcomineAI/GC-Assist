import { motion } from 'framer-motion'
import { FileText, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import changelogContent from '../../CHANGELOG.md?raw'

export default function ChangelogPage() {
  return (
    <div className="settings-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'var(--color-text)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
          Back
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={32} color="var(--color-primary)" />
          System Updates
        </h1>
      </div>

      <motion.div 
        className="changelog-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: 'var(--color-surface)', 
          padding: '2rem', 
          borderRadius: '16px', 
          border: '1px solid var(--color-border)',
          lineHeight: '1.6'
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => <h1 style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-text)' }} {...props} />,
            h2: ({node, ...props}) => <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--color-primary)' }} {...props} />,
            h3: ({node, ...props}) => <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text)' }} {...props} />,
            ul: ({node, ...props}) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-secondary)' }} {...props} />,
            li: ({node, ...props}) => <li style={{ marginBottom: '0.5rem' }} {...props} />,
            strong: ({node, ...props}) => <strong style={{ color: 'var(--color-text)' }} {...props} />,
            hr: ({node, ...props}) => <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '2rem 0' }} {...props} />
          }}
        >
          {changelogContent}
        </ReactMarkdown>
      </motion.div>

      <style>{`
        .changelog-content a {
          color: var(--color-primary);
          text-decoration: none;
        }
        .changelog-content a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
