import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Tag, Share2, Facebook, Twitter, MessageCircle, ArrowLeft } from 'lucide-react';
import { CATEGORIES, Language } from '../constants';
import { useNews } from '../hooks/useNews';

interface NewsDetailProps {
  lang: Language;
}

export function NewsDetail({ lang: propLang }: NewsDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const lang = (searchParams.get('lang') as Language) || propLang;
  
  const { news } = useNews();
  const item = news.find(n => n.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-2xl font-bold mb-4">Haber bulunamadı / Nûçe nehat dîtin</h2>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-brand-accent font-bold"
        >
          <ArrowLeft size={20} /> Geri Dön / Vegere
        </button>
      </div>
    );
  }

  const title = item.title[lang] || item.title[lang === 'tr' ? 'ku' : 'tr'];
  const content = item.content[lang] || item.content[lang === 'tr' ? 'ku' : 'tr'];
  const category = CATEGORIES.find(c => c.id === item.category)?.[lang] || item.category;

  const getShareUrl = () => {
    return `${window.location.origin}/news/${item.id}?lang=${lang}`;
  };

  const shareUrl = getShareUrl();

  const shareActions = [
    { 
      name: 'Facebook', 
      icon: <Facebook size={20} />, 
      color: 'bg-[#1877F2]',
      handler: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    { 
      name: 'X', 
      icon: <Twitter size={20} />, 
      color: 'bg-black',
      handler: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, '_blank')
    },
    { 
      name: 'WhatsApp', 
      icon: <MessageCircle size={20} />, 
      color: 'bg-[#25D366]',
      handler: () => window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`, '_blank')
    }
  ];

  const renderContent = (content: string) => {
    const parts = content.split(/(\[(?:IMAGE|VIDEO):.*?\])/);
    return parts.map((part, index) => {
      const imgMatch = part.match(/\[IMAGE:(.*?)\]/);
      const videoMatch = part.match(/\[VIDEO:(.*?)\]/);

      if (imgMatch) {
        const url = imgMatch[1];
        return (
          <div key={index} className="my-8 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <img 
              src={url} 
              alt="" 
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        );
      }

      if (videoMatch) {
        const url = videoMatch[1];
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        
        if (isYouTube) {
          let embedUrl = url;
          if (url.includes('watch?v=')) {
            embedUrl = url.replace('watch?v=', 'embed/');
          } else if (url.includes('youtu.be/')) {
            embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
          }
          
          return (
            <div key={index} className="my-8 aspect-video w-full rounded-2xl overflow-hidden shadow-lg">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        return (
          <div key={index} className="my-8 w-full rounded-2xl overflow-hidden shadow-lg">
            <video 
              src={url} 
              controls 
              className="w-full"
            />
          </div>
        );
      }

      return (
        <p key={index} className="mb-6 whitespace-pre-wrap leading-relaxed text-gray-700">
          {part}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <span className="bg-brand-accent text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
            {category}
          </span>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar size={14} />
            {item.date}
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight text-brand-primary">
          {title}
        </h1>

        <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-2xl mb-12 relative">
          <img 
            src={item.imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <div className="prose prose-lg max-w-none">
              {renderContent(content)}
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Tag size={18} className="text-brand-accent" />
                <span className="font-bold text-gray-900">#PatnosPost #Haber</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{lang === 'tr' ? 'PAYLAŞ' : 'PARVE BIKE'}</span>
                {shareActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={action.handler}
                    className={`${action.color} text-white p-3 rounded-full hover:scale-110 transition-transform shadow-md`}
                    aria-label={action.name}
                  >
                    {action.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 bg-white rounded-2xl shadow-xl border border-gray-50">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Share2 size={18} className="text-brand-accent" />
                {lang === 'tr' ? 'Haberi Paylaş' : 'Nûçeyê Parve Bike'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {lang === 'tr' 
                  ? 'Bu haberi sosyal medya hesaplarınızda paylaşarak daha fazla kişiye ulaşmasını sağlayabilirsiniz.'
                  : 'Hûn dikarin vê nûçeyê bi parvekirina li ser hesabên xwe yên medyaya civakî bigihînin bêtir kesan.'}
              </p>
              <div className="flex flex-col gap-3">
                {shareActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={action.handler}
                    className={`flex items-center justify-center gap-3 w-full py-3 rounded-xl text-white font-bold transition-all hover:brightness-110 shadow-sm ${action.color}`}
                  >
                    {action.icon}
                    {action.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
