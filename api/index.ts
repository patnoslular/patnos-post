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
  // Note: On Vercel, memory storage doesn't provide a URL. 
  // In a real app, you'd upload the buffer to Supabase Storage here.
  res.json({ message: 'File received in memory', size: req.file.size });
});

// Meta Tag Injection Logic
const injectMetaTags = async (html: string, req: express.Request) => {
  const url = req.path;
  const newsId = url.startsWith('/news/') ? url.split('/')[2] : null;
  
  let title = "The Patnos Post | Gerçeğin Peşinde, Geleceğin İzinde";
  let description = "Patnos ve çevresinden en güncel haberler, yaşam ve kültür içerikleri.";
  let image = "https://static.wixstatic.com/media/7e2174_e230755889444a418254ba8ec11e24f7~mv2.png";
  
  const appUrl = process.env.APP_URL || (req.headers.host ? `https://${req.headers.host}` : '');
  const fullUrl = `${appUrl}${req.originalUrl}`;

  if (newsId) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://luphjhodlrnnnnbmwzad.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: newsItem } = await supabase
          .from('news')
          .select('*')
          .eq('id', newsId)
          .single();

        if (newsItem) {
          title = `${newsItem.title?.tr || 'Haber'} | The Patnos Post`;
          description = newsItem.excerpt?.tr || (newsItem.content?.tr ? newsItem.content.tr.substring(0, 160) : description);
          image = newsItem.imageUrl || image;
        }
      }
    } catch (e) {
      console.error('[MetaTags] Error:', e);
    }
  }

  return html
    .replace(/__OG_TITLE__/g, title)
    .replace(/__OG_DESCRIPTION__/g, description)
    .replace(/__OG_IMAGE__/g, image)
    .replace(/__OG_URL__/g, fullUrl);
};

// Handle requests
app.get('*', async (req, res, next) => {
  // Skip API routes and static assets
  if (req.path.startsWith('/api/') || req.path.startsWith('/assets/')) return next();

  try {
    let template = '';
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;

    if (!isProd) {
      // Development mode
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
      });
      return vite.middlewares(req, res, async () => {
        template = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const html = await injectMetaTags(template, req);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      });
    } else {
      // Production mode (Vercel)
      const distPath = path.join(rootDir, 'dist');
      
      // Serve static assets from dist folder
      app.use('/assets', express.static(path.join(distPath, 'assets')));
      
      const indexPath = path.join(distPath, 'index.html');
      const fallbackPath = path.join(rootDir, 'index.html');
      
      let activePath = fs.existsSync(indexPath) ? indexPath : fallbackPath;
      
      // Vercel sometimes puts things in different places
      if (!fs.existsSync(activePath)) {
        console.log('[Server] Checking alternate paths...');
        const altPath = path.resolve(rootDir, 'index.html');
        if (fs.existsSync(altPath)) activePath = altPath;
      }

      if (!fs.existsSync(activePath)) {
        return res.status(404).send('Build files not found. Please ensure you ran "npm run build".');
      }

      template = fs.readFileSync(activePath, 'utf-8');
      try {
        const html = await injectMetaTags(template, req);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (metaError) {
        console.error('[MetaTags] Injection failed:', metaError);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      }
    }
  } catch (e) {
    console.error('[Server] Error:', e);
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
