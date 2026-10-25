import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import AuthLayout, { AUTH_INPUT, AUTH_PRIMARY } from '../components/AuthLayout'
import TurnstileWidget, { TURNSTILE_SITE_KEY } from '../components/TurnstileWidget'

function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const [captchaReset, setCaptchaReset] = useState(0)

    const handleSubmit = async () => {
        if (!email.trim()) return
        setError('')

        if (TURNSTILE_SITE_KEY && !captchaToken) {
            setError('Lütfen robot olmadığını doğrula.')
            return
        }

        setLoading(true)

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/sifre-sifirla`,
            captchaToken: captchaToken ?? undefined,
        })

        setLoading(false)
        setCaptchaToken(null)
        setCaptchaReset((n) => n + 1)

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

                    <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />

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