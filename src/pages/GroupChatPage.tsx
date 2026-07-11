import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { convertIfHeic, resizeImage } from '../utils/imageHelpers'
import { Send, Image as ImageIcon, X, Users } from 'lucide-react'

function formatMessageTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return time
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + time
}

function GroupChatPage() {
    const { groupId } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [group, setGroup] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [showMembers, setShowMembers] = useState(false)

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [converting, setConverting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const bottomRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<any>(null)

    useEffect(() => {
        fetchData()
    }, [groupId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (!groupId) return

        const channel = supabase
            .channel(`group-${groupId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${groupId}`,
            }, (payload: any) => {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === payload.new.id)) return prev
                    return [...prev, payload.new]
                })
            })
            .subscribe()

        channelRef.current = channel
        return () => { supabase.removeChannel(channel) }
    }, [groupId])

    const fetchData = async () => {
        const { data: groupData } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single()

        setGroup(groupData)

        const { data: memberRows } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId)

        const memberIds = (memberRows ?? []).map((m: any) => m.user_id)
        if (memberIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', memberIds)
            setMembers(profiles ?? [])
        }

        const { data: msgs } = await supabase
            .from('group_messages')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true })

        setMessages(msgs ?? [])
        setLoading(false)
    }

    const getSenderProfile = (senderId: string) => members.find((m) => m.id === senderId)

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setConverting(true)
        try {
            const heicConverted = await convertIfHeic(file)
            const finalFile = await resizeImage(heicConverted, 1200)
            setImageFile(finalFile)
            setImagePreview(URL.createObjectURL(finalFile))
        } catch (err) {
            console.error('Resim dönüştürme hatası:', err)
        } finally {
            setConverting(false)
        }
    }

    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSend = async () => {
        if ((!newMessage.trim() && !imageFile) || sending) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage('')

        let imageUrl: string | null = null

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop()
            const filePath = `${user?.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, imageFile)

            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(filePath)
                imageUrl = urlData.publicUrl
            }
        }

        const { data: sent } = await supabase
            .from('group_messages')
            .insert({
                group_id: groupId,
                sender_id: user?.id,
                content,
                image_url: imageUrl,
            })
            .select()
            .single()

        if (sent) setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
        handleRemoveImage()
        setSending(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (loading) return <div className="flex-1 p-4 text-white">Yükleniyor...</div>
    if (!group) return <div className="flex-1 p-4 text-white">Grup bulunamadı.</div>

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800 flex flex-col">
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-3 z-10">
                <button onClick={() => navigate('/mesajlar')} className="text-gray-400 hover:text-white mr-1">←</button>
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowMembers(true)}>
                    <p className="text-white font-bold text-sm truncate">{group.name}</p>
                    <p className="text-gray-400 text-xs">{members.length} üye</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">Henüz mesaj yok. İlk mesajı sen yaz!</p>
                ) : (
                    messages.map((msg: any, index: number) => {
                        const isMine = msg.sender_id === user?.id
                        const sender = getSenderProfile(msg.sender_id)
                        const prevMsg = messages[index - 1]
                        const showSenderInfo = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                                {!isMine && (
                                    <div className="w-7 h-7 shrink-0">
                                        {showSenderInfo && (
                                            sender?.avatar_url ? (
                                                <img src={sender.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-purple-500" />
                                            )
                                        )}
                                    </div>
                                )}
                                <div className="flex flex-col max-w-[70%]">
                                    {showSenderInfo && (
                                        <span className="text-gray-500 text-xs mb-0.5 ml-1">{sender?.username ?? 'Bilinmeyen'}</span>
                                    )}
                                    {msg.image_url && (
                                        <img src={msg.image_url} alt="fotoğraf" className="rounded-2xl max-h-64 max-w-full object-cover mb-1 border border-gray-800" />
                                    )}
                                    {msg.content && (
                                        <div className={`px-4 py-2 rounded-2xl text-sm break-words ${isMine ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-gray-800 text-white rounded-bl-sm'}`}>
                                            {msg.content}
                                        </div>
                                    )}
                                    <span className={`text-[10px] text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                                        {formatMessageTime(msg.created_at)}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-800 px-4 py-3">
                {imagePreview && (
                    <div className="relative w-fit mb-2">
                        <img src={imagePreview} alt="önizleme" className="h-20 rounded-xl border border-gray-700" />
                        <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-gray-900 border border-gray-700 text-white rounded-full p-1 hover:bg-gray-800 transition">
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div className="flex gap-3 items-end">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={converting}
                        className="text-gray-400 hover:text-purple-400 transition p-2.5 shrink-0 disabled:opacity-50"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleImageChange} />
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
                        disabled={(!newMessage.trim() && !imageFile) || sending}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-bold p-3 rounded-2xl transition shrink-0"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {showMembers && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={() => setShowMembers(false)}>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <h3 className="text-white font-bold">Üyeler ({members.length})</h3>
                            <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="overflow-y-auto px-2 py-2">
                            {members.map((m) => (
                                <div
                                    key={m.id}
                                    onClick={() => { setShowMembers(false); navigate(`/profil/${m.username}`) }}
                                    className="flex items-center gap-3 px-2 py-2.5 hover:bg-gray-800 rounded-xl cursor-pointer transition"
                                >
                                    {m.avatar_url ? (
                                        <img src={m.avatar_url} alt={m.username} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-purple-500" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{m.full_name || m.username}</p>
                                        <p className="text-gray-500 text-xs truncate">@{m.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GroupChatPage