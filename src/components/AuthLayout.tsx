import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Avatar from './Avatar'
import { topicTint } from '../utils/topicColors'

export const AUTH_INPUT =
    'w-full bg-gray-900 border border-gray-800 text-ink placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition'

export const AUTH_PRIMARY =
    'w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl py-3 text-sm transition disabled:opacity-50'

interface AuthLayoutProps {
    title: string
    subtitle?: string
    children: ReactNode
    footer?: ReactNode
}

function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
    const { theme, toggleTheme } = useTheme()

    return (
        <div className="min-h-screen bg-gray-950 text-ink md:grid md:grid-cols-[1.05fr_1fr]">

            <aside className="hidden md:flex flex-col justify-between bg-purple-900 p-12 relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-purple-800 opacity-60" />
                <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-purple-800 opacity-40" />

                <Link to="/" className="relative font-display text-3xl font-bold text-purple-500 w-fit">
                    Flock
                </Link>

                <div className="relative">
                    <h2 className="text-5xl font-bold leading-tight text-ink">
                        Soru sor,
                        <br />
                        oy ver,
                        <br />
                        deneyim paylaş.
                    </h2>
                    <p className="text-gray-300 mt-4 max-w-sm leading-relaxed">
                        Kadınların birbirine gerçek tavsiye verdiği yer. Kombinden ürüne, güvenilir önerilerden
                        indirimlere kadar merak ettiğin her şeyi sor.
                    </p>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mt-8 max-w-sm">
                        <span
                            style={topicTint('bana-yakisir-mi')}
                            className="text-xs font-medium rounded-full px-3 py-1"
                        >
                            Bana yakışır mı?
                        </span>
                        <p className="font-display text-lg font-bold text-ink leading-snug mt-3">
                            Bu elbise düğüne uygun mu?
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                            <Avatar gender="female" size={26} />
                            <span>Örnek soru · oylama</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 mt-3 overflow-hidden">
                            <div className="h-full w-2/3 bg-purple-600 rounded-full" />
                        </div>
                    </div>
                </div>

                <p className="relative text-gray-400 text-xs">Üye olmadan da gezebilirsin.</p>
            </aside>

            <main className="flex flex-col px-6 py-6 min-h-screen">
                <div className="flex items-center justify-between">
                    <Link to="/" className="font-display text-2xl font-bold text-purple-500 md:invisible">
                        Flock
                    </Link>
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-ink hover:bg-gray-800 transition"
                        aria-label={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
                    >
                        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="w-full max-w-sm">
                        <h1 className="text-3xl font-bold text-ink">{title}</h1>
                        {subtitle && <p className="text-gray-400 text-sm mt-2">{subtitle}</p>}

                        <div className="mt-6">{children}</div>

                        {footer && <div className="mt-6 text-center text-sm text-gray-400">{footer}</div>}

                        <div className="mt-8 flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-xs text-gray-500">
                            <Link to="/" className="hover:text-ink transition">
                                Üye olmadan gez →
                            </Link>
                            <Link to="/gizlilik-politikasi" className="hover:text-ink transition">
                                Gizlilik
                            </Link>
                            <Link to="/kullanim-sartlari" className="hover:text-ink transition">
                                Şartlar
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default AuthLayout
