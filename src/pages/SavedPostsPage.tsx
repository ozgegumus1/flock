import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import { Bookmark } from 'lucide-react'

function SavedPostsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [posts, setPosts] = useState<any[]>([])
    const [avatarMap, setAvatarMap] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSaved()
    }, [])

    const fetchSaved = async () => {
        setLoading(true)

        const { data: saved } = await supabase
            .from('saved_posts')
            .select('post_id, created_at')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })

        const postIds = (saved ?? []).map((s: any) => s.post_id)

        if (postIds.length === 0) {
            setPosts([])
            setLoading(false)
            return
        }

        const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .in('id', postIds)

        // saved_posts sırasını korumak için manuel sıralama
        const ordered = postIds
            .map((id: string) => (postsData ?? []).find((p: any) => p.id === id))
            .filter(Boolean)

        setPosts(ordered)

        const usernames = [...new Set(ordered.map((p: any) => p.username))]
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
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button onClick={() => navigate(-1)} className="text-white hover:text-gray-400 transition">
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Kaydedilenler</h1>
            </div>

            {loading ? (
                <p className="text-gray-400 text-center py-8 text-sm">Yükleniyor...</p>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                        <Bookmark size={24} className="text-gray-600" />
                    </div>
                    <p className="text-white font-bold">Henüz kaydedilen gönderi yok</p>
                    <p className="text-gray-500 text-sm mt-1">Bir gönderiyi kaydetmek için bookmark ikonuna dokun.</p>
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
                        avatarUrl={avatarMap[post.username]}
                        createdAt={post.created_at}
                        onDelete={(deletedId) => setPosts((prev) => prev.filter((p) => p.id !== deletedId))}
                    />
                ))
            )}
        </div>
    )
}

export default SavedPostsPage