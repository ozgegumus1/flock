import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import {
    User,
    Lock,
    Bell,
    Ban,
    Shield,
    HelpCircle,
    Info,
    LogOut,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react'

function SettingsPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        await supabase.auth.signOut()
    }

    const menuGroups = [
        {
            title: 'Hesap',
            items: [
                { icon: User, label: 'Profili düzenle', onClick: () => navigate('/profil-duzenle') },
                { icon: Lock, label: 'Şifreyi değiştir', onClick: () => navigate('/ayarlar/sifre') },
            ],
        },
        {
            title: 'Tercihler',
            items: [
                { icon: Bell, label: 'Bildirimler', onClick: () => navigate('/ayarlar/bildirimler') },
                { icon: Shield, label: 'Gizlilik', onClick: () => navigate('/ayarlar/gizlilik') },
                { icon: Ban, label: 'Engellenen hesaplar', onClick: () => navigate('/ayarlar/engellenenler') },
            ],
        },
        {
            title: 'Destek',
            items: [
                { icon: HelpCircle, label: 'Yardım merkezi', onClick: () => navigate('/ayarlar/yardim') },
                { icon: Info, label: 'Hakkında', onClick: () => navigate('/ayarlar/hakkinda') },
            ],
        },
    ]

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Ayarlar</h1>
            </div>

            <div
                className="flex items-center gap-3 p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-900/50 transition"
                onClick={() => navigate(`/profil/${user?.user_metadata?.username}`)}
            >
                <div className="w-12 h-12 rounded-full bg-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{user?.user_metadata?.username}</p>
                    <p className="text-gray-400 text-xs">Profili görüntüle</p>
                </div>
                <ChevronRight size={18} className="text-gray-500" />
            </div>

            {menuGroups.map((group) => (
                <div key={group.title} className="border-b border-gray-800">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wide px-4 pt-4 pb-1">
                        {group.title}
                    </p>
                    {group.items.map((item) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.label}
                                onClick={item.onClick}
                                className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-900/50 transition text-left"
                            >
                                <Icon size={20} className="text-gray-400 shrink-0" />
                                <span className="text-white text-sm flex-1">{item.label}</span>
                                <ChevronRight size={16} className="text-gray-600" />
                            </button>
                        )
                    })}
                </div>
            ))}

            <div className="border-b border-gray-800">
                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-900/50 transition text-left"
                >
                    <LogOut size={20} className="text-gray-400 shrink-0" />
                    <span className="text-white text-sm flex-1">Çıkış yap</span>
                </button>
            </div>

            <div className="p-4">
                <button
                    onClick={() => navigate('/ayarlar/hesabi-sil')}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-red-900/50 hover:bg-red-950/20 transition text-left"
                >
                    <AlertTriangle size={20} className="text-red-400 shrink-0" />
                    <span className="text-red-400 text-sm font-medium flex-1">Hesabımı sil</span>
                </button>
            </div>

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

export default SettingsPage