import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Trash2 } from 'lucide-react'

function MessagesPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [conversations, setConversations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchConversations()
    }, [])

    const fetchConversations = async () => {
        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
            .order('created_at', { ascending: false })

        if (!messages) { setLoading(false); return }

        const otherUserIds = [...new Set(messages.map((m: any) =>
            m.sender_id === user?.id ? m.receiver_id : m.sender_id
        ))]

        if (otherUserIds.length === 0) { setLoading(false); return }

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', otherUserIds)

        const convList = (profiles ?? []).map((profile: any) => {
            const lastMsg = messages.find((m: any) =>
                m.sender_id === profile.id || m.receiver_id === profile.id
            )
            return { profile, lastMsg }
        })

        setConversations(convList)
        setLoading(false)
    }

    const handleDeleteConversation = async (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation()

        await supabase
            .from('messages')
            .delete()
            .or(
                `and(sender_id.eq.${user?.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user?.id})`
            )

        setConversations((prev) => prev.filter((c) => c.profile.id !== profileId))
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800">
                <h1 className="text-white font-bold text-xl">Mesajlar</h1>
            </div>

            {loading ? (
                <p className="text-gray-400 text-center py-8">Yükleniyor...</p>
            ) : conversations.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Henüz mesajın yok.</p>
            ) : (
                <ul>
                    {conversations.map(({ profile, lastMsg }) => (
                        <li
                            key={profile.id}
                            className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 hover:bg-gray-900 cursor-pointer transition"
                            onClick={() => navigate(`/mesajlar/${profile.username}`)}
                        >
                            <div className="w-12 h-12 rounded-full bg-purple-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm">{profile.full_name || profile.username}</p>
                                <p className="text-gray-400 text-xs">@{profile.username}</p>
                                {lastMsg && (
                                    <p className="text-gray-500 text-xs mt-1 truncate">{lastMsg.content}</p>
                                )}
                            </div>
                            {/* Konuşmayı sil butonu */}
                            <button
                                onClick={(e) => handleDeleteConversation(e, profile.id)}
                                className="text-gray-600 hover:text-red-400 transition p-2 shrink-0"
                                title="Konuşmayı sil"
                            >
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default MessagesPage