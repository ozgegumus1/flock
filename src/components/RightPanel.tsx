import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function RightPanel() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const location = useLocation()
    const [suggestions, setSuggestions] = useState<any[]>([])

    const showTrending = location.pathname === '/kesfet'

    useEffect(() => {
        fetchSuggestions()
    }, [])

    const fetchSuggestions = async () => {
        const { data: followData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user?.id)

        const followedIds = new Set((followData ?? []).map((f: any) => f.following_id))

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_private')
            .neq('id', user?.id)
            .limit(10)

        const filtered = (profiles ?? []).filter((p: any) => !followedIds.has(p.id))
        setSuggestions(filtered.slice(0, 3))
    }

    const handleFollow = async (e: React.MouseEvent, profile: any) => {
        e.stopPropagation()

        const status = profile.is_private ? 'pending' : 'accepted'

        await supabase
            .from('follows')
            .insert({ follower_id: user?.id, following_id: profile.id, status })

        showToast(
            profile.is_private ? 'Takip isteği gönderildi' : 'Takip etmeye başladın',
            'success'
        )

        setSuggestions((prev) => prev.filter((p) => p.id !== profile.id))
    }

    return (
        <div className="w-80 min-h-screen bg-gray-900 flex flex-col p-4">
            {showTrending && (
                <div className="bg-gray-800 rounded-2xl p-4 mb-4">
                    <h2 className="text-white font-bold text-xl mb-4">Gündemde</h2>
                    <div className="flex flex-col gap-3">
                        <div className="cursor-pointer hover:bg-gray-700 p-2 rounded-xl transition">
                            <p className="text-gray-400 text-xs">Yazılım • Gündemde</p>
                            <p className="text-white font-bold">React</p>
                            <p className="text-gray-400 text-xs">1.240 post</p>
                        </div>
                        <div className="cursor-pointer hover:bg-gray-700 p-2 rounded-xl transition">
                            <p className="text-gray-400 text-xs">Yazılım • Gündemde</p>
                            <p className="text-white font-bold">#Typescript</p>
                            <p className="text-gray-400 text-xs">890 post</p>
                        </div>
                        <div className="cursor-pointer hover:bg-gray-700 p-2 rounded-xl transition">
                            <p className="text-gray-400 text-xs">Yazılım • Gündemde</p>
                            <p className="text-white font-bold">#Javascript</p>
                            <p className="text-gray-400 text-xs">2.100 post</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 rounded-2xl p-4">
                <h2 className="text-white font-bold text-xl mb-4">Tanıyor olabilirsin</h2>
                <div className="flex flex-col gap-3">
                    {suggestions.length === 0 ? (
                        <p className="text-gray-400 text-sm">Yeni öneri yok.</p>
                    ) : (
                        suggestions.map((profile: any) => (
                            <div
                                key={profile.id}
                                className="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2 rounded-xl transition"
                                onClick={() => navigate(`/profil/${profile.username}`)}
                            >
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.username} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">
                                        {profile.full_name || profile.username}
                                    </p>
                                    <p className="text-gray-400 text-xs">@{profile.username}</p>
                                </div>
                                <button
                                    onClick={(e) => handleFollow(e, profile)}
                                    className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full hover:bg-gray-200 transition shrink-0"
                                >
                                    {profile.is_private ? 'İstek Gönder' : 'Takip Et'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default RightPanel