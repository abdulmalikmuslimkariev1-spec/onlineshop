import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Plus, Check, ShoppingBag, Star } from 'lucide-react';
import { isFavorite, toggleFavorite } from '../utils/favorites';

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  images: { url: string; is_primary: boolean }[];
  category?: { name: string; slug: string } | null;
  rating?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (productId: number) => void;
}

export function ProductCard({ product, onAddToCart, onToggleFavorite }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const [favorite, setFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const getLocalizedName = (name: string) => {
    if (!name) return '';
    if (!name.includes('|')) return name;
    const parts = name.split('|');
    const isRu = i18n.language === 'ru';
    const localized = isRu ? parts[1] : parts[0];
    return (localized || '').trim() || name;
  };

  useEffect(() => {
    setFavorite(isFavorite(product.id));

    const handleFavUpdate = () => {
      setFavorite(isFavorite(product.id));
    };
    window.addEventListener('favorites-updated', handleFavUpdate);
    return () => window.removeEventListener('favorites-updated', handleFavUpdate);
  }, [product.id]);

  const primaryImage = product.images?.find(img => img.is_primary)?.url || product.images?.[0]?.url || '';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleFavorite(product.id);
    setFavorite(updated);
    if (onToggleFavorite) {
      onToggleFavorite(product.id);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock_quantity <= 0) return;

    if (onAddToCart) {
      onAddToCart(product);
    } else {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existing = cart.find((item: any) => item.product_id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          product_id: product.id,
          name: getLocalizedName(product.name),
          price: product.discount_price || product.price,
          quantity: 1,
          image: primaryImage
        });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const hasDiscount = Boolean(product.discount_price && product.discount_price < product.price);
  const currentPrice = product.discount_price || product.price;
  const ratingScore = product.rating || 4.5;

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-100/90 hover:border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden relative">
      {/* Product Image Container */}
      <Link 
        to={`/products/${product.slug}`} 
        className="block relative aspect-square bg-slate-50 overflow-hidden"
      >
        {primaryImage && !imageError ? (
          <img 
            src={primaryImage} 
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 text-slate-300 p-4">
            <ShoppingBag className="w-10 h-10 stroke-[1.25] text-slate-300 group-hover:text-blue-500/70 transition-colors" />
            <span className="text-[10px] text-slate-400 font-medium mt-1 text-center line-clamp-1">
              {product.name}
            </span>
          </div>
        )}

        {/* Favorite Heart Button (Top-Right, matching reference image) */}
        <button
          onClick={handleFavoriteClick}
          aria-label={t('customer.favorites')}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 active:scale-90 ${
            favorite 
              ? 'bg-white text-rose-500 shadow-xs' 
              : 'bg-white/80 backdrop-blur-xs text-slate-400 hover:text-rose-500 hover:bg-white shadow-2xs'
          }`}
        >
          <Heart 
            className={`w-4 h-4 transition-transform duration-200 ${favorite ? 'fill-rose-500 text-rose-500' : 'stroke-[1.75]'}`} 
          />
        </button>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
            -{Math.round(((product.price - (product.discount_price || 0)) / product.price) * 100)}%
          </div>
        )}

        {/* Out of Stock Notice */}
        {product.stock_quantity <= 0 && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/75 backdrop-blur-xs py-1 text-center">
            <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
              {t('customer.outOfStock')}
            </span>
          </div>
        )}
      </Link>

      {/* Product Card Content */}
      <div className="p-2.5 sm:p-3.5 flex-grow flex flex-col justify-between">
        <div>
          {/* Category kicker / Product Title */}
          <Link 
            to={`/products/${product.slug}`}
            className="block text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors line-clamp-1 mb-1"
            title={product.name}
          >
            {getLocalizedName(product.name)}
          </Link>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-1.5">
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              {currentPrice.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
              UZS
            </span>
            {hasDiscount && (
              <span className="text-[9px] text-slate-400 line-through font-normal ml-1">
                {product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: Rating Star + Add button */}
        <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between gap-1">
          {/* Rating (matching reference image: yellow star + 4.5) */}
          <div className="flex items-center gap-1">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {ratingScore.toFixed(1)}
            </span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleAdd}
            disabled={product.stock_quantity <= 0}
            aria-label={t('customer.addToCart')}
            className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : product.stock_quantity <= 0
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {justAdded ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
