import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function NotificationsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<any[]>([])

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*, actor:profiles!notifications_actor_id_fkey(username)')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })

        if (data) setNotifications(data)
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">

            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800">
                <h1 className="text-white font-bold text-xl">Bildirimler</h1>
            </div>

            {/* Bildirimler */}
            {notifications.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Henüz bildirim yok.</p>
            ) : (
                notifications.map((notification: any) => (
                    <div
                        key={notification.id}
                        className="flex items-center gap-3 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition cursor-pointer"
                        onClick={() => navigate(`/profil/${notification.actor?.username}`)}
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
                        <p className="text-white text-sm">
                            {notification.type === 'like' && `❤️ ${notification.actor?.username} postunu beğendi.`}
                            {notification.type === 'follow' && `👤 ${notification.actor?.username} seni takip etti.`}
                        </p>
                    </div>
                ))
            )}

        </div>
    )
}

export default NotificationsPage