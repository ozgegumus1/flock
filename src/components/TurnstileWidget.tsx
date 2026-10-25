import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

export const TURNSTILE_SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY

interface TurnstileApi {
    render: (
        container: HTMLElement,
        options: {
            sitekey: string
            theme?: 'light' | 'dark' | 'auto'
            callback?: (token: string) => void
            'expired-callback'?: () => void
            'error-callback'?: () => void
        }
    ) => string
    reset: (widgetId?: string) => void
    remove: (widgetId?: string) => void
}

declare global {
    interface Window {
        turnstile?: TurnstileApi
    }
}

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
    if (window.turnstile) return Promise.resolve()
    if (scriptPromise) return scriptPromise

    scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => {
            scriptPromise = null
            reject(new Error('Turnstile yüklenemedi'))
        }
        document.head.appendChild(script)
    })

    return scriptPromise
}

interface TurnstileWidgetProps {
    onToken: (token: string | null) => void
    resetKey: number
}

// "Ben robot değilim" doğrulaması. Anahtar tanımlı değilse hiçbir şey göstermez.
function TurnstileWidget({ onToken, resetKey }: TurnstileWidgetProps) {
    const { theme } = useTheme()
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const onTokenRef = useRef(onToken)

    useEffect(() => {
        onTokenRef.current = onToken
    }, [onToken])

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY || !containerRef.current) return

        let cancelled = false

        loadTurnstileScript()
            .then(() => {
                if (cancelled || !containerRef.current || !window.turnstile) return

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: TURNSTILE_SITE_KEY,
                    theme,
                    callback: (token) => onTokenRef.current(token),
                    'expired-callback': () => onTokenRef.current(null),
                    'error-callback': () => onTokenRef.current(null),
                })
            })
            .catch(() => onTokenRef.current(null))

        return () => {
            cancelled = true
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current)
                widgetIdRef.current = null
            }
        }
    }, [theme])

    useEffect(() => {
        if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current)
        }
    }, [resetKey])

    if (!TURNSTILE_SITE_KEY) return null

    return <div ref={containerRef} className="flex justify-center mt-4 min-h-[65px]" />
}

export default TurnstileWidget