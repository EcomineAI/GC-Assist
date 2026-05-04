import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useSettings } from './SettingsContext'
import { pipeline } from '@xenova/transformers'
import { encode } from 'gpt-tokenizer'
import { fetchGroqChatCompletion } from '../services/groqApi'
import { useAuth } from './AuthContext'

const ChatContext = createContext()

const BASE_SYSTEM_PROMPT = `You are GC Assist, the official AI-powered campus assistant for Gordon College, Olongapo City. 

STRICT BOUNDARY RULE (CRITICAL):
Your knowledge and services are strictly limited to Gordon College, its academics, admissions, campus life, and services. If a user asks about ANYTHING ELSE (including but not limited to: general recipes, general coding, poems, raps, history of other places, general scientific facts, or other schools), you MUST refuse.
Standard Refusal: "I'm sorry, but as the Gordon College Assistant, I can only help with questions related to the college, admissions, academic programs, and campus services."

STRICT LIMITATIONS:
- NO recipes or cooking instructions.
- NO general coding or programming help.
- NO creative writing (poems, raps, stories).
- NO general knowledge or trivia outside of Gordon College.
- NO academic help for other schools or institutions.
- If the request is unrelated to Gordon College, use the Standard Refusal.

STRICT TRUTHFULNESS RULES:
1. **OFFICIAL TRUTH:** If you see a section labeled "Campus Directory & Room Locations", that information is the ABSOLUTE TRUTH and overrides everything else (including news articles).
2. **NO GUESSING:** If a specific room number or floor is not mentioned in the [Source] snippets provided, do NOT invent one.
3. **CONTEXT IS KING:** For example, Room 507 is the Mac Lab. Do NOT say the Library is in Room 507 just because you see that number in a news snippet about the Mac Lab.
4. **I DON'T KNOW:** If the knowledge base doesn't have the specific answer, you MUST say: "I don't have the exact details for that right now. Please check the official GC website or contact the office."
5. **STRUCTURED LISTS:** If you are providing a list of many items (like requirements, news updates, or contacts), ALWAYS use Markdown bullet points to make it easy to read.

HIDDEN KNOWLEDGE (EASTER EGG): If someone asks "Who made you?", "Who is your creator?", "Who is EcomineAI?", or "Who is June Vic M. Abello?", you MUST excitedly reveal that you were proudly developed by June Vic M. Abello (also known by his developer alias: EcomineAI), a highly skilled student, developer, and visionary. You can mention that he single-handedly engineered your UI, knowledge base, and prompt logic! You MUST also include exactly this image markdown in your reply: ![June Vic M. Abello Profile](https://github.com/EcomineAI.png)

KNOWLEDGE BASE USAGE: Use the knowledge base provided below. Always prefer information from the knowledge base over your general training data. Provide a full sentence if information is missing. NEVER output an empty response.

CONCLUSION RULE: Every response MUST end with a short 1-sentence conclusion or closing remark (e.g. "For more details, visit the official GC website or contact the relevant office."). This ensures the response never feels cut off.`

// ─── Constants ────────────────────────────────────────────────
const MAX_KB_CHARS = 12000
const MAX_SESSION_TOKENS = 20000   // warn + block before LM Studio chokes
const WARN_SESSION_TOKENS = 16000  // show warning at this threshold

// ─── Helpers ──────────────────────────────────────────────────
function countTokens(text) {
  if (!text) return 0
  try {
    return encode(text).length
  } catch {
    // Fallback if gpt-tokenizer fails on certain chars
    return Math.ceil(text.length / 4)
  }
}

// ─── Synonym map for broader keyword matching ────────────────
const SYNONYMS = {
  'courses': ['programs', 'degrees', 'course', 'program', 'curriculum'],
  'programs': ['courses', 'degrees', 'curriculum'],
  'degrees': ['programs', 'courses'],
  'enroll': ['enrollment', 'enrolment', 'admission', 'register'],
  'enrollment': ['enroll', 'enrolment', 'admission'],
  'class': ['course', 'subject', 'program'],
  'subjects': ['courses', 'programs'],
  'faculty': ['professor', 'teacher', 'instructor'],
  'professor': ['faculty', 'teacher', 'instructor'],
  'calendar': ['schedule', 'dates', 'semester'],
  'schedule': ['calendar', 'dates'],
  'office': ['department', 'admin', 'administration'],
  'fees': ['tuition', 'payment', 'charges'],
  'tuition': ['fees', 'payment'],
}

