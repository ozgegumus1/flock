import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Plus } from 'lucide-react'
import { CreateStoryModal } from './CreateStoryModal'
import { StoryViewer } from './StoryViewer'

interface StoryGroup {
    userId: string
    username: string
    avatarUrl: string | null
    stories: any[]
    hasUnseen: boolean
}

function StoriesBar() {
    const { user, profile } = useAuth()
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
    const [myStories, setMyStories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [viewerGroups, setViewerGroups] = useState<StoryGroup[] | null>(null)
    const [viewerStartIndex, setViewerStartIndex] = useState(0)

    useEffect(() => {
        fetchStories()
    }, [])

    const fetchStories = async () => {
        setLoading(true)

        // Süresi dolmamış hikayeleri çek
        const { data: stories } = await supabase
            .from('stories')
            .select('*')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: true })

        if (!stories) { setLoading(false); return }

        // Engellenmiş kullanıcıları filtrele
        const { data: blocksData } = await supabase
            .from('blocks')
            .select('blocked_id, blocker_id')
            .or(`blocker_id.eq.${user?.id},blocked_id.eq.${user?.id}`)

        const blockedIds = new Set(
            (blocksData ?? []).map((b: any) => (b.blocker_id === user?.id ? b.blocked_id : b.blocker_id))
        )

        const visibleStories = stories.filter((s: any) => !blockedIds.has(s.user_id))

        // Kendi hikayelerimi ayır
        const mine = visibleStories.filter((s: any) => s.user_id === user?.id)
        const others = visibleStories.filter((s: any) => s.user_id !== user?.id)
        setMyStories(mine)

        // Görüntülenenleri çek
        const storyIds = others.map((s: any) => s.id)
        let viewedSet = new Set<string>()
        if (storyIds.length > 0) {
            const { data: views } = await supabase
                .from('story_views')
                .select('story_id')
                .eq('viewer_id', user?.id)
                .in('story_id', storyIds)
            viewedSet = new Set((views ?? []).map((v: any) => v.story_id))
        }

        // Kullanıcıya göre grupla
        const userIds = [...new Set(others.map((s: any) => s.user_id))]
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds)

        const profileMap: Record<string, any> = {}
        ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })

        const grouped: Record<string, StoryGroup> = {}
        others.forEach((s: any) => {
            if (!grouped[s.user_id]) {
                grouped[s.user_id] = {
                    userId: s.user_id,
                    username: profileMap[s.user_id]?.username ?? s.username,
                    avatarUrl: profileMap[s.user_id]?.avatar_url ?? null,
                    stories: [],
                    hasUnseen: false,
                }
            }
            grouped[s.user_id].stories.push(s)
            if (!viewedSet.has(s.id)) grouped[s.user_id].hasUnseen = true
        })

        setStoryGroups(Object.values(grouped))
        setLoading(false)
    }

    const openViewer = (groups: StoryGroup[], index: number) => {
        setViewerGroups(groups)
        setViewerStartIndex(index)
    }

    const closeViewer = () => {
        setViewerGroups(null)
        fetchStories() // görüntülenme durumunu güncelle
    }

    const handleMyStoryClick = () => {
        if (myStories.length === 0) {
            setShowCreateModal(true)
        } else {
            openViewer(
                [{ userId: user?.id, username: profile?.username ?? '', avatarUrl: profile?.avatar_url ?? null, stories: myStories, hasUnseen: false }],
                0
            )
        }
    }

    return (
        <>
            <div className="flex gap-4 px-4 py-4 border-b border-gray-800 overflow-x-auto scrollbar-hide">
                {/* Kendi hikayem / Hikaye ekle */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                    <button onClick={handleMyStoryClick} className="relative">
                        <div className={`w-16 h-16 rounded-full p-[2px] ${myStories.length > 0 ? 'bg-gradient-to-tr from-purple-600 to-pink-500' : 'bg-gray-700'}`}>
                            <div className="w-full h-full rounded-full bg-gray-950 p-[2px]">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="me" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-purple-500" />
                                )}
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowCreateModal(true) }}
                            className="absolute -bottom-0.5 -right-0.5 bg-purple-600 border-2 border-gray-950 rounded-full p-0.5 hover:bg-purple-700 transition"
                        >
                            <Plus size={12} className="text-white" />
                        </button>
                    </button>
                    <span className="text-gray-400 text-[11px]">Hikayen</span>
                </div>

                {/* Diğer kullanıcıların hikayeleri */}
                {!loading && storyGroups.map((group, index) => (
                    <div key={group.userId} className="flex flex-col items-center gap-1 shrink-0">
                        <button onClick={() => openViewer(storyGroups, index)}>
                            <div className={`w-16 h-16 rounded-full p-[2px] ${group.hasUnseen ? 'bg-gradient-to-tr from-purple-600 to-pink-500' : 'bg-gray-700'}`}>
                                <div className="w-full h-full rounded-full bg-gray-950 p-[2px]">
                                    {group.avatarUrl ? (
                                        <img src={group.avatarUrl} alt={group.username} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-purple-500" />
                                    )}
                                </div>
                            </div>
                        </button>
                        <span className="text-gray-400 text-[11px] max-w-[64px] truncate">{group.username}</span>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <CreateStoryModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); fetchStories() }}
                />
            )}

            {viewerGroups && (
                <StoryViewer
                    groups={viewerGroups}
                    startGroupIndex={viewerStartIndex}
                    onClose={closeViewer}
                />
            )}
        </>
    )
}

export default StoriesBar