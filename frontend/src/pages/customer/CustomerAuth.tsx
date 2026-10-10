import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Phone, Lock, User as UserIcon, AlertCircle, ShoppingBag, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth';
import { BRANDING } from '../../config/branding';
import { StorefrontLayout } from '../../components/StorefrontLayout';

export default function CustomerAuth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.pathname === '/register') {
      setIsLogin(false);
      setError('');
    } else if (location.pathname === '/login') {
      setIsLogin(true);
      setError('');
    }
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 9) {
      setError(t('customerAuth.phoneInvalid'));
      return;
    }

    if (password.length < 6) {
      setError(t('customerAuth.passwordPlaceholder'));
      return;
    }

    if (!isLogin) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setError(t('customerAuth.nameRequired'));
        return;
      }
      if (password !== passwordConfirm) {
        setError(t('customerAuth.passwordMismatch'));
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const data = await authApi.customerLogin({ phone: phone.trim(), password });
        localStorage.setItem('token', data.access_token);
        window.dispatchEvent(new Event('cart-updated'));
        navigate(from, { replace: true });
      } else {
        const data = await authApi.customerRegister({
          full_name: fullName.trim(),
          phone: phone.trim(),
          password,
          password_confirm: passwordConfirm,
        });
        localStorage.setItem('token', data.access_token);
        window.dispatchEvent(new Event('cart-updated'));
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('allaqachon') || msg.includes('registered') || msg.includes('зарегистрирован')) {
        setError(t('customerAuth.phoneAlreadyRegistered'));
      } else if (msg.includes('noto\'g\'ri') || msg.includes('credentials') || msg.includes('Неверный')) {
        setError(t('customerAuth.invalidCredentials'));
      } else if (msg.includes('bir xil emas') || msg.includes('совпадают')) {
        setError(t('customerAuth.passwordMismatch'));
      } else {
        setError(msg || t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError('');
    navigate(toLogin ? '/login' : '/register', { replace: true });
  };

  return (
    <StorefrontLayout showSearchBar={false}>
      <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-8">
          {/* Brand & Title Header */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/25">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
              {BRANDING.storeName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isLogin 
                ? t('customerAuth.loginTitle')
                : t('customerAuth.registerTitle')}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                isLogin 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('customerAuth.loginTab')}
            </button>
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                !isLogin 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('customerAuth.registerTab')}
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <p className="font-semibold leading-snug">{error}</p>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration: Ism va Familiya */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t('customerAuth.fullName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder={t('customerAuth.fullNamePlaceholder')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Telefon raqam */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {t('customerAuth.phone')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder={t('customerAuth.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Parol */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {t('customerAuth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder={t('customerAuth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Parolni tasdiqlash (faqat Ro‘yxatdan o‘tishda) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t('customerAuth.confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!isLogin}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder={t('customerAuth.confirmPasswordPlaceholder')}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>
                {isLogin 
                  ? t('customerAuth.loginBtn')
                  : t('customerAuth.registerBtn')}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Switch Link at Bottom */}
          <div className="mt-6 text-center text-xs text-slate-500 font-medium space-y-3">
            {isLogin ? (
              <p>
                {t('customerAuth.noAccountYet')}{' '}
                <button
                  type="button"
                  onClick={() => switchTab(false)}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline ml-1 cursor-pointer"
                >
                  {t('customerAuth.registerTab')}
                </button>
              </p>
            ) : (
              <p>
                {t('customerAuth.alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => switchTab(true)}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline ml-1 cursor-pointer"
                >
                  {t('customerAuth.loginTab')}
                </button>
              </p>
            )}

            <div className="pt-3 border-t border-slate-100">
              <a
                href="/login?context=SUPERADMIN"
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.setItem('preview_context', 'SUPERADMIN');
                  window.location.href = '/login?context=SUPERADMIN';
                }}
                className="font-semibold text-purple-600 hover:text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                🛡️ Admin / Superadmin sifatida kirish
              </a>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
