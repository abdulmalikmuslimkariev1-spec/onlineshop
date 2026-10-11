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
  ShoppingBag,
  Image as ImageIcon,
  Loader2,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';
import { getApiBaseUrl } from '../../utils/resolver';

const API_BASE_URL = getApiBaseUrl();

interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  category_id: number | null;
  category: Category | null;
  images: ProductImage[];
}

export default function ProductsManagement() {
  const { t } = useTranslation();
  
  // State variables
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterIsActive, setFilterIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [descUz, setDescUz] = useState('');
  const [descRu, setDescRu] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('100');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Images list
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Fetch categories (for select drop-downs)
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Fetch products with params
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(search.trim() && { search: search.trim() }),
        ...(filterCategoryId && { category_id: filterCategoryId }),
        ...(filterIsActive !== '' && { is_active: filterIsActive })
      });

      const response = await fetch(`${API_BASE_URL}/admin/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setProducts(data.items);
      setTotal(data.total);
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

  useEffect(() => {
    fetchProducts();
  }, [page, filterCategoryId, filterIsActive]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

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
    setEditingProduct(null);
    setNameUz('');
    setNameRu('');
    setDescUz('');
    setDescRu('');
    setSku('');
    setBarcode('');
    setPrice('');
    setDiscountPrice('');
    setStockQuantity('100');
    setCategoryId(categories[0]?.id.toString() || '');
    setIsActive(true);
    setImages([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const parsedName = parseBilingual(product.name);
    const parsedDesc = parseBilingual(product.description);
    
    setNameUz(parsedName.uz);
    setNameRu(parsedName.ru);
    setDescUz(parsedDesc.uz);
    setDescRu(parsedDesc.ru);
    setSku(product.sku || '');
    setBarcode(product.barcode || '');
    setPrice(product.price.toString());
    setDiscountPrice(product.discount_price ? product.discount_price.toString() : '');
    setStockQuantity(product.stock_quantity.toString());
    setCategoryId(product.category_id ? product.category_id.toString() : '');
    setIsActive(product.is_active);
    
    // Sort so primary is first, then extract URLs
    const sortedImages = [...product.images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.sort_order - b.sort_order;
    });
    setImages(sortedImages.map(img => img.url));
    
    setFormError('');
    setIsModalOpen(true);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setFormError('');

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/admin/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          // Fallback to FileReader
          const base64Url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
          if (base64Url) {
            uploadedUrls.push(base64Url);
            continue;
          }
        } else {
          const data = await response.json();
          uploadedUrls.push(data.url);
        }
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setFormError(err.message || 'Rasm yuklashda xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const setPrimaryImage = (indexToPrimary: number) => {
    setImages(prev => {
      const next = [...prev];
      const [primaryItem] = next.splice(indexToPrimary, 1);
      next.unshift(primaryItem); // primary always at 0 index
      return next;
    });
  };

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nameUz.trim() || !nameRu.trim()) {
      setFormError('Iltimos, har ikkala tildagi nomni kiriting');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setFormError('Iltimos, haqiqiy mahsulot narxini kiriting');
      return;
    }

    const cleanDiscount = discountPrice ? parseFloat(discountPrice) : null;
    if (cleanDiscount !== null && cleanDiscount >= parseFloat(price)) {
      setFormError('Chegirma narxi original narxdan kam bo\'lishi shart');
      return;
    }

    const mergedName = `${nameUz.trim()} | ${nameRu.trim()}`;
    const mergedDesc = `${descUz.trim()} | ${descRu.trim()}`;

    setSubmitting(true);
    try {
      const url = editingProduct 
        ? `${API_BASE_URL}/admin/products/${editingProduct.id}` 
        : `${API_BASE_URL}/admin/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: mergedName,
          category_id: categoryId ? parseInt(categoryId) : null,
          description: mergedDesc,
          price: parseFloat(price),
          discount_price: cleanDiscount,
          stock_quantity: parseInt(stockQuantity) || 0,
          sku: sku.trim() || null,
          barcode: barcode.trim() || null,
          is_active: isActive,
          images: images
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

      await fetchProducts();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        let errMsg = 'Mahsulotni o\'chirish imkoni bo\'lmadi';
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
      await fetchProducts();
    } catch (err) {
      alert('Xatolik yuz berdi');
    }
  };

  // Pagination totals
  const totalPages = Math.ceil(total / pageSize);

  return (
    <ManagementLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Mahsulotlar</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm font-semibold text-slate-400">Do'kon mahsulotlarini to'liq boshqarish va inventarizatsiya</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          Mahsulot qo'shish
        </button>
      </div>

      {/* Filters Form */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-grow max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
            placeholder="Nom yoki SKU bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <select
            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
            value={filterCategoryId}
            onChange={(e) => {
              setFilterCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{parseBilingual(c.name).uz}</option>
            ))}
          </select>

          <select
            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
            value={filterIsActive}
            onChange={(e) => {
              setFilterIsActive(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Barcha holatlar</option>
            <option value="true">Sotuvda bor (Faol)</option>
            <option value="false">Sotuvda yo'q (Nofaol)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="font-bold text-sm">Yuklanmoqda...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-rose-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-2" />
            <p className="font-bold">Mahsulotlarni yuklashda xatolik yuz berdi</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold">Mahsulotlar topilmadi</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Grid Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Rasm</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mahsulot</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategoriya</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Narx</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Soni (Stock)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Holat</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((prod) => {
                    const parsedName = parseBilingual(prod.name);
                    const primaryImage = prod.images.find(img => img.is_primary)?.url || prod.images[0]?.url;
                    
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          {primaryImage ? (
                            <img 
                              src={primaryImage} 
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
                            <p className="font-bold text-slate-900 text-sm leading-snug">{parsedName.uz}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{parsedName.ru}</p>
                            {prod.sku && <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-wider">SKU: {prod.sku}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                            {prod.category ? parseBilingual(prod.category.name).uz : 'Kategoriyasiz'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {prod.discount_price ? (
                              <>
                                <p className="text-sm font-bold text-slate-900">{prod.discount_price.toLocaleString()} so'm</p>
                                <p className="text-xs text-slate-400 line-through">{prod.price.toLocaleString()} so'm</p>
                              </>
                            ) : (
                              <p className="text-sm font-bold text-slate-900">{prod.price.toLocaleString()} so'm</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold ${prod.stock_quantity < 10 ? 'text-amber-600 font-black' : 'text-slate-700'}`}>
                            {prod.stock_quantity} dona
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            prod.is_active 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {prod.is_active ? 'Sotuvda bor' : 'Sotuvda yo\'q'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(prod)}
                              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {deleteConfirmId === prod.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 p-1 rounded-xl">
                                <span className="text-[10px] font-black text-rose-700 px-1.5 uppercase">O'chirilsinmi?</span>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id)}
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
                                onClick={() => setDeleteConfirmId(prod.id)}
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

            {/* Mobile Cards Layout */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.map((prod) => {
                const parsedName = parseBilingual(prod.name);
                const primaryImage = prod.images.find(img => img.is_primary)?.url || prod.images[0]?.url;

                return (
                  <div key={prod.id} className="p-4 flex flex-col gap-3">
                    <div className="flex gap-3">
                      {primaryImage ? (
                        <img 
                          src={primaryImage} 
                          alt={parsedName.uz} 
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate leading-tight">{parsedName.uz}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{parsedName.ru}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                            {prod.category ? parseBilingual(prod.category.name).uz : 'Kategoriyasiz'}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            prod.is_active ? 'text-emerald-700' : 'text-slate-500'
                          }`}>
                            {prod.is_active ? 'Sotuvda bor' : 'Nofaol'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-slate-50 text-xs">
                      <div>
                        <p className="text-slate-400">Narxi:</p>
                        <p className="font-bold text-slate-900">
                          {prod.discount_price ? `${prod.discount_price.toLocaleString()} so'm` : `${prod.price.toLocaleString()} so'm`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400">Zaxira:</p>
                        <p className="font-bold text-slate-900">{prod.stock_quantity} dona</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                      >
                        Tahrirlash
                      </button>
                      {deleteConfirmId === prod.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 p-1 rounded-xl">
                          <span className="text-[10px] font-black text-rose-700 px-2 uppercase">Ishonchingiz komilmi?</span>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-bold"
                          >
                            Ha
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-xs font-bold"
                          >
                            Yo'q
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(prod.id)}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between shrink-0">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Orqaga
                </button>
                <span className="text-xs font-bold text-slate-500">
                  Sahifa {page} / {totalPages} (Jami: {total})
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                >
                  Keyingi
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => !submitting && setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
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
                    placeholder="Masalan: Erkaklar ko'ylagi"
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
                    placeholder="Masalan: Мужская рубашка"
                    value={nameRu}
                    onChange={(e) => setNameRu(e.target.value)}
                  />
                </div>
              </div>

              {/* Category, SKU, and Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Kategoriya *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-bold cursor-pointer"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Kategoriyani tanlang</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{parseBilingual(c.name).uz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    SKU (Artikul)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Masalan: SHIRT-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Shtrix-kod (Barcode)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Shtrix-kod..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>
              </div>

              {/* Prices & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Asosiy Narx (UZS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Masalan: 120000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Chegirma Narxi (UZS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Masalan: 99000"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Zaxira Soni (Stock) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
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
                  placeholder="Mahsulot haqida batafsil tavsif..."
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
                  placeholder="Описание товара..."
                  value={descRu}
                  onChange={(e) => setDescRu(e.target.value)}
                />
              </div>

              {/* Image Upload Gallery */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Mahsulot rasmlari (Birinchisi asosiy rasm bo'ladi)
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
                      <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider px-2"
                            title="Asosiy rasm qilish"
                          >
                            Asosiy
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow">
                          Asosiy
                        </span>
                      )}
                    </div>
                  ))}

                  <label className="aspect-square border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-50 select-none text-slate-400">
                    {uploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-xs font-semibold">Yuklanmoqda</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-semibold">Rasm yuklash</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      disabled={uploading}
                      onChange={handleImageUpload}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Faol holatda (Sotuvda bor)</p>
                  <p className="text-xs text-slate-500">Mijozlarga ushbu mahsulotni saytda ko'rsatish yoki yashirish</p>
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
                  {editingProduct ? 'Saqlash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
}
