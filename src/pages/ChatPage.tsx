import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { MoreVertical, Trash2, Send, Image as ImageIcon } from 'lucide-react'

function formatMessageTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

    if (isToday) return time

    const isThisYear = date.getFullYear() === now.getFullYear()
    const dateStr = date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: isThisYear ? undefined : 'numeric',
    })
    return `${dateStr} ${time}`
}

function ChatPage() {
    const { username } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [otherProfile, setOtherProfile] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isOtherTyping, setIsOtherTyping] = useState(false)

    const bottomRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<any>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        fetchData()
    }, [username])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isOtherTyping])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!otherProfile || !user?.id) return

        const roomId = [user.id, otherProfile.id].sort().join('-')

        const channel = supabase
            .channel(`chat-${roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`,
            }, (payload: any) => {
                const msg = payload.new
                if (msg.sender_id === otherProfile.id) {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === msg.id)) return prev
                        return [...prev, msg]
                    })
                    setIsOtherTyping(false)
                    supabase
                        .from('messages')
                        .update({ is_read: true })
                        .eq('id', msg.id)
                }
            })
            .on('broadcast', { event: 'typing' }, (payload: any) => {
                if (payload.payload.userId === otherProfile.id) {
                    setIsOtherTyping(true)
                    if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
                    otherTypingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000)
                }
            })
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
            if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current)
        }
    }, [otherProfile?.id, user?.id])

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

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', profile.id)
            .eq('receiver_id', user?.id)
            .eq('is_read', false)
    }

    const broadcastTyping = () => {
        if (!channelRef.current || !user?.id) return
        channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id },
        })
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value)

        broadcastTyping()
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {}, 1000)
    }

    const handleSend = async () => {
        if (!newMessage.trim() || !otherProfile || sending) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage('')

        const { data: sent } = await supabase
            .from('messages')
            .insert({
                sender_id: user?.id,
                receiver_id: otherProfile.id,
                content,
            })
            .select()
            .single()

        if (sent) setMessages((prev) => [...prev, sent])
        setSending(false)
    }

    const handleDelete = async (messageId: string) => {
        setOpenMenuId(null)
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
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-3 z-10">
                <button
                    onClick={() => navigate('/mesajlar')}
                    className="text-gray-400 hover:text-white mr-1"
                >
                    ←
                </button>

                {otherProfile.avatar_url ? (
                    <img
                        src={otherProfile.avatar_url}
                        alt={otherProfile.username}
                        className="w-9 h-9 rounded-full object-cover cursor-pointer"
                        onClick={() => navigate(`/profil/${otherProfile.username}`)}
                    />
                ) : (
                    <div
                        className="w-9 h-9 rounded-full bg-purple-500 cursor-pointer"
                        onClick={() => navigate(`/profil/${otherProfile.username}`)}
                    />
                )}

                <div
                    className="cursor-pointer flex-1 min-w-0"
                    onClick={() => navigate(`/profil/${otherProfile.username}`)}
                >
                    <p className="text-white font-bold text-sm">{otherProfile.full_name || otherProfile.username}</p>
                    {isOtherTyping ? (
                        <p className="text-purple-400 text-xs">yazıyor...</p>
                    ) : (
                        <p className="text-gray-400 text-xs">@{otherProfile.username}</p>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                        {otherProfile.avatar_url ? (
                            <img src={otherProfile.avatar_url} alt={otherProfile.username} className="w-16 h-16 rounded-full object-cover mb-2" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-purple-500 mb-2" />
                        )}
                        <p className="text-white font-bold">{otherProfile.full_name || otherProfile.username}</p>
                        <p className="text-gray-500 text-sm">@{otherProfile.username}</p>
                        <p className="text-gray-500 text-sm mt-2">Henüz mesaj yok. Bir şeyler yaz!</p>
                    </div>
                ) : (
                    messages.map((msg: any, index: number) => {
                        const isMine = msg.sender_id === user?.id
                        const prevMsg = messages[index - 1]
                        const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
                        const isLastOfGroup = !messages[index + 1] || messages[index + 1].sender_id !== msg.sender_id

                        return (
                            <div
                                key={msg.id}
                                className={`group flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isLastOfGroup ? 'mb-3' : 'mb-0.5'}`}
                            >
                                {!isMine && (
                                    <div className="w-7 h-7 shrink-0">
                                        {showAvatar && (
                                            otherProfile.avatar_url ? (
                                                <img src={otherProfile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-purple-500" />
                                            )
                                        )}
                                    </div>
                                )}

                                {isMine && (
                                    <div className="relative" ref={openMenuId === msg.id ? menuRef : null}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                            className="text-gray-600 hover:text-white transition p-1 opacity-0 group-hover:opacity-100"
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                        {openMenuId === msg.id && (
                                            <div className="absolute right-0 bottom-full mb-1 bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[120px]">
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-gray-800 transition text-left"
                                                >
                                                    <Trash2 size={13} />
                                                    Mesajı sil
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col max-w-[70%]">
                                    {msg.story_id && msg.story_preview_url && (
                                        <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                            <img
                                                src={msg.story_preview_url}
                                                alt="hikaye"
                                                className="w-10 h-14 rounded-lg object-cover border border-gray-700 shrink-0"
                                            />
                                            <span className="text-gray-500 text-xs flex items-center gap-1">
                                                <ImageIcon size={12} />
                                                {isMine ? 'Hikayesine cevap verdin' : 'Hikayene cevap verdi'}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={`px-4 py-2 rounded-2xl text-sm break-words ${
                                            isMine
                                                ? 'bg-purple-600 text-white rounded-br-sm'
                                                : 'bg-gray-800 text-white rounded-bl-sm'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                    {isLastOfGroup && (
                                        <span className={`text-[10px] text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                                            {formatMessageTime(msg.created_at)}
                                            {isMine && msg.is_read && ' · Görüldü'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}

                {isOtherTyping && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-7 h-7 shrink-0">
                            {otherProfile.avatar_url ? (
                                <img src={otherProfile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-purple-500" />
                            )}
                        </div>
                        <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-800 px-4 py-3 flex gap-3 items-end">
                <textarea
                    placeholder="Mesaj yaz..."
                    className="flex-1 bg-gray-800 text-white placeholder-gray-500 text-sm rounded-2xl px-4 py-3 resize-none outline-none max-h-32"
                    rows={1}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-bold p-3 rounded-2xl transition shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    )
}

export default ChatPage