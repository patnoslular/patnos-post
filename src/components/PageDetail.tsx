import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePages } from '../hooks/usePages';

interface PageDetailProps {
  pageId: string;
  lang: 'tr' | 'ku';
  onClose: () => void;
}

export const PageDetail: React.FC<PageDetailProps> = ({ pageId, lang, onClose }) => {
  const { pages, loading } = usePages();
  const page = pages.find(p => p.id === pageId);

  const defaultTitles: Record<string, any> = {
    'about-us': { tr: 'Hakkımızda', ku: 'Derbarê Me De' },
    'imprint': { tr: 'Künye', ku: 'Kunya' },
    'contact': { tr: 'İletişim', ku: 'Têkilî' },
    'ads': { tr: 'Reklam', ku: 'Reklam' }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-2xl font-serif font-bold text-brand-primary">
            {page?.title[lang] || defaultTitles[pageId]?.[lang] || '...'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-8 md:p-12">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none font-serif leading-relaxed text-gray-700">
              {page?.content[lang] ? (
                page.content[lang].split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4">{paragraph}</p>
                ))
              ) : (
                <p className="text-gray-400 italic">
                  {lang === 'tr' ? 'İçerik henüz eklenmemiş.' : 'Naverok hîna nehatiye zêdekirin.'}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
