import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowUpDown, 
  PackageSearch,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';
import { ProductCard, Product } from '../../components/ProductCard';

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

export default function Home() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'priceAsc' | 'priceDesc'>('recommended');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Read search query from URL parameter if any
  const searchParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('q') || '').trim().toLowerCase();
  }, [location.search]);

  // Rotate banners automatically every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleBannerClick = (b: any) => {
    if (b.product_id && b.product?.slug) {
      navigate(`/products/${b.product.slug}`);
    } else if (b.category_id) {
      navigate(`/catalog?category_id=${b.category_id}`);
    }
  };

  const handlePrevBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (banners.length <= 1) return;
    setActiveBannerIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleNextBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (banners.length <= 1) return;
    setActiveBannerIndex(prev => (prev + 1) % banners.length);
  };

  // Fetch real backend products, banners or fallback
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const prodRes = await fetch('/api/customer/products').catch(() => null);
        const bannerRes = await fetch('/api/admin/banners').catch(() => null);

        let loadedProducts: Product[] = [];
        let loadedBanners: any[] = [];

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData) && prodData.length > 0) {
            loadedProducts = prodData;
          }
        }

        if (bannerRes && bannerRes.ok) {
          const bannerData = await bannerRes.json();
          if (Array.isArray(bannerData)) {
            loadedBanners = bannerData;
          }
        }

        if (isMounted) {
          setProducts(loadedProducts.length > 0 ? loadedProducts : REFERENCE_PRODUCTS);
          setBanners(loadedBanners);
        }
      } catch {
        if (isMounted) {
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

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

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
  }, [products, searchParam, inStockOnly, sortBy]);

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <div className="relative w-full aspect-[21/9] sm:aspect-[24/8] md:aspect-[3/1] rounded-[2rem] overflow-hidden border border-slate-100 shadow-xs mb-6 sm:mb-8 group">
            {banners.map((b, idx) => (
              <div
                key={b.id}
                onClick={() => handleBannerClick(b)}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out cursor-pointer ${
                  idx === activeBannerIndex ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95 pointer-events-none'
                }`}
              >
                <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/20 to-transparent flex flex-col justify-center px-6 sm:px-12 md:px-16 text-white">
                  <h2 className="text-sm sm:text-lg md:text-xl lg:text-3xl font-black max-w-md sm:max-w-lg tracking-tight leading-tight mb-1.5 sm:mb-3 drop-shadow-xs">
                    {b.name}
                  </h2>
                  <span className="inline-flex self-start px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    Batafsil ko'rish
                  </span>
                </div>
              </div>
            ))}

            {/* Left & Right Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevBanner}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                  aria-label="Oldingi banner"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextBanner}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                  aria-label="Keyingi banner"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Slider Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveBannerIndex(idx); }}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeBannerIndex ? 'w-6 bg-white shadow-xs' : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Banner ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Heading & Controls (matching reference image: "Tavsiya etilgan mahsulotlar" right under search) */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5 pb-1">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight">
            {searchParam ? (
              <>
                <span className="text-slate-400 font-normal">{t('customer.search')}:</span> "{searchParam}"
              </>
            ) : (
              t('customer.recommendedProducts')
            )}
          </h1>

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
                setInStockOnly(false);
                navigate('/');
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
