import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, Bell, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function BottomNav() {
    const { user } = useAuth()
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path

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
                <Mail size={24} />
            </Link>

            <Link to={`/profil/${user?.user_metadata?.username}`} className={`flex flex-col items-center gap-1 ${isActive(`/profil/${user?.user_metadata?.username}`) ? 'text-purple-500' : 'text-gray-400'}`}>
                <User size={24} />
            </Link>

        </div>
    )
}

export default BottomNav