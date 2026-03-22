import { motion } from 'motion/react';
import { X, Calendar, User, Clock, Share2, Facebook, Twitter, Link as LinkIcon, Loader2 } from 'lucide-react';
import { NewsItem, CATEGORIES, Language, UI_STRINGS } from '../constants';
import { useState, useEffect } from 'react';
import { translateContent } from '../services/geminiService';

interface NewsDetailProps {
  item: NewsItem;
  lang: Language;
  onClose: () => void;
}

export const NewsDetail = ({ item, lang, onClose }: NewsDetailProps) => {
  const sourceLang = lang === 'tr' ? 'ku' : 'tr';
  const displayTitle = item.title ? (item.title[lang] || item.title[sourceLang] || '') : '';
  const displayExcerpt = item.excerpt ? (item.excerpt[lang] || item.excerpt[sourceLang] || '') : '';
  const displayContent = item.content ? (item.content[lang] || item.content[sourceLang] || '') : '';

  const t = UI_STRINGS[lang];
  const category = CATEGORIES.find(c => c.id === item.category)?.[lang] || item.category;

  const getShareUrl = () => {
    const origin = window.location.origin;
    return `${origin}/news/${item.id}?lang=${lang}`;
  };

  const shareUrl = getShareUrl();
  const shareTitle = displayTitle;

  const handleFacebookShare = () => {
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, 
      'facebook-share-dialog', 
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  const handleTwitterShare = () => {
    const width = 600;
    const height = 450;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, 
      'twitter-share-dialog', 
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert(lang === 'tr' ? 'Bağlantı kopyalandı!' : 'Lînk hat kopîkirin!');
  };

  const handleWebShare = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: displayExcerpt,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // MASAÜSTÜNDE: Windows menüsünü açmak yerine doğrudan Facebook penceresini açar.
      // Bu sayede Edge'e geçiş yapmaz, Chrome'da kalır.
      handleFacebookShare();
    }
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\[IMAGE:.*?\])/);
    return parts.map((part, index) => {
      const imgMatch = part.match(/\[IMAGE:(.*?)\]/);
      if (imgMatch) {
        const url = imgMatch[1];
        return (
          <div key={index} className="my-8">
            <img src={url} alt="Haber görseli" className="w-full rounded-2xl shadow-lg" referrerPolicy="no-referrer" />
          </div>
        );
      }
      return <p key={index} className="mb-6 whitespace-pre-wrap leading-relaxed text-gray-700">{part}</p>;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white w-full max-w-4xl h-full md:h-[95vh] md:rounded-3xl overflow-hidden flex flex-col relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"><X size={24} /></button>
        <div className="flex-grow overflow-y-auto scroll-smooth">
          <div className="relative h-[40vh] md:h-[50vh] w-full">
            <img src={item.imageUrl} alt={displayTitle} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
              <span className="inline-block px-3 py-1 bg-brand-accent text-white text-[10px] font-bold uppercase tracking-widest rounded mb-4">{category}</span>
              <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-4">{displayTitle}</h1>
              <div className="flex flex-wrap items-center gap-6 text-xs text-gray-300 font-medium uppercase tracking-widest">
                <span className="flex items-center gap-2"><User size={14} className="text-brand-accent" /> {item.author}</span>
                <span className="flex items-center gap-2"><Calendar size={14} className="text-brand-accent" /> {item.date}</span>
                <span className="flex items-center gap-2"><Clock size={14} className="text-brand-accent" /> {item.readTime}</span>
              </div>
            </div>
          </div>
          <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
            <div className="text-xl font-serif italic text-gray-500 border-l-4 border-brand-accent pl-6 mb-10 leading-relaxed">{displayExcerpt}</div>
            <div className="prose prose-lg max-w-none font-serif">{renderContent(displayContent)}</div>
            <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{t.share}</span>
                <div className="flex gap-2">
                  <button onClick={handleFacebookShare} className="p-3 bg-gray-50 hover:bg-[#1877F2] hover:text-white rounded-full transition-all"><Facebook size={20} /></button>
                  <button onClick={handleTwitterShare} className="p-3 bg-gray-50 hover:bg-[#1DA1F2] hover:text-white rounded-full transition-all"><Twitter size={20} /></button>
                  <button onClick={handleCopyLink} className="p-3 bg-gray-50 hover:bg-brand-accent hover:text-white rounded-full transition-all"><LinkIcon size={20} /></button>
                </div>
              </div>
              <button onClick={handleWebShare} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-colors"><Share2 size={16} /> {t.shareNews}</button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
