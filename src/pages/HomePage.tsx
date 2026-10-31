import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useViewMode } from '../context/ViewModeContext'
import { topicTint } from '../utils/topicColors'
import QuestionFeed, { FeedSkeleton } from '../components/QuestionFeed'
import type { FeedAuthor, FeedTopic } from '../components/QuestionFeed'
import ViewToggle from '../components/ViewToggle'
import Seo from '../components/Seo'

function HomePage() {
    const { showToast } = useToast()
    const { user } = useAuth()
    const { mode } = useViewMode()

    const [topics, setTopics] = useState<FeedTopic[]>([])
    const [questions, setQuestions] = useState<any[]>([])
    const [authors, setAuthors] = useState<Record<string, FeedAuthor>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadHome = async () => {
            const [topicsResult, questionsResult] = await Promise.all([
                supabase
                    .from('topics')
                    .select('id, slug, name, emoji')
                    .order('sort_order', { ascending: true }),
                supabase
                    .from('hot_questions')
                    .select('id, title, content, username, image_url, image_urls, created_at, topic_id, is_anonymous, deal, poll_type, like_count, comment_count')
                    .order('hot_score', { ascending: false })
                    .limit(30),
            ])

            if (topicsResult.error || questionsResult.error) {
                showToast('Sayfa yüklenemedi. Lütfen tekrar dene.', 'error')
            }

            const questionList = questionsResult.data ?? []

            setTopics(topicsResult.data ?? [])
            setQuestions(questionList)

            const usernames = Array.from(new Set(questionList.map((q: any) => q.username)))
            if (usernames.length > 0) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('username, avatar_url, gender, is_team')
                    .in('username', usernames)

                const map: Record<string, FeedAuthor> = {}
                profileData?.forEach((p: any) => {
                    map[p.username] = { avatar_url: p.avatar_url, gender: p.gender, is_team: p.is_team }
                })
                setAuthors(map)
            }

            setLoading(false)
        }

        loadHome()
    }, [])

    return (
        <div className={`min-h-screen ${mode === 'grid' ? '' : 'border-x border-gray-800'}`}>
            <Seo
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Flock',
                    url: 'https://flocksocial.vercel.app/',
                    description: 'Kadınların birbirine gerçek tavsiye verdiği soru-cevap platformu.',
                }}
            />

            <div className="sticky top-0 z-10 bg-gray-950/85 backdrop-blur border-b border-gray-800">
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <h1 className="text-ink font-bold text-xl">Öne çıkanlar</h1>
                    <ViewToggle />
                </div>

                <div
                    className="flex gap-2 overflow-x-auto px-4 pb-3"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {topics.map((topic) => (
                        <Link
                            key={topic.id}
                            to={`/konu/${topic.slug}`}
                            style={topicTint(topic.slug)}
                            className="shrink-0 text-sm font-medium rounded-full px-4 py-1.5 transition hover:opacity-80"
                        >
                            {topic.emoji ?? '💬'} {topic.name}
                        </Link>
                    ))}
                </div>
            </div>

            {!user && (
                <div className="m-4 rounded-3xl bg-purple-900 border border-gray-800 p-6">
                    <h2 className="text-ink text-2xl font-bold leading-snug">
                        Kadınların birbirine gerçek tavsiye verdiği yer
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">
                        Kombin, ürün, güvenilir öneri ve indirimler hakkında soru sor, oy ver, deneyim paylaş.
                    </p>
                    <div className="flex gap-2 mt-4">
                        <Link
                            to="/kayit"
                            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-full px-5 py-2.5 transition"
                        >
                            Ücretsiz katıl
                        </Link>
                        <Link
                            to="/giris"
                            className="border border-gray-700 hover:bg-gray-800 text-ink text-sm font-bold rounded-full px-5 py-2.5 transition"
                        >
                            Giriş yap
                        </Link>
                    </div>
                </div>
            )}

            {loading ? (
                <FeedSkeleton mode={mode} />
            ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <p className="text-ink font-bold">Henüz soru yok</p>
                    <p className="text-gray-500 text-sm mt-1">Yukarıdan bir konu seç ve ilk soruyu sen sor.</p>
                    <Link
                        to="/yeni-soru"
                        className="mt-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-5 py-2 rounded-full transition"
                    >
                        Soru sor
                    </Link>
                </div>
            ) : (
                <QuestionFeed questions={questions} topics={topics} authors={authors} mode={mode} />
            )}
        </div>
    )
}

export default HomePage