import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Eye, EyeOff, Check } from 'lucide-react'

function ChangePasswordPage() {
    const navigate = useNavigate()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const passwordRules = [
        { label: 'En az 6 karakter', valid: newPassword.length >= 6 },
        { label: 'Yeni şifreler eşleşiyor', valid: newPassword.length > 0 && newPassword === confirmPassword },
    ]

    const allValid = passwordRules.every((r) => r.valid) && currentPassword.length > 0

    const handleSubmit = async () => {
        setError('')

        if (!allValid) return

        setLoading(true)

        // Mevcut şifreyi doğrula - yeniden giriş yaparak kontrol ediyoruz
        const { data: userData } = await supabase.auth.getUser()
        const email = userData.user?.email

        if (!email) {
            setError('Kullanıcı bilgisi alınamadı.')
            setLoading(false)
            return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: currentPassword,
        })

        if (signInError) {
            setError('Mevcut şifre yanlış.')
            setLoading(false)
            return
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        })

        setLoading(false)

        if (updateError) {
            setError('Şifre değiştirilemedi: ' + updateError.message)
            return
        }

        setSuccess(true)
        setTimeout(() => navigate('/ayarlar'), 1500)
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
                <h1 className="text-white font-bold text-xl">Şifreyi Değiştir</h1>
            </div>

            <div className="p-6 flex flex-col gap-4 max-w-md">

                {success ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check size={28} className="text-green-400" />
                        </div>
                        <p className="text-white font-bold">Şifren değiştirildi!</p>
                        <p className="text-gray-400 text-sm">Ayarlara yönlendiriliyorsun...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-1">
                            <label className="text-gray-400 text-sm">Mevcut Şifre</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-white outline-none focus:border-purple-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                                >
                                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-gray-400 text-sm">Yeni Şifre</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-white outline-none focus:border-purple-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                                >
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-gray-400 text-sm">Yeni Şifre (Tekrar)</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-white outline-none focus:border-purple-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Şifre kuralları */}
                        {newPassword.length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-1">
                                {passwordRules.map((rule) => (
                                    <div key={rule.label} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${rule.valid ? 'bg-green-500' : 'bg-gray-700'}`}>
                                            {rule.valid && <Check size={10} className="text-white" />}
                                        </div>
                                        <span className={`text-xs ${rule.valid ? 'text-green-400' : 'text-gray-500'}`}>
                                            {rule.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!allValid || loading}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition mt-2"
                        >
                            {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default ChangePasswordPage