import { useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { X, Image as ImageIcon } from 'lucide-react'

async function convertIfHeic(file: File): Promise<File> {
    const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif')

    if (!isHeic) return file

    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
}

interface CreateStoryModalProps {
    onClose: () => void
    onCreated: () => void
}

export function CreateStoryModal({ onClose, onCreated }: CreateStoryModalProps) {
    const { user } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [caption, setCaption] = useState('')
    const [converting, setConverting] = useState(false)
    const [posting, setPosting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (!selected) return

        setConverting(true)
        try {
            const finalFile = await convertIfHeic(selected)
            setFile(finalFile)
            setPreview(URL.createObjectURL(finalFile))
        } catch (err) {
            alert('Bu fotoğraf yüklenemedi. Lütfen JPEG veya PNG formatında bir fotoğraf seç.')
        } finally {
            setConverting(false)
        }
    }

    const handleShare = async () => {
        if (!file) return
        setPosting(true)

        const fileExt = file.name.split('.').pop()
        const filePath = `${user?.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('stories')
            .upload(filePath, file)

        if (!uploadError) {
            const { data: urlData } = supabase.storage.from('stories').getPublicUrl(filePath)

            await supabase.from('stories').insert({
                user_id: user?.id,
                username: user?.user_metadata?.username,
                media_url: urlData.publicUrl,
                media_type: 'image',
                caption: caption.trim() || null,
            })
        }

        setPosting(false)
        onCreated()
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden">
                {/* Başlık */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <h2 className="text-white font-bold">Hikaye Paylaş</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    {preview ? (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[400px] mx-auto">
                            <img src={preview} alt="önizleme" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={converting}
                            className="w-full aspect-[9/16] max-h-[400px] rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-purple-500 transition mx-auto disabled:opacity-50"
                        >
                            <ImageIcon size={32} className="text-gray-500" />
                            <span className="text-gray-400 text-sm">
                                {converting ? 'İşleniyor...' : 'Fotoğraf seç'}
                            </span>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.heic,.heif"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {preview && (
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Bir şey yaz... (opsiyonel)"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 mt-3 text-white text-sm placeholder-gray-500 outline-none focus:border-purple-500 transition"
                        />
                    )}

                    <div className="flex gap-2 mt-4">
                        {preview && (
                            <button
                                onClick={() => { setFile(null); setPreview(null) }}
                                className="flex-1 border border-gray-700 text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition"
                            >
                                Değiştir
                            </button>
                        )}
                        <button
                            onClick={handleShare}
                            disabled={!file || posting || converting}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
                        >
                            {posting ? 'Paylaşılıyor...' : 'Paylaş'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}