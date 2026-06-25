import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../context/AuthContext"

interface PostCardProps {
  username: string
  handle: string
  content: string
  postId: string
  avatarUrl?: string | null
}

function PostCard({ username, handle, content, postId, avatarUrl }: PostCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    fetchLikes()
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

  const handleLike = async () => {
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
    <div className="flex gap-3 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition cursor-pointer">

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
        <div className="flex items-center gap-2">
          <span
            onClick={() => navigate(`/profil/${username}`)}
            className="text-white font-bold cursor-pointer hover:underline">
            {username}
          </span>
          <span className="text-gray-400 text-sm">{handle}</span>
        </div>
        <p className="text-white mt-1">{content}</p>

        <div className="flex items-center gap-4 mt-3">
          <div
            onClick={handleLike}
            className={`flex items-center gap-1 transition cursor-pointer w-fit ${liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span className="text-sm">{likeCount}</span>
          </div>
        </div>
      </div>

    </div>
  )
}

export default PostCard