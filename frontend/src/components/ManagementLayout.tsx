import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  ShoppingBag,
  ChevronRight,
  ClipboardList,
  Search,
  User as UserIcon,
  Layers,
  Package,
  Settings,
  Image as ImageIcon
} from 'lucide-react';
import { BRANDING } from '../config/branding';
import { LanguageSelector } from './LanguageSelector';
import { authApi, User } from '../api/auth';
import { AppContext, resolveAppContext } from '../utils/resolver';
import { getBranding } from '../utils/branding';

interface ManagementLayoutProps {
  children: ReactNode;
}

export function ManagementLayout({ children }: ManagementLayoutProps) {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [branding, setBranding] = useState(getBranding());
  const navigate = useNavigate();
  const location = useLocation();
  const appContext = resolveAppContext();

  useEffect(() => {
    authApi.getMe()
      .then(setCurrentUser)
      .catch(() => navigate('/login'));
      
    const handleBrandingUpdate = () => {
      setBranding(getBranding());
    };
    window.addEventListener('branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('branding-updated', handleBrandingUpdate);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    // Common Dashboard
    { 
      path: '/', 
      label: t('common.dashboard' as any) || 'Dashboard', 
      icon: LayoutDashboard,
      roles: ['SUPERADMIN', 'ADMIN', 'OPERATOR', 'COURIER'] 
    },
    // Admin/Superadmin only
    { 
      path: '/users', 
      label: t('admin.users'), 
      icon: Users,
      roles: ['SUPERADMIN', 'ADMIN'] 
    },
    { 
      path: '/admins', 
      label: t('admin.admins'), 
      icon: ShieldCheck,
      roles: ['SUPERADMIN'] 
    },
    { 
      path: '/superadmin/categories', 
      label: 'Kategoriyalar', 
      icon: Layers,
      roles: ['SUPERADMIN'] 
    },
    { 
      path: '/superadmin/products', 
      label: 'Mahsulotlar', 
      icon: Package,
      roles: ['SUPERADMIN'] 
    },
    { 
      path: '/settings', 
      label: 'Tizim Sozlamalari', 
      icon: Settings,
      roles: ['SUPERADMIN'] 
    },
    { 
      path: '/banners', 
      label: 'Banner & Reklama', 
      icon: ImageIcon,
      roles: ['SUPERADMIN'] 
    },
    // Operator/Admin/Superadmin
    { 
      path: '/orders', 
      label: t('operator.orders'), 
      icon: ClipboardList,
      roles: ['SUPERADMIN', 'ADMIN', 'OPERATOR'] 
    },
    { 
      path: '/my-orders', 
      label: t('courier.myOrders'), 
      icon: ClipboardList,
      roles: ['COURIER'] 
    },
    { 
      path: '/profile', 
      label: t('customer.profile'), 
      icon: UserIcon,
      roles: ['SUPERADMIN', 'ADMIN', 'OPERATOR', 'COURIER'] 
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.is_superuser) return true;
    return item.roles.some(role => currentUser.roles.some(r => r.name === role));
  });

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.storeName} className="h-8 object-contain" />
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-slate-900 truncate tracking-tight">
                    {branding.storeName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto scrollbar-hide">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${location.pathname === item.path && location.pathname !== '/' ? 'text-white' : (location.pathname === '/' && item.path === '/' ? 'text-white' : 'text-slate-400')}`} />
                  {item.label}
                </div>
                <ChevronRight className={`w-4 h-4 transition-all duration-300 ${location.pathname === item.path || (location.pathname === '/' && item.path === '/') ? 'translate-x-0' : '-translate-x-2 opacity-0'}`} />
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shadow-sm">
                {currentUser?.full_name?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.full_name || currentUser?.email}</p>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                  {currentUser?.roles?.[0]?.name ? t(`roles.${currentUser.roles[0].name}`) : (currentUser?.is_superuser ? t('roles.SUPERADMIN') : '')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all group"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              {t('common.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white/80 border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Global Search - Compact */}
            <div className="hidden md:flex items-center relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('customer.search')}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs font-medium"
              />
            </div>

            <div className="hidden lg:flex items-center gap-2 ml-4">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-black text-blue-700 rounded-lg border border-blue-100 uppercase tracking-widest">
                 {appContext}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            <div className="scale-90 sm:scale-100">
              <LanguageSelector />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
