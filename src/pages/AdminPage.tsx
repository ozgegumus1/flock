import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Seo from '../components/Seo'

interface DayRow {
    day: string
    users: number
    posts: number
    comments: number
}

interface Stats {
    users_total: number
    users_today: number
    users_7d: number
    posts_total: number
    posts_today: number
    posts_7d: number
    comments_total: number
    comments_today: number
    comments_7d: number
    likes_total: number
    votes_total: number
    reports_open: number
    daily: DayRow[]
}

const LINKS = [
    {
        title: 'Google Search Console',
        text: 'Google aramalarında kaç kez göründün, kaç tıklama aldın, hangi sayfalar dizinde.',
        href: 'https://search.google.com/search-console?resource_id=https%3A%2F%2Fflocksocial.vercel.app%2F',
    },
    {
        title: 'Vercel (ziyaretçi sayısı)',
        text: 'Projeyi aç, üstteki "Analytics" sekmesinde günlük ziyaretçi ve sayfa görüntüleme.',
        href: 'https://vercel.com/dashboard',
    },
    {
        title: 'Supabase',
        text: 'Veritabanı, kullanıcılar, şikayetler (reports tablosu) ve kayıtlar.',
        href: 'https://supabase.com/dashboard/project/gkkhjxzhlsvkyhodpjyg',
    },
    {
        title: 'Google Cloud (Google ile giriş)',
        text: 'Google girişi ayarları ve yayın durumu.',
        href: 'https://console.cloud.google.com/auth/overview?project=flock-512017',
    },
    {
        title: 'Cloudflare Turnstile',
        text: 'Bot koruması kaç doğrulama yapmış, kaç robotu durdurmuş.',
        href: 'https://dash.cloudflare.com/',
    },
]

function StatCard({ label, total, today, week }: { label: string; total: number; today?: number; week?: number }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-gray-400 text-sm">{label}</p>
            <p className="text-ink text-3xl font-bold mt-1">{total.toLocaleString('tr-TR')}</p>
            {(today !== undefined || week !== undefined) && (
                <p className="text-xs text-gray-500 mt-2">
                    {today !== undefined && <span>Bugün <strong className="text-purple-500">+{today}</strong></span>}
                    {today !== undefined && week !== undefined && ' · '}
                    {week !== undefined && <span>Son 7 gün <strong className="text-purple-500">+{week}</strong></span>}
                </p>
            )}
        </div>
    )
}

function AdminPage() {
    const { profile } = useAuth()
    const { showToast } = useToast()
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    const isAdmin = !!profile?.is_admin

    useEffect(() => {
        if (!isAdmin) return

        const load = async () => {
            const { data, error } = await supabase.rpc('admin_stats')

            if (error) {
                showToast('İstatistikler yüklenemedi.', 'error')
            } else {
                setStats(data as Stats)
            }
            setLoading(false)
        }

        load()
    }, [isAdmin])

    if (profile && !isAdmin) return <Navigate to="/" replace />

    const maxDaily = Math.max(1, ...(stats?.daily ?? []).map((d) => d.users + d.posts + d.comments))

    return (
        <div className="min-h-screen border-x border-gray-800">
            <Seo title="Yönetim" noindex />

            <div className="sticky top-0 z-10 bg-gray-950/85 backdrop-blur px-4 py-3 border-b border-gray-800">
                <h1 className="text-ink font-bold text-xl">Yönetim</h1>
            </div>

            <div className="p-4 space-y-6">
                {loading || !stats ? (
                    <p className="text-gray-500 text-sm">Yükleniyor...</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard label="Üye" total={stats.users_total} today={stats.users_today} week={stats.users_7d} />
                            <StatCard label="Soru" total={stats.posts_total} today={stats.posts_today} week={stats.posts_7d} />
                            <StatCard label="Cevap" total={stats.comments_total} today={stats.comments_today} week={stats.comments_7d} />
                            <StatCard label="Bekleyen şikayet" total={stats.reports_open} />
                            <StatCard label="Beğeni" total={stats.likes_total} />
                            <StatCard label="Anket oyu" total={stats.votes_total} />
                        </div>

                        <div>
                            <h2 className="text-ink font-bold text-lg mb-3">Son 7 gün</h2>
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                                {stats.daily.map((d) => {
                                    const total = d.users + d.posts + d.comments
                                    return (
                                        <div key={d.day}>
                                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                                <span>{new Date(d.day).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
                                                <span>{d.users} üye · {d.posts} soru · {d.comments} cevap</span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-600 rounded-full"
                                                    style={{ width: `${(total / maxDaily) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                <div>
                    <h2 className="text-ink font-bold text-lg mb-3">Kontrol panelleri</h2>
                    <div className="space-y-2">
                        {LINKS.map((link) => (
                            <a
                                key={link.title}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 bg-gray-900 border border-gray-800 hover:border-purple-500/60 rounded-2xl p-4 transition"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-ink font-bold">{link.title}</p>
                                    <p className="text-gray-400 text-sm mt-0.5">{link.text}</p>
                                </div>
                                <ExternalLink size={16} className="text-gray-500 mt-1 shrink-0" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminPage