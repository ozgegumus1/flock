import { useEffect, useRef, useState } from "react"
import { Heart, MessageCircle, Trash2, MoreHorizontal, Pencil } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../context/AuthContext"

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'şimdi'
  if (diffMin < 60) return `${diffMin}dk`
  if (diffHour < 24) return `${diffHour}sa`
  if (diffDay < 7) return `${diffDay}g`

  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

interface PostCardProps {
  username: string
  handle: string
  content: string
  postId: string
  avatarUrl?: string | null
  onDelete?: (postId: string) => void
  createdAt?: string
  imageUrl?: string | null
}

function PostCard({ username, handle, content, postId, avatarUrl, onDelete, createdAt, imageUrl }: PostCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  // Yorumlar
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null)

  // Post seçenekleri menüsü
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Post düzenleme
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [currentContent, setCurrentContent] = useState(content)

  const isOwnPost = user?.user_metadata?.username === username

  useEffect(() => {
    fetchLikes()
    fetchCommentCount()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchLikes = async () => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)

    setLikeCount(count ?? 0)

    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user?.id)
      .single()

    setLiked(!!data)
  }

  const fetchCommentCount = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)

    setCommentCount(count ?? 0)
  }

  const fetchComments = async () => {
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    setComments(data ?? [])
    setLoadingComments(false)
  }

  const handleToggleComments = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !showComments
    setShowComments(next)
    if (next) fetchComments()
  }

  const handleAddComment = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!newComment.trim()) return

    const { data: inserted } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user?.id,
        username: user?.user_metadata?.username,
        content: newComment.trim(),
      })
      .select()
      .single()

    if (inserted) {
      setComments((prev) => [...prev, inserted])
      setCommentCount((c) => c + 1)
    }
    setNewComment('')
  }

  const handleDeleteComment = async (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation()
    await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user?.id)

    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setCommentCount((c) => Math.max(0, c - 1))
    setOpenCommentMenuId(null)
  }

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    setEditContent(currentContent)
    setIsEditing(true)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditContent(currentContent)
    setIsEditing(false)
  }

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editContent.trim()) return

    await supabase
      .from('posts')
      .update({ content: editContent.trim() })
      .eq('id', postId)

    setCurrentContent(editContent.trim())
    setIsEditing(false)
  }

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    const confirmed = window.confirm('Bu postu silmek istediğine emin misin?')
    if (!confirmed) return

    await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (onDelete) onDelete(postId)
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user?.id)
      setLiked(false)
      setLikeCount(likeCount - 1)
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user?.id })
      setLiked(true)
      setLikeCount(likeCount + 1)
    }
  }

  return (
    <div className="border-b border-gray-800">
      <div className="flex gap-3 p-4 hover:bg-gray-900/50 transition cursor-pointer">

        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer"
            onClick={() => navigate(`/profil/${username}`)}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full bg-purple-500 shrink-0 cursor-pointer"
            onClick={() => navigate(`/profil/${username}`)}
          />
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                onClick={() => navigate(`/profil/${username}`)}
                className="text-white font-bold cursor-pointer hover:underline">
                {username}
              </span>
              <span className="text-gray-400 text-sm">{handle}</span>
              {createdAt && (
                <>
                  <span className="text-gray-500 text-sm">·</span>
                  <span className="text-gray-500 text-sm">{formatTimeAgo(createdAt)}</span>
                </>
              )}
            </div>

            {/* Üç nokta menüsü - sadece kendi postunda */}
            {isOwnPost && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu((s) => !s) }}
                  className="text-gray-500 hover:text-white transition p-1 rounded-full hover:bg-gray-800"
                >
                  <MoreHorizontal size={18} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                    <button
                      onClick={handleStartEdit}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white hover:bg-gray-800 transition text-left"
                    >
                      <Pencil size={15} />
                      Postu düzenle
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition text-left"
                    >
                      <Trash2 size={15} />
                      Postu sil
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full bg-gray-900 border border-purple-500 rounded-xl px-3 py-2 text-white text-sm outline-none resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-full transition"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-1.5 rounded-full transition"
                >
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <p className="text-white mt-1">{currentContent}</p>
          )}

          {/* Post resmi */}
          {imageUrl && (
            <div className="mt-2 rounded-2xl overflow-hidden border border-gray-800">
              <img
                src={imageUrl}
                alt="post görseli"
                className="w-full max-h-96 object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="flex items-center gap-5 mt-3">
            <div
              onClick={handleLike}
              className={`flex items-center gap-1 transition cursor-pointer w-fit ${liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span className="text-sm">{likeCount}</span>
            </div>

            <div
              onClick={handleToggleComments}
              className={`flex items-center gap-1 transition cursor-pointer w-fit ${showComments ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
            >
              <MessageCircle size={18} />
              <span className="text-sm">{commentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Yorumlar bölümü */}
      {showComments && (
        <div className="px-4 pb-4 pl-16" onClick={(e) => e.stopPropagation()}>
          {/* Yorum yazma */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Yorum yaz..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment(e as any)
              }}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-purple-500 transition"
            />
            <button
              onClick={handleAddComment}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-full transition shrink-0"
            >
              Gönder
            </button>
          </div>

          {/* Yorum listesi */}
          {loadingComments ? (
            <p className="text-gray-500 text-sm">Yükleniyor...</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz yorum yok. İlk yorumu sen yap!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {comments.map((comment: any) => {
                const isMine = comment.user_id === user?.id
                return (
                  <div key={comment.id} className="relative flex items-start gap-2">
                    <div className="flex-1 bg-gray-900 rounded-2xl px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => navigate(`/profil/${comment.username}`)}
                            className="text-white font-bold text-xs cursor-pointer hover:underline"
                          >
                            {comment.username}
                          </span>
                          <span className="text-gray-500 text-xs">{formatTimeAgo(comment.created_at)}</span>
                        </div>

                        {isMine && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenCommentMenuId(
                                openCommentMenuId === comment.id ? null : comment.id
                              )
                            }}
                            className="text-gray-500 hover:text-white transition shrink-0"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-200 text-sm mt-0.5">{comment.content}</p>
                    </div>

                    {isMine && openCommentMenuId === comment.id && (
                      <div className="absolute right-0 top-6 bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[120px]">
                        <button
                          onClick={(e) => handleDeleteComment(e, comment.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-gray-800 transition text-left"
                        >
                          <Trash2 size={13} />
                          Yorumu sil
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PostCard