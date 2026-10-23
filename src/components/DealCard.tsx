import { Copy, ExternalLink } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export interface Deal {
    store: string
    url: string
    price?: number | null
    old_price?: number | null
    coupon?: string | null
    ends_at?: string | null
}

function formatPrice(value: number): string {
    return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL`
}

function getEndInfo(endsAt?: string | null): { text: string; expired: boolean } | null {
    if (!endsAt) return null

    const end = new Date(`${endsAt}T23:59:59`)
    if (isNaN(end.getTime())) return null

    const diffMs = end.getTime() - Date.now()
    if (diffMs <= 0) return { text: 'İndirim sona erdi', expired: true }

    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (days <= 1) return { text: 'Son gün!', expired: false }

    return { text: `${days} gün kaldı`, expired: false }
}

function DealCard({ deal }: { deal: Deal }) {
    const { showToast } = useToast()

    const safeUrl = /^https?:\/\//i.test(deal.url) ? deal.url : null
    const endInfo = getEndInfo(deal.ends_at)

    const discountPercent =
        deal.price != null && deal.old_price != null && deal.old_price > deal.price
            ? Math.round(((deal.old_price - deal.price) / deal.old_price) * 100)
            : null

    const copyCoupon = async () => {
        if (!deal.coupon) return

        try {
            await navigator.clipboard.writeText(deal.coupon)
            showToast('Kupon kodu kopyalandı!', 'success')
        } catch {
            showToast('Kod kopyalanamadı. Elle kopyalayabilirsin.', 'error')
        }
    }

    return (
        <div className="mt-3 bg-gray-900 border border-gray-800 rounded-2xl p-4">

            <div className="flex items-center justify-between gap-2">
                <p className="text-gray-400 text-sm font-bold truncate">🏷️ {deal.store}</p>
                {endInfo && (
                    <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                            endInfo.expired
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                    >
                        {endInfo.text}
                    </span>
                )}
            </div>

            {(deal.price != null || deal.old_price != null) && (
                <div className="flex items-end gap-3 mt-3">
                    {deal.price != null && (
                        <span className="text-ink text-3xl font-bold leading-none">
                            {formatPrice(deal.price)}
                        </span>
                    )}
                    {deal.old_price != null && (
                        <span className="text-gray-500 line-through leading-none">
                            {formatPrice(deal.old_price)}
                        </span>
                    )}
                    {discountPercent !== null && (
                        <span className="bg-emerald-500/15 text-emerald-400 text-sm font-bold px-2.5 py-1 rounded-full leading-none">
                            %{discountPercent}
                        </span>
                    )}
                </div>
            )}

            {deal.coupon && (
                <button
                    onClick={copyCoupon}
                    className="mt-3 w-full flex items-center justify-between gap-2 border border-dashed border-gray-700 hover:border-purple-500 rounded-xl px-4 py-2.5 transition"
                >
                    <span className="text-gray-400 text-xs">Kupon kodu</span>
                    <span className="flex items-center gap-2 text-ink font-bold tracking-wider">
                        {deal.coupon}
                        <Copy size={15} className="text-gray-400" />
                    </span>
                </button>
            )}

            {safeUrl && (
                <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-3 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full py-3 transition"
                >
                    İndirime git
                    <ExternalLink size={16} />
                </a>
            )}

            <p className="text-gray-600 text-xs mt-3">
                Bu bağlantı Flock'a ait değildir. Fiyat ve stok mağazaya göre değişebilir.
            </p>

        </div>
    )
}

export default DealCard
