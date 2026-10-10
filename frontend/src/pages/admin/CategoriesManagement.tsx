import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Upload,
  Layers,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';
import { getBaseUrl } from '../../utils/resolver';

const isDevOrPreview = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.includes('ais-dev') || 
                       window.location.hostname.includes('ais-pre') || 
                       window.location.hostname.includes('run.app');

const API_BASE_URL = import.meta.env.VITE_API_URL || (isDevOrPreview ? '/api' : `${getBaseUrl()}/api`);

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
}

export default function CategoriesManagement() {
  const { t } = useTranslation();
  
  // State variables
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [descUz, setDescUz] = useState('');
  const [descRu, setDescRu] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCategories(data);
      setError(false);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Parse bilingual names/descriptions (format: "Uzbek | Russian")
  const parseBilingual = (value: string | null) => {
    if (!value) return { uz: '', ru: '' };
    const parts = value.split('|');
    return {
      uz: parts[0] ? parts[0].trim() : '',
      ru: parts[1] ? parts[1].trim() : ''
    };
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setNameUz('');
    setNameRu('');
    setDescUz('');
    setDescRu('');
    setImageUrl('');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    const parsedName = parseBilingual(category.name);
    const parsedDesc = parseBilingual(category.description);
    setNameUz(parsedName.uz);
    setNameRu(parsedName.ru);
    setDescUz(parsedDesc.uz);
    setDescRu(parsedDesc.ru);
    setImageUrl(category.image_url || '');
    setIsActive(category.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFormError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        // Fallback to Base64
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) setImageUrl(e.target!.result as string);
        };
        reader.readAsDataURL(file);
        return;
      }

      const data = await response.json();
      setImageUrl(data.url);
    } catch (err: any) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setImageUrl(e.target!.result as string);
        else setFormError(err.message || 'Rasm yuklashda xatolik yuz berdi');
      };
      reader.onerror = () => setFormError('Rasm yuklashda xatolik yuz berdi');
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nameUz.trim() || !nameRu.trim()) {
      setFormError('Iltimos, har ikkala tildagi nomni kiriting');
      return;
    }

    const mergedName = `${nameUz.trim()} | ${nameRu.trim()}`;
    const mergedDesc = `${descUz.trim()} | ${descRu.trim()}`;

    setSubmitting(true);
    try {
      const url = editingCategory 
        ? `${API_BASE_URL}/admin/categories/${editingCategory.id}` 
        : `${API_BASE_URL}/admin/categories`;
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: mergedName,
          description: mergedDesc,
          image_url: imageUrl || null,
          is_active: isActive
        })
      });

      if (!response.ok) {
        let errMsg = 'Xatolik yuz berdi';
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMsg = typeof errData.detail === 'string' 
              ? errData.detail 
              : JSON.stringify(errData.detail);
          }
        } catch (e) {
          errMsg = `Xatolik yuz berdi (Status: ${response.status})`;
        }
        throw new Error(errMsg);
      }

      await fetchCategories();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete category handler
  const handleDeleteCategory = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        let errMsg = 'Kategoriyani o\'chirish imkoni bo\'lmadi';
        try {
          const data = await response.json();
          errMsg = data.detail || errMsg;
        } catch (e) {
          errMsg = `O'chirishda xatolik (Status: ${response.status})`;
        }
        alert(errMsg);
        return;
      }

      setDeleteConfirmId(null);
      await fetchCategories();
    } catch (err) {
      alert('Xatolik yuz berdi');
    }
  };

  // Filter based on search query
  const filteredCategories = categories.filter(cat => {
    const parsedName = parseBilingual(cat.name);
    return (
      parsedName.uz.toLowerCase().includes(search.toLowerCase()) ||
      parsedName.ru.toLowerCase().includes(search.toLowerCase()) ||
      cat.slug.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <ManagementLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Kategoriyalar</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Do'kon mahsulotlari kategoriyalarini boshqarish</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          Kategoriya qo'shish
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
            placeholder="Qidirish (UZ / RU)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content List / Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="font-bold text-sm">Yuklanmoqda...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-rose-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-2" />
            <p className="font-bold">Kategoriyalarni yuklashda xatolik yuz berdi</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold">Kategoriyalar topilmadi</p>
          </div>
        ) : (
          <>
            {/* Desktop and Tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Rasm</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nom (UZ / RU)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Holat</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((cat) => {
                    const parsedName = parseBilingual(cat.name);
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          {cat.image_url ? (
                            <img 
                              src={cat.image_url} 
                              alt={parsedName.uz} 
                              className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{parsedName.uz}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{parsedName.ru}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{cat.slug}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            cat.is_active 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {cat.is_active ? 'Faol' : 'Nofaol'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(cat)}
                              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {deleteConfirmId === cat.id ? (
                              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 p-1 rounded-xl">
                                <span className="text-[10px] font-black text-rose-700 uppercase px-1.5">O'chirilsinmi?</span>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(cat.id)}
                                className="p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View Card Grid */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredCategories.map((cat) => {
                const parsedName = parseBilingual(cat.name);
                return (
                  <div key={cat.id} className="p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      {cat.image_url ? (
                        <img 
                          src={cat.image_url} 
                          alt={parsedName.uz} 
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{parsedName.uz}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{parsedName.ru}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">Slug: {cat.slug}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                        cat.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {cat.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                      >
                        Tahrirlash
                      </button>
                      {deleteConfirmId === cat.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 p-1 rounded-xl">
                          <span className="text-[10px] font-black text-rose-700 px-2 uppercase">Rostdanmi?</span>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                          >
                            Ha
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                          >
                            Yo'q
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(cat.id)}
                          className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
                        >
                          O'chirish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => !submitting && setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya yaratish'}
              </h2>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs sm:text-sm font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <p>{formError}</p>
                </div>
              )}

              {/* Title Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Nomi (UZ) *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Masalan: Kiyimlar"
                    value={nameUz}
                    onChange={(e) => setNameUz(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Nomi (RU) *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Masalan: Одежда"
                    value={nameRu}
                    onChange={(e) => setNameRu(e.target.value)}
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tavsif (UZ)
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium h-20 resize-none"
                  placeholder="Kategoriya tavsifi..."
                  value={descUz}
                  onChange={(e) => setDescUz(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tavsif (RU)
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium h-20 resize-none"
                  placeholder="Описание категории..."
                  value={descRu}
                  onChange={(e) => setDescRu(e.target.value)}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Kategoriya rasmi
                </label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative group w-20 h-20 shrink-0">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-2xl border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-grow">
                    <label className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 transition-all select-none">
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          Yuklanmoqda...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-slate-500" />
                          Rasm yuklash
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={uploading}
                        onChange={handleImageUpload}
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium mt-1.5">PNG, JPG, JPEG, WEBP ruxsat etiladi</p>
                  </div>
                </div>
              </div>

              {/* Toggle Active status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Faol holatda</p>
                  <p className="text-xs text-slate-500">Mijozlarga ushbu kategoriyani ko'rsatish yoki yashirish</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none border cursor-pointer ${
                    isActive ? 'bg-blue-600 border-blue-500 flex justify-end' : 'bg-slate-200 border-slate-300 flex justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  {editingCategory ? 'Saqlash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
}
