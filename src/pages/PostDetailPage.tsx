import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import PostCard from '../components/PostCard'

function PostDetailPage() {
    const { postId } = useParams()
    const navigate = useNavigate()
    const [post, setPost] = useState<any>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        fetchPost()
    }, [postId])

    const fetchPost = async () => {
        setLoading(true)
        setNotFound(false)

        const { data: postData } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single()

        if (!postData) {
            setNotFound(true)
            setLoading(false)
            return
        }

        setPost(postData)

        const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('username', postData.username)
            .single()

        setAvatarUrl(profileData?.avatar_url ?? null)
        setLoading(false)
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Gönderi</h1>
            </div>

            {loading ? (
                <p className="text-gray-400 text-center py-8 text-sm">Yükleniyor...</p>
            ) : notFound || !post ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <p className="text-white font-bold">Gönderi bulunamadı</p>
                    <p className="text-gray-500 text-sm mt-1">Bu gönderi silinmiş olabilir.</p>
                </div>
            ) : (
                <PostCard
                    postId={post.id}
                    username={post.username}
                    handle={`@${post.username}`}
                    content={post.content}
                    imageUrl={post.image_url}
                imageUrls={post.image_urls}
                    avatarUrl={avatarUrl}
                    createdAt={post.created_at}
                    onDelete={() => navigate('/')}
                />
            )}
        </div>
    )
}

export default PostDetailPage