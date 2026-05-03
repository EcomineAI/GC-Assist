import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('gc-theme')
    if (stored) return stored === 'dark'
    return false // Default strictly to light mode on first visit
  })

  const [colorTheme, setColorTheme] = useState(() => {
    return localStorage.getItem('gc-color-theme') || 'purple'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('gc-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    document.documentElement.setAttribute('data-color', colorTheme)
    localStorage.setItem('gc-color-theme', colorTheme)
  }, [colorTheme])

  const toggleTheme = () => setIsDark(prev => !prev)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
