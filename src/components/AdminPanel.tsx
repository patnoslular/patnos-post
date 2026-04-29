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
      alert(lang === 'tr' ? `Çeviri sırasında bir hata oluştu: ${error?.message || 'Bilinmeyen hata'}` : `Di dema wergerandinê de çewtiyek çêbû: ${error?.message || 'Çewtiya nenas'}`);
      
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
        const imageUrl = item.querySelector("enclosure")?.getAttribute("url") || item.querySelector("media\\:content")?.getAttribute("url") || "https://picsum.photos/seed/wix/800/600";

        const titleKu = await translateContent(titleTr, 'ku');
        const contentKu = await translateContent(descriptionTr, 'ku');

        const newsItem: Omit<NewsItem, 'id'> = {
          title: { tr: titleTr, ku: titleKu },
          excerpt: { tr: descriptionTr.substring(0, 200), ku: contentKu.substring(0, 200) },
          content: { tr: descriptionTr, ku: contentKu },
          category: 'general',
          author: 'Wix Import',
          date: new Date().toLocaleDateString('tr-TR'),
          imageUrl: imageUrl,
          readTime: calculateReadTime(descriptionTr)
        };
        await addNews(newsItem);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setImportMode(false);
    } finally {
      setIsImporting(false);
    }
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} ${lang === 'tr' ? 'DK' : 'DEQ'}`;
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'main' | 'content' | 'header-left' | 'header-right') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const { url: supabaseUrl, serviceKey } = getSupabaseConfig();
      let publicUrl = '';
      
      if (supabaseUrl && serviceKey && !supabaseUrl.includes('your-project')) {
        const adminClient = createClient(supabaseUrl, serviceKey);
        const fileName = `${Date.now()}-${file.name}`;
        const { error } = await adminClient.storage.from('news-images').upload(fileName, file);
        if (error) throw error;
        publicUrl = adminClient.storage.from('news-images').getPublicUrl(fileName).data.publicUrl;
      } else {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
        const data = await response.json();
        publicUrl = data.url;
      }

      if (target === 'header-left' || target === 'header-right') {
        const newSettings = { ...settings, [target === 'header-left' ? 'leftImageUrl' : 'rightImageUrl']: publicUrl };
        await updateSettings(newSettings);
      } else {
        updateFormDataWithUrl(publicUrl, target);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const updateFormDataWithUrl = (url: string, target: 'main' | 'content') => {
    if (target === 'main') {
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } else {
      const currentContent = formData.content?.[activeLangTab] || '';
      const imageTag = `\n\n[IMAGE:${url}]\n\n`;
      handleContentChange(currentContent + imageTag, activeLangTab);
    }
  };

  const handleContentChange = (val: string, l: Language) => {
    setFormData(prev => ({ ...prev, content: { ...prev.content, [l]: val } as any }));
  };

  const handleSave = async () => {
    if (!formData.title?.tr || !formData.category || !formData.imageUrl) {
      alert('Zorunlu alanları doldurun.');
      return;
    }
    const itemToSave = { ...formData, readTime: calculateReadTime(formData.content?.[activeLangTab] || '') } as NewsItem;
    if (editingId) await editNews(editingId, itemToSave);
    else await addNews(itemToSave as Omit<NewsItem, 'id'>);
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
    if (confirm('Silmek istediğinize emin misiniz?')) await removeNews(id);
  };

  const t = UI_STRINGS[lang];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">{t.adminPanel}</h2>
            <div className="flex bg-gray-200/50 p-1 rounded-xl">
              <button onClick={() => setActiveTab('news')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'news' ? 'bg-white text-brand-primary' : 'text-gray-500'}`}>HABERLER</button>
              <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'settings' ? 'bg-white text-brand-primary' : 'text-gray-500'}`}>AYARLAR</button>
            </div>
            <button onClick={() => setShowKeySettings(!showKeySettings)} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100"><Settings size={16} />ANAHTAR</button>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100"><LogOut size={16} />ÇIKIŞ</button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
          {showKeySettings && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
              <input type="password" value={manualApiKey} onChange={(e) => setManualApiKey(e.target.value)} placeholder="API Anahtarı..." className="w-full px-4 py-2 border rounded-xl mb-4" />
              <button onClick={saveManualKey} className="px-6 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold">KAYDET</button>
            </div>
          )}

          {activeTab === 'settings' ? (
            <div className="max-w-3xl mx-auto space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><ImageIcon className="text-brand-primary" />Header Görselleri</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Sol Logo</label>
                    <div onClick={() => leftHeaderInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      {settings.leftImageUrl ? <img src={settings.leftImageUrl} className="w-full h-full object-contain p-2" /> : <Plus />}
                    </div>
                    <input type="file" ref={leftHeaderInputRef} onChange={e => handleImageUpload(e, 'header-left')} className="hidden" accept="image/*" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Sağ Logo</label>
                    <div onClick={() => rightHeaderInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      {settings.rightImageUrl ? <img src={settings.rightImageUrl} className="w-full h-full object-contain p-2" /> : <Plus />}
                    </div>
                    <input type="file" ref={rightHeaderInputRef} onChange={e => handleImageUpload(e, 'header-right')} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          ) : isAdding ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingId ? 'Haberi Düzenle' : 'Yeni Haber Ekle'}</h3>
                <div className="flex gap-4">
                  <button onClick={translateAll} disabled={isTranslatingAll} className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 text-brand-accent rounded-lg text-xs font-bold">
                    {isTranslatingAll ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />} ÇEVİR VE GEÇ
                  </button>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveLangTab('tr')} className={`px-4 py-1.5 rounded-md text-sm ${activeLangTab === 'tr' ? 'bg-white shadow text-brand-primary' : 'text-gray-500'}`}>Türkçe</button>
                    <button onClick={() => setActiveLangTab('ku')} className={`px-4 py-1.5 rounded-md text-sm ${activeLangTab === 'ku' ? 'bg-white shadow text-brand-primary' : 'text-gray-500'}`}>Kurdî</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700 uppercase">{t.title} ({activeLangTab})</label>
                      <button onClick={() => autoTranslateField('title')} className="text-[10px] text-brand-accent font-bold">AI ÇEVİR</button>
                    </div>
                    <input type="text" value={formData.title?.[activeLangTab] || ''} onChange={e => setFormData({...formData, title: { ...formData.title, [activeLangTab]: e.target.value } as any})} className="w-full px-4 py-3 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase">Kategori</label>
                    <select value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border">
                      <option value="">Seçin</option>
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat[lang]}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Ana Görsel</label>
                  <div onClick={() => mainFileInputRef.current?.click()} className="aspect-video border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer overflow-hidden">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-gray-300" />}
                  </div>
                  <input type="file" ref={mainFileInputRef} onChange={e => handleImageUpload(e, 'main')} className="hidden" accept="image/*" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">{t.content}</label>
                  <div className="flex gap-4">
                    <button onClick={() => autoTranslateField('content')} className="text-[10px] text-brand-accent font-bold">AI ÇEVİR</button>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs text-brand-primary font-bold">Görsel Ekle</button>
                  </div>
                </div>
                <textarea value={formData.content?.[activeLangTab] || ''} onChange={e => handleContentChange(e.target.value, activeLangTab)} className="w-full px-4 py-3 rounded-xl border h-64 font-serif text-lg" />
                <input type="file" ref={fileInputRef} onChange={e => handleImageUpload(e, 'content')} className="hidden" accept="image/*" />
              </div>

              <div className="flex gap-4">
                <button onClick={handleSave} className="flex-1 bg-brand-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"><Save size={20} />{t.save}</button>
                <button onClick={resetForm} className="px-8 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">{t.cancel}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{t.newsList}</h3>
                <div className="flex gap-3">
                  <button onClick={() => setImportMode(true)} className="bg-white border px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Import size={20} className="text-brand-accent" /> Wix'ten Aktar</button>
                  <button onClick={() => setIsAdding(true)} className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20"><Plus size={20} /> {t.addNews}</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {news.map(item => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-2xl flex items-center gap-6 border border-transparent hover:border-gray-100 hover:bg-white transition-all">
                    <img src={item.imageUrl} className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-1 truncate">
                      <h4 className="font-bold text-gray-900 truncate">{item.title?.[lang] || item.title?.tr}</h4>
                      <p className="text-xs text-brand-accent font-bold mt-1 uppercase">{(CATEGORIES.find(c => c.id === item.category)?.[lang] || item.category)}</p>
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
