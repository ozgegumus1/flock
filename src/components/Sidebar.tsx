import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'
import { Home, Compass, Bell, Mail, User, Settings, LogOut, Bookmark } from 'lucide-react'
import { useState } from 'react'

function Sidebar() {
    const { user, unreadMessages, unreadNotifications } = useAuth()
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        await supabase.auth.signOut()
    }

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

               <Link to="/kaydedilenler" className='flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition'>
               <Bookmark size={22} /> Kaydedilenler
               </Link>

               <Link to="/ayarlar" className='flex items-center gap-3 text-white px-3 py-3 rounded-xl hover:bg-gray-800 transition'>
               <Settings size={22} /> Ayarlar
               </Link>

               <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-3 text-gray-400 hover:text-red-400 px-3 py-3 rounded-xl hover:bg-gray-800 transition text-left"
               >
                    <LogOut size={22} /> Çıkış Yap
               </button>
            </nav>

            {/* Çıkış onay modalı */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xs p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                            <LogOut size={24} className="text-red-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">Çıkış yap</h3>
                        <p className="text-gray-400 text-sm mb-6">Hesabından çıkış yapmak istediğine emin misin?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                disabled={loggingOut}
                                className="flex-1 border border-gray-700 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                            >
                                {loggingOut ? 'Çıkılıyor...' : 'Çıkış Yap'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Sidebar