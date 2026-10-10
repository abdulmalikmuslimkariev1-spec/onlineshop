import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Heart, 
  ShoppingCart, 
  Check, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  ShoppingBag,
  PackageCheck
} from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';
import { Product } from '../../components/ProductCard';
import { isFavorite, toggleFavorite } from '../../utils/favorites';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    description: "Eng yangi va kuchli iPhone",
    price: 15000000.00,
    discount_price: 14500000.00,
    stock_quantity: 10,
    images: [{ url: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800", is_primary: true }],
    category: { name: "Elektronika", slug: "elektronika" }
  },
  {
    id: 2,
    name: "MacBook Air M2",
    slug: "macbook-air-m2",
    description: "Yengil va samarali noutbuk",
    price: 12000000.00,
    discount_price: null,
    stock_quantity: 5,
    images: [{ url: "https://images.unsplash.com/photo-1611186871348-b1ec696e5239?w=800", is_primary: true }],
    category: { name: "Elektronika", slug: "elektronika" }
  },
  {
    id: 3,
    name: "Erkaklar ko'ylagi",
    slug: "mens-shirt",
    description: "Sifatli paxtadan tikilgan zamonaviy ko'ylak",
    price: 250000.00,
    discount_price: null,
    stock_quantity: 50,
    images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", is_primary: true }],
    category: { name: "Kiyim-kechak", slug: "kiyim-kechak" }
  }
];

export default function ProductDetail() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const getLocalizedName = (name: string) => {
    if (!name) return '';
    if (!name.includes('|')) return name;
    const parts = name.split('|');
    const isRu = i18n.language === 'ru';
    const localized = isRu ? parts[1] : parts[0];
    return (localized || '').trim() || name;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer/products/${slug}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setProduct(data);
            const primary = data.images?.find((img: any) => img.is_primary)?.url || data.images?.[0]?.url || '';
            setActiveImage(primary);
            setFavorite(isFavorite(data.id));
            return;
          }
        }

        // Fallback for disconnected DB environment
        const fallback = FALLBACK_PRODUCTS.find(p => p.slug === slug || String(p.id) === slug) || FALLBACK_PRODUCTS[0];
        if (isMounted) {
          setProduct(fallback);
          setActiveImage(fallback.images?.[0]?.url || '');
          setFavorite(isFavorite(fallback.id));
        }
      } catch {
        const fallback = FALLBACK_PRODUCTS[0];
        if (isMounted) {
          setProduct(fallback);
          setActiveImage(fallback.images?.[0]?.url || '');
          setFavorite(isFavorite(fallback.id));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleFavoriteToggle = () => {
    if (!product) return;
    const isNowFav = toggleFavorite(product.id);
    setFavorite(isNowFav);
  };

  const handleAddToCart = () => {
    if (!product || product.stock_quantity <= 0) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.product_id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.discount_price || product.price,
        quantity: quantity,
        image: activeImage
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-slate-200 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 rounded-md w-3/4" />
              <div className="h-8 bg-slate-200 rounded-md w-1/3" />
              <div className="h-24 bg-slate-200 rounded-2xl w-full" />
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="max-w-md mx-auto py-20 px-4 text-center">
          <p className="text-slate-500 mb-4">{t('customer.notFound')}</p>
          <Link to="/" className="text-blue-600 font-semibold hover:underline">
            {t('customer.backToCatalog')}
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  const hasDiscount = Boolean(product.discount_price && product.discount_price < product.price);
  const currentPrice = product.discount_price || product.price;

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 overflow-x-auto whitespace-nowrap pb-1">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            {t('customer.home')}
          </Link>
          <span className="text-slate-300">/</span>
          <Link to="/catalog" className="hover:text-blue-600 transition-colors">
            {t('customer.catalog')}
          </Link>
          {product.category && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-medium">{product.category.name}</span>
            </>
          )}
        </nav>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Gallery Area */}
          <div className="space-y-3">
            <div className="relative aspect-square sm:aspect-[4/4] bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex items-center justify-center">
              {activeImage ? (
                <img 
                  src={activeImage} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                  <ShoppingBag className="w-16 h-16 stroke-[1.25]" />
                </div>
              )}

              {/* Floating Favorite Button */}
              <button
                onClick={handleFavoriteToggle}
                className={`absolute top-3 right-3 p-2.5 rounded-full transition-all active:scale-90 shadow-sm ${
                  favorite 
                    ? 'bg-rose-50 text-rose-500' 
                    : 'bg-white/90 backdrop-blur-xs text-slate-400 hover:text-rose-500 hover:bg-white'
                }`}
                aria-label={t('customer.favorites')}
              >
                <Heart className={`w-5 h-5 ${favorite ? 'fill-rose-500' : ''}`} />
              </button>

              {/* Discount Tag */}
              {hasDiscount && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                  {t('customer.discount')}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img.url)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                      activeImage === img.url 
                        ? 'border-blue-600 shadow-xs' 
                        : 'border-slate-200/70 hover:border-slate-300'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Actions Area */}
          <div className="flex flex-col space-y-5">
            {/* Title & Category */}
            <div>
              {product.category && (
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1 block">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                {getLocalizedName(product.name)}
              </h1>
            </div>

            {/* Price section */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {currentPrice.toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                  UZS
                </span>
                {hasDiscount && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-black rounded-lg">
                    -{Math.round(((product.price - (product.discount_price || 0)) / product.price) * 100)}% Chegirma
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="text-xs text-slate-400 font-medium">
                  Eski narxi: <span className="line-through">{product.price.toLocaleString()} UZS</span>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 text-xs">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span className={`font-semibold ${product.stock_quantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {product.stock_quantity > 0 ? t('customer.inStock') : t('customer.outOfStock')}
              </span>
              {product.stock_quantity > 0 && (
                <span className="text-slate-400">({product.stock_quantity} {t('customer.itemsCount')})</span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('customer.aboutProduct')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description || t('customer.noDescription')}
              </p>
            </div>

            {/* Quantity Selector & Desktop Add-to-Cart */}
            <div className="pt-3 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">
                  {t('customer.quantity')}:
                </span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Desktop Button */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 ${
                  addedAnimation
                    ? 'bg-emerald-600 text-white'
                    : product.stock_quantity <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{t('customer.addedToCart')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t('customer.addToCart')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Shopping Assurance / Trust markers */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
              <div className="p-2.5 bg-slate-50/70 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-[10px] font-semibold text-slate-700 block">
                  {t('customer.warranty')}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50/70 rounded-xl">
                <Truck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[10px] font-semibold text-slate-700 block">
                  {t('customer.fastDelivery')}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50/70 rounded-xl">
                <RotateCcw className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <span className="text-[10px] font-semibold text-slate-700 block">
                  {t('customer.returnPolicy')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Purchase Bar (Fixed above bottom navigation) */}
      <div className="md:hidden fixed bottom-14 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">
              {t('customer.price')}:
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-slate-900 leading-tight">
                {currentPrice.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                UZS
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity <= 0}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : product.stock_quantity <= 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t('customer.addedToCart')}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>{t('customer.addToCart')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </StorefrontLayout>
  );
}
