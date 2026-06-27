import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Ban } from 'lucide-react'

function BlockedAccountsPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [blockedUsers, setBlockedUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [unblockingId, setUnblockingId] = useState<string | null>(null)

    useEffect(() => {
        fetchBlockedUsers()
    }, [])

    const fetchBlockedUsers = async () => {
        const { data: blocks } = await supabase
            .from('blocks')
            .select('id, blocked_id, created_at')
            .eq('blocker_id', user?.id)
            .order('created_at', { ascending: false })

        if (!blocks || blocks.length === 0) {
            setLoading(false)
            return
        }

        const blockedIds = blocks.map((b: any) => b.blocked_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', blockedIds)

        const merged = blocks.map((b: any) => ({
            blockId: b.id,
            profile: (profiles ?? []).find((p: any) => p.id === b.blocked_id),
        })).filter((b: any) => b.profile)

        setBlockedUsers(merged)
        setLoading(false)
    }

    const handleUnblock = async (blockId: string, profileId: string) => {
        setUnblockingId(profileId)

        await supabase
            .from('blocks')
            .delete()
            .eq('id', blockId)

        setBlockedUsers((prev) => prev.filter((b) => b.blockId !== blockId))
        setUnblockingId(null)
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
                <h1 className="text-white font-bold text-xl">Engellenen Hesaplar</h1>
            </div>

            {loading ? (
                <p className="text-gray-400 text-center py-8 text-sm">Yükleniyor...</p>
            ) : blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                        <Ban size={24} className="text-gray-600" />
                    </div>
                    <p className="text-white font-bold">Engellenen hesap yok</p>
                    <p className="text-gray-500 text-sm mt-1">Engellediğin kişiler burada listelenir.</p>
                </div>
            ) : (
                <ul>
                    {blockedUsers.map(({ blockId, profile }) => (
                        <li key={blockId} className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="w-11 h-11 rounded-full object-cover shrink-0"
                                />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-purple-500 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm truncate">
                                    {profile.full_name || profile.username}
                                </p>
                                <p className="text-gray-400 text-xs">@{profile.username}</p>
                            </div>
                            <button
                                onClick={() => handleUnblock(blockId, profile.id)}
                                disabled={unblockingId === profile.id}
                                className="border border-gray-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-800 transition disabled:opacity-50 shrink-0"
                            >
                                {unblockingId === profile.id ? 'Kaldırılıyor...' : 'Engeli Kaldır'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default BlockedAccountsPage