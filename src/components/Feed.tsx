import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import PostCard from "./PostCard"

function Feed() {

  const { user } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const handlePost = async () => {
    if (!newPost.trim()) return

    await supabase
      .from('posts')
      .insert({ content: newPost, username: user?.user_metadata?.username })

    setNewPost('')

    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setPosts(data)
  }
  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setPosts(data)
    }

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

      {/* Postlar */}
      {posts.map((post: any) => (
        <PostCard
          key={post.id}
          postId={post.id}
          username={post.username}
          handle={`@${post.username}`}
          content={post.content}
        />
      ))}

    </div>
  )
}

export default Feed