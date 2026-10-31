// Google'a "sitemde hangi sayfalar var" diyen harita. Her istekte veritabanından güncel hâli üretilir.
const SITE = 'https://flocksocial.vercel.app'

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  return (
    '  <url>\n' +
    `    <loc>${escapeXml(loc)}</loc>\n` +
    (lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` : '') +
    (changefreq ? `    <changefreq>${changefreq}</changefreq>\n` : '') +
    (priority ? `    <priority>${priority}</priority>\n` : '') +
    '  </url>\n'
  )
}

export default async function handler(req, res) {
  const base = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  let topics = []
  let posts = []

  try {
    const [topicsRes, postsRes] = await Promise.all([
      fetch(`${base}/rest/v1/topics?select=slug&order=sort_order.asc`, { headers }),
      fetch(
        `${base}/rest/v1/posts?select=id,created_at&topic_id=not.is.null&order=created_at.desc&limit=5000`,
        { headers }
      ),
    ])
    if (topicsRes.ok) topics = await topicsRes.json()
    if (postsRes.ok) posts = await postsRes.json()
  } catch {
    // veritabanına ulaşılamazsa sadece sabit sayfalar listelenir
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  xml += urlEntry(`${SITE}/`, { changefreq: 'daily', priority: '1.0' })
  xml += urlEntry(`${SITE}/kayit`, { changefreq: 'monthly', priority: '0.5' })
  xml += urlEntry(`${SITE}/giris`, { changefreq: 'monthly', priority: '0.3' })
  xml += urlEntry(`${SITE}/gizlilik-politikasi`, { changefreq: 'yearly', priority: '0.2' })
  xml += urlEntry(`${SITE}/kullanim-sartlari`, { changefreq: 'yearly', priority: '0.2' })

  for (const t of topics) {
    xml += urlEntry(`${SITE}/konu/${t.slug}`, { changefreq: 'daily', priority: '0.8' })
  }

  for (const p of posts) {
    xml += urlEntry(`${SITE}/gonderi/${p.id}`, {
      lastmod: p.created_at ? new Date(p.created_at).toISOString() : undefined,
      changefreq: 'weekly',
      priority: '0.6',
    })
  }

  xml += '</urlset>\n'

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}