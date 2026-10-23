import { Link } from 'react-router-dom'
import { BarChart3, Heart, Images, MessageCircle } from 'lucide-react'
import Avatar from './Avatar'
import TeamBadge from './TeamBadge'
import { topicColor, topicTint } from '../utils/topicColors'
import type { ViewMode } from '../context/ViewModeContext'

export interface FeedTopic {
    id: string
    slug: string
    name: string
    emoji: string | null
}

export interface FeedAuthor {
    avatar_url: string | null
    gender: string | null
    is_team?: boolean | null
}

interface QuestionFeedProps {
    questions: any[]
    topics: FeedTopic[]
    authors: Record<string, FeedAuthor>
    mode: ViewMode
    showTopic?: boolean
}

const RATIOS = ['aspect-[4/5]', 'aspect-square', 'aspect-[3/4]', 'aspect-[5/6]']

function ratioFor(id: string): string {
    let sum = 0
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
    return RATIOS[sum % RATIOS.length]
}

function formatTimeAgo(dateString?: string): string {
    if (!dateString) return ''

    const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'şimdi'
    if (diffMin < 60) return `${diffMin}dk`
    if (diffHour < 24) return `${diffHour}sa`
    if (diffDay < 7) return `${diffDay}g`

    return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function priceText(q: any): string | null {
    if (!q.deal) return null
    const price = q.deal.price != null ? ` · ${Number(q.deal.price).toLocaleString('tr-TR')} TL` : ''
    return `${q.deal.store}${price}`
}

function Counts({ q }: { q: any }) {
    const likes = Number(q.like_count ?? 0)
    const comments = Number(q.comment_count ?? 0)

    if (likes === 0 && comments === 0) return null

    return (
        <span className="flex items-center gap-2.5 shrink-0">
            {likes > 0 && (
                <span className="flex items-center gap-1">
                    <Heart size={13} />
                    {likes}
                </span>
            )}
            {comments > 0 && (
                <span className="flex items-center gap-1">
                    <MessageCircle size={13} />
                    {comments}
                </span>
            )}
        </span>
    )
}

function Meta({ q, author }: { q: any; author?: FeedAuthor }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            <Avatar
                src={author?.avatar_url}
                gender={q.is_anonymous ? null : author?.gender}
                size={24}
            />
            <span className="truncate min-w-0 opacity-80">
                {q.is_anonymous ? 'Anonim' : `@${q.username}`}
            </span>
            {!q.is_anonymous && author?.is_team && <TeamBadge />}
            <span className="flex-1" />
            <Counts q={q} />
        </div>
    )
}

function ListRow({ q, topic, author, showTopic }: { q: any; topic?: FeedTopic; author?: FeedAuthor; showTopic: boolean }) {
    const thumbnail = q.image_urls?.[0] ?? q.image_url
    const heading = q.title || (q.content ?? '').slice(0, 80)
    const deal = priceText(q)

    return (
        <Link
            to={`/gonderi/${q.id}`}
            className="flex gap-3 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition"
        >
            <div className="flex-1 min-w-0">
                {showTopic && topic && (
                    <p style={topicColor(topic.slug)} className="text-xs font-bold mb-1">
                        {topic.emoji ?? '💬'} {topic.name}
                    </p>
                )}

                <h2 className="text-ink font-bold leading-snug">{heading}</h2>

                {deal && <p className="text-emerald-500 text-sm font-bold mt-1">🏷️ {deal}</p>}

                {q.title && q.content && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{q.content}</p>
                )}

                <div className="mt-3 text-gray-500">
                    <Meta q={q} author={author} />
                    <p className="text-xs mt-1.5 text-gray-500">
                        {formatTimeAgo(q.created_at)}
                        {Number(q.comment_count ?? 0) === 0 && (
                            <span className="text-purple-500 font-medium"> · İlk cevabı sen ver</span>
                        )}
                    </p>
                </div>
            </div>

            {thumbnail && (
                <img src={thumbnail} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" loading="lazy" />
            )}
        </Link>
    )
}

