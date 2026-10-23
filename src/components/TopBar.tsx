import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Bookmark, LogOut, Mail, Moon, Plus, Settings, Sun, User } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useIsWide } from '../context/ViewModeContext'
import Avatar from './Avatar'
import TopicMenu from './TopicMenu'
import ConfirmModal from './ConfirmModal'

function Badge({ count }: { count: number }) {
    if (count <= 0) return null

    return (
        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
            {count > 9 ? '9+' : count}
        </span>
    )
}

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-ink hover:bg-gray-800 transition"
            aria-label={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
            title={theme === 'dark' ? 'Aydınlık mod' : 'Karanlık mod'}
        >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
    )
}

function TopBar() {
    const { user, profile, unreadMessages, unreadNotifications } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const wide = useIsWide()

    const [menuOpen, setMenuOpen] = useState(false)
    const [logoutOpen, setLogoutOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const username = user?.user_metadata?.username

    useEffect(() => {
        setMenuOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (!menuOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [menuOpen])

    const handleLogout = async () => {
        setLogoutOpen(false)
        await supabase.auth.signOut()
        navigate('/')
    }

    const iconLink =
        'relative w-9 h-9 rounded-full hidden md:flex items-center justify-center text-gray-400 hover:text-ink hover:bg-gray-800 transition'

    const menuItem =
        'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-ink hover:bg-gray-800 transition text-left'

    return (
        <header className="sticky top-0 z-40 bg-gray-950/85 backdrop-blur border-b border-gray-800">
            <div className={`${wide ? 'max-w-5xl' : 'max-w-2xl'} mx-auto h-14 px-4 flex items-center gap-2`}>

                <TopicMenu />

                <Link to="/" className="font-display text-2xl font-bold text-purple-500 hover:text-purple-400 transition ml-1">
                    Flock
                </Link>

                <div className="flex-1" />

                {user ? (
                    <>
                        <Link
                            to="/yeni-soru"
                            className="hidden sm:flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-full px-4 py-2 transition mr-1"
                        >
                            <Plus size={16} />
                            Soru sor
                        </Link>

                        <Link to="/bildirimler" className={iconLink} aria-label="Bildirimler">
                            <Bell size={20} />
                            <Badge count={unreadNotifications} />
                        </Link>

                        <Link to="/mesajlar" className={iconLink} aria-label="Mesajlar">
                            <Mail size={20} />
                            <Badge count={unreadMessages} />
                        </Link>

                        <ThemeToggle />

                        <div className="relative ml-1" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-label="Hesap menüsü"
                                className="block rounded-full"
                            >
                                <Avatar src={profile?.avatar_url} gender={profile?.gender} size={40} alt="profilin" />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-12 w-60 bg-gray-900 border border-gray-800 rounded-2xl p-2 shadow-xl">
                                    <div className="px-3 py-2 mb-1 border-b border-gray-800">
                                        <p className="text-ink font-bold truncate">{profile?.full_name || username}</p>
                                        <p className="text-gray-500 text-xs truncate">@{username}</p>
                                    </div>

                                    <Link to={`/profil/${username}`} className={menuItem}>
                                        <User size={17} /> Profilim
                                    </Link>
                                    <Link to="/kaydedilenler" className={menuItem}>
                                        <Bookmark size={17} /> Kaydedilenler
                                    </Link>
                                    <Link to="/ayarlar" className={menuItem}>
                                        <Settings size={17} /> Ayarlar
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false)
                                            setLogoutOpen(true)
                                        }}
                                        className={`${menuItem} text-red-500`}
                                    >
                                        <LogOut size={17} /> Çıkış yap
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <ThemeToggle />
                        <Link
                            to="/giris"
                            className="text-sm font-bold text-ink hover:text-purple-500 px-3 py-2 transition"
                        >
                            Giriş yap
                        </Link>
                        <Link
                            to="/kayit"
                            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-full px-4 py-2 transition"
                        >
                            Kayıt ol
                        </Link>
                    </>
                )}
            </div>

            <ConfirmModal
                open={logoutOpen}
                title="Çıkış yapmak istediğine emin misin?"
                confirmText="Çıkış yap"
                danger
                onConfirm={handleLogout}
                onCancel={() => setLogoutOpen(false)}
            />
        </header>
    )
}

export default TopBar