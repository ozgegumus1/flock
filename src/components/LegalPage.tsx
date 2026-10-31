import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Seo from './Seo'

// Kendi iletişim e-postanı buraya yaz (sitede herkese görünecek).
export const CONTACT_EMAIL = 'ozgegumus.1994@gmail.com'
export const LAST_UPDATED = '20 Ekim 2026'

export function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mt-8">
            <h2 className="text-ink font-bold text-lg mb-3">{title}</h2>
            <div className="text-gray-300 text-sm leading-relaxed space-y-3">{children}</div>
        </section>
    )
}

export function List({ items }: { items: ReactNode[] }) {
    return (
        <ul className="list-disc pl-5 space-y-1.5">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    )
}

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-950 text-ink">
            <Seo title={title} />
            <div className="max-w-2xl mx-auto px-5 py-10">
                <Link to="/" className="text-purple-400 hover:text-purple-300 text-sm">
                    ← Flock'a dön
                </Link>

                <h1 className="text-3xl font-bold mt-6">{title}</h1>
                <p className="text-gray-500 text-sm mt-2">Son güncelleme: {LAST_UPDATED}</p>

                {children}

                <div className="mt-12 pt-6 border-t border-gray-800 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <Link to="/gizlilik-politikasi" className="text-gray-400 hover:text-ink">
                        Gizlilik Politikası
                    </Link>
                    <Link to="/kullanim-sartlari" className="text-gray-400 hover:text-ink">
                        Kullanım Şartları
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default LegalPage