import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { NewsItem, Language, CATEGORIES } from '../constants';
import { Link } from 'react-router-dom';

interface NewsSliderProps {
  items: NewsItem[];
  lang: Language;
}

export const NewsSlider: React.FC<NewsSliderProps> = ({ items, lang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  const currentItem = items[currentIndex];
  const { title, excerpt, sourceLang = 'tr' } = currentItem;
  
  const displayTitle = title[lang] || title[sourceLang] || '';
  const displayExcerpt = excerpt[lang] || excerpt[sourceLang] || '';
  
  const categoryLabel = (CATEGORIES?.find(c => c.id === currentItem.category)?.[lang] || currentItem.category);

  return (
    <div className="relative w-full bg-brand-primary overflow-hidden rounded-2xl shadow-2xl group h-[500px] md:h-[600px]">
      <AnimatePresence mode="wait">
        <Link to={`/news/${currentItem.id}?lang=${lang}`} className="absolute inset-0 block overflow-hidden">
          <motion.div
            key={currentIndex}
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
          </Link>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="absolute bottom-10 right-10 flex gap-3 z-30">
          <button onClick={prev} className="p-3 bg-white/10 hover:bg-brand-accent text-white rounded-full transition-all backdrop-blur-md border border-white/20">
            <ChevronLeft size={24} />
          </button>
          <button onClick={next} className="p-3 bg-white/10 hover:bg-brand-accent text-white rounded-full transition-all backdrop-blur-md border border-white/20">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-10 left-10 flex gap-2 z-30">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 transition-all duration-500 rounded-full ${
                idx === currentIndex ? 'w-8 bg-brand-accent' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
