// Yorum, beğeni, oy ve takip yapacak hesaplar. Kullanıcı adı: sadece harf, rakam, alt çizgi (3-20 karakter).
const raw = [
    ['zeynepkrc', 'Zeynep Karaca', 1996], ['melisdemir', 'Melis Demir', 1999], ['ecem_yl', 'Ecem Yıldız', 2001],
    ['busra_k', 'Büşra Kaya', 1994], ['irmak_ozt', 'Irmak Öztürk', 2000], ['sibel34', 'Sibel Aksoy', 1988],
    ['dilaraa_', 'Dilara Çelik', 2003], ['hazal_sn', 'Hazal Şen', 1997], ['gizemb', 'Gizem Bulut', 1992],
    ['nazli_e', 'Nazlı Erdem', 1995], ['pelin_ay', 'Pelin Ay', 1990], ['tugbaaa', 'Tuğba Polat', 1993],
    ['ceren_t', 'Ceren Tan', 2002], ['elifnur', 'Elif Nur Aydın', 1998], ['merveyk', 'Merve Yavuz', 1991],
    ['sedaa_d', 'Seda Doğan', 1989], ['ayca_ms', 'Ayça Mısır', 1996], ['beyza_ok', 'Beyza Okur', 2004],
    ['yagmur_c', 'Yağmur Cin', 2000], ['cansu_g', 'Cansu Güneş', 1994], ['rabia_t', 'Rabia Tekin', 1999],
    ['ilaydaa', 'İlayda Kurt', 2002], ['derya_bz', 'Derya Bozkurt', 1987], ['asli_ko', 'Aslı Koç', 1995],
    ['esra_sy', 'Esra Soylu', 1992], ['kubraa_', 'Kübra Aslan', 1997], ['nisa_ur', 'Nisa Uras', 2005],
    ['betul_h', 'Betül Hanım', 1990], ['sevval_i', 'Şevval İnce', 2001], ['hilal_b', 'Hilal Barış', 1998],
    ['damla_ky', 'Damla Kaya', 1993], ['gamze_c', 'Gamze Can', 1991], ['bilge_n', 'Bilge Nar', 1996],
    ['tuana_s', 'Tuana Sezer', 2003], ['ozlem_ds', 'Özlem Dursun', 1986], ['buse_ar', 'Buse Arslan', 2000],
    ['ipek_y', 'İpek Yalçın', 1999], ['selin_gl', 'Selin Gül', 1995], ['aylin_k', 'Aylin Kara', 1992],
    ['mert_sz', 'Mert Sözer', 1997],
]
export const PERSONAS = raw.map(([username, fullName, birthYear], i) => ({
    key: `p${i}`,
    username,
    fullName,
    birthYear,
    gender: username === 'mert_sz' ? 'male' : 'female',
}))