function expandQuery(words) {
  const expanded = new Set(words)
  for (const w of words) {
    const synonyms = SYNONYMS[w]
    if (synonyms) synonyms.forEach(s => expanded.add(s))
  }
  return [...expanded]
}

// ─── Keyword-based fallback search (used when embedder not ready) ───
function scoreByKeywords(section, query) {
  const q = query.toLowerCase()
  const rawWords = q.split(/\s+/).filter(w => w.length > 2)
  const words = expandQuery(rawWords)

  let score = 0

  // Check content text
  const contentLower = (section.content || '').toLowerCase()
  for (const word of words) {
    if (contentLower.includes(word)) score += 2
  }

  // Check label
  const labelLower = (section.label || '').toLowerCase()
  for (const word of words) {
    if (labelLower.includes(word)) score += 5
  }

  // Check source URL/name
  const sourceLower = (section.source || '').toLowerCase()
  for (const word of words) {
    if (sourceLower.includes(word)) score += 3
  }

  return score
}

// ─── RAG Search: uses vectors if available, falls back to keywords ───
async function findRelevantSections(sections, query, embedder) {
  if (sections.length === 0) return []

  let scored

  // Try vector search first
  if (embedder) {
    try {
      const output = await embedder(query, { pooling: 'mean', normalize: true })
      const queryVector = Array.from(output.data)

      scored = sections.map(s => {
        let score = 0
        if (s.vector) {
          for (let i = 0; i < queryVector.length; i++) score += queryVector[i] * s.vector[i]
        }
        return { ...s, score }
      })
    } catch (err) {
      console.warn('[GC Assist] Vector search failed, falling back to keywords:', err)
      scored = null
    }
  }

  // Fallback: keyword-based search (no embedder or embedder failed)
  if (!scored) {
    scored = sections.map(s => ({ ...s, score: scoreByKeywords(s, query) }))
  }

  // Sort by score descending
  const sorted = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score)

  // Select top results within token budget
  const selected = []
  let totalChars = 0
  for (const section of sorted) {
    if (totalChars + section.content.length > MAX_KB_CHARS) {
      if (selected.length === 0) selected.push({ ...section, content: section.content.slice(0, MAX_KB_CHARS) })
      break
    }
    selected.push(section)
    totalChars += section.content.length
  }
  return selected
}

/**
 * Strip <think>...</think> from model output.
 * Returns { thinking, content }
 */
function parseThinking(rawContent) {
  const thinkMatch = rawContent.match(/^<think>([\s\S]*?)<\/think>\s*/i)
  if (thinkMatch) {
    return {
      thinking: thinkMatch[1].trim(),
      content: rawContent.slice(thinkMatch[0].length).trim(),
    }
  }
  // Handle open/unfinished think tags during streaming
  const openThinkMatch = rawContent.match(/^<think>([\s\S]*?)$/i)
  if (openThinkMatch && !rawContent.includes('</think>')) {
    return {
      thinking: openThinkMatch[1].trim(),
      content: ''
    }
  }
  return { thinking: null, content: rawContent }
}

