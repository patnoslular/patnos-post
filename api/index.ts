import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

// Admin girişi için şifre kontrolü (Eğer backend taraflı şifre isterseniz burası kullanılabilir)
const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD || 'patnos04';

app.get('/api/check-password', (req, res) => {
  const { password } = req.query;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Haber detayları için Meta Tag üretici - SOSYAL MEDYA PAYLAŞIMI İÇİN KRİTİK
app.get(['/news/:id', '/news/:id/*'], (req, res) => {
  const filePath = path.resolve(__dirname, '../dist/index.html');
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading index.html');
    }

    const { id } = req.params;
    const lang = (req.query.lang as string) || 'tr';
    
    // Not: Normalde burada bir veritabanından (örneğin Firebase) haber verilerini çekmek gerekir.
    // Ancak istemci tarafında da çalıştığı için şimdilik temel bir yapı kuruyoruz.
    // Gerçek bir SEO iyileştirmesi için sunucu tarafında haberi çekip meta etiketlerini doldurmalıyız.
    
    const path = req.path;
    const parts = path.split('/').filter(Boolean);
    let newsId = (parts[0] === 'news' && parts[1]) ? parts[1].split(/[?#]/)[0] : null;
    
    let title = lang === 'ku' ? "The Patnos Post | Li pey rastiyê, li ser şopa pêşerojê" : "The Patnos Post | Gerçeğin Peşinde, Geleceğin İzinde";
    let description = lang === 'ku' ? "Nûçeyên herî dawî, naveroka jiyan û çandê ji Patnos û derdora wê." : "Patnos ve çevresinden en güncel haberler, yaşam ve kültür içerikleri.";
    let image = "https://static.wixstatic.com/media/7e2174_e230755889444a418254ba8ec11e24f7~mv2.png";
    let locale = lang === 'ku' ? 'ku_TR' : 'tr_TR';
    
    // Meta etiketlerini değiştir
    let result = data
      .replace(/<title>.*?<\/title>/g, `<title>${title}</title>`)
      .replace(/<meta name="description".*?>/g, `<meta name="description" content="${description}">`)
      .replace(/<meta property="og:title".*?>/g, `<meta property="og:title" content="${title}">`)
      .replace(/<meta property="og:description".*?>/g, `<meta property="og:description" content="${description}">`)
      .replace(/<meta property="og:image".*?>/g, `<meta property="og:image" content="${image}">`)
      .replace(/<meta property="og:url".*?>/g, `<meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}">`)
      .replace(/<meta property="og:locale".*?>/g, `<meta property="og:locale" content="${locale}">`);

    res.send(result);
  });
});

// Statik dosyaları servis et
app.use(express.static(path.join(__dirname, '../dist')));

// SPA rotası
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

export default app;
