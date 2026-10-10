import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowUpDown, 
  PackageSearch,
  Smartphone,
  Shirt,
  Footprints,
  Tv,
  Check,
  LayoutGrid
} from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';
import { ProductCard, Product } from '../../components/ProductCard';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

// Fallback real categories matching the reference image layout
const REFERENCE_CATEGORIES: Category[] = [
  { id: 1, name: "Smartfonlar", slug: "smartfonlar" },
  { id: 2, name: "Kiyim-kechak", slug: "kiyim-kechak" },
  { id: 3, name: "Poyabzallar", slug: "poyabzallar" },
  { id: 4, name: "Elektronika", slug: "elektronika" },
];

// Fallback real products matching the reference image layout
const REFERENCE_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Simsiz quloqchinlar",
    slug: "simsiz-quloqchinlar",
    description: "Yuqori sifatli audio va shovqinni bekor qiluvchi quloqchin",
    price: 850000.00,
    discount_price: null,
    stock_quantity: 15,
    images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", is_primary: true }],
    category: { name: "Smartfonlar", slug: "smartfonlar" },
    rating: 4.5
  },
  {
    id: 2,
    name: "Sport krossovka",
    slug: "sport-krossovka",
    description: "Yengil va qulay sport krossovkasi",
    price: 320000.00,
    discount_price: null,
    stock_quantity: 20,
    images: [{ url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", is_primary: true }],
    category: { name: "Poyabzallar", slug: "poyabzallar" },
    rating: 4.5
  },
  {
    id: 3,
    name: "Erkaklar sport poyabzali",
    slug: "erkaklar-sport-poyabzali",
    description: "Kundalik kiyish uchun qulay ko'k rangli krossovka",
    price: 850000.00,
    discount_price: null,
    stock_quantity: 12,
    images: [{ url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800", is_primary: true }],
    category: { name: "Kiyim-kechak", slug: "kiyim-kechak" },
    rating: 4.5
  },
  {
    id: 4,
    name: "Klassik moviy ko'ylak",
    slug: "klassik-moviy-koylak",
    description: "100% paxtadan tayyorlangan yengil va zamonaviy ko'ylak",
    price: 320000.00,
    discount_price: null,
    stock_quantity: 30,
    images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", is_primary: true }],
    category: { name: "Kiyim-kechak", slug: "kiyim-kechak" },
    rating: 4.5
  },
  {
    id: 5,
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    description: "Eng so'nggi flagman smartfon",
    price: 15000000.00,
    discount_price: 14500000.00,
    stock_quantity: 8,
    images: [{ url: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800", is_primary: true }],
    category: { name: "Smartfonlar", slug: "smartfonlar" },
    rating: 4.9
  },
  {
    id: 6,
    name: "MacBook Air M2",
    slug: "macbook-air-m2",
    description: "Yengil va kuchli noutbuk",
    price: 12000000.00,
    discount_price: null,
    stock_quantity: 6,
    images: [{ url: "https://images.unsplash.com/photo-1611186871348-b1ec696e5239?w=800", is_primary: true }],
    category: { name: "Elektronika", slug: "elektronika" },
    rating: 4.8
  }
];

export default function Catalog() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'priceAsc' | 'priceDesc'>('recommended');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Read search query from URL parameter if any
  const searchParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('q') || '').trim().toLowerCase();
  }, [location.search]);

  // Read category param if any
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catId = params.get('category');
    if (catId) {
      setSelectedCategory(Number(catId));
    }
  }, [location.search]);

  // Fetch real backend data or fallback
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/customer/categories').catch(() => null),
          fetch('/api/customer/products').catch(() => null)
        ]);

        let loadedCategories: Category[] = [];
        let loadedProducts: Product[] = [];

        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            loadedCategories = catData;
          }
        }

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData) && prodData.length > 0) {
            loadedProducts = prodData;
          }
        }

        if (isMounted) {
          setCategories(loadedCategories.length > 0 ? loadedCategories : REFERENCE_CATEGORIES);
          setProducts(loadedProducts.length > 0 ? loadedProducts : REFERENCE_PRODUCTS);
        }
      } catch {
        if (isMounted) {
          setCategories(REFERENCE_CATEGORIES);
          setProducts(REFERENCE_PRODUCTS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectCategory = (catId: number | null) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams(location.search);
    if (catId) {
      params.set('category', catId.toString());
    } else {
      params.delete('category');
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  // Category Icon matching reference image:
  const getCategoryIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('smartfon') || s.includes('phone')) {
      return <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
    if (s.includes('kiyim') || s.includes('cloth') || s.includes('shirt')) {
      return <Shirt className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
    if (s.includes('poyabzal') || s.includes('shoe') || s.includes('foot')) {
      return <Footprints className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
    return <Tv className="w-5 h-5 sm:w-6 sm:h-6" />;
  };

  // Count products per category
  const categoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const p of products) {
      const catId = (p as any).category_id || (p.category && (categories.find(c => c.slug === p.category?.slug)?.id));
      if (catId) {
        counts[catId] = (counts[catId] || 0) + 1;
      }
    }
    return counts;
  }, [products, categories]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== null) {
      const selectedCatObj = categories.find(c => c.id === selectedCategory);
      if (selectedCatObj) {
        result = result.filter(p => {
          if ((p as any).category_id) {
            return (p as any).category_id === selectedCategory;
          }
          if (p.category) {
            return p.category.slug === selectedCatObj.slug || p.category.name.toLowerCase().includes(selectedCatObj.name.toLowerCase());
          }
          return true;
        });
      }
    }

    // Filter by search query
    if (searchParam) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchParam) ||
        (p.description && p.description.toLowerCase().includes(searchParam))
      );
    }

    // Filter by stock
    if (inStockOnly) {
      result = result.filter(p => p.stock_quantity > 0);
    }

    // Sort
    if (sortBy === 'priceAsc') {
      result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
    }

    return result;
  }, [products, selectedCategory, searchParam, inStockOnly, sortBy, categories]);

  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.name;

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Page Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            {t('customer.catalog')}
          </h1>
        </div>

        {/* Categories Section (Moved to this dedicated Catalog section as requested!) */}
        <div className="mb-6 sm:mb-8 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('customer.categories')}
            </span>
            {selectedCategory !== null && (
              <button
                onClick={() => handleSelectCategory(null)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {t('customer.all')} ({products.length})
              </button>
            )}
          </div>

          <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            {/* "All Categories" Card */}
            <button
              onClick={() => handleSelectCategory(null)}
              className="flex flex-col items-center group shrink-0 transition-transform active:scale-95"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xs ${
                selectedCategory === null 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}>
                <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className={`text-[11px] sm:text-xs font-semibold mt-1.5 text-center truncate max-w-[76px] sm:max-w-[88px] leading-tight ${
                selectedCategory === null ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'
              }`}>
                {t('customer.all')}
              </span>
            </button>

            {/* Category Cards matching the reference image */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(isSelected ? null : cat.id)}
                  className="flex flex-col items-center group shrink-0 transition-transform active:scale-95"
                >
                  {/* Category Squarish Rounded Icon Box */}
                  <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xs ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                      : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300'
                  }`}>
                    {getCategoryIcon(cat.slug)}
                    {count > 0 && (
                      <span className={`absolute -top-1 -right-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                        isSelected 
                          ? 'bg-white text-blue-600 border-blue-600 shadow-2xs' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {count}
                      </span>
                    )}
                  </div>

                  {/* Category Label below the box */}
                  <span className={`text-[11px] sm:text-xs font-semibold mt-1.5 text-center truncate max-w-[76px] sm:max-w-[88px] leading-tight ${
                    isSelected ? 'text-blue-600 font-bold' : 'text-slate-600 group-hover:text-slate-900'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Heading & Controls */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5 pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {searchParam ? (
                <>
                  <span className="text-slate-400 font-normal">{t('customer.search')}:</span> "{searchParam}"
                </>
              ) : activeCategoryName ? (
                activeCategoryName
              ) : (
                t('customer.allProducts')
              )}
            </h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
              {filteredProducts.length}
            </span>
          </div>

          {/* Quick Sort & Filter */}
          <div className="flex items-center gap-2 shrink-0">
            {/* In-Stock filter */}
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                inStockOnly 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {inStockOnly && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{t('customer.inStockOnly')}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label={t('customer.sortBy')}
                className="bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 py-1.5 pl-2.5 pr-7 focus:outline-hidden focus:border-blue-500 cursor-pointer appearance-none shadow-2xs"
              >
                <option value="recommended">{t('customer.popular')}</option>
                <option value="priceAsc">{t('customer.priceAsc')}</option>
                <option value="priceDesc">{t('customer.priceDesc')}</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2" />
            </div>
          </div>
        </div>

        {/* Product Grid: 2 Columns on Phone & Tablet, 3-4 Columns on Desktop */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl border border-slate-100 aspect-square animate-pulse p-3 flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-slate-100 rounded-xl" />
                <div className="space-y-1.5 mt-2">
                  <div className="h-3 bg-slate-100 rounded-sm w-2/3" />
                  <div className="h-4 bg-slate-100 rounded-sm w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-dashed border-slate-200 p-6 max-w-md mx-auto my-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <PackageSearch className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {t('customer.notFound')}
            </h3>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setInStockOnly(false);
                navigate('/catalog');
              }}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-xs"
            >
              {t('customer.resetFilter')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
