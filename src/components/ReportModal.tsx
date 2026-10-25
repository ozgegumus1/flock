import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const REASONS = [
    'Hakaret, taciz ya da tehdit',
    'Spam veya reklam',
    'Sahte ya da yanıltıcı bilgi, dolandırıcılık',
    'Uygunsuz görsel veya içerik',
    'Kişisel bilgi paylaşımı',
    'Diğer',
]

interface ReportModalProps {
    open: boolean
    targetType: 'post' | 'user'
    targetId: string
    onClose: () => void
}

function ReportModal({ open, targetType, targetId, onClose }: ReportModalProps) {
    const { user } = useAuth()
    const { showToast } = useToast()

    const [reason, setReason] = useState('')
    const [details, setDetails] = useState('')
    const [sending, setSending] = useState(false)

    if (!open) return null

    const close = () => {
        setReason('')
        setDetails('')
        onClose()
    }

    const handleSend = async () => {
        if (!user || !reason || sending) return

        setSending(true)

        const { error } = await supabase.from('reports').insert({
            reporter_id: user.id,
            target_type: targetType,
            target_id: targetId,
            reason,
            details: details.trim() || null,
        })

        setSending(false)

        if (error) {
            if (error.code === '23505') {
                showToast('Bunu daha önce şikayet ettin. İnceleyeceğiz.', 'error')
                close()
            } else {
                showToast('Şikayet gönderilemedi. Lütfen tekrar dene.', 'error')
            }
            return
        }

        showToast('Teşekkürler, şikayetin bize ulaştı. İnceleyeceğiz.', 'success')
        close()
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center px-4"
            onClick={(e) => {
                e.stopPropagation()
                close()
            }}
        >
            <div
                className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-ink font-bold text-lg">
                    {targetType === 'post' ? 'Bu soruyu şikayet et' : 'Bu kullanıcıyı şikayet et'}
                </h3>
                <p className="text-gray-400 text-sm mt-1">Sebebi seç, ekibimiz inceleyecek.</p>

                <div className="mt-4 space-y-2">
                    {REASONS.map((r) => (
                        <button
                            key={r}
                            onClick={() => setReason(r)}
                            className={`w-full text-left text-sm rounded-xl border px-4 py-2.5 transition ${
                                reason === r
                                    ? 'border-purple-500 bg-purple-600/15 text-ink font-bold'
                                    : 'border-gray-800 text-gray-300 hover:border-purple-500/60'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Eklemek istediğin bir şey var mı? (isteğe bağlı)"
                    className="w-full mt-4 bg-gray-950 border border-gray-800 focus:border-purple-500 text-ink placeholder-gray-500 text-sm rounded-xl px-4 py-3 outline-none resize-none transition"
                />

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={close}
                        className="flex-1 border border-gray-700 hover:bg-gray-800 text-ink font-bold rounded-full py-2.5 text-sm transition"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!reason || sending}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full py-2.5 text-sm transition disabled:opacity-40"
                    >
                        {sending ? 'Gönderiliyor...' : 'Gönder'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReportModal