import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, MessageCircle, MoreVertical, Search, Trash2 } from 'lucide-react'
import { supabase } from '../supabase'
import ConfirmModal from '../components/ConfirmModal'
import Avatar from '../components/Avatar'
import { useAuth } from '../context/AuthContext'

function formatListTime(dateString: string): string {
    const date = new Date(dateString)
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffMin < 1) return 'şimdi'
    if (diffMin < 60) return `${diffMin}dk`
    if (diffHour < 24) return `${diffHour}sa`
    if (diffDay < 7) return `${diffDay}g`

    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function MessagesPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [conversations, setConversations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [blockTarget, setBlockTarget] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchConversations()

        const channel = supabase
            .channel('messages-list')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user?.id}`,
            }, () => fetchConversations())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
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

        if (otherUserIds.length === 0) { setConversations([]); setLoading(false); return }

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, gender')
            .in('id', otherUserIds)

        const list = (profiles ?? []).map((profile: any) => {
            const lastMsg = messages.find((m: any) =>
                m.sender_id === profile.id || m.receiver_id === profile.id
            )
            const unreadCount = messages.filter((m: any) =>
                m.sender_id === profile.id &&
                m.receiver_id === user?.id &&
                m.is_read === false
            ).length

            return { profile, lastMsg, unreadCount }
        })

        list.sort((a: any, b: any) => {
            const aTime = a.lastMsg ? new Date(a.lastMsg.created_at).getTime() : 0
            const bTime = b.lastMsg ? new Date(b.lastMsg.created_at).getTime() : 0
            return bTime - aTime
        })

        setConversations(list)
        setLoading(false)
    }

    const openMenu = (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation()
        setOpenMenuId(openMenuId === profileId ? null : profileId)
    }

    const askBlock = (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation()
        setOpenMenuId(null)
        setBlockTarget(profileId)
    }

    const askDelete = (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation()
        setOpenMenuId(null)
        setDeleteTarget(profileId)
    }

    const confirmBlock = async () => {
        const profileId = blockTarget
        setBlockTarget(null)
        if (!profileId) return

        await supabase.rpc('block_user', { target_user_id: profileId })
        setConversations((prev) => prev.filter((c) => c.profile.id !== profileId))
    }

    const confirmDelete = async () => {
        const profileId = deleteTarget
        setDeleteTarget(null)
        if (!profileId) return

        await supabase
            .from('messages')
            .delete()
            .or(
                `and(sender_id.eq.${user?.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user?.id})`
            )

        setConversations((prev) => prev.filter((c) => c.profile.id !== profileId))
    }

    const q = searchQuery.trim().toLowerCase()
    const filtered = conversations.filter(({ profile }) =>
        profile.username.toLowerCase().includes(q) ||
        (profile.full_name ?? '').toLowerCase().includes(q)
    )

    return (
        <div className="min-h-screen border-x border-gray-800">

            <div className="sticky top-0 z-10 bg-gray-950/85 backdrop-blur px-4 pt-4 pb-3 border-b border-gray-800">
                <h1 className="text-ink font-bold text-2xl">Mesajlar</h1>

                {conversations.length > 0 && (
                    <div className="relative mt-3">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Kişi ara"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-ink placeholder-gray-500 outline-none focus:border-purple-500 transition"
                        />
                    </div>
                )}
            </div>

            {loading ? (
                <div className="p-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-gray-800 shrink-0" />
                            <div className="flex-1">
                                <div className="h-3 bg-gray-800 rounded w-28 mb-2" />
                                <div className="h-2.5 bg-gray-800 rounded w-44" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                        <MessageCircle size={26} className="text-purple-500" />
                    </div>
                    <p className="text-ink font-bold text-lg">Henüz mesajın yok</p>
                    <p className="text-gray-500 text-sm mt-1 max-w-xs">
                        Bir kullanıcının profiline girip mesaj göndererek sohbet başlatabilirsin.
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-gray-400 text-center py-10 text-sm">"{searchQuery}" için sonuç bulunamadı.</p>
            ) : (
                <ul>
                    {filtered.map(({ profile, lastMsg, unreadCount }) => {
                        const unread = unreadCount > 0

                        return (
                            <li
                                key={profile.id}
                                className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-800 cursor-pointer transition hover:bg-gray-900/60 ${unread ? 'bg-purple-900/40' : ''}`}
                                onClick={() => navigate(`/mesajlar/${profile.username}`)}
                            >
                                <Avatar src={profile.avatar_url} gender={profile.gender} size={52} alt={profile.username} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm truncate ${unread ? 'text-ink font-bold' : 'text-ink font-semibold'}`}>
                                            {profile.full_name || profile.username}
                                        </p>
                                        <div className="flex-1" />
                                        {lastMsg && (
                                            <span className={`text-xs shrink-0 ${unread ? 'text-purple-500 font-bold' : 'text-gray-500'}`}>
                                                {formatListTime(lastMsg.created_at)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className={`text-sm truncate flex-1 ${unread ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                                            {lastMsg
                                                ? `${lastMsg.sender_id === user?.id ? 'Sen: ' : ''}${lastMsg.content || 'Fotoğraf'}`
                                                : 'Henüz mesaj yok'}
                                        </p>
                                        {unread && (
                                            <span className="bg-purple-600 text-white text-[11px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center shrink-0">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="relative shrink-0" ref={openMenuId === profile.id ? menuRef : null}>
                                    <button
                                        onClick={(e) => openMenu(e, profile.id)}
                                        className="text-gray-500 hover:text-ink transition p-2 rounded-full hover:bg-gray-800"
                                        aria-label="Sohbet seçenekleri"
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {openMenuId === profile.id && (
                                        <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden z-20 min-w-44 p-1.5">
                                            <button
                                                onClick={(e) => askBlock(e, profile.id)}
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-ink hover:bg-gray-800 transition text-left"
                                            >
                                                <Ban size={15} />
                                                Engelle
                                            </button>
                                            <button
                                                onClick={(e) => askDelete(e, profile.id)}
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-gray-800 transition text-left"
                                            >
                                                <Trash2 size={15} />
                                                Sohbeti sil
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            <ConfirmModal
                open={blockTarget !== null}
                title="Bu kullanıcıyı engellemek istediğine emin misin?"
                message="Birbirinizin içeriğini göremeyeceksiniz."
                confirmText="Engelle"
                danger
                onConfirm={confirmBlock}
                onCancel={() => setBlockTarget(null)}
            />

            <ConfirmModal
                open={deleteTarget !== null}
                title="Bu sohbeti silmek istediğine emin misin?"
                message="Tüm mesajlar silinir ve geri alınamaz."
                confirmText="Sil"
                danger
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}

export default MessagesPage