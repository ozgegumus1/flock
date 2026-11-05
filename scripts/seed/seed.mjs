#!/usr/bin/env node
// Flock demo verisi: 100 anonim soru + yorum + beğeni + anket oyu + kaydetme + takip.
//
//   node scripts/seed/seed.mjs seed          -> sadece ne yapacağını yazar
//   node scripts/seed/seed.mjs seed --yes    -> gerçekten yazar
//   node scripts/seed/seed.mjs clean --yes   -> eklenen her şeyi siler
//
// SUPABASE_SERVICE_ROLE_KEY gerekir (.env.seed dosyasına yaz, git'e koyma).

import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PERSONAS } from './personas.mjs'
import { POSTS as FIRST_POSTS } from './content.mjs'

// content2.mjs (ve istenirse content3.mjs...) varsa onlar da eklenir. Başlığı veritabanında zaten olan gönderi atlanır.
const EXTRA = []
for (const name of ['content2.mjs', 'content3.mjs']) {
    if (existsSync(resolve(dirname(fileURLToPath(import.meta.url)), name))) EXTRA.push(...(await import(`./${name}`)).POSTS)
}
const POSTS = [...FIRST_POSTS, ...EXTRA]

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const STATE_FILE = resolve(HERE, '.seed-state.json')
const EMAIL_DOMAIN = 'seed.flock.invalid' // geçersiz alan adı, gerçek kimseye mail gitmez

function loadEnvFile(name) {
    const file = resolve(ROOT, name)
    if (!existsSync(file)) return
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
    }
}
loadEnvFile('.env.seed')
loadEnvFile('.env')

const [command = 'seed', ...flags] = process.argv.slice(2)
const CONFIRMED = flags.includes('--yes')
const URL_ = process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

const fail = (m) => { console.error(`✖ ${m}`); process.exit(1) }
const log = (...a) => console.log(...a)
const warn = (...a) => console.warn('  ⚠', ...a)

if (!URL_ || !ANON) fail('.env içinde VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY yok.')
if (!SERVICE) fail('SUPABASE_SERVICE_ROLE_KEY yok. Supabase > Project Settings > API > service_role anahtarını .env.seed dosyasına yaz.')
if (!['seed', 'clean', 'dedupe'].includes(command)) fail('Komut "seed", "clean" ya da "dedupe" olmalı.')

const host = new globalThis.URL(URL_).host
const clientOpts = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(URL_, SERVICE, clientOpts)

// ── yardımcılar ───────────────────────────────────────────────
function rng(seed) { // tekrar çalışınca aynı sonucu veren rastgelelik
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
const rand = rng(20261105)
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1))
function pick(arr, n, exclude = []) {
    const pool = arr.filter((x) => !exclude.includes(x))
    for (let i = pool.length - 1; i > 0; i--) { const j = int(0, i); [pool[i], pool[j]] = [pool[j], pool[i]] }
    return pool.slice(0, Math.max(0, Math.min(n, pool.length)))
}
function weighted(weights) {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = rand() * total
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i }
    return weights.length - 1
}
async function inChunks(rows, size, fn) {
    for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size))
}
const readState = () => (existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : { postIds: [] })
const saveState = (s) => writeFileSync(STATE_FILE, JSON.stringify(s))

async function listSeedUsers() {
    const found = []
    for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
        if (error) fail(`Kullanıcılar listelenemedi: ${error.message}`)
        found.push(...data.users.filter((u) => u.user_metadata?.is_seed === true))
        if (data.users.length < 200) break
    }
    return found
}

// Captcha'ya takılmadan o kullanıcı gibi oturum açar.
async function sessionClient(email) {
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    if (error) throw new Error(`generateLink: ${error.message}`)
    const c = createClient(URL_, ANON, clientOpts)
    const { error: vErr } = await c.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: 'magiclink' })
    if (vErr) throw new Error(`verifyOtp: ${vErr.message}`)
    return c
}

