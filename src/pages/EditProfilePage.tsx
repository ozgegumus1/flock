import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function EditProfilePage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
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
            }
        }
        fetchProfile()
    }, [])

    const handleSave = async () => {
        setLoading(true)

        await supabase
            .from('profiles')
            .update({
                username,
                full_name: fullName,
                bio
            })
            .eq('id', user?.id)

        setLoading(false)
        navigate(`/profil/${username}`)
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">

            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white hover:text-gray-400 transition">
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Profili Düzenle</h1>
            </div>

            {/* Form */}
            <div className="p-6 flex flex-col gap-4">

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
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>

            </div>
        </div>
    )
}

export default EditProfilePage