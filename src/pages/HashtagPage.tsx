import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import PostCard from '../components/PostCard'
import { Hash } from 'lucide-react'

function HashtagPage() {
    const { tag } = useParams()
    const navigate = useNavigate()
    const [posts, setPosts] = useState<any[]>([])
    const [avatarMap, setAvatarMap] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPosts()
    }, [tag])

    const fetchPosts = async () => {
        setLoading(true)

        const { data } = await supabase
            .from('posts')
            .select('*')
            .ilike('content', `%#${tag}%`)
            .order('created_at', { ascending: false })

        // Tam kelime eşleşmesi için ekstra filtre (örn: #react içinde #reactjs çıkmasın)
        const regex = new RegExp(`#${tag}\\b`, 'i')
        const filtered = (data ?? []).filter((p: any) => regex.test(p.content))

        setPosts(filtered)

        const usernames = [...new Set(filtered.map((p: any) => p.username))]
        if (usernames.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .in('username', usernames)

            const map: Record<string, string> = {}
            ;(profiles ?? []).forEach((p: any) => {
                if (p.avatar_url) map[p.username] = p.avatar_url
            })
            setAvatarMap(map)
        }

        setLoading(false)
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate('/kesfet')}
                    className="text-white hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <div className="flex items-center gap-2">
                    <Hash size={18} className="text-purple-400" />
                    <h1 className="text-white font-bold text-xl">{tag}</h1>
                </div>
            </div>

            {!loading && (
                <p className="text-gray-500 text-sm px-4 pt-3">
                    {posts.length} post
                </p>
            )}

            {loading ? (
                <p className="text-gray-400 text-center py-8 text-sm">Yükleniyor...</p>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                        <Hash size={24} className="text-gray-600" />
                    </div>
                    <p className="text-white font-bold">#{tag} için henüz post yok</p>
                    <p className="text-gray-500 text-sm mt-1">Bu hashtag'i ilk kullanan sen ol!</p>
                </div>
            ) : (
                posts.map((post: any) => (
                    <PostCard
                        key={post.id}
                        postId={post.id}
                        username={post.username}
                        handle={`@${post.username}`}
                        content={post.content}
                        imageUrl={post.image_url}
                imageUrls={post.image_urls}
                videoUrl={post.video_url}
                        avatarUrl={avatarMap[post.username]}
                        createdAt={post.created_at}
                        onDelete={(deletedId) => setPosts((prev) => prev.filter((p) => p.id !== deletedId))}
                    />
                ))
            )}
        </div>
    )
}

export default HashtagPage