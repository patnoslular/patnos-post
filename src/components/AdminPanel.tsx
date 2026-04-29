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
  const [formData, setFormData] = useState<Partial<NewsItem>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
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
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('GEMINI_API_KEY_OVERRIDE') || '');
  const [showKeySettings, setShowKeySettings] = useState(false);

  const t = UI_STRINGS[lang];

  const saveManualKey = () => {
    localStorage.setItem('GEMINI_API_KEY_OVERRIDE', manualApiKey);
    alert('API Anahtarı kaydedildi. Çeviri özelliğini tekrar deneyebilirsiniz.');
    setShowKeySettings(false);
  };

  const autoTranslateField = async (field: 'title' | 'excerpt' | 'content') => {
    const sourceLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    const targetLang: Language = activeLangTab;
    const sourceText = (formData[field] as any)?.[sourceLang];

    if (!sourceText) {
      alert(lang === 'tr' ? `Önce ${sourceLang === 'tr' ? 'Türkçe' : 'Kürtçe'} içeriği doldurmalısınız.` : `Berê divê hûn naveroka ${sourceLang === 'tr' ? 'Tirkî' : 'Kurdî'} dagirin.`);
      return;
    }

    setIsAutoTranslating(field);
    try {
      const translated = await translateContent(sourceText, targetLang);
      setFormData(prev => ({
        ...prev,
        [field]: { ...prev[field], [targetLang]: translated } as any
      }));
    } catch (error: any) {
      console.error("Auto-translate error:", error);
      alert(lang === 'tr' ? "Çeviri yapılamadı, lütfen manuel doldurun." : "Werger nehat kirin, ji kerema xwe bi destan dagirin.");
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
          console.error(`Translation failed for ${field}`, e);
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
      setImportProgress({ current: 0, total: items.length });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setImportProgress(prev => ({ ...prev, current: i + 1 }));

        const titleTr = item.querySelector("title")?.textContent?.trim() || "";
        const descriptionTr = item.querySelector("description")?.textContent?.trim() || "";
        const imageUrl = item.querySelector("enclosure")?.getAttribute("url") || "https://picsum.photos/seed/news/800/600";

        const titleKu = await translateContent(titleTr, 'ku');
        const contentKu = await translateContent(descriptionTr, 'ku');

        await addNews({
          title: { tr: titleTr, ku: titleKu },
          excerpt: { tr: descriptionTr.substring(0, 150), ku: contentKu.substring(0, 150) },
          content: { tr: descriptionTr, ku: contentKu },
          category: 'general',
          author: 'Wix Import',
          date: new Date().toLocaleDateString('tr-TR'),
          imageUrl,
          readTime: '3 DK'
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setImportMode(false);
      setImportXml('');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'main' | 'content' | 'header-left' | 'header-right') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(lang === 'tr' ? 'Dosya çok büyük (Maks 10MB)' : 'Pel pir mezin e (Herî zêde 10MB)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setUploadStatus(lang === 'tr' ? 'Yükleniyor...' : 'Tê barkirin...');
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      setUploadProgress(40);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const publicUrl = data.url;

      setUploadProgress(95);
      if (target === 'header-left' || target === 'header-right') {
        const newSettings = {
          ...settings,
          [target === 'header-left' ? 'leftImageUrl' : 'rightImageUrl']: publicUrl
        };
        await updateSettings(newSettings);
      } else {
        updateFormDataWithUrl(publicUrl, target);
      }
      
      setUploadStatus(lang === 'tr' ? 'Tamam!' : 'Temam!');
      setUploadProgress(100);
      setTimeout(() => {
        setUploadStatus(null);
        setUploadProgress(null);
      }, 1000);
    } catch (error) {
      alert('Yükleme hatası oluştu.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const updateFormDataWithUrl = (url: string, target: 'main' | 'content') => {
    if (target === 'main') {
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } else {
      const currentContent = formData.content?.[activeLangTab] || '';
      const imageTag = `\n\n[IMAGE:${url}]\n\n`;
      const newContent = currentContent + imageTag;
      setFormData(prev => ({
        ...prev,
        content: { ...prev.content, [activeLangTab]: newContent } as any
      }));
    }
  };

  const handleVideoAdd = () => {
    const url = prompt('YouTube Video URL:');
    if (!url) return;
    const videoTag = `\n\n[VIDEO:${url}]\n\n`;
    const currentContent = formData.content?.[activeLangTab] || '';
    setFormData(prev => ({
      ...prev,
      content: { ...prev.content, [activeLangTab]: currentContent + videoTag } as any
    }));
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} ${lang === 'tr' ? 'DK' : 'DEQ'}`;
  };

  const handleSave = async () => {
    if (!formData.title?.tr || !formData.category || !formData.imageUrl) {
      alert('Lütfen zorunlu alanları doldurun.');
      return;
    }

    const itemToSave = {
      ...formData,
      readTime: calculateReadTime(formData.content?.[activeLangTab] || ''),
      date: formData.date || new Date().toLocaleDateString('tr-TR')
    } as NewsItem;

    if (editingId) {
      await editNews(editingId, itemToSave);
    } else {
      await addNews(itemToSave as Omit<NewsItem, 'id'>);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({});
    setEditingId(null);
    setIsAdding(false);
  };

  const startEditing = (item: NewsItem) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.deleteConfirm)) {
      await removeNews(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">{t.adminPanel}</h2>
            
            <div className="flex bg-gray-200/50 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('news')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'news' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {lang === 'tr' ? 'HABERLER' : 'NÛÇE'}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {lang === 'tr' ? 'AYARLAR' : 'MÎHENG'}
              </button>
            </div>

            <button 
              onClick={() => setShowKeySettings(!showKeySettings)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
            >
              <Key size={16} />
              {lang === 'tr' ? 'API AYARLARI' : 'MÎHENGÊN API'}
            </button>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all border border-red-100"
            >
              <LogOut size={16} />
              {t.logout}
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
          {showKeySettings && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
              <h2 className="text-sm font-bold text-amber-800 mb-2 uppercase tracking-widest">GEMINI API KEY</h2>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                  className="flex-1 px-4 py-2 border border-amber-300 rounded-xl outline-none text-sm"
                />
                <button onClick={saveManualKey} className="px-6 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold">KAYDET</button>
              </div>
            </div>
          )}

          {activeTab === 'settings' ? (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">Üst Kısım Görselleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">SOL LOGO</label>
                    <div onClick={() => leftHeaderInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                      {settings.leftImageUrl ? <img src={settings.leftImageUrl} className="w-full h-full object-contain p-2" /> : <Upload className="text-gray-300" />}
                    </div>
                    <input type="file" ref={leftHeaderInputRef} onChange={e => handleImageUpload(e, 'header-left')} className="hidden" accept="image/*" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">SAĞ LOGO</label>
                    <div onClick={() => rightHeaderInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                      {settings.rightImageUrl ? <img src={settings.rightImageUrl} className="w-full h-full object-contain p-2" /> : <Upload className="text-gray-300" />}
                    </div>
                    <input type="file" ref={rightHeaderInputRef} onChange={e => handleImageUpload(e, 'header-right')} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          ) : isAdding ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingId ? t.editNews : t.addNews}</h3>
                <div className="flex items-center gap-4">
                  <button onClick={translateAll} className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 text-brand-accent rounded-lg text-xs font-bold">
                    <Languages size={14} /> HEPSİNİ ÇEVİR
                  </button>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveLangTab('tr')} className={`px-4 py-1.5 rounded-md text-sm ${activeLangTab === 'tr' ? 'bg-white shadow-sm' : ''}`}>Türkçe</button>
                    <button onClick={() => setActiveLangTab('ku')} className={`px-4 py-1.5 rounded-md text-sm ${activeLangTab === 'ku' ? 'bg-white shadow-sm' : ''}`}>Kurdî</button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  type="text"
                  value={formData.title?.[activeLangTab] || ''}
                  onChange={e => setFormData({...formData, title: { ...formData.title, [activeLangTab]: e.target.value } as any})}
                  className="w-full px-4 py-3 rounded-xl border outline-none"
                  placeholder="Başlık..."
                />
                <select 
                  value={formData.category || ''}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border outline-none"
                >
                  <option value="">Kategori Seçin</option>
                  {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat[lang]}</option>)}
                </select>
                <div onClick={() => mainFileInputRef.current?.click()} className="aspect-video w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative bg-gray-50 h-48">
                  {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="text-gray-300" />}
                  {isUploading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                </div>
                <input type="file" ref={mainFileInputRef} onChange={e => handleImageUpload(e, 'main')} className="hidden" accept="image/*" />
                <textarea 
                  value={formData.content?.[activeLangTab] || ''}
                  onChange={e => setFormData({...formData, content: { ...formData.content, [activeLangTab]: e.target.value } as any})}
                  className="w-full px-4 py-3 rounded-xl border outline-none h-64"
                  placeholder="Haber içeriği..."
                />
                <div className="flex gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 border rounded-xl flex items-center justify-center gap-2"><ImageIcon size={16}/> Görsel Ekle</button>
                  <button onClick={handleVideoAdd} className="flex-1 py-3 border rounded-xl flex items-center justify-center gap-2"><Video size={16}/> Video Ekle</button>
                  <input type="file" ref={fileInputRef} onChange={e => handleImageUpload(e, 'content')} className="hidden" />
                </div>
                <div className="flex gap-4 mt-6">
                  <button onClick={handleSave} className="flex-1 bg-brand-primary text-white py-4 rounded-xl font-bold shadow-lg">KAYDET</button>
                  <button onClick={resetForm} className="px-8 py-4 text-gray-500 font-bold">İPTAL</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{t.newsList}</h3>
                <div className="flex gap-3">
                  <button onClick={() => setImportMode(true)} className="px-6 py-3 border rounded-xl font-bold flex items-center gap-2"><Import size={20}/> Wix'ten Aktar</button>
                  <button onClick={() => setIsAdding(true)} className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus size={20}/> {t.addNews}</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {news.map(item => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-2xl flex items-center gap-6 border border-transparent hover:border-gray-100 hover:shadow-sm transition-all">
                    <img src={item.imageUrl} className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{item.title?.[lang] || item.title?.['tr']}</h4>
                      <p className="text-xs text-gray-400 uppercase mt-1">{item.category} • {item.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(item)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 size={20}/></button>
                      <button onClick={() => handleDelete(item.id)} className="p-3 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
      {isImporting && <div className="fixed inset-0 bg-white/90 z-[200] flex flex-col items-center justify-center p-10"><Loader2 className="animate-spin text-brand-primary mb-4" size={48}/><h2 className="text-xl font-bold">WIX AKTARILIYOR...</h2><p className="mt-2 text-gray-500">{importProgress.current} / {importProgress.total}</p></div>}
    </div>
  );
};
