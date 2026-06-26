import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Heart, MessageCircle, UserPlus, Mail, AtSign } from 'lucide-react'

interface ToggleRowProps {
    icon: React.ElementType
    label: string
    description: string
    checked: boolean
    onChange: (value: boolean) => void
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: ToggleRowProps) {
    return (
        <div className="flex items-center gap-3 px-4 py-4">
            <Icon size={20} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition shrink-0 ${checked ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
        </div>
    )
}

function NotificationSettingsPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [settings, setSettings] = useState({
        likes: true,
        comments: true,
        follows: true,
        messages: true,
        mentions: true,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        const { data } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', user?.id)
            .single()

        if (data) {
            setSettings({
                likes: data.likes,
                comments: data.comments,
                follows: data.follows,
                messages: data.messages,
                mentions: data.mentions,
            })
        } else {
            // İlk kez giriyorsa varsayılan ayarlarla satır oluştur
            await supabase
                .from('notification_settings')
                .insert({ user_id: user?.id })
        }
        setLoading(false)
    }

    const updateSetting = async (field: keyof typeof settings, value: boolean) => {
        setSettings((prev) => ({ ...prev, [field]: value }))

        await supabase
            .from('notification_settings')
            .upsert({ user_id: user?.id, ...settings, [field]: value })
    }

    if (loading) {
        return <div className="flex-1 p-4 text-white">Yükleniyor...</div>
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate('/ayarlar')}
                    className="text-white hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Bildirimler</h1>
            </div>

            <p className="text-gray-500 text-sm px-4 pt-4">
                Hangi konularda bildirim almak istediğini seç.
            </p>

            <div className="divide-y divide-gray-800 mt-2">
                <ToggleRow
                    icon={Heart}
                    label="Beğeniler"
                    description="Postlarını beğenenlerden haberdar ol"
                    checked={settings.likes}
                    onChange={(v) => updateSetting('likes', v)}
                />
                <ToggleRow
                    icon={MessageCircle}
                    label="Yorumlar"
                    description="Postlarına yorum yapanlardan haberdar ol"
                    checked={settings.comments}
                    onChange={(v) => updateSetting('comments', v)}
                />
                <ToggleRow
                    icon={UserPlus}
                    label="Takipçiler"
                    description="Seni takip eden yeni kişilerden haberdar ol"
                    checked={settings.follows}
                    onChange={(v) => updateSetting('follows', v)}
                />
                <ToggleRow
                    icon={Mail}
                    label="Mesajlar"
                    description="Yeni mesajlardan haberdar ol"
                    checked={settings.messages}
                    onChange={(v) => updateSetting('messages', v)}
                />
                <ToggleRow
                    icon={AtSign}
                    label="Bahsedilmeler"
                    description="Birisi senden bahsettiğinde haberdar ol"
                    checked={settings.mentions}
                    onChange={(v) => updateSetting('mentions', v)}
                />
            </div>
        </div>
    )
}

export default NotificationSettingsPage