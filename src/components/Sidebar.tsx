import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Home, Compass, Bell, Mail, User, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

function Sidebar() {
    const { user, profile } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchUnread()

        // Gerçek zamanlı güncelleme
        const channel = supabase
            .channel('unread-messages')
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
        <div className="w-64 min-h-screen bg-gray-900 flex flex-col p-4">

            {/* Logo */}
            <div className="text-purple-500 text-3xl font-bold mb-8 px-2">
                Flock
            </div>

            {/* Navigasyon */}
            <nav className="flex flex-col gap-2">
                <Link to="/" className="flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition">
                    <Home size={22} /> Ana Sayfa
                </Link>

                <Link to="/kesfet" className="flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition">
                    <Compass size={22} /> Keşfet
                </Link>

                <Link to="/bildirimler" className="flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition">
                    <Bell size={22} /> Bildirimler
                </Link>

                <Link to="/mesajlar" className="flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition">
                    <div className="relative">
                        <Mail size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    Mesajlar
                </Link>

               <Link to={`/profil/${user?.user_metadata?.username}`} className='flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition'>
               <User size={22} /> Profil
               </Link>

               <Link to="/ayarlar" className='flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition'>
               <Settings size={22} /> Ayarlar
               </Link>
            </nav>

            {/* Profil Alanı */}
            <div className="mt-auto">
           <Link to={`/profil/${user?.user_metadata?.username}`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition cursor-pointer">
    {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
    ) : (
        <div className="w-10 h-10 rounded-full bg-purple-500" />
    )}
    <div>
        <p className="text-white font-semibold text-sm">{user?.user_metadata?.username}</p>
        <p className="text-gray-400 text-xs">@{user?.user_metadata?.username}</p>
    </div>
</Link>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut()
                    }}
                    className="w-full mt-2 text-gray-400 hover:text-red-400 text-sm py-2 rounded-xl hover:bg-gray-800 transition">
                    Çıkış Yap
                </button>
            </div>
        </div>
    )
}

export default Sidebar