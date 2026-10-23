import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function formatNotifTime(dateString?: string): string {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'şimdi'
    if (diffMin < 60) return `${diffMin}dk`
    if (diffHour < 24) return `${diffHour}sa`
    if (diffDay < 7) return `${diffDay}g`

    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function NotificationsPage() {
    const { user, refreshUnreadNotifications } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<any[]>([])

    // Sayfa açıldığı andaki okunmamış bildirimlerin id'lerini saklıyoruz
    // Bunlar geçici olarak vurgulu görünecek, sonra sessizce "okundu"ya dönecek
    const [recentlyUnreadIds, setRecentlyUnreadIds] = useState<Set<string>>(new Set())
    const [fadingOut, setFadingOut] = useState(false)
    const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        fetchNotifications()

        return () => {
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
        }
    }, [])

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*, actor:profiles!notifications_actor_id_fkey(username, avatar_url)')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })

        if (data) {
            setNotifications(data)

            const unreadIds = new Set(data.filter((n: any) => !n.is_read).map((n: any) => n.id))
            setRecentlyUnreadIds(unreadIds)

            if (unreadIds.size > 0) {
                // 2.5 saniye vurgulu kalsın, sonra hem görsel olarak solsun hem veritabanında okundu işaretlensin
                fadeTimeoutRef.current = setTimeout(() => {
                    setFadingOut(true)
                    markAllAsRead(Array.from(unreadIds))

                    // Solma animasyonu bittikten sonra vurguyu tamamen kaldır
                    setTimeout(() => {
                        setRecentlyUnreadIds(new Set())
                        setFadingOut(false)
                    }, 700)
                }, 2500)
            }
        }
    }

    const markAllAsRead = async (ids?: string[]) => {
        let query = supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user?.id)
            .eq('is_read', false)

        if (ids && ids.length > 0) {
            query = query.in('id', ids)
        }

     await query
        setNotifications((prev) => prev.map((n: any) => ({ ...n, is_read: true })))
        refreshUnreadNotifications?.()
    }

    const handleNotificationClick = async (notification: any) => {
        if ((notification.type === 'like' || notification.type === 'comment') && notification.post_id) {
            navigate(`/gonderi/${notification.post_id}`)
            return
        }

        navigate(`/profil/${notification.actor?.username}`)
    }

    // "Yeni" ayracını göstermek için: ilk okunmamış bildirimin index'ini bul
    const firstUnreadIndex = notifications.findIndex((n: any) => recentlyUnreadIds.has(n.id))
    const hasUnreadSection = firstUnreadIndex !== -1

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">

            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800">
                <h1 className="text-ink font-bold text-xl">Bildirimler</h1>
            </div>

            {notifications.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Henüz bildirim yok.</p>
            ) : (
                <>
                    {hasUnreadSection && (
                        <div className="flex items-center gap-3 px-4 pt-4 pb-1">
                            <span className="text-purple-400 text-xs font-bold uppercase tracking-wide">Yeni</span>
                            <div className="flex-1 h-px bg-purple-900/40" />
                        </div>
                    )}

                    {notifications.map((notification: any, index: number) => {
                        const isRecentlyUnread = recentlyUnreadIds.has(notification.id)
                        const wasUnreadSectionEnd =
                            hasUnreadSection &&
                            isRecentlyUnread &&
                            (index === notifications.length - 1 || !recentlyUnreadIds.has(notifications[index + 1]?.id))

                        return (
                            <div key={notification.id}>
                                <div
                                    className={`flex items-center gap-3 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors duration-700 cursor-pointer ${
                                        isRecentlyUnread && !fadingOut ? 'bg-purple-950/25' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="relative shrink-0">
                                        {notification.actor?.avatar_url ? (
                                            <img
                                                src={notification.actor.avatar_url}
                                                alt={notification.actor.username}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-purple-500" />
                                        )}
                                        {isRecentlyUnread && !fadingOut && (
                                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border-2 border-gray-950" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-ink text-sm">
                                            {notification.type === 'like' && `❤️ ${notification.actor?.username} sorunu beğendi.`}
                                            {notification.type === 'comment' && `💬 ${notification.actor?.username} sorunu yanıtladı.`}
                                            {notification.type === 'follow' && `👤 ${notification.actor?.username} seni takip etti.`}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">{formatNotifTime(notification.created_at)}</p>
                                    </div>
                                </div>

                                {wasUnreadSectionEnd && (
                                    <div className="flex items-center gap-3 px-4 pt-4 pb-1">
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Daha önce</span>
                                        <div className="flex-1 h-px bg-gray-800" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </>
            )}

        </div>
    )
}

export default NotificationsPage