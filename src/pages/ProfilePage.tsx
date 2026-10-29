import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { NIL_UUID } from '../utils/ids'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import ReportModal from '../components/ReportModal'
import { Settings, X, Pencil } from 'lucide-react'

function ProfilePage() {
    const navigate = useNavigate()
    const { username } = useParams()
    const { user } = useAuth()
    const uid = user?.id ?? NIL_UUID
    const [reportOpen, setReportOpen] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [followerCount, setFollowerCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followsMe, setFollowsMe] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [blockedByThem, setBlockedByThem] = useState(false)

    const [showPhotoModal, setShowPhotoModal] = useState(false)

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
            .maybeSingle()

        if (!profileData) {
            setProfile(null)
            setNotFound(true)
            return
        }

        setNotFound(false)
        setProfile(profileData)

        const { data: blockData } = await supabase
            .from('blocks')
            .select('*')
            .eq('blocker_id', uid)
            .eq('blocked_id', profileData?.id)
            .maybeSingle()
        setIsBlocked(!!blockData)

        const { data: blockedByData } = await supabase
            .from('blocks')
            .select('*')
            .eq('blocker_id', profileData?.id)
            .eq('blocked_id', uid)
            .maybeSingle()
        setBlockedByThem(!!blockedByData)

        if (!blockedByData) {
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
            .eq('follower_id', uid)
            .eq('following_id', profileData?.id)
            .maybeSingle()

    setIsFollowing(followData?.status === 'accepted')

        const { data: theyFollowMe } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', profileData?.id)
            .eq('following_id', uid)
            .eq('status', 'accepted')
            .maybeSingle()

        setFollowsMe(!!theyFollowMe)
    }

    const handleAvatarClick = () => {
        setShowPhotoModal(true)
    }

    const handleBlock = async () => {
        if (!user) {
            navigate('/giris')
            return
        }
        if (isBlocked) {
            await supabase
                .from('blocks')
                .delete()
                .eq('blocker_id', uid)
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

        setModalLoading(false)
    }

    const closeModal = () => {
        setModalType(null)
        setModalUsers([])
    }

    const handleFollow = async () => {
        if (!user) {
            navigate('/giris')
            return
        }
        if (isFollowing) {
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', uid)
                .eq('following_id', profile?.id)
        } else {
            await supabase
                .from('follows')
                .insert({ follower_id: uid, following_id: profile?.id, status: 'accepted' })
        }

        await fetchProfile()
    }

    if (notFound) return (
        <div className="min-h-screen border-x border-gray-800 flex flex-col items-center justify-center text-center px-6">
            <p className="text-ink font-bold text-lg">Bu kullanıcı bulunamadı</p>
            <p className="text-gray-500 text-sm mt-1">Kullanıcı adını değiştirmiş ya da hesabını silmiş olabilir.</p>
            <button
                onClick={() => navigate('/')}
                className="mt-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-5 py-2 rounded-full transition"
            >
                Ana sayfaya dön
            </button>
        </div>
    )

    if (!profile) return <div className="flex-1 p-4 text-ink">Yükleniyor...</div>

    if (blockedByThem) return (
        <div className="flex-1 min-h-screen border-x border-gray-800 flex items-center justify-center">
            <p className="text-gray-400">Bu içeriği görüntüleyemezsiniz.</p>
        </div>
    )

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
                        className="rounded-full w-fit cursor-pointer"
                    >
                        <Avatar
                            src={profile.avatar_url}
                            gender={profile.gender}
                            size={104}
                            alt="avatar"
                            bgColor="var(--color-gray-950)"
                        />
                    </button>

                    <div className="flex gap-2 mt-2 sm:mt-14 flex-wrap">
                        {isOwnProfile ? (
                            <>
                                <button
                                    onClick={() => navigate('/ayarlar')}
                                    className="border border-gray-600 text-ink p-2 rounded-full hover:bg-gray-800 transition"
                                    title="Ayarlar"
                                >
                                    <Settings size={18} />
                                </button>
                                <button
                                    onClick={() => navigate('/profil-duzenle')}
                                    className="border border-gray-600 text-ink text-sm font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition">
                                    Profili Düzenle
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate(`/mesajlar/${profile.username}`)}
                                    className="border border-gray-600 text-ink text-sm font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition">
                                    Mesaj
                                </button>
                                <button
                                    onClick={handleBlock}
                                    className="border border-red-600 text-red-400 text-sm font-bold px-4 py-2 rounded-full hover:bg-red-900/30 transition">
                                    {isBlocked ? 'Engeli Kaldır' : 'Engelle'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            navigate('/giris')
                                            return
                                        }
                                        setReportOpen(true)
                                    }}
                                    className="text-gray-500 hover:text-orange-500 text-sm underline px-2 transition">
                                    Şikayet et
                                </button>
                                {!isBlocked && (
                                    <button
                                        onClick={handleFollow}
                                        className={`text-sm font-bold px-4 py-2 rounded-full transition ${isFollowing ? 'border border-gray-600 text-ink hover:bg-gray-800' : 'bg-purple-600 text-white hover:bg-purple-500'}`}>
                                        {isFollowing ? 'Takipten Çık' : 'Takip Et'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-ink font-bold text-xl">{profile.full_name || profile.username}</h1>
                    {!isOwnProfile && followsMe && (
                        <span className="text-gray-400 text-xs border border-gray-700 rounded-full px-2 py-0.5">
                            Seni takip ediyor
                        </span>
                    )}
                </div>
                <p className="text-gray-400 text-sm">@{profile.username}</p>
                {profile.bio && <p className="text-ink mt-3">{profile.bio}</p>}

                <div className="flex gap-6 mt-4">
                    <div
                        className="cursor-pointer hover:underline"
                        onClick={() => openModal('following')}
                    >
                        <span className="text-ink font-bold">{followingCount}</span>
                        <span className="text-gray-400 text-sm ml-1">Takip Edilen</span>
                    </div>
                    <div
                        className="cursor-pointer hover:underline"
                        onClick={() => openModal('followers')}
                    >
                        <span className="text-ink font-bold">{followerCount}</span>
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
                    <div className="border-t border-gray-800">
                        {posts.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">Henüz soru yok.</p>
                        ) : (
                            posts.map((post: any) => {
                                const thumbnail = post.image_urls?.[0] ?? post.image_url
                                const heading = post.title || (post.content ?? '').slice(0, 80)

                                return (
                                    <Link
                                        key={post.id}
                                        to={`/gonderi/${post.id}`}
                                        className="flex gap-3 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-ink font-bold leading-snug">{heading}</h2>
                                            {post.title && post.content && (
                                                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{post.content}</p>
                                            )}
                                            <p className="text-gray-500 text-xs mt-2">
                                                {new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        {thumbnail && (
                                            <img src={thumbnail} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" loading="lazy" />
                                        )}
                                    </Link>
                                )
                            })
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
                        className="absolute top-6 right-6 text-ink/80 hover:text-ink transition"
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

                    <p className="text-ink font-bold text-lg mt-5">{profile.full_name || profile.username}</p>

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
                            <h2 className="text-ink font-bold text-lg">
                                {modalType === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-ink text-xl leading-none"
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
                                    return (
                                        <div
                                            key={u.username}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer transition"
                                            onClick={() => {
                                                closeModal()
                                                navigate(`/profil/${u.username}`)
                                            }}
                                        >
                                            <div className="rounded-full shrink-0">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-purple-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-ink font-bold text-sm">{u.full_name || u.username}</p>
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

            <ReportModal
                open={reportOpen}
                targetType="user"
                targetId={profile?.id ?? ''}
                onClose={() => setReportOpen(false)}
            />
        </div>
    )
}

export default ProfilePage