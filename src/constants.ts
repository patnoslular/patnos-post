export type Language = 'tr' | 'ku';

export interface NewsItem {
  id: string;
  title: {
    tr: string;
    ku: string;
  };
  excerpt: {
    tr: string;
    ku: string;
  };
  content: {
    tr: string;
    ku: string;
  };
  category: string; // We'll map categories in the UI
  author: string;
  date: string;
  imageUrl: string;
  readTime: string;
}

export interface HeaderSettings {
  leftImageUrl: string;
  rightImageUrl: string;
}

export const MENU_LINKS = [
  { label: 'ANASAYFA', url: 'https://www.patnosum.com/' },
  { label: 'DERNEĞİMİZ', url: 'https://www.patnosum.com/derne%C4%9Fi-mi-z' },
  { label: 'DERGİLERİMİZ', url: 'https://www.patnosum.com/dergi-leri-mi-z' },
  { label: 'PROJELERİMİZ', url: 'https://www.patnosum.com/projeleri%CC%87mi%CC%87z' },
  { label: 'HABERLER', url: 'https://www.patnosum.com/blog' },
  { label: 'SÜPHAN TV', url: 'https://www.patnosum.com/blog' },
];

export const CATEGORIES = [
  { id: 'all', tr: 'Tüm Haberler', ku: 'Hemû Nûçe' },
  { id: 'association', tr: 'Dernek Haberleri', ku: 'Nûçeyên Komeleyê' },
  { id: 'patnos', tr: 'Patnos Haberleri', ku: 'Nûçeyên Panosê' },
  { id: 'general', tr: 'Genel Haberler', ku: 'Nûçeyên Giştî' },
  { id: 'life-culture', tr: 'Yaşam ve Kültür', ku: 'Jiyan û Çand' }
];

export const UI_STRINGS = {
  tr: {
    editorLogin: 'EDİTÖR GİRİŞİ',
    panel: 'PANEL',
    logout: 'ÇIKIŞ',
    loading: 'Yükleniyor...',
    popularNews: 'Popüler Haberler',
    latestNews: 'Son Haberler',
    seeAll: 'Tümünü Gör',
    newsletterTitle: 'Gündemi Kaçırmayın',
    newsletterDesc: 'En önemli haberler ve özel analizler her sabah e-posta kutunuza gelsin.',
    newsletterPlaceholder: 'E-posta adresiniz',
    subscribe: 'ABONE OL',
    aboutUs: 'Hakkımızda',
    aboutUsDesc: '2026 yılından beri bağımsız gazetecilik ilkeleriyle, dünyadaki gelişmeleri en doğru ve tarafsız şekilde okuyucularımıza ulaştırıyoruz.',
    corporate: 'Kurumsal',
    imprint: 'Künye',
    contact: 'İletişim',
    ads: 'Reklam',
    socialMedia: 'Sosyal Medya',
    rights: '© 2026 THE PATNOS POST. TÜM HAKLARI SAKLIDIR.',
    adminPanel: "Yönetim Paneli",
    mainImage: "Ana Görsel",
    newsList: "Haber Listesi",
    privacy: 'GİZLİLİK POLİTİKASI',
    terms: 'KULLANIM ŞARTLARI',
    editorPassword: 'Editör Şifresi',
    login: 'Giriş Yap',
    onlyEditors: 'Sadece yetkili editörler erişebilir',
    addNews: 'Yeni Haber Ekle',
    editNews: 'Haberi Düzenle',
    title: 'Başlık',
    excerpt: 'Özet',
    content: 'İçerik',
    category: 'Kategori',
    imageUrl: 'Görsel URL',
    author: 'Yazar',
    readTime: 'Okuma Süresi',
    save: 'Kaydet',
    cancel: 'İptal',
    deleteConfirm: 'Bu haberi silmek istediğinize emin misiniz?',
    turkish: 'Türkçe',
    kurdish: 'Kurdî',
    translating: 'Çevriliyor...',
    breakingNews: 'SON DAKİKA',
    share: 'Paylaş:',
    shareNews: 'Haberi Paylaş',
    pages: 'Sayfalar',
    associationNews: 'Dernek Haberleri',
    patnosNews: 'Patnos Haberleri',
    generalNews: 'Genel Haberler',
    lifeCulture: 'Yaşam ve Kültür'
  },
  ku: {
    editorLogin: 'KETINA EDÎTOR',
    panel: 'PANEL',
    logout: 'DERKETIN',
    loading: 'Tê barkirin...',
    popularNews: 'Nûçeyên Populer',
    latestNews: 'Nûçeyên Dawî',
    seeAll: 'Hemûyan Bibîne',
    newsletterTitle: 'Rojevê Ji Dest Nedin',
    newsletterDesc: 'Bila nûçeyên herî girîng û analîzên taybet her sibê werin qutiya e-postaya we.',
    newsletterPlaceholder: 'Navnîşana e-postaya we',
    subscribe: 'BIBE ABONE',
    aboutUs: 'Derbarê Me De',
    aboutUsDesc: 'Ji sala 2026-an vir ve bi prensîbên rojnamegeriya serbixwe, em geşedanên li cîhanê bi awayê herî rast û bêalî digihînin xwendevanên xwe.',
    corporate: 'Sazî',
    imprint: 'Kunya',
    contact: 'Têkilî',
    ads: 'Reklam',
    socialMedia: 'Medyaya Civakî',
    rights: '© 2026 THE PATNOS POST. HEMÛ MAF PARASTÎ NE.',
    adminPanel: "Panela Rêveberiyê",
    mainImage: "Wêneya Sereke",
    newsList: "Lîsteya Nûçeyan",
    privacy: 'POLÎTÎKAYA VEŞARTÎBÛNÊ',
    terms: 'ŞERTÊN KARANÎNÊ',
    editorPassword: 'Şîfreya Edîtor',
    login: 'Têkeve',
    onlyEditors: 'Tenê edîtorên rayedar dikarin bigihîjinê',
    addNews: 'Nûçeya Nû Zêde Bike',
    editNews: 'Nûçeyê Sererast Bike',
    title: 'Sernav',
    excerpt: 'Kurtasî',
    content: 'Naverok',
    category: 'Kategorî',
    imageUrl: 'URL-ya Wêne',
    author: 'Nivîskar',
    readTime: 'Dema Xwendinê',
    save: 'Tomar Bike',
    cancel: 'Betal Bike',
    deleteConfirm: 'Ma hûn bawer in ku hûn dixwazin vê nûçeyê jê bibin?',
    turkish: 'Tirkî',
    kurdish: 'Kurdî',
    translating: 'Tê wergerandin...',
    breakingNews: 'NÛÇEYA DAWÎ',
    share: 'Parve bike:',
    shareNews: 'Nûçeyê Parve Bike',
    pages: 'Rûpel',
    associationNews: 'Nûçeyên Komeleyê',
    patnosNews: 'Nûçeyên Panosê',
    generalNews: 'Nûçeyên Giştî',
    lifeCulture: 'Jiyan û Çand'
  }
};

