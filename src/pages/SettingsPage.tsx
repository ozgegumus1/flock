import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
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

    const handleLogout = async () => {
        const confirmed = window.confirm('Çıkış yapmak istediğine emin misin?')
        if (!confirmed) return
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
            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Ayarlar</h1>
            </div>

            {/* Hesap özeti */}
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

            {/* Menü grupları */}
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

            {/* Çıkış yap */}
            <div className="border-b border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-900/50 transition text-left"
                >
                    <LogOut size={20} className="text-gray-400 shrink-0" />
                    <span className="text-white text-sm flex-1">Çıkış yap</span>
                </button>
            </div>

            {/* Tehlikeli bölge */}
            <div className="p-4">
                <button
                    onClick={() => navigate('/ayarlar/hesabi-sil')}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-red-900/50 hover:bg-red-950/20 transition text-left"
                >
                    <AlertTriangle size={20} className="text-red-400 shrink-0" />
                    <span className="text-red-400 text-sm font-medium flex-1">Hesabımı sil</span>
                </button>
            </div>
        </div>
    )
}

export default SettingsPage