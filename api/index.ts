import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/login', (req, res) => {
    const { password } = req.body;
    
    // Admin şifresini ortam değişkeninden al, yoksa varsayılanı kullan
    const rawAdminPassword = process.env.ADMIN_PASSWORD;
    const adminPassword = (rawAdminPassword && rawAdminPassword.trim()) || 'Mihriban04';
    
    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      // Hangi şifrenin beklendiğini loglayarak sorunu görmemizi sağlar
      console.log(`[Giriş Hatası] Girilen: "${password}", Beklenen: "${adminPassword}"`);
      res.status(401).json({ success: false, error: 'Geçersiz şifre' });
    }
  });

  // Geliştirme ortamında Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production (Vercel vb.) ortamında statik dosyaları sun
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu http://0.0.0.0:${PORT} adresinde çalışıyor`);
  });
}

startServer();
