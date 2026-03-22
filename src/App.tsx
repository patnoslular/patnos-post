import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNews } from './hooks/useNews';
import { useSettings } from './hooks/useSettings';
import { NewsCard } from './components/NewsCard';
import { PopularNewsItem } from './components/PopularNewsItem';
import { NewsSlider } from './components/NewsSlider';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { NewsDetail } from './components/NewsDetail';
import { CATEGORIES, UI_STRINGS, Language, NewsItem, MENU_LINKS } from './constants';
import { isSupabaseConfigured } from './supabase';
import { SupabaseSetup } from './components/SupabaseSetup';
import { Menu, Search, Globe, TrendingUp, ChevronRight, Mail, Facebook, Twitter, Instagram, Settings, LogOut, Languages, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';

const NewsDetailWrapper = ({ news, lang }: { news: NewsItem[], lang: Language }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = news.find(n => n.id === id);

  if (!item) return null;

  return (
    <NewsDetail 
      item={item} 
      lang={lang} 
      onClose={() => navigate(`/?lang=${lang}`)} 
    />
  );
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isHome, setIsHome] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lang, setLang] = useState<Language>('ku');
  const [isConfigured, setIsConfigured] = useState(() => isSupabaseConfigured());
  const { news, loading } = useNews();
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const t = UI_STRINGS[lang];

  // Sayfa yüklendiğinde dildeki URL parametresini kontrol et
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') as Language;
    
    if (urlLang && (urlLang === 'tr' || urlLang === 'ku')) {
      setLang(urlLang);
      localStorage.setItem('lang', urlLang);
    } else {
      const savedLang = localStorage.getItem('lang') as Language;
      if (savedLang) setLang(savedLang);
    }

    const adminStatus = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(adminStatus);
  }, []);

  // Dil veya sayfa değiştiğinde URL'yi otomatik güncelle
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('lang') !== lang) {
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());
    }
    setIsHome(location.pathname === '/');
  }, [lang, location.pathname]);

  if (!isConfigured) {
    return <SupabaseSetup onComplete={() => setIsConfigured(true)} />;
  }

  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('is_admin');
    setIsAdmin(false);
    setShowAdmin(false);
  };

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setIsHome(false);
    navigate(`/?lang=${lang}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    setIsHome(true);
    setActiveCategory('all');
    navigate(`/?lang=${lang}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredNews = activeCategory === 'all' 
    ? news 
    : news.filter(item => item.category === activeCategory);

  const sliderNews = news.slice(0, 10);
  const sideNews = news.slice(0, 4);
  const gridNews = news.slice(4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white">
        <div className="bg-[#E2C2A4] py-2 md:py-4 px-4 border-b border-black relative z-50">
          <div className="max-w-7xl mx-auto flex justify-between md:justify-center items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all shadow-sm">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:flex flex-wrap justify-center items-center gap-2 md:gap-4">
              {MENU_LINKS.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 border-2 border-[#4A69BD] bg-white text-[#4A69BD] text-[10px] font-bold tracking-widest hover:bg-[#4A69BD] hover:text-white transition-all shadow-sm">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="md:ml-2 md:pl-2 md:border-l md:border-black/20 flex items-center gap-2">
              {isAdmin ? (
                <>
                  <button onClick={() => setShowAdmin(true)} className="px-3 md:px-4 py-1.5 border-2 border-brand-accent bg-brand-accent text-white text-[10px] font-bold tracking-widest hover:bg-white hover:text-brand-accent transition-all shadow-sm flex items-center gap-2">
                    <Settings size={12} /> <span className="hidden sm:inline">{t.panel}</span>
                  </button>
                  <button onClick={handleLogout} className="p-1.5 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm rounded">
                    <LogOut size={12} />
                  </button>
                </>
              ) : (
                <button onClick={() => setShowLogin(true)} className="px-3 md:px-4 py-1.5 border-2 border-gray-800 bg-gray-800 text-white text-[10px] font-bold tracking-widest hover:bg-white hover:text-gray-800 transition-all shadow-sm">
                  {t.editorLogin}
                </button>
              )}
            </div>
          </div>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden absolute top-full left-0 right-0 bg-[#E2C2A4] border-b border-black overflow-hidden shadow-xl">
                <div className="p-4 flex flex-col gap-2">
                  {MENU_LINKS.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="w-full text-center px-4 py-3 border-2 border-[#4A69BD] bg-white text-[#4A69BD] text-xs font-bold tracking-widest hover:bg-[#4A69BD] hover:text-white transition-all shadow-sm">
                      {link.label}
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <header className="bg-white relative">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button onClick={() => changeLang('ku')} className={`group relative px-4 py-2 rounded-full text-[10px] font-black tracking-tighter transition-all duration-300 transform hover:scale-110 shadow-lg ${lang === 'ku' ? 'bg-gradient-to-r from-brand-accent to-orange-600 text-white ring-4 ring-orange-200' : 'bg-white text-gray-800 hover:bg-gray-100'}`}>
                KURDÎ
              </button>
              <button onClick={() => changeLang('tr')} className={`group relative px-4 py-2 rounded-full text-[10px] font-black tracking-tighter transition-all duration-300 transform hover:scale-110 shadow-lg ${lang === 'tr' ? 'bg-gradient-to-r from-brand-accent to-orange-600 text-white ring-4 ring-orange-200' : 'bg-white text-gray-800 hover:bg-gray-100'}`}>
                TÜRKÇE
              </button>
            </div>
            <img src="https://static.wixstatic.com/media/7e2174_e230755889444a418254ba8ec11e24f7~mv2.png" className="max-w-full h-auto mx-auto max-h-[250px] object-contain drop-shadow-2xl cursor-pointer" alt="Banner" referrerPolicy="no-referrer" onClick={handleLogoClick} />
            <div className="mt-1 md:mt-2 overflow-hidden">
              <motion.p key={lang} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] sm:text-xs md:text-2xl font-cursive text-gray-800 whitespace-nowrap px-4">
                {lang === 'tr' ? 'Gerçeğin Peşinde, Geleceğin İzinde' : 'Di Peşiya Rastiyê De, Di Şopa Pêşerojê De'}
              </motion.p>
            </div>
          </div>
          <div className="bg-black text-white py-2 overflow-hidden whitespace-nowrap">
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center">
              <span className="bg-brand-accent text-white text-[10px] font-bold px-2 py-0.5 rounded mr-4 shrink-0">{t.breakingNews}</span>
              <div className="flex gap-12 animate-marquee">
                {news.slice(0, 5).map(item => (
                  <button key={item.id} className="text-[11px] font-medium cursor-pointer hover:text-brand-accent transition-colors" onClick={() => navigate(`/news/${item.id}?lang=${lang}`)}>
                    {item.title ? (item.title[lang] || item.title[lang === 'tr' ? 'ku' : 'tr']) : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-2 md:px-8 overflow-x-auto no-scrollbar">
            <ul className="flex justify-start md:justify-center gap-3 md:gap-8 py-2 md:py-4 min-w-max mx-auto">
              {CATEGORIES.map(cat => (
                <li key={cat.id}>
                  <button onClick={() => handleCategoryClick(cat.id)} className={`text-[9px] md:text-xs font-bold uppercase tracking-widest transition-colors relative pb-1 ${activeCategory === cat.id && isHome ? 'text-brand-accent' : 'text-gray-500 hover:text-brand-primary'}`}>
                    {cat[lang]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="flex-grow max-w-7xl mx-auto px-4 md:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={
              <>
                {isHome && activeCategory === 'all' ? (
                  <>
                    <section className="mb-16"><NewsSlider items={sliderNews} lang={lang} /></section>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {sideNews.map(item => (<NewsCard key={item.id} item={item} lang={lang} />))}
                      </div>
                      <aside className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-6 text-brand-accent"><TrendingUp size={20} /><h2 className="text-xl font-serif font-bold text-brand-primary">{t.popularNews}</h2></div>
                        <div className="space-y-6">{news.slice(0, 5).map((item, idx) => (<PopularNewsItem key={item.id} item={item} idx={idx} lang={lang} />))}</div>
                      </aside>
                    </div>
                    <section className="mb-16">
                      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4"><h2 className="text-3xl font-serif font-bold">{t.latestNews}</h2></div>
                      <div className="news-grid">{gridNews.map(item => (<NewsCard key={item.id} item={item} lang={lang} />))}</div>
                    </section>
                  </>
                ) : (
                  <section className="mb-16">
                    <h2 className="text-3xl font-serif font-bold mb-8 border-b border-gray-200 pb-4">{activeCategory === 'all' ? t.latestNews : CATEGORIES.find(c => c.id === activeCategory)?.[lang]}</h2>
                    <div className="news-grid">{filteredNews.map(item => (<NewsCard key={item.id} item={item} lang={lang} />))}</div>
                  </section>
                )}
              </>
            } />
            <Route path="/news/:id" element={<NewsDetailWrapper news={news} lang={lang} />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="md:col-span-2"><h2 className="text-3xl font-serif italic mb-4">The Patnos Post</h2><p className="text-gray-500 text-sm leading-relaxed max-w-md">{t.aboutUsDesc}</p></div>
              <div><h4 className="font-bold uppercase text-xs tracking-widest mb-6">{t.corporate}</h4><ul className="space-y-3 text-sm text-gray-500"><li><a href="#" className="hover:text-brand-accent transition-colors">{t.aboutUs}</a></li><li><a href="#" className="hover:text-brand-accent transition-colors">{t.imprint}</a></li><li><a href="#" className="hover:text-brand-accent transition-colors">{t.contact}</a></li></ul></div>
              <div><h4 className="font-bold uppercase text-xs tracking-widest mb-6">{t.socialMedia}</h4><div className="flex gap-4"><a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-brand-accent hover:text-white transition-all"><Facebook size={18} /></a><a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-brand-accent hover:text-white transition-all"><Twitter size={18} /></a><a href="#" className="p-2 bg-gray-100 rounded-full hover:bg-brand-accent hover:text-white transition-all"><Instagram size={18} /></a></div></div>
            </div>
            <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>{t.rights}</span></div>
          </div>
        </footer>

        <AnimatePresence>
          {showLogin && (<LoginModal onClose={() => setShowLogin(false)} onSuccess={() => { setShowLogin(false); setIsAdmin(true); setShowAdmin(true); }} lang={lang} />)}
          {showAdmin && (<AdminPanel onClose={() => setShowAdmin(false)} onLogout={handleLogout} lang={lang} />)}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
