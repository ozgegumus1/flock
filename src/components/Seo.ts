import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://flocksocial.vercel.app'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
const DEFAULT_TITLE = 'Flock - Soru sor, oy ver, deneyim paylaş'
const DEFAULT_DESCRIPTION =
    "Flock'ta kombin, ürün, güvenilir öneri ve indirimler hakkında soru sor, oylamaya katıl, deneyimlerini paylaş. Kadınların birbirine gerçek tavsiye verdiği yer."

interface SeoProps {
    title?: string
    description?: string
    image?: string | null
    type?: 'website' | 'article'
    noindex?: boolean
    jsonLd?: Record<string, unknown>
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
    let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', 'canonical')
        document.head.appendChild(el)
    }
    el.setAttribute('href', href)
}

// Her sayfanın kendi başlığını, açıklamasını, kanonik adresini ve paylaşım bilgilerini ayarlar.
function Seo({ title, description, image, type = 'website', noindex = false, jsonLd }: SeoProps) {
    const { pathname } = useLocation()

    useEffect(() => {
        const fullTitle = title ? (title.includes('Flock') ? title : `${title} | Flock`) : DEFAULT_TITLE
        const desc = description?.trim() || DEFAULT_DESCRIPTION
        const url = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`
        const img = image || DEFAULT_IMAGE

        document.title = fullTitle
        upsertMeta('name', 'description', desc)
        upsertCanonical(url)
        upsertMeta('property', 'og:title', fullTitle)
        upsertMeta('property', 'og:description', desc)
        upsertMeta('property', 'og:url', url)
        upsertMeta('property', 'og:type', type)
        upsertMeta('property', 'og:image', img)
        upsertMeta('name', 'twitter:title', fullTitle)
        upsertMeta('name', 'twitter:description', desc)
        upsertMeta('name', 'twitter:image', img)

        let robots: HTMLMetaElement | null = null
        if (noindex) {
            robots = document.createElement('meta')
            robots.setAttribute('name', 'robots')
            robots.setAttribute('content', 'noindex, nofollow')
            document.head.appendChild(robots)
        }

        let script: HTMLScriptElement | null = null
        if (jsonLd) {
            script = document.createElement('script')
            script.type = 'application/ld+json'
            script.text = JSON.stringify(jsonLd)
            document.head.appendChild(script)
        }

        return () => {
            document.title = DEFAULT_TITLE
            upsertMeta('name', 'description', DEFAULT_DESCRIPTION)
            upsertCanonical(`${SITE_URL}/`)
            upsertMeta('property', 'og:title', DEFAULT_TITLE)
            upsertMeta('property', 'og:description', DEFAULT_DESCRIPTION)
            upsertMeta('property', 'og:url', `${SITE_URL}/`)
            upsertMeta('property', 'og:type', 'website')
            upsertMeta('property', 'og:image', DEFAULT_IMAGE)
            upsertMeta('name', 'twitter:title', DEFAULT_TITLE)
            upsertMeta('name', 'twitter:description', DEFAULT_DESCRIPTION)
            upsertMeta('name', 'twitter:image', DEFAULT_IMAGE)
            robots?.remove()
            script?.remove()
        }
    }, [title, description, image, type, noindex, pathname, JSON.stringify(jsonLd ?? null)])

    return null
}

export default Seo