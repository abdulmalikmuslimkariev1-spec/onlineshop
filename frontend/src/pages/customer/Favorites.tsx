import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';
import { ProductCard, Product } from '../../components/ProductCard';
import { getFavorites } from '../../utils/favorites';

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

export default function Favorites() {
  const { t } = useTranslation();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavoriteProducts = async () => {
    setLoading(true);
    const favIds = getFavorites();

    if (favIds.length === 0) {
      setFavoriteProducts([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/customer/products').catch(() => null);
      let allProducts: Product[] = [];

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          allProducts = data;
        }
      }

      if (allProducts.length === 0) {
        allProducts = FALLBACK_PRODUCTS;
      }

      const filtered = allProducts.filter(p => favIds.includes(p.id));
      setFavoriteProducts(filtered);
    } catch {
      const filtered = FALLBACK_PRODUCTS.filter(p => favIds.includes(p.id));
      setFavoriteProducts(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavoriteProducts();

    const handleFavUpdate = () => {
      loadFavoriteProducts();
    };

    window.addEventListener('favorites-updated', handleFavUpdate);
    return () => window.removeEventListener('favorites-updated', handleFavUpdate);
  }, []);

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Header section */}
        <div className="flex items-center justify-between pb-4 mb-4 sm:mb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900">
                {t('customer.favorites')}
              </h1>
              <span className="text-xs text-slate-500">
                {favoriteProducts.length} {t('customer.itemsCount')}
              </span>
            </div>
          </div>

          <Link
            to="/catalog"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('customer.catalog')}</span>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl border border-slate-100 aspect-[4/5] animate-pulse p-3 flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-slate-100 rounded-xl" />
                <div className="space-y-2 mt-2">
                  <div className="h-3 bg-slate-100 rounded-sm w-3/4" />
                  <div className="h-4 bg-slate-100 rounded-sm w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : favoriteProducts.length === 0 ? (
          /* Empty Favorites State */
          <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border border-dashed border-slate-200/80 p-6 max-w-md mx-auto my-6 shadow-2xs">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
              <Heart className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-1.5">
              {t('customer.emptyFavorites')}
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {t('customer.emptyFavoritesDesc')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('customer.browseCatalog')}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {favoriteProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onToggleFavorite={() => loadFavoriteProducts()}
              />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
