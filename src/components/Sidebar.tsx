import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Home, Compass, Bell, Mail, User, Settings } from 'lucide-react'

function Sidebar() {
    const { user, unreadMessages, unreadNotifications } = useAuth()

    return (
        <div className="w-64 min-h-screen bg-gray-900 flex flex-col p-4">

            {/* Logo */}
            <Link to="/" className="text-purple-500 text-3xl font-bold mb-8 px-2 w-fit hover:text-purple-400 transition">
                Flock
            </Link>

            {/* Navigasyon */}
            <nav className="flex flex-col gap-2">
                <Link to="/" className="flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition">
                    <Home size={22} /> Ana Sayfa
                </Link>

                <Link to="/kesfet" className="flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition">
                    <Compass size={22} /> Keşfet
                </Link>

                <Link to="/bildirimler" className="flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition">
                    <div className="relative">
                        <Bell size={22} />
                        {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </span>
                        )}
                    </div>
                    Bildirimler
                </Link>

                <Link to="/mesajlar" className="flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition">
                    <div className="relative">
                        <Mail size={22} />
                        {unreadMessages > 0 && (
                            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadMessages > 9 ? '9+' : unreadMessages}
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

        </div>
    )
}

export default Sidebar