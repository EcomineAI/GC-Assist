import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, MessageSquare, ThumbsUp, ThumbsDown, ArrowLeft, Loader2, Search, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Production Security: Only allow Admin@gmail.com
    if (user && user.email.toLowerCase() !== 'admin@gmail.com') {
      navigate('/')
      return
    }
    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setFeedback(data || [])
    } catch (err) {
      console.error('Admin fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredFeedback = feedback.filter(f => 
    f.user_question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Statistics
  const totalLikes = feedback.filter(f => f.is_like).length
  const totalDislikes = feedback.filter(f => !f.is_like).length
  const uniqueUsers = new Set(feedback.map(f => f.user_id)).size

  return (
    <div className="admin-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', color: 'var(--color-text)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
            Back
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={32} color="var(--color-primary)" />
            Admin Dashboard
          </h1>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="admin-stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{uniqueUsers}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><ThumbsUp size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Likes</span>
            <span className="stat-value">{totalLikes}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><ThumbsDown size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Dislikes</span>
            <span className="stat-value">{totalDislikes}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-primary)' }}><MessageSquare size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Feedbacks</span>
            <span className="stat-value">{feedback.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="admin-content-box">
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by question or User ID..." 
            className="auth-input"
            style={{ paddingLeft: '3rem', width: '100%', maxWidth: '400px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem' }}>
            <Loader2 className="spin" size={48} color="var(--color-primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Loading history...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)' }}>USER</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--color-text-secondary)' }}>CONVERSATION</th>
                  <th style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)' }}>RATING</th>
                  <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--color-text-secondary)' }}>DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)', verticalAlign: 'top' }}>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                          <User size={16} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{item.user_id.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>User Question:</strong>
                        <p style={{ margin: '4px 0 0 0', fontWeight: 500 }}>{item.user_question}</p>
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>AI Response:</strong>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{item.ai_response}</p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {item.is_like ? (
                        <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>LIKE</span>
                      ) : (
                        <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>DISLIKE</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFeedback.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
                No feedback records found.
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .admin-stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(124, 58, 237, 0.1);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-label {
          display: block;
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
        }
        .admin-content-box {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 1.5rem;
        }
      `}</style>
    </div>
  )
}
