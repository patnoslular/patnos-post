import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Language, UI_STRINGS } from '../constants';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

export const LoginModal = ({ onClose, onSuccess, lang }: LoginModalProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = UI_STRINGS[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('is_admin', 'true');
        onSuccess();
      } else {
        setError(lang === 'tr' ? 'Hatalı şifre.' : 'Şîfreya şaş.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(lang === 'tr' ? 'Giriş yapılamadı. Sunucu hatası.' : 'Têketin nehat kirin. Çewtiya serverê.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold flex items-center gap-2">
            <Lock size={20} className="text-brand-accent" /> {t.editorLogin}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6" autoComplete="off">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{t.editorPassword}</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                autoComplete="new-password"
                name="admin-password"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-accent outline-none transition-all pr-12"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-accent transition-colors"
                title={showPassword ? (lang === 'tr' ? "Şifreyi Gizle" : "Şîfreyê Veşêre") : (lang === 'tr' ? "Şifreyi Göster" : "Şîfreyê Nîşan Bide")}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white p-4 rounded-xl font-bold hover:bg-brand-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? (lang === 'tr' ? 'Giriş Yapılıyor...' : 'Têketin Tê Kirin...') : t.login}
          </button>
          
          <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">
            {t.onlyEditors}
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
};
