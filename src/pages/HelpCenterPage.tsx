import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Mail } from 'lucide-react'

const faqs = [
    {
        question: 'Hesabımı nasıl gizli yaparım?',
        answer: 'Ayarlar > Gizlilik bölümünden "Gizli hesap" seçeneğini açabilirsin. Gizli hesaplarda yeni takipçiler senin onayına ihtiyaç duyar.',
    },
    {
        question: 'Birini nasıl engellerim?',
        answer: 'Engellemek istediğin kişinin profiline gidip "Engelle" butonuna basabilir, veya mesajlaşma listesinde kişinin yanındaki üç noktaya tıklayıp "Engelle" seçeneğini kullanabilirsin.',
    },
    {
        question: 'Şifremi unuttum, ne yapmalıyım?',
        answer: 'Giriş ekranındaki "Şifremi unuttum" linkini kullanarak e-posta adresine sıfırlama bağlantısı gönderebilirsin.',
    },
    {
        question: 'Postumu nasıl silerim?',
        answer: 'Kendi postunun sağ üstündeki üç noktaya tıklayıp "Postu sil" seçeneğini seçebilirsin.',
    },
    {
        question: 'Bildirimleri nasıl kapatırım?',
        answer: 'Ayarlar > Bildirimler bölümünden hangi bildirim türlerini almak istediğini ayrı ayrı açıp kapatabilirsin.',
    },
    {
        question: 'Hesabımı nasıl silerim?',
        answer: 'Ayarlar sayfasının en altındaki "Tehlikeli Bölge" kısmında "Hesabımı sil" seçeneğini bulabilirsin. Bu işlem geri alınamaz.',
    },
]

function HelpCenterPage() {
    const navigate = useNavigate()
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="flex-1 min-h-screen border-x border-gray-800">
            {/* Başlık */}
            <div className="sticky top-0 bg-gray-950/80 backdrop-blur-sm px-4 py-3 border-b border-gray-800 flex items-center gap-4 z-10">
                <button
                    onClick={() => navigate('/ayarlar')}
                    className="text-white hover:text-gray-400 transition"
                >
                    ← Geri
                </button>
                <h1 className="text-white font-bold text-xl">Yardım Merkezi</h1>
            </div>

            <p className="text-gray-500 text-sm px-4 pt-4 pb-2">
                Sık sorulan sorular
            </p>

            <div className="divide-y divide-gray-800">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index
                    return (
                        <div key={index}>
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className="flex items-center justify-between gap-3 w-full px-4 py-4 text-left hover:bg-gray-900/50 transition"
                            >
                                <span className="text-white text-sm font-medium">{faq.question}</span>
                                <ChevronDown
                                    size={18}
                                    className={`text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {isOpen && (
                                <p className="text-gray-400 text-sm px-4 pb-4 leading-relaxed">
                                    {faq.answer}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* İletişim */}
            <div className="p-4 mt-2">
                <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3">
                    <Mail size={20} className="text-purple-400 shrink-0" />
                    <div className="flex-1">
                        <p className="text-white text-sm font-medium">Sorunun cevabını bulamadın mı?</p>
                        <p className="text-gray-500 text-xs mt-0.5">Bize destek e-postasından ulaşabilirsin.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HelpCenterPage