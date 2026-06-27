import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Lock, Unlock } from 'lucide-react'

function PrivacySettingsPage() {
    const navigate = useNavigate()
    const { user, refreshProfile } = useAuth()
    const [isPrivate, setIsPrivate] = useState(false)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('is_private')
            .eq('id', user?.id)
            .single()

        setIsPrivate(data?.is_private ?? false)
        setLoading(false)
    }

    const handleToggle = async () => {
        setUpdating(true)
        const newValue = !isPrivate

        await supabase
            .from('profiles')
            .update({ is_private: newValue })
            .eq('id', user?.id)

        setIsPrivate(newValue)
        refreshProfile?.()
        setUpdating(false)
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
                <h1 className="text-white font-bold text-xl">Gizlilik</h1>
            </div>

            {/* Hesap gizliliği */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
                {isPrivate ? (
                    <Lock size={22} className="text-purple-400 shrink-0" />
                ) : (
                    <Unlock size={22} className="text-gray-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Gizli hesap</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                        {isPrivate
                            ? 'Sadece onayladığın takipçiler postlarını görebilir.'
                            : 'Herkes postlarını görebilir.'}
                    </p>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={updating}
                    className={`relative w-11 h-6 rounded-full transition shrink-0 disabled:opacity-50 ${isPrivate ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
            </div>

            {/* Bilgilendirme */}
            <div className="px-4 py-4">
                <p className="text-gray-500 text-xs leading-relaxed">
                    {isPrivate
                        ? 'Hesabın şu anda gizli. Yeni takipçi istekleri "Bildirimler" sayfasında görünecek ve onaylaman gerekecek. Mevcut takipçilerin hâlâ postlarını görebilir.'
                        : 'Hesabın şu anda herkese açık. Gizli yaparsan, yeni takip isteyenlerin önce onayını almanı isteyeceğiz.'}
                </p>
            </div>
        </div>
    )
}

export default PrivacySettingsPage