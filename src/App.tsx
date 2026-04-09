import React, { useState, useEffect, useRef, useMemo } from 'react';
import { onValue } from 'firebase/database';
import { 
  Search, 
  X, 
  ArrowLeft, 
  Share2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Play,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { videosRef, slidersRef, adsRef } from './firebase';
import { Video, Slider, Ad } from './types';

// --- Constants ---
const ITEMS_PER_PAGE = 15;
const AD_LINK = "https://benevolencecompromisefaint.com/mhesd05rv?key=33ec68ccce11f5dea9583de1d280f5c3";

// --- Helper: Trigger Ad ---
const triggerAd = () => {
  // @ts-ignore - Monetag SDK
  if (window.show_10849572) {
    // @ts-ignore
    window.show_10849572().then(() => {
      console.log('Ad shown');
    }).catch((e: any) => {
      console.error('Ad failed', e);
      // Fallback: open ad link in new tab
      window.open(AD_LINK, '_blank');
    });
  } else {
    window.open(AD_LINK, '_blank');
  }
};

export default function App() {
  // --- State ---
  const [videos, setVideos] = useState<Video[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentView, setCurrentView] = useState<'home' | 'player'>('home');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- Refs ---
  const searchRef = useRef<HTMLDivElement>(null);
  const sliderInterval = useRef<NodeJS.Timeout | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const unsubVideos = onValue(videosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ key, ...data[key] }));
        setVideos(list.reverse());
      }
      setLoading(false);
    });

    const unsubSliders = onValue(slidersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ key, ...data[key] }));
        setSliders(list.reverse());
      }
    });

    const unsubAds = onValue(adsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ key, ...data[key] }));
        setAds(list);
      }
    });

    return () => {
      unsubVideos();
      unsubSliders();
      unsubAds();
    };
  }, []);

  // --- Slider Logic ---
  useEffect(() => {
    if (sliders.length > 1) {
      sliderInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % sliders.length);
      }, 5000);
    }
    return () => {
      if (sliderInterval.current) clearInterval(sliderInterval.current);
    };
  }, [sliders]);

  // --- Derived Data ---
  const categories = useMemo(() => {
    const cats = new Set(videos.map(v => v.category));
    return ['All', ...Array.from(cats).sort()];
  }, [videos]);

  const filteredVideos = useMemo(() => {
    let list = videos;
    if (selectedCategory !== 'All') {
      list = list.filter(v => v.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v => v.title.toLowerCase().includes(q));
    }
    return list;
  }, [videos, selectedCategory, searchQuery]);

  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return videos.filter(v => v.title.toLowerCase().includes(q)).slice(0, 5);
  }, [videos, searchQuery]);

  // Pagination & Ad Injection
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageVideos = filteredVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    // Inject ads randomly (e.g., every 5 videos)
    const result: (Video | Ad)[] = [];
    pageVideos.forEach((video, index) => {
      result.push(video);
      if ((index + 1) % 5 === 0 && ads.length > 0) {
        const randomAd = ads[Math.floor(Math.random() * ads.length)];
        result.push({ ...randomAd, isAd: true } as any);
      }
    });
    return result;
  }, [filteredVideos, currentPage, ads]);

  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);

  // --- Handlers ---
  const handleVideoClick = (video: Video) => {
    triggerAd();
    setSelectedVideo(video);
    setCurrentView('player');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentView('home');
    setSelectedVideo(null);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setShowSuggestions(false);
    setCurrentPage(1);
    setCurrentView('home');
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    setCurrentView('home');
    setSearchQuery('');
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Renderers ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">Loading OnFlix...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-600/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#212121] border-b border-white/10 px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {currentView === 'player' && (
            <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleBack}>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-[#212121]">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOvZbUbROccttkrrmZo2qhNVr5KpNzbuKWb5UWBt5gz4A5HUuR_KOIyIOF&s=10" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bold text-lg hidden sm:block">OnFlix</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl relative" ref={searchRef}>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search viral video..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="w-full bg-[#303030] border border-[#444] rounded-full py-2 pl-4 pr-10 focus:outline-none focus:border-blue-500 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              )}
              <Search size={20} className="text-gray-400" />
            </div>
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#212121] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                {suggestions.map(v => (
                  <div 
                    key={v.key}
                    onClick={() => handleVideoClick(v)}
                    className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0"
                  >
                    <Search size={16} className="text-gray-500" />
                    <span className="text-sm truncate">{v.title}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="pb-20">
        {currentView === 'home' ? (
          <div className="space-y-6">
            {/* Hero Slider */}
            {sliders.length > 0 && (
              <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden group">
                <div 
                  className="flex transition-transform duration-700 ease-out h-full"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {sliders.map((slide) => (
                    <div 
                      key={slide.key} 
                      className="min-w-full h-full relative cursor-pointer"
                      onClick={() => slide.clickable === 'true' && slide.clickURL && window.open(slide.clickURL, '_blank')}
                    >
                      <img 
                        src={slide.thumbnailURL} 
                        className="w-full h-full object-cover" 
                        alt="Slider"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  ))}
                </div>
                
                {/* Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {sliders.map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${currentSlide === i ? 'bg-white w-6' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category Bar */}
            <div className="px-4 overflow-x-auto no-scrollbar flex gap-3 py-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-white text-black' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Intro Text */}
            <div className="px-4 py-2">
              <div className="border-l-4 border-white pl-4">
                <h2 className="text-xl font-bold">OnFlix - Viral Video Link & Leaked MMS 2026</h2>
                <p className="text-gray-400 text-sm mt-1">Top Bangladeshi Viral Video & Leaked MMS Links | Hatia Uno Viral, BD Hot Desi Video 2026.</p>
              </div>
            </div>

            {/* Video Grid */}
            <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedItems.map((item, idx) => {
                if ('isAd' in item) {
                  return (
                    <div 
                      key={`ad-${idx}`}
                      onClick={() => window.open(item.clickURL, '_blank')}
                      className="bg-[#212121] rounded-xl overflow-hidden border border-white/5 cursor-pointer group"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={item.thumbnailURL} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          alt="Ad"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Sponsor</div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-sm line-clamp-2 text-blue-400">{item.title || 'Sponsored Content'}</h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Advertisement</span>
                          <ExternalLink size={14} className="text-gray-500" />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={item.key}
                    onClick={() => handleVideoClick(item)}
                    className="bg-[#212121] rounded-xl overflow-hidden border border-white/5 cursor-pointer group"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={item.thumbnailURL} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={item.title}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                      <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold">HD</div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm line-clamp-2 group-hover:text-red-500 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span>OnFlix</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-8">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-2 bg-[#212121] rounded-full disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-[#212121] text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-2 bg-[#212121] rounded-full disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Player Section */}
            <div className="aspect-video bg-black w-full relative group">
              <iframe 
                src={selectedVideo?.embedLink.includes('youtube.com') 
                  ? `${selectedVideo.embedLink.replace('watch?v=', 'embed/')}${selectedVideo.embedLink.includes('?') ? '&' : '?'}autoplay=1`
                  : selectedVideo?.embedLink
                }
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Video Player"
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    const iframe = document.querySelector('iframe');
                    iframe?.requestFullscreen();
                  }}
                  className="p-2 bg-black/60 rounded-full hover:bg-black/80"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4 space-y-4">
              <h1 className="text-xl font-bold leading-tight">{selectedVideo?.title}</h1>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <img 
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOvZbUbROccttkrrmZo2qhNVr5KpNzbuKWb5UWBt5gz4A5HUuR_KOIyIOF&s=10" 
                      alt="Channel" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Viral Video +</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Premium Channel</p>
                  </div>
                  <a 
                    href="https://t.me/bdvirallink2k26" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 px-4 py-2 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Join Telegram
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.share({ title: selectedVideo?.title, url: window.location.href });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
                  >
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>
                  {selectedVideo?.downloadLink && (
                    <button 
                      onClick={() => {
                        triggerAd();
                        window.open(selectedVideo.downloadLink, '_blank');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
                    >
                      <Download size={18} />
                      <span>Download</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedVideo?.description || 'No description provided.'}
                </p>
              </div>

              {/* Related Videos */}
              <div className="pt-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Play size={20} className="text-red-600" />
                  Related Videos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos
                    .filter(v => v.category === selectedVideo?.category && v.key !== selectedVideo?.key)
                    .slice(0, 6)
                    .map(v => (
                      <div 
                        key={v.key}
                        onClick={() => handleVideoClick(v)}
                        className="flex gap-3 bg-[#212121] p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-32 aspect-video flex-shrink-0 relative overflow-hidden rounded-md">
                          <img 
                            src={v.thumbnailURL} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            alt={v.title}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold line-clamp-2 group-hover:text-red-500 transition-colors">{v.title}</h4>
                          <p className="text-[10px] text-gray-500 mt-1">OnFlix • {v.category}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#212121] border-t border-white/10 px-4 py-10 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOvZbUbROccttkrrmZo2qhNVr5KpNzbuKWb5UWBt5gz4A5HUuR_KOIyIOF&s=10" 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-bold text-xl">OnFlix</span>
        </div>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Empowering connections securely. Premium video sharing platform for the best viral content.
        </p>
        <div className="flex justify-center gap-6 text-sm font-medium text-gray-400">
          <a href="https://t.me/bdvirallink2k26" className="hover:text-white transition-colors">Telegram</a>
          <a href="https://youtube.com/@robiulislamrakib591-b7t" className="hover:text-white transition-colors">YouTube</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest pt-4">
          &copy; {new Date().getFullYear()} OnFlix. All rights reserved. 18+ Adults Only.
        </p>
      </footer>
    </div>
  );
}
