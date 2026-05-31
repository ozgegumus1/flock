import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Home, Compass, Bell, Mail, User } from 'lucide-react'
function Sidebar() {
    const { user } = useAuth()
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
                    <Mail size={22} /> Mesajlar
                </Link>

               <Link to={`/profil/${user?.user_metadata?.username}`} className='flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition'>
               <User size={22} /> Profil
               </Link>
            </nav>

            {/* Profil Alanı */}
            <div className="mt-auto">
           <Link to={`/profil/${user?.user_metadata?.username}`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition cursor-pointer">
    <div className="w-10 h-10 rounded-full bg-purple-500" />
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