import { useState, useEffect, useCallback } from 'react';
import { NewsItem, Language, CATEGORIES, UI_STRINGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
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

  // Auto-advance logic: Increment progress
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

  // Handle slide transition when progress reaches 100
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
  
  // Safety checks for nested objects
  const title = currentItem.title || { tr: '', ku: '' };
  const excerpt = currentItem.excerpt || { tr: '', ku: '' };

  const displayTitle = title[lang] || title[sourceLang] || '';
  const displayExcerpt = excerpt[lang] || excerpt[sourceLang] || '';
  
  const categoryLabel = CATEGORIES.find(c => c.id === currentItem.category)?.[lang] || currentItem.category;

  return (
    <div className="relative w-full bg-brand-primary overflow-hidden rounded-2xl shadow-2xl group h-[500px] md:h-[600px]">
      <AnimatePresence mode="wait">
        <Link to={`/news/${currentItem.id}?lang=${lang}`} className="absolute inset-0 block">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full w-full"
          >
            <img 
              src={currentItem.imageUrl} 
              alt={displayTitle}
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            <div className="absolute bottom-24 left-0 right-0 p-8 md:p-12">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="bg-brand-accent text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-4 inline-block">
                  {categoryLabel}
                </span>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4 max-w-4xl">
                  {displayTitle}
                </h2>
                <p className="text-gray-300 text-lg md:text-xl line-clamp-2 max-w-2xl mb-6">
                  {displayExcerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={16} /> {currentItem.readTime} {lang === 'tr' ? 'okuma' : 'xwandin'}
                  </span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span>{currentItem.author}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </Link>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hidden md:block"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hidden md:block"
      >
        <ChevronRight size={24} />
      </button>

      {/* Numbered Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/20">
        <div className="flex items-stretch h-20 overflow-x-auto no-scrollbar">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleManualNav(idx)}
              className={`flex-1 min-w-[80px] relative flex flex-col items-center justify-center transition-all border-r border-white/10 last:border-r-0 ${
                currentIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span className={`text-2xl md:text-3xl font-black font-sans transition-all duration-300 ${
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
