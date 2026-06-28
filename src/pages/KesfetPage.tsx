import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Search, X, Hash, User as UserIcon } from 'lucide-react'

function extractHashtags(text: string): string[] {
    const matches = text.match(/#[\p{L}\p{N}_]+/gu)
    return matches ? matches.map((h) => h.toLowerCase()) : []
}

function highlightMatch(text: string, query: string) {
    if (!query) return text
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text
    return (
        <>
            {text.slice(0, index)}
            <span className="text-purple-400 font-bold">{text.slice(index, index + query.length)}</span>
            {text.slice(index + query.length)}
        </>
    )
}

function KesfetPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [userResults, setUserResults] = useState<any[]>([])
    const [hashtagResults, setHashtagResults] = useState<{ tag: string; count: number }[]>([])
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'all' | 'users' | 'hashtags'>('all')

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        fetchSuggestions()
    }, [])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [query])

    useEffect(() => {
        if (debouncedQuery) {
            runSearch(debouncedQuery)
        } else {
            setUserResults([])
            setHashtagResults([])
        }
    }, [debouncedQuery])

    const fetchSuggestions = async () => {
        const { data: followData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user?.id)

        const followedIds = new Set((followData ?? []).map((f: any) => f.following_id))

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .neq('id', user?.id)
            .limit(15)

        const filtered = (profiles ?? []).filter((p: any) => !followedIds.has(p.id))
        setSuggestions(filtered.slice(0, 5))
    }

    const runSearch = async (q: string) => {
        setLoading(true)
        const isHashtagQuery = q.startsWith('#')
        const cleanQuery = q.replace('#', '')

        // Kullanıcı araması (hashtag aramasıysa kullanıcı arama atla)
        if (!isHashtagQuery) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
                .neq('id', user?.id)
                .limit(10)

            setUserResults(profiles ?? [])
        } else {
            setUserResults([])
        }

        // Hashtag araması - tüm postları çekip içinde ara
        const { data: posts } = await supabase
            .from('posts')
            .select('content')
            .ilike('content', `%#${cleanQuery}%`)
            .limit(200)

        const tagCounts: Record<string, number> = {}
        ;(posts ?? []).forEach((p: any) => {
            const tags = extractHashtags(p.content || '')
            tags.forEach((tag) => {
                if (tag.toLowerCase().includes(`#${cleanQuery.toLowerCase()}`)) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1
                }
            })
        })

        const sortedTags = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        setHashtagResults(sortedTags)
        setLoading(false)
    }

    const handleClear = () => {
        setQuery('')
        setDebouncedQuery('')
    }

    const hasResults = userResults.length > 0 || hashtagResults.length > 0
    const showUsers = activeTab === 'all' || activeTab === 'users'
    const showHashtags = activeTab === 'all' || activeTab === 'hashtags'

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            {/* Başlık + Arama */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 z-10">
                <h1 className="text-white font-bold text-xl mb-3">Keşfet</h1>

                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Kullanıcı veya #hashtag ara..."
                        className="w-full bg-gray-900 border border-gray-800 rounded-full pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition"
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Sekmeler - sadece arama yaparken görünsün */}
                {debouncedQuery && (
                    <div className="flex gap-2 mt-3">
                        {[
                            { key: 'all', label: 'Tümü' },
                            { key: 'users', label: 'Kullanıcılar' },
                            { key: 'hashtags', label: 'Hashtagler' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${
                                    activeTab === tab.key
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* İçerik */}
            {debouncedQuery ? (
                loading ? (
                    <div className="flex flex-col gap-1 p-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse">
                                <div className="w-11 h-11 rounded-full bg-gray-800 shrink-0" />
                                <div className="flex-1">
                                    <div className="h-3 bg-gray-800 rounded w-32 mb-2" />
                                    <div className="h-2.5 bg-gray-800 rounded w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !hasResults ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                            <Search size={24} className="text-gray-600" />
                        </div>
                        <p className="text-white font-bold">Sonuç bulunamadı</p>
                        <p className="text-gray-500 text-sm mt-1">"{debouncedQuery}" için hiçbir şey bulamadık.</p>
                    </div>
                ) : (
                    <>
                        {/* Kullanıcı sonuçları */}
                        {showUsers && userResults.length > 0 && (
                            <div className="border-b border-gray-800">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide px-4 pt-4 pb-1">
                                    Kullanıcılar
                                </p>
                                {userResults.map((profile: any) => (
                                    <div
                                        key={profile.id}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900/50 transition cursor-pointer"
                                        onClick={() => navigate(`/profil/${profile.username}`)}
                                    >
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.username} className="w-11 h-11 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-purple-500 shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold text-sm truncate">
                                                {highlightMatch(profile.full_name || profile.username, debouncedQuery)}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                @{highlightMatch(profile.username, debouncedQuery)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Hashtag sonuçları */}
                        {showHashtags && hashtagResults.length > 0 && (
                            <div className="border-b border-gray-800">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide px-4 pt-4 pb-1">
                                    Hashtagler
                                </p>
                                {hashtagResults.map(({ tag, count }) => (
                                    <div
                                        key={tag}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900/50 transition cursor-pointer"
                                        onClick={() => navigate(`/kesfet/hashtag/${tag.replace('#', '')}`)}
                                    >
                                        <div className="w-11 h-11 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
                                            <Hash size={18} className="text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold text-sm truncate">{tag}</p>
                                            <p className="text-gray-500 text-xs">{count} post</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )
            ) : (
                /* Arama yokken: önerilen kullanıcılar */
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wide px-4 pt-4 pb-1">
                        Tanıyor Olabilirsin
                    </p>
                    {suggestions.length === 0 ? (
                        <p className="text-gray-400 text-sm px-4 py-6">Şu an öneri yok.</p>
                    ) : (
                        suggestions.map((profile: any) => (
                            <div
                                key={profile.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900/50 transition cursor-pointer"
                                onClick={() => navigate(`/profil/${profile.username}`)}
                            >
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.username} className="w-11 h-11 rounded-full object-cover shrink-0" />
                                ) : (
                                    <div className="w-11 h-11 rounded-full bg-purple-500 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">
                                        {profile.full_name || profile.username}
                                    </p>
                                    <p className="text-gray-500 text-xs">@{profile.username}</p>
                                </div>
                                <UserIcon size={16} className="text-gray-600 shrink-0" />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default KesfetPage