import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { supabase } from '../supabase'
import { useToast } from '../context/ToastContext'
import { useViewMode } from '../context/ViewModeContext'
import QuestionFeed, { FeedSkeleton } from '../components/QuestionFeed'
import type { FeedAuthor, FeedTopic } from '../components/QuestionFeed'
import ViewToggle from '../components/ViewToggle'
import Seo from '../components/Seo'
import { getSuggestions } from '../utils/suggestions'

const PAGE_SIZE = 20

interface Topic extends FeedTopic {
    description: string | null
}

function TopicPage() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const { showToast } = useToast()
    const { mode } = useViewMode()

    const [topic, setTopic] = useState<Topic | null>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [authors, setAuthors] = useState<Record<string, FeedAuthor>>({})
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        loadTopic()
    }, [slug])

    const fetchAuthors = async (list: any[]) => {
        const usernames = Array.from(new Set(list.map((p) => p.username)))
        if (usernames.length === 0) return

        const { data } = await supabase
            .from('profiles')
            .select('username, avatar_url, gender, is_team')
            .in('username', usernames)

        setAuthors((prev) => {
            const next = { ...prev }
            data?.forEach((p: any) => {
                next[p.username] = { avatar_url: p.avatar_url, gender: p.gender, is_team: p.is_team }
            })
            return next
        })
    }

    const fetchPosts = async (topicId: string, from: number) => {
        const { data, error } = await supabase
            .from('hot_questions')
            .select('id, title, content, username, image_url, image_urls, created_at, topic_id, is_anonymous, deal, poll_type, like_count, comment_count')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false })
            .range(from, from + PAGE_SIZE - 1)

        if (error) {
            showToast('Sorular yüklenemedi. Lütfen tekrar dene.', 'error')
            return []
        }

        return data ?? []
    }

    const loadTopic = async () => {
        setLoading(true)
        setNotFound(false)
        setPosts([])

        const { data: topicData } = await supabase
            .from('topics')
            .select('id, slug, name, description, emoji')
            .eq('slug', slug)
            .maybeSingle()

        if (!topicData) {
            setNotFound(true)
            setLoading(false)
            return
        }

        setTopic(topicData)

        const firstPage = await fetchPosts(topicData.id, 0)
        setPosts(firstPage)
        setHasMore(firstPage.length === PAGE_SIZE)
        await fetchAuthors(firstPage)
        setLoading(false)
    }

    const loadMore = async () => {
        if (!topic || loadingMore) return

        setLoadingMore(true)
        const nextPage = await fetchPosts(topic.id, posts.length)
        setPosts((prev) => [...prev, ...nextPage])
        setHasMore(nextPage.length === PAGE_SIZE)
        await fetchAuthors(nextPage)
        setLoadingMore(false)
    }

    if (notFound) {
        return (
            <div className="min-h-screen border-x border-gray-800">
                <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                    <p className="text-ink font-bold">Bu konu bulunamadı</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-5 py-2 rounded-full transition"
                    >
                        Konulara dön
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${mode === 'grid' ? '' : 'border-x border-gray-800'}`}>
            {topic && (
                <Seo
                    title={`${topic.name} soruları ve cevapları`}
                    description={`${topic.description ?? topic.name} Flock'ta bu konudaki soruları oku, oy ver ya da kendi sorunu sor.`}
                />
            )}

            <div className="sticky top-0 z-10 bg-gray-950/85 backdrop-blur px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="text-gray-400 hover:text-ink transition"
                    aria-label="Ana sayfaya dön"
                >
                    <ArrowLeft size={22} />
                </button>
                <h1 className="text-ink font-bold text-xl truncate flex-1">
                    {topic ? `${topic.emoji ?? '💬'} ${topic.name}` : 'Yükleniyor...'}
                </h1>
                <ViewToggle />
            </div>

            {topic && (
                <div className="p-4 border-b border-gray-800">
                    {topic.description && (
                        <p className="text-gray-400 text-sm mb-3">{topic.description}</p>
                    )}
                    <button
                        onClick={() => navigate(`/yeni-soru?konu=${topic.slug}`)}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-5 py-2 rounded-full transition flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Yeni soru sor
                    </button>
                </div>
            )}

            {loading ? (
                <FeedSkeleton mode={mode} />
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-center px-6">
                    <p className="text-ink font-bold text-lg">Bu konuda henüz soru yok</p>
                    <p className="text-gray-500 text-sm mt-1">İlk soruyu sen sor! Fikir lazımsa birine dokun:</p>

                    <div className="flex flex-col gap-2 mt-5 w-full max-w-md">
                        {getSuggestions(topic?.slug).map((text) => (
                            <button
                                key={text}
                                onClick={() =>
                                    navigate(`/yeni-soru?konu=${topic?.slug}&baslik=${encodeURIComponent(text)}`)
                                }
                                className="text-left text-sm text-ink bg-gray-900 border border-gray-800 hover:border-purple-500/60 rounded-2xl px-4 py-3 transition"
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <QuestionFeed
                    questions={posts}
                    topics={topic ? [topic] : []}
                    authors={authors}
                    mode={mode}
                    showTopic={false}
                />
            )}

            {hasMore && !loading && (
                <div className="py-6 flex justify-center">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-ink text-sm font-bold px-5 py-2 rounded-full transition disabled:opacity-50"
                    >
                        {loadingMore ? 'Yükleniyor...' : 'Daha fazla göster'}
                    </button>
                </div>
            )}

        </div>
    )
}

export default TopicPage