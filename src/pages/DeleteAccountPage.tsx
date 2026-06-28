import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'

function DeleteAccountPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [step, setStep] = useState<1 | 2>(1)
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleVerifyPassword = async () => {
        if (!password) return
        setError('')
        setLoading(true)

        const email = user?.email
        if (!email) {
            setError('Kullanıcı bilgisi alınamadı.')
            setLoading(false)
            return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        setLoading(false)

        if (signInError) {
            setError('Şifre yanlış.')
            return
        }

        setStep(2)
    }

    const handleDeleteAccount = async () => {
        if (confirmText !== 'SİL') return

        setLoading(true)
        setError('')

        const { error: rpcError } = await supabase.rpc('delete_user_account')

        if (rpcError) {
            setError('Hesap silinemedi: ' + rpcError.message)
            setLoading(false)
            return
        }

        await supabase.auth.signOut()
        navigate('/giris')
    }

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate('/ayarlar')}
                    className="text-white hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Hesabı Sil</h1>
            </div>

            <div className="p-6 flex flex-col gap-4 max-w-md">

                {step === 1 ? (
                    <>
                        {/* Uyarı kartı */}
                        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex gap-3">
                            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-300 font-bold text-sm">Bu işlem geri alınamaz</p>
                                <p className="text-red-400/80 text-xs mt-1 leading-relaxed">
                                    Hesabını sildiğinde tüm postların, mesajların, yorumların, takipçilerin
                                    ve profil bilgilerin kalıcı olarak silinir. Bu verileri geri getiremeyiz.
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-400 text-sm mt-2">
                            Devam etmek için şifreni doğrula.
                        </p>

                        <div className="flex flex-col gap-1">
                            <label className="text-gray-400 text-sm">Şifre</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-white outline-none focus:border-red-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            onClick={handleVerifyPassword}
                            disabled={!password || loading}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition mt-2"
                        >
                            {loading ? 'Doğrulanıyor...' : 'Devam Et'}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex gap-3">
                            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-300 font-bold text-sm">Son adım</p>
                                <p className="text-red-400/80 text-xs mt-1 leading-relaxed">
                                    Onaylamak için aşağıdaki kutuya büyük harflerle <strong>SİL</strong> yaz.
                                </p>
                            </div>
                        </div>

                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="SİL"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition"
                        />

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => { setStep(1); setConfirmText(''); setError('') }}
                                className="flex-1 border border-gray-700 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={confirmText !== 'SİL' || loading}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                            >
                                {loading ? 'Siliniyor...' : 'Hesabımı Sil'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default DeleteAccountPage