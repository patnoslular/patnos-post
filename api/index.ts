// api/index.ts - Tüm sunucu ve API mantığı
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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// API Rotaları (ÖNCE TANIMLANDI)
app.post('/api/login', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Şifre gerekli' });

    const adminPassword = 'Mihriban04';
    const trimmedInput = password.trim();
    
    if (trimmedInput === adminPassword) {
      return res.json({ success: true });
    }
    
    const envPassword = process.env.ADMIN_PASSWORD;
    if (envPassword && trimmedInput === envPassword.trim()) {
      return res.json({ success: true });
    }

    return res.status(401).json({ success: false, error: 'Hatalı şifre.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Sunucu hatası: ' + String(err) });
  }
});

// Resim Yükleme API
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya seçilmedi' });
  res.json({ 
    success: true, 
    url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
  });
});

// Vite ve Statik Dosya Yönetimi (SONRA TANIMLANDI)
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.use(express.static(distPath, { index: false }));
  }

  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.includes('.')) return next();
    try {
      const templatePath = !isProd ? path.resolve(rootDir, 'index.html') : path.resolve(distPath, 'index.html');
      let template = fs.readFileSync(templatePath, 'utf-8');
      if (!isProd) {
        const { createServer } = await import('vite');
        const v = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
        template = await v.transformIndexHtml(req.originalUrl, template);
      }
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) { next(e); }
  });

  app.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));
}

startServer();
export default app;
