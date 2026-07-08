import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'

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
        <div style={{ position: 'relative', minHeight: '100vh', background: '#07071a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '420px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '44px', backdropFilter: 'blur(24px)' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Flock</div>

                {sent ? (
                    <>
                        <div style={{ fontSize: '15px', color: '#fff', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
                            E-postanı kontrol et
                        </div>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                            {email} adresine bir şifre sıfırlama bağlantısı gönderdik. Gelen kutunu (ve spam klasörünü) kontrol et.
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                            Şifreni sıfırlamak için e-posta adresini gir
                        </div>

                        <input
                            type="email"
                            placeholder="Email adresi"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
                        />

                        {error && (
                            <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !email.trim()}
                            style={{ width: '100%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: '12px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Gönderiliyor...' : 'Sıfırlama bağlantısı gönder'}
                        </button>
                    </>
                )}

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                    <Link to="/giris" style={{ color: '#a78bfa', textDecoration: 'none' }}>
                        ← Girişe dön
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default ForgotPasswordPage