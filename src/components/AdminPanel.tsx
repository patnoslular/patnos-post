import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Edit2, Trash2, Save, Image as ImageIcon, Video, Upload, Loader2, Languages, Import, FileText, LogOut, Settings, Key } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<NewsItem>>({ status: 'published' });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const leftHeaderInputRef = useRef<HTMLInputElement>(null);
  const rightHeaderInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const [activeLangTab, setActiveLangTab] = useState<Language>('tr');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isAutoTranslating, setIsAutoTranslating] = useState<string | null>(null);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importXml, setImportXml] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('GEMINI_API_KEY_OVERRIDE') || '');
  const [showKeySettings, setShowKeySettings] = useState(false);

  const saveManualKey = () => {
    localStorage.setItem('GEMINI_API_KEY_OVERRIDE', manualApiKey);
    alert('API Anahtarı kaydedildi.');
    setShowKeySettings(false);
  };

  const autoTranslateField = async (field: 'title' | 'excerpt' | 'content') => {
    const sourceLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    const targetLang: Language = activeLangTab;
    const sourceText = (formData[field] as any)?.[sourceLang];

    if (!sourceText) {
      alert(lang === 'tr' ? 'Önce diğer dildeki alanı doldurun.' : 'Berê qada bi zimanê din dagirin.');
      return;
    }

    setIsAutoTranslating(field);
    try {
      const translated = await translateContent(sourceText, targetLang);
      setFormData(prev => ({
        ...prev,
        [field]: { ...prev[field], [targetLang]: translated } as any
      }));
    } catch (error) {
      console.error("Auto-translate error:", error);
      alert('Sistem şu an çeviri yapamıyor. Lütfen daha sonra deneyin.');
    } finally {
      setIsAutoTranslating(null);
    }
  };

  const translateAll = async () => {
    const sourceLang = activeLangTab;
    const targetLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    
    const fields: ('title' | 'excerpt' | 'content')[] = ['title', 'excerpt', 'content'];
    setIsTranslatingAll(true);
    try {
      setActiveLangTab(targetLang);
      for (const field of fields) {
        const text = (formData[field] as any)?.[sourceLang];
        if (!text) continue;
        
        try {
          const translated = await translateContent(text, targetLang);
          setFormData(prev => ({
            ...prev,
            [field]: { ...(prev[field] || {}), [targetLang]: translated } as any
          }));
        } catch (e) {
          setFormData(prev => ({
            ...prev,
            [field]: { ...(prev[field] || {}), [targetLang]: text } as any
          }));
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const handleWixImport = async () => {
    if (!importXml.trim()) return;
    setIsImporting(true);
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(importXml, "text/xml");
      const items = Array.from(xmlDoc.querySelectorAll("item"));
      for (const item of items) {
        const titleTr = item.querySelector("title")?.textContent?.trim() || "";
        const descriptionTr = item.querySelector("description")?.textContent?.trim() || "";
        const imageUrl = item.querySelector("enclosure")?.getAttribute("url") || "https://picsum.photos/800/600";

        const titleKu = await translateContent(titleTr, 'ku');
        const newsItem: Omit<NewsItem, 'id'> = {
          title: { tr: titleTr, ku: titleKu },
          excerpt: { tr: descriptionTr.substring(0, 200), ku: titleKu },
          content: { tr: descriptionTr, ku: titleKu },
          category: 'general',
          author: 'Wix Import',
          date: new Date().toLocaleDateString('tr-TR'),
          imageUrl: imageUrl,
          readTime: '3 DEQ',
          status: 'published'
        };
        await addNews(newsItem);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      setImportMode(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'main' | 'content' | 'header-left' | 'header-right') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(20);
    try {
      const fr = new FileReader();
      fr.onload = async () => {
        const url = fr.result as string; 
        if (target === 'header-left' || target === 'header-right') {
          await updateSettings({ ...settings, [target === 'header-left' ? 'leftImageUrl' : 'rightImageUrl']: url });
        } else if (target === 'main') {
          setFormData(prev => ({ ...prev, imageUrl: url }));
        } else {
          const tag = `\n\n[IMAGE:${url}]\n\n`;
          setFormData(prev => ({ ...prev, content: { ...prev.content, [activeLangTab]: (prev.content?.[activeLangTab] || '') + tag } as any }));
        }
        setIsUploading(false);
        setUploadProgress(100);
      };
      fr.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title?.tr || !formData.category || !formData.imageUrl) {
      alert('Lütfen zorunlu alanları doldurun.');
      return;
    }
    const itemToSave = {
      ...formData,
      status: formData.status || 'published',
      date: new Date().toLocaleDateString('tr-TR'),
      updatedAt: new Date().toISOString()
    } as NewsItem;

    if (editingId) {
      await editNews(editingId, itemToSave);
    } else {
      await addNews(itemToSave as Omit<NewsItem, 'id'>);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ status: 'published' });
    setEditingId(null);
    setIsAdding(false);
  };

  const startEditing = (item: NewsItem) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.deleteConfirm)) await removeNews(id);
  };

  const renderNewsContent = () => {
    if (isTranslatingAll) return (
      <div className="flex flex-col items-center justify-center h-full py-20"><Loader2 className="animate-spin text-brand-primary" size={64}/></div>
    );
    if (importMode) return (
      <div className="max-w-4xl mx-auto space-y-6">
        <textarea value={importXml} onChange={e => setImportXml(e.target.value)} className="w-full h-80 p-6 border rounded-3xl" placeholder="XML..."/>
        <button onClick={handleWixImport} className="w-full bg-brand-accent text-white py-4 rounded-2xl font-bold">IMPORT</button>
      </div>
    );
    if (isAdding) return (
      <div className="max-w-5xl mx-auto space-y-8 pb-24">
        <div className="flex justify-between items-center bg-gray-50 p-6 rounded-3xl">
          <h3 className="text-2xl font-black">{editingId ? t.editNews : t.addNews}</h3>
          <div className="flex gap-4">
            <button onClick={translateAll} className="bg-brand-accent text-white px-6 py-2 rounded-xl text-xs font-bold">AI ÇEVİR</button>
            <div className="flex bg-white p-1 rounded-xl">
              <button onClick={() => setActiveLangTab('tr')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeLangTab === 'tr' ? 'bg-brand-primary text-white' : 'text-gray-400'}`}>TR</button>
              <button onClick={() => setActiveLangTab('ku')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeLangTab === 'ku' ? 'bg-brand-primary text-white' : 'text-gray-400'}`}>KU</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <input value={formData.title?.[activeLangTab] || ''} onChange={e => setFormData({...formData, title: {...formData.title, [activeLangTab]: e.target.value} as any})} className="w-full p-6 text-2xl font-bold border rounded-3xl" placeholder="Başlık / Sernav"/>
            <textarea value={formData.excerpt?.[activeLangTab] || ''} onChange={e => setFormData({...formData, excerpt: {...formData.excerpt, [activeLangTab]: e.target.value} as any})} className="w-full p-6 h-32 border rounded-3xl" placeholder="Özet / Kurte"/>
            <div className="bg-white p-6 border rounded-[40px]">
              <div className="flex justify-between mb-4">
                <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-gray-500">GÖRSEL EKLE</button>
                <button onClick={() => autoTranslateField('content')} className="text-xs font-bold text-brand-accent">AI İLE ÇEVİR</button>
              </div>
              <textarea value={formData.content?.[activeLangTab] || ''} onChange={e => setFormData({...formData, content: {...formData.content, [activeLangTab]: e.target.value} as any})} className="w-full h-96 p-6 border-none focus:ring-0 text-xl font-serif" placeholder="Haber İçeriği..."/>
              <input type="file" ref={fileInputRef} onChange={e => handleImageUpload(e, 'content')} className="hidden" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 rounded-2xl border">
                <option value="">Kategori Seçin</option>
                {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat[lang]}</option>)}
              </select>
              <div className="flex gap-2 p-1 bg-white rounded-2xl border">
                <button onClick={() => setFormData({...formData, status: 'published'})} className={`flex-1 py-3 rounded-xl text-xs font-bold ${formData.status !== 'draft' ? 'bg-green-500 text-white' : 'text-gray-400'}`}>YAYINDA</button>
                <button onClick={() => setFormData({...formData, status: 'draft'})} className={`flex-1 py-3 rounded-xl text-xs font-bold ${formData.status === 'draft' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>TASLAK</button>
              </div>
            </div>
            <div onClick={() => mainFileInputRef.current?.click()} className="aspect-video border-4 border-dashed rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden relative">
              {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-200" size={48}/>}
              {isUploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
              <input type="file" ref={mainFileInputRef} onChange={e => handleImageUpload(e, 'main')} className="hidden" />
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 flex gap-4">
          <button onClick={handleSave} className="flex-1 bg-brand-primary text-white py-5 rounded-3xl font-black text-xl shadow-2xl flex items-center justify-center gap-4"><Save /> KAYDET</button>
          <button onClick={resetForm} className="px-10 bg-white border-2 border-gray-100 py-5 rounded-3xl font-bold text-gray-400">İPTAL</button>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center sticky top-0 bg-white py-4 border-b z-10">
          <h3 className="text-2xl font-black">{t.newsList}</h3>
          <button onClick={() => setIsAdding(true)} className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2"><Plus size={20}/> HABER EKLE</button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {news.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-[32px] border flex items-center gap-6 group hover:shadow-xl transition-all">
              <img src={item.imageUrl} className="w-24 h-24 rounded-2xl object-cover" />
              <div className="flex-1">
                <span className="text-[10px] font-black text-brand-accent uppercase bg-brand-accent/5 px-2 py-1 rounded-lg">{item.category}</span>
                <h4 className="text-lg font-bold mt-1 line-clamp-1">{item.title?.[lang] || item.title?.['tr']}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEditing(item)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 size={20}/></button>
                <button onClick={() => handleDelete(item.id)} className="p-3 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const t = UI_STRINGS[lang];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center sm:p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-6xl h-full sm:h-[95vh] sm:rounded-[40px] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-8 py-6 border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-8">
            <h2 className="text-2xl font-black text-gray-900">{t.adminPanel}</h2>
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button onClick={() => { setActiveTab('news'); setImportMode(false); setIsAdding(false); }} className={`px-6 py-2.5 rounded-xl text-xs font-black ${activeTab === 'news' ? 'bg-white text-brand-primary' : 'text-gray-400'}`}>HABERLER</button>
              <button onClick={() => setActiveTab('settings')} className={`px-6 py-2.5 rounded-xl text-xs font-black ${activeTab === 'settings' ? 'bg-white text-brand-primary' : 'text-gray-400'}`}>AYARLAR</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowKeySettings(!showKeySettings)} className="p-2.5 text-amber-600"><Key size={20}/></button>
            <button onClick={onLogout} className="p-2.5 text-red-600"><LogOut size={20}/></button>
            <button onClick={onClose} className="p-2.5 text-gray-400"><X size={24}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 relative">
          {showKeySettings && (
            <div className="mb-10 p-8 bg-amber-50 border-2 border-amber-200 rounded-[32px] flex gap-4">
              <input type="password" value={manualApiKey} onChange={e => setManualApiKey(e.target.value)} placeholder="API Key..." className="flex-1 p-4 rounded-2xl border-2" />
              <button onClick={saveManualKey} className="bg-amber-600 text-white px-8 rounded-2xl font-bold">KAYDET</button>
            </div>
          )}
          {activeTab === 'settings' ? (
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
               <div onClick={() => leftHeaderInputRef.current?.click()} className="aspect-video border-4 border-dashed rounded-[32px] flex items-center justify-center cursor-pointer relative overflow-hidden">
                 {settings.leftImageUrl ? <img src={settings.leftImageUrl} className="w-full h-full object-contain p-4"/> : <ImageIcon className="text-gray-200"/>}
                 <input type="file" ref={leftHeaderInputRef} onChange={e => handleImageUpload(e, 'header-left')} className="hidden" />
               </div>
               <div onClick={() => rightHeaderInputRef.current?.click()} className="aspect-video border-4 border-dashed rounded-[32px] flex items-center justify-center cursor-pointer relative overflow-hidden">
                 {settings.rightImageUrl ? <img src={settings.rightImageUrl} className="w-full h-full object-contain p-4"/> : <ImageIcon className="text-gray-200"/>}
                 <input type="file" ref={rightHeaderInputRef} onChange={e => handleImageUpload(e, 'header-right')} className="hidden" />
               </div>
            </div>
          ) : renderNewsContent()}
        </div>
      </motion.div>
    </div>
  );
};
