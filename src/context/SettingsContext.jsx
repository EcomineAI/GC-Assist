import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

// Local server URL is now managed in src/services/localAi.js (ignored)
// This prevents production builds from defaulting to localhost

export function SettingsProvider({ children }) {
  const [ttsVoice, setTtsVoice] = useState(() => {
    return localStorage.getItem('gcassist_tts_voice') || 'girl'
  })

  const [temperature, setTemperature] = useState(() => {
    const stored = localStorage.getItem('gcassist_temperature')
    return stored !== null ? parseFloat(stored) : 0.7
  })

  const [maxTokens, setMaxTokens] = useState(() => {
    const stored = localStorage.getItem('gcassist_max_tokens')
    return stored !== null ? parseInt(stored, 10) : 20000
  })

  const [ttsRate, setTtsRate] = useState(() => {
    const stored = localStorage.getItem('gcassist_tts_rate')
    return stored !== null ? parseFloat(stored) : 0.9
  })

  const [ttsPitch, setTtsPitch] = useState(() => {
    const stored = localStorage.getItem('gcassist_tts_pitch')
    return stored !== null ? parseFloat(stored) : 1.0
  })

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('gcassist_font_size') || 'medium'
  })

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('gcassist_high_contrast') === 'true'
  })

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('gcassist_reduced_motion') === 'true'
  })

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return localStorage.getItem('gcassist_accepted_terms') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('gcassist_tts_voice', ttsVoice)
  }, [ttsVoice])

  useEffect(() => {
    localStorage.setItem('gcassist_temperature', temperature)
  }, [temperature])

  useEffect(() => {
    localStorage.setItem('gcassist_max_tokens', maxTokens)
  }, [maxTokens])

  useEffect(() => {
    localStorage.setItem('gcassist_tts_rate', ttsRate)
  }, [ttsRate])

  useEffect(() => {
    localStorage.setItem('gcassist_tts_pitch', ttsPitch)
  }, [ttsPitch])

  useEffect(() => {
    localStorage.setItem('gcassist_font_size', fontSize)
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('gcassist_high_contrast', highContrast)
    document.documentElement.setAttribute('data-high-contrast', highContrast)
  }, [highContrast])

  useEffect(() => {
    localStorage.setItem('gcassist_reduced_motion', reducedMotion)
    document.documentElement.setAttribute('data-reduced-motion', reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    localStorage.setItem('gcassist_accepted_terms', hasAcceptedTerms)
  }, [hasAcceptedTerms])

  const [showAdvanced, setShowAdvanced] = useState(() => {
    return localStorage.getItem('gcassist_show_advanced') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('gcassist_show_advanced', showAdvanced)
  }, [showAdvanced])

  return (
    <SettingsContext.Provider value={{
      ttsVoice,
      setTtsVoice,
      ttsRate,
      setTtsRate,
      ttsPitch,
      setTtsPitch,
      temperature,
      setTemperature,
      maxTokens,
      setMaxTokens,
      fontSize,
      setFontSize,
      highContrast,
      setHighContrast,
      reducedMotion,
      setReducedMotion,
      hasAcceptedTerms,
      setHasAcceptedTerms,
      showAdvanced,
      setShowAdvanced,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
