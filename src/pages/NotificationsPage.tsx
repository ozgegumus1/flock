import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { StoryViewer } from '../components/StoryViewer'
import { Check, X } from 'lucide-react'

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
    const { user } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<any[]>([])
    const [followRequests, setFollowRequests] = useState<any[]>([])
    const [loadingRequests, setLoadingRequests] = useState(true)
    const [viewerGroups, setViewerGroups] = useState<any[] | null>(null)

    useEffect(() => {
        fetchNotifications()
        fetchFollowRequests()
        markAllAsRead()
    }, [])

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*, actor:profiles!notifications_actor_id_fkey(username, avatar_url)')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })

        if (data) setNotifications(data)
    }

    const markAllAsRead = async () => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user?.id)
            .eq('is_read', false)
    }

    const fetchFollowRequests = async () => {
        const { data: requests } = await supabase
            .from('follows')
            .select('id, follower_id, created_at')
            .eq('following_id', user?.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (!requests || requests.length === 0) {
            setLoadingRequests(false)
            return
        }

        const followerIds = requests.map((r: any) => r.follower_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', followerIds)

        const merged = requests.map((r: any) => ({
            requestId: r.id,
            profile: (profiles ?? []).find((p: any) => p.id === r.follower_id),
        })).filter((r: any) => r.profile)

        setFollowRequests(merged)
        setLoadingRequests(false)
    }

    const handleAccept = async (requestId: string) => {
        await supabase
            .from('follows')
            .update({ status: 'accepted' })
            .eq('id', requestId)

        setFollowRequests((prev) => prev.filter((r) => r.requestId !== requestId))
    }

    const handleReject = async (requestId: string) => {
        await supabase
            .from('follows')
            .delete()
            .eq('id', requestId)

        setFollowRequests((prev) => prev.filter((r) => r.requestId !== requestId))
    }

    const handleNotificationClick = async (notification: any) => {
        if ((notification.type === 'like' || notification.type === 'comment') && notification.post_id) {
            navigate(`/gonderi/${notification.post_id}`)
            return
        }

        if (notification.type === 'story_like' && notification.story_id) {
            const { data: story } = await supabase
                .from('stories')
                .select('*')
                .eq('id', notification.story_id)
                .gt('expires_at', new Date().toISOString())
                .single()

            if (story) {
                setViewerGroups([{
                    userId: user?.id,
                    username: user?.user_metadata?.username,
                    avatarUrl: notification.actor?.avatar_url ?? null,
                    stories: [story],
                    hasUnseen: false,
                }])
            } else {
                navigate(`/profil/${notification.actor?.username}`)
            }
            return
        }

        navigate(`/profil/${notification.actor?.username}`)
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">

            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800">
                <h1 className="text-white font-bold text-xl">Bildirimler</h1>
            </div>

            {!loadingRequests && followRequests.length > 0 && (
                <div className="border-b border-gray-800">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wide px-4 pt-4 pb-1">
                        Takip İstekleri
                    </p>
                    {followRequests.map(({ requestId, profile }) => (
                        <div
                            key={requestId}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="w-11 h-11 rounded-full object-cover shrink-0 cursor-pointer"
                                    onClick={() => navigate(`/profil/${profile.username}`)}
                                />
                            ) : (
                                <div
                                    className="w-11 h-11 rounded-full bg-purple-500 shrink-0 cursor-pointer"
                                    onClick={() => navigate(`/profil/${profile.username}`)}
                                />
                            )}
                            <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => navigate(`/profil/${profile.username}`)}
                            >
                                <p className="text-white font-bold text-sm truncate">
                                    {profile.full_name || profile.username}
                                </p>
                                <p className="text-gray-400 text-xs">@{profile.username} seni takip etmek istiyor</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => handleAccept(requestId)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition"
                                    title="Onayla"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => handleReject(requestId)}
                                    className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition"
                                    title="Reddet"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {notifications.length === 0 && followRequests.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Henüz bildirim yok.</p>
            ) : (
                notifications.map((notification: any) => (
                    <div
                        key={notification.id}
                        className={`flex items-center gap-3 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition cursor-pointer ${!notification.is_read ? 'bg-purple-950/10' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                    >
                        {notification.actor?.avatar_url ? (
                            <img
                                src={notification.actor.avatar_url}
                                alt={notification.actor.username}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm">
                                {notification.type === 'like' && `❤️ ${notification.actor?.username} postunu beğendi.`}
                                {notification.type === 'comment' && `💬 ${notification.actor?.username} postuna yorum yaptı.`}
                                {notification.type === 'follow' && `👤 ${notification.actor?.username} seni takip etti.`}
                                {notification.type === 'follow_accepted' && `✅ ${notification.actor?.username} takip isteğini kabul etti.`}
                                {notification.type === 'story_like' && `❤️ ${notification.actor?.username} hikayeni beğendi.`}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{formatNotifTime(notification.created_at)}</p>
                        </div>
                    </div>
                ))
            )}

            {viewerGroups && (
                <StoryViewer
                    groups={viewerGroups}
                    startGroupIndex={0}
                    onClose={() => setViewerGroups(null)}
                />
            )}

        </div>
    )
}

export default NotificationsPage