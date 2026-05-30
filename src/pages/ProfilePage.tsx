import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'

function ProfilePage() {
    const navigate = useNavigate()
    const { username } = useParams()
    const { user } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [followerCount, setFollowerCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [isFollowing, setIsFollowing] = useState(false)
    const [newPost, setNewPost] = useState('')

    const isOwnProfile = user?.user_metadata?.username === username

    useEffect(() => {
        fetchProfile()
    }, [username])

    const fetchProfile = async () => {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single()

        setProfile(profileData)

        const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false })

        if (postsData) setPosts(postsData)

        const { count: followers } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('following_id', profileData?.id)

        const { count: following } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('follower_id', profileData?.id)

        setFollowerCount(followers ?? 0)
        setFollowingCount(following ?? 0)

        const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user?.id)
            .eq('following_id', profileData?.id)
            .single()

        setIsFollowing(!!followData)
    }

    const handleFollow = async () => {
        if (isFollowing) {
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user?.id)
                .eq('following_id', profile?.id)
            setIsFollowing(false)
            setFollowerCount(followerCount - 1)
        } else {
            await supabase
                .from('follows')
                .insert({ follower_id: user?.id, following_id: profile?.id })
            setIsFollowing(true)
            setFollowerCount(followerCount + 1)
        }
    }

    const handlePost = async () => {
        if (!newPost.trim()) return

        await supabase
            .from('posts')
            .insert({ content: newPost, username: user?.user_metadata?.username })

        setNewPost('')

        const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false })

        if (postsData) setPosts(postsData)
    }

    if (!profile) return <div className="flex-1 p-4 text-white">Yükleniyor...</div>

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">

            {/* Kapak Fotoğrafı */}
            <div className="h-48 bg-gradient-to-r from-purple-900 to-indigo-900" />

            {/* Profil Bilgileri */}
            <div className="px-6 pb-4">

                {/* Avatar */}
                <div className="flex justify-between items-end -mt-12 mb-4">
                    <div className="w-24 h-24 rounded-full bg-purple-500 border-4 border-gray-950" />

                    {/* Butonlar */}
                    <div className="flex gap-2 mt-14">
                        {isOwnProfile ? (
                            <button
                                onClick={() => navigate('/profil-duzenle')}
                                className="border border-gray-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition">
                                Profili Düzenle
                            </button>
                        ) : (
                            <>
                                <button className="border border-gray-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition">
                                    Mesaj
                                </button>
                                <button className="border border-gray-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition">
                                    Engelle
                                </button>
                                <button
                                    onClick={handleFollow}
                                    className={`text-sm font-bold px-4 py-2 rounded-full transition ${isFollowing ? 'border border-gray-600 text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}`}>
                                    {isFollowing ? 'Takipten Çık' : 'Takip Et'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* İsim ve Biyografi */}
                <h1 className="text-white font-bold text-xl">{profile.full_name || profile.username}</h1>
                <p className="text-gray-400 text-sm">@{profile.username}</p>
                {profile.bio && <p className="text-white mt-3">{profile.bio}</p>}

                {/* Takipçi Sayıları */}
                <div className="flex gap-6 mt-4">
                    <div className="cursor-pointer hover:underline">
                        <span className="text-white font-bold">{followingCount}</span>
                        <span className="text-gray-400 text-sm ml-1">Takip Edilen</span>
                    </div>
                    <div className="cursor-pointer hover:underline">
                        <span className="text-white font-bold">{followerCount}</span>
                        <span className="text-gray-400 text-sm ml-1">Takipçi</span>
                    </div>
                </div>
            </div>

            {/* Post atma alanı - sadece kendi profilinde görünsün */}
            {isOwnProfile && (
                <div className="flex gap-3 p-4 border-b border-gray-800">
                    <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
                    <div className="flex-1">
                        <textarea
                            placeholder="Ne düşünüyorsun?"
                            className="w-full bg-transparent text-white placeholder-gray-500 text-lg resize-none outline-none"
                            rows={3}
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handlePost}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl transition">
                                Paylaş
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Postlar */}
            <div className="border-t border-gray-800">
                {posts.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Henüz post yok.</p>
                ) : (
                    posts.map((post: any) => (
                        <PostCard
                            key={post.id}
                            postId={post.id}
                            username={post.username}
                            handle={`@${post.username}`}
                            content={post.content}
                        />
                    ))
                )}
            </div>

        </div>
    )
}

export default ProfilePage