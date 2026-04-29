import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const rootDir = process.cwd();
const distPath = path.join(rootDir, 'dist');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Dinamik Meta Tag Enjeksiyonu
const injectMetaTags = async (html: string, req: express.Request) => {
  try {
    const urlPath = req.path;
    let lang = (req.query.lang as string) || 'tr';
    if (!['tr', 'ku'].includes(lang)) lang = 'tr';
    
    const parts = urlPath.split('/').filter(Boolean);
    let newsId = (parts[0] === 'news' && parts[1]) ? parts[1].split(/[?#]/)[0] : null;
    
    // Varsayılan değerler
    let title = lang === 'ku' ? "The Patnos Post | Di Peşiya Rastiyê De" : "The Patnos Post | Gerçeğin Peşinde";
    let description = lang === 'ku' ? "Haberên herî dawî ji Patnosê." : "Patnos'tan en güncel haberler.";
    let image = "https://patnos-post.vercel.app/og-image.jpg"; // Sitenizin genel bir görseli
    let locale = lang === 'ku' ? 'ku_TR' : 'tr_TR';
    
    const host = req.headers.host || 'patnos-post.vercel.app';
    const appUrl = `https://${host}`;
    const fullUrl = `${appUrl}${req.originalUrl}`;

    // Eğer bir haber detay sayfasıysa Supabase'den gerçek veriyi çek
    if (newsId) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://luphjhodlrnnnnbmwzad.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseKey && supabaseUrl) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: newsItem } = await supabase
          .from('news')
          .select('*')
          .eq('id', newsId)
          .single();

        if (newsItem) {
          const newsTitle = newsItem.title?.[lang] || newsItem.title?.tr || "Haber";
          const newsExcerpt = newsItem.excerpt?.[lang] || newsItem.excerpt?.tr || (newsItem.content?.[lang] || "").substring(0, 160);
          
          title = `${newsTitle}`;
          description = newsExcerpt;
          if (newsItem.imageUrl) image = newsItem.imageUrl;
        }
      }
    }

    const escapeHtml = (str: string) => str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return html
      .replace(/__OG_TITLE__/g, escapeHtml(title))
      .replace(/__OG_DESCRIPTION__/g, escapeHtml(description))
      .replace(/__OG_IMAGE__/g, escapeHtml(image))
      .replace(/__OG_URL__/g, escapeHtml(fullUrl))
      .replace(/__OG_LOCALE__/g, locale);
  } catch (error) {
    console.error('Meta hatası:', error);
    return html;
  }
};

// API Rotaları
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya yok' });
  res.json({ url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` });
});

// Sayfa İsteklerini Karşıla
app.get('*', async (req, res, next) => {
  // Statik dosyaları ve API'yi atla
  if (req.path.includes('.') || req.path.startsWith('/api/')) return next();
  
  try {
    const indexPath = isProd 
      ? path.resolve(distPath, 'index.html') 
      : path.resolve(rootDir, 'index.html');
    
    if (!fs.existsSync(indexPath)) return next();
    
    let template = fs.readFileSync(indexPath, 'utf-8');
    const html = await injectMetaTags(template, req);
    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (e) {
    next(e);
  }
});

// Statik Dosyalar (Üretim modunda)
if (isProd) {
  app.use(express.static(distPath));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});

export default app;
