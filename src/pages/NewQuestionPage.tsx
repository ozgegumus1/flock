import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Plus, X } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { convertIfHeic, resizeImage } from '../utils/imageHelpers'
import { getSuggestions } from '../utils/suggestions'

const MAX_TITLE = 120
const MAX_CONTENT = 2000
const MAX_IMAGES = 5
const MIN_OPTIONS = 2
const MAX_OPTIONS = 4

type PollType = 'none' | 'options' | 'rating' | 'quick'
type PostKind = 'question' | 'deal'

const POLL_TYPES: { value: PollType; label: string; hint: string }[] = [
    { value: 'none', label: 'Anket yok', hint: 'Sadece soru sor, cevapları yorum olarak al.' },
    { value: 'options', label: 'Seçenekli', hint: '"Bu mu, şu mu?" için 2-4 seçenek ekle, herkes birini seçsin.' },
    { value: 'rating', label: 'Yıldız', hint: 'Herkes 1-5 arası yıldız versin, ortalama görünsün.' },
    { value: 'quick', label: 'Hızlı tepki', hint: '"Çok güzel / Fena değil / Değiştir" butonlarıyla hızlı oy toplansın.' },
]

interface Topic {
    id: string
    slug: string
    name: string
    emoji: string | null
}

interface PollOption {
    key: string
    label: string
    file: File | null
    preview: string | null
}

function newOption(): PollOption {
    return { key: crypto.randomUUID(), label: '', file: null, preview: null }
}

