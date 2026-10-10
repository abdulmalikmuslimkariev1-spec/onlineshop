import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Phone,
  CreditCard,
  Banknote,
  FileText,
  Calendar,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';
import { BRANDING } from '../../config/branding';

interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  subtotal: number;
}

interface Address {
  id: number;
  title: string;
  address_line: string;
  city: string;
  district?: string;
}

interface Order {
  id: number;
  order_number: string;
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  discount?: number;
  payment_method?: string;
  payment_status?: string;
  status: string;
  customer_note?: string;
  address?: Address;
  created_at: string;
  items: OrderItem[];
  status_history?: any[];
}

export default function OrderDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/customer/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 401) {
        navigate('/login', { state: { from: `/orders/${id}` } });
        return;
      }
      if (res.status === 404 || !res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrder(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-poll every 5 seconds so when Operator/Courier updates status, Customer sees it instantly!
    const timer = setInterval(fetchOrder, 5000);
    return () => clearInterval(timer);
  }, [id, navigate]);

  const steps = [
    { status: 'NEW', label: t('operator.status_NEW'), icon: Clock },
    { status: 'CONFIRMED', label: t('operator.status_CONFIRMED'), icon: CheckCircle2 },
    { status: 'PREPARING', label: t('operator.status_PREPARING'), icon: Package },
    { status: 'READY_FOR_COURIER', label: t('operator.status_READY_FOR_COURIER'), icon: Package },
    { status: 'ON_THE_WAY', label: t('operator.status_ON_THE_WAY'), icon: Truck },
    { status: 'DELIVERED', label: t('operator.status_DELIVERED'), icon: CheckCircle2 }
  ];

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded-md w-1/4" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </StorefrontLayout>
    );
  }

  if (notFound || !order) {
    return (
      <StorefrontLayout>
        <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">
            {t('customer.orderNotFound')}
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            {t('customer.noOrdersDesc')}
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('customer.orderHistory')}</span>
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const currentStepIndex = steps.findIndex(s => s.status === order.status);
  const formattedDate = new Date(order.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/orders')} 
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('operator.orderNumber')}: #{order.order_number}
              </span>
              <h1 className="text-base sm:text-xl font-bold text-slate-900">
                {t('operator.orderDetails')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Status Tracker */}
        {isCancelled ? (
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-3xl flex items-center gap-4 text-rose-700">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t('operator.status_CANCELLED')}</h3>
              <p className="text-xs text-rose-600/90 mt-0.5 font-medium">
                Ushbu buyurtma bekor qilingan.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs overflow-x-auto no-scrollbar">
            <div className="flex justify-between items-center min-w-[580px] relative px-4 py-2">
              <div className="absolute top-[28px] left-10 right-10 h-0.5 bg-slate-100 -z-0" />
              <div 
                className="absolute top-[28px] left-10 h-0.5 bg-blue-600 transition-all duration-500 -z-0"
                style={{ 
                  width: `${Math.max(0, (Math.min(currentStepIndex, steps.length - 1) / (steps.length - 1)) * 82)}%` 
                }}
              />

              {steps.map((step, idx) => {
                const isPast = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isPastOrCurrent = idx <= currentStepIndex;

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all ${
                      isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30'
                        : isPast
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      <step.icon className={`w-4 h-4 ${isCurrent ? 'animate-bounce' : ''}`} />
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight whitespace-nowrap ${
                      isCurrent ? 'text-blue-700 font-bold' : isPast ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Items List & Breakdown */}
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Package className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {t('customer.items')} ({order.items?.length || 0})
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.product_image ? (
                      <img 
                        src={item.product_image} 
                        alt={item.product_name} 
                        className="w-12 h-12 object-cover rounded-xl border border-slate-100 shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 truncate block text-sm">
                        {item.product_name || `Mahsulot #${item.product_id}`}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {item.quantity} × {Number(item.unit_price).toLocaleString()} UZS
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm shrink-0">
                    {Number(item.subtotal || item.unit_price * item.quantity).toLocaleString()} UZS
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-medium">
              <div className="flex justify-between text-slate-600">
                <span>{t('customer.subtotal')}</span>
                <span className="font-semibold text-slate-900">
                  {Number(order.subtotal || order.total).toLocaleString()} UZS
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('customer.deliveryFee')}</span>
                <span className="text-emerald-600 font-bold uppercase">
                  {t('customer.freeDelivery')}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-900 uppercase">
                  {t('customer.total')}
                </span>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-600">
                    {Number(order.total).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-blue-600 uppercase ml-1">
                    UZS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Cards (Delivery Address & Payment) */}
          <div className="space-y-4">
            {/* Delivery Address Card */}
            {order.address && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {t('customer.deliveryAddress')}
                  </h3>
                </div>
                <div className="text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">
                    {order.address.title}
                  </span>
                  <p className="font-semibold text-slate-900">
                    {order.address.address_line}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {order.address.city} {order.address.district ? `(${order.address.district})` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Info Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t('customer.paymentMethod')}
                </h3>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-800">
                  {order.payment_method === 'CASH' ? t('customer.cash') : t('customer.card')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  {order.payment_status || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Customer Note if present */}
            {order.customer_note && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {t('customer.orderNote')}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                  "{order.customer_note}"
                </p>
              </div>
            )}

            {/* Help / Support Card */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                {t('customer.help')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {t('customer.helpDesc')}
              </p>
              <a
                href={`tel:${BRANDING.contact.phone}`}
                className="inline-flex items-center justify-center w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                {t('customer.callUs')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
