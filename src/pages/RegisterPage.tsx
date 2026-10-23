import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabase'
import { useToast } from '../context/ToastContext'
import GoogleButton from '../components/GoogleButton'
import AuthLayout, { AUTH_INPUT, AUTH_PRIMARY } from '../components/AuthLayout'
import ProfileFields, { validateProfile } from '../components/ProfileFields'
import type { ProfileValues } from '../components/ProfileFields'

function RegisterPage() {
    const navigate = useNavigate()
    const { showToast } = useToast()

    const [values, setValues] = useState<ProfileValues>({
        fullName: '',
        username: '',
        birthYear: '',
        gender: '',
        accepted: false,
    })
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleRegister = async () => {
        const problem = validateProfile(values)
        if (problem) {
            showToast(problem, 'error')
            return
        }

        if (!email.trim().includes('@')) {
            showToast('Lütfen geçerli bir e-posta adresi yaz.', 'error')
            return
        }

        if (password.length < 6) {
            showToast('Şifre en az 6 karakter olmalı.', 'error')
            return
        }

        const name = values.username.trim()

        setLoading(true)

        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', name.replace(/[_%]/g, '\\$&'))
            .maybeSingle()

        if (existing) {
            showToast('Bu kullanıcı adı alınmış, başka bir tane dene.', 'error')
            setLoading(false)
            return
        }

        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    username: name,
                    full_name: values.fullName.trim(),
                    gender: values.gender,
                    birth_year: values.birthYear,
                },
            },
        })

        setLoading(false)

        if (error) {
            const message = error.message.toLowerCase()

            if (message.includes('already registered')) {
                showToast('Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.', 'error')
            } else if (message.includes('database error')) {
                showToast('Kayıt tamamlanamadı. Kullanıcı adı alınmış olabilir, başka bir tane dene.', 'error')
            } else if (message.includes('rate limit')) {
                showToast('Çok fazla deneme yapıldı, biraz sonra tekrar dene.', 'error')
            } else {
                showToast('Kayıt olunamadı: ' + error.message, 'error')
            }
            return
        }

        if (data.session) {
            showToast('Hoş geldin!', 'success')
        } else {
            showToast('Kayıt başarılı! Şimdi giriş yapabilirsin.', 'success')
            navigate('/giris')
        }
    }

    return (
        <AuthLayout
            title="Aramıza katıl"
            subtitle="Birkaç bilgi yeterli, hemen soru sormaya başla."
            footer={
                <>
                    Zaten hesabın var mı?{' '}
                    <Link to="/giris" className="text-purple-500 hover:text-purple-400 font-bold">
                        Giriş yap
                    </Link>
                </>
            }
        >
            <ProfileFields values={values} onChange={setValues}>
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
                        placeholder="Şifre (en az 6 karakter)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
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
            </ProfileFields>

            <button onClick={handleRegister} disabled={loading} className={`${AUTH_PRIMARY} mt-5`}>
                {loading ? 'Kaydediliyor...' : 'Kayıt ol'}
            </button>

            <GoogleButton />
        </AuthLayout>
    )
}

export default RegisterPage
