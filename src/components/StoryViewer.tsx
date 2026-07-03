import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { X, ChevronLeft, ChevronRight, Trash2, Heart, Send, Eye } from 'lucide-react'

interface StoryGroup {
    userId: string
    username: string
    avatarUrl: string | null
    stories: any[]
    hasUnseen: boolean
}

interface StoryViewerProps {
    groups: StoryGroup[]
    startGroupIndex: number
    onClose: () => void
}

const STORY_DURATION = 5000 // ms

function formatStoryTime(dateString?: string): string {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)

    if (diffSec < 60) return 'az önce'
    if (diffMin < 60) return `${diffMin}dk`
    return `${diffHour}sa`
}

export function StoryViewer({ groups, startGroupIndex, onClose }: StoryViewerProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [groupIndex, setGroupIndex] = useState(startGroupIndex)
    const [storyIndex, setStoryIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [paused, setPaused] = useState(false)

    const [liked, setLiked] = useState(false)
    const [likePop, setLikePop] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [sendingReply, setSendingReply] = useState(false)
    const replyInputRef = useRef<HTMLInputElement>(null)

    // İzleyici listesi (sadece kendi hikayende)
    const [viewCount, setViewCount] = useState(0)
    const [showViewersList, setShowViewersList] = useState(false)
    const [viewers, setViewers] = useState<any[]>([])
    const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set())
    const [loadingViewers, setLoadingViewers] = useState(false)

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startTimeRef = useRef<number>(Date.now())

    const currentGroup = groups[groupIndex]
    const currentStory = currentGroup?.stories[storyIndex]
    const isOwnStory = currentGroup?.userId === user?.id

    useEffect(() => {
        if (!currentStory) return
        markAsViewed(currentStory.id)
        checkIfLiked(currentStory.id)
        setReplyText('')
        setShowViewersList(false)
        startTimeRef.current = Date.now()
        setProgress(0)

        if (isOwnStory) {
            fetchViewCount(currentStory.id)
        }
    }, [groupIndex, storyIndex])

    useEffect(() => {
        const shouldPause = paused || replyText.length > 0 || showViewersList
        if (shouldPause) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            return
        }

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current
            const pct = Math.min((elapsed / STORY_DURATION) * 100, 100)
            setProgress(pct)

            if (pct >= 100) {
                goNext()
            }
        }, 50)

        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [groupIndex, storyIndex, paused, replyText, showViewersList])

    const markAsViewed = async (storyId: string) => {
        if (isOwnStory) return
        await supabase
            .from('story_views')
            .upsert({ story_id: storyId, viewer_id: user?.id }, { onConflict: 'story_id,viewer_id' })
    }

    const checkIfLiked = async (storyId: string) => {
        const { data } = await supabase
            .from('story_likes')
            .select('id')
            .eq('story_id', storyId)
            .eq('user_id', user?.id)
            .single()

        setLiked(!!data)
    }

    const fetchViewCount = async (storyId: string) => {
        const { count } = await supabase
            .from('story_views')
            .select('*', { count: 'exact' })
            .eq('story_id', storyId)

        setViewCount(count ?? 0)
    }

    const openViewersList = async () => {
        if (!currentStory) return
        setShowViewersList(true)
        setLoadingViewers(true)

        const { data: views } = await supabase
            .from('story_views')
            .select('viewer_id, viewed_at:created_at')
            .eq('story_id', currentStory.id)
            .order('created_at', { ascending: false })

        const { data: likes } = await supabase
            .from('story_likes')
            .select('user_id')
            .eq('story_id', currentStory.id)

        const likedSet = new Set((likes ?? []).map((l: any) => l.user_id))
        setLikedUserIds(likedSet)

        const viewerIds = (views ?? []).map((v: any) => v.viewer_id)
        if (viewerIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', viewerIds)

            const profileMap: Record<string, any> = {}
            ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })

            const merged = viewerIds
                .map((id: string) => profileMap[id])
                .filter(Boolean)

            // Beğenenler üstte görünsün
            merged.sort((a: any, b: any) => {
                const aLiked = likedSet.has(a.id) ? 1 : 0
                const bLiked = likedSet.has(b.id) ? 1 : 0
                return bLiked - aLiked
            })

            setViewers(merged)
        } else {
            setViewers([])
        }

        setLoadingViewers(false)
    }

    const handleToggleLike = async () => {
        if (!currentStory || isOwnStory) return

        if (liked) {
            await supabase
                .from('story_likes')
                .delete()
                .eq('story_id', currentStory.id)
                .eq('user_id', user?.id)
            setLiked(false)
        } else {
            await supabase
                .from('story_likes')
                .insert({ story_id: currentStory.id, user_id: user?.id })
            setLiked(true)
            setLikePop(true)
            setTimeout(() => setLikePop(false), 300)
        }
    }

    const handleSendReply = async () => {
        if (!replyText.trim() || !currentStory || sendingReply) return
        setSendingReply(true)

        await supabase.from('messages').insert({
            sender_id: user?.id,
            receiver_id: currentGroup.userId,
            content: replyText.trim(),
            story_id: currentStory.id,
            story_preview_url: currentStory.media_url,
        })

        setReplyText('')
        setSendingReply(false)
        showToast('Cevabın gönderildi!', 'success')
    }

    const goNext = () => {
        if (storyIndex < currentGroup.stories.length - 1) {
            setStoryIndex((i) => i + 1)
        } else if (groupIndex < groups.length - 1) {
            setGroupIndex((g) => g + 1)
            setStoryIndex(0)
        } else {
            onClose()
        }
    }

    const goPrev = () => {
        if (storyIndex > 0) {
            setStoryIndex((i) => i - 1)
        } else if (groupIndex > 0) {
            const prevGroup = groups[groupIndex - 1]
            setGroupIndex((g) => g - 1)
            setStoryIndex(prevGroup.stories.length - 1)
        }
    }

    const handleDelete = async () => {
        const confirmed = window.confirm('Bu hikayeyi silmek istediğine emin misin?')
        if (!confirmed) return

        await supabase.from('stories').delete().eq('id', currentStory.id)

        if (currentGroup.stories.length === 1) {
            onClose()
        } else {
            goNext()
        }
    }

    if (!currentStory) return null

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div
                className="relative w-full h-full max-w-md mx-auto"
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
            >
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {currentGroup.stories.map((_: any, i: number) => (
                        <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-none"
                                style={{
                                    width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2">
                        {currentGroup.avatarUrl ? (
                            <img src={currentGroup.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-500" />
                        )}
                        <span
                            className="text-white text-sm font-bold cursor-pointer"
                            onClick={() => { onClose(); navigate(`/profil/${currentGroup.username}`) }}
                        >
                            {currentGroup.username}
                        </span>
                        <span className="text-white/70 text-sm">
                            {formatStoryTime(currentStory.created_at)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {isOwnStory && (
                            <button onClick={handleDelete} className="text-white/80 hover:text-red-400 transition p-1.5">
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button onClick={onClose} className="text-white/80 hover:text-white transition p-1.5">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                <img
                    src={currentStory.media_url}
                    alt="story"
                    className="w-full h-full object-contain bg-black"
                />

                {currentStory.caption && (
                    <div className="absolute bottom-24 left-0 right-0 px-4 text-center z-10">
                        <p className="text-white text-base bg-black/40 inline-block px-4 py-2 rounded-xl">
                            {currentStory.caption}
                        </p>
                    </div>
                )}

                <button
                    onClick={goPrev}
                    className="absolute left-0 top-0 w-1/3 h-[85%] z-10 flex items-center justify-start pl-1 opacity-0 hover:opacity-100 transition"
                >
                    <ChevronLeft size={28} className="text-white/70" />
                </button>
                <button
                    onClick={goNext}
                    className="absolute right-0 top-0 w-1/3 h-[85%] z-10 flex items-center justify-end pr-1 opacity-0 hover:opacity-100 transition"
                >
                    <ChevronRight size={28} className="text-white/70" />
                </button>

                {/* Alt bar - başkasının hikayesinde: cevap + beğen */}
                {!isOwnStory && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-4 z-30 flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-white/10 backdrop-blur-sm rounded-full border border-white/20 px-4 py-2.5">
                            <input
                                ref={replyInputRef}
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply() }}
                                placeholder={`${currentGroup.username} kullanıcısına cevap ver...`}
                                className="flex-1 bg-transparent text-white text-sm placeholder-white/50 outline-none min-w-0"
                            />
                        </div>

                        {replyText.trim() ? (
                            <button
                                onClick={handleSendReply}
                                disabled={sendingReply}
                                className="text-white p-2.5 shrink-0 disabled:opacity-50"
                            >
                                <Send size={22} />
                            </button>
                        ) : (
                            <button
                                onClick={handleToggleLike}
                                className={`p-2.5 shrink-0 transition-transform duration-150 ${likePop ? 'scale-125' : 'scale-100'}`}
                            >
                                <Heart
                                    size={26}
                                    className={liked ? 'text-pink-500' : 'text-white'}
                                    fill={liked ? 'currentColor' : 'none'}
                                />
                            </button>
                        )}
                    </div>
                )}

                {/* Alt bar - kendi hikayende: izleyici sayısı */}
                {isOwnStory && (
                    <button
                        onClick={openViewersList}
                        className="absolute bottom-6 left-3 flex items-center gap-1.5 text-white/90 hover:text-white transition z-30 bg-black/30 px-3 py-1.5 rounded-full"
                    >
                        <Eye size={16} />
                        <span className="text-sm font-medium">{viewCount}</span>
                    </button>
                )}

                {/* İzleyici listesi (alttan açılan panel) */}
                {showViewersList && (
                    <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => setShowViewersList(false)}>
                        <div
                            className="bg-gray-900 rounded-t-3xl max-h-[60%] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-center pt-3 pb-2">
                                <div className="w-10 h-1 bg-gray-700 rounded-full" />
                            </div>
                            <div className="flex items-center gap-1.5 px-4 pb-3 text-white font-bold text-sm">
                                <Eye size={16} />
                                {viewCount} görüntülenme
                            </div>
                            <div className="overflow-y-auto px-2 pb-4">
                                {loadingViewers ? (
                                    <p className="text-gray-500 text-sm text-center py-6">Yükleniyor...</p>
                                ) : viewers.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-6">Henüz kimse görüntülemedi.</p>
                                ) : (
                                    viewers.map((v: any) => (
                                        <div
                                            key={v.id}
                                            onClick={() => { onClose(); navigate(`/profil/${v.username}`) }}
                                            className="flex items-center gap-3 px-2 py-2.5 hover:bg-gray-800 rounded-xl cursor-pointer transition"
                                        >
                                            {v.avatar_url ? (
                                                <img src={v.avatar_url} alt={v.username} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-purple-500" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-sm truncate">{v.full_name || v.username}</p>
                                                <p className="text-gray-500 text-xs truncate">@{v.username}</p>
                                            </div>
                                            {likedUserIds.has(v.id) && (
                                                <Heart size={18} className="text-pink-500 shrink-0" fill="currentColor" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}