// ── plan ──────────────────────────────────────────────────────
function buildPlan(posts) {
    const keys = PERSONAS.map((p) => p.key)
    const now = Date.now()
    return posts.map((post, idx) => {
        const author = keys[int(0, keys.length - 1)]
        const nComments = post.comments.length
        // gönderi yaşı: çoğu son 1 hafta, bir kısmı 2-3 hafta önce
        const ageHours = rand() < 0.65 ? int(2, 24 * 7) : int(24 * 7, 24 * 21)
        const createdAt = now - ageHours * 3600_000
        const commenters = pick(keys, nComments, [author])
        const comments = post.comments.map((text, i) => {
            const span = now - createdAt
            const at = createdAt + Math.min(span - 60_000, (i + 1) * (span / (nComments + 2)) * (0.4 + rand() * 0.9))
            return { by: commenters[i], text: text.trim(), at: Math.max(createdAt + 120_000, at) }
        })
        const likeCount = Math.min(keys.length - 1, int(2, 8) + Math.round(nComments * (1 + rand() * 2.2)))
        const likers = pick(keys, likeCount, [author])
        const savers = pick(keys, int(0, Math.max(1, Math.round(likeCount / 4))), [author])

        let votes = []
        if (post.poll) {
            const voterCount = Math.min(keys.length - 1, int(8, 20) + Math.round(nComments * 1.5))
            const voters = pick(keys, voterCount, [author])
            const type = post.poll.type
            const w = type === 'options' ? post.poll.options.map(() => 0.15 + rand() ** 2)
                : type === 'rating' ? [0.3, 0.6, 1.3, 1.6, 1.0].map((x) => x * (0.5 + rand()))
                : [1.6, 1.0, 0.5].map((x) => x * (0.5 + rand()))
            votes = voters.map((by) => ({ by, pick: weighted(w) }))
        }
        return { idx, post, author, createdAt, comments, likers, savers, votes }
    })
}

// ── SEED ──────────────────────────────────────────────────────
async function existingTitles() {
    const have = new Set()
    const ids = readState().postIds
    for (let i = 0; i < ids.length; i += 100) {
        const { data } = await admin.from('posts').select('title').in('id', ids.slice(i, i + 100))
        for (const r of data ?? []) have.add(String(r.title).trim())
    }
    for (let i = 0; i < POSTS.length; i += 50) {
        const titles = POSTS.slice(i, i + 50).map((p) => p.title.trim())
        const { data } = await admin.from('posts').select('title').in('title', titles)
        for (const r of data ?? []) have.add(String(r.title).trim())
    }
    return have
}

