import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

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
        <div style={{ position: 'relative', minHeight: '100vh', background: '#07071a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '420px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '44px', backdropFilter: 'blur(24px)' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Flock</div>

                {success ? (
                    <>
                        <div style={{ fontSize: '15px', color: '#fff', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
                            Şifren güncellendi!
                        </div>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                            Anasayfaya yönlendiriliyorsun...
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
                            Yeni şifreni belirle
                        </div>

                        <input
                            type="password"
                            placeholder="Yeni şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
                        />

                        <input
                            type="password"
                            placeholder="Yeni şifre (tekrar)"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
                        />

                        {error && (
                            <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{ width: '100%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: '12px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Güncelleniyor...' : 'Şifreyi güncelle'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default ResetPasswordPage