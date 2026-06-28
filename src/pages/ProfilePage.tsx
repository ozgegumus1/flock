import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import { Settings } from 'lucide-react'

function ProfilePage() {
    const navigate = useNavigate()
    const { username } = useParams()
    const { user } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [followerCount, setFollowerCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [blockedByThem, setBlockedByThem] = useState(false)
    const [newPost, setNewPost] = useState('')

    // Modal state
    const [modalType, setModalType] = useState<'followers' | 'following' | null>(null)
    const [modalUsers, setModalUsers] = useState<any[]>([])
    const [modalLoading, setModalLoading] = useState(false)

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

        // Engelleme kontrolleri
        const { data: blockData } = await supabase
            .from('blocks')
            .select('*')
            .eq('blocker_id', user?.id)
            .eq('blocked_id', profileData?.id)
            .single()
        setIsBlocked(!!blockData)

        const { data: blockedByData } = await supabase
            .from('blocks')
            .select('*')
            .eq('blocker_id', profileData?.id)
            .eq('blocked_id', user?.id)
            .single()
        setBlockedByThem(!!blockedByData)

        const isMyOwnProfile = user?.user_metadata?.username === username

        // Gizli hesap kontrolü: kendi profilim, takip ediyorsam veya açık hesapsa postları göster
        let canSeePosts = isMyOwnProfile || !profileData?.is_private

        if (!canSeePosts && profileData) {
            const { data: acceptedFollow } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', user?.id)
                .eq('following_id', profileData.id)
                .eq('status', 'accepted')
                .single()
            canSeePosts = !!acceptedFollow
        }

        // Karşılıklı engel yoksa ve erişim varsa devam et
        if (!blockedByData && canSeePosts) {
            const { data: postsData } = await supabase
                .from('posts')
                .select('*')
                .eq('username', username)
                .order('created_at', { ascending: false })

            if (postsData) setPosts(postsData)
        } else {
            setPosts([])
        }

        const { count: followers } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('following_id', profileData?.id)
            .eq('status', 'accepted')

        const { count: following } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('follower_id', profileData?.id)
            .eq('status', 'accepted')

        setFollowerCount(followers ?? 0)
        setFollowingCount(following ?? 0)

        const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user?.id)
            .eq('following_id', profileData?.id)
            .single()

        setIsFollowing(followData?.status === 'accepted')
        setIsPending(followData?.status === 'pending')
    }

    const handleBlock = async () => {
        if (isBlocked) {
            // Engeli kaldır
            await supabase
                .from('blocks')
                .delete()
                .eq('blocker_id', user?.id)
                .eq('blocked_id', profile?.id)
        } else {
            // Engelle — önce karşılıklı takipten çık
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user?.id)
                .eq('following_id', profile?.id)
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', profile?.id)
                .eq('following_id', user?.id)

            await supabase
                .from('blocks')
                .insert({ blocker_id: user?.id, blocked_id: profile?.id })
        }

        // Tek doğruluk kaynağı: verileri yeniden çek
        await fetchProfile()
    }

    const openModal = async (type: 'followers' | 'following') => {
        setModalType(type)
        setModalLoading(true)
        setModalUsers([])

        if (type === 'followers') {
            const { data } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', profile?.id)
                .eq('status', 'accepted')

            if (data && data.length > 0) {
                const ids = data.map((f: any) => f.follower_id)
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('username, full_name')
                    .in('id', ids)
                setModalUsers(profiles ?? [])
            }
        } else {
            const { data } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', profile?.id)
                .eq('status', 'accepted')

            if (data && data.length > 0) {
                const ids = data.map((f: any) => f.following_id)
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('username, full_name')
                    .in('id', ids)
                setModalUsers(profiles ?? [])
            }
        }

        setModalLoading(false)
    }

    const closeModal = () => {
        setModalType(null)
        setModalUsers([])
    }

    const handleFollow = async () => {
        if (isPending) {
            // İstek geri çekme
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user?.id)
                .eq('following_id', profile?.id)
        } else if (isFollowing) {
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user?.id)
                .eq('following_id', profile?.id)
        } else if (profile?.is_private) {
            // Gizli hesap - takip isteği gönder
            await supabase
                .from('follows')
                .insert({ follower_id: user?.id, following_id: profile?.id, status: 'pending' })
        } else {
            await supabase
                .from('follows')
                .insert({ follower_id: user?.id, following_id: profile?.id, status: 'accepted' })
        }

        // Tek doğruluk kaynağı: verileri yeniden çek
        await fetchProfile()
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

    // Beni engellemişse içeriği gösterme
    if (blockedByThem) return (
        <div className="flex-1 min-h-screen border-x border-gray-800 flex items-center justify-center">
            <p className="text-gray-400">Bu içeriği görüntüleyemezsiniz.</p>
        </div>
    )

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">

            {/* Kapak Fotoğrafı */}
            {profile.cover_url ? (
                <img
                    src={profile.cover_url}
                    alt="kapak"
                    className="h-48 w-full object-cover"
                />
            ) : (
                <div className="h-48 bg-gradient-to-r from-purple-900 to-indigo-900" />
            )}

            {/* Profil Bilgileri */}
            <div className="px-6 pb-4">

                {/* Avatar */}
                <div className="flex justify-between items-end -mt-12 mb-4">
                    {profile.avatar_url ? (<img src={profile.avatar_url} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-950" />) : (<div className="w-24 h-24 rounded-full bg-purple-500 border-4 border-gray-950" />)}

                    {/* Butonlar */}
                    <div className="flex gap-2 mt-14">
                        {isOwnProfile ? (
                            <>
                                <button
                                    onClick={() => navigate('/ayarlar')}
                                    className="border border-gray-600 text-white p-2 rounded-full hover:bg-gray-800 transition"
                                    title="Ayarlar"
                                >
                                    <Settings size={18} />
                                </button>
                                <button
                                    onClick={() => navigate('/profil-duzenle')}
                                    className="border border-gray-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition">
                                    Profili Düzenle
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate(`/mesajlar/${profile.username}`)}
                                    className="border border-gray-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition">
                                    Mesaj
                                </button>
                                <button
                                    onClick={handleBlock}
                                    className="border border-red-600 text-red-400 text-sm font-bold px-4 py-2 rounded-full hover:bg-red-900/30 transition">
                                    {isBlocked ? 'Engeli Kaldır' : 'Engelle'}
                                </button>
                                {!isBlocked && (
                                    <button
                                        onClick={handleFollow}
                                        className={`text-sm font-bold px-4 py-2 rounded-full transition ${isFollowing || isPending ? 'border border-gray-600 text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}`}>
                                        {isPending ? 'İstek Gönderildi' : isFollowing ? 'Takipten Çık' : profile?.is_private ? 'Takip İsteği Gönder' : 'Takip Et'}
                                    </button>
                                )}
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
                    <div
                        className="cursor-pointer hover:underline"
                        onClick={() => openModal('following')}
                    >
                        <span className="text-white font-bold">{followingCount}</span>
                        <span className="text-gray-400 text-sm ml-1">Takip Edilen</span>
                    </div>
                    <div
                        className="cursor-pointer hover:underline"
                        onClick={() => openModal('followers')}
                    >
                        <span className="text-white font-bold">{followerCount}</span>
                        <span className="text-gray-400 text-sm ml-1">Takipçi</span>
                    </div>
                </div>
            </div>

            {/* Engellenmişse postları gösterme */}
            {isBlocked ? (
                <div className="flex items-center justify-center py-16">
                    <p className="text-gray-400">Bu kullanıcıyı engellediniz.</p>
                </div>
            ) : (
                <>
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
                            profile?.is_private && !isFollowing && !isOwnProfile ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-center">
                                    <div className="w-14 h-14 rounded-full border-2 border-gray-700 flex items-center justify-center">
                                        🔒
                                    </div>
                                    <p className="text-white font-bold">Bu hesap gizli</p>
                                    <p className="text-gray-500 text-sm">Postları görmek için takip etmen gerekiyor.</p>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-8">Henüz post yok.</p>
                            )
                        ) : (
                            posts.map((post: any) => (
                                <PostCard
                                    key={post.id}
                                    postId={post.id}
                                    username={post.username}
                                    handle={`@${post.username}`}
                                    content={post.content}
                                    imageUrl={post.image_url}
                                    avatarUrl={profile.avatar_url}
                                    createdAt={post.created_at}
                                    onDelete={(deletedId) => setPosts((prev) => prev.filter((p) => p.id !== deletedId))}
                                />
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Modal */}
            {modalType && (
                <div
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
                    onClick={closeModal}
                >
                    <div
                        className="bg-gray-900 rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <h2 className="text-white font-bold text-lg">
                                {modalType === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-white text-xl leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {modalLoading ? (
                                <p className="text-gray-400 text-center py-8">Yükleniyor...</p>
                            ) : modalUsers.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">
                                    {modalType === 'followers' ? 'Henüz takipçi yok.' : 'Henüz kimse takip edilmiyor.'}
                                </p>
                            ) : (
                                modalUsers.map((u: any) => (
                                    <div
                                        key={u.username}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer transition"
                                        onClick={() => {
                                            closeModal()
                                            navigate(`/profil/${u.username}`)
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
                                        <div>
                                            <p className="text-white font-bold text-sm">{u.full_name || u.username}</p>
                                            <p className="text-gray-400 text-xs">@{u.username}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default ProfilePage