async function seed() {
    const have = await existingTitles()
    const fresh = POSTS.filter((p) => !have.has(p.title.trim()))
    const isAddOn = have.size > 0
    if (fresh.length === 0) return log('Hepsi zaten eklenmiş, yapılacak bir şey yok.')
    const plan = buildPlan(fresh)
    const totals = {
        kullanıcı: PERSONAS.length,
        'anonim gönderi': plan.length,
        yorum: plan.reduce((n, p) => n + p.comments.length, 0),
        'gönderi beğenisi': plan.reduce((n, p) => n + p.likers.length, 0),
        'anket oyu': plan.reduce((n, p) => n + p.votes.length, 0),
        kaydetme: plan.reduce((n, p) => n + p.savers.length, 0),
    }
    log(`Hedef proje: ${host}`)
    log('Eklenecek  :', totals)
    if (!CONFIRMED) return log('\nBu sadece önizleme. Gerçekten yazmak için sonuna --yes ekle.')

    const { data: topics, error: tErr } = await admin.from('topics').select('id, slug')
    if (tErr) fail(`topics okunamadı: ${tErr.message}`)
    const topicId = Object.fromEntries(topics.map((t) => [t.slug, t.id]))
    for (const p of fresh) if (!topicId[p.topic]) fail(`Veritabanında "${p.topic}" konusu yok.`)

    // 1) kullanıcılar
    const existing = new Map((await listSeedUsers()).map((u) => [u.email, u]))
    const U = {}
    for (const p of PERSONAS) {
        const email = `${p.username}@${EMAIL_DOMAIN}`
        let user = existing.get(email)
        if (!user) {
            const { data, error } = await admin.auth.admin.createUser({
                email, password: randomUUID() + randomUUID(), email_confirm: true,
                user_metadata: { username: p.username, full_name: p.fullName, gender: p.gender, birth_year: p.birthYear, is_seed: true },
            })
            if (error) fail(`Kullanıcı oluşturulamadı (${p.username}): ${error.message}`)
            user = data.user
        }
        const { data: prof } = await admin.from('profiles').select('id').eq('id', user.id).maybeSingle()
        if (!prof) {
            const { error } = await admin.from('profiles').insert({ id: user.id, username: p.username, full_name: p.fullName, gender: p.gender })
            if (error) warn(`profil eklenemedi (${p.username}): ${error.message}`)
        }
        const { error: pe } = await admin.from('profile_private').upsert({ user_id: user.id, birth_year: p.birthYear }, { onConflict: 'user_id' })
        if (pe) warn(`profile_private (${p.username}): ${pe.message}`)
        U[p.key] = { id: user.id, username: p.username, email, client: null }
    }
    log(`✔ ${PERSONAS.length} kullanıcı hazır`)
    const clientOf = async (key) => (U[key].client ??= await sessionClient(U[key].email))

    // toplu ekleme; hata olursa uyarı verip devam eder
    const bulk = async (table, rows, label, upsertOn) => {
        await inChunks(rows, 200, async (chunk) => {
            const q = upsertOn ? admin.from(table).upsert(chunk, { onConflict: upsertOn }) : admin.from(table).insert(chunk)
            const { error } = await q
            if (error) warn(`${label}: ${error.message}`)
        })
    }

    // 2) gönderiler
    const state = readState()
    state.postIds ??= []
    let n = 0
    for (const item of plan) {
        const { post, author } = item
        const authorClient = await clientOf(author)

        const { data: created, error } = await authorClient.rpc('create_anonymous_post', {
            p_title: post.title.trim(),
            p_content: (post.content ?? '').trim(),
            p_topic_id: topicId[post.topic],
            p_image_url: null,
            p_image_urls: null,
            p_poll_type: post.poll?.type ?? null,
        })
        const postId = created?.id
        if (error || !postId) { warn(`gönderi eklenemedi "${post.title}": ${error?.message ?? 'id dönmedi'}`); continue }
        state.postIds.push(String(postId))
        saveState(state)

        // tarih: gönderiyi geçmişe yay
        const { error: dErr } = await admin.from('posts').update({ created_at: new Date(item.createdAt).toISOString() }).eq('id', postId)
        if (dErr) warn(`tarih ayarlanamadı: ${dErr.message}`)

        // anket seçenekleri
        let optionIds = []
        if (post.poll?.type === 'options') {
            const rows = post.poll.options.map((label, i) => ({ post_id: postId, label, image_url: null, sort_order: i }))
            const { data: o, error: oErr } = await authorClient.from('poll_options').insert(rows).select('id, sort_order')
            if (oErr) warn(`seçenekler eklenemedi: ${oErr.message}`)
            else optionIds = o.sort((a, b) => a.sort_order - b.sort_order).map((x) => x.id)
        }

        // oylar
        const voteRows = item.votes.map((v) => {
            const base = { post_id: postId, user_id: U[v.by].id }
            if (post.poll.type === 'options') return optionIds[v.pick] ? { ...base, option_id: optionIds[v.pick], value: null } : null
            return { ...base, option_id: null, value: post.poll.type === 'rating' ? v.pick + 1 : v.pick + 1 }
        }).filter(Boolean)
        await bulk('poll_votes', voteRows, 'oylar', 'post_id,user_id')

        // yorumlar (tarihleriyle)
        const commentRows = item.comments.map((c) => ({
            post_id: postId, user_id: U[c.by].id, username: U[c.by].username,
            content: c.text, created_at: new Date(c.at).toISOString(),
        }))
        const { data: insertedComments, error: cErr } = await admin.from('comments').insert(commentRows).select('id')
        if (cErr) warn(`yorumlar eklenemedi: ${cErr.message}`)

        // yorum beğenileri (bazı yorumlar çok beğenilsin)
        if (insertedComments?.length) {
            const rows = []
            for (const c of insertedComments) {
                const hype = rand() < 0.2 ? int(5, 14) : rand() < 0.6 ? int(0, 4) : 0
                for (const key of pick(PERSONAS.map((p) => p.key), hype)) rows.push({ comment_id: c.id, user_id: U[key].id })
            }
            await bulk('comment_likes', rows, 'yorum beğenileri')
        }

        // gönderi beğenileri ve kaydetmeler
        await bulk('likes', item.likers.map((k) => ({ post_id: postId, user_id: U[k].id })), 'beğeniler')
        await bulk('saved_posts', item.savers.map((k) => ({ post_id: postId, user_id: U[k].id })), 'kaydedilenler')

        if (++n % 10 === 0) log(`  ${n}/${plan.length} gönderi`)
    }

    // 3) takipler
    const keys = PERSONAS.map((p) => p.key)
    const follows = []
    for (const k of keys) for (const t of pick(keys, int(3, 12), [k])) {
        follows.push({ follower_id: U[k].id, following_id: U[t].id, status: 'accepted' })
    }
    if (!isAddOn) await bulk('follows', follows, 'takipler')

    log(`\n✔ Bitti: ${n} yeni gönderi eklendi (toplam ${state.postIds.length}). Geri almak için: node scripts/seed/seed.mjs clean --yes`)
}

