import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

dotenv.config();

const app = express();
app.use(express.json());

// Use memory storage for Vercel to avoid read-only filesystem errors
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const rootDir = process.cwd();

// Serve static assets from dist folder
const distPath = path.join(rootDir, 'dist');
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;

let vite: any;
async function getVite() {
  if (!isProd && !vite) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
  }
  return vite;
}

// Vite middleware for development
app.use(async (req, res, next) => {
  if (!isProd) {
    try {
      const v = await getVite();
      return v.middlewares(req, res, next);
    } catch (e) {
      console.error('[Vite] Middleware Error:', e);
    }
  }
  next();
});

// API Routes
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'Mihriban04';
  
  if (password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: 'File received in memory', size: req.file.size });
});

// Robots.txt for SEO and Social Media Bots
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send("User-agent: *\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\nUser-agent: Facebot\nAllow: /");
});

// Meta Tag Injection Logic
const injectMetaTags = async (html: string, req: express.Request) => {
  const path = req.path;
  // Improved ID extraction: handle /news/ID or /news/ID/ and remove any trailing junk
  const parts = path.split('/').filter(Boolean);
  let newsId = (parts[0] === 'news' && parts[1]) ? parts[1].split(/[?#]/)[0] : null;
  
  let title = "The Patnos Post | Gerçeğin Peşinde, Geleceğin İzinde";
  let description = "Patnos ve çevresinden en güncel haberler, yaşam ve kültür içerikleri.";
  let image = "https://static.wixstatic.com/media/7e2174_e230755889444a418254ba8ec11e24f7~mv2.png";
  
  const host = req.headers.host || 'patnos-post.vercel.app';
  const appUrl = `https://${host}`;
  const fullUrl = `${appUrl}${req.originalUrl}`;

  if (newsId) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://luphjhodlrnnnnbmwzad.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseKey && supabaseUrl) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: newsItem, error } = await supabase
          .from('news')
          .select('*')
          .eq('id', newsId)
          .single();

        if (newsItem && !error) {
          title = `${newsItem.title?.tr || newsItem.title || 'Haber'} | The Patnos Post`;
          description = newsItem.excerpt?.tr || newsItem.excerpt || (newsItem.content?.tr || newsItem.content || '').substring(0, 160) || description;
          
          if (newsItem.imageUrl) {
            image = newsItem.imageUrl.startsWith('http') 
              ? newsItem.imageUrl 
              : `${appUrl}${newsItem.imageUrl.startsWith('/') ? '' : '/'}${newsItem.imageUrl}`;
          }
        }
      }
    } catch (e) {
      console.error('[MetaTags] Error fetching news:', e);
    }
  }

  // Basic escaping for HTML attributes
  const escape = (str: string) => str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return html
    .replace(/__OG_TITLE__/g, escape(title))
    .replace(/__OG_DESCRIPTION__/g, escape(description))
    .replace(/__OG_IMAGE__/g, escape(image))
    .replace(/__OG_URL__/g, escape(fullUrl));
};

// Static assets for production
app.use('/assets', express.static(path.join(distPath, 'assets')));

// Handle requests
app.get('*', async (req, res, next) => {
  // Skip API and Robots
  if (req.path.startsWith('/api/') || req.path === '/robots.txt') return next();
  
  // Skip assets in production
  if (isProd && req.path.startsWith('/assets/')) return next();

  try {
    let template = '';
    if (!isProd) {
      const v = await getVite();
      template = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8');
      template = await v.transformIndexHtml(req.originalUrl, template);
    } else {
      // Use absolute paths for Vercel
      const indexPath = path.resolve(rootDir, 'dist', 'index.html');
      const fallbackPath = path.resolve(rootDir, 'index.html');
      let activePath = fs.existsSync(indexPath) ? indexPath : fallbackPath;
      
      if (!fs.existsSync(activePath)) {
        const altPath = path.resolve(rootDir, 'index.html');
        if (fs.existsSync(altPath)) activePath = altPath;
      }

      if (!fs.existsSync(activePath)) {
        console.error('[Server] Template not found at:', activePath);
        return res.status(404).send('Build files not found.');
      }
      template = fs.readFileSync(activePath, 'utf-8');
    }

    const html = await injectMetaTags(template, req);
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);

  } catch (e) {
    console.error('[Server] Error:', e);
    if (!isProd && vite) {
      vite.ssrFixStacktrace(e as Error);
    }
    res.status(500).send('Internal Server Error');
  }
});

// Export the app for Vercel
export default app;

// Local development listening
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
