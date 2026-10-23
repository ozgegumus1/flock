import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import AuthLayout, { AUTH_INPUT, AUTH_PRIMARY } from '../components/AuthLayout'

function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (!email.trim()) return
        setError('')
        setLoading(true)

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/sifre-sifirla`,
        })

        setLoading(false)

        if (resetError) {
            setError(resetError.message)
        } else {
            setSent(true)
        }
    }

    return (
        <AuthLayout
            title={sent ? 'E-postanı kontrol et' : 'Şifreni mi unuttun?'}
            subtitle={
                sent
                    ? `${email} adresine bir şifre sıfırlama bağlantısı gönderdik. Gelen kutunu ve spam klasörünü kontrol et.`
                    : 'E-posta adresini yaz, sana şifreni sıfırlaman için bir bağlantı gönderelim.'
            }
            footer={
                <Link to="/giris" className="text-purple-500 hover:text-purple-400 font-bold">
                    ← Giriş sayfasına dön
                </Link>
            }
        >
            {!sent && (
                <>
                    <input
                        type="email"
                        placeholder="E-posta adresi"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit()
                        }}
                        autoComplete="email"
                        className={AUTH_INPUT}
                    />

                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                    <button onClick={handleSubmit} disabled={loading} className={`${AUTH_PRIMARY} mt-4`}>
                        {loading ? 'Gönderiliyor...' : 'Bağlantı gönder'}
                    </button>
                </>
            )}
        </AuthLayout>
    )
}

export default ForgotPasswordPage
