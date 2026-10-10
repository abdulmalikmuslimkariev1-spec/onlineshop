import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth';
import { BRANDING } from '../config/branding';
import { LanguageSelector } from '../components/LanguageSelector';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const { access_token } = await authApi.login(formData);
      localStorage.setItem('token', access_token);
      
      try {
        const user = await authApi.getMe();
        if (user.is_superuser || user.roles.some(r => r.name === 'SUPERADMIN')) {
          localStorage.setItem('preview_context', 'SUPERADMIN');
        } else if (user.roles.some(r => r.name === 'ADMIN')) {
          localStorage.setItem('preview_context', 'ADMIN');
        } else if (user.roles.some(r => r.name === 'OPERATOR')) {
          localStorage.setItem('preview_context', 'OPERATOR');
        } else if (user.roles.some(r => r.name === 'COURIER')) {
          localStorage.setItem('preview_context', 'COURIER');
        } else {
          localStorage.setItem('preview_context', 'CUSTOMER');
        }
      } catch (e) {
        // fallback
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      let errorMsg = t('auth.loginFailed');
      if (err.message === 'AUTH_INVALID_CREDENTIALS') {
        errorMsg = t('auth.invalidCredentials');
      } else if (err.message === 'AUTH_USER_INACTIVE') {
        errorMsg = t('auth.userInactive');
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-10 transform transition-all">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20 transform -rotate-6">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">{BRANDING.storeName}</h1>
          <p className="text-slate-500 font-medium text-sm">{t('auth.title')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block"></span>
            )}
            <span>{t('auth.loginButton')}</span>
          </button>
        </form>
        
        <div className="mt-8 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Step 3: Avtorizatsiya va Havfsizlik testi
          </p>
          <div>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem('preview_context');
                window.location.href = '/';
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              🛍️ Xaridor do'koniga qaytish
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