function NewQuestionPage() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [topics, setTopics] = useState<Topic[]>([])
    const [topicId, setTopicId] = useState('')
    const [title, setTitle] = useState(() => searchParams.get('baslik') ?? '')
    const [content, setContent] = useState('')
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [converting, setConverting] = useState(false)
    const [posting, setPosting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [kind, setKind] = useState<PostKind>('question')
    const [dealStore, setDealStore] = useState('')
    const [dealUrl, setDealUrl] = useState('')
    const [dealPrice, setDealPrice] = useState('')
    const [dealOldPrice, setDealOldPrice] = useState('')
    const [dealCoupon, setDealCoupon] = useState('')
    const [dealEnds, setDealEnds] = useState('')
    const [anonymous, setAnonymous] = useState(false)
    const [pollType, setPollType] = useState<PollType>('none')
    const [options, setOptions] = useState<PollOption[]>([newOption(), newOption()])
    const optionFileRef = useRef<HTMLInputElement>(null)
    const [optionTarget, setOptionTarget] = useState<number | null>(null)

    useEffect(() => {
        const fetchTopics = async () => {
            const { data, error } = await supabase
                .from('topics')
                .select('id, slug, name, emoji')
                .order('sort_order', { ascending: true })

            if (error) {
                showToast('Konular yüklenemedi. Lütfen sayfayı yenile.', 'error')
                return
            }

            const list = data ?? []
            setTopics(list)

            const wantedSlug = searchParams.get('konu')
            const match = list.find((t) => t.slug === wantedSlug)
            if (match) setTopicId(match.id)
        }

        fetchTopics()
    }, [])

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - imageFiles.length)
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
            showToast('Bazı fotoğraflar yüklenemedi. Lütfen JPEG veya PNG formatında fotoğraf seç.', 'error')
        } finally {
            setConverting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemoveImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index])
        setImageFiles((prev) => prev.filter((_, i) => i !== index))
        setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    }

    const updateOptionLabel = (index: number, label: string) => {
        setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, label } : o)))
    }

    const addOption = () => {
        if (options.length >= MAX_OPTIONS) return
        setOptions((prev) => [...prev, newOption()])
    }

    const removeOption = (index: number) => {
        if (options.length <= MIN_OPTIONS) return
        const target = options[index]
        if (target.preview) URL.revokeObjectURL(target.preview)
        setOptions((prev) => prev.filter((_, i) => i !== index))
    }

    const pickOptionImage = (index: number) => {
        setOptionTarget(index)
        optionFileRef.current?.click()
    }

    const handleOptionImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        const index = optionTarget
        if (optionFileRef.current) optionFileRef.current.value = ''
        if (!file || index === null) return

        setConverting(true)
        try {
            const heicConverted = await convertIfHeic(file)
            const finalFile = await resizeImage(heicConverted, 1200)
            const preview = URL.createObjectURL(finalFile)

            setOptions((prev) =>
                prev.map((o, i) => {
                    if (i !== index) return o
                    if (o.preview) URL.revokeObjectURL(o.preview)
                    return { ...o, file: finalFile, preview }
                })
            )
        } catch (err) {
            console.error('Seçenek resmi hatası:', err)
            showToast('Fotoğraf yüklenemedi. Lütfen JPEG veya PNG formatında fotoğraf seç.', 'error')
        } finally {
            setConverting(false)
        }
    }

    const removeOptionImage = (index: number) => {
        setOptions((prev) =>
            prev.map((o, i) => {
                if (i !== index) return o
                if (o.preview) URL.revokeObjectURL(o.preview)
                return { ...o, file: null, preview: null }
            })
        )
    }

    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop()
        const folder = anonymous ? `anon/${crypto.randomUUID()}` : user?.id
        const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(filePath, file)

        if (uploadError) return null

        const { data: urlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(filePath)

        return urlData.publicUrl
    }

    const filledOptions = options.filter((o) => o.label.trim() !== '' || o.file !== null)
    const optionsValid = pollType !== 'options' || filledOptions.length >= MIN_OPTIONS

    const parsePrice = (value: string): number | null => {
        const n = parseFloat(value.replace(',', '.'))
        return isNaN(n) || n < 0 ? null : n
    }

    const normalizeUrl = (value: string): string | null => {
        const trimmed = value.trim()
        if (!trimmed) return null
        const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
        try {
            const parsed = new URL(withScheme)
            return parsed.hostname.includes('.') ? withScheme : null
        } catch {
            return null
        }
    }

    const switchKind = (next: PostKind) => {
        setKind(next)
        if (next === 'deal') {
            const dealTopic = topics.find((t) => t.slug === 'indirimler')
            if (dealTopic) setTopicId(dealTopic.id)
            setAnonymous(false)
            setPollType('none')
        }
    }

    const removeCreatedPost = async (id: string) => {
        if (anonymous) {
            await supabase.rpc('delete_anonymous_post', { p_post_id: String(id) })
        } else {
            await supabase.from('posts').delete().eq('id', id)
        }
    }

    const handleSubmit = async () => {
        if (posting) return

        if (!topicId) {
            showToast('Lütfen bir konu seç.', 'error')
            return
        }

        if (title.trim().length < 5) {
            showToast('Soru başlığı en az 5 karakter olmalı.', 'error')
            return
        }

        if (!optionsValid) {
            showToast('Seçenekli anket için en az 2 seçenek doldurmalısın (yazı ya da fotoğraf).', 'error')
            return
        }

        let dealData: Record<string, unknown> | null = null

        if (kind === 'deal') {
            const url = normalizeUrl(dealUrl)

            if (dealStore.trim().length < 2) {
                showToast('Lütfen mağaza adını yaz.', 'error')
                return
            }

            if (!url) {
                showToast('Geçerli bir indirim bağlantısı yaz (örn: trendyol.com/...).', 'error')
                return
            }

            dealData = {
                store: dealStore.trim(),
                url,
                price: parsePrice(dealPrice),
                old_price: parsePrice(dealOldPrice),
                coupon: dealCoupon.trim() || null,
                ends_at: dealEnds || null,
            }
        }

        const username = user?.user_metadata?.username
        if (!username) {
            showToast('Kullanıcı adın bulunamadı. Lütfen tekrar giriş yap.', 'error')
            return
        }

        setPosting(true)

        const uploadedUrls: string[] = []

        for (const file of imageFiles) {
            const url = await uploadImage(file)
            if (!url) {
                showToast('Fotoğraf yüklenemedi, lütfen tekrar dene.', 'error')
                setPosting(false)
                return
            }
            uploadedUrls.push(url)
        }

        let newPost: { id: string } | null = null
        let error: unknown = null

        if (anonymous) {
            const result = await supabase.rpc('create_anonymous_post', {
                p_title: title.trim(),
                p_content: content.trim(),
                p_topic_id: topicId,
                p_image_url: uploadedUrls[0] ?? null,
                p_image_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
                p_poll_type: pollType === 'none' ? null : pollType,
            })
            newPost = result.data
            error = result.error
        } else {
            const result = await supabase
                .from('posts')
                .insert({
                    title: title.trim(),
                    content: content.trim(),
                    topic_id: topicId,
                    username,
                    image_url: uploadedUrls[0] ?? null,
                    image_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
                    poll_type: pollType === 'none' ? null : pollType,
                    deal: dealData,
                })
                .select('id')
                .single()
            newPost = result.data
            error = result.error
        }

        if (error || !newPost) {
            showToast('Sorun paylaşılamadı, lütfen tekrar dene.', 'error')
            setPosting(false)
            return
        }

        if (pollType === 'options') {
            const rows = []

            for (let i = 0; i < filledOptions.length; i++) {
                const option = filledOptions[i]
                let imageUrl: string | null = null

                if (option.file) {
                    imageUrl = await uploadImage(option.file)
                    if (!imageUrl) {
                        await removeCreatedPost(newPost.id)
                        showToast('Seçenek fotoğrafı yüklenemedi, lütfen tekrar dene.', 'error')
                        setPosting(false)
                        return
                    }
                }

                rows.push({
                    post_id: newPost.id,
                    label: option.label.trim() || null,
                    image_url: imageUrl,
                    sort_order: i,
                })
            }

            const { error: optionsError } = await supabase.from('poll_options').insert(rows)

            if (optionsError) {
                await removeCreatedPost(newPost.id)
                showToast('Seçenekler kaydedilemedi, lütfen tekrar dene.', 'error')
                setPosting(false)
                return
            }
        }

        showToast(kind === 'deal' ? 'İndirim paylaşıldı!' : 'Sorun paylaşıldı!', 'success')
        navigate(`/gonderi/${newPost.id}`)
    }

    const inspiration = getSuggestions(topics.find((t) => t.id === topicId)?.slug)
    const canSubmit = !!topicId && title.trim().length >= 5 && optionsValid && !posting && !converting
    const currentHint = POLL_TYPES.find((p) => p.value === pollType)?.hint

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800 max-w-full overflow-x-hidden">

            <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-ink transition"
                    aria-label="Geri dön"
                >
                    <ArrowLeft size={22} />
                </button>
                <h1 className="text-ink font-bold text-xl flex-1">{kind === 'deal' ? 'Yeni indirim' : 'Yeni soru'}</h1>
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-5 py-2 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {posting ? 'Paylaşılıyor...' : 'Paylaş'}
                </button>
            </div>

            <div className="p-4 space-y-4">

                <div className="flex gap-2">
                    {([
                        { value: 'question', label: '❓ Soru' },
                        { value: 'deal', label: '🏷️ İndirim' },
                    ] as { value: PostKind; label: string }[]).map((k) => (
                        <button
                            key={k.value}
                            onClick={() => switchKind(k.value)}
                            className={`flex-1 text-sm rounded-xl py-2.5 border transition ${
                                kind === k.value
                                    ? 'bg-purple-600 border-purple-600 text-white font-bold'
                                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-purple-500/60'
                            }`}
                        >
                            {k.label}
                        </button>
                    ))}
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-2">Konu</label>
                    <select
                        value={topicId}
                        disabled={kind === 'deal'}
                        onChange={(e) => setTopicId(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 text-ink rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                    >
                        <option value="">Bir konu seç</option>
                        {topics.map((topic) => (
                            <option key={topic.id} value={topic.id}>
                                {topic.emoji ?? '💬'} {topic.name}
                            </option>
                        ))}
                    </select>
                </div>

                {kind === 'question' && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-ink font-bold text-sm">🕶️ Anonim sor</p>
                            <p className="text-gray-500 text-xs mt-1">
                                Adın ve profilin bu soruda diğer kullanıcılara görünmez. Soruna kendi hesabınla cevap yazarsan kimliğin anlaşılabilir.
                            </p>
                        </div>
                        <button
                            role="switch"
                            aria-checked={anonymous}
                            onClick={() => setAnonymous((a) => !a)}
                            className={`w-12 h-7 rounded-full p-0.5 transition shrink-0 ${anonymous ? 'bg-purple-600' : 'bg-gray-700'}`}
                        >
                            <span
                                className={`block w-6 h-6 rounded-full bg-white transition-transform ${anonymous ? 'translate-x-5' : ''}`}
                            />
                        </button>
                    </div>
                </div>

                )}

                <div>
                    <label className="block text-gray-400 text-sm mb-2">{kind === 'deal' ? 'İndirimin başlığı' : 'Sorunun başlığı'}</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={MAX_TITLE}
                        placeholder={kind === 'deal' ? 'Örn: Kablosuz kulaklık %40 indirimde' : 'Örn: Bu kombin düğüne uygun mu?'}
                        className="w-full bg-gray-900 border border-gray-800 text-ink placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                    />
                    <p className={`text-xs mt-1 text-right ${title.length > 0 && title.length < 5 ? 'text-red-400' : 'text-gray-600'}`}>
                        {title.length > 0 && title.length < 5 ? 'En az 5 karakter yazmalısın · ' : ''}{title.length}/{MAX_TITLE}
                    </p>

                    {kind === 'question' && title.trim() === '' && inspiration.length > 0 && (
                        <div className="mt-3">
                            <p className="text-gray-500 text-xs mb-2">Fikir lazım mı? Birine dokun:</p>
                            <div className="flex flex-col gap-2">
                                {inspiration.map((text) => (
                                    <button
                                        key={text}
                                        onClick={() => setTitle(text)}
                                        className="text-left text-sm text-ink bg-gray-900 border border-gray-800 hover:border-purple-500/60 rounded-2xl px-4 py-2.5 transition"
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-2">Detaylar (isteğe bağlı)</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        maxLength={MAX_CONTENT}
                        rows={5}
                        placeholder="Sorunu biraz daha anlat..."
                        className="w-full bg-gray-900 border border-gray-800 text-ink placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-purple-500 resize-none"
                    />
                    <p className="text-gray-600 text-xs mt-1 text-right">{content.length}/{MAX_CONTENT}</p>
                </div>

                {kind === 'deal' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                        <input
                            type="text"
                            value={dealStore}
                            onChange={(e) => setDealStore(e.target.value)}
                            maxLength={40}
                            placeholder="Mağaza (örn: Trendyol)"
                            className="w-full bg-gray-950 border border-gray-800 text-ink placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                        />
                        <input
                            type="text"
                            value={dealUrl}
                            onChange={(e) => setDealUrl(e.target.value)}
                            placeholder="İndirim bağlantısı"
                            className="w-full bg-gray-950 border border-gray-800 text-ink placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={dealPrice}
                                onChange={(e) => setDealPrice(e.target.value)}
                                placeholder="Fiyat (TL)"
                                className="w-full bg-gray-950 border border-gray-800 text-ink placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                            />
                            <input
                                type="text"
                                inputMode="decimal"
                                value={dealOldPrice}
                                onChange={(e) => setDealOldPrice(e.target.value)}
                                placeholder="Eski fiyat (TL)"
                                className="w-full bg-gray-950 border border-gray-800 text-ink placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                            />
                        </div>
                        <input
                            type="text"
                            value={dealCoupon}
                            onChange={(e) => setDealCoupon(e.target.value)}
                            maxLength={40}
                            placeholder="Kupon kodu (varsa)"
                            className="w-full bg-gray-950 border border-gray-800 text-ink placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                        />
                        <div>
                            <label className="block text-gray-500 text-xs mb-1">Bitiş tarihi (biliyorsan)</label>
                            <input
                                type="date"
                                value={dealEnds}
                                onChange={(e) => setDealEnds(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 text-ink rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-gray-400 text-sm mb-2">
                        Fotoğraf (isteğe bağlı, en fazla {MAX_IMAGES})
                    </label>

                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {imagePreviews.map((src, index) => (
                                <div key={src} className="relative aspect-square">
                                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                                    <button
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1"
                                        aria-label="Fotoğrafı kaldır"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {imageFiles.length < MAX_IMAGES && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={converting}
                            className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-ink text-sm px-4 py-3 rounded-xl transition disabled:opacity-50"
                        >
                            <ImagePlus size={18} />
                            {converting ? 'Hazırlanıyor...' : 'Fotoğraf ekle'}
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                    />
                </div>

                {kind === 'question' && (
                <div>
                    <label className="block text-gray-400 text-sm mb-2">Anket</label>

                    <div className="flex flex-wrap gap-2">
                        {POLL_TYPES.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPollType(p.value)}
                                className={`text-sm rounded-full px-4 py-1.5 border transition ${
                                    pollType === p.value
                                        ? 'bg-purple-600 border-purple-600 text-white font-bold'
                                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-purple-500/60'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <p className="text-gray-500 text-xs mt-2">{currentHint}</p>

                    {pollType === 'options' && (
                        <div className="mt-4 space-y-3">
                            {options.map((option, index) => (
                                <div
                                    key={option.key}
                                    className="bg-gray-900 border border-gray-800 rounded-2xl p-3 flex items-center gap-3"
                                >
                                    {option.preview ? (
                                        <div className="relative shrink-0">
                                            <img
                                                src={option.preview}
                                                alt=""
                                                className="w-16 h-16 rounded-xl object-cover"
                                            />
                                            <button
                                                onClick={() => removeOptionImage(index)}
                                                className="absolute -top-1 -right-1 bg-black/80 hover:bg-black text-white rounded-full p-0.5"
                                                aria-label="Fotoğrafı kaldır"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => pickOptionImage(index)}
                                            disabled={converting}
                                            className="w-16 h-16 shrink-0 rounded-xl border border-dashed border-gray-700 hover:border-purple-500 text-gray-500 hover:text-purple-400 flex items-center justify-center transition disabled:opacity-50"
                                            aria-label="Fotoğraf ekle"
                                        >
                                            <ImagePlus size={20} />
                                        </button>
                                    )}

                                    <input
                                        type="text"
                                        value={option.label}
                                        onChange={(e) => updateOptionLabel(index, e.target.value)}
                                        maxLength={60}
                                        placeholder={`${index + 1}. seçenek`}
                                        className="flex-1 min-w-0 bg-transparent text-ink placeholder-gray-500 outline-none"
                                    />

                                    {options.length > MIN_OPTIONS && (
                                        <button
                                            onClick={() => removeOption(index)}
                                            className="text-gray-500 hover:text-ink transition shrink-0"
                                            aria-label="Seçeneği sil"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {options.length < MAX_OPTIONS && (
                                <button
                                    onClick={addOption}
                                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-bold transition"
                                >
                                    <Plus size={16} />
                                    Seçenek ekle
                                </button>
                            )}

                            <input
                                ref={optionFileRef}
                                type="file"
                                accept="image/*,.heic,.heif"
                                onChange={handleOptionImageChange}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>
                )}

            </div>

        </div>
    )
}

export default NewQuestionPage