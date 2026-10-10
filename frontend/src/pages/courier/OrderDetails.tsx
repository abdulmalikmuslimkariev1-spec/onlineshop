import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  History, 
  MapPin, 
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Navigation
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface StatusHistory {
  id: number;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  payment_method: string;
  payment_status: string;
  customer_note: string | null;
  created_at: string;
  items: OrderItem[];
  status_history: StatusHistory[];
}

export default function CourierOrderDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState('');

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/courier/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!window.confirm(t('operator.confirmStatusChange'))) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/courier/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus, note })
      });
      
      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || t('common.error'));
        return;
      }
      
      setNote('');
      fetchOrder();
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <ManagementLayout><div className="animate-pulse h-96 bg-white rounded-3xl" /></ManagementLayout>;
  if (!order) return <ManagementLayout><div className="text-center py-20">Buyurtma topilmadi</div></ManagementLayout>;

  return (
    <ManagementLayout>
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate('/my-orders')}
          className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">#{order.order_number}</h1>
          <p className="text-slate-500 text-sm">{t('operator.orderDetails')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Address Placeholder Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Manzil</h2>
            </div>
            <p className="text-slate-700">Toshkent shahri, Chilonzor tumani, 9-kvartal, 15-uy, 42-xonadon</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
               <button className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                 <Navigation className="w-4 h-4" />
                 Kartada ko'rish
               </button>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">{t('operator.items')}</h2>
            </div>
            <div className="p-6 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">Mahsulot ID: {item.product_id}</p>
                    <p className="text-xs text-slate-500">{item.quantity} dona x {item.unit_price.toLocaleString()} UZS</p>
                  </div>
                  <p className="font-bold text-slate-900">{item.subtotal.toLocaleString()} UZS</p>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-500">{t('operator.total')}:</span>
                <span className="font-bold text-blue-600 text-xl">{order.total.toLocaleString()} UZS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Delivery Actions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">{t('operator.updateStatus')}</h2>
            
            <div className="space-y-4 mb-6">
              <textarea
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                rows={2}
                placeholder={t('operator.note')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {order.status === 'READY_FOR_COURIER' && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('ASSIGNED')}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {t('courier.pickup')}
                </button>
              )}
              {order.status === 'ASSIGNED' && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('ON_THE_WAY')}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all"
                >
                  <Truck className="w-5 h-5" />
                  {t('courier.startDelivery')}
                </button>
              )}
              {order.status === 'ON_THE_WAY' && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('DELIVERED')}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {t('courier.completeDelivery')}
                </button>
              )}
              {['ASSIGNED', 'ON_THE_WAY'].includes(order.status) && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  className="w-full flex items-center justify-center gap-2 py-4 text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  {t('operator.status_CANCELLED')}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To'lov</p>
                <p className="text-sm font-bold text-slate-900">{order.payment_method} ({order.payment_status})</p>
              </div>
            </div>
            {order.customer_note && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Mijoz izohi</p>
                <p className="text-sm text-amber-800">{order.customer_note}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
}
