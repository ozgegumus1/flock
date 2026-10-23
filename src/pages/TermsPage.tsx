import { Link } from 'react-router-dom'
import LegalPage, { CONTACT_EMAIL, List, Section } from '../components/LegalPage'

function TermsPage() {
    return (
        <LegalPage title="Kullanım Şartları">
            <Section title="1. Kabul ve yaş sınırı">
                <p>
                    Flock'a üye olarak ya da Flock'u kullanarak bu şartları kabul etmiş olursun. Flock'u
                    kullanabilmek için en az 18 yaşında olmalısın. Kişisel verilerinin nasıl işlendiği{' '}
                    <Link to="/gizlilik-politikasi" className="text-purple-400 hover:text-purple-300">
                        Gizlilik Politikası
                    </Link>
                    'nda anlatılır.
                </p>
            </Section>

            <Section title="2. Hesabın">
                <List
                    items={[
                        'Kayıt olurken doğru bilgi vermelisin.',
                        'Hesabının güvenliğinden sen sorumlusun. Şifreni kimseyle paylaşma.',
                        'Başkası gibi davranan ya da sahte hesap açmak yasaktır.',
                    ]}
                />
            </Section>

            <Section title="3. İçerik kuralları">
                <p>Flock, insanların birbirine güvenle soru sorabildiği bir yer olmalı. Bu yüzden şunlar yasaktır:</p>
                <List
                    items={[
                        'Hakaret, taciz, tehdit, nefret söylemi ve ayrımcılık',
                        'Başkasının kişisel bilgilerini (adres, telefon, fotoğraf vb.) izni olmadan paylaşmak',
                        'Cinsel içerik, şiddet içeren görüntüler ve yasa dışı içerikler',
                        'Spam, reklam amaçlı tekrarlayan paylaşımlar ve dolandırıcılık',
                        'Sahte indirimler ya da yanıltıcı bilgiler paylaşmak',
                        'Başkasının telif hakkını ihlal eden içerikler',
                        'Kendine ya da başkasına zarar vermeyi özendiren içerikler',
                    ]}
                />
            </Section>

            <Section title="4. Anonim sorular">
                <p>
                    Anonim sorular, kimliğini diğer kullanıcılardan gizlemen içindir; kuralları ihlal etme hakkı
                    vermez. Anonim bir içerik de bu şartlara tabidir. Kötüye kullanım durumunda site yöneticisi
                    yazarı tespit edebilir, hesabı kapatabilir ve gerekirse yetkili makamlarla paylaşabilir.
                </p>
            </Section>

            <Section title="5. Senin içeriğin">
                <p>
                    Paylaştığın soru, cevap ve fotoğrafların sorumluluğu sana aittir ve hakları sende kalır. Bunları
                    Flock'ta göstermemiz, saklamamız ve diğer kullanıcılara sunmamız için bize sınırlı, ücretsiz
                    bir kullanım izni vermiş olursun. İçeriğini sildiğinde bu izin sona erer.
                </p>
            </Section>

            <Section title="6. İndirimler ve dış bağlantılar">
                <p>
                    İndirim paylaşımları kullanıcılar tarafından eklenir. Fiyatın, stokun ve kampanyanın doğru
                    olduğunu garanti etmeyiz; satın almadan önce mağazanın sayfasını kontrol et. Mağaza
                    bağlantıları Flock'a ait değildir ve alışverişten Flock sorumlu değildir.
                </p>
            </Section>

            <Section title="7. Tavsiyeler profesyonel görüş değildir">
                <p>
                    Flock'taki cevaplar diğer kullanıcıların kişisel deneyimleri ve görüşleridir. Sağlık, hukuk,
                    finans gibi konulardaki paylaşımlar uzman tavsiyesinin yerine geçmez. Önemli kararlar için ilgili
                    bir uzmana danış.
                </p>
            </Section>

            <Section title="8. Moderasyon ve hesap kapatma">
                <p>
                    Kurallara aykırı içerikleri uyarı yapmadan kaldırma, hesapları geçici ya da kalıcı olarak
                    kapatma hakkımız saklıdır. Uygunsuz bir içerik görürsen ya da bir içeriğin kaldırılmasını
                    istiyorsan <strong className="text-ink">{CONTACT_EMAIL}</strong> adresine bildirebilirsin.
                    Hesabını istediğin zaman Ayarlar &gt; Hesabı sil bölümünden silebilirsin.
                </p>
            </Section>

            <Section title="9. Hizmetin kapsamı ve sorumluluk">
                <p>
                    Flock "olduğu gibi" sunulur. Hizmetin kesintisiz ve hatasız çalışacağını garanti etmeyiz.
                    Kullanıcıların paylaştığı içeriklerden dolayı Flock sorumlu tutulamaz; ancak bildirim aldığımızda
                    hukuka aykırı içerikleri makul sürede kaldırırız. Yasaların izin verdiği ölçüde, hizmetin
                    kullanımından doğan dolaylı zararlardan sorumlu değiliz.
                </p>
            </Section>

            <Section title="10. Değişiklikler ve uygulanacak hukuk">
                <p>
                    Bu şartları zaman zaman güncelleyebiliriz. Değişiklikten sonra Flock'u kullanmaya devam
                    etmen, güncel şartları kabul ettiğin anlamına gelir. Bu şartlar Türkiye Cumhuriyeti hukukuna
                    tabidir.
                </p>
            </Section>

            <Section title="11. İletişim">
                <p>
                    Sorular ve bildirimler için: <strong className="text-ink">{CONTACT_EMAIL}</strong>
                </p>
            </Section>
        </LegalPage>
    )
}

export default TermsPage
