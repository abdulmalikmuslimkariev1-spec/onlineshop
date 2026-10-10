import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Globe, 
  LogOut, 
  Plus, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';
import { authApi, User } from '../../api/auth';
import { LanguageSelector } from '../../components/LanguageSelector';

interface Address {
  id: number;
  title: string;
  address_line: string;
  city: string;
  is_default?: boolean;
}

export default function CustomerProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ title: '', address_line: '', city: 'Toshkent' });

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAddresses(data);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    authApi.getMe()
      .then((data) => {
        setUser(data);
        fetchAddresses();
        fetch('/api/customer/profile', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(pData => {
            if (pData?.phone) setCustomerPhone(pData.phone);
          })
          .catch(() => {});
      })
      .catch(() => {
        navigate('/login', { state: { from: '/profile' } });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.title.trim() || !newAddr.address_line.trim()) return;

    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAddr)
      });
      if (res.ok) {
        setNewAddr({ title: '', address_line: '', city: 'Toshkent' });
        setIsAddingAddress(false);
        fetchAddresses();
      }
    } catch {
      // Ignored
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAddresses();
    } catch {
      // Ignored
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </StorefrontLayout>
    );
  }

  if (!user) return null;

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8 space-y-5">
        {/* User Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-xs shrink-0">
            {user.full_name?.[0] || 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {user.full_name || t('roles.CUSTOMER')}
            </h1>
            {customerPhone && (
              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {customerPhone}
              </p>
            )}
          </div>
        </div>

        {/* Quick Links Hub */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          <Link 
            to="/orders"
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                {t('customer.orderHistory')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link 
            to="/favorites"
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                {t('customer.favorites')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link 
            to="/cart"
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                {t('customer.cart')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Addresses Section */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {t('customer.addresses')}
              </h2>
            </div>
            <button
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('customer.addAddress')}</span>
            </button>
          </div>

          {/* Add Address Form Accordion */}
          {isAddingAddress && (
            <form onSubmit={handleAddAddress} className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200/70">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {t('customer.addressName')}
                </label>
                <input
                  type="text"
                  required
                  value={newAddr.title}
                  onChange={(e) => setNewAddr({ ...newAddr, title: e.target.value })}
                  placeholder="Masalan: Uy yoki Ishxona"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {t('customer.fullAddress')}
                </label>
                <input
                  type="text"
                  required
                  value={newAddr.address_line}
                  onChange={(e) => setNewAddr({ ...newAddr, address_line: e.target.value })}
                  placeholder="Ko'cha, uy, xonadon raqami"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          )}

          {/* Addresses list */}
          {addresses.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center">
              {t('customer.noAddresses')}
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div 
                  key={addr.id} 
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {addr.title}
                    </span>
                    <p className="text-xs text-slate-800 font-medium mt-0.5">
                      {addr.address_line}, {addr.city}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language & Settings Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-slate-600" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                Til / Язык
              </span>
            </div>
            <LanguageSelector />
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </StorefrontLayout>
  );
}
