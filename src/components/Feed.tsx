import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { convertIfHeic, resizeImage } from '../utils/imageHelpers'
import PostCard from "./PostCard"
import StoriesBar from "./StoriesBar"
import { Image, X } from 'lucide-react'

const PAGE_SIZE = 10

function PostSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b border-gray-800 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-800 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 bg-gray-800 rounded w-24" />
          <div className="h-3 bg-gray-800 rounded w-16" />
        </div>
        <div className="h-3 bg-gray-800 rounded w-full mb-2" />
        <div className="h-3 bg-gray-800 rounded w-2/3" />
      </div>
    </div>
  )
}

function Feed() {

  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const [posts, setPosts] = useState<any[]>([])
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({})
  const [newPost, setNewPost] = useState('')
  const [visibleUsernames, setVisibleUsernames] = useState<string[]>([])

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [converting, setConverting] = useState(false)
  const [posting, setPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAvatarsFor = async (usernames: string[]) => {
    if (usernames.length === 0) return
    const { data: profiles } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .in('username', usernames)

    setAvatarMap((prev) => {
      const map = { ...prev }
      ;(profiles ?? []).forEach((p: any) => {
        if (p.avatar_url) map[p.username] = p.avatar_url
      })
      return map
    })
  }

  // İlk yükleme: takip edilen kişileri + kendini belirle, engellenenleri çıkar
  const initFeed = async () => {
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user?.id)
      .eq('status', 'accepted')

    const followedIds = (followData ?? []).map((f: any) => f.following_id)
    const visibleIds = [...new Set([...followedIds, user?.id])]

    const { data: blocksData } = await supabase
      .from('blocks')
      .select('blocked_id, blocker_id')
      .or(`blocker_id.eq.${user?.id},blocked_id.eq.${user?.id}`)

    const blockedIds = new Set(
      (blocksData ?? []).map((b: any) =>
        b.blocker_id === user?.id ? b.blocked_id : b.blocker_id
      )
    )

    const finalIds = visibleIds.filter((id) => !blockedIds.has(id))

    let usernames: string[] = []
    if (finalIds.length > 0) {
      const { data: visibleProfiles } = await supabase
        .from('profiles')
        .select('username')
        .in('id', finalIds)
      usernames = (visibleProfiles ?? []).map((p: any) => p.username)
    }

    setVisibleUsernames(usernames)
    await loadPage(0, usernames)
    setInitialLoading(false)
  }

  const loadPage = async (pageNum: number, usernames: string[]) => {
    if (usernames.length === 0) {
      setPosts([])
      setHasMore(false)
      setLoadingMore(false)
      return
    }

    if (pageNum === 0) setLoadingMore(false)
    else setLoadingMore(true)

    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data } = await supabase
      .from('posts')
      .select('*')
      .in('username', usernames)
      .order('created_at', { ascending: false })
      .range(from, to)

    const newPosts = data ?? []

    setPosts((prev) => (pageNum === 0 ? newPosts : [...prev, ...newPosts]))
    setHasMore(newPosts.length === PAGE_SIZE)
    setPage(pageNum)
    setLoadingMore(false)

    const postUsernames = [...new Set(newPosts.map((p: any) => p.username))]
    fetchAvatarsFor(postUsernames)
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    loadPage(page + 1, visibleUsernames)
  }, [page, hasMore, loadingMore, visibleUsernames])

  // (IntersectionObserver kaldırıldı, aşağıda buton ile değiştirildi)

  const refreshFeed = () => {
    loadPage(0, visibleUsernames)
  }

 const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imageFiles.length)
    if (files.length === 0) return

    setConverting(true)
    try {
      const processed: File[] = []
      const previews: string[] = []

      for (const file of files) {
        const heicConverted = await convertIfHeic(file)
        const finalFile = await resizeImage(heicConverted, 1600)
        processed.push(finalFile)
        previews.push(URL.createObjectURL(finalFile))
      }

      setImageFiles((prev) => [...prev, ...processed])
      setImagePreviews((prev) => [...prev, ...previews])
    } catch (err) {
      console.error('Resim dönüştürme hatası:', err)
      showToast('Bazı fotoğraflar yüklenemedi. Lütfen JPEG veya PNG formatında fotoğraf seçin.', 'error')
    } finally {
      setConverting(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClearAllImages = () => {
    setImageFiles([])
    setImagePreviews([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  
   const handlePost = async () => {
    if (!newPost.trim() && imageFiles.length === 0) return

    if (newPost.length > 2000) {
      showToast('Post en fazla 2000 karakter olabilir.', 'error')
      return
    }

    setPosting(true)

    const uploadedUrls: string[] = []

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath)
        uploadedUrls.push(urlData.publicUrl)
      }
    }

    await supabase
      .from('posts')
      .insert({
        content: newPost,
        username: user?.user_metadata?.username,
        image_url: uploadedUrls[0] ?? null,
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
      })

    setNewPost('')
    handleClearAllImages()
    setPosting(false)
    refreshFeed()
    showToast('Postun paylaşıldı!', 'success')
  }

  useEffect(() => {
    initFeed()
  }, [])


  return (
    <div className="flex-1 min-h-screen border-x border-gray-800 max-w-full overflow-x-hidden">

      <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800">
        <h1 className="text-white font-bold text-xl">Anasayfa</h1>
      </div>

      <StoriesBar />

      <div className="flex gap-3 p-4 border-b border-gray-800">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <textarea
            placeholder="Ne düşünüyorsun?"
            className="w-full bg-transparent text-white placeholder-gray-500 text-lg resize-none outline-none"
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />

        {imagePreviews.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative shrink-0 rounded-2xl overflow-hidden border border-gray-700">
                  <img src={preview} alt={`önizleme ${index + 1}`} className="h-32 w-32 object-cover" />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {converting && (
            <p className="text-gray-500 text-sm mt-2 animate-pulse">Fotoğraf işleniyor...</p>
          )}

          <div className="flex items-center justify-between mt-2">
           <button
              onClick={() => fileInputRef.current?.click()}
              disabled={converting || imageFiles.length >= 5}
              className="text-purple-400 hover:text-purple-300 transition p-2 rounded-full hover:bg-gray-900 disabled:opacity-50"
              title={imageFiles.length >= 5 ? 'En fazla 5 fotoğraf' : 'Fotoğraf ekle'}
            >
              <Image size={20} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />

            <button
              onClick={handlePost}
              disabled={posting || converting || (!newPost.trim() && imageFiles.length === 0)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl transition disabled:opacity-50">
              {posting ? 'Paylaşılıyor...' : 'Paylaş'}
            </button>
          </div>
        </div>
      </div>

      {initialLoading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <p className="text-white font-bold">Henüz gösterecek post yok</p>
          <p className="text-gray-500 text-sm mt-1">Birilerini takip et, postları burada görünsün!</p>
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

    {hasMore && !initialLoading && (
        <div className="py-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white text-sm font-bold px-5 py-2 rounded-full transition disabled:opacity-50"
          >
            {loadingMore ? 'Yükleniyor...' : 'Daha fazla göster'}
          </button>
        </div>
      )}

    </div>
  )
}

export default Feed