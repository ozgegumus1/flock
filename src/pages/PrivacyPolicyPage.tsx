import LegalPage, { CONTACT_EMAIL, List, Section } from '../components/LegalPage'

function PrivacyPolicyPage() {
    return (
        <LegalPage title="Gizlilik Politikası">
            <Section title="1. Biz kimiz?">
                <p>
                    Flock, kadınların birbirine soru sorduğu, oy verdiği ve deneyim paylaştığı bir soru-cevap
                    platformudur (flocksocial.vercel.app). Bu politika, Flock'u kullanırken hangi kişisel
                    verilerin işlendiğini, neden işlendiğini ve haklarını açıklar. Her konuda bize{' '}
                    <strong className="text-ink">{CONTACT_EMAIL}</strong> adresinden ulaşabilirsin.
                </p>
            </Section>

            <Section title="2. Hangi bilgileri topluyoruz?">
                <List
                    items={[
                        <>
                            <strong className="text-ink">Hesap bilgileri:</strong> ad soyad, kullanıcı adı,
                            e-posta adresi, şifre, cinsiyet ve doğum yılı. Şifren şifrelenmiş olarak saklanır, biz
                            dahil kimse okuyamaz.
                        </>,
                        <>
                            <strong className="text-ink">Google ile giriş:</strong> Google ile giriş yaparsan
                            Google bize adını, e-posta adresini ve profil fotoğrafını iletir. Şifreni görmeyiz.
                        </>,
                        <>
                            <strong className="text-ink">Paylaştığın içerikler:</strong> sorular, cevaplar,
                            anket oyları, beğeniler, kaydettiklerin, yüklediğin fotoğraflar, profil fotoğrafı,
                            kapak fotoğrafı, biyografi ve özel mesajlar.
                        </>,
                        <>
                            <strong className="text-ink">Teknik bilgiler:</strong> giriş yaptığında tarayıcında
                            oturum bilgisi saklanır. Sitenin barındırıldığı hizmetler güvenlik ve çalışma amacıyla
                            IP adresi ve cihaz bilgisi gibi teknik kayıtlar tutabilir.
                        </>,
                    ]}
                />
            </Section>

            <Section title="3. Kimler neyi görür?">
                <p>
                    <strong className="text-ink">Herkese görünenler:</strong> kullanıcı adın, ad soyadın,
                    profil ve kapak fotoğrafın, biyografin, cinsiyetin (profil fotoğrafının etrafındaki ince renkli
                    halka olarak), sorduğun sorular ve yazdığın cevaplar. Cinsiyet bilgisini vermek istemiyorsan
                    "Belirtmek istemiyorum" seçeneğini seçebilirsin.
                </p>
                <p>
                    <strong className="text-ink">Kimseye gösterilmeyenler:</strong> e-posta adresin, şifren ve
                    doğum yılın diğer kullanıcılara gösterilmez. Özel mesajlarını yalnızca sen ve yazıştığın kişi
                    görebilir; mesajlar uçtan uca şifreli değildir, teknik olarak site yöneticisi veritabanına
                    erişebilir ve bunu yalnızca güvenlik, şikayet incelemesi ve yasal zorunluluk durumlarında
                    yapar.
                </p>
                <p>
                    <strong className="text-ink">Fotoğraflar:</strong> yüklediğin fotoğraflar herkese açık
                    bağlantılarla saklanır. Bağlantıyı bilen biri fotoğrafı görebilir. Kişisel ya da hassas
                    görüntüleri paylaşmamanı öneririz.
                </p>
            </Section>

            <Section title="4. Anonim sorular">
                <p>
                    Anonim bir soru sorduğunda adın ve profilin diğer kullanıcılara gösterilmez. Soruyu kimin
                    sorduğu, yalnızca soruyu soran kişinin ve site yöneticisinin erişebildiği ayrı bir kayıtta
                    tutulur. Bu kayıt; hakaret, tehdit, yasa dışı içerik gibi kötüye kullanım durumlarında
                    incelemek ve yetkili makamlar yasal olarak talep ederse paylaşmak için saklanır. Yani anonimlik
                    diğer kullanıcılara karşıdır, site yöneticisine ve yasal makamlara karşı değildir. Anonim
                    sorunun altına kendi hesabınla cevap yazarsan kimliğin anlaşılabilir.
                </p>
            </Section>

            <Section title="5. Verilerini ne için kullanıyoruz?">
                <List
                    items={[
                        'Hesabını oluşturmak ve giriş yapmanı sağlamak',
                        'Sorularını, cevaplarını, anketlerini ve profilini göstermek',
                        'Sana bildirim göndermek (beğeni, cevap, takip gibi)',
                        'Kötüye kullanımı, sahte hesapları ve spam içeriği önlemek, şikayetleri incelemek',
                        'Yasal yükümlülüklerimizi yerine getirmek',
                    ]}
                />
                <p>
                    Verilerini satmayız, reklam göstermek ya da seni profillemek için kullanmayız. Sitede reklam
                    veya takip (analitik) çerezi yoktur.
                </p>
            </Section>

            <Section title="6. Hizmet sağlayıcılar ve yurt dışına aktarım">
                <p>Flock'un çalışması için şu hizmetlerden yararlanıyoruz:</p>
                <List
                    items={[
                        'Supabase: veritabanı, giriş sistemi ve dosya depolama. Sunucular Güney Kore (Seul) bölgesindedir.',
                        'Vercel: sitenin yayınlanması (ABD merkezli).',
                        'Google: yalnızca "Google ile devam et" seçeneğini kullanırsan giriş doğrulaması için.',
                    ]}
                />
                <p>
                    Bu nedenle verilerin Türkiye dışındaki sunucularda işlenir. Flock'a üye olarak ve gizlilik
                    politikasını kabul ederek bu aktarıma onay vermiş olursun. Onayını, hesabını silerek
                    istediğin zaman geri çekebilirsin.
                </p>
            </Section>

            <Section title="7. Verilerini ne kadar saklıyoruz?">
                <p>
                    Verilerini hesabın açık olduğu sürece saklarız. Ayarlar &gt; Hesabı sil bölümünden hesabını
                    sildiğinde profilin, sorular, cevapların, mesajların ve diğer kayıtların silinir. Teknik
                    yedekler ve sunucu kayıtları kısa bir süre daha kalabilir.
                </p>
            </Section>

            <Section title="8. Haklarını nasıl kullanırsın?">
                <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında şu haklara sahipsin:</p>
                <List
                    items={[
                        'Verilerinin işlenip işlenmediğini öğrenme ve bilgi talep etme',
                        'Yanlış ya da eksik verilerin düzeltilmesini isteme',
                        'Verilerinin silinmesini ya da yok edilmesini isteme',
                        'İşlemeye itiraz etme ve zarara uğraman hâlinde tazminat talep etme',
                    ]}
                />
                <p>
                    Profil bilgilerini Ayarlar'dan düzenleyebilir ve hesabını silebilirsin. Diğer talepler için{' '}
                    <strong className="text-ink">{CONTACT_EMAIL}</strong> adresine yaz. Talebine en geç 30 gün
                    içinde dönüş yaparız.
                </p>
            </Section>

            <Section title="9. Güvenlik">
                <p>
                    Verilerini korumak için erişim kuralları ve şifrelenmiş bağlantı kullanıyoruz. Yine de
                    internette hiçbir sistemin yüzde yüz güvenli olduğu garanti edilemez. Şifreni kimseyle
                    paylaşmamanı ve hesabında şüpheli bir hareket görürsen bize yazmanı rica ederiz.
                </p>
            </Section>

            <Section title="10. Yaş sınırı">
                <p>
                    Flock yalnızca 18 yaşını doldurmuş kişiler içindir. 18 yaşından küçük olduğunu fark ettiğimiz
                    hesapları ve verilerini sileriz.
                </p>
            </Section>

            <Section title="11. Değişiklikler">
                <p>
                    Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikleri sitede duyururuz. Sayfanın
                    üstündeki "Son güncelleme" tarihinden en güncel sürümü takip edebilirsin.
                </p>
            </Section>
        </LegalPage>
    )
}

export default PrivacyPolicyPage
