import { useAuth } from '../context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import PostCard from "./PostCard"
import { Image, X } from 'lucide-react'

async function convertIfHeic(file: File): Promise<File> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')

  if (!isHeic) return file

  const heic2any = (await import('heic2any')).default
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.85,
  })

  const blob = Array.isArray(converted) ? converted[0] : converted
  return new File(
    [blob],
    file.name.replace(/\.(heic|heif)$/i, '.jpg'),
    { type: 'image/jpeg' }
  )
}

function Feed() {

  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({})
  const [newPost, setNewPost] = useState('')

  // Resim seçme
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [posting, setPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPosts = async () => {
    // Engellenmiş kullanıcıların ID'lerini al
    const { data: blocksData } = await supabase
      .from('blocks')
      .select('blocked_id, blocker_id')
      .or(`blocker_id.eq.${user?.id},blocked_id.eq.${user?.id}`)

    const blockedIds = (blocksData ?? []).map((b: any) =>
      b.blocker_id === user?.id ? b.blocked_id : b.blocker_id
    )

    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (blockedIds.length > 0) {
      const { data: blockedProfiles } = await supabase
        .from('profiles')
        .select('username')
        .in('id', blockedIds)

      const blockedUsernames = (blockedProfiles ?? []).map((p: any) => p.username)

      if (blockedUsernames.length > 0) {
        query = query.not('username', 'in', `(${blockedUsernames.map((u: string) => `"${u}"`).join(',')})`)
      }
    }

    const { data } = await query
    if (data) setPosts(data)

    // Postlardaki tüm kullanıcı adları için avatar bilgisi çek
    const usernames = [...new Set((data ?? []).map((p: any) => p.username))]
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
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setConverting(true)
    try {
      const finalFile = await convertIfHeic(file)
      setImageFile(finalFile)
      setImagePreview(URL.createObjectURL(finalFile))
    } catch (err) {
      console.error('Resim dönüştürme hatası:', err)
      alert('Bu fotoğraf yüklenemedi. Lütfen JPEG veya PNG formatında bir fotoğraf seçin.')
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
    fetchPosts()
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <div className="flex-1 min-h-screen border-x border-gray-800">

      {/* Başlık */}
      <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800">
        <h1 className="text-white font-bold text-xl">Anasayfa</h1>
      </div>

      {/* Post atma alanı */}
      <div className="flex gap-3 p-4 border-b border-gray-800">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
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

          {/* Resim önizleme */}
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
              <Image size={20} />
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

      {/* Postlar */}
      {posts.map((post: any) => (
        <PostCard
          key={post.id}
          postId={post.id}
          username={post.username}
          handle={`@${post.username}`}
          content={post.content}
          imageUrl={post.image_url}
          avatarUrl={avatarMap[post.username]}
          createdAt={post.created_at}
          onDelete={(deletedId) => setPosts((prev) => prev.filter((p) => p.id !== deletedId))}
        />
      ))}

    </div>
  )
}

export default Feed