import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  Search, 
  User as UserIcon, 
  ShoppingCart, 
  Heart,
  LogOut,
  X,
  ChevronDown,
  Bell,
  Settings,
  Smartphone
} from 'lucide-react';
import { BRANDING } from '../config/branding';
import { LanguageSelector } from './LanguageSelector';
import { authApi, User } from '../api/auth';
import { StorefrontBottomNav } from './StorefrontBottomNav';
import { getFavorites } from '../utils/favorites';
import { getBranding } from '../utils/branding';

interface StorefrontLayoutProps {
  children: ReactNode;
  showSearchBar?: boolean;
}

export function StorefrontLayout({ children, showSearchBar = true }: StorefrontLayoutProps) {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [branding, setBranding] = useState(getBranding());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const updateCounts = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = Array.isArray(cart) 
        ? cart.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 1), 0)
        : 0;
      setCartCount(count);
    } catch {
      setCartCount(0);
    }

    try {
      setFavCount(getFavorites().length);
    } catch {
      setFavCount(0);
    }
  };

  useEffect(() => {
    // Check if running in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches || 
                                (navigator as any).standalone === true ||
                                document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMedia);
    };
    checkStandalone();

    // Listen for beforeinstallprompt event (Android & Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    authApi.getMe()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
      
    updateCounts();

    const handleCartUpdate = () => updateCounts();
    const handleFavUpdate = () => updateCounts();
    const handleBrandingUpdate = () => setBranding(getBranding());

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('favorites-updated', handleFavUpdate);
    window.addEventListener('branding-updated', handleBrandingUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('favorites-updated', handleFavUpdate);
      window.removeEventListener('branding-updated', handleBrandingUpdate);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowIosInstallModal(true);
    }
  };

  // Sync search query from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [location.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/catalog?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/catalog');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (location.pathname === '/catalog' || location.pathname === '/') {
      navigate(location.pathname);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Modern Marketplace Compact Header (matching reference image) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          {/* Top row: Brand on left, Notification & Settings on right */}
          <div className="h-13 sm:h-16 flex items-center justify-between gap-3">
            {/* Left: Store Name (Do NOT touch store name as requested!) */}
            <Link 
              to="/" 
              className="flex items-center gap-2 shrink-0 group focus:outline-hidden"
            >
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.storeName} className="h-6 sm:h-8 object-contain" />
              ) : (
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  {branding.storeName}
                </span>
              )}
            </Link>

            {/* Center: Search Bar on Desktop */}
            {showSearchBar && (
              <form 
                onSubmit={handleSearchSubmit}
                className="hidden md:flex items-center relative flex-1 max-w-sm lg:max-w-md mx-4"
              >
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('customer.searchProducts')}
                    className="w-full pl-10 pr-8 py-2 bg-slate-100 hover:bg-slate-100/90 focus:bg-white border border-slate-200/80 focus:border-blue-500 rounded-xl outline-hidden text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Right: Notification Bell, Settings & Language Selector (matching reference image) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Ekranga qo'shish Button (Android, iOS, Desktop PWA) */}
              {!isStandalone && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-100 transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
                  title="Ekranga qo'shish"
                >
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="hidden sm:inline">Ekranga qo'shish</span>
                  <span className="inline sm:hidden">Qo'shish</span>
                </button>
              )}
              {/* Notification Bell with red indicator dot like in reference image */}
              <button
                type="button"
                onClick={() => {
                  setShowNotificationToast(true);
                  setTimeout(() => setShowNotificationToast(false), 2500);
                }}
                aria-label="Xabarlar"
                className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5 stroke-[1.75]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Settings / Profile Icon */}
              <Link
                to="/profile"
                aria-label="Sozlamalar"
                className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Settings className="w-5 h-5 stroke-[1.75]" />
              </Link>

              {/* Language Selector */}
              <div className="scale-90 sm:scale-95 origin-right">
                <LanguageSelector />
              </div>

              {/* User Dropdown on Desktop */}
              {currentUser ? (
                <div className="hidden lg:block relative group ml-1">
                  <button className="flex items-center gap-1.5 p-1 pr-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {currentUser.full_name?.[0] || currentUser.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform" />
                  </button>

                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('customer.profile')}
                      </p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {currentUser.full_name || currentUser.email}
                      </p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      {t('customer.profile')}
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <ShoppingBag className="w-4 h-4 text-slate-400" />
                      {t('customer.orderHistory')}
                    </Link>
                    <div className="h-px bg-slate-100 my-1" />
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('common.logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs ml-1"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{t('common.login')}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search Input (matching reference image: rounded rectangle under header) */}
          {showSearchBar && (
            <div className="md:hidden pb-3 pt-0.5">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('customer.searchProducts')}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-xl outline-hidden text-xs font-normal text-slate-800 placeholder:text-slate-400 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Notification Toast */}
        {showNotificationToast && (
          <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
            Yangi xabarnomalar mavjud emas
          </div>
        )}
      </header>

      {/* Main Content Area: pb-28 / sm:pb-32 ensures bottom navigation NEVER covers page content on mobile or PC */}
      <main className="flex-grow min-w-0 pb-28 sm:pb-32">
        {children}
      </main>

      {/* PWA Install Instructions Modal (iOS / Manual) */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowIosInstallModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Ekranga qo'shish yo'riqnomasi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ilovani telefoningiz bosh ekraniga saqlab oling va tezkor foydalaning!
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 font-medium mb-5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p>
                  Brauzer pastki (yoki yuqori) panelidagi <strong className="text-slate-900">"Ulashish" (Share 📤)</strong> tugmasini bosing.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p>
                  Menyudan <strong className="text-slate-900">"Bosh ekranga qo'shish" (Add to Home Screen ➕)</strong> bo'limini tanlang.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p>
                  Yuqori o'ng burchakdagi <strong className="text-slate-900">"Qo'shish" (Add)</strong> tugmasini bosing!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosInstallModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Menu (matching user reference image): Works equally well on mobile and computer! */}
      <StorefrontBottomNav />
    </div>
  );
}
