import { useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { convertIfHeic, resizeImage } from '../utils/imageHelpers'
import { X, Type, Image as ImageIcon } from 'lucide-react'

const TEXT_COLORS = ['#ffffff', '#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#000000']

interface CreateStoryModalProps {
    onClose: () => void
    onCreated: () => void
}

export function CreateStoryModal({ onClose, onCreated }: CreateStoryModalProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [converting, setConverting] = useState(false)
    const [posting, setPosting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [showTextInput, setShowTextInput] = useState(false)
    const [caption, setCaption] = useState('')
    const [textColor, setTextColor] = useState('#ffffff')
    const [textPos, setTextPos] = useState({ x: 50, y: 50 })
    const draggingRef = useRef(false)
    const stageRef = useRef<HTMLDivElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (!selected) return

        setConverting(true)
        try {
            const heicConverted = await convertIfHeic(selected)
            const finalFile = await resizeImage(heicConverted, 1200)
            setFile(finalFile)
            setPreview(URL.createObjectURL(finalFile))
        } catch (err) {
            showToast('Bu fotoğraf yüklenemedi. Lütfen JPEG veya PNG formatında bir fotoğraf seç.', 'error')
        } finally {
            setConverting(false)
        }
    }

    const getRelativePos = (clientX: number, clientY: number) => {
        const stage = stageRef.current
        if (!stage) return { x: 50, y: 50 }
        const rect = stage.getBoundingClientRect()
        const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
        const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
        return { x, y }
    }

    const handleDragStart = () => { draggingRef.current = true }
    const handleDragEnd = () => { draggingRef.current = false }

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!draggingRef.current) return
        if ('touches' in e) {
            const t = e.touches[0]
            setTextPos(getRelativePos(t.clientX, t.clientY))
        } else {
            setTextPos(getRelativePos(e.clientX, e.clientY))
        }
    }

    const cycleColor = () => {
        const idx = TEXT_COLORS.indexOf(textColor)
        setTextColor(TEXT_COLORS[(idx + 1) % TEXT_COLORS.length])
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

            showToast('Hikayen paylaşıldı!', 'success')
        } else {
            showToast('Hikaye paylaşılamadı, tekrar dene.', 'error')
        }

        setPosting(false)
        onCreated()
    }

    if (!preview) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                <div className="flex items-center justify-between px-4 py-4">
                    <button onClick={onClose} className="text-white p-2 rounded-full hover:bg-white/10 transition">
                        <X size={24} />
                    </button>
                    <h2 className="text-white font-bold">Hikaye Oluştur</h2>
                    <div className="w-9" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={converting}
                        className="w-full max-w-xs aspect-[9/16] rounded-3xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-3 hover:border-purple-500 transition disabled:opacity-50 bg-gray-900/40"
                    >
                        <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                            <ImageIcon size={28} className="text-purple-400" />
                        </div>
                        <span className="text-gray-300 text-sm font-medium">
                            {converting ? 'İşleniyor...' : 'Galeriden fotoğraf seç'}
                        </span>
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col select-none">

            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-30">
                <button
                    onClick={() => { setFile(null); setPreview(null); setCaption(''); setShowTextInput(false) }}
                    className="text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition"
                >
                    <X size={22} />
                </button>

                <button
                    onClick={() => setShowTextInput((s) => !s)}
                    className={`p-2.5 rounded-full transition ${showTextInput ? 'bg-white text-black' : 'bg-black/40 text-white hover:bg-black/60'}`}
                >
                    <Type size={20} />
                </button>
            </div>

            <div
                ref={stageRef}
                className="relative flex-1 flex items-center justify-center bg-black overflow-hidden"
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
            >
                <img src={preview} alt="önizleme" className="w-full h-full object-contain" />

                {caption && (
                    <div
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                        className="absolute cursor-move px-3 py-1"
                        style={{
                            left: `${textPos.x}%`,
                            top: `${textPos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            touchAction: 'none',
                        }}
                    >
                        <p
                            className="text-2xl font-bold text-center break-words max-w-[260px]"
                            style={{ color: textColor, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                            onClick={cycleColor}
                        >
                            {caption}
                        </p>
                    </div>
                )}
            </div>

            {showTextInput && (
                <div className="absolute inset-0 bg-black/70 z-40 flex flex-col items-center justify-center px-8 gap-4">
                    <input
                        autoFocus
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Bir şeyler yaz..."
                        maxLength={80}
                        className="w-full max-w-sm bg-transparent text-center text-2xl font-bold outline-none placeholder-white/40"
                        style={{ color: textColor }}
                    />
                    <div className="flex gap-2">
                        {TEXT_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setTextColor(c)}
                                className={`w-7 h-7 rounded-full border-2 transition ${textColor === c ? 'border-white scale-110' : 'border-white/30'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => setShowTextInput(false)}
                        className="mt-4 bg-white text-black text-sm font-bold px-6 py-2 rounded-full"
                    >
                        Tamam
                    </button>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end px-4 py-5 z-30">
                <button
                    onClick={handleShare}
                    disabled={posting}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-full transition shadow-lg"
                >
                    {posting ? 'Paylaşılıyor...' : 'Hikayeni Paylaş'}
                </button>
            </div>
        </div>
    )
}