export const NEWS_DATA: NewsItem[] = [
  {
    id: '1',
    title: {
      tr: 'Patnos Derneği Yeni Projesini Açıkladı',
      ku: 'Komeleya Panosê Projeya Xwe Ya Nû Eşkere Kir'
    },
    excerpt: {
      tr: 'Patnos Yardımlaşma ve Dayanışma Derneği, eğitim alanında büyük bir burs seferberliği başlatıyor.',
      ku: 'Komeleya Alîkarî û Piştevaniya Panosê, di warê perwerdehiyê de seferberiyeke mezin a bûrsê dide destpêkirin.'
    },
    content: {
      tr: 'Dernek binasında yapılan basın açıklamasında, bu yıl 500 öğrenciye burs verileceği duyuruldu...',
      ku: 'Di daxuyaniya çapemeniyê ya ku li avahiya komeleyê hat dayîn de, hat ragihandin ku îsal dê ji bo 500 xwendekaran bûrs were dayîn...'
    },
    category: 'association',
    author: 'Ahmet Yılmaz',
    date: '14 Mart 2026',
    imageUrl: 'https://picsum.photos/seed/patnos1/800/600',
    readTime: '5 dk'
  },
  {
    id: '2',
    title: {
      tr: 'Patnos\'ta Bahar Hazırlıkları Başladı',
      ku: 'Li Panosê Amadekariyên Biharê Dest Pê Kirin'
    },
    excerpt: {
      tr: 'Patnos Belediyesi, bahar aylarının gelmesiyle birlikte çevre düzenleme çalışmalarına hız verdi.',
      ku: 'Şaredariya Panosê, bi hatina mehên biharê re xebatên sererastkirina hawirdorê lezand.'
    },
    content: {
      tr: 'Şehrin dört bir yanında çiçeklendirme ve park yenileme çalışmaları devam ediyor...',
      ku: 'Li her çar aliyên bajêr xebatên kulîlkandin û nûkirina parkan berdewam dikin...'
    },
    category: 'patnos',
    author: 'Elif Kaya',
    date: '13 Mart 2026',
    imageUrl: 'https://picsum.photos/seed/patnos2/800/600',
    readTime: '4 dk'
  }
];
