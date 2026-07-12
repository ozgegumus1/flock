import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { convertIfHeic, resizeImage } from '../utils/imageHelpers'
import PostCard from '../components/PostCard'
import { StoryViewer } from '../components/StoryViewer'
import { Settings, Image as ImageIcon, X, Pencil } from 'lucide-react'

function ProfilePage() {
    const navigate = useNavigate()
    const { username } = useParams()
    const { user, profile: myProfile } = useAuth()
    const { showToast } = useToast()
    const [profile, setProfile] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [followerCount, setFollowerCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [followsMe, setFollowsMe] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [blockedByThem, setBlockedByThem] = useState(false)
    const [newPost, setNewPost] = useState('')

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [converting, setConverting] = useState(false)
    const [posting, setPosting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [activeStories, setActiveStories] = useState<any[]>([])
    const [showStoryViewer, setShowStoryViewer] = useState(false)
    const [showPhotoModal, setShowPhotoModal] = useState(false)

    const [modalType, setModalType] = useState<'followers' | 'following' | null>(null)
    const [modalUsers, setModalUsers] = useState<any[]>([])
    const [modalLoading, setModalLoading] = useState(false)
    const [modalStoryMap, setModalStoryMap] = useState<Record<string, any[]>>({})
    const [modalViewerGroups, setModalViewerGroups] = useState<any[] | null>(null)

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

        if (profileData) {
            const { data: stories } = await supabase
                .from('stories')
                .select('*')
                .eq('user_id', profileData.id)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: true })

            setActiveStories(stories ?? [])
        }

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

        const { data: theyFollowMe } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', profileData?.id)
            .eq('following_id', user?.id)
            .eq('status', 'accepted')
            .single()

        setFollowsMe(!!theyFollowMe)
    }

    const handleAvatarClick = () => {
        if (activeStories.length > 0) {
            setShowStoryViewer(true)
        } else {
            setShowPhotoModal(true)
        }
    }

    const closeStoryViewer = () => {
        setShowStoryViewer(false)
        fetchProfile()
    }

    const handleBlock = async () => {
        if (isBlocked) {
            await supabase
                .from('blocks')
                .delete()
                .eq('blocker_id', user?.id)
                .eq('blocked_id', profile?.id)
        } else {
            await supabase.rpc('block_user', { target_user_id: profile?.id })
        }

        await fetchProfile()
    }

    const openModal = async (type: 'followers' | 'following') => {
        setModalType(type)
        setModalLoading(true)
        setModalUsers([])
        setModalStoryMap({})

        let profiles: any[] = []

        if (type === 'followers') {
            const { data } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', profile?.id)
                .eq('status', 'accepted')

            if (data && data.length > 0) {
                const ids = data.map((f: any) => f.follower_id)
                const { data: profs } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .in('id', ids)
                profiles = profs ?? []
            }
        } else {
            const { data } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', profile?.id)
                .eq('status', 'accepted')

            if (data && data.length > 0) {
                const ids = data.map((f: any) => f.following_id)
                const { data: profs } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .in('id', ids)
                profiles = profs ?? []
            }
        }

        setModalUsers(profiles)

        if (profiles.length > 0) {
            const ids = profiles.map((p: any) => p.id)
            const { data: stories } = await supabase
                .from('stories')
                .select('*')
                .in('user_id', ids)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: true })

            const grouped: Record<string, any[]> = {}
            ;(stories ?? []).forEach((s: any) => {
                if (!grouped[s.user_id]) grouped[s.user_id] = []
                grouped[s.user_id].push(s)
            })
            setModalStoryMap(grouped)
        }

        setModalLoading(false)
    }

    const closeModal = () => {
        setModalType(null)
        setModalUsers([])
        setModalStoryMap({})
    }

    const openModalStoryViewer = (e: React.MouseEvent, u: any) => {
        e.stopPropagation()
        const stories = modalStoryMap[u.id]
        if (!stories || stories.length === 0) return

        setModalViewerGroups([{
            userId: u.id,
            username: u.username,
            avatarUrl: u.avatar_url,
            stories,
            hasUnseen: false,
        }])
    }

    const handleFollow = async () => {
        if (isPending) {
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
            await supabase
                .from('follows')
                .insert({ follower_id: user?.id, following_id: profile?.id, status: 'pending' })
        } else {
            await supabase
                .from('follows')
                .insert({ follower_id: user?.id, following_id: profile?.id, status: 'accepted' })
        }

        await fetchProfile()
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setConverting(true)
        try {
            const heicConverted = await convertIfHeic(file)
            const finalFile = await resizeImage(heicConverted, 1600)
            setImageFile(finalFile)
            setImagePreview(URL.createObjectURL(finalFile))
        } catch (err) {
            console.error('Resim dönüştürme hatası:', err)
            showToast('Bu fotoğraf yüklenemedi. Lütfen JPEG veya PNG formatında bir fotoğraf seçin.', 'error')
        } finally {
            setConverting(false)
        }
    }

    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handlePost = async () => {
        if (!newPost.trim() && !imageFile) return

        setPosting(true)

        let imageUrl: string | null = null

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop()
            const filePath = `${user?.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, imageFile)

            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(filePath)
                imageUrl = urlData.publicUrl
            }
        }

        await supabase
            .from('posts')
            .insert({
                content: newPost,
                username: user?.user_metadata?.username,
                image_url: imageUrl,
            })

        setNewPost('')
        handleRemoveImage()
        setPosting(false)
        showToast('Postun paylaşıldı!', 'success')

        const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false })

        if (postsData) setPosts(postsData)
    }

    if (!profile) return <div className="flex-1 p-4 text-white">Yükleniyor...</div>

    if (blockedByThem) return (
        <div className="flex-1 min-h-screen border-x border-gray-800 flex items-center justify-center">
            <p className="text-gray-400">Bu içeriği görüntüleyemezsiniz.</p>
        </div>
    )

    const hasActiveStories = activeStories.length > 0

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">

            {profile.cover_url ? (
                <img
                    src={profile.cover_url}
                    alt="kapak"
                    className="h-48 w-full object-cover"
                />
            ) : (
                <div className="h-48 bg-gradient-to-r from-purple-900 to-indigo-900" />
            )}

            <div className="px-6 pb-4">

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-12 mb-4 gap-3">
                    <button
                        onClick={handleAvatarClick}
                        className={`rounded-full w-fit ${hasActiveStories ? 'p-[3px] bg-gradient-to-tr from-purple-600 to-pink-500 cursor-pointer' : 'cursor-pointer'}`}
                    >
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-950" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-purple-500 border-4 border-gray-950" />
                        )}
                    </button>

                    <div className="flex gap-2 mt-2 sm:mt-14 flex-wrap">
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

                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-white font-bold text-xl">{profile.full_name || profile.username}</h1>
                    {!isOwnProfile && followsMe && (
                        <span className="text-gray-400 text-xs border border-gray-700 rounded-full px-2 py-0.5">
                            Seni takip ediyor
                        </span>
                    )}
                </div>
                <p className="text-gray-400 text-sm">@{profile.username}</p>
                {profile.bio && <p className="text-white mt-3">{profile.bio}</p>}

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

            {isBlocked ? (
                <div className="flex items-center justify-center py-16">
                    <p className="text-gray-400">Bu kullanıcıyı engellediniz.</p>
                </div>
            ) : (
                <>
                    {isOwnProfile && (
                        <div className="flex gap-3 p-4 border-b border-gray-800">
                            {myProfile?.avatar_url ? (
                                <img src={myProfile.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
                            )}
                            <div className="flex-1">
                                <textarea
                                    placeholder="Ne düşünüyorsun?"
                                    className="w-full bg-transparent text-white placeholder-gray-500 text-lg resize-none outline-none"
                                    rows={3}
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                />

                                {imagePreview && (
                                    <div className="relative mt-2 rounded-2xl overflow-hidden border border-gray-700 w-fit">
                                        <img src={imagePreview} alt="önizleme" className="max-h-64 object-cover" />
                                        <button
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-black transition"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                {converting && (
                                    <p className="text-gray-500 text-sm mt-2 animate-pulse">Fotoğraf işleniyor...</p>
                                )}

                                <div className="flex items-center justify-between mt-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={converting}
                                        className="text-purple-400 hover:text-purple-300 transition p-2 rounded-full hover:bg-gray-900 disabled:opacity-50"
                                        title="Fotoğraf ekle"
                                    >
                                        <ImageIcon size={20} />
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,.heic,.heif"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />

                                    <button
                                        onClick={handlePost}
                                        disabled={posting || converting || (!newPost.trim() && !imageFile)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl transition disabled:opacity-50">
                                        {posting ? 'Paylaşılıyor...' : 'Paylaş'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                imageUrls={post.image_urls}
                videoUrl={post.video_url}
                                    avatarUrl={profile.avatar_url}
                                    createdAt={post.created_at}
                                    onDelete={(deletedId) => setPosts((prev) => prev.filter((p) => p.id !== deletedId))}
                                />
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Profil fotoğrafını büyütme modalı */}
            {showPhotoModal && (
                <div
                    className="fixed inset-0 bg-black/85 z-50 flex flex-col items-center justify-center px-6"
                    onClick={() => setShowPhotoModal(false)}
                >
                    <button
                        onClick={() => setShowPhotoModal(false)}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition"
                    >
                        <X size={26} />
                    </button>

                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="avatar"
                            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full object-cover"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div
                            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-purple-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}

                    <p className="text-white font-bold text-lg mt-5">{profile.full_name || profile.username}</p>

                    {isOwnProfile && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate('/profil-duzenle') }}
                            className="mt-4 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition"
                        >
                            <Pencil size={16} />
                            Profili Düzenle
                        </button>
                    )}
                </div>
            )}

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
                                modalUsers.map((u: any) => {
                                    const hasStory = !!modalStoryMap[u.id]?.length
                                    return (
                                        <div
                                            key={u.username}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer transition"
                                            onClick={() => {
                                                closeModal()
                                                navigate(`/profil/${u.username}`)
                                            }}
                                        >
                                            <div
                                                onClick={hasStory ? (e) => openModalStoryViewer(e, u) : undefined}
                                                className={`rounded-full shrink-0 ${hasStory ? 'p-[2px] bg-gradient-to-tr from-purple-600 to-pink-500' : ''}`}
                                            >
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-purple-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">{u.full_name || u.username}</p>
                                                <p className="text-gray-400 text-xs">@{u.username}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showStoryViewer && hasActiveStories && (
                <StoryViewer
                    groups={[{
                        userId: profile.id,
                        username: profile.username,
                        avatarUrl: profile.avatar_url,
                        stories: activeStories,
                        hasUnseen: false,
                    }]}
                    startGroupIndex={0}
                    onClose={closeStoryViewer}
                />
            )}

            {modalViewerGroups && (
                <StoryViewer
                    groups={modalViewerGroups}
                    startGroupIndex={0}
                    onClose={() => setModalViewerGroups(null)}
                />
            )}

        </div>
    )
}

export default ProfilePage