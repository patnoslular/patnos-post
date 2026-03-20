import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Save, ExternalLink, AlertCircle } from 'lucide-react';

interface SupabaseSetupProps {
  onComplete: () => void;
}

export const SupabaseSetup: React.FC<SupabaseSetupProps> = ({ onComplete }) => {
  const [url, setUrl] = useState(localStorage.getItem('VITE_SUPABASE_URL') || '');
  const [anonKey, setAnonKey] = useState(localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '');
  const [serviceKey, setServiceKey] = useState(localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY') || '');

  const handleSave = () => {
    if (!url || !anonKey) {
      alert('Lütfen en azından URL ve Anon Key alanlarını doldurun.');
      return;
    }

    localStorage.setItem('VITE_SUPABASE_URL', url.trim());
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', anonKey.trim());
    localStorage.setItem('SUPABASE_SERVICE_ROLE_KEY', serviceKey.trim());
    
    // Sayfayı yenileyerek yeni ayarların devreye girmesini sağlayalım
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-brand-primary flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-primary">Supabase Kurulumu</h2>
            <p className="text-xs text-gray-500">Lütfen bağlantı bilgilerini giriniz</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 flex justify-between">
              Project URL
              <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" className="text-brand-accent flex items-center gap-1 hover:underline">
                Bul <ExternalLink size={10} />
              </a>
            </label>
            <input 
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-brand-accent transition-colors text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">API Key (anon public)</label>
            <input 
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJ..."
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-brand-accent transition-colors text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Service Role Key (secret)</label>
            <input 
              type="password"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="eyJ..."
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-brand-accent transition-colors text-sm"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg flex gap-3 border border-amber-100">
            <AlertCircle className="text-amber-500 shrink-0" size={18} />
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Bu bilgiler tarayıcınızda güvenle saklanır. Görsel yükleme hatasını çözmek için <b>Service Role Key</b> gereklidir.
            </p>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
          >
            <Save size={18} />
            AYARLARI KAYDET VE BAŞLAT
          </button>
        </div>
      </motion.div>
    </div>
  );
};