function GridCard({ q, topic, author, showTopic }: { q: any; topic?: FeedTopic; author?: FeedAuthor; showTopic: boolean }) {
    const photos: string[] = q.image_urls?.length ? q.image_urls : q.image_url ? [q.image_url] : []
    const heading = q.title || (q.content ?? '').slice(0, 80)
    const deal = priceText(q)

    if (photos.length > 0) {
        return (
            <Link to={`/gonderi/${q.id}`} className="group block mb-3 break-inside-avoid">
                <div className="relative overflow-hidden rounded-2xl bg-gray-800">
                    <img
                        src={photos[0]}
                        alt=""
                        loading="lazy"
                        className={`w-full ${ratioFor(q.id)} object-cover group-hover:scale-[1.03] transition duration-300`}
                    />

                    {q.poll_type && (
                        <span className="absolute top-2 left-2 flex items-center gap-1 bg-gray-950/80 backdrop-blur text-ink text-[11px] font-bold rounded-full px-2.5 py-1">
                            <BarChart3 size={12} />
                            Anket
                        </span>
                    )}

                    {photos.length > 1 && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 bg-gray-950/80 backdrop-blur text-ink text-[11px] font-bold rounded-full px-2 py-1">
                            <Images size={12} />
                            {photos.length}
                        </span>
                    )}

                    {deal && (
                        <span className="absolute bottom-2 left-2 right-2 truncate bg-emerald-600 text-white text-xs font-bold rounded-full px-3 py-1.5">
                            🏷️ {deal}
                        </span>
                    )}
                </div>

                <div className="px-1 pt-2">
                    {showTopic && topic && (
                        <p style={topicColor(topic.slug)} className="text-[11px] font-bold mb-0.5">
                            {topic.emoji ?? '💬'} {topic.name}
                        </p>
                    )}
                    <h3 className="font-display font-bold text-ink leading-snug line-clamp-2">{heading}</h3>
                    <div className="mt-2 text-gray-500">
                        <Meta q={q} author={author} />
                    </div>
                </div>
            </Link>
        )
    }

    return (
        <Link
            to={`/gonderi/${q.id}`}
            style={topicTint(topic?.slug)}
            className="block mb-3 break-inside-avoid rounded-2xl p-4 hover:opacity-90 transition"
        >
            {showTopic && topic && (
                <p className="text-[11px] font-bold mb-2 opacity-80">
                    {topic.emoji ?? '💬'} {topic.name}
                </p>
            )}

            <h3 className="font-display font-bold text-xl leading-snug">{heading}</h3>

            {deal && <p className="text-sm font-bold mt-2">🏷️ {deal}</p>}

            {q.title && q.content && (
                <p className="text-sm mt-2 line-clamp-4 opacity-80">{q.content}</p>
            )}

            {q.poll_type && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold mt-3 opacity-80">
                    <BarChart3 size={12} />
                    Anket
                </span>
            )}

            <div className="mt-3">
                <Meta q={q} author={author} />
            </div>
        </Link>
    )
}

function QuestionFeed({ questions, topics, authors, mode, showTopic = true }: QuestionFeedProps) {
    const topicById = (id: string) => topics.find((t) => t.id === id)

    if (mode === 'list') {
        return (
            <div>
                {questions.map((q) => (
                    <ListRow
                        key={q.id}
                        q={q}
                        topic={topicById(q.topic_id)}
                        author={authors[q.username]}
                        showTopic={showTopic}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="columns-2 md:columns-3 gap-3 p-4">
            {questions.map((q) => (
                <GridCard
                    key={q.id}
                    q={q}
                    topic={topicById(q.topic_id)}
                    author={authors[q.username]}
                    showTopic={showTopic}
                />
            ))}
        </div>
    )
}

export function FeedSkeleton({ mode }: { mode: ViewMode }) {
    if (mode === 'list') {
        return (
            <>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border-b border-gray-800 animate-pulse">
                        <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
                        <div className="h-3 bg-gray-800 rounded w-full mb-2" />
                        <div className="h-3 bg-gray-800 rounded w-1/3" />
                    </div>
                ))}
            </>
        )
    }

    return (
        <div className="columns-2 md:columns-3 gap-3 p-4">
            {['aspect-[4/5]', 'aspect-square', 'aspect-[3/4]', 'aspect-[5/6]', 'aspect-square', 'aspect-[4/5]'].map((r, i) => (
                <div key={i} className={`${r} bg-gray-800 rounded-2xl mb-3 break-inside-avoid animate-pulse`} />
            ))}
        </div>
    )
}

export default QuestionFeed