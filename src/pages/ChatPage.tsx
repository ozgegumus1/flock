import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Trash2 } from 'lucide-react'

function ChatPage() {
    const { username } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [otherProfile, setOtherProfile] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchData()
    }, [username])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchData = async () => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single()

        setOtherProfile(profile)

        if (!profile) { setLoading(false); return }

        const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .or(
                `and(sender_id.eq.${user?.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user?.id})`
            )
            .order('created_at', { ascending: true })

        setMessages(msgs ?? [])
        setLoading(false)

        // Okunmamış mesajları okundu yap
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', profile.id)
            .eq('receiver_id', user?.id)
            .eq('is_read', false)
    }

    const handleSend = async () => {
        if (!newMessage.trim() || !otherProfile) return

        const { data: sent } = await supabase
            .from('messages')
            .insert({
                sender_id: user?.id,
                receiver_id: otherProfile.id,
                content: newMessage.trim(),
            })
            .select()
            .single()

        if (sent) setMessages((prev) => [...prev, sent])
        setNewMessage('')
    }

    const handleDelete = async (messageId: string) => {
        await supabase
            .from('messages')
            .delete()
            .eq('id', messageId)
            .eq('sender_id', user?.id)

        setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (loading) return <div className="flex-1 p-4 text-white">Yükleniyor...</div>
    if (!otherProfile) return <div className="flex-1 p-4 text-white">Kullanıcı bulunamadı.</div>

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800 flex flex-col">
            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                <button
                    onClick={() => navigate('/mesajlar')}
                    className="text-gray-400 hover:text-white mr-1"
                >
                    ←
                </button>
                <div
                    className="w-9 h-9 rounded-full bg-purple-500 cursor-pointer"
                    onClick={() => navigate(`/profil/${otherProfile.username}`)}
                />
                <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/profil/${otherProfile.username}`)}
                >
                    <p className="text-white font-bold text-sm">{otherProfile.full_name || otherProfile.username}</p>
                    <p className="text-gray-400 text-xs">@{otherProfile.username}</p>
                </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm">Henüz mesaj yok. Bir şeyler yaz!</p>
                ) : (
                    messages.map((msg: any) => {
                        const isMine = msg.sender_id === user?.id
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                                onMouseEnter={() => isMine && setHoveredId(msg.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* Silme butonu - sadece kendi mesajlarında hover'da görünür */}
                                {isMine && hoveredId === msg.id && (
                                    <button
                                        onClick={() => handleDelete(msg.id)}
                                        className="text-gray-500 hover:text-red-400 transition p-1"
                                        title="Mesajı sil"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                                <div
                                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                                        isMine
                                            ? 'bg-purple-600 text-white rounded-br-sm'
                                            : 'bg-gray-800 text-white rounded-bl-sm'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Mesaj yazma alanı */}
            <div className="border-t border-gray-800 px-4 py-3 flex gap-3 items-end">
                <textarea
                    placeholder="Mesaj yaz..."
                    className="flex-1 bg-gray-800 text-white placeholder-gray-500 text-sm rounded-2xl px-4 py-3 resize-none outline-none max-h-32"
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    onClick={handleSend}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-3 rounded-2xl transition shrink-0"
                >
                    Gönder
                </button>
            </div>
        </div>
    )
}

export default ChatPage