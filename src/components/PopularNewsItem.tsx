import React from 'react';
import { NewsItem, Language, CATEGORIES } from '../constants';
import { Link } from 'react-router-dom';

interface PopularNewsItemProps {
  item: NewsItem;
  idx: number;
  lang: Language;
}

export const PopularNewsItem: React.FC<PopularNewsItemProps> = ({ item, idx, lang }) => {
  const sourceLang = lang === 'tr' ? 'ku' : 'tr';
  const title = item.title || { tr: '', ku: '' };
  const displayTitle = title[lang] || title[sourceLang] || '';

  return (
    <Link to={`/news/${item.id}?lang=${lang}`} className="flex gap-4 group cursor-pointer">
      <span className="text-4xl font-serif font-black text-gray-300 group-hover:text-brand-accent transition-all duration-300 transform group-hover:scale-110">{idx + 1}</span>
      <div>
        <h4 className="font-bold text-sm leading-snug group-hover:underline decoration-brand-accent underline-offset-4">{displayTitle}</h4>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1 block">
          {CATEGORIES && Array.isArray(CATEGORIES) ? (CATEGORIES.find(c => c.id === item.category)?.[lang] || item.category) : item.category}
        </span>
      </div>
    </Link>
  );
};
