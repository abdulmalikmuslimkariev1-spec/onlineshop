import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BRANDING } from './config/branding';
import { apiClient } from './api/client';
import { CheckCircle2, Server, ShoppingBag, LogOut, User as UserIcon } from 'lucide-react';
import Login from './pages/Login';
import CustomerAuth from './pages/customer/CustomerAuth';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminManagement from './pages/admin/AdminManagement';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import ProductsManagement from './pages/admin/ProductsManagement';
import SystemSettings from './pages/admin/SystemSettings';
import BannersManagement from './pages/admin/BannersManagement';
import OperatorDashboard from './pages/operator/Dashboard';
import OrderList from './pages/operator/OrderList';
import OrderDetails from './pages/operator/OrderDetails';
import Profile from './pages/operator/Profile';
import CourierDashboard from './pages/courier/Dashboard';
import MyOrders from './pages/courier/MyOrders';
import CourierOrderDetails from './pages/courier/OrderDetails';
import Home from './pages/customer/Home';
import Catalog from './pages/customer/Catalog';
import Favorites from './pages/customer/Favorites';
import CustomerProfile from './pages/customer/Profile';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import OrderDetail from './pages/customer/OrderDetail';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { authApi, User } from './api/auth';
import { LanguageSelector } from './components/LanguageSelector';
import { AppContext, resolveAppContext } from './utils/resolver';

function MainDashboard() {
  const { t } = useTranslation();
  const appContext = resolveAppContext();
  
  const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    apiClient.checkHealth()
      .then(() => setHealthStatus('ok'))
      .catch(() => setHealthStatus('error'));

    authApi.getMe()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {BRANDING.storeName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Context: {appContext}
            </div>
            <LanguageSelector />
            {currentUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-700">
                <UserIcon className="w-4 h-4" />
                <span className="font-medium">{currentUser.full_name || currentUser.email}</span>
                <div className="flex gap-1">
                  {currentUser.roles.map((role: any) => (
                    <span key={role.id} className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      {t(`roles.${role.name}`)}
                    </span>
                  ))}
                  {currentUser.is_superuser && !currentUser.roles.some((r: any) => r.name === 'SUPERADMIN') && (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      {t('roles.SUPERADMIN')}
                    </span>
                  )}
                </div>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              title={t('common.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t('auth.welcome')}
          </h1>
          <p className="text-slate-600 mb-8">
            {t('auth.authenticated')}
          </p>
          
          <p className="text-sm text-slate-500 mb-6 font-medium">
             Current Application Context: <span className="text-blue-600">{appContext}</span>
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{t('status.backend')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  healthStatus === 'ok' ? 'bg-emerald-500' : 
                  healthStatus === 'loading' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className={`text-xs font-semibold ${
                  healthStatus === 'ok' ? 'text-emerald-700' : 
                  healthStatus === 'loading' ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {healthStatus === 'ok' ? t('status.online') : 
                   healthStatus === 'loading' ? t('status.checking') : t('status.offline')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              {t('messages.step3Verified')}
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {BRANDING.storeName}. {t('footer.rights')}.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const appContext = resolveAppContext();

  return (
    <BrowserRouter>
      <ErrorBoundary fallbackName="Tizim boshqaruv panelida xatolik yuz berdi">
        <Routes>
          {appContext === AppContext.CUSTOMER ? (
            <>
              <Route path="/login" element={<CustomerAuth />} />
              <Route path="/register" element={<CustomerAuth />} />
            </>
          ) : (
            <Route path="/login" element={<Login />} />
          )}
          
          {/* Dynamic Route Rendering based on context */}
          {appContext === AppContext.SUPERADMIN && (
            <>
              <Route path="/" element={<ProtectedRoute requireAdmin={true}><Dashboard /></ProtectedRoute>} />
              <Route path="/superadmin" element={<ProtectedRoute requireAdmin={true}><Dashboard /></ProtectedRoute>} />
              <Route path="/superadmin/dashboard" element={<ProtectedRoute requireAdmin={true}><Dashboard /></ProtectedRoute>} />
              <Route path="/superadmin/users" element={<ProtectedRoute requireAdmin={true}><UserManagement /></ProtectedRoute>} />
              <Route path="/superadmin/admins" element={<ProtectedRoute requireAdmin={true}><AdminManagement /></ProtectedRoute>} />
              <Route path="/superadmin/categories" element={<ProtectedRoute requireAdmin={true}><CategoriesManagement /></ProtectedRoute>} />
              <Route path="/superadmin/products" element={<ProtectedRoute requireAdmin={true}><ProductsManagement /></ProtectedRoute>} />
              <Route path="/superadmin/settings" element={<ProtectedRoute requireAdmin={true}><SystemSettings /></ProtectedRoute>} />
              <Route path="/superadmin/banners" element={<ProtectedRoute requireAdmin={true}><BannersManagement /></ProtectedRoute>} />
              <Route path="/superadmin/orders" element={<ProtectedRoute requireAdmin={true}><OrderList /></ProtectedRoute>} />
              <Route path="/superadmin/orders/:id" element={<ProtectedRoute requireAdmin={true}><OrderDetails /></ProtectedRoute>} />
              <Route path="/superadmin/profile" element={<ProtectedRoute requireAdmin={true}><Profile /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute requireAdmin={true}><UserManagement /></ProtectedRoute>} />
              <Route path="/admins" element={<ProtectedRoute requireAdmin={true}><AdminManagement /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requireAdmin={true}><SystemSettings /></ProtectedRoute>} />
              <Route path="/banners" element={<ProtectedRoute requireAdmin={true}><BannersManagement /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute requireAdmin={true}><OrderList /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute requireAdmin={true}><OrderDetails /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute requireAdmin={true}><Profile /></ProtectedRoute>} />
            </>
          )}

        {appContext === AppContext.ADMIN && (
          <>
            <Route path="/" element={<ProtectedRoute requireManagement={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requireManagement={true}><UserManagement /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute requireManagement={true}><OrderList /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute requireManagement={true}><OrderDetails /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requireManagement={true}><Profile /></ProtectedRoute>} />
          </>
        )}

        {appContext === AppContext.OPERATOR && (
          <>
            <Route path="/" element={<ProtectedRoute requireOperator={true}><OperatorDashboard /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute requireOperator={true}><OrderList /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute requireOperator={true}><OrderDetails /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requireOperator={true}><Profile /></ProtectedRoute>} />
          </>
        )}

        {appContext === AppContext.COURIER && (
          <>
            <Route path="/" element={<ProtectedRoute requireCourier={true}><CourierDashboard /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute requireCourier={true}><MyOrders /></ProtectedRoute>} />
            <Route path="/my-orders/:id" element={<ProtectedRoute requireCourier={true}><CourierOrderDetails /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requireCourier={true}><Profile /></ProtectedRoute>} />
          </>
        )}

        {appContext === AppContext.CUSTOMER && (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<CustomerAuth />} />
            <Route path="/register" element={<CustomerAuth />} />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <CustomerProfile />
              </ProtectedRoute>
            } />
          </>
        )}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireManagement={true}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute requireManagement={true}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/admins" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminManagement />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
