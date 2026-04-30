import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Edit2, Trash2, Save, Image as ImageIcon, 
  Video, Upload, Loader2, Languages, Import, 
  FileText, LogOut, Settings, Key, ArrowLeft,
  Search, Globe, Trash
} from 'lucide-react';
import { NewsItem, CATEGORIES, Language, UI_STRINGS, HeaderSettings } from '../constants';
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
    setActiveLangTab('tr');
  };

  const startEditing = (item: NewsItem) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length || 0;
    const minutes = Math.ceil(words / wordsPerMinute) || 1;
    return `${minutes} ${lang === 'tr' ? 'DK' : 'DEQ'}`;
  };

  const handleSave = async () => {
    if (!formData.title?.tr || !formData.category || !formData.imageUrl) {
      alert(lang === 'tr' ? 'Lütfen zorunlu alanları doldurun (Başlık TR, Kategori, Görsel)' : 'Ji kerema xwe qadên mecbûrî dagirin');
      return;
    }

    try {
      const itemToSave = {
        ...formData,
        status: formData.status || 'published',
        readTime: calculateReadTime(formData.content?.[activeLangTab] || ''),
        updatedAt: new Date().toISOString(),
        date: formData.date || new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
      } as NewsItem;

      if (editingId) {
        await editNews(editingId, itemToSave);
      } else {
        await addNews(itemToSave as Omit<NewsItem, 'id'>);
      }
      resetForm();
    } catch (error) {
      alert(lang === 'tr' ? 'Kaydetme hatası' : 'Çewtiya tomarkirinê');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.deleteConfirm)) {
      try {
        await removeNews(id);
      } catch (error) {
        alert(lang === 'tr' ? 'Silme hatası' : 'Çewtiya jêbirinê');
      }
    }
  };

  const autoTranslateField = async (field: 'title' | 'excerpt' | 'content') => {
    const sourceLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    const targetLang: Language = activeLangTab;
    const sourceText = (formData[field] as any)?.[sourceLang];

    if (!sourceText) {
      alert(lang === 'tr' ? `Önce ${sourceLang === 'tr' ? 'Kürtçe' : 'Türkçe'} içeriği doldurmalısınız.` : `Berê divê hûn naveroka ${sourceLang === 'tr' ? 'Kurdî' : 'Tirkî'} dagirin.`);
      return;
    }

    setIsAutoTranslating(field);
    try {
      const translated = await translateContent(sourceText, targetLang);
      setFormData(prev => ({
        ...prev,
        [field]: { ...(prev[field] || {}), [targetLang]: translated } as any
      }));
    } catch (error: any) {
      alert(lang === 'tr' ? 'Çeviri hatası. Lütfen API anahtarını kontrol edin.' : 'Çewtiya wergerê. Ji kerema xwe mifteya API kontrol bikin.');
    } finally {
      setIsAutoTranslating(null);
    }
  };

  const translateAll = async () => {
    const sourceLang: Language = activeLangTab;
    const targetLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    
    if (!formData.title?.[sourceLang]) {
      alert(lang === 'tr' ? "Lütfen en azından başlığı doldurun." : "Ji kerema xwe bi kêmanî sernavê dagirin.");
      return;
    }

    setIsTranslatingAll(true);
    try {
      const fields: ('title' | 'excerpt' | 'content')[] = ['title', 'excerpt', 'content'];
      for (const field of fields) {
        const text = (formData[field] as any)?.[sourceLang];
        if (text) {
          const translated = await translateContent(text, targetLang);
          setFormData(prev => ({
            ...prev,
            [field]: { ...(prev[field] || {}), [targetLang]: translated } as any
          }));
        }
      }
      setActiveLangTab(targetLang);
    } catch (error) {
      alert(lang === 'tr' ? 'Otomatik çeviri hatası' : 'Çewtiya wergera bixweber');
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const handleVideoAdd = () => {
    const url = prompt(lang === 'tr' ? 'Video URL (YouTube veya direkt link):' : 'URL-ya Vîdyoyê (YouTube an lînka rasterast):');
    if (!url) return;

    const videoTag = `\n\n[VIDEO:${url}]\n\n`;
    const currentContent = formData.content?.[activeLangTab] || '';

    if (contentInputRef.current) {
      const start = contentInputRef.current.selectionStart;
      const end = contentInputRef.current.selectionEnd;
      const newContent = currentContent.substring(0, start) + videoTag + currentContent.substring(end);
      setFormData(prev => ({
        ...prev,
        content: { ...prev.content, [activeLangTab]: newContent } as any
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        content: { ...prev.content, [activeLangTab]: currentContent + videoTag } as any
      }));
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'main' | 'content' | 'header-left' | 'header-right') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const url = data.url;

      if (target === 'header-left' || target === 'header-right') {
        const field = target === 'header-left' ? 'leftImageUrl' : 'rightImageUrl';
        await updateSettings({ ...settings, [field]: url });
      } else if (target === 'main') {
        setFormData(prev => ({ ...prev, imageUrl: url }));
      } else {
        const tag = `\n\n[IMAGE:${url}]\n\n`;
        const current = formData.content?.[activeLangTab] || '';
        setFormData(prev => ({
          ...prev,
          content: { ...prev.content, [activeLangTab]: current + tag } as any
        }));
      }
    } catch (error) {
      alert(lang === 'tr' ? 'Yükleme hatası' : 'Çewtiya barkirinê');
    } finally {
      setIsUploading(false);
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
        const titleTr = item.querySelector("title")?.textContent || "";
        const contentTr = item.querySelector("description")?.textContent || "";
        const imageUrl = item.querySelector("enclosure")?.getAttribute("url") || "https://picsum.photos/800/600";
        
        const titleKu = await translateContent(titleTr, 'ku');
        const contentKu = await translateContent(contentTr, 'ku');
        
        await addNews({
          title: { tr: titleTr, ku: titleKu },
          content: { tr: contentTr, ku: contentKu },
          excerpt: { tr: contentTr.substring(0, 150), ku: contentKu.substring(0, 150) },
          imageUrl,
          category: 'general',
          date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          author: 'Wix Import',
          readTime: calculateReadTime(contentTr),
          status: 'published'
        });
        
        await new Promise(r => setTimeout(r, 1000));
      }
      alert(lang === 'tr' ? 'Aktarma tamamlandı' : 'Import qediya');
      setImportMode(false);
      setImportXml('');
    } catch (error) {
      alert('Import error');
    } finally {
      setIsImporting(false);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY_OVERRIDE', manualApiKey);
    setShowKeySettings(false);
    alert('API Anahtarı kaydedildi.');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center sm:p-6">
      <div className="bg-white w-full max-w-6xl h-full sm:h-[95vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* MODAL HEADER - STICKY */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-8">
            <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-3">
              <Settings className="text-brand-primary" size={28} />
              {t.adminPanel}
            </h2>
            
            <nav className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
              <button 
                onClick={() => { setActiveTab('news'); setImportMode(false); setIsAdding(false); }}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'news' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {lang === 'tr' ? 'HABERLER' : 'NÛÇE'}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {lang === 'tr' ? 'AYARLAR' : 'MÎHENG'}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowKeySettings(!showKeySettings)}
              className="p-3 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
              title="API Ayarları"
            >
              <Key size={22} />
            </button>
            <button 
              onClick={onLogout}
              className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title={t.logout}
            >
              <LogOut size={22} />
            </button>
            <button onClick={onClose} className="p-3 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
              <X size={28} />
            </button>
          </div>
        </div>

        {/* MODAL CONTENT - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#fdfdfd]">
          <AnimatePresence mode="wait">
            
            {showKeySettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="mb-8"
              >
                <div className="p-8 bg-amber-50 rounded-[32px] border-2 border-amber-100 shadow-inner">
                  <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <Key size={20} />
                    Gemini AI API Key
                  </h3>
                  <div className="flex gap-4">
                    <input 
                      type="password"
                      value={manualApiKey}
                      onChange={e => setManualApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 px-6 py-4 rounded-2xl border-2 border-amber-200 outline-none focus:border-amber-500 font-mono text-sm"
                    />
                    <button onClick={saveApiKey} className="px-10 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200">
                      ANAHTARI KAYDET
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'news' ? (
              <>
                {isAdding ? (
                  /* --- HABER EKLEME / DÜZENLEME FORMU --- */
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="max-w-5xl mx-auto space-y-8"
                  >
                    {/* Form Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                      <div className="flex items-center gap-4">
                        <button onClick={resetForm} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold">
                          <ArrowLeft size={18} />
                          {lang === 'tr' ? 'Vazgeç' : 'Betal Bike'}
                        </button>
                        <div className="h-6 w-px bg-gray-200" />
                        <h3 className="text-xl font-bold">{editingId ? t.editNews : t.addNews}</h3>
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          onClick={translateAll}
                          disabled={isTranslatingAll}
                          className="flex items-center gap-3 px-6 py-3 bg-brand-accent text-white rounded-2xl text-xs font-bold hover:brightness-110 shadow-lg shadow-brand-accent/20"
                        >
                          {isTranslatingAll ? <Loader2 className="animate-spin" size={16} /> : <Languages size={16} />}
                          {lang === 'tr' ? 'TÜMÜNÜ KÜRTÇEYE ÇEVİR' : 'HEMÛYÎ WERGERÎNE KURDÎ'}
                        </button>
                        
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                          <button 
                            onClick={() => setActiveLangTab('tr')}
                            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeLangTab === 'tr' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-400'}`}
                          >
                            TÜRKÇE
                          </button>
                          <button 
                            onClick={() => setActiveLangTab('ku')}
                            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeLangTab === 'ku' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-400'}`}
                          >
                            KURDÎ
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      {/* Metin Alanları */}
                      <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.title} ({activeLangTab.toUpperCase()})</label>
                              <button onClick={() => autoTranslateField('title')} className="text-[10px] text-brand-accent font-black hover:underline flex items-center gap-1">
                                <Languages size={12} /> AI İLE ÇEVİR
                              </button>
                            </div>
                            <input 
                              type="text"
                              value={formData.title?.[activeLangTab] || ''}
                              onChange={e => setFormData({...formData, title: { ...formData.title, [activeLangTab]: e.target.value } as any})}
                              className="w-full px-6 py-5 rounded-2xl border-2 border-gray-50 bg-gray-50/30 outline-none focus:border-brand-primary focus:bg-white transition-all text-xl font-bold"
                              placeholder="Haber başlığı..."
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.excerpt}</label>
                              <button onClick={() => autoTranslateField('excerpt')} className="text-[10px] text-brand-accent font-black hover:underline flex items-center gap-1">
                                <Languages size={12} /> AI İLE ÇEVİR
                              </button>
                            </div>
                            <textarea 
                              value={formData.excerpt?.[activeLangTab] || ''}
                              onChange={e => setFormData({...formData, excerpt: { ...formData.excerpt, [activeLangTab]: e.target.value } as any})}
                              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/30 outline-none focus:border-brand-primary focus:bg-white h-28 resize-none text-sm leading-relaxed"
                              placeholder="Kısa özet..."
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.content}</label>
                              <div className="flex gap-4">
                                <button onClick={() => autoTranslateField('content')} className="text-[10px] text-brand-accent font-black hover:underline flex items-center gap-1">
                                  <Languages size={12} /> AI İLE ÇEVİR
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-brand-primary font-black hover:underline flex items-center gap-1">
                                  <ImageIcon size={12} /> GÖRSEL EKLE
                                </button>
                                <button onClick={handleVideoAdd} className="text-[10px] text-orange-500 font-black hover:underline flex items-center gap-1">
                                  <Video size={12} /> VİDEO EKLE
                                </button>
                              </div>
                            </div>
                            <textarea 
                              ref={contentInputRef}
                              value={formData.content?.[activeLangTab] || ''}
                              onChange={e => setFormData({...formData, content: { ...formData.content, [activeLangTab]: e.target.value } as any})}
                              className="w-full px-8 py-8 rounded-[32px] border-2 border-gray-50 bg-gray-50/30 outline-none focus:border-brand-primary focus:bg-white h-[500px] font-serif text-lg leading-loose"
                              placeholder="Haber içeriğini buraya yazın..."
                            />
                            <input type="file" ref={fileInputRef} onChange={e => handleImageUpload(e, 'content')} className="hidden" accept="image/*" />
                          </div>
                        </div>
                      </div>

                      {/* Yan Panel: Medya & Ayarlar */}
                      <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.mainImage}</label>
                            <div 
                              onClick={() => mainFileInputRef.current?.click()}
                              className="aspect-[4/3] w-full rounded-3xl border-4 border-dashed border-gray-50 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary transition-all overflow-hidden relative group"
                            >
                              {formData.imageUrl ? (
                                <>
                                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Upload className="text-white" size={32} />
                                  </div>
                                </>
                              ) : (
                                <div className="text-center text-gray-300">
                                  <Upload size={40} className="mx-auto mb-3" />
                                  <span className="text-[11px] font-black tracking-widest">GÖRSEL SEÇ</span>
                                </div>
                              )}
                              {isUploading && (
                                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center">
                                  <Loader2 className="animate-spin text-brand-primary" size={32} />
                                  <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase">Yükleniyor...</span>
                                </div>
                              )}
                            </div>
                            <input type="file" ref={mainFileInputRef} onChange={e => handleImageUpload(e, 'main')} className="hidden" accept="image/*" />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t.category}</label>
                            <select 
                              value={formData.category || ''}
                              onChange={e => setFormData({...formData, category: e.target.value})}
                              className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 outline-none focus:border-brand-primary font-bold text-gray-700"
                            >
                              <option value="">Kategori Seçin</option>
                              {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat[lang]}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Durum</label>
                            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                              <button 
                                onClick={() => setFormData({...formData, status: 'published'})}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.status !== 'draft' ? 'bg-green-500 text-white shadow-md' : 'text-gray-400'}`}
                              >
                                {t.published.toUpperCase()}
                              </button>
                              <button 
                                onClick={() => setFormData({...formData, status: 'draft'})}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.status === 'draft' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400'}`}
                              >
                                {t.draft.toUpperCase()}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Save Action Area */}
                        <div className="flex flex-col gap-4">
                          <button 
                            onClick={handleSave}
                            className="w-full bg-brand-primary text-white py-6 rounded-[32px] font-black text-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/30"
                          >
                            <Save size={24} />
                            {t.save.toUpperCase()}
                          </button>
                          <button 
                            onClick={resetForm}
                            className="w-full bg-gray-200 text-gray-500 py-5 rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-gray-300 transition-all"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : importMode ? (
                  /* --- WIX RSS IMPORT --- */
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Import className="text-brand-accent" size={32} />
                        Wix RSS İçe Aktar
                      </h3>
                      <button onClick={() => setImportMode(false)} className="px-6 py-2 bg-gray-100 text-gray-500 rounded-xl font-bold">Vazgeç</button>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 text-sm text-blue-800 leading-relaxed shadow-inner">
                      <p className="font-bold mb-2">💡 Nasıl Yapılır?</p>
                      Wix sitenizdeki blog-feed.xml içeriğini kopyalayıp aşağıdaki kutuya yapıştırın. Yapay zeka tüm haberleri otomatik olarak Kürtçeye çevirecek ve kaydedecektir. Her haber için yaklaşık 2-3 saniye bekler.
                    </div>
                    <textarea 
                      value={importXml}
                      onChange={e => setImportXml(e.target.value)}
                      className="w-full h-[400px] p-6 rounded-[32px] border-4 border-gray-50 bg-gray-50/30 font-mono text-xs focus:bg-white focus:border-brand-primary outline-none transition-all shadow-inner"
                      placeholder="XML içeriğini yapıştırın..."
                    />
                    <button 
                      onClick={handleWixImport}
                      disabled={isImporting || !importXml}
                      className="w-full bg-brand-accent text-white py-6 rounded-[32px] font-black text-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                      {isImporting ? <Loader2 className="animate-spin" /> : <Import size={24} />}
                      İÇE AKTARMAYI BAŞLAT
                    </button>
                  </motion.div>
                ) : (
                  /* --- HABER LİSTESİ --- */
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="space-y-10"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold text-gray-900">{t.newsList}</h3>
                        <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-black uppercase tracking-wider">{news.length} KAYIT</span>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button 
                          onClick={() => setImportMode(true)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-gray-100 text-gray-600 rounded-[28px] font-black text-xs hover:bg-gray-50 transition-all shadow-sm"
                        >
                          <Import size={18} className="text-brand-accent" />
                          Wix'ten Aktar
                        </button>
                        <button 
                          onClick={() => setIsAdding(true)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-brand-primary text-white rounded-[28px] font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-2xl shadow-brand-primary/20"
                        >
                          <Plus size={20} />
                          {t.addNews.toUpperCase()}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {news.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-[32px] flex flex-col sm:flex-row items-center gap-8 hover:bg-gray-50 transition-all border border-gray-100 group shadow-sm hover:shadow-xl">
                          <div className="relative w-full sm:w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
                            <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt="" />
                            {item.status === 'draft' && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-[10px] font-black text-white px-3 py-1 border border-white/50 rounded-full uppercase tracking-tighter">Taslak</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-center sm:text-left">
                            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-brand-accent/5 text-brand-accent border border-brand-accent/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {(CATEGORIES.find(c => c.id === item.category)?.[lang] || item.category)}
                              </span>
                              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.date}</span>
                            </div>
                            <h4 className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors text-xl leading-tight line-clamp-2">
                              {item.title?.[lang] || item.title?.['tr'] || 'Başlıksız'}
                            </h4>
                          </div>

                          <div className="flex gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                            <button 
                              onClick={() => startEditing(item)} 
                              className="p-4 text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all hover:scale-110"
                              title="Düzenle"
                            >
                              <Edit2 size={22} />
                            </button>
                            <div className="w-px h-8 bg-gray-200" />
                            <button 
                              onClick={() => handleDelete(item.id)} 
                              className="p-4 text-red-600 hover:bg-white hover:shadow-sm rounded-xl transition-all hover:scale-110"
                              title="Sil"
                            >
                              <Trash2 size={22} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              /* --- SİTE AYARLARI --- */
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto space-y-10"
              >
                <div className="bg-white p-12 rounded-[48px] shadow-sm border border-gray-100 space-y-12">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                      <ImageIcon className="text-brand-primary" size={24} />
                    </div>
                    <h3 className="text-2xl font-serif font-black tracking-tight">Üst Panel (Header) Logoları</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">SOL LOGO</label>
                      <div 
                        onClick={() => leftHeaderInputRef.current?.click()}
                        className="aspect-[16/7] w-full rounded-[32px] border-4 border-dashed border-gray-50 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-white transition-all overflow-hidden relative group shadow-inner"
                      >
                        {settings.leftImageUrl ? (
                          <>
                            <img src={settings.leftImageUrl} className="w-full h-full object-contain p-6" alt="Left" />
                            <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <Upload className="text-brand-primary" size={32} />
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-gray-300">
                            <Plus size={32} className="mx-auto mb-2" />
                            <span className="text-[10px] font-black uppercase">LOGO EKLE</span>
                          </div>
                        )}
                      </div>
                      <input type="file" ref={leftHeaderInputRef} onChange={e => handleImageUpload(e, 'header-left')} className="hidden" accept="image/*" />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">SAĞ LOGO</label>
                      <div 
                        onClick={() => rightHeaderInputRef.current?.click()}
                        className="aspect-[16/7] w-full rounded-[32px] border-4 border-dashed border-gray-50 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-white transition-all overflow-hidden relative group shadow-inner"
                      >
                        {settings.rightImageUrl ? (
                          <>
                            <img src={settings.rightImageUrl} className="w-full h-full object-contain p-6" alt="Right" />
                            <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <Upload className="text-brand-primary" size={32} />
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-gray-300">
                            <Plus size={32} className="mx-auto mb-2" />
                            <span className="text-[10px] font-black uppercase">LOGO EKLE</span>
                          </div>
                        )}
                      </div>
                      <input type="file" ref={rightHeaderInputRef} onChange={e => handleImageUpload(e, 'header-right')} className="hidden" accept="image/*" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
