import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Plus, 
  CreditCard, 
  CheckCircle2, 
  Banknote,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  Package,
  Check
} from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';

interface Address {
  id: number;
  title: string;
  address_line: string;
  city: string;
  is_default: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [customerNote, setCustomerNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<{
    title: string;
    address_line: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
  }>({
    title: '',
    address_line: '',
    city: 'Toshkent',
    latitude: null,
    longitude: null,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleDetermineLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      alert("Sizning brauzeringiz Geolocation API-ni qo'llab-quvvatlamaydi.");
      return;
    }

    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddressForm(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGeoStatus('success');
      },
      (error) => {
        console.error(error);
        setGeoStatus('error');
        alert("Lokatsiyani aniqlash imkoni bo'lmadi. Iltimos, brauzerda ruxsat berilganini tekshiring.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 401) {
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }
      if (res.ok) {
        const data: Address[] = await res.json();
        if (Array.isArray(data)) {
          setAddresses(data);
          if (data.length > 0 && !selectedAddressId) {
            const def = data.find((a) => a.is_default) || data[0];
            setSelectedAddressId(def.id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const rawCart = localStorage.getItem('cart');
      const cartData: CartItem[] = rawCart ? JSON.parse(rawCart) : [];
      if (!cartData || cartData.length === 0) {
        navigate('/cart');
        return;
      }
      setCart(cartData);
      await fetchAddresses();
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({ title: 'Uy', address_line: '', city: 'Toshkent', latitude: null, longitude: null });
    setGeoStatus('idle');
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setAddressForm({
      title: addr.title,
      address_line: addr.address_line,
      city: addr.city,
      latitude: addr.latitude || null,
      longitude: addr.longitude || null,
    });
    setGeoStatus(addr.latitude && addr.longitude ? 'success' : 'idle');
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addrId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/customer/addresses/${addrId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        if (selectedAddressId === addrId) {
          setSelectedAddressId(null);
        }
        await fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.title.trim() || !addressForm.address_line.trim()) {
      return;
    }
    setSavingAddress(true);
    try {
      if (editingAddressId) {
        const res = await fetch(`/api/customer/addresses/${editingAddressId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(addressForm)
        });
        if (res.ok) {
          setShowAddressModal(false);
          await fetchAddresses();
        }
      } else {
        const res = await fetch('/api/customer/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            ...addressForm,
            is_default: addresses.length === 0
          })
        });
        if (res.ok) {
          const newAddr: Address = await res.json();
          setShowAddressModal(false);
          await fetchAddresses();
          setSelectedAddressId(newAddr.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);

    if (cart.length === 0) {
      setError(t('customer.emptyCartPrompt'));
      return;
    }

    if (!selectedAddressId) {
      setError(t('customer.selectAddressPrompt'));
      return;
    }

    setPlacing(true);
    try {
      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          customer_note: customerNote.trim() ? customerNote.trim() : null,
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || t('common.error'));
        setPlacing(false);
        return;
      }

      const orderData = await response.json();
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));
      navigate(`/orders/${orderData.id}`, { replace: true });
    } catch {
      setError(t('common.error'));
      setPlacing(false);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded-md w-1/4" />
          <div className="h-40 bg-slate-200 rounded-2xl" />
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Navigation Bar */}
        <div className="flex items-center gap-3 pb-3 mb-6 border-b border-slate-200/60">
          <button 
            onClick={() => navigate('/cart')} 
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
            {t('customer.checkout')}
          </h1>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-5">
            {/* Delivery Address Section */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {t('customer.deliveryAddress')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('customer.addAddress')}</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-3 font-medium">
                    {t('customer.noAddresses')}
                  </p>
                  <button 
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('customer.addAddress')}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => { setSelectedAddressId(addr.id); setError(null); }}
                        className={`text-left p-3.5 rounded-xl border transition-all relative cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            {addr.title}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditAddress(addr, e)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                              title={t('customer.editAddress')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title={t('customer.deleteAddress')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 line-clamp-2 pr-6">
                          {addr.address_line}, {addr.city}
                        </p>

                        {isSelected && (
                          <div className="absolute bottom-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Products Breakdown */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    {t('customer.items')} ({cart.length})
                  </h2>
                </div>
                <Link to="/cart" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  {t('customer.cart')}
                </Link>
              </div>

              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0" 
                        />
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 truncate block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.quantity} × {item.price.toLocaleString()} UZS
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      {(item.price * item.quantity).toLocaleString()} UZS
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {t('customer.paymentMethod')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Banknote className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      {t('customer.cash')}
                    </span>
                  </div>
                  {paymentMethod === 'CASH' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      {t('customer.card')}
                    </span>
                  </div>
                  {paymentMethod === 'CARD' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Optional Customer Note Section */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <label className="text-xs font-bold text-slate-800 block mb-2">
                {t('customer.orderNote')}
              </label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder={t('customer.notePlaceholder')}
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-20">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">
                {t('customer.orderSummary')}
              </h2>

              <div className="space-y-2.5 mb-4 text-xs font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>{t('customer.subtotal')}</span>
                  <span className="font-semibold text-slate-900">{subtotal.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('customer.deliveryFee')}</span>
                  <span className="text-emerald-600 font-bold uppercase">{t('customer.freeDelivery')}</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-900">{t('customer.total')}</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-blue-600">
                      {subtotal.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-blue-600 uppercase ml-1">
                      UZS
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 mb-4 text-center">
                {t('customer.priceRecalculatedNotice')}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {placing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('customer.placeOrder')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Shopping Assurance */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('customer.safeShoppingDesc')}</span>
            </div>
          </div>
        </div>

        {/* Address Modal (Add / Edit) */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  {editingAddressId ? t('customer.editAddress') : t('customer.addAddress')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    {t('customer.addressTitle')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Uy, Ishxona, Ota-onam uyi..."
                    value={addressForm.title}
                    onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    {t('customer.addressLine')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Amir Temur shoh ko'chasi, 45-uy, 12-xonadon"
                    value={addressForm.address_line}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">Koordinatalar</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono truncate">
                      {addressForm.latitude && addressForm.longitude 
                        ? `${addressForm.latitude.toFixed(5)}, ${addressForm.longitude.toFixed(5)}`
                        : "Lokatsiya aniqlanmagan"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetermineLocation}
                    disabled={geoStatus === 'loading'}
                    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all border shrink-0 ${
                      geoStatus === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-blue-600 hover:text-blue-700 shadow-2xs'
                    }`}
                  >
                    {geoStatus === 'loading' ? 'Aniqlanmoqda...' : 'Lokatsiyamni aniqlash'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    {t('customer.city')}
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {savingAddress ? t('common.loading') : t('customer.saveAddress')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
