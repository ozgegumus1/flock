import { useEffect, useRef, useState, memo, type ReactNode } from "react"
import { Heart, MessageCircle, Trash2, MoreHorizontal, Pencil, Flag, Bookmark } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../context/AuthContext"
import ConfirmModal from "./ConfirmModal"
import TeamBadge from "./TeamBadge"
import { useToast } from "../context/ToastContext"
import { NIL_UUID } from "../utils/ids"
import Avatar from "./Avatar"

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
  imageUrls?: string[] | null
  videoUrl?: string | null
  extra?: ReactNode
  isAnonymous?: boolean
  gender?: string | null
  isTeam?: boolean
}

function PostCardComponent({ username, handle, content, postId, avatarUrl, onDelete, createdAt, imageUrl, imageUrls, videoUrl, extra, isAnonymous, gender, isTeam }: PostCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
 const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likePop, setLikePop] = useState(false)
 const [showLikers, setShowLikers] = useState(false)
  const [likers, setLikers] = useState<any[]>([])
  const [loadingLikers, setLoadingLikers] = useState(false)
  const [saved, setSaved] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)

  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { showToast } = useToast()
  const uid = user?.id ?? NIL_UUID

  const requireLogin = () => {
    if (user) return false
    showToast('Devam etmek için giriş yapmalısın.', 'error')
    navigate('/giris')
    return true
  }
  const [loadingComments, setLoadingComments] = useState(false)
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null)
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean }>>({})
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)

  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [currentContent, setCurrentContent] = useState(content)

  const [anonOwner, setAnonOwner] = useState(false)
  const isOwnPost = isAnonymous ? anonOwner : user?.user_metadata?.username === username

  useEffect(() => {
    if (!isAnonymous) return
    supabase
      .from('anonymous_authors')
      .select('post_id')
      .eq('post_id', postId)
      .maybeSingle()
      .then(({ data }) => setAnonOwner(!!data))
  }, [isAnonymous, postId])

  const goToProfile = () => {
    if (!isAnonymous) navigate(`/profil/${username}`)
  }

