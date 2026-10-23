import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Bell, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

function BottomNav() {
    const { user, profile, unreadMessages, unreadNotifications } = useAuth()
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path
    const profilePath = `/profil/${user?.user_metadata?.username}`

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex items-center justify-around px-4 py-3 md:hidden">

            <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-purple-500' : 'text-gray-400'}`}>
                <Home size={24} />
            </Link>

            <Link to="/yeni-soru" className={`flex flex-col items-center gap-1 ${isActive('/yeni-soru') ? 'text-purple-500' : 'text-gray-400'}`}>
                <PlusCircle size={24} />
            </Link>

            <Link to="/bildirimler" className={`flex flex-col items-center gap-1 ${isActive('/bildirimler') ? 'text-purple-500' : 'text-gray-400'}`}>
                <div className="relative">
                    <Bell size={24} />
                    {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                    )}
                </div>
            </Link>

            <Link to="/mesajlar" className={`flex flex-col items-center gap-1 ${isActive('/mesajlar') ? 'text-purple-500' : 'text-gray-400'}`}>
                <div className="relative">
                    <Mail size={24} />
                    {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                    )}
                </div>
            </Link>

            <Link to={profilePath} className={`flex flex-col items-center gap-1 ${isActive(profilePath) ? 'text-purple-500' : 'text-gray-400'}`}>
                <Avatar src={profile?.avatar_url} gender={profile?.gender} size={32} alt="profil" />
            </Link>

        </div>
    )
}

export default BottomNav