import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AuthLayout, { AUTH_INPUT, AUTH_PRIMARY } from '../components/AuthLayout'

function ResetPasswordPage() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async () => {
        setError('')

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalı.')
            return
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.')
            return
        }

        setLoading(true)

        const { error: updateError } = await supabase.auth.updateUser({ password })

        setLoading(false)

        if (updateError) {
            setError(updateError.message)
        } else {
            setSuccess(true)
            setTimeout(() => navigate('/'), 2000)
        }
    }

    return (
        <AuthLayout
            title={success ? 'Şifren güncellendi' : 'Yeni şifre belirle'}
            subtitle={success ? 'Ana sayfaya yönlendiriliyorsun...' : 'Hesabın için yeni bir şifre yaz.'}
        >
            {!success && (
                <>
                    <div className="space-y-3">
                        <input
                            type="password"
                            placeholder="Yeni şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            className={AUTH_INPUT}
                        />
                        <input
                            type="password"
                            placeholder="Yeni şifre (tekrar)"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit()
                            }}
                            autoComplete="new-password"
                            className={AUTH_INPUT}
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                    <button onClick={handleSubmit} disabled={loading} className={`${AUTH_PRIMARY} mt-4`}>
                        {loading ? 'Kaydediliyor...' : 'Şifreyi güncelle'}
                    </button>
                </>
            )}
        </AuthLayout>
    )
}

export default ResetPasswordPage
