import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export type ViewMode = 'list' | 'grid'

interface ViewModeValue {
    mode: ViewMode
    setMode: (mode: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeValue | null>(null)

function readInitialMode(): ViewMode {
    try {
        return localStorage.getItem('flock-view') === 'list' ? 'list' : 'grid'
    } catch {
        return 'grid'
    }
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<ViewMode>(readInitialMode)

    const setMode = (next: ViewMode) => {
        setModeState(next)
        try {
            localStorage.setItem('flock-view', next)
        } catch {
            // depolama kapalıysa sorun değil
        }
    }

    return <ViewModeContext.Provider value={{ mode, setMode }}>{children}</ViewModeContext.Provider>
}

export function useViewMode(): ViewModeValue {
    const ctx = useContext(ViewModeContext)
    if (!ctx) throw new Error('useViewMode, ViewModeProvider içinde kullanılmalı')
    return ctx
}

// Izgara görünümü yalnızca ana sayfada ve konu sayfalarında geniş düzen ister.
export function useIsWide(): boolean {
    const { mode } = useViewMode()
    const { pathname } = useLocation()
    return mode === 'grid' && (pathname === '/' || pathname.startsWith('/konu/'))
}