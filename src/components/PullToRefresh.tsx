import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const PULL_THRESHOLD = 80
const MAX_PULL = 120

export function PullToRefresh({ children }: { children: React.ReactNode }) {
    const [pullDistance, setPullDistance] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const startYRef = useRef<number | null>(null)
    const pullingRef = useRef(false)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const getScrollTop = () => {
            // PWA standalone modunda bazen window değil, iç kapsayıcı kayar
            return window.scrollY || document.documentElement.scrollTop || 0
        }

        const handleTouchStart = (e: TouchEvent) => {
            if (getScrollTop() <= 0 && !refreshing) {
                startYRef.current = e.touches[0].clientY
                pullingRef.current = true
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!pullingRef.current || startYRef.current === null) return
            if (getScrollTop() > 0) {
                // Sayfa zaten kaymışsa çekme işlemini iptal et
                pullingRef.current = false
                setPullDistance(0)
                return
            }

            const diff = e.touches[0].clientY - startYRef.current
            if (diff > 0) {
                // Tarayıcının kendi elastik kaydırmasıyla çakışmasın diye engelle
                e.preventDefault()
                const eased = Math.min(diff * 0.4, MAX_PULL)
                setPullDistance(eased)
            }
        }

        const handleTouchEnd = () => {
            if (!pullingRef.current) return
            pullingRef.current = false
            startYRef.current = null

            setPullDistance((current) => {
                if (current >= PULL_THRESHOLD && !refreshing) {
                    setRefreshing(true)
                    setTimeout(() => window.location.reload(), 150)
                    return 60
                }
                return 0
            })
        }

        window.addEventListener('touchstart', handleTouchStart, { passive: true })
        window.addEventListener('touchmove', handleTouchMove, { passive: false })
        window.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [refreshing])

    const displayDistance = refreshing ? 60 : pullDistance

    return (
        <div style={{ overscrollBehaviorY: 'contain' }}>
            <div
                className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
                style={{ height: `${displayDistance}px` }}
            >
                {displayDistance > 5 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-full p-2 shadow-lg">
                        <RefreshCw
                            size={20}
                            className={`text-purple-400 ${refreshing ? 'animate-spin' : ''}`}
                            style={{
                                transform: refreshing ? undefined : `rotate(${(pullDistance / MAX_PULL) * 360}deg)`,
                                opacity: Math.min(displayDistance / PULL_THRESHOLD, 1),
                            }}
                        />
                    </div>
                )}
            </div>
            <div ref={contentRef}>
                {children}
            </div>
        </div>
    )
}