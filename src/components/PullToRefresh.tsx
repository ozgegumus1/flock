import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const PULL_THRESHOLD = 70

export function PullToRefresh({ children }: { children: React.ReactNode }) {
    const [pullDistance, setPullDistance] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const startYRef = useRef<number | null>(null)
    const pullingRef = useRef(false)

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0 && !refreshing) {
                startYRef.current = e.touches[0].clientY
                pullingRef.current = true
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!pullingRef.current || startYRef.current === null) return
            const diff = e.touches[0].clientY - startYRef.current
            if (diff > 0 && window.scrollY === 0) {
                setPullDistance(Math.min(diff * 0.5, 100))
            }
        }

        const handleTouchEnd = () => {
            if (!pullingRef.current) return
            pullingRef.current = false
            startYRef.current = null

            setPullDistance((current) => {
                if (current >= PULL_THRESHOLD) {
                    setRefreshing(true)
                    window.location.reload()
                }
                return 0
            })
        }

        window.addEventListener('touchstart', handleTouchStart, { passive: true })
        window.addEventListener('touchmove', handleTouchMove, { passive: true })
        window.addEventListener('touchend', handleTouchEnd)

        return () => {
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [refreshing])

    return (
        <>
            {(pullDistance > 0 || refreshing) && (
                <div
                    className="fixed top-0 left-0 right-0 flex items-center justify-center z-[200]"
                    style={{ height: `${refreshing ? 60 : pullDistance}px`, opacity: pullDistance > 10 || refreshing ? 1 : 0 }}
                >
                    <div className="bg-gray-900 border border-gray-800 rounded-full p-2 shadow-lg">
                        <RefreshCw
                            size={20}
                            className={`text-purple-400 ${refreshing ? 'animate-spin' : ''}`}
                            style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
                        />
                    </div>
                </div>
            )}
            {children}
        </>
    )
}