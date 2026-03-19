import { NewsItem, Language, CATEGORIES, UI_STRINGS } from '../constants';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface NewsCardProps {
  item: NewsItem;
  lang: Language;
  featured?: boolean;
}

export const NewsCard = ({ item, lang, featured = false }: NewsCardProps) => {
  const sourceLang = lang === 'tr' ? 'ku' : 'tr';
  const displayTitle = item.title ? (item.title[lang] || item.title[sourceLang] || '') : '';
  const displayExcerpt = item.excerpt ? (item.excerpt[lang] || item.excerpt[sourceLang] || '') : '';
  
  const categoryLabel = CATEGORIES.find(c => c.id === item.category)?.[lang] || item.category;

  return (
    <Link to={`/news/${item.id}`} className="block">
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`group cursor-pointer flex flex-col ${featured ? 'md:flex-row gap-6' : 'gap-4'}`}
      >
        <div className={`relative overflow-hidden rounded-lg ${featured ? 'md:w-2/3 aspect-video' : 'aspect-[4/3]'}`}>
          <img 
            src={item.imageUrl} 
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-brand-accent text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
              {categoryLabel}
            </span>
          </div>
        </div>
        
        <div className={`flex flex-col ${featured ? 'md:w-1/3 justify-center' : ''}`}>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-widest mb-2">
            <span>{item.date}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>{item.readTime} {lang === 'tr' ? 'OKUMA' : 'XWENDIN'}</span>
          </div>
          
          <h3 className={`font-serif font-bold leading-tight group-hover:text-brand-accent transition-colors ${featured ? 'text-3xl md:text-4xl mb-4' : 'text-xl mb-2'}`}>
            {displayTitle}
          </h3>
          
          <p className={`text-gray-600 leading-relaxed ${featured ? 'text-lg line-clamp-3' : 'text-sm line-clamp-2'}`}>
            {displayExcerpt}
          </p>
          
          <div className="mt-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
              {item.author ? item.author[0] : '?'}
            </div>
            <span className="text-xs font-medium text-gray-700">{item.author || 'Anonim'}</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
};
