import type { CSSProperties } from 'react'

const BY_SLUG: Record<string, string> = {
    'bana-yakisir-mi': 'rose',
    'kullandiniz-mi': 'lilac',
    'guvenilir-oneri': 'sage',
    'deneyim-paylasimi': 'sky',
    'tasinma-ve-ev': 'peach',
    'evlilik-hazirligi': 'rose',
    'hamilelik-ve-bebek': 'butter',
    'is-hayati': 'sky',
    'universite-ve-egitim': 'lilac',
    'indirimler': 'peach',
}

export function topicTint(slug?: string | null): CSSProperties {
    const key = BY_SLUG[slug ?? ''] ?? 'rose'
    return { background: `var(--tint-${key}-bg)`, color: `var(--tint-${key}-fg)` }
}

export function topicColor(slug?: string | null): CSSProperties {
    const key = BY_SLUG[slug ?? ''] ?? 'rose'
    return { color: `var(--tint-${key}-fg)` }
}
