import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Edit2, Trash2, Save, Image as ImageIcon, Video, Upload, Loader2, Languages, Import, FileText, LogOut, Settings, Key } from 'lucide-react';
import { NewsItem, CATEGORIES, Language, UI_STRINGS } from '../constants';
import { useNews } from '../hooks/useNews';
import { useSettings } from '../hooks/useSettings';
import { supabase, getSupabaseConfig } from '../supabase';
import { createClient } from '@supabase/supabase-js';
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
      if (translated === sourceText) {
        throw new Error("Translation failed or returned same text");
      }
      setFormData(prev => ({
        ...prev,
        [field]: { ...prev[field], [targetLang]: translated } as any
      }));
    } catch (error: any) {
      console.error("Auto-translate error:", error);
      
      const isQuotaError = error?.message?.includes('quota') || error?.message?.includes('429');
      const isKeyMissing = error?.message === 'API_KEY_MISSING';
      const isKeyInvalid = error?.message?.includes('API key not valid') || error?.message?.includes('API_KEY_INVALID');
      const isSafetyBlock = error?.message?.startsWith('SAFETY_BLOCK');
      
      if (isKeyMissing || isKeyInvalid) {
        alert(lang === 'tr' 
          ? "Sistem yapılandırma hatası: Geçersiz veya eksik API anahtarı. Lütfen yönetici ile iletişime geçin." 
          : "Çewtiya mîhengkirina pergalê: Mifteya API ya nederbasdar an kêm e. Ji kerema xwe bi rêveber re têkilî daynin.");
      } else if (isQuotaError) {
        alert(lang === 'tr' 
          ? "Yapay zeka kullanım kotası doldu. Lütfen 1 dakika bekleyip tekrar deneyin." 
          : "Kotaya bikaranîna AI tije bûye. Ji kerema xwe 1 deqe bisekinin û dîsa biceribînin.");
      } else if (isSafetyBlock) {
        alert(lang === 'tr' 
          ? "Bu içerik yapay zeka güvenlik filtrelerine takıldı ve çevrilemedi." 
          : "Ev naverok di fîltreyên ewlehiya AI-ê de asê ma û nehat wergerandin.");
      } else {
        alert(lang === 'tr' 
          ? `Çeviri sırasında bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}` 
          : `Di dema wergerandinê de çewtiyek çêbû: ${error?.message || 'Çewtiya nenas'}`);
      }

      setFormData(prev => ({
        ...prev,
        [field]: { ...(prev[field] || {}), [targetLang]: sourceText } as any
      }));
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
      setActiveLangTab(targetLang);

      for (const field of fields) {
        const text = (formData[field] as any)?.[sourceLang];
        if (!text) continue;
        
        setFormData(prev => ({
          ...prev,
          [field]: { ...(prev[field] || {}), [targetLang]: text } as any
        }));

        try {
          const translated = await translateContent(text, targetLang);
          if (translated && translated !== text) {
            setFormData(prev => ({
              ...prev,
              [field]: { ...(prev[field] || {}), [targetLang]: translated } as any
            }));
          }
        } catch (e: any) {
          console.error(`Translation failed for ${field}`, e);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error("Translate all error:", error);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const handleWixImport = async () => {
    if (!importXml.trim()) {
      alert(lang === 'tr' ? "Lütfen Wix RSS XML içeriğini yapıştırın." : "Ji kerema xwe naveroka Wix RSS XML pêve bikin.");
      return;
    }

    setIsImporting(true);
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(importXml, "text/xml");
      const items = Array.from(xmlDoc.querySelectorAll("item"));
      
      if (items.length === 0) {
        throw new Error(lang === 'tr' ? "Geçerli bir RSS içeriği bulunamadı." : "Naveroka RSS ya derbasdar nehat dîtin.");
      }

      setImportProgress({ current: 0, total: items.length });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setImportProgress(prev => ({ ...prev, current: i + 1 }));

        const titleTr = item.querySelector("title")?.textContent?.trim() || "";
        const descriptionTr = item.querySelector("description")?.textContent?.trim() || "";
        const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();
        const imageUrl = item.querySelector("enclosure")?.getAttribute("url") || 
                        item.querySelector("media\\:content, content")?.getAttribute("url") || 
                        "https://picsum.photos/seed/wix/800/600";

        const titleKu = await translateContent(titleTr, 'ku');
        const excerptKu = await translateContent(descriptionTr.substring(0, 200), 'ku');
        const contentKu = await translateContent(descriptionTr, 'ku');

        const newsItem: Omit<NewsItem, 'id'> = {
          title: { tr: titleTr, ku: titleKu },
          excerpt: { tr: descriptionTr.substring(0, 200), ku: excerptKu },
          content: { tr: descriptionTr, ku: contentKu },
          category: 'general',
          author: item.querySelector("dc\\:creator, creator")?.textContent || 'Wix Import',
          date: new Date(pubDate).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'ku-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          imageUrl: imageUrl,
          readTime: calculateReadTime(descriptionTr)
        };

        await addNews(newsItem);
        
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      alert(lang === 'tr' ? "İçe aktarma başarıyla tamamlandı!" : "Import bi serkeftî qediya!");
      setImportMode(false);
      setImportXml('');
    } catch (error: any) {
      console.error("Import error:", error);
      alert((lang === 'tr' ? "Hata: " : "Çewtî: ") + error.message);
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const copyFromOtherLang = (field: 'title' | 'excerpt' | 'content') => {
    const sourceLang: Language = activeLangTab === 'tr' ? 'ku' : 'tr';
    const targetLang: Language = activeLangTab;
    const fieldData = formData[field] as any;
    const sourceText = fieldData?.[sourceLang];

    if (sourceText) {
      setFormData(prev => ({
        ...prev,
        [field]: { ...(prev[field] || {}), [targetLang]: sourceText } as any
      }));
    }
  };

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} ${lang === 'tr' ? 'DK' : 'DEQ'}`;
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'main' | 'content' | 'header-left' | 'header-right') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(lang === 'tr' ? 'Dosya boyutu çok büyük (Maksimum 5MB)' : 'Mezinahiya pelê pir mezin e (Herî zêde 5MB)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setUploadStatus(lang === 'tr' ? 'Görsel yükleniyor...' : 'Wêne tê barkirin...');
    
    try {
      const { url: supabaseUrl, serviceKey } = getSupabaseConfig();
      let publicUrl = '';
      
      if (supabaseUrl && serviceKey && !supabaseUrl.includes('your-project')) {
        const adminClient = createClient(supabaseUrl, serviceKey);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await adminClient.storage
            .from('news-images')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl: url } } = adminClient.storage
            .from('news-images')
            .getPublicUrl(filePath);
        
        publicUrl = url;
      } else {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        publicUrl = data.url;
      }

      if (target === 'header-left' || target === 'header-right') {
        const newSettings = {
          ...settings,
          [target === 'header-left' ? 'leftImageUrl' : 'rightImageUrl']: publicUrl
        };
        await updateSettings(newSettings);
      } else {
        updateFormDataWithUrl(publicUrl, target);
      }
      
      setUploadStatus(lang === 'tr' ? 'Tamamlandı!' : 'Temam bû!');
      setUploadProgress(100);
      setTimeout(() => setUploadStatus(null), 2000);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert((lang === 'tr' ? 'Yükleme hatası: ' : 'Çewtiya barkirinê: ') + (error.message || error.code));
      setUploadStatus(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (e.target) e.target.value = '';
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
      handleContentChange(newContent, activeLangTab);
    } else {
      const newContent = currentContent + videoTag;
      handleContentChange(newContent, activeLangTab);
    }
  };

  const updateFormDataWithUrl = (url: string, target: 'main' | 'content') => {
    if (target === 'main') {
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } else {
      const currentContent = formData.content?.[activeLangTab] || '';
      const imageTag = `\n\n[IMAGE:${url}]\n\n`;
      
      if (contentInputRef.current) {
        const start = contentInputRef.current.selectionStart;
        const end = contentInputRef.current.selectionEnd;
        const newContent = currentContent.substring(0, start) + imageTag + currentContent.substring(end);
        handleContentChange(newContent, activeLangTab);
      } else {
        const newContent = currentContent + imageTag;
        handleContentChange(newContent, activeLangTab);
      }
    }
  };

  const handleContentChange = (val: string, l: Language) => {
    setFormData(prev => ({
      ...prev,
      content: { ...prev.content, [l]: val } as any
    }));
  };

  const handleSave = async () => {
    if (!formData.title?.tr || !formData.category || !formData.imageUrl) {
      alert(lang === 'tr' ? 'Lütfen zorunlu alanları doldurun (Başlık TR, Kategori, Görsel)' : 'Ji kerema xwe qadên mecbûrî dagirin');
      return;
    }

    try {
      const itemToSave = {
        ...formData,
        readTime: calculateReadTime(formData.content?.[activeLangTab] || ''),
        updatedAt: new Date().toISOString()
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
      try {
        await removeNews(id);
      } catch (error) {
        alert(lang === 'tr' ? 'Silme hatası' : 'Çewtiya jêbirinê');
      }
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
            <h2 className="text-2xl font-sans font-bold text-gray-900">{t.adminPanel}</h2>
            
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

            <div className="h-6 w-px bg-gray-200 mx-2" />

            <button 
              onClick={() => setShowKeySettings(!showKeySettings)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
            >
              <Settings size={16} />
              {lang === 'tr' ? 'ANAHTAR AYARLARI' : 'MÎHENGÊN MÎFTEYÊ'}
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
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2 uppercase tracking-widest">
                <Key size={18} />
                {lang === 'tr' ? 'Yapay Zeka (Gemini) API Anahtarı Ayarları' : 'Mîhengên Mifteya API ya AI (Gemini)'}
              </h2>
              <p className="text-xs text-amber-700 mb-4">
                {lang === 'tr' 
                  ? 'Eğer otomatik çeviri çalışmıyorsa, API anahtarınızı buraya manuel olarak yapıştırabilirsiniz.' 
                  : 'Heke wergera otomatîk nexebite, hûn dikarin mifteya API-ya xwe bi destan li vir bixin.'}
              </p>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="flex-1 px-4 py-2 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                />
                <button
                  onClick={saveManualKey}
                  className="px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors text-xs font-bold"
                >
                  {lang === 'tr' ? 'KAYDET' : 'TOMAR BIKE'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' ? (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <ImageIcon className="text-brand-primary" />
                  {lang === 'tr' ? 'Header Görselleri' : 'Wêneyên Header'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">
                      {lang === 'tr' ? 'Sol Logo' : 'Logo Çep'}
                    </label>
                    <div 
                      onClick={() => leftHeaderInputRef.current?.click()}
                      className="aspect-video w-full rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all overflow-hidden relative group"
                    >
                      {settings.leftImageUrl ? (
                        <>
                          <img src={settings.leftImageUrl} className="w-full h-full object-contain p-4" alt="Left" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="text-gray-400 mb-2" size={32} />
                          <span className="text-xs text-gray-500 font-bold uppercase">{lang === 'tr' ? 'Görsel Seç' : 'Hilbijêre'}</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={leftHeaderInputRef} onChange={e => handleImageUpload(e, 'header-left')} className="hidden" accept="image/*" />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">
                      {lang === 'tr' ? 'Sağ Logo' : 'Logo Rast'}
                    </label>
                    <div 
                      onClick={() => rightHeaderInputRef.current?.click()}
                      className="aspect-video w-full rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all overflow-hidden relative group"
                    >
                      {settings.rightImageUrl ? (
                        <>
                          <img src={settings.rightImageUrl} className="w-full h-full object-contain p-4" alt="Right" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="text-gray-400 mb-2" size={32} />
                          <span className="text-xs text-gray-500 font-bold uppercase">{lang === 'tr' ? 'Görsel Seç' : 'Hilbijêre'}</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={rightHeaderInputRef} onChange={e => handleImageUpload(e, 'header-right')} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          ) : isTranslatingAll ? (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center text-center p-4">
              <Loader2 size={40} className="animate-spin text-brand-accent mb-4" />
              <p className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                {lang === 'tr' ? 'Yapay Zeka Çeviriyor...' : 'AI Wergerîne...'}
              </p>
            </div>
          ) : isImporting ? (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center p-8">
              <Loader2 size={48} className="animate-spin text-brand-accent mb-4" />
              <h4 className="text-lg font-bold mb-4">{lang === 'tr' ? 'Wix Arşivi Aktarılıyor' : 'Arşîva Wix Tê Barkirin'}</h4>
              <div className="w-full max-w-md bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent transition-all" style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }} />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-600">{importProgress.current} / {importProgress.total}</p>
            </div>
          ) : importMode ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Import size={24} className="text-brand-accent" />
                  {lang === 'tr' ? 'Wix RSS İçe Aktar' : 'Wix RSS Import'}
                </h3>
                <button onClick={() => setImportMode(false)} className="text-sm font-bold text-gray-500 hover:text-brand-primary">{t.cancel}</button>
              </div>
              <textarea 
                value={importXml}
                onChange={e => setImportXml(e.target.value)}
                className="w-full h-80 px-4 py-3 rounded-xl border border-gray-200 font-mono text-xs outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="XML içeriğini buraya yapıştırın..."
              />
              <button 
                onClick={handleWixImport}
                disabled={isImporting || !importXml}
                className="w-full bg-brand-accent text-white py-4 rounded-xl font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                {lang === 'tr' ? 'İÇE AKTARMAYI BAŞLAT' : 'IMPORTÊ DEST PÊ BIKE'}
              </button>
            </div>
          ) : isAdding ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{editingId ? t.editNews : t.addNews}</h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={translateAll}
                    disabled={isTranslatingAll}
                    className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 text-brand-accent rounded-lg text-xs font-bold hover:bg-brand-accent hover:text-white transition-all"
                  >
                    <Languages size={14} /> {lang === 'tr' ? 'DİĞER DİLE ÇEVİR VE GEÇ' : 'BI ZİMANÊ DİN WERGERÎNE'}
                  </button>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveLangTab('tr')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${activeLangTab === 'tr' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'}`}>TR</button>
                    <button onClick={() => setActiveLangTab('ku')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${activeLangTab === 'ku' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'}`}>KU</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-bold text-gray-700 uppercase">{t.title} *</label>
                      <button onClick={() => autoTranslateField('title')} className="text-[10px] font-bold text-brand-accent">AI ÇEVİR</button>
                    </div>
                    <input 
                      type="text"
                      value={formData.title?.[activeLangTab] || ''}
                      onChange={e => setFormData({...formData, title: { ...formData.title, [activeLangTab]: e.target.value } as any})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">{t.category} *</label>
                    <select 
                      value={formData.category || ''}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                    >
                      <option value="">Seçin</option>
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat[lang]}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-bold text-gray-700 uppercase">{t.excerpt}</label>
                      <button onClick={() => autoTranslateField('excerpt')} className="text-[10px] font-bold text-brand-accent">AI ÇEVİR</button>
                    </div>
                    <textarea 
                      value={formData.excerpt?.[activeLangTab] || ''}
                      onChange={e => setFormData({...formData, excerpt: { ...formData.excerpt, [activeLangTab]: e.target.value } as any})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-primary/20 h-24 resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700 uppercase">{t.mainImage} *</label>
                  <div 
                    onClick={() => mainFileInputRef.current?.click()}
                    className="aspect-video w-full rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative"
                  >
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-400" size={32} />}
                    {isUploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-brand-primary">{uploadProgress}%</div>}
                  </div>
                  <input type="file" ref={mainFileInputRef} onChange={e => handleImageUpload(e, 'main')} className="hidden" accept="image/*" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700 uppercase">{t.content}</label>
                  <div className="flex gap-4">
                    <button onClick={() => autoTranslateField('content')} className="text-[10px] font-bold text-brand-accent">AI ÇEVİR</button>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-brand-primary flex items-center gap-1"><ImageIcon size={14}/> Resim</button>
                    <button onClick={handleVideoAdd} className="text-xs font-bold text-brand-accent flex items-center gap-1"><Video size={14}/> Video</button>
                  </div>
                </div>
                <textarea 
                  ref={contentInputRef}
                  value={formData.content?.[activeLangTab] || ''}
                  onChange={e => handleContentChange(e.target.value, activeLangTab)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-primary/20 h-64 font-sans text-lg"
                />
                <input type="file" ref={fileInputRef} onChange={e => handleImageUpload(e, 'content')} className="hidden" accept="image/*" />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleSave} className="flex-1 bg-brand-primary text-white py-4 rounded-xl font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20">
                  <Save size={20} /> {t.save}
                </button>
                <button onClick={resetForm} className="px-8 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100"> {t.cancel} </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{t.newsList}</h3>
                <div className="flex gap-3">
                  <button onClick={() => setImportMode(true)} className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2">
                    <Import size={20} className="text-brand-accent" /> {lang === 'tr' ? 'Wix\'ten Aktar' : 'Ji Wix Aktar'}
                  </button>
                  <button onClick={() => setIsAdding(true)} className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark flex items-center gap-2">
                    <Plus size={20} /> {t.addNews}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {news.map(item => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-2xl flex items-center gap-6 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                    <img src={item.imageUrl} className="w-24 h-24 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate text-lg">{item.title?.[lang] || item.title?.['tr'] || 'Başlıksız'}</h4>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 uppercase font-bold">
                        <span className="text-brand-accent">{CATEGORIES.find(c => c.id === item.category)?.[lang]}</span>
                        <span>•</span>
                        <span>{item.readTime}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(item)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 size={20} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-3 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={20} /></button>
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
