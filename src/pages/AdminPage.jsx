import { useState, useEffect } from 'react'
import { Shield, Users, MessageSquare, ThumbsUp, ThumbsDown, Loader2, Search, User, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
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

  const totalLikes = feedback.filter(f => f.is_like).length
  const totalDislikes = feedback.filter(f => !f.is_like).length
  const uniqueUsers = new Set(feedback.map(f => f.user_id)).size

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id)

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <h1>
          <Shield size={28} color="var(--color-primary)" />
          Admin Dashboard
        </h1>
        <button onClick={fetchData} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Users</span>
            <span className="stat-value">{uniqueUsers}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><ThumbsUp size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Likes</span>
            <span className="stat-value">{totalLikes}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><ThumbsDown size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Dislikes</span>
            <span className="stat-value">{totalDislikes}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-primary)' }}><MessageSquare size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Feedbacks</span>
            <span className="stat-value">{feedback.length}</span>
          </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="admin-content-box">
        <div className="admin-search-bar">
          <Search size={18} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search question or user..."
            className="auth-input admin-search-input"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="admin-loading">
            <Loader2 className="spin" size={40} color="var(--color-primary)" />
            <p>Loading records...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="admin-empty">No feedback records found.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>USER</th>
                    <th>QUESTION</th>
                    <th>AI RESPONSE</th>
                    <th>RATING</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map(item => (
                    <tr key={item.id}>
                      <td className="admin-col-user">
                        <div className="admin-user-cell">
                          <div className="admin-avatar"><User size={14} /></div>
                          <span>{item.user_id.substring(0, 8)}…</span>
                        </div>
                      </td>
                      <td className="admin-col-text">{item.user_question}</td>
                      <td className="admin-col-text admin-col-response">{item.ai_response}</td>
                      <td className="admin-col-rating">
                        <span className={`admin-badge ${item.is_like ? 'badge-like' : 'badge-dislike'}`}>
                          {item.is_like ? 'LIKE' : 'DISLIKE'}
                        </span>
                      </td>
                      <td className="admin-col-date">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="admin-card-list">
              {filteredFeedback.map(item => (
                <div key={item.id} className="admin-card" onClick={() => toggleExpand(item.id)}>
                  <div className="admin-card-row">
                    <div className="admin-card-left">
                      <span className={`admin-badge ${item.is_like ? 'badge-like' : 'badge-dislike'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {item.is_like ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                      </span>
                      <p className="admin-card-question">{item.user_question}</p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`admin-card-chevron ${expandedId === item.id ? 'open' : ''}`}
                    />
                  </div>
                  {expandedId === item.id && (
                    <div className="admin-card-detail">
                      <div className="admin-card-detail-row">
                        <span className="admin-card-label">User</span>
                        <span className="admin-card-val">{item.user_id.substring(0, 12)}…</span>
                      </div>
                      <div className="admin-card-detail-row">
                        <span className="admin-card-label">Date</span>
                        <span className="admin-card-val">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="admin-card-detail-row">
                        <span className="admin-card-label">AI Response</span>
                      </div>
                      <p className="admin-card-response">{item.ai_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
