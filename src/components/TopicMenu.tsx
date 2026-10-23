import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '../supabase'
import { useToast } from '../context/ToastContext'

interface MenuTopic {
    id: string
    slug: string
    name: string
    emoji: string | null
}

function TopicMenu() {
    const { showToast } = useToast()
    const [open, setOpen] = useState(false)
    const [topics, setTopics] = useState<MenuTopic[]>([])
    const [loaded, setLoaded] = useState(false)

    const openMenu = async () => {
        setOpen(true)
        if (loaded) return

        const { data, error } = await supabase
            .from('topics')
            .select('id, slug, name, emoji')
            .order('sort_order', { ascending: true })

        if (error) {
            showToast('Konular yüklenemedi. Lütfen tekrar dene.', 'error')
            return
        }

        setTopics(data ?? [])
        setLoaded(true)
    }

    const closeMenu = () => setOpen(false)

    return (
        <>
            <button
                onClick={openMenu}
                className="text-gray-400 hover:text-ink transition"
                aria-label="Konular menüsü"
            >
                <Menu size={24} />
            </button>

            {open &&
                createPortal(
                    <div className="fixed inset-0 z-50">
                        <div className="absolute inset-0 bg-black/60" onClick={closeMenu} />

                        <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-gray-950 border-r border-gray-800 p-4 overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-ink font-bold text-lg">Konular</h2>
                                <button
                                    onClick={closeMenu}
                                    className="text-gray-400 hover:text-ink transition"
                                    aria-label="Menüyü kapat"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <Link
                                to="/"
                                onClick={closeMenu}
                                className="block px-3 py-3 rounded-xl text-gray-300 hover:bg-gray-900 hover:text-ink transition"
                            >
                                🏠 Tüm konular
                            </Link>

                            {topics.map((topic) => (
                                <Link
                                    key={topic.id}
                                    to={`/konu/${topic.slug}`}
                                    onClick={closeMenu}
                                    className="block px-3 py-3 rounded-xl text-gray-300 hover:bg-gray-900 hover:text-ink transition"
                                >
                                    {topic.emoji ?? '💬'} {topic.name}
                                </Link>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    )
}

export default TopicMenu
