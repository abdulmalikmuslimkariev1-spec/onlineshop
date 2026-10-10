import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  ChevronRight, 
  ShoppingBag, 
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { StorefrontLayout } from '../../components/StorefrontLayout';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string;
  product_image?: string;
}

interface Order {
  id: number;
  order_number: string;
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

export default function Orders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/customer/orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 401) {
        navigate('/login', { state: { from: '/orders' } });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh orders list every 10 seconds to catch status updates from Operator/Courier
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return { label: t('operator.status_NEW'), color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'CONFIRMED':
        return { label: t('operator.status_CONFIRMED'), color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'PREPARING':
        return { label: t('operator.status_PREPARING'), color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'READY_FOR_COURIER':
        return { label: t('operator.status_READY_FOR_COURIER'), color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'ASSIGNED':
        return { label: t('operator.status_ASSIGNED'), color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
      case 'ON_THE_WAY':
        return { label: t('operator.status_ON_THE_WAY'), color: 'text-orange-700 bg-orange-50 border-orange-200' };
      case 'DELIVERED':
        return { label: t('operator.status_DELIVERED'), color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'CANCELLED':
        return { label: t('operator.status_CANCELLED'), color: 'text-rose-700 bg-rose-50 border-rose-200' };
      default:
        return { label: status, color: 'text-slate-700 bg-slate-100 border-slate-200' };
    }
  };

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-5 sm:mb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900">
                {t('customer.orderHistory')}
              </h1>
              <span className="text-xs text-slate-500 font-medium">
                {orders.length} {t('customer.itemsCount')}
              </span>
            </div>
          </div>

          <Link
            to="/catalog"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('customer.catalog')}</span>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse p-4" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-dashed border-slate-200/80 p-6 max-w-md mx-auto my-6 shadow-2xs">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {t('customer.noOrdersYet')}
            </h2>
            <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
              {t('customer.noOrdersDesc')}
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('customer.catalog')}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              const formattedDate = new Date(order.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors">
                        #{order.order_number}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formattedDate}</span>
                      {order.items && order.items.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{order.items.length} {t('customer.itemsCount')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {t('customer.total')}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {Number(order.total).toLocaleString()} UZS
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