// ── CLEAN ─────────────────────────────────────────────────────
async function clean() {
    const users = await listSeedUsers()
    const ids = users.map((u) => u.id)
    let postIds = readState().postIds

    if (ids.length) { // state dosyası kaybolduysa anonim gönderileri yazar tablosundan bul
        const { data } = await admin.from('anonymous_authors').select('post_id').in('user_id', ids)
        postIds = [...new Set([...postIds, ...(data ?? []).map((r) => String(r.post_id))])]
    }

    log(`Hedef proje: ${host}`)
    log(`Silinecek: ${users.length} kullanıcı, ${postIds.length} gönderi`)
    if (!users.length && !postIds.length) return log('Temizlenecek bir şey yok.')
    if (!CONFIRMED) return log('\nBu sadece önizleme. Gerçekten silmek için sonuna --yes ekle.')

    const del = async (table, col, vals) => {
        for (let i = 0; i < vals.length; i += 100) {
            const { error } = await admin.from(table).delete().in(col, vals.slice(i, i + 100))
            if (error) warn(`${table}.${col}: ${error.message}`)
        }
    }

    // gerçek kullanıcı yorumu olan gönderileri silme
    const keep = new Set()
    for (const id of postIds) {
        const { count } = await admin.from('comments').select('*', { count: 'exact', head: true })
            .eq('post_id', id).not('user_id', 'in', `(${ids.join(',')})`)
        if (count > 0) { keep.add(id); warn(`gönderi ${id} gerçek kullanıcı yorumu içeriyor, silinmedi`) }
    }
    const del_posts = postIds.filter((p) => !keep.has(p))

    const commentIds = []
    for (let i = 0; i < del_posts.length; i += 100) {
        const { data } = await admin.from('comments').select('id').in('post_id', del_posts.slice(i, i + 100))
        commentIds.push(...(data ?? []).map((c) => c.id))
    }
    await del('comment_likes', 'comment_id', commentIds)
    await del('comment_likes', 'user_id', ids)
    await del('poll_votes', 'post_id', del_posts)
    await del('poll_options', 'post_id', del_posts)
    await del('likes', 'post_id', del_posts)
    await del('saved_posts', 'post_id', del_posts)
    await del('comments', 'post_id', del_posts)
    await del('anonymous_authors', 'post_id', del_posts)
    await del('posts', 'id', del_posts)

    await del('poll_votes', 'user_id', ids)
    await del('likes', 'user_id', ids)
    await del('saved_posts', 'user_id', ids)
    await del('comments', 'user_id', ids)
    await del('follows', 'follower_id', ids)
    await del('follows', 'following_id', ids)
    await del('notifications', 'user_id', ids)
    await del('notification_settings', 'user_id', ids)
    await del('profile_private', 'user_id', ids)
    await del('profiles', 'id', ids)
    for (const u of users) {
        const { error } = await admin.auth.admin.deleteUser(u.id)
        if (error) warn(`kullanıcı silinemedi (${u.email}): ${error.message}`)
    }
    saveState({ postIds: [...keep] })
    log('✔ Temizlendi.')
}

// ── DEDUPE: aynı başlıkla iki kez eklenmiş test gönderilerinin ikincisini siler ──
async function dedupe() {
    const state = readState()
    const rows = []
    for (let i = 0; i < state.postIds.length; i += 100) {
        const { data } = await admin.from('posts').select('id, title').in('id', state.postIds.slice(i, i + 100))
        rows.push(...(data ?? []))
    }
    const order = new Map(state.postIds.map((id, i) => [String(id), i]))
    rows.sort((a, b) => order.get(String(a.id)) - order.get(String(b.id)))
    const seen = new Set()
    const dupes = []
    for (const r of rows) {
        const t = String(r.title).trim()
        if (seen.has(t)) dupes.push(String(r.id)); else seen.add(t)
    }
    log(`Hedef proje: ${host}`)
    log(`Toplam test gönderisi: ${rows.length}, çift kopya: ${dupes.length}`)
    if (!dupes.length) return log('Çift kopya yok.')
    if (!CONFIRMED) return log('\nBu sadece önizleme. Gerçekten silmek için sonuna --yes ekle.')

    const del = async (table, col, vals) => {
        for (let i = 0; i < vals.length; i += 100) {
            const { error } = await admin.from(table).delete().in(col, vals.slice(i, i + 100))
            if (error) warn(`${table}.${col}: ${error.message}`)
        }
    }
    const commentIds = []
    for (let i = 0; i < dupes.length; i += 100) {
        const { data } = await admin.from('comments').select('id').in('post_id', dupes.slice(i, i + 100))
        commentIds.push(...(data ?? []).map((c) => c.id))
    }
    await del('comment_likes', 'comment_id', commentIds)
    await del('poll_votes', 'post_id', dupes)
    await del('poll_options', 'post_id', dupes)
    await del('likes', 'post_id', dupes)
    await del('saved_posts', 'post_id', dupes)
    await del('comments', 'post_id', dupes)
    await del('anonymous_authors', 'post_id', dupes)
    await del('posts', 'id', dupes)
    saveState({ postIds: state.postIds.filter((id) => !dupes.includes(String(id))) })
    log(`✔ ${dupes.length} çift kopya silindi.`)
}

await (command === 'seed' ? seed() : command === 'dedupe' ? dedupe() : clean())
