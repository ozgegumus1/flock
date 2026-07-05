import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface GifItem {
    id: string
    previewUrl: string
    fullUrl: string
}

interface GifPickerProps {
    onSelect: (gifUrl: string) => void
    onClose: () => void
}

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
    const [query, setQuery] = useState('')
    const [gifs, setGifs] = useState<GifItem[]>([])
    const [loading, setLoading] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchGifs = async (searchTerm: string) => {
        setLoading(true)
        try {
            const endpoint = searchTerm.trim()
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=24&rating=pg-13&lang=tr`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=pg-13`

            const res = await fetch(endpoint)
            const data = await res.json()

            const items: GifItem[] = (data.data ?? []).map((g: any) => ({
                id: g.id,
                previewUrl: g.images.fixed_width_small?.url ?? g.images.fixed_width?.url,
                fullUrl: g.images.original?.url,
            }))

            setGifs(items)
        } catch (err) {
            console.error('GIF yüklenemedi:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGifs('')
    }, [])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            fetchGifs(query)
        }, 400)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [query])

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div
                className="bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[70vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <h3 className="text-white font-bold">GIF Seç</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-4 py-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="GIF ara..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto px-4 pb-4 flex-1">
                    {loading ? (
                        <p className="text-gray-500 text-sm text-center py-8">Yükleniyor...</p>
                    ) : gifs.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">Sonuç bulunamadı.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {gifs.map((gif) => (
                                <button
                                    key={gif.id}
                                    onClick={() => onSelect(gif.fullUrl)}
                                    className="rounded-lg overflow-hidden hover:opacity-80 transition aspect-square"
                                >
                                    <img src={gif.previewUrl} alt="gif" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-center text-gray-600 text-[10px] pb-3">Powered by GIPHY</p>
            </div>
        </div>
    )
}