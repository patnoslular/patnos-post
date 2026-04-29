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

const injectMetaTags = async (html: string, req: express.Request) => {
  let title = "The Patnos Post | Gerçeğin Peşinde, Geleceğin İzinde";
  let description = "Patnos ve çevresinden en güncel haberler, yaşam ve kültür içerikleri.";
  let image = "https://static.wixstatic.com/media/7e2174_e230755889444a418254ba8ec11e24f7~mv2.png";
  let locale = 'tr_TR';
  
  const host = req.headers.host || 'patnos-post.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;
  const fullUrl = `${appUrl}${req.originalUrl}`;

  try {
    const path = req.path;
    let lang = (req.query.lang as string) || 'tr';
    const parts = path.split('/').filter(Boolean);
    let newsId = (parts[0] === 'news' && parts[1]) ? parts[1].split(/[?#]/)[0] : null;
    
    if (lang === 'ku') {
      title = "The Patnos Post | Li pey rastiyê, li ser şopa pêşerojê";
      description = "Nûçeyên herî dawî, naveroka jiyan û çandê ji Patnos û derdora wê.";
      locale = 'ku_TR';
    }

    if (newsId) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://luphjhodlrnnnnbmwzad.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseKey && supabaseUrl) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: newsItem } = await supabase.from('news').select('*').eq('id', newsId).single();

        if (newsItem) {
          const newsTitle = newsItem.title?.[lang] || newsItem.title?.tr || 'Haber';
          const newsExcerpt = newsItem.excerpt?.[lang] || newsItem.excerpt?.tr || (newsItem.content?.[lang] || '').substring(0, 160);
          title = `${newsTitle} | The Patnos Post`;
          description = newsExcerpt;
          if (newsItem.imageUrl) image = newsItem.imageUrl;
        }
      }
    }
  } catch (error) { console.error('MetaTags error:', error); }

  const escape = (str: string) => str?.replace(/"/g, '&quot;') || "";
  return html
    .replace(/__OG_TITLE__/g, escape(title))
    .replace(/__OG_DESCRIPTION__/g, escape(description))
    .replace(/__OG_IMAGE__/g, escape(image))
    .replace(/__OG_URL__/g, escape(fullUrl))
    .replace(/__OG_LOCALE__/g, locale);
};

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'Mihriban04';
  if (password === adminPassword) return res.json({ success: true });
  return res.status(401).json({ success: false });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ success: true, url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` });
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        let template = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const html = await injectMetaTags(template, req);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) { next(e); }
    });
  } else {
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res, next) => {
      try {
        const template = fs.readFileSync(path.resolve(distPath, 'index.html'), 'utf-8');
        const html = await injectMetaTags(template, req);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) { next(e); }
    });
  }
  app.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));
}

startServer();
export default app;
