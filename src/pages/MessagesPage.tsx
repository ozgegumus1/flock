import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { StoryViewer } from '../components/StoryViewer'
import { MoreVertical, Trash2, Search, Pin, PinOff, BellOff, Bell, Ban, Users, Plus } from 'lucide-react'

function formatListTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
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
    const menuRef = useRef<HTMLDivElement>(null)

    // Hikaye halkası + görüntüleyici
    const [storiesByUser, setStoriesByUser] = useState<Record<string, any[]>>({})
    const [viewerGroups, setViewerGroups] = useState<any[] | null>(null)
    const [myGroups, setMyGroups] = useState<any[]>([])

    useEffect(() => {
        fetchConversations()
        fetchMyGroups()

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

    const fetchMyGroups = async () => {
        const { data: memberRows } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user?.id)

        const groupIds = (memberRows ?? []).map((m: any) => m.group_id)
        if (groupIds.length === 0) { setMyGroups([]); return }

        const { data: groups } = await supabase
            .from('groups')
            .select('*')
            .in('id', groupIds)

        const groupsWithLastMsg = await Promise.all(
            (groups ?? []).map(async (g: any) => {
                const { data: lastMsg } = await supabase
                    .from('group_messages')
                    .select('content, created_at, image_url')
                    .eq('group_id', g.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                return { ...g, lastMsg: lastMsg ?? null }
            })
        )

        groupsWithLastMsg.sort((a, b) => {
            const aTime = a.lastMsg ? new Date(a.lastMsg.created_at).getTime() : new Date(a.created_at).getTime()
            const bTime = b.lastMsg ? new Date(b.lastMsg.created_at).getTime() : new Date(b.created_at).getTime()
            return bTime - aTime
        })

        setMyGroups(groupsWithLastMsg)
    }

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
            .select('id, username, full_name, avatar_url')
            .in('id', otherUserIds)

        const { data: settings } = await supabase
            .from('conversation_settings')
            .select('*')
            .eq('user_id', user?.id)
            .in('other_user_id', otherUserIds)

        const settingsMap: Record<string, any> = {}
        ;(settings ?? []).forEach((s: any) => { settingsMap[s.other_user_id] = s })

        const convList = (profiles ?? []).map((profile: any) => {
            const lastMsg = messages.find((m: any) =>
                m.sender_id === profile.id || m.receiver_id === profile.id
            )
            const unreadCount = messages.filter((m: any) =>
                m.sender_id === profile.id &&
                m.receiver_id === user?.id &&
                m.is_read === false
            ).length

            const setting = settingsMap[profile.id]

            return {
                profile,
                lastMsg,
                unreadCount,
                isPinned: setting?.is_pinned ?? false,
                isMuted: setting?.is_muted ?? false,
            }
        })

        convList.sort((a: any, b: any) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
            const aTime = a.lastMsg ? new Date(a.lastMsg.created_at).getTime() : 0
            const bTime = b.lastMsg ? new Date(b.lastMsg.created_at).getTime() : 0
            return bTime - aTime
        })

        setConversations(convList)
        setLoading(false)

        fetchActiveStories(otherUserIds)
    }

    const fetchActiveStories = async (userIds: string[]) => {
        const { data: stories } = await supabase
            .from('stories')
            .select('*')
            .in('user_id', userIds)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true })

        const grouped: Record<string, any[]> = {}
        ;(stories ?? []).forEach((s: any) => {
            if (!grouped[s.user_id]) grouped[s.user_id] = []
            grouped[s.user_id].push(s)
        })

        setStoriesByUser(grouped)
    }

    const openStoryViewer = (e: React.MouseEvent, profile: any) => {
        e.stopPropagation()
        const stories = storiesByUser[profile.id]
        if (!stories || stories.length === 0) return

        setViewerGroups([{
            userId: profile.id,
            username: profile.username,
            avatarUrl: profile.avatar_url,
            stories,
            hasUnseen: false,
        }])
    }

    const updateSetting = async (otherUserId: string, field: 'is_pinned' | 'is_muted', value: boolean) => {
        await supabase
            .from('conversation_settings')
            .upsert(
                { user_id: user?.id, other_user_id: otherUserId, [field]: value },
                { onConflict: 'user_id,other_user_id' }
            )
    }

    const handleTogglePin = async (e: React.MouseEvent, profileId: string, current: boolean) => {
        e.stopPropagation()
        setOpenMenuId(null)
        await updateSetting(profileId, 'is_pinned', !current)
        setConversations((prev) => {
            const updated = prev.map((c) =>
                c.profile.id === profileId ? { ...c, isPinned: !current } : c
            )
            return [...updated].sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
                const aTime = a.lastMsg ? new Date(a.lastMsg.created_at).getTime() : 0
                const bTime = b.lastMsg ? new Date(b.lastMsg.created_at).getTime() : 0
                return bTime - aTime
            })
        })
    }

    const handleToggleMute = async (e: React.MouseEvent, profileId: string, current: boolean) => {
        e.stopPropagation()
        setOpenMenuId(null)
        await updateSetting(profileId, 'is_muted', !current)
        setConversations((prev) =>
            prev.map((c) => (c.profile.id === profileId ? { ...c, isMuted: !current } : c))
        )
    }

    const handleBlock = async (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation()
        setOpenMenuId(null)

        const confirmed = window.confirm('Bu kullanıcıyı engellemek istediğine emin misin? Birbirinizin içeriğini göremeyeceksiniz.')
        if (!confirmed) return

        await supabase.rpc('block_user', { target_user_id: profileId })

        setConversations((prev) => prev.filter((c) => c.profile.id !== profileId))
    }

    const handleDeleteConversation = async (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation()
        setOpenMenuId(null)

        await supabase
            .from('messages')
            .delete()
            .or(
                `and(sender_id.eq.${user?.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user?.id})`
            )

        setConversations((prev) => prev.filter((c) => c.profile.id !== profileId))
    }

    const filteredConversations = conversations.filter(({ profile }) => {
        const q = searchQuery.toLowerCase()
        return (
            profile.username.toLowerCase().includes(q) ||
            (profile.full_name ?? '').toLowerCase().includes(q)
        )
    })

    const totalUnread = conversations.reduce((sum, c) => sum + (c.isMuted ? 0 : c.unreadCount), 0)

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 z-10">
                <div className="flex items-center justify-between">
                    <h1 className="text-white font-bold text-xl">Mesajlar</h1>
                    <div className="flex items-center gap-2">
                        {totalUnread > 0 && (
                            <span className="bg-purple-600 text-white text-xs font-bold rounded-full px-2.5 py-1">
                                {totalUnread} yeni
                            </span>
                        )}
                        <button
                            onClick={() => navigate('/grup-olustur')}
                            className="text-purple-400 hover:text-purple-300 transition p-1.5 rounded-full hover:bg-gray-900"
                            title="Yeni grup"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative mt-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Mesajlarda ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col gap-1 p-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-gray-800 shrink-0" />
                            <div className="flex-1">
                                <div className="h-3 bg-gray-800 rounded w-24 mb-2" />
                                <div className="h-2.5 bg-gray-800 rounded w-40" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (conversations.length === 0 && myGroups.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                        <Search size={24} className="text-gray-600" />
                    </div>
                    <p className="text-white font-bold">Henüz mesajın yok</p>
                    <p className="text-gray-500 text-sm mt-1">Birine mesaj göndererek konuşmaya başla.</p>
                </div>
            ) : (filteredConversations.length === 0 && myGroups.length === 0) ? (
                <p className="text-gray-400 text-center py-8 text-sm">"{searchQuery}" için sonuç bulunamadı.</p>
            ) : (
                <ul>
                    {myGroups
                        .filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((g) => (
                        <li
                            key={g.id}
                            className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 cursor-pointer hover:bg-gray-900 transition"
                            onClick={() => navigate(`/gruplar/${g.id}`)}
                        >
                            <div className="w-[52px] h-[52px] rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                <Users size={22} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{g.name}</p>
                                <p className="text-gray-500 text-sm mt-0.5 truncate">
                                    {g.lastMsg ? (g.lastMsg.image_url ? '📷 Fotoğraf' : g.lastMsg.content) : 'Henüz mesaj yok'}
                                </p>
                            </div>
                        </li>
                    ))}

                    {filteredConversations.map(({ profile, lastMsg, unreadCount, isPinned, isMuted }) => {
                        const hasStory = !!storiesByUser[profile.id]?.length

                        return (
                        <li
                            key={profile.id}
                            className={`relative flex items-center gap-3 px-4 py-4 border-b border-gray-800 cursor-pointer transition ${unreadCount > 0 && !isMuted ? 'bg-purple-950/10' : 'hover:bg-gray-900'}`}
                            onClick={() => navigate(`/mesajlar/${profile.username}`)}
                        >
                            <div
                                className="relative shrink-0"
                                onClick={hasStory ? (e) => openStoryViewer(e, profile) : undefined}
                            >
                                <div className={`rounded-full ${hasStory ? 'p-[2px] bg-gradient-to-tr from-purple-600 to-pink-500' : ''}`}>
                                  {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.username} loading="lazy" decoding="async" className="w-[52px] h-[52px] rounded-full object-cover" />
                                    ) : (
                                        <div className="w-[52px] h-[52px] rounded-full bg-purple-500" />
                                    )}
                                </div>
                                {unreadCount > 0 && !isMuted && (
                                    <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center border-2 border-gray-950">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    {isPinned && <Pin size={12} className="text-gray-500 fill-gray-500 shrink-0" />}
                                    <p className={`text-sm truncate ${unreadCount > 0 && !isMuted ? 'text-white font-bold' : 'text-white font-semibold'}`}>
                                        {profile.full_name || profile.username}
                                    </p>
                                    {isMuted && <BellOff size={12} className="text-gray-500 shrink-0" />}
                                    <div className="flex-1" />
                                    {lastMsg && (
                                        <span className={`text-xs shrink-0 ${unreadCount > 0 && !isMuted ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>
                                            {formatListTime(lastMsg.created_at)}
                                        </span>
                                    )}
                                </div>
                                {lastMsg ? (
                                    <p className={`text-sm mt-0.5 truncate ${unreadCount > 0 && !isMuted ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                                        {lastMsg.sender_id === user?.id && (
                                            <span className="text-gray-500">Sen: </span>
                                        )}
                                        {lastMsg.story_id ? '📷 Hikayeye cevap verdi' : lastMsg.content}
                                    </p>
                                ) : (
                                    <p className="text-gray-600 text-sm mt-0.5 italic">Henüz mesaj yok</p>
                                )}
                            </div>

                            <div
                                className="relative shrink-0"
                                ref={openMenuId === profile.id ? menuRef : null}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenMenuId(openMenuId === profile.id ? null : profile.id)
                                    }}
                                    className="text-gray-500 hover:text-white transition p-2 rounded-full hover:bg-gray-800"
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {openMenuId === profile.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[190px]">
                                        <button
                                            onClick={(e) => handleTogglePin(e, profile.id, isPinned)}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white hover:bg-gray-800 transition text-left"
                                        >
                                            {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                                            {isPinned ? 'Sabitlemeyi kaldır' : 'Üste sabitle'}
                                        </button>
                                        <button
                                            onClick={(e) => handleToggleMute(e, profile.id, isMuted)}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white hover:bg-gray-800 transition text-left"
                                        >
                                            {isMuted ? <Bell size={15} /> : <BellOff size={15} />}
                                            {isMuted ? 'Bildirimleri aç' : 'Sessize al'}
                                        </button>
                                        <button
                                            onClick={(e) => handleBlock(e, profile.id)}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-orange-400 hover:bg-gray-800 transition text-left"
                                        >
                                            <Ban size={15} />
                                            Engelle
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteConversation(e, profile.id)}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition text-left border-t border-gray-800"
                                        >
                                            <Trash2 size={15} />
                                            Konuşmayı sil
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                        )
                    })}
                </ul>
            )}

            {viewerGroups && (
                <StoryViewer
                    groups={viewerGroups}
                    startGroupIndex={0}
                    onClose={() => setViewerGroups(null)}
                />
            )}
        </div>
    )
}

export default MessagesPage