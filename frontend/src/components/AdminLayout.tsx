import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShoppingBag,
  ChevronRight
} from 'lucide-react';
import { BRANDING } from '../config/branding';
import { LanguageSelector } from './LanguageSelector';
import { authApi, User } from '../api/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    authApi.getMe()
      .then(setCurrentUser)
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { 
      path: '/admin', 
      label: t('admin.dashboard'), 
      icon: LayoutDashboard,
      roles: ['SUPERADMIN', 'ADMIN'] 
    },
    { 
      path: '/admin/users', 
      label: t('admin.users'), 
      icon: Users,
      roles: ['SUPERADMIN', 'ADMIN'] 
    },
    { 
      path: '/admin/admins', 
      label: t('admin.admins'), 
      icon: ShieldCheck,
      roles: ['SUPERADMIN'] 
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.is_superuser) return true;
    return item.roles.some(role => currentUser.roles.some(r => r.name === role));
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900 truncate">
                {BRANDING.storeName}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${location.pathname === item.path ? 'translate-x-0' : '-translate-x-2 opacity-0'}`} />
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                {currentUser?.full_name?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.full_name || currentUser?.email}</p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser?.roles?.[0]?.name ? t(`roles.${currentUser.roles[0].name}`) : (currentUser?.is_superuser ? t('roles.SUPERADMIN') : '')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t('common.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <LanguageSelector />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-grow overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
