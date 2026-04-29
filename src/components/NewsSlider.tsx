import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES, NewsItem, Language } from '../constants';

interface NewsSliderProps {
  items: NewsItem[];
  lang: Language;
}

export const NewsSlider = ({ items, lang }: NewsSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const title = currentItem.title || {};
  const sourceLang = lang === 'tr' ? 'ku' : 'tr';
  const displayTitle = title[lang] || title[sourceLang] || '';
  const categoryLabel = (Array.isArray(CATEGORIES) ? (CATEGORIES.find(c => c && c.id === currentItem.category)?.[lang] || currentItem.category) : currentItem.category);

  return (
    <div className="relative w-full bg-brand-primary overflow-hidden rounded-2xl shadow-2xl group h-[500px] md:h-[600px]">
      <AnimatePresence mode="wait">
        <motion.div key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
          <Link to={`/news/${currentItem.id}?lang=${lang}`} className="relative block h-full w-full overflow-hidden">
            <div className="h-full w-full">
              <img src={currentItem.imageUrl} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end pb-32 px-10 md:px-16 max-w-7xl mx-auto z-20">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-brand-accent text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded shadow-lg">{categoryLabel}</span>
                  <div className="h-[1px] w-12 bg-white/30"></div>
                  <span className="text-white/80 text-[10px] font-black tracking-widest uppercase">{currentItem.date}</span>
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-7xl font-anton text-white leading-[1.2] mb-6 max-w-4xl tracking-normal uppercase drop-shadow-2xl">{displayTitle}</h2>
                <div className="flex items-center gap-2 text-white/90 text-sm font-bold uppercase tracking-widest"><span className="w-8 h-[2px] bg-brand-accent"></span><span>{currentItem.author}</span></div>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-30 pointer-events-none">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + items.length) % items.length); }} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-brand-accent transition-all transform hover:scale-110 active:scale-95 shadow-xl border border-white/20"><ChevronLeft size={24} /></button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % items.length); }} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-brand-accent transition-all transform hover:scale-110 active:scale-95 shadow-xl border border-white/20"><ChevronRight size={24} /></button>
      </div>
    </div>
  );
};
