import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AUTH_INPUT } from './AuthLayout'

export type Gender = 'female' | 'male' | 'unspecified'

const GENDERS: { value: Gender; label: string }[] = [
    { value: 'female', label: 'Kadın' },
    { value: 'male', label: 'Erkek' },
    { value: 'unspecified', label: 'Belirtmek istemiyorum' },
]

const currentYear = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: 83 }, (_, i) => currentYear - 18 - i)

export interface ProfileValues {
    fullName: string
    username: string
    birthYear: string
    gender: Gender | ''
    accepted: boolean
}

export function validateProfile(v: ProfileValues): string | null {
    const name = v.username.trim()

    if (v.fullName.trim().length < 2) return 'Lütfen adını ve soyadını yaz.'

    if (['anonim', 'admin', 'flock', 'destek'].includes(name.toLowerCase())) {
        return 'Bu kullanıcı adı kullanılamaz, başka bir tane dene.'
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
        return 'Kullanıcı adı 3-20 karakter olmalı, sadece harf, rakam ve alt çizgi (_) içerebilir.'
    }

    if (!v.birthYear) return 'Lütfen doğum yılını seç.'
    if (!v.gender) return 'Lütfen cinsiyetini seç.'
    if (!v.accepted) return 'Devam etmek için şartları ve gizlilik politikasını kabul etmelisin.'

    return null
}

interface ProfileFieldsProps {
    values: ProfileValues
    onChange: (next: ProfileValues) => void
    children?: ReactNode
}

function ProfileFields({ values, onChange, children }: ProfileFieldsProps) {
    const set = <K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) =>
        onChange({ ...values, [key]: value })

    return (
        <div className="space-y-3">
            <input
                type="text"
                placeholder="Ad Soyad"
                value={values.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                maxLength={60}
                autoComplete="name"
                className={AUTH_INPUT}
            />

            <input
                type="text"
                placeholder="Kullanıcı adı"
                value={values.username}
                onChange={(e) => set('username', e.target.value)}
                maxLength={20}
                autoCapitalize="none"
                autoComplete="username"
                className={AUTH_INPUT}
            />

            {children}

            <div>
                <select
                    value={values.birthYear}
                    onChange={(e) => set('birthYear', e.target.value)}
                    className={`${AUTH_INPUT} ${values.birthYear ? '' : 'text-gray-500'}`}
                >
                    <option value="">Doğum yılı</option>
                    {BIRTH_YEARS.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
                <p className="text-gray-500 text-xs mt-1 px-1">Doğum yılın kimseye gösterilmez.</p>
            </div>

            <div>
                <div className="grid grid-cols-3 gap-2">
                    {GENDERS.map((g) => (
                        <button
                            key={g.value}
                            type="button"
                            onClick={() => set('gender', g.value)}
                            className={`rounded-xl border px-2 py-2.5 text-xs transition ${
                                values.gender === g.value
                                    ? 'bg-purple-600 border-purple-600 text-white font-bold'
                                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-purple-500/60'
                            }`}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
                <p className="text-gray-500 text-xs mt-1 px-1">
                    Cinsiyetin profil fotoğrafında ince bir renkli halka olarak görünür.
                </p>
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                    type="checkbox"
                    checked={values.accepted}
                    onChange={(e) => set('accepted', e.target.checked)}
                    className="mt-0.5 accent-purple-600 shrink-0"
                />
                <span className="text-gray-400 text-xs leading-relaxed">
                    18 yaşından büyüğüm.{' '}
                    <Link to="/kullanim-sartlari" target="_blank" className="text-purple-500 hover:text-purple-400">
                        Kullanım Şartları
                    </Link>
                    'nı ve{' '}
                    <Link to="/gizlilik-politikasi" target="_blank" className="text-purple-500 hover:text-purple-400">
                        Gizlilik Politikası
                    </Link>
                    'nı okudum, kabul ediyorum.
                </span>
            </label>
        </div>
    )
}

export default ProfileFields
