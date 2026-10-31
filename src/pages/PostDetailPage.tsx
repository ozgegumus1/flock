import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import PostCard from '../components/PostCard'
import PollBox from '../components/PollBox'
import DealCard from '../components/DealCard'
import Seo from '../components/Seo'

function PostDetailPage() {
    const { postId } = useParams()
    const navigate = useNavigate()
    const [post, setPost] = useState<any>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [gender, setGender] = useState<string | null>(null)
    const [isTeam, setIsTeam] = useState(false)
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
            .select('avatar_url, gender, is_team')
            .eq('username', postData.username)
            .single()

        setAvatarUrl(profileData?.avatar_url ?? null)
        setGender(profileData?.gender ?? null)
        setIsTeam(!!profileData?.is_team)
        setLoading(false)
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            {post && (
                <Seo
                    title={post.title || (post.content ?? '').slice(0, 60) || 'Soru'}
                    description={((post.content || post.title || '') as string).replace(/\s+/g, ' ').slice(0, 155)}
                    image={post.image_urls?.[0] ?? post.image_url}
                    type="article"
                    jsonLd={{
                        '@context': 'https://schema.org',
                        '@type': 'DiscussionForumPosting',
                        headline: post.title || (post.content ?? '').slice(0, 100),
                        text: post.content ?? '',
                        datePublished: post.created_at,
                        url: `https://flocksocial.vercel.app/gonderi/${post.id}`,
                        author: { '@type': 'Person', name: post.is_anonymous ? 'Anonim' : post.username },
                        ...(post.image_urls?.length || post.image_url
                            ? { image: post.image_urls?.length ? post.image_urls : [post.image_url] }
                            : {}),
                    }}
                />
            )}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-ink hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <h1 className="text-ink font-bold text-xl">Gönderi</h1>
            </div>

            {loading ? (
                <p className="text-gray-400 text-center py-8 text-sm">Yükleniyor...</p>
            ) : notFound || !post ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <p className="text-ink font-bold">Gönderi bulunamadı</p>
                    <p className="text-gray-500 text-sm mt-1">Bu gönderi silinmiş olabilir.</p>
                </div>
            ) : (
                <>
                    {post.title && (
                        <h2 className="text-ink font-bold text-2xl leading-snug px-4 pt-4">{post.title}</h2>
                    )}
                    <PostCard
                        postId={post.id}
                        username={post.username}
                        handle={`@${post.username}`}
                        content={post.content}
                        imageUrl={post.image_url}
                        imageUrls={post.image_urls}
                        videoUrl={post.video_url}
                        avatarUrl={avatarUrl}
                        gender={gender}
                        isTeam={isTeam}
                        createdAt={post.created_at}
                        onDelete={() => navigate('/')}
                        isAnonymous={post.is_anonymous}
                        extra={post.deal ? <DealCard deal={post.deal} /> : post.poll_type ? <PollBox postId={post.id} pollType={post.poll_type} /> : undefined}
                    />
                </>
            )}
        </div>
    )
}

export default PostDetailPage