import React from 'react';
import { motion } from 'motion/react';
import { Clock, ChevronRight } from 'lucide-react';
import { NewsItem, Language, CATEGORIES } from '../constants';
import { useNavigate } from 'react-router-dom';

interface NewsCardProps {
  item: NewsItem;
  lang: Language;
  featured?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, lang, featured }) => {
  const navigate = useNavigate();
  const displayTitle = item.title[lang] || item.title[lang === 'tr' ? 'ku' : 'tr'];
  const displayExcerpt = item.excerpt[lang] || item.excerpt[lang === 'tr' ? 'ku' : 'tr'];
  const categoryLabel = CATEGORIES.find(c => c.id === item.category)?.label[lang] || item.category;

  return (
    <motion.article 
      onClick={() => navigate(`/news/${item.id}?lang=${lang}`)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group cursor-pointer flex flex-col gap-4"
    >
      <div className="relative overflow-hidden rounded-lg aspect-[16/9]">
        <img 
          src={item.imageUrl} 
          alt={displayTitle}
          className="w-full h-full object-cover transition-transform duration-[8s] group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-brand-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded shadow-lg">
            {categoryLabel}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-widest mb-2 font-bold">
          <span>{item.date}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>{item.readTime} {lang === 'tr' ? 'OKUMA' : 'XWENDIN'}</span>
        </div>
        
        <h3 className="font-anton text-xl md:text-2xl uppercase leading-snug group-hover:text-brand-accent transition-colors mb-3 tracking-normal">
          {displayTitle}
        </h3>
        
        <p className="text-gray-600 leading-relaxed text-sm line-clamp-2">
          {displayExcerpt}
        </p>
        
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
          <div className="w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-[10px] font-bold">
            {item.author ? item.author[0] : '?'}
          </div>
          <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{item.author || 'Anonim'}</span>
        </div>
      </div>
    </motion.article>
  );
};