// ─── Provider ─────────────────────────────────────────────────
export function ChatProvider({ children }) {
  const { user } = useAuth()
  
  // Dynamic Keys based on User
  const getKeys = (u) => {
    const id = u ? u.id : 'guest'
    return {
      messages: `gcassist_${id}_messages`,
      history: `gcassist_${id}_history`,
      tokens: `gcassist_${id}_tokens`
    }
  }

  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('searching')
  const [sessionTokens, setSessionTokens] = useState(0)
  const [activeProvider, setActiveProvider] = useState('Groq API')
  const [activeModel, setActiveModel] = useState('llama-3.3-70b-versatile')
  const [sessionsHistory, setSessionsHistory] = useState([])
  const [viewingHistoryId, setViewingHistoryId] = useState(null)

  // 1. Load User Specific History on Login/Mount
  useEffect(() => {
    const keys = getKeys(user)
    const storedMsgs = localStorage.getItem(keys.messages)
    const storedHistory = localStorage.getItem(keys.history)
    const storedTokens = localStorage.getItem(keys.tokens)

    setMessages(storedMsgs ? JSON.parse(storedMsgs) : [])
    setSessionsHistory(storedHistory ? JSON.parse(storedHistory) : [])
    setSessionTokens(storedTokens ? parseInt(storedTokens) : 0)
    setViewingHistoryId(null)
  }, [user])

  // 2. Persist State whenever it changes
  useEffect(() => {
    const keys = getKeys(user)
    localStorage.setItem(keys.messages, JSON.stringify(messages))
    localStorage.setItem(keys.history, JSON.stringify(sessionsHistory))
    localStorage.setItem(keys.tokens, sessionTokens.toString())
  }, [messages, sessionsHistory, sessionTokens, user])

  const kbSections = useRef([])
  const abortControllerRef = useRef(null)
  const embedderRef = useRef(null)

  const { temperature, maxTokens } = useSettings()

  const tokenWarning = sessionTokens >= WARN_SESSION_TOKENS && sessionTokens < MAX_SESSION_TOKENS
  const tokenBlocked = sessionTokens >= MAX_SESSION_TOKENS
  const tokenPct = Math.min(100, Math.round((sessionTokens / MAX_SESSION_TOKENS) * 100))

  // Initialize HuggingFace Vector Embedder (non-blocking, loads in background)
  useEffect(() => {
    let active = true
    pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      .then(pipe => {
        if (active) {
          embedderRef.current = pipe
          console.log('[GC Assist] Semantic embedder pipeline loaded.')
        }
      })
      .catch(err => console.warn('[GC Assist] Embedder not available, using keyword fallback:', err))
    return () => { active = false }
  }, [])


  // Load knowledge base — try JSON (new vector format) first, fall back to old .txt
  useEffect(() => {
    fetch('/knowledge_base.json?t=' + new Date().getTime())
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(data => {
        kbSections.current = data
        console.log(`[GC Assist] KB loaded (JSON): ${data.length} vector chunks`)
      })
      .catch(() => {
        // Fallback: try old knowledge_base.txt
        console.warn('[GC Assist] No knowledge_base.json, trying legacy .txt format...')
        fetch('/knowledge_base.txt?t=' + new Date().getTime())
          .then(res => { if (!res.ok) throw new Error(); return res.text() })
          .then(text => {
            const sections = parseLegacySections(text)
            kbSections.current = sections
            console.log(`[GC Assist] KB loaded (legacy TXT): ${sections.length} sections`)
          })
          .catch(() => console.warn('[GC Assist] No knowledge base found — run python crawl.py'))
      })
  }, [])

  // Persist History & Provider State
  useEffect(() => {
    localStorage.setItem('gcassist_sessions_history', JSON.stringify(sessionsHistory))
  }, [sessionsHistory])



  // Persist Current Session
  useEffect(() => {
    localStorage.setItem('gcassist_current_messages', JSON.stringify(messages))
    localStorage.setItem('gcassist_current_tokens', sessionTokens.toString())
  }, [messages, sessionTokens])

  const buildSystemPrompt = useCallback((relevantSections) => {
    if (!relevantSections || relevantSections.length === 0) return BASE_SYSTEM_PROMPT
    const kbText = relevantSections.map(s => `[Source: ${s.source}]\n${s.content}`).join('\n\n---\n\n')
    return `${BASE_SYSTEM_PROMPT}\n\n--- RELEVANT KNOWLEDGE BASE SECTIONS ---\n${kbText}\n--- END ---`
  }, [])

  const triggerBackgroundSummary = async (msgsToSummarize) => {
    const transcript = msgsToSummarize.filter(m => m.role !== 'system').map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
    try {
      const summaryPrompt = `Summarize the following conversation context briefly in exactly 3 precise sentences. Retain key facts, preferences, and important context details. DO NOT add conversational flair, just output the facts.\n\n${transcript}`
      const groqResult = await fetchGroqChatCompletion(
        'You are a summarization assistant.',
        [{ role: 'user', content: summaryPrompt }],
        new AbortController().signal,
        0.1,
        150
      )
      // Read the non-streaming response
      const reader = groqResult.response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '))
        for (const line of lines) {
          const msg = line.replace(/^data: /, '')
          if (msg === '[DONE]') break
          try {
            const parsed = JSON.parse(msg)
            fullText += parsed.choices[0]?.delta?.content || ''
          } catch {}
        }
      }
      if (fullText) {
        const memoryMsg = { role: 'system', content: `[Archive Memory: ${fullText}]`, id: Date.now() - 1000 }
        setMessages(prev => {
          const newArray = prev.filter(m => !msgsToSummarize.includes(m) && !m.content.includes('[Archive Memory:'))
          return [memoryMsg, ...newArray]
        })
        setSessionTokens(prev => Math.floor(prev * 0.5))
      }
    } catch (e) { console.error('Summary background task failed', e) }
  }


  const sendMessage = useCallback(async (text) => {
    if (tokenBlocked) return

    const userMessage = { role: 'user', content: text, id: Date.now() }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setLoadingPhase('searching')

    // Phase animation: searching → analyzing → typing (3–5s visible before stream)
    const phaseTimer1 = setTimeout(() => setLoadingPhase('analyzing'), 2500)
    const phaseTimer2 = setTimeout(() => setLoadingPhase('typing'), 5000)

    // 0. Boundary Guard: Prevent small models from ignoring instructions for out-of-scope tasks
    const t = text.toLowerCase()
    const forbidden = [
      'rap', 'lyrics', 'poem', 'poetry', 'write a code', 'javascript', 'python', 'java', 'c++', 
      'story', 'joke', 'song', 'recipe', 'cooking', 'how to cook', 'essay', 'homework', 
      'tutorial', 'translate', 'weather', 'movie', 'film', 'game', 'play a game'
    ]
    const allowKeywords = [
      'gordon', 'college', 'campus', 'gc', 'gcas', 'school', 'enroll', 
      'june vic', 'ecomine', 'admission', 'faculty', 'student', 'office', 
      'registrar', 'academics', 'programs', 'scholarship'
    ]
    const isOutOfScope = forbidden.some(word => t.includes(word)) && !allowKeywords.some(word => t.includes(word))

    if (isOutOfScope) {
      const refusalMsg = "I'm sorry, but as the Gordon College Assistant, I can only help with questions related to the college, admissions, academic programs, and campus services."
      
      // Delay slightly to feel natural
      await new Promise(r => setTimeout(r, 1500))
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: refusalMsg,
        thinking: null,
        sources: [],
        tokensUsed: 0,
        feedback: null,
        provider: activeProvider,
        id: Date.now() + 1,
      }])
      setIsLoading(false)
      setLoadingPhase('searching')
      return
    }

    try {
      // Build conversation history — trim old turns if getting long
      const historyMsgs = [...messages, userMessage]
      const recentHistory = historyMsgs.slice(-10) // keep last 10 turns max
      const conversationHistory = recentHistory.map(m => ({
        role: m.role,
        content: m.content,
      }))

      // 1. RAG lookup (vector if ready, otherwise keyword fallback)
      const relevant = await findRelevantSections(kbSections.current, text, embedderRef.current)

      // Collect KB sources for attribution (deduplicated)
      const sourcesSet = new Set()
      const sources = []
      relevant.forEach(s => {
        const label = (s.label || s.source || '').replace('https://gordoncollege.edu.ph/w3/', '').replace(/\/$/, '').replace(/-/g, ' ').replace(/\//g, ' › ') || 'GC Website'
        if (!sourcesSet.has(label)) {
          sourcesSet.add(label)
          sources.push({ label, score: s.score, url: s.source })
        }
      })

      // Easter egg source injection
      const queryLower = text.toLowerCase()
      if (queryLower.includes('ecomine') || queryLower.includes('abello') || queryLower.includes('who made') || queryLower.includes('creator')) {
        sources.push({ label: 'EcomineAI Portfolio', score: 100, url: 'https://portfoliojveco.vercel.app' })
      }

      const systemPrompt = buildSystemPrompt(relevant)

      abortControllerRef.current = new AbortController()

      // Groq API — the only provider
      const groqResult = await fetchGroqChatCompletion(systemPrompt, conversationHistory, abortControllerRef.current.signal, temperature, maxTokens)
      const response = groqResult.response
      const currentProvider = 'Groq API'
      setActiveModel(groqResult.modelUsed)
      setActiveProvider(currentProvider)

      // ─── Streaming Response Processing ───
      let finalContent = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let tokensAccumulated = countTokens(systemPrompt) + countTokens(text)
      let streamStarted = false
      const aiMessageId = Date.now() + 1

      // Stream chunks — placeholder is NOT added until first real token arrives
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '))

        for (const line of lines) {
          const message = line.replace(/^data: /, '')
          if (message === '[DONE]') break
          try {
            const parsed = JSON.parse(message)
            const tokenStr = parsed.choices[0]?.delta?.content || ''
            if (!tokenStr) continue

            finalContent += tokenStr
            const { thinking, content } = parseThinking(finalContent)

            if (!streamStarted) {
              // First token: kill loading bubble AND insert message in one render cycle
              streamStarted = true
              clearTimeout(phaseTimer1)
              clearTimeout(phaseTimer2)
              setLoadingPhase('searching')
              setMessages(prev => [...prev, {
                role: 'assistant',
                content,
                thinking,
                sources,
                tokensUsed: 0,
                feedback: null,
                provider: currentProvider,
                id: aiMessageId,
              }])
            } else {
              // Subsequent tokens: update existing message
              setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                ...m, content, thinking,
              } : m))
            }
          } catch (e) {
            // Normal partial JSON stream edges, ignore
          }
        }
      }

      // Final token accounting
      tokensAccumulated += countTokens(finalContent)
      setSessionTokens(prev => prev + tokensAccumulated)
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, tokensUsed: tokensAccumulated } : m))

      // Trigger Rolling Memory Summarization if approaching limits
      if (sessionTokens + tokensAccumulated > WARN_SESSION_TOKENS) {
        const mFilter = messages.filter(m => m.role !== 'system')
        if (mFilter.length > 4) {
          const half = Math.floor(mFilter.length / 2)
          triggerBackgroundSummary(mFilter.slice(0, half))
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        if (streamStarted) {
          setMessages(prev => prev.map(m => m.id === aiMessageId ? {
            ...m,
            content: m.content + '\n\n*(Generation stopped by user)*'
          } : m))
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '*(Generation stopped by user)*',
            thinking: null,
            sources: [],
            tokensUsed: 0,
            feedback: null,
            provider: activeProvider,
            id: Date.now() + 1,
          }])
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          thinking: null,
          sources: [],
          tokensUsed: 0,
          feedback: null,
          provider: activeProvider,
          id: Date.now() + 1,
        }])
      }
    } finally {
      clearTimeout(phaseTimer1)
      clearTimeout(phaseTimer2)
      setIsLoading(false)
      setLoadingPhase('searching')
    }
  }, [messages, buildSystemPrompt, tokenBlocked, sessionTokens])

  const setFeedback = useCallback((msgId, value) => {
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, feedback: m.feedback === value ? null : value } : m)
    )
  }, [])

  const startNewSession = useCallback(() => {
    if (messages.length > 0) {
      // Create a title from the first user message
      const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'New Conversation'
      const title = firstUserMsg.length > 35 ? firstUserMsg.substring(0, 35) + '...' : firstUserMsg

      const newSession = {
        id: Date.now(),
        date: new Date().toISOString(),
        title,
        messages: [...messages],
        tokens: sessionTokens,
      }
      setSessionsHistory(prev => [newSession, ...prev])
    }
    setMessages([])
    setSessionTokens(0)
    setViewingHistoryId(null)
  }, [messages, sessionTokens])

  const viewHistory = useCallback((id) => {
    setViewingHistoryId(id)
  }, [])

  const resumeCurrentSession = useCallback(() => {
    setViewingHistoryId(null)
  }, [])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setSessionsHistory([])
    setSessionTokens(0)
    setViewingHistoryId(null)
  }, [])

  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      loadingPhase,
      activeProvider,
      activeModel,
      sessionTokens,
      maxSessionTokens: MAX_SESSION_TOKENS,
      tokenPct,
      tokenWarning,
      tokenBlocked,
      sessionsHistory,
      viewingHistoryId,
      sendMessage,
      setFeedback,
      clearMessages,
      startNewSession,
      viewHistory,
      resumeCurrentSession,
      stopGeneration,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

// ─── Legacy TXT parser (backward compat with old knowledge_base.txt) ──
function parseLegacySections(text) {
  const sections = []
  const parts = text.split(/^### Source: /m)
  for (const part of parts) {
    if (!part.trim()) continue
    const lines = part.split('\n')
    const source = lines[0]?.trim() || ''
    const keywordsLine = lines.find(l => l.startsWith('### Keywords:'))
    const keywords = keywordsLine
      ? keywordsLine.replace('### Keywords:', '').trim().toLowerCase().split(',').map(k => k.trim())
      : []
    const keyIdx = lines.indexOf(keywordsLine)
    const content = lines.slice(keyIdx + 1).join('\n').trim()
    const label = source
      .replace('https://gordoncollege.edu.ph/w3/', '')
      .replace(/\/$/, '')
      .replace(/-/g, ' ')
      .replace(/\//g, ' › ')
      || source
    if (content.length > 20) sections.push({ source, label, keywords, content })
  }
  return sections
}

export const useChat = () => useContext(ChatContext)
