import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Edit2, Trash2, Save, Image as ImageIcon, 
  Video, Upload, Loader2, Languages, Import, 
  LogOut, Settings, Key, ArrowLeft, Globe
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
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    title: { tr: '', ku: '' },
    excerpt: { tr: '', ku: '' },
    content: { tr: '', ku: '' },
    status: 'published',
    category: 'general'
  });
  
  const [activeLangTab, setActiveLangTab] = useState<Language>('tr');
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [isAutoTranslating, setIsAutoTranslating] = useState<string | null>(null);
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('GEMINI_API_KEY_OVERRIDE') || '');

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const leftHeaderInputRef = useRef<HTMLInputElement>(null);
  const rightHeaderInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  const t = UI_STRINGS[lang];

  const resetForm = () => {
    setFormData({
      title: { tr: '', ku: '' },
      excerpt: { tr: '', ku: '' },
      content: { tr: '', ku: '' },
      status: 'published',
      category: 'general'
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const startEditing = (item: NewsItem) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.title?.tr || !formData.imageUrl) {
      alert('Lütfen başlık ve ana görseli doldurun.');
      return;
    }

    const itemToSave = {
      ...formData,
      status: formData.status || 'published',
      updatedAt: new Date().toISOString(),
      date: formData.date || new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    } as NewsItem;

    if (editingId) {
      await editNews(editingId, itemToSave);
    } else {
      await addNews(itemToSave as Omit<NewsItem, 'id'>);
    }
    resetForm();
  };

  const autoTranslateField = async (field: 'title' | 'excerpt' | 'content') => {
    const sourceLang: Language = activeLangTab === 'tr' ? 'tr' : 'ku';
    const targetLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    const sourceText = (formData[field] as any)?.[sourceLang];

    if (!sourceText) return;
    setIsAutoTranslating(field);
    try {
      const translated = await translateContent(sourceText, targetLang);
      setFormData(prev => ({
        ...prev,
        [field]: { ...(prev[field] || {}), [targetLang]: translated } as any
      }));
    } catch (e) {
      alert('Çeviri hatası');
    } finally {
      setIsAutoTranslating(null);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'main' | 'header-left' | 'header-right') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
      const data = await response.json();
      
      if (target === 'main') setFormData(prev => ({ ...prev, imageUrl: data.url }));
      else {
        const field = target === 'header-left' ? 'leftImageUrl' : 'rightImageUrl';
        updateSettings({ ...settings, [field]: data.url });
      }
    } catch (e) {
      alert('Yükleme hatası');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <div className="bg-white w-full max-w-6xl h-full md:h-[90vh] md:rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <Settings size={20} className="text-blue-600" />
              {t.adminPanel}
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button onClick={() => {setActiveTab('news'); setIsAdding(false);}} className={`px-4 py-1.5 rounded-md text-xs font-bold ${activeTab === 'news' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>HABERLER</button>
              <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 rounded-md text-xs font-bold ${activeTab === 'settings' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>AYARLAR</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowKeySettings(!showKeySettings)} className="p-2 text-gray-400 hover:text-blue-600"><Key size={18} /></button>
            <button onClick={onLogout} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-xs font-bold">ÇIKIŞ</button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={24} /></button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          <AnimatePresence mode="wait">
            {showKeySettings && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-6 overflow-hidden">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex gap-4">
                  <input type="password" value={manualApiKey} onChange={e => setManualApiKey(e.target.value)} placeholder="Gemini API Key..." className="flex-1 px-4 py-2 rounded-lg border focus:ring-2" />
                  <button onClick={() => {localStorage.setItem('GEMINI_API_KEY_OVERRIDE', manualApiKey); setShowKeySettings(false);}} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Kaydet</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'news' ? (
              isAdding ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl border shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <button onClick={resetForm} className="text-gray-500 flex items-center gap-1 font-bold"><ArrowLeft size={18} /> Geri</button>
                    <div className="flex gap-2">
                      <button onClick={() => setActiveLangTab('tr')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeLangTab === 'tr' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>TÜRKÇE</button>
                      <button onClick={() => setActiveLangTab('ku')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeLangTab === 'ku' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>KURDÎ</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-gray-400 uppercase">Haber Başlığı</label>
                      <button onClick={() => autoTranslateField('title')} className="text-blue-600 text-[10px] font-bold">AI ÇEVİR</button>
                    </div>
                    <input value={formData.title?.[activeLangTab] || ''} onChange={e => setFormData({...formData, title: {...formData.title, [activeLangTab]: e.target.value} as any})} className="w-full text-xl font-bold border-b pb-2 outline-none focus:border-blue-600" placeholder="Başlık..." />
                    
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-gray-400 uppercase">Kısa Özet</label>
                      <button onClick={() => autoTranslateField('excerpt')} className="text-blue-600 text-[10px] font-bold">AI ÇEVİR</button>
                    </div>
                    <textarea value={formData.excerpt?.[activeLangTab] || ''} onChange={e => setFormData({...formData, excerpt: {...formData.excerpt, [activeLangTab]: e.target.value} as any})} className="w-full h-20 p-3 bg-gray-50 rounded-lg outline-none text-sm" placeholder="Özet..." />

                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-gray-400 uppercase">İçerik</label>
                      <button onClick={() => autoTranslateField('content')} className="text-blue-600 text-[10px] font-bold">AI ÇEVİR</button>
                    </div>
                    <textarea value={formData.content?.[activeLangTab] || ''} onChange={e => setFormData({...formData, content: {...formData.content, [activeLangTab]: e.target.value} as any})} className="w-full h-96 p-4 bg-gray-50 rounded-lg outline-none text-base leading-relaxed" placeholder="Haber detayı..." />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      <div>
                        <label className="text-xs font-bold text-gray-400 mb-2 block">ANA GÖRSEL</label>
                        <div onClick={() => mainFileInputRef.current?.click()} className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed">
                          {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <Upload className="text-gray-300" />}
                        </div>
                        <input type="file" ref={mainFileInputRef} onChange={e => handleImageUpload(e, 'main')} className="hidden" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400">AYARLAR</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 rounded-lg border font-bold">
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.tr}</option>)}
                        </select>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button onClick={() => setFormData({...formData, status: 'published'})} className={`flex-1 py-3 rounded-lg text-xs font-bold ${formData.status !== 'draft' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>YAYINLA</button>
                          <button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 py-3 rounded-lg text-xs font-bold ${formData.status === 'draft' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>TASLAK</button>
                        </div>
                        <button onClick={handleSave} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:brightness-110 transition-all">HABERİ KAYDET</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Haber Listesi</h3>
                    <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-md"><Plus size={18} /> YENİ EKLE</button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {news.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border flex items-center gap-4 hover:shadow-md transition-all">
                        <img src={item.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-blue-600 mb-1">{item.date}</p>
                          <h4 className="font-bold line-clamp-1">{item.title.tr}</h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded ${item.status === 'draft' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{item.status === 'draft' ? 'TASLAK' : 'YAYINDA'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEditing(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                          <button onClick={() => confirm('Silinsin mi?') && removeNews(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border space-y-8">
                <h3 className="text-xl font-bold flex items-center gap-2"><ImageIcon className="text-blue-600" /> Header Logoları</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400">SOL LOGO</label>
                    <div onClick={() => leftHeaderInputRef.current?.click()} className="aspect-video bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer overflow-hidden p-4">
                      {settings.leftImageUrl ? <img src={settings.leftImageUrl} className="max-w-full max-h-full object-contain" /> : <Plus />}
                    </div>
                    <input type="file" ref={leftHeaderInputRef} onChange={e => handleImageUpload(e, 'header-left')} className="hidden" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400">SAĞ LOGO</label>
                    <div onClick={() => rightHeaderInputRef.current?.click()} className="aspect-video bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer overflow-hidden p-4">
                      {settings.rightImageUrl ? <img src={settings.rightImageUrl} className="max-w-full max-h-full object-contain" /> : <Plus />}
                    </div>
                    <input type="file" ref={rightHeaderInputRef} onChange={e => handleImageUpload(e, 'header-right')} className="hidden" />
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
