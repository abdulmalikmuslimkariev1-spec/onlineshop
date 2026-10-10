import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Layers,
  Calendar,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';

interface Banner {
  id: number;
  name: string;
  image_url: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  product_id: number | null;
  category_id: number | null;
  sort_order: number;
  product?: { name: string } | null;
  category?: { name: string } | null;
}

interface ProductOption {
  id: number;
  name: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

export default function BannersManagement() {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    image_url: '',
    is_active: true,
    start_date: '',
    end_date: '',
    product_id: '',
    category_id: '',
    sort_order: 0
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      // Fetch Products
      const pRes = await fetch('/api/admin/products?page=1&page_size=100', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (pRes.ok) {
        const data = await pRes.json();
        setProducts(data.items || []);
      }

      // Fetch Categories
      const cRes = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (cRes.ok) {
        const data = await cRes.json();
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchOptions();
  }, []);

  const handleOpenAdd = () => {
    setEditingBannerId(null);
    setForm({
      name: '',
      image_url: '',
      is_active: true,
      start_date: '',
      end_date: '',
      product_id: '',
      category_id: '',
      sort_order: banners.length + 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b: Banner) => {
    setEditingBannerId(b.id);
    setForm({
      name: b.name,
      image_url: b.image_url,
      is_active: b.is_active,
      start_date: b.start_date ? b.start_date.substring(0, 16) : '',
      end_date: b.end_date ? b.end_date.substring(0, 16) : '',
      product_id: b.product_id ? b.product_id.toString() : '',
      category_id: b.category_id ? b.category_id.toString() : '',
      sort_order: b.sort_order
    });
    setShowModal(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: uploadForm
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, image_url: data.url }));
      } else {
        // Fallback to FileReader base64 if server upload fails
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setForm(prev => ({ ...prev, image_url: e.target!.result as string }));
          } else {
            alert('Rasm yuklashda xatolik yuz berdi');
          }
        };
        reader.onerror = () => alert('Rasm yuklashda xatolik yuz berdi');
        reader.readAsDataURL(file);
      }
    } catch {
      // Fallback to FileReader base64 if network fails
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setForm(prev => ({ ...prev, image_url: e.target!.result as string }));
        } else {
          alert('Rasm yuklashda xatolik yuz berdi');
        }
      };
      reader.onerror = () => alert('Rasm yuklashda xatolik yuz berdi');
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.image_url.trim()) {
      alert('Iltimos barcha majburiy maydonlarni to‘ldiring');
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        image_url: form.image_url.trim(),
        is_active: form.is_active,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        product_id: form.product_id ? parseInt(form.product_id) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        sort_order: form.sort_order
      };

      const url = editingBannerId ? `/api/admin/banners/${editingBannerId}` : '/api/admin/banners';
      const method = editingBannerId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowModal(false);
        fetchBanners();
      } else {
        const err = await res.json();
        alert(err.detail || 'Xatolik yuz berdi');
      }
    } catch {
      alert('Aloqa xatosi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bannerId: number) => {
    if (!confirm('Haqiqatdan ham ushbu banner yoki reklamani o‘chirmoqchimisiz?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchBanners();
      } else {
        alert('O‘chirishda xatolik yuz berdi');
      }
    } catch {
      alert('Aloqa xatosi yuz berdi');
    }
  };

  return (
    <ManagementLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Banner & Reklama Sozlamalari
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Mijozlar bosh sahifasidagi carousel reklamalari va aksiyalarni boshqarish
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-blue-600/10 flex items-center gap-2 active:scale-95 cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Yangi Banner Qo'shish
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12 text-center text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-base text-slate-700">Hech qanday reklama bannerlari topilmadi</p>
          <p className="text-sm text-slate-400 mt-1">Yangi banner qo‘shish tugmasini bosib birinchi banneringizni yaratishingiz mumkin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300">
              <div className="relative aspect-[16/9] bg-slate-50 border-b border-slate-100 overflow-hidden">
                <img src={b.image_url} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-xs ${
                  b.is_active 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-500 text-white'
                }`}>
                  {b.is_active ? 'Faol' : 'Faol emas'}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-900/60 text-white">
                  Tartib: {b.sort_order}
                </span>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{b.name}</h3>
                  
                  {/* Dynamic linkage detail */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-medium">
                    {b.product && (
                      <div className="flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">Mahsulot: {b.product.name}</span>
                      </div>
                    )}
                    {b.category && (
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate font-semibold">Kategoriya: {b.category.name}</span>
                      </div>
                    )}
                    {(b.start_date || b.end_date) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {b.start_date ? new Date(b.start_date).toLocaleDateString() : '...'} - {b.end_date ? new Date(b.end_date).toLocaleDateString() : '...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-50">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Tahrirlash
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingBannerId ? 'Bannerni tahrirlash' : 'Yangi Banner qo\'shish'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Banner Nomi (Sarlavha)</label>
                <input
                  type="text"
                  required
                  placeholder="Yozgi kiyimlar aksiyasi..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Banner Rasmi</label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUpload(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                {form.image_url ? (
                  <div className="relative rounded-2xl overflow-hidden h-36 border border-slate-200 bg-slate-900 group shadow-sm">
                    <img
                      src={form.image_url}
                      alt="Banner ko'rinishi"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg shadow flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        O'zgartirish
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image_url: '' })}
                        className="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        O'chirish
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-5 text-center cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    {uploading ? (
                      <p className="text-xs font-semibold text-blue-600 animate-pulse">Rasm yuklanmoqda...</p>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-slate-700 mb-0.5">Fayldan rasm yuklash uchun bosing</p>
                        <p className="text-[11px] text-slate-500">yoki rasmni bu yerga sudrab tashlang (JPG, PNG, WEBP, JFIF va b.)</p>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Yoki rasm havolasini (URL) kiriting:</span>
                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Boshlanish Sanasi</label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Tugash Sanasi</label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Mahsulotga Bog'lash (Ixtiyoriy)</label>
                  <select
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none"
                  >
                    <option value="">-- Mahsulot tanlang (ixtiyoriy) --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Kategoriyaga Bog'lash (Ixtiyoriy)</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none"
                  >
                    <option value="">-- Kategoriya tanlang (ixtiyoriy) --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Tartib (Sort Order)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500"
                    />
                    Banner Faol (Active)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saqlanmoqda...' : 'Bannerni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
}
