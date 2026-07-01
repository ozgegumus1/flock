import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

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

async function resizeImage(file: File, maxDimension: number, quality = 0.82): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            let { width, height } = img

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width)
                    width = maxDimension
                } else {
                    width = Math.round((width * maxDimension) / height)
                    height = maxDimension
                }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url)
                    if (!blob) { resolve(file); return }
                    resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
                },
                'image/jpeg',
                quality
            )
        }

        img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
        img.src = url
    })
}

function EditProfilePage() {
    const { user, refreshProfile } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')

    // Avatar
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarRemoved, setAvatarRemoved] = useState(false)
    const [convertingAvatar, setConvertingAvatar] = useState(false)
    const avatarInputRef = useRef<HTMLInputElement>(null)

    // Kapak fotoğrafı
    const [coverUrl, setCoverUrl] = useState<string | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [coverRemoved, setCoverRemoved] = useState(false)
    const [convertingCover, setConvertingCover] = useState(false)
    const coverInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single()

            if (data) {
                setUsername(data.username || '')
                setFullName(data.full_name || '')
                setBio(data.bio || '')
                setAvatarUrl(data.avatar_url || null)
                setCoverUrl(data.cover_url || null)
            }
        }
        fetchProfile()
    }, [])

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setConvertingAvatar(true)
        try {
            const heicConverted = await convertIfHeic(file)
            const finalFile = await resizeImage(heicConverted, 500)
            setAvatarFile(finalFile)
            setAvatarPreview(URL.createObjectURL(finalFile))
            setAvatarRemoved(false)
        } catch (err) {
            console.error('Avatar dönüştürme hatası:', err)
            alert('Bu fotoğraf yüklenemedi. Lütfen JPEG veya PNG formatında bir fotoğraf seçin.')
        } finally {
            setConvertingAvatar(false)
        }
    }

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setConvertingCover(true)
        try {
            const heicConverted = await convertIfHeic(file)
            const finalFile = await resizeImage(heicConverted, 1600)
            setCoverFile(finalFile)
            setCoverPreview(URL.createObjectURL(finalFile))
            setCoverRemoved(false)
        } catch (err) {
            console.error('Kapak dönüştürme hatası:', err)
            alert('Bu fotoğraf yüklenemedi. Lütfen JPEG veya PNG formatında bir fotoğraf seçin.')
        } finally {
            setConvertingCover(false)
        }
    }

    const handleRemoveAvatar = () => {
        setAvatarFile(null)
        setAvatarPreview(null)
        setAvatarRemoved(true)
        if (avatarInputRef.current) avatarInputRef.current.value = ''
    }

    const handleRemoveCover = () => {
        setCoverFile(null)
        setCoverPreview(null)
        setCoverRemoved(true)
        if (coverInputRef.current) coverInputRef.current.value = ''
    }

    const removeStorageFiles = async (prefix: string) => {
        try {
            const { data: files } = await supabase.storage
                .from('avatars')
                .list(user?.id)
            const matching = (files ?? []).filter((f: any) => f.name.startsWith(prefix))
            if (matching.length > 0) {
                await supabase.storage
                    .from('avatars')
                    .remove(matching.map((f: any) => `${user?.id}/${f.name}`))
            }
        } catch (err) {
            console.error('Storage silme hatası:', err)
        }
    }

    const handleSave = async () => {
        setLoading(true)

        let newAvatarUrl = avatarUrl
        let newCoverUrl = coverUrl

        // Avatar işlemi
        if (avatarRemoved) {
            await removeStorageFiles('avatar.')
            newAvatarUrl = null
        } else if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop()
            const filePath = `${user?.id}/avatar.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, { upsert: true })

            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath)
                newAvatarUrl = urlData.publicUrl + `?t=${Date.now()}`
            }
        }

        // Kapak fotoğrafı işlemi
        if (coverRemoved) {
            await removeStorageFiles('cover.')
            newCoverUrl = null
        } else if (coverFile) {
            const fileExt = coverFile.name.split('.').pop()
            const filePath = `${user?.id}/cover.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, coverFile, { upsert: true })

            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath)
                newCoverUrl = urlData.publicUrl + `?t=${Date.now()}`
            }
        }

        await supabase
            .from('profiles')
            .update({
                username,
                full_name: fullName,
                bio,
                avatar_url: newAvatarUrl,
                cover_url: newCoverUrl,
            })
            .eq('id', user?.id)

        setLoading(false)
        refreshProfile()
        navigate(`/profil/${username}`)
    }

    const currentAvatar = avatarRemoved ? null : (avatarPreview || avatarUrl)
    const currentCover = coverRemoved ? null : (coverPreview || coverUrl)
    const isBusy = loading || convertingAvatar || convertingCover

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">

            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white hover:text-gray-400 transition">
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Profili Düzenle</h1>
            </div>

            {/* Kapak fotoğrafı */}
            <div
                className="relative h-40 w-full cursor-pointer group"
                onClick={() => !convertingCover && coverInputRef.current?.click()}
            >
                {currentCover ? (
                    <img
                        src={currentCover}
                        alt="kapak"
                        className="w-full h-40 object-cover"
                    />
                ) : (
                    <div className="w-full h-40 bg-gradient-to-r from-purple-900 to-indigo-900" />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                        {convertingCover ? 'İşleniyor...' : 'Kapak fotoğrafını değiştir'}
                    </span>
                </div>

                {convertingCover && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-bold animate-pulse">İşleniyor...</span>
                    </div>
                )}

                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={handleCoverChange}
                />
            </div>

            {currentCover && (
                <div className="flex justify-end px-6 -mt-1 mb-1">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveCover() }}
                        disabled={isBusy}
                        className="text-red-400 text-xs hover:text-red-300 transition disabled:opacity-50"
                    >
                        Kapak fotoğrafını kaldır
                    </button>
                </div>
            )}

            {/* Form */}
            <div className="p-6 flex flex-col gap-4">

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3 mb-2 -mt-16">
                    <div
                        className="relative w-24 h-24 rounded-full cursor-pointer group"
                        onClick={() => !convertingAvatar && avatarInputRef.current?.click()}
                    >
                        {currentAvatar ? (
                            <img
                                src={currentAvatar}
                                alt="avatar"
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-950"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-purple-500 border-4 border-gray-950" />
                        )}
                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                                {convertingAvatar ? 'İşleniyor...' : 'Değiştir'}
                            </span>
                        </div>
                        {convertingAvatar && (
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                                <span className="text-white text-xs font-bold animate-pulse">İşleniyor...</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={isBusy}
                            className="text-purple-400 text-sm hover:text-purple-300 transition disabled:opacity-50"
                        >
                            Fotoğraf değiştir
                        </button>
                        {currentAvatar && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={isBusy}
                                className="text-red-400 text-sm hover:text-red-300 transition disabled:opacity-50"
                            >
                                Fotoğrafı kaldır
                            </button>
                        )}
                    </div>

                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*,.heic,.heif"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-gray-400 text-sm">Kullanıcı Adı</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-gray-400 text-sm">Ad Soyad</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-gray-400 text-sm">Biyografi</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition resize-none"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={isBusy}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </div>
    )
}

export default EditProfilePage