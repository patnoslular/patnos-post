import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Edit2, Trash2, Save, Image as ImageIcon, Video, Upload, Loader2, Languages, Import, FileText, LogOut } from 'lucide-react';
import { NewsItem, CATEGORIES, Language, UI_STRINGS } from '../constants';
import { useNews } from '../hooks/useNews';
import { translateContent } from '../services/geminiService';

interface AdminPanelProps {
  onClose: () => void;
  onLogout: () => void;
  lang: Language;
}

export const AdminPanel = ({ onClose, onLogout, lang }: AdminPanelProps) => {
  const { news, addNews, editNews, removeNews } = useNews();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<NewsItem>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const [activeLangTab, setActiveLangTab] = useState<Language>('tr');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isAutoTranslating, setIsAutoTranslating] = useState<string | null>(null);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [importXml, setImportXml] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

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
      alert(lang === 'tr' ? "Çeviri sırasında bir hata oluştu." : "Di dema wergerandinê de çewtiyek çêbû.");
    } finally {
      setIsAutoTranslating(null);
    }
  };

  const translateAll = async () => {
    const sourceLang = activeLangTab;
    const targetLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    
    const fields: ('title' | 'excerpt' | 'content')[] = ['title', 'excerpt', 'content'];
    const sourceData = {
      title: formData.title?.[sourceLang],
      excerpt: formData.excerpt?.[sourceLang],
      content: formData.content?.[sourceLang]
    };

    if (!sourceData.title && !sourceData.excerpt && !sourceData.content) {
      alert(lang === 'tr' ? "Önce bu dildeki alanları doldurmalısınız." : "Pêşî divê hûn qadên vê zimanî dagirin.");
      return;
    }

    setIsTranslatingAll(true);
    try {
      for (const field of fields) {
        const text = (formData[field] as any)?.[sourceLang];
        if (!text) continue;
        
        try {
          const translated = await translateContent(text, targetLang);
          if (translated) {
            setFormData(prev => ({
              ...prev,
              [field]: { ...(prev[field] || {}), [targetLang]: translated } as any
            }));
          }
        } catch (e) {
          console.error(`Translation failed for ${field}`, e);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setActiveLangTab(targetLang);
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
        const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();
        const imageUrl = item.querySelector("enclosure")?.getAttribute("url") || "https://picsum.photos/seed/news/800/600";

        const titleKu = await translateContent(titleTr, 'ku');
        const contentKu = await translateContent(descriptionTr, 'ku');

        const newsItem: Omit<NewsItem, 'id'> = {
          title: { tr: titleTr, ku: titleKu },
          excerpt: { tr: descriptionTr.substring(0, 200), ku: contentKu.substring(0, 200) },
          content: { tr: descriptionTr, ku: contentKu },
          category: 'general',
          author: 'Wix Import',
          date: new Date(pubDate).toLocaleDateString('tr-TR'),
          imageUrl: imageUrl,
          readTime: '3 DK'
        };
        await addNews(newsItem);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setImportMode(false);
      setImportXml('');
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const copyFromOtherLang = (field: 'title' | 'excerpt' | 'content') => {
    const sourceLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    const targetLang: Language = activeLangTab;
    const sourceText = (formData[field] as any)?.[sourceLang];
    if (sourceText) {
      setFormData(prev => ({
        ...prev,
        [field]: { ...(prev[field] || {}), [targetLang]: sourceText } as any
      }));
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'main' | 'content') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(20);
    
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
      
      setUploadProgress(90);
      if (target === 'main') {
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        const currentContent = formData.content?.[activeLangTab] || '';
        const imageTag = `\n\n[IMAGE:${data.url}]\n\n`;
        handleContentChange(currentContent + imageTag, activeLangTab);
      }
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1000);
    } catch (error) {
      console.error('Upload error:', error);
      alert(lang === 'tr' ? 'Görsel yüklenemedi.' : 'Wêne nehat barkirin.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleVideoAdd = () => {
    const url = prompt('Video URL:');
    if (!url) return;
    const videoTag = `\n\n[VIDEO:${url}]\n\n`;
    const currentContent = formData.content?.[activeLangTab] || '';
    handleContentChange(currentContent + videoTag, activeLangTab);
  };

  const handleContentChange = (val: string, l: Language) => {
    setFormData(prev => ({
      ...prev,
      content: { ...prev.content, [l]: val } as any
    }));
  };

  const handleSave = async () => {
    if (!formData.title?.tr || !formData.category || !formData.imageUrl) {
      alert(lang === 'tr' ? 'Lütfen başlık, kategori ve görseli doldurun.' : 'Ji kerema xwe qadên mecbûrî dagirin.');
      return;
    }

    try {
      const itemToSave = {
        ...formData,
        date: new Date().toLocaleDateString('tr-TR'),
        readTime: '3 DK',
        updatedAt: new Date().toISOString()
      } as NewsItem;

      if (editingId) {
        await editNews(editingId, itemToSave);
      } else {
        await addNews(itemToSave as Omit<NewsItem, 'id'>);
      }
      resetForm();
    } catch (error) {
      alert(lang === 'tr' ? 'Kaydedilemedi.' : 'Nehat tomarkirin.');
    }
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

  const t = UI_STRINGS[lang];

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
          {isImporting && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 border border-gray-100 max-w-md w-full">
                <Loader2 size={48} className="animate-spin text-brand-accent" />
                <h4 className="text-lg font-bold text-gray-900 uppercase tracking-widest">
                  {lang === 'tr' ? 'Arşiv Aktarılıyor' : 'Arşîv Tê Barkirin'}
                </h4>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mt-2">
                  <motion.div 
                    className="h-full bg-brand-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-gray-600">{importProgress.current} / {importProgress.total}</p>
              </div>
            </div>
          )}

          {importMode ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Import size={24} className="text-brand-accent" />
                  Wix RSS İçe Aktar
                </h3>
                <button onClick={() => setImportMode(false)} className="text-sm font-bold text-gray-500 hover:text-brand-primary">{t.cancel}</button>
              </div>
              <textarea 
                value={importXml}
                onChange={e => setImportXml(e.target.value)}
                className="w-full h-80 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-mono text-xs"
                placeholder="XML içeriğini buraya yapıştırın..."
              />
              <button 
                onClick={handleWixImport}
                disabled={isImporting || !importXml}
                className="w-full bg-brand-accent text-white py-4 rounded-xl font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="animate-spin" /> : <Import size={20} />}
                İŞLEMİ BAŞLAT
              </button>
            </div>
          ) : isAdding ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{editingId ? t.editNews : t.addNews}</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setActiveLangTab('tr')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeLangTab === 'tr' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'}`}>Türkçe</button>
                  <button onClick={() => setActiveLangTab('ku')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeLangTab === 'ku' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'}`}>Kurdî</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-gray-700 uppercase">{t.title} ({activeLangTab === 'tr' ? 'Türkçe' : 'Kurdî'}) *</label>
                      <button type="button" onClick={() => autoTranslateField('title')} className="flex items-center gap-1 text-[10px] font-bold text-brand-accent">
                        {isAutoTranslating === 'title' ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                        AI ÇEVİR
                      </button>
                    </div>
                    <input 
                      type="text"
                      value={formData.title?.[activeLangTab] || ''}
                      onChange={e => setFormData({...formData, title: { ...formData.title, [activeLangTab]: e.target.value } as any})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase text-xs">{t.category} *</label>
                    <select 
                      value={formData.category || ''}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                    >
                      <option value="">Seçiniz</option>
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat[lang]}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-gray-700 uppercase">{t.excerpt} ({activeLangTab === 'tr' ? 'Türkçe' : 'Kurdî'})</label>
                    </div>
                    <textarea 
                      value={formData.excerpt?.[activeLangTab] || ''}
                      onChange={e => setFormData({...formData, excerpt: { ...formData.excerpt, [activeLangTab]: e.target.value } as any})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 h-24 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700 uppercase">{t.mainImage} *</label>
                  <div 
                    onClick={() => mainFileInputRef.current?.click()}
                    className="aspect-video w-full rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                  >
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <>
                        <ImageIcon className="text-gray-400 mb-2" size={32} />
                        <span className="text-sm text-gray-500">Görsel Seç</span>
                      </>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-brand-primary" />
                        <span className="text-xs font-bold mt-2">{uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={mainFileInputRef} onChange={e => handleImageUpload(e, 'main')} className="hidden" accept="image/*" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase">{t.content} ({activeLangTab === 'tr' ? 'Türkçe' : 'Kurdî'})</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => autoTranslateField('content')} className="flex items-center gap-1 text-[10px] font-bold text-brand-accent">
                      {isAutoTranslating === 'content' ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                      AI ÇEVİR
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs font-bold text-brand-primary">
                      <ImageIcon size={14} /> Görsel Ekle
                    </button>
                    <button type="button" onClick={handleVideoAdd} className="flex items-center gap-1 text-xs font-bold text-brand-accent">
                      <Video size={14} /> Video Ekle
                    </button>
                  </div>
                </div>
                <textarea 
                  value={formData.content?.[activeLangTab] || ''}
                  onChange={e => handleContentChange(e.target.value, activeLangTab)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 h-64 font-serif text-lg outline-none"
                />
                <input type="file" ref={fileInputRef} onChange={e => handleImageUpload(e, 'content')} className="hidden" accept="image/*" />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleSave} className="flex-1 bg-brand-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Save size={20} /> {t.save}
                </button>
                <button onClick={resetForm} className="px-8 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all">
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{t.newsList}</h3>
                <div className="flex gap-3">
                  <button onClick={() => setImportMode(true)} className="px-6 py-3 border border-gray-200 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <Import size={20} className="text-brand-accent" /> Wix'ten Aktar
                  </button>
                  <button onClick={() => setIsAdding(true)} className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-dark transition-all">
                    <Plus size={20} /> {t.addNews}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {news.map(item => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-2xl flex items-center gap-6 border border-transparent hover:border-gray-200 transition-all">
                    <img src={item.imageUrl} className="w-20 h-20 rounded-xl object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">
                        {item.title ? (item.title[lang] || item.title['tr']) : 'Başlıksız'}
                      </h4>
                      <p className="text-xs text-brand-accent font-bold uppercase tracking-wider mt-1">
                        {CATEGORIES.find(c => c.id === item.category)?.[lang] || item.category}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={20} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
