import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Heart, CircleUser } from 'lucide-react';
import { getFavorites } from '../utils/favorites';

// Custom Catalog Icon matching the exact icon in the user's reference image:
// A magnifying glass with horizontal catalog lines inside/across
function CatalogMenuIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="22" 
      height="22" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="10" cy="10" r="6.5" />
      <line x1="21" y1="21" x2="15" y2="15" />
      <line x1="7" y1="8.5" x2="13" y2="8.5" />
      <line x1="7" y1="11.5" x2="11.5" y2="11.5" />
    </svg>
  );
}

// Custom Shopping Cart Icon matching the reference image:
function CartMenuIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="22" 
      height="22" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="8" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      <path d="M1.5 2h3.5l2.4 12.2a1.8 1.8 0 0 0 1.8 1.4h9.6a1.8 1.8 0 0 0 1.8-1.4l1.6-8.2H5.5" />
    </svg>
  );
}

export function StorefrontBottomNav() {
  const { t } = useTranslation();
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);

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
    updateCounts();

    const handleCartUpdate = () => updateCounts();
    const handleFavUpdate = () => updateCounts();

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('favorites-updated', handleFavUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('favorites-updated', handleFavUpdate);
    };
  }, []);

  const navItems = [
    {
      to: '/',
      label: t('customer.home'),
      icon: Home,
      exact: true,
      customIcon: false,
    },
    {
      to: '/catalog',
      label: t('customer.catalog'),
      icon: CatalogMenuIcon,
      customIcon: true,
    },
    {
      to: '/cart',
      label: t('customer.cart'),
      icon: CartMenuIcon,
      badge: cartCount,
      customIcon: true,
    },
    {
      to: '/favorites',
      label: t('customer.favorites'),
      icon: Heart,
      badge: favCount > 0 ? favCount : undefined,
      customIcon: false,
    },
    {
      to: '/profile',
      label: t('customer.profile'),
      icon: CircleUser,
      customIcon: false,
    }
  ];

  return (
    <div 
      aria-label="Bottom Navigation Menu"
      className="
        fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-2 pb-2
        md:fixed md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:inset-x-auto md:w-auto md:min-w-[480px] md:max-w-xl md:rounded-2xl md:border md:border-slate-200/90 md:shadow-[0_10px_35px_rgba(0,0,0,0.12)] md:px-8 md:py-2.5 md:backdrop-blur-md md:bg-white/95
        transition-all duration-300
      "
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-lg md:max-w-none mx-auto md:gap-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `
              group relative flex flex-col items-center justify-center py-1 px-1.5 transition-all duration-200 select-none
              ${isActive ? 'text-blue-600 font-semibold' : 'text-slate-800 hover:text-blue-600 font-normal'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center">
                  {/* Home icon fills when active */}
                  {item.to === '/' ? (
                    <Home 
                      className={`w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'fill-blue-600 text-blue-600 stroke-blue-600' : 'text-slate-800 stroke-[2]'
                      }`} 
                    />
                  ) : item.customIcon ? (
                    <item.icon 
                      className={`w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-blue-600 stroke-blue-600' : 'text-slate-800'
                      }`} 
                    />
                  ) : item.to === '/favorites' ? (
                    <Heart 
                      className={`w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'fill-rose-500 text-rose-500 stroke-rose-500' : 'text-slate-800 stroke-[2]'
                      }`} 
                    />
                  ) : (
                    <CircleUser 
                      className={`w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-blue-600 stroke-[2.25]' : 'text-slate-800 stroke-[2]'
                      }`} 
                    />
                  )}

                  {/* Vibrant blue badge for cart quantity like reference image */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-blue-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-xs leading-none">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                {/* Menu Label */}
                <span className={`text-[11px] sm:text-xs tracking-tight mt-1 text-center truncate max-w-[70px] leading-tight ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-800 font-medium group-hover:text-blue-600'
                }`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Mobile bottom home indicator bar (as seen in the reference image cutout) */}
      <div className="md:hidden w-32 h-1 bg-slate-900 rounded-full mx-auto mt-1.5 opacity-90" />
    </div>
  );
}
