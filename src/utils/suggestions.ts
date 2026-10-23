// Boş konu sayfalarında ve soru sorma ekranında gösterilen soru fikirleri.
export const QUESTION_SUGGESTIONS: Record<string, string[]> = {
    'bana-yakisir-mi': [
        'Düğüne bu kombinle gidersem fazla mı iddialı olur?',
        'Saçımı platin yapmayı düşünüyorum, cesaret edeyim mi?',
        'İş görüşmesine bu blazerla gidilir mi?',
    ],
    'kullandiniz-mi': [
        'Herkesin övdüğü o serum gerçekten işe yarıyor mu?',
        'Cilt bakımında yıllardır yaptığınız en büyük hata neydi?',
        'Pahalı olup da pişman olmadığınız bir ürün var mı?',
    ],
    'guvenilir-oneri': [
        'Kadın doğum doktoru ararken nelere bakmalıyım?',
        'Yalnız yaşayan biri olarak ev kiralarken hangi güvenlik önlemlerini önerirsiniz?',
        'Güvenilir bir kuaför nasıl bulunur?',
    ],
    'deneyim-paylasimi': [
        'Maaş pazarlığında yaptığınız en iyi hamle neydi?',
        'Hiç dolandırıldınız mı? Nasıl anladınız?',
        'Hayatınızı değiştiren küçük bir alışkanlık var mı?',
    ],
    'tasinma-ve-ev': [
        'Kira artışına itiraz edip sonuç alan oldu mu?',
        '30 metrekarede evi daha geniş göstermenin yolu var mı?',
        'Taşınırken en çok neye şaşırdınız?',
    ],
    'evlilik-hazirligi': [
        'Düğün bütçesinde "keşke bu kadar harcamasaydım" dediğiniz şey ne?',
        'Nişan ve düğünde en çok neye para harcamaya değer?',
        'Düğün hazırlığında sizi en çok yoran şey neydi?',
    ],
    'hamilelik-ve-bebek': [
        'Hamilelikte duyduğunuz en saçma tavsiye neydi?',
        'Bebek arabası alırken en çok neye dikkat etmeliyim?',
        'Bebek hazırlığında gereksiz çıkan en pahalı şey neydi?',
    ],
    'is-hayati': [
        'Toplantıda sözü sürekli kesilen biri ne yapmalı?',
        'İş değiştirmeden önce kimsenin sormadığı ama sorulması gereken soru nedir?',
        'Maaş zammı isterken nasıl bir yol izlediniz?',
    ],
    'universite-ve-egitim': [
        'Yüksek lisans yapmak gerçekten karşılığını veriyor mu?',
        'Üniversitede ilk yıl için yurt mu ev mi?',
        'Sınav kaygısıyla nasıl başa çıktınız?',
    ],
    'indirimler': [
        'Bu hafta gördüğünüz gerçekten iyi bir indirim var mı?',
    ],
}

export function getSuggestions(slug?: string | null): string[] {
    return QUESTION_SUGGESTIONS[slug ?? ''] ?? []
}