useEffect(() => {
    fetchLikes()
    fetchCommentCount()
    fetchSaved()
  }, [])

  const fetchSaved = async () => {
    const { data } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', uid)
      .single()

    setSaved(!!data)
  }

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (requireLogin()) return
    if (saved) {
      await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', uid)
      setSaved(false)
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: uid })
      setSaved(true)
    }
  }

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
      .eq('user_id', uid)
      .single()

    setLiked(!!data)
  }

  const openLikersList = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (likeCount === 0) return
    setShowLikers(true)
    setLoadingLikers(true)

    const { data: likesData } = await supabase
      .from('likes')
      .select('user_id')
      .eq('post_id', postId)

    const userIds = (likesData ?? []).map((l: any) => l.user_id)
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)
      setLikers(profiles ?? [])
    } else {
      setLikers([])
    }
    setLoadingLikers(false)
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

    if (data && data.length > 0) {
      const commentIds = data.map((c: any) => c.id)
      const { data: likesData } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds)

      const map: Record<string, { count: number; liked: boolean }> = {}
      commentIds.forEach((id: string) => { map[id] = { count: 0, liked: false } })
      ;(likesData ?? []).forEach((l: any) => {
        map[l.comment_id].count += 1
        if (l.user_id === uid) map[l.comment_id].liked = true
      })
      setCommentLikes(map)
    }

    setLoadingComments(false)
  }

  const handleToggleCommentLike = async (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation()
    if (requireLogin()) return
    const current = commentLikes[commentId] ?? { count: 0, liked: false }

    if (current.liked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', uid)
      setCommentLikes((prev) => ({ ...prev, [commentId]: { count: current.count - 1, liked: false } }))
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: uid })
      setCommentLikes((prev) => ({ ...prev, [commentId]: { count: current.count + 1, liked: true } }))
    }
  }

  const handleStartEditComment = (e: React.MouseEvent, comment: any) => {
    e.stopPropagation()
    setOpenCommentMenuId(null)
    setEditingCommentId(comment.id)
    setEditCommentText(comment.content ?? '')
  }

  const handleSaveEditComment = async (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation()
    if (!editCommentText.trim()) return

    await supabase
      .from('comments')
      .update({ content: editCommentText.trim(), edited_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', uid)

    setComments((prev) => prev.map((c) =>
      c.id === commentId ? { ...c, content: editCommentText.trim(), edited_at: new Date().toISOString() } : c
    ))
    setEditingCommentId(null)
  }

  const handleReportComment = async (reason: string) => {
    if (requireLogin()) return
    if (!reportingCommentId) return

    await supabase.from('comment_reports').insert({
      comment_id: reportingCommentId,
      reporter_id: uid,
      reason,
    })

    setReportingCommentId(null)
  }

  const handleToggleComments = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !showComments
    setShowComments(next)
    if (next) fetchComments()
  }

  const handleAddComment = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (requireLogin()) return
    if (!newComment.trim()) return

    if (newComment.length > 500) {
      showToast('Yorum en fazla 500 karakter olabilir.', 'error')
      return
    }

    const { data: inserted } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: uid,
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
      .eq('user_id', uid)

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

  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    setConfirmDelete(true)
  }

  const performDeletePost = async () => {
    setConfirmDelete(false)

    if (isAnonymous) {
      await supabase.rpc('delete_anonymous_post', { p_post_id: String(postId) })
    } else {
      await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
    }

    if (onDelete) onDelete(postId)
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (requireLogin()) return
    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', uid)
      setLiked(false)
      setLikeCount(likeCount - 1)
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: uid })
      setLiked(true)
      setLikeCount(likeCount + 1)
      setLikePop(true)
      setTimeout(() => setLikePop(false), 300)
    }
  }

  return (
    <div className="border-b border-gray-800">
      <div className="flex gap-3 p-4 hover:bg-gray-900/50 transition cursor-pointer">

        <Avatar
          src={avatarUrl}
          gender={isAnonymous ? null : gender}
          size={46}
          alt={username}
          onClick={goToProfile}
          className={isAnonymous ? '' : 'cursor-pointer'}
        />

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                onClick={goToProfile}
                className={`text-ink font-bold ${isAnonymous ? '' : 'cursor-pointer hover:underline'}`}>
                {isAnonymous ? 'Anonim' : username}
              </span>
              {!isAnonymous && isTeam && <TeamBadge />}
              {!isAnonymous && <span className="text-gray-400 text-sm">{handle}</span>}
              {createdAt && (
                <>
                  <span className="text-gray-500 text-sm">·</span>
                  <span className="text-gray-500 text-sm">{formatTimeAgo(createdAt)}</span>
                </>
              )}
            </div>

            {isOwnPost && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu((s) => !s) }}
                  className="text-gray-500 hover:text-ink transition p-1 rounded-full hover:bg-gray-800"
                >
                  <MoreHorizontal size={18} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                    {!isAnonymous && (
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-ink hover:bg-gray-800 transition text-left"
                      >
                        <Pencil size={15} />
                        Soruyu düzenle
                      </button>
                    )}
                    <button
                      onClick={handleDeletePost}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition text-left"
                    >
                      <Trash2 size={15} />
                      Soruyu sil
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
                className="w-full bg-gray-900 border border-purple-500 rounded-xl px-3 py-2 text-ink text-sm outline-none resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-ink text-xs font-bold px-3 py-1.5 rounded-full transition"
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
            <p className="text-ink mt-1 whitespace-pre-wrap break-words">
              {currentContent.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) =>
                part.startsWith('#') ? (
                  <span key={i} className="text-purple-400">
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </p>
          )}

         {videoUrl && (
            <div className="mt-2 rounded-2xl overflow-hidden border border-gray-800" onClick={(e) => e.stopPropagation()}>
              <video src={videoUrl} controls className="w-full max-h-96" />
            </div>
          )}

          {!videoUrl && (() => {
            const images = imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : [])
            if (images.length === 0) return null

            if (images.length === 1) {
              return (
                <div className="mt-2 rounded-2xl overflow-hidden border border-gray-800">
                 <img
                    src={images[0]}
                    alt="post görseli"
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-96 object-cover"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )
            }

            return (
              <div className="mt-2 relative" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl overflow-hidden border border-gray-800">
                 <img
                    src={images[carouselIndex]}
                    alt={`post görseli ${carouselIndex + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-96 object-cover"
                  />
                </div>

                {carouselIndex > 0 && (
                  <button
                    onClick={() => setCarouselIndex((i) => i - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition"
                  >
                    <MoreHorizontal size={0} className="hidden" />
                    ‹
                  </button>
                )}
                {carouselIndex < images.length - 1 && (
                  <button
                    onClick={() => setCarouselIndex((i) => i + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition"
                  >
                    ›
                  </button>
                )}

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition ${i === carouselIndex ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>

                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {carouselIndex + 1}/{images.length}
                </div>
              </div>
            )
          })()}

          {extra && <div onClick={(e) => e.stopPropagation()}>{extra}</div>}

          <div className="flex items-center gap-5 mt-3">
            <div
              onClick={handleLike}
              className={`flex items-center gap-1 transition cursor-pointer w-fit ${liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
            >
              <Heart
                size={18}
                fill={liked ? 'currentColor' : 'none'}
                className={likePop ? 'scale-125 transition-transform duration-150' : 'scale-100 transition-transform duration-150'}
              />
             <span onClick={openLikersList} className="text-sm hover:underline">
                {likeCount}
              </span>
            </div>

            <div
              onClick={handleToggleComments}
              className={`flex items-center gap-1 transition cursor-pointer w-fit ${showComments ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
            >
              <MessageCircle size={18} />
              <span className="text-sm">{commentCount}</span>
            </div>

            <button
              onClick={handleToggleSave}
              className={`ml-auto transition ${saved ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
              title={saved ? 'Kaydı kaldır' : 'Kaydet'}
            >
              <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="px-4 pb-4 pl-16" onClick={(e) => e.stopPropagation()}>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Yorum yaz..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment(e as any)
              }}
              maxLength={500}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-sm text-ink outline-none focus:border-purple-500 transition"
            />
            <button
              onClick={handleAddComment}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-full transition shrink-0"
            >
              Gönder
            </button>
          </div>

          {loadingComments ? (
            <p className="text-gray-500 text-sm">Yükleniyor...</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz cevap yok. İlk cevabı sen ver!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {comments.map((comment: any) => {
                const isMine = comment.user_id === uid
                const likeInfo = commentLikes[comment.id] ?? { count: 0, liked: false }
                const isEditingThis = editingCommentId === comment.id

                return (
                  <div key={comment.id} className="relative flex items-start gap-2 min-w-0">
                    <div className="flex-1 bg-gray-900 rounded-2xl px-3 py-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            onClick={() => navigate(`/profil/${comment.username}`)}
                            className="text-ink font-bold text-xs cursor-pointer hover:underline shrink-0"
                          >
                            {comment.username}
                          </span>
                          <span className="text-gray-500 text-xs shrink-0">{formatTimeAgo(comment.created_at)}</span>
                          {comment.edited_at && (
                            <span className="text-gray-600 text-[10px] shrink-0">(düzenlendi)</span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenCommentMenuId(
                              openCommentMenuId === comment.id ? null : comment.id
                            )
                          }}
                          className="text-gray-500 hover:text-ink transition shrink-0"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>

                      {isEditingThis ? (
                        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            maxLength={500}
                            className="w-full bg-gray-800 border border-purple-500 rounded-lg px-2 py-1 text-sm text-ink outline-none"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 mt-1">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-gray-400 hover:text-ink text-xs font-bold px-2 py-1"
                            >
                              Vazgeç
                            </button>
                            <button
                              onClick={(e) => handleSaveEditComment(e, comment.id)}
                              className="text-purple-400 hover:text-purple-300 text-xs font-bold px-2 py-1"
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {comment.content && (
                            <p className="text-gray-200 text-sm mt-0.5 break-words">{comment.content}</p>
                          )}
                        </>
                      )}

                      <button
                        onClick={(e) => handleToggleCommentLike(e, comment.id)}
                        className={`flex items-center gap-1 mt-1.5 text-xs transition ${likeInfo.liked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'}`}
                      >
                        <Heart size={13} fill={likeInfo.liked ? 'currentColor' : 'none'} />
                        {likeInfo.count > 0 && likeInfo.count}
                      </button>
                    </div>

                    {openCommentMenuId === comment.id && (
                      <div className="absolute right-0 top-6 bg-gray-900 border border-gray-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                        {isMine ? (
                          <>
                            <button
                              onClick={(e) => handleStartEditComment(e, comment)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-ink hover:bg-gray-800 transition text-left"
                            >
                              <Pencil size={13} />
                              Düzenle
                            </button>
                            <button
                              onClick={(e) => handleDeleteComment(e, comment.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-gray-800 transition text-left"
                            >
                              <Trash2 size={13} />
                              Yorumu sil
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenCommentMenuId(null)
                              setReportingCommentId(comment.id)
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-orange-400 hover:bg-gray-800 transition text-left"
                          >
                            <Flag size={13} />
                            Şikayet et
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Soruyu silmek istediğine emin misin?"
        message="Bu işlem geri alınamaz."
        confirmText="Sil"
        danger
        onConfirm={performDeletePost}
        onCancel={() => setConfirmDelete(false)}
      />

      {showLikers && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
          onClick={() => setShowLikers(false)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-ink font-bold">Beğenenler</h3>
              <button onClick={() => setShowLikers(false)} className="text-gray-400 hover:text-ink transition">✕</button>
            </div>
            <div className="overflow-y-auto px-2 py-2">
              {loadingLikers ? (
                <p className="text-gray-500 text-sm text-center py-6">Yükleniyor...</p>
              ) : likers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Henüz kimse beğenmedi.</p>
              ) : (
                likers.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={() => { setShowLikers(false); navigate(`/profil/${u.username}`) }}
                    className="flex items-center gap-3 px-2 py-2.5 hover:bg-gray-800 rounded-xl cursor-pointer transition"
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-ink font-bold text-sm truncate">{u.full_name || u.username}</p>
                      <p className="text-gray-500 text-xs truncate">@{u.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {reportingCommentId && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
          onClick={() => setReportingCommentId(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xs p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-ink font-bold mb-3">Yorumu şikayet et</h3>
            {['Spam', 'Taciz veya nefret söylemi', 'Uygunsuz içerik', 'Diğer'].map((reason) => (
              <button
                key={reason}
                onClick={() => handleReportComment(reason)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-ink hover:bg-gray-800 rounded-lg transition text-left"
              >
                {reason}
              </button>
            ))}
            <button
              onClick={() => setReportingCommentId(null)}
              className="w-full mt-2 text-gray-400 text-sm font-bold py-2"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const PostCard = memo(PostCardComponent)
export default PostCard