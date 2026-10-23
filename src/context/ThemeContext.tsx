import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
    const current = document.documentElement.dataset.theme
    return current === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme)

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17121c' : '#fbf7f4')
        try {
            localStorage.setItem('flock-theme', theme)
        } catch {
            // depolama kapalıysa sorun değil
        }
    }, [theme])

    const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme, ThemeProvider içinde kullanılmalı')
    return ctx
}
