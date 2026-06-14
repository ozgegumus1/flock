import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

function RightPanel() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [following, setFollowing] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchSuggestions()
    }, [])

    const fetchSuggestions = async () => {
        // Zaten takip ettiklerini al
        const { data: followData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user?.id)

        const followingIds = new Set((followData ?? []).map((f: any) => f.following_id))
        setFollowing(followingIds)

        // Kendisi ve takip ettikleri hariç kullanıcıları getir
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .neq('id', user?.id)
            .limit(5)

        // Takip edilmeyenleri filtrele
        const filtered = (profiles ?? []).filter((p: any) => !followingIds.has(p.id))
        setSuggestions(filtered.slice(0, 3))
    }

    const handleFollow = async (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation()

        await supabase
            .from('follows')
            .insert({ follower_id: user?.id, following_id: profileId })

        setFollowing((prev) => new Set([...prev, profileId]))
        setSuggestions((prev) => prev.filter((p) => p.id !== profileId))
    }

    return (
        <div className="w-80 min-h-screen bg-gray-900 flex flex-col p-4">
            {/* Gündemde */}
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

            {/* Tanıyor olabilirsin */}
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
                                <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">
                                        {profile.full_name || profile.username}
                                    </p>
                                    <p className="text-gray-400 text-xs">@{profile.username}</p>
                                </div>
                                <button
                                    onClick={(e) => handleFollow(e, profile.id)}
                                    className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full hover:bg-gray-200 transition shrink-0"
                                >
                                    Takip Et
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