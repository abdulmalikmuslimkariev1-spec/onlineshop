import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Save, 
  Settings, 
  Palette, 
  Globe, 
  Phone, 
  Mail, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';

interface SettingsData {
  store_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  website_title: string;
  short_description: string;
  phone: string;
  email: string;
  currency: string;
  default_lang: string;
}

export default function SystemSettings() {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<SettingsData>({
    store_name: 'Online Shop',
    logo_url: '',
    favicon_url: '',
    primary_color: '#0F172A',
    secondary_color: '#334155',
    website_title: '',
    short_description: '',
    phone: '',
    email: '',
    currency: 'UZS',
    default_lang: 'uz',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/branding', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          store_name: data.store_name || '',
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
          primary_color: data.primary_color || '#0F172A',
          secondary_color: data.secondary_color || '#334155',
          website_title: data.website_title || '',
          short_description: data.short_description || '',
          phone: data.phone || '',
          email: data.email || '',
          currency: data.currency || 'UZS',
          default_lang: data.default_lang || 'uz',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus('idle');
    try {
      const response = await fetch('/api/admin/settings/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setStatus('success');
        setMessage('Tizim sozlamalari muvaffaqiyatli saqlandi!');
        // Apply custom branding dynamically
        document.title = formData.website_title || formData.store_name;
        // Optionally update central context or localStorage so changes propagate immediately
        localStorage.setItem('branding_store_name', formData.store_name);
        window.dispatchEvent(new Event('branding-updated'));
      } else {
        const err = await response.json().catch(() => ({}));
        setStatus('error');
        setMessage(err.detail || 'Sozlamalarni saqlashda xatolik yuz berdi.');
      }
    } catch {
      setStatus('error');
      setMessage('Aloqa xatosi yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: uploadForm
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, logo_url: data.url }));
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) setFormData(prev => ({ ...prev, logo_url: e.target!.result as string }));
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setFormData(prev => ({ ...prev, logo_url: e.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: uploadForm
      });
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, favicon_url: data.url }));
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) setFormData(prev => ({ ...prev, favicon_url: e.target!.result as string }));
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setFormData(prev => ({ ...prev, favicon_url: e.target!.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <ManagementLayout>
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-600" />
          Tizim Sozlamalari
        </h1>
        <p className="text-slate-500 mt-1 font-medium text-sm">
          Do'kon brendi, aloqa ma'lumotlari, valyuta va dizayn parametrlarini boshqarish
        </p>
      </div>

      {status !== 'idle' && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium animate-in fade-in ${
          status === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {status === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <p>{message}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Do'kon Brand Ma'lumotlari */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50">
            <Info className="w-4 h-4 text-blue-500" />
            Asosiy Brand Ma'lumotlari
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Do'kon Nomi</label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Veb-sayt Sarlavhasi (Title)</label>
              <input
                type="text"
                required
                value={formData.website_title}
                onChange={(e) => setFormData({ ...formData, website_title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Do'kon haqida qisqacha tavsif (Meta Description)</label>
              <textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Aloqa ma'lumotlari */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50">
            <Phone className="w-4 h-4 text-blue-500" />
            Aloqa & Ma'muriyat
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Telefon Raqam
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> E-mail Manzili
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Logo & Favicon */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50">
            Logo & Favicon
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Do'kon Logosi</label>
                <input
                  type="text"
                  placeholder="Logo URL manzili"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Veb-sayt Favicon</label>
                <input
                  type="text"
                  placeholder="Favicon URL manzili"
                  value={formData.favicon_url}
                  onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFaviconUpload(e.target.files[0])}
                className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Vizual Dizayn va Ranglar */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50">
            <Palette className="w-4 h-4 text-blue-500" />
            Vizual Dizayn (Brand Ranglari)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden bg-transparent shrink-0"
              />
              <div className="min-w-0 flex-grow">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Asosiy Rang (Primary)</label>
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-full bg-transparent text-sm font-bold text-slate-800 border-0 p-0 focus:ring-0 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden bg-transparent shrink-0"
              />
              <div className="min-w-0 flex-grow">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Ikkilamchi Rang (Secondary)</label>
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-full bg-transparent text-sm font-bold text-slate-800 border-0 p-0 focus:ring-0 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tizim standart sozlamalari (Localization & Currency) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50">
            <Globe className="w-4 h-4 text-blue-500" />
            Tizim Parametrlari (Valyuta va Til)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Valyuta Belgi (Currency Code)</label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="UZS">UZS (So'm)</option>
                <option value="USD">USD ($)</option>
                <option value="RUB">RUB (₽)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Boshlang'ich Til (Default Language)</label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                value={formData.default_lang}
                onChange={(e) => setFormData({ ...formData, default_lang: e.target.value })}
              >
                <option value="uz">O'zbekcha (Lotin)</option>
                <option value="uzCyr">Ўзбекча (Кирилл)</option>
                <option value="ru">Русский</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Sozlamalarni Saqlash</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ManagementLayout>
  );
}
