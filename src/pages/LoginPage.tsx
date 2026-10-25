import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabase'
import { useToast } from '../context/ToastContext'
import GoogleButton from '../components/GoogleButton'
import AuthLayout, { AUTH_INPUT, AUTH_PRIMARY } from '../components/AuthLayout'
import TurnstileWidget, { TURNSTILE_SITE_KEY } from '../components/TurnstileWidget'

function LoginPage() {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const [captchaReset, setCaptchaReset] = useState(0)

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            showToast('E-posta ve şifreni yaz.', 'error')
            return
        }

        if (TURNSTILE_SITE_KEY && !captchaToken) {
            showToast('Lütfen robot olmadığını doğrula.', 'error')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
            options: { captchaToken: captchaToken ?? undefined },
        })

        setLoading(false)
        setCaptchaToken(null)
        setCaptchaReset((n) => n + 1)

        if (error) {
            const message = error.message.toLowerCase()
            if (message.includes('invalid login')) {
                showToast('E-posta ya da şifre hatalı.', 'error')
            } else {
                showToast('Giriş yapılamadı: ' + error.message, 'error')
            }
            return
        }

        navigate('/')
    }

    return (
        <AuthLayout
            title="Tekrar hoş geldin"
            subtitle="Hesabına giriş yap, kaldığın yerden devam et."
            footer={
                <>
                    Hesabın yok mu?{' '}
                    <Link to="/kayit" className="text-purple-500 hover:text-purple-400 font-bold">
                        Kayıt ol
                    </Link>
                </>
            }
        >
            <div className="space-y-3">
                <input
                    type="email"
                    placeholder="E-posta adresi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={AUTH_INPUT}
                />

                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Şifre"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleLogin()
                        }}
                        autoComplete="current-password"
                        className={`${AUTH_INPUT} pr-11`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-ink transition"
                        aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="text-right">
                    <Link to="/sifremi-unuttum" className="text-xs text-gray-400 hover:text-purple-500 transition">
                        Şifremi unuttum
                    </Link>
                </div>
            </div>

            <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaReset} />

            <button onClick={handleLogin} disabled={loading} className={`${AUTH_PRIMARY} mt-4`}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </button>

            <GoogleButton />
        </AuthLayout>
    )
}

export default LoginPage