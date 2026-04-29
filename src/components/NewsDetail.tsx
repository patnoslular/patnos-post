import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Calendar, User, Clock, Share2, 
  MessageCircle, Bookmark, Copy, Check, Facebook, Twitter
} from 'lucide-react';
import { NewsItem, Language, CATEGORIES, UI_STRINGS } from '../constants';

interface NewsDetailProps {
  news: NewsItem[];
  lang: Language;
}

export const NewsDetail: React.FC<NewsDetailProps> = ({ news, lang: initialLang }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const lang = (searchParams.get('lang') as Language) || initialLang;
  const item = news.find(n => n.id === id);
  const t = UI_STRINGS[lang];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#f8fbff]">
        <h2 className="text-2xl font-anton text-gray-800 mb-4 uppercase">HABER BULUNAMADI</h2>
        <button 
          onClick={() => navigate(`/?lang=${lang}`)}
          className="flex items-center gap-2 text-brand-accent font-bold uppercase tracking-widest hover:underline"
        >
          <ArrowLeft size={18} /> {t.backHome}
        </button>
      </div>
    );
  }

  const displayTitle = item.title[lang] || item.title[lang === 'tr' ? 'ku' : 'tr'];
  const displayContent = item.content[lang] || item.content[lang === 'tr' ? 'ku' : 'tr'];
  const category = CATEGORIES.find(c => c.id === item.category)?.label[lang] || item.category;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(displayTitle)}`, '_blank');
  };

  return (
    <div className="bg-[#f8fbff] min-h-screen">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-screen-xl mx-auto px-4 py-8 md:py-16"
      >
        <button 
          onClick={() => navigate(`/?lang=${lang}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-accent mb-8 transition-colors font-bold uppercase text-xs tracking-widest"
        >
          <ArrowLeft size={16} /> {t.backHome}
        </button>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <header className="mb-10">
              <span className="inline-block px-3 py-1 bg-brand-accent text-white text-[10px] font-bold uppercase tracking-widest rounded mb-4">
                {category}
              </span>
              <h1 className="text-2xl md:text-5xl font-anton leading-[1.2] mb-6 uppercase tracking-normal">
                {displayTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-xs text-gray-400 font-medium uppercase tracking-widest bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <User size={14} className="text-brand-accent" />
                  </div>
                  <span>{item.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Calendar size={14} className="text-brand-accent" />
                  </div>
                  <span>{item.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Clock size={14} className="text-brand-accent" />
                  </div>
                  <span>{item.readTime}</span>
                </div>
              </div>
            </header>

            <figure className="relative rounded-2xl overflow-hidden mb-10 shadow-2xl">
              <img 
                src={item.imageUrl} 
                alt={displayTitle}
                className="w-full aspect-[16/9] object-cover"
                referrerPolicy="no-referrer"
              />
            </figure>

            <div className="flex gap-4 mb-8">
              <button onClick={shareOnFacebook} className="p-3 bg-[#1877F2] text-white rounded-xl shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center">
                <Facebook size={20} />
              </button>
              <button onClick={shareOnTwitter} className="p-3 bg-[#1DA1F2] text-white rounded-xl shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center">
                <Twitter size={20} />
              </button>
              <button className="p-3 bg-[#25D366] text-white rounded-xl shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center">
                <MessageCircle size={20} />
              </button>
              <button onClick={handleCopyLink} className="p-3 bg-white text-gray-700 rounded-xl shadow-lg hover:bg-gray-50 transition-all border border-gray-100 flex items-center justify-center gap-2">
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
            </div>

            <div className="prose prose-lg prose-slate max-w-none">
              <p className="text-gray-700 leading-[1.8] text-lg font-serif whitespace-pre-wrap first-letter:text-5xl first-letter:font-anton first-letter:float-left first-letter:mr-3 first-letter:text-brand-accent">
                {displayContent}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-anton mb-6 border-b border-gray-100 pb-4 uppercase tracking-widest">{t.popularNews}</h3>
              <div className="space-y-6">
                {news.slice(0, 5).filter(n => n.id !== id).map(item => (
                  <div key={item.id} className="group cursor-pointer" onClick={() => navigate(`/news/${item.id}?lang=${lang}`)}>
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt={item.title[lang]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-brand-accent tracking-widest mb-1 block">
                          {CATEGORIES.find(c => c.id === item.category)?.label[lang]}
                        </span>
                        <h4 className="text-sm font-anton leading-snug group-hover:text-brand-accent transition-colors line-clamp-2 uppercase">
                          {item.title[lang] || item.title[lang === 'tr' ? 'ku' : 'tr']}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">{item.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};
