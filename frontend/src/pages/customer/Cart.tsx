import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  ArrowLeft, 
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);

  const loadCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const validItems = Array.isArray(cart) ? cart : [];
      setItems(validItems);
      setSubtotal(validItems.reduce((acc: number, item: CartItem) => acc + (Number(item.price) * Number(item.quantity)), 0));
    } catch {
      setItems([]);
      setSubtotal(0);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const saveCart = (updated: CartItem[]) => {
    setItems(updated);
    setSubtotal(updated.reduce((acc: number, item: CartItem) => acc + (Number(item.price) * Number(item.quantity)), 0));
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQuantity = (id: number, delta: number) => {
    const updated = items.map(item => {
      if (item.product_id === id) {
        const nextQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const removeItem = (id: number) => {
    const updated = items.filter(item => item.product_id !== id);
    saveCart(updated);
  };

  if (items.length === 0) {
    return (
      <StorefrontLayout>
        <div className="max-w-md mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
            <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            {t('customer.emptyCart')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            Savatingizda hali hech narsa yo'q. Xaridni davom ettiring!
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('customer.backToCatalog')}</span>
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="flex items-center justify-between pb-3 mb-4 sm:mb-6 border-b border-slate-200/60">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
            {t('customer.cart')}
          </h1>
          <span className="text-xs text-slate-500">
            {items.length} {t('customer.itemsCount')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Cart Item List */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div 
                key={item.product_id} 
                className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 hover:border-slate-200/80 shadow-2xs flex items-center gap-3 sm:gap-4 transition-all"
              >
                {/* Product thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-slate-300 stroke-[1.25]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/products/${item.product_id}`} 
                    className="block font-semibold text-slate-900 hover:text-blue-600 transition-colors text-xs sm:text-sm truncate mb-1"
                  >
                    {item.name}
                  </Link>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      UZS
                    </span>
                  </div>

                  {/* Quantity and Delete Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50/70 p-0.5 shadow-2xs">
                      <button 
                        onClick={() => updateQuantity(item.product_id, -1)} 
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-blue-600 font-bold active:scale-90 transition-transform"
                        aria-label="Kamaytirish"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, 1)} 
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-blue-600 font-bold active:scale-90 transition-transform"
                        aria-label="Ko'paytirish"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeItem(item.product_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors active:scale-90"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Item Subtotal on larger screens */}
                <div className="hidden sm:block text-right shrink-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    {t('customer.subtotal')}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-900">
                      {(item.price * item.quantity).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      UZS
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Card */}
          <div className="space-y-4 lg:sticky lg:top-20">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">
                {t('customer.orderSummary')}
              </h2>

              <div className="space-y-3 mb-5 text-xs font-medium">
                <div className="flex justify-between items-center text-slate-600">
                  <span>{t('customer.subtotal')}</span>
                  <span className="font-semibold text-slate-900">{subtotal.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>{t('customer.deliveryFee')}</span>
                  <span className="text-emerald-600 font-bold uppercase">{t('customer.freeDelivery')}</span>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-bold text-slate-900">{t('customer.total')}</span>
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-black text-blue-600">
                      {subtotal.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-blue-600 uppercase ml-1">
                      UZS
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>{t('customer.checkout')}</span>
              </button>
            </div>

            {/* Trust badge */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  {t('customer.safeShopping')}
                </span>
                <span className="text-slate-500 text-[11px] leading-relaxed">
                  {t('customer.safeShoppingDesc')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
