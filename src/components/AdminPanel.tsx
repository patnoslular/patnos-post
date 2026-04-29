import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Edit2, Trash2, Save, Image as ImageIcon, 
  Video, Upload, Loader2, Languages, Import, 
  FileText, LogOut, Settings, Key, ArrowLeft
} from 'lucide-react';
import { NewsItem, CATEGORIES, Language, UI_STRINGS } from '../constants';
import { useNews } from '../hooks/useNews';
import { useSettings } from '../hooks/useSettings';
import { translateContent } from '../services/geminiService';

interface AdminPanelProps {
  onClose: () => void;
  onLogout: () => void;
  lang: Language;
}

export const AdminPanel = ({ onClose, onLogout, lang }: AdminPanelProps) => {
  const { news, addNews, editNews, removeNews } = useNews();
  const { settings, updateSettings } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'news' | 'settings'>('news');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<NewsItem>>({ status: 'published' });
  
  const [activeLangTab, setActiveLangTab] = useState<Language>('tr');
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [isAutoTranslating, setIsAutoTranslating] = useState<string | null>(null);
  
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('GEMINI_API_KEY_OVERRIDE') || '');
  
  const [importMode, setImportMode] = useState(false);
  const [importXml, setImportXml] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const leftHeaderInputRef = useRef<HTMLInputElement>(null);
  const rightHeaderInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  const t = UI_STRINGS[lang];

  const resetForm = () => {
    setFormData({ status: 'published' });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.title?.tr || !formData.category || !formData.imageUrl) {
      alert(lang === 'tr' ? 'Zorunlu alanları doldurun.' : 'Qadên mecbûrî dagirin.');
      return;
    }
    try {
      const itemToSave = { ...formData, updatedAt: new Date().toISOString() } as NewsItem;
      if (editingId) await editNews(editingId, itemToSave);
      else await addNews(itemToSave as Omit<NewsItem, 'id'>);
      resetForm();
    } catch (e) { alert('Hata oluştu'); }
  };

  const translateAll = async () => {
    const sourceLang = activeLangTab;
    const targetLang = activeLangTab === 'tr' ? 'ku' : 'tr';
    setIsTranslatingAll(true);
    try {
      const fields: ('title' | 'excerpt' | 'content')[] = ['title', 'excerpt', 'content'];
      for (const field of fields) {
        const text = (formData[field] as any)?.[sourceLang];
        if (text) {
          const trans = await translateContent(text, targetLang);
          setFormData(p => ({ ...p, [field]: { ...(p[field] || {}), [targetLang]: trans } as any }));
        }
      }
      setActiveLangTab(targetLang);
    } catch (e) { alert('Çeviri hatası'); }
    finally { setIsTranslatingAll(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">{t.adminPanel}</h2>
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button onClick={() => {setActiveTab('news'); setIsAdding(false);}} className={`px-4 py-1.5 rounded-md text-xs font-bold ${activeTab === 'news' ? 'bg-white shadow' : ''}`}>HABERLER</button>
              <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 rounded-md text-xs font-bold ${activeTab === 'settings' ? 'bg-white shadow' : ''}`}>AYARLAR</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowKeySettings(!showKeySettings)} className="p-2 text-amber-600"><Key size={20} /></button>
            <button onClick={onLogout} className="p-2 text-red-600"><LogOut size={20} /></button>
            <button onClick={onClose} className="p-2 text-gray-400"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'news' ? (
            isAdding ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <button onClick={resetForm} className="flex items-center gap-2 font-bold"><ArrowLeft size={18}/>Geri</button>
                  <button onClick={translateAll} disabled={isTranslatingAll} className="bg-brand-accent text-white px-4 py-2 rounded-lg font-bold flex gap-2">
                    {isTranslatingAll ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16}/>}
                    TÜMÜNÜ KÜRTÇEYE ÇEVİR
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                      <button onClick={() => setActiveLangTab('tr')} className={`px-4 py-1 rounded-md text-xs font-bold ${activeLangTab === 'tr' ? 'bg-white' : ''}`}>TÜRKÇE</button>
                      <button onClick={() => setActiveLangTab('ku')} className={`px-4 py-1 rounded-md text-xs font-bold ${activeLangTab === 'ku' ? 'bg-white' : ''}`}>KURDÎ</button>
                    </div>
                    <input type="text" value={formData.title?.[activeLangTab] || ''} onChange={e => setFormData({...formData, title: {...formData.title, [activeLangTab]: e.target.value} as any})} className="w-full p-3 border rounded-lg font-bold text-lg" placeholder="Başlık" />
                    <textarea value={formData.excerpt?.[activeLangTab] || ''} onChange={e => setFormData({...formData, excerpt: {...formData.excerpt, [activeLangTab]: e.target.value} as any})} className="w-full p-3 border rounded-lg h-24" placeholder="Özet" />
                    <textarea value={formData.content?.[activeLangTab] || ''} onChange={e => setFormData({...formData, content: {...formData.content, [activeLangTab]: e.target.value} as any})} className="w-full p-4 border rounded-lg h-96 font-serif" placeholder="Haber İçeriği" />
                  </div>
                  <div className="space-y-4">
                    <div onClick={() => mainFileInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer overflow-hidden">
                      {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <span>Görsel Yükle</span>}
                    </div>
                    <input type="file" ref={mainFileInputRef} onChange={e => {/* handleImageUpload logic */}} className="hidden" />
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border rounded-lg">
                      <option value="">Kategori Seçin</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c[lang]}</option>)}
                    </select>
                    <button onClick={handleSave} className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold text-lg">KAYDET</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Haber Listesi</h3>
                  <button onClick={() => setIsAdding(true)} className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold flex gap-2"><Plus/> HABER EKLE</button>
                </div>
                {news.map(item => (
                  <div key={item.id} className="p-3 border rounded-xl flex items-center gap-4">
                    <img src={item.imageUrl} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1 font-bold">{item.title?.[lang] || item.title?.tr}</div>
                    <div className="flex gap-2">
                       <button onClick={() => {setFormData(item); setEditingId(item.id); setIsAdding(true);}}><Edit2 size={18}/></button>
                       <button onClick={() => removeNews(item.id)} className="text-red-500"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="max-w-xl mx-auto p-6 border rounded-2xl">
              <h3 className="font-bold mb-4">Logo Ayarları</h3>
              {/* Logo Settings Inputs */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
