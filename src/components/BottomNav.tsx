import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, Bell, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function BottomNav() {
    const { user } = useAuth()
    const location = useLocation()
    const [unreadCount, setUnreadCount] = useState(0)

    const isActive = (path: string) => location.pathname === path

    useEffect(() => {
        fetchUnread()

        const channel = supabase
            .channel('unread-messages-bottom')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user?.id}`,
            }, () => fetchUnread())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchUnread = async () => {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .eq('receiver_id', user?.id)
            .eq('is_read', false)

        setUnreadCount(count ?? 0)
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex items-center justify-around px-4 py-3 md:hidden">

            <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-purple-500' : 'text-gray-400'}`}>
                <Home size={24} />
            </Link>

            <Link to="/kesfet" className={`flex flex-col items-center gap-1 ${isActive('/kesfet') ? 'text-purple-500' : 'text-gray-400'}`}>
                <Compass size={24} />
            </Link>

            <Link to="/bildirimler" className={`flex flex-col items-center gap-1 ${isActive('/bildirimler') ? 'text-purple-500' : 'text-gray-400'}`}>
                <Bell size={24} />
            </Link>

            <Link to="/mesajlar" className={`flex flex-col items-center gap-1 ${isActive('/mesajlar') ? 'text-purple-500' : 'text-gray-400'}`}>
                <div className="relative">
                    <Mail size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </Link>

            <Link to={`/profil/${user?.user_metadata?.username}`} className={`flex flex-col items-center gap-1 ${isActive(`/profil/${user?.user_metadata?.username}`) ? 'text-purple-500' : 'text-gray-400'}`}>
                <User size={24} />
            </Link>

        </div>
    )
}

export default BottomNav