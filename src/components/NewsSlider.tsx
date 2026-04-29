import { useState, useEffect, useCallback } from 'react';
import { NewsItem, Language, CATEGORIES, UI_STRINGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsSliderProps {
  items: NewsItem[];
  lang: Language;
}

export const NewsSlider = ({ items, lang }: NewsSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setProgress(0);
  }, [items.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setProgress(0);
  };

  // Otomatik ilerleme mantığı
  useEffect(() => {
    if (!items.length) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, items.length]);

  useEffect(() => {
    if (progress >= 100) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setProgress(0);
    }
  }, [progress, items.length]);

  const handleManualNav = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  if (!items.length) return null;

  const currentItem = items[currentIndex];
  const sourceLang = lang === 'tr' ? 'ku' : 'tr';
  
  const title = currentItem.title || { tr: '', ku: '' };
  const excerpt = currentItem.excerpt || { tr: '', ku: '' };

  const displayTitle = title[lang] || title[sourceLang] || '';
  const displayExcerpt = excerpt[lang] || excerpt[sourceLang] || '';
  
  const categoryLabel = (CATEGORIES?.find(c => c.id === currentItem.category)?.[lang] || currentItem.category);

  return (
    <div className="relative w-full bg-brand-primary overflow-hidden rounded-2xl shadow-2xl group h-[500px] md:h-[600px]">
      <AnimatePresence mode="wait">
        <Link 
          to={`/news/${currentItem.id}?lang=${lang}`} 
          key={currentIndex}
          className="absolute inset-0 block overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full w-full"
          >
            <img 
              src={currentItem.imageUrl} 
              alt={displayTitle}
              className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            
            {/* İçerik Alanı - Altta konumlandırıldı */}
            <div className="absolute inset-0 flex flex-col justify-end pb-32 px-10 md:px-16 max-w-7xl mx-auto z-20">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-brand-accent text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded shadow-lg">
                    {categoryLabel}
                  </span>
                  <div className="h-[1px] w-12 bg-white/30"></div>
                  <span className="text-white/80 text-[10px] font-black tracking-widest uppercase">{currentItem.date}</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl lg:text-7xl font-anton text-white leading-[1.2] mb-6 max-w-4xl tracking-normal uppercase drop-shadow-2xl">
                  {displayTitle}
                </h2>
                
                <p className="text-white text-lg md:text-2xl font-medium line-clamp-2 max-w-3xl mb-10 leading-relaxed drop-shadow-lg">
                  {displayExcerpt}
                </p>
                
                <div className="flex items-center gap-6 text-[10px] font-black tracking-widest text-white uppercase bg-black/40 w-fit px-4 py-2 rounded-lg backdrop-blur-sm">
                  <span className="flex items-center gap-2 text-brand-accent">
                    <Clock size={14} /> {currentItem.readTime}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
                    {currentItem.author}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </Link>
      </AnimatePresence>

      {/* Navigasyon Okları */}
      <button 
        onClick={(e) => { e.preventDefault(); prevSlide(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hidden md:block z-30"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={(e) => { e.preventDefault(); nextSlide(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hidden md:block z-30"
      >
        <ChevronRight size={24} />
      </button>

      {/* Alt Navigasyon Çubuğu */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/20 z-30">
        <div className="flex items-stretch h-20 overflow-x-auto no-scrollbar">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleManualNav(idx)}
              className={`flex-1 min-w-[80px] relative flex flex-col items-center justify-center transition-all border-r border-white/10 last:border-r-0 ${
                currentIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span className={`text-2xl md:text-3xl font-black transition-all duration-300 font-anton ${
                currentIndex === idx ? 'text-brand-accent scale-110' : 'text-white/40'
              }`}>
                {idx + 1}
              </span>
              {currentIndex === idx && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                  <motion.div 
                    className="h-full bg-brand-accent shadow-[0_0_10px_rgba(255,107,0,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
