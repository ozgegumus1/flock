import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { X, ChevronLeft, ChevronRight, Trash2, Heart, Send } from 'lucide-react'

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
        startTimeRef.current = Date.now()
        setProgress(0)
    }, [groupIndex, storyIndex])

    useEffect(() => {
        // Yazarken veya beğenirken hikaye ilerlemesin
        const shouldPause = paused || replyText.length > 0
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
    }, [groupIndex, storyIndex, paused, replyText])

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
                {/* İlerleme çubukları */}
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

                {/* Üst bar */}
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

                {/* İçerik */}
                <img
                    src={currentStory.media_url}
                    alt="story"
                    className="w-full h-full object-contain bg-black"
                />

                {/* Caption */}
                {currentStory.caption && (
                    <div className="absolute bottom-24 left-0 right-0 px-4 text-center z-10">
                        <p className="text-white text-base bg-black/40 inline-block px-4 py-2 rounded-xl">
                            {currentStory.caption}
                        </p>
                    </div>
                )}

                {/* Navigasyon alanları (tıklama ile geçiş) - cevap kutusuyla çakışmasın diye biraz yukarıda bitiyor */}
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

                {/* Alt bar - cevap yaz + beğen (sadece başkasının hikayesinde) */}
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
            </div>
        </div>
    )
}