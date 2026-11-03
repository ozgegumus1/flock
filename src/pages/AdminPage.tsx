import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Seo from '../components/Seo'
import ConfirmModal from '../components/ConfirmModal'

interface DayRow {
    day: string
    users: number
    posts: number
    comments: number
}

interface Report {
    id: string
    created_at: string
    target_type: 'post' | 'user'
    target_id: string
    reason: string
    details: string | null
    same_target: number
    post_exists: boolean
    post_title: string | null
    post_content: string | null
    post_username: string | null
    post_anonymous: boolean | null
    user_username: string | null
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
    const [reports, setReports] = useState<Report[]>([])
    const [busyId, setBusyId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Report | null>(null)

    const isAdmin = !!profile?.is_admin

    const loadAll = async () => {
        const [statsResult, reportsResult] = await Promise.all([
            supabase.rpc('admin_stats'),
            supabase.rpc('admin_reports'),
        ])

        if (statsResult.error) {
            showToast('İstatistikler yüklenemedi.', 'error')
        } else {
            setStats(statsResult.data as Stats)
        }

        if (reportsResult.error) {
            showToast('Şikayetler yüklenemedi.', 'error')
        } else {
            setReports((reportsResult.data ?? []) as Report[])
        }

        setLoading(false)
    }

    useEffect(() => {
        if (!isAdmin) return
        loadAll()
    }, [isAdmin])

    const resolve = async (report: Report, action: 'close' | 'delete_post') => {
        setBusyId(report.id)

        const { error } = await supabase.rpc('admin_resolve_report', {
            p_report_id: report.id,
            p_action: action,
        })

        setBusyId(null)

        if (error) {
            showToast('İşlem yapılamadı. Lütfen tekrar dene.', 'error')
            return
        }

        showToast(action === 'delete_post' ? 'Soru silindi.' : 'Şikayet kapatıldı.', 'success')
        await loadAll()
    }

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
                            <h2 className="text-ink font-bold text-lg mb-3">
                                Şikayetler {reports.length > 0 && <span className="text-purple-500">({reports.length})</span>}
                            </h2>

                            {reports.length === 0 ? (
                                <p className="text-gray-500 text-sm bg-gray-900 border border-gray-800 rounded-2xl p-4">
                                    Bekleyen şikayet yok.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {reports.map((r) => (
                                        <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                                <span className="bg-purple-900 text-purple-300 font-bold rounded-full px-2.5 py-1">
                                                    {r.target_type === 'post' ? 'Soru' : 'Kullanıcı'}
                                                </span>
                                                <span className="text-gray-500">
                                                    {new Date(r.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {r.same_target > 1 && (
                                                    <span className="text-orange-500 font-bold">{r.same_target} kişi şikayet etti</span>
                                                )}
                                            </div>

                                            <p className="text-ink font-bold mt-2">{r.reason}</p>
                                            {r.details && <p className="text-gray-400 text-sm mt-1">"{r.details}"</p>}

                                            <div className="mt-3 bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm">
                                                {r.target_type === 'post' ? (
                                                    r.post_exists ? (
                                                        <>
                                                            <p className="text-ink font-bold">{r.post_title || '(başlıksız)'}</p>
                                                            {r.post_content && (
                                                                <p className="text-gray-400 mt-1 line-clamp-3">{r.post_content}</p>
                                                            )}
                                                            <p className="text-gray-500 text-xs mt-2">
                                                                Yazar: {r.post_anonymous ? 'Anonim' : `@${r.post_username}`}
                                                            </p>
                                                            <Link to={`/gonderi/${r.target_id}`} className="text-purple-500 hover:text-purple-400 text-xs font-bold mt-1 inline-block">
                                                                Soruyu aç →
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <p className="text-gray-500">Bu soru zaten silinmiş.</p>
                                                    )
                                                ) : r.user_username ? (
                                                    <>
                                                        <p className="text-ink font-bold">@{r.user_username}</p>
                                                        <Link to={`/profil/${r.user_username}`} className="text-purple-500 hover:text-purple-400 text-xs font-bold mt-1 inline-block">
                                                            Profili aç →
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <p className="text-gray-500">Bu hesap bulunamadı.</p>
                                                )}
                                            </div>

                                            <div className="flex gap-2 mt-3">
                                                {r.target_type === 'post' && r.post_exists && (
                                                    <button
                                                        onClick={() => setDeleteTarget(r)}
                                                        disabled={busyId === r.id}
                                                        className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-full py-2 transition disabled:opacity-50"
                                                    >
                                                        Soruyu sil
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => resolve(r, 'close')}
                                                    disabled={busyId === r.id}
                                                    className="flex-1 border border-gray-700 hover:bg-gray-800 text-ink text-sm font-bold rounded-full py-2 transition disabled:opacity-50"
                                                >
                                                    Şikayeti kapat
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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

            <ConfirmModal
                open={deleteTarget !== null}
                title="Bu soruyu silmek istediğine emin misin?"
                message="Soru, cevapları ve oylarıyla birlikte silinir. Bu işlem geri alınamaz."
                confirmText="Sil"
                danger
                onConfirm={() => {
                    const target = deleteTarget
                    setDeleteTarget(null)
                    if (target) resolve(target, 'delete_post')
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}

export default AdminPage