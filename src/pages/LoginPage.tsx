import { Link } from "react-router-dom"
import { useState } from "react"
import { supabase } from "../supabase"
import { useToast } from "../context/ToastContext"
import { useNavigate } from "react-router-dom"

function LoginPage() {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            showToast('Giriş başarısız: ' + error.message, 'error')
        } else {
            navigate('/')
        }
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', background: '#07071a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '40px', overflow: 'hidden' }}>

            <div style={{ position: 'absolute', width: '600px', height: '600px', background: '#4c1d95', borderRadius: '50%', filter: 'blur(90px)', opacity: 0.3, top: '-200px', left: '-150px' }} />
            <div style={{ position: 'absolute', width: '450px', height: '450px', background: '#1e3a8a', borderRadius: '50%', filter: 'blur(90px)', opacity: 0.3, bottom: '-150px', left: '150px' }} />
            <div style={{ position: 'absolute', width: '300px', height: '300px', background: '#831843', borderRadius: '50%', filter: 'blur(90px)', opacity: 0.3, top: '150px', left: '350px' }} />

            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                <style>{`
          @keyframes flowLine{0%{stroke-dashoffset:1000}100%{stroke-dashoffset:0}}
          @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
          @keyframes spin2{0%{transform:rotate(0deg)}100%{transform:rotate(-360deg)}}
          @keyframes twinkle{0%,100%{opacity:.1}50%{opacity:.5}}
        `}</style>

                <g opacity="0.15">
                    <path d="M0,150 Q200,100 400,200 T800,150" fill="none" stroke="#a78bfa" strokeWidth="0.8" strokeDasharray="8 4" style={{ animation: 'flowLine 8s linear infinite' }} />
                    <path d="M0,250 Q200,300 400,200 T800,280" fill="none" stroke="#818cf8" strokeWidth="0.8" strokeDasharray="6 6" style={{ animation: 'flowLine 10s linear infinite' }} />
                    <path d="M0,400 Q300,350 500,420 T800,380" fill="none" stroke="#c084fc" strokeWidth="0.8" strokeDasharray="10 4" style={{ animation: 'flowLine 12s linear infinite' }} />
                    <path d="M0,500 Q250,460 450,500 T800,470" fill="none" stroke="#60a5fa" strokeWidth="0.8" strokeDasharray="7 5" style={{ animation: 'flowLine 9s linear infinite' }} />
                    <path d="M100,0 Q150,200 100,400 T150,600" fill="none" stroke="#f472b6" strokeWidth="0.6" strokeDasharray="5 8" style={{ animation: 'flowLine 11s linear infinite' }} />
                    <path d="M300,0 Q280,150 320,300 T280,600" fill="none" stroke="#818cf8" strokeWidth="0.6" strokeDasharray="8 6" style={{ animation: 'flowLine 14s linear infinite' }} />
                </g>

                <g transform="translate(120,120)" opacity="0.12" style={{ animation: 'spin 20s linear infinite', transformOrigin: '120px 120px' }}>
                    <circle cx="120" cy="120" r="80" fill="none" stroke="#a78bfa" strokeWidth="0.8" strokeDasharray="4 8" />
                    <circle cx="120" cy="120" r="55" fill="none" stroke="#818cf8" strokeWidth="0.6" strokeDasharray="3 6" />
                </g>
                <g opacity="0.1" style={{ animation: 'spin2 25s linear infinite', transformOrigin: '200px 450px' }}>
                    <circle cx="200" cy="450" r="100" fill="none" stroke="#c084fc" strokeWidth="0.8" strokeDasharray="5 10" />
                    <circle cx="200" cy="450" r="70" fill="none" stroke="#f472b6" strokeWidth="0.6" strokeDasharray="3 7" />
                </g>

                <g opacity="0.25">
                    <line x1="60" y1="80" x2="180" y2="160" stroke="#a78bfa" strokeWidth="0.4" />
                    <line x1="180" y1="160" x2="120" y2="280" stroke="#a78bfa" strokeWidth="0.4" />
                    <line x1="60" y1="80" x2="120" y2="280" stroke="#818cf8" strokeWidth="0.4" />
                    <line x1="120" y1="280" x2="250" y2="350" stroke="#818cf8" strokeWidth="0.4" />
                    <line x1="180" y1="160" x2="300" y2="200" stroke="#c084fc" strokeWidth="0.4" />
                    <line x1="300" y1="200" x2="250" y2="350" stroke="#c084fc" strokeWidth="0.4" />
                    <line x1="60" y1="400" x2="120" y2="280" stroke="#60a5fa" strokeWidth="0.4" />
                    <line x1="60" y1="400" x2="180" y2="480" stroke="#60a5fa" strokeWidth="0.4" />
                    <line x1="250" y1="350" x2="180" y2="480" stroke="#f472b6" strokeWidth="0.4" />
                    <circle cx="60" cy="80" r="2.5" fill="#a78bfa" style={{ animation: 'twinkle 3s ease-in-out infinite' }} />
                    <circle cx="180" cy="160" r="2" fill="#818cf8" style={{ animation: 'twinkle 4s ease-in-out infinite', animationDelay: '.5s' }} />
                    <circle cx="120" cy="280" r="2.5" fill="#c084fc" style={{ animation: 'twinkle 3.5s ease-in-out infinite', animationDelay: '1s' }} />
                    <circle cx="300" cy="200" r="2" fill="#a78bfa" style={{ animation: 'twinkle 5s ease-in-out infinite', animationDelay: '.3s' }} />
                    <circle cx="250" cy="350" r="3" fill="#60a5fa" style={{ animation: 'twinkle 4s ease-in-out infinite', animationDelay: '.8s' }} />
                    <circle cx="60" cy="400" r="2" fill="#f472b6" style={{ animation: 'twinkle 3s ease-in-out infinite', animationDelay: '1.5s' }} />
                    <circle cx="180" cy="480" r="2.5" fill="#818cf8" style={{ animation: 'twinkle 4.5s ease-in-out infinite', animationDelay: '.2s' }} />
                </g>

                <circle cx="350" cy="60" r="1.5" fill="#fff" style={{ animation: 'twinkle 2s ease-in-out infinite' }} />
                <circle cx="80" cy="180" r="1" fill="#fff" style={{ animation: 'twinkle 3s ease-in-out infinite', animationDelay: '.7s' }} />
                <circle cx="220" cy="90" r="1.5" fill="#fff" style={{ animation: 'twinkle 2.5s ease-in-out infinite', animationDelay: '.3s' }} />
                <circle cx="380" cy="480" r="1.5" fill="#fff" style={{ animation: 'twinkle 2s ease-in-out infinite', animationDelay: '.9s' }} />
                <circle cx="280" cy="550" r="1.5" fill="#c084fc" style={{ animation: 'twinkle 3s ease-in-out infinite', animationDelay: '1.8s' }} />
            </svg>

            <div style={{ position: 'relative', zIndex: 10, width: '420px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '44px', backdropFilter: 'blur(24px)' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Flock</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>Hesabına giriş yap</div>

                <input
                    type="email"
                    placeholder="Email adresi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as any, marginBottom: '12px' }}
                />

                <input
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as any, marginBottom: '12px' }}
                />

                <button
                    onClick={handleLogin}
                    style={{ width: '100%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: '12px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
                    Giriş Yap
                </button>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                    Hesabın yok mu?
                    <Link to="/kayit" style={{color: '#a78bfa', cursor: 'pointer', textDecoration: 'none' }}>
                    Kayıt ol
                    </Link>
                </p>
            </div>

        </div>
    )
}

export default LoginPage