import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  History, 
  User as UserIcon, 
  MapPin, 
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Truck
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

export default function OrderDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState('');

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/operator/orders/${id}`, {
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
      const response = await fetch(`/api/operator/orders/${id}/status`, {
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
          onClick={() => navigate('/orders')}
          className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">#{order.order_number}</h1>
          <p className="text-slate-500 text-sm">Buyurtma tafsilotlari</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">{t('operator.items')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Mahsulot ID</th>
                    <th className="px-6 py-3">Narx</th>
                    <th className="px-6 py-3">Soni</th>
                    <th className="px-6 py-3 text-right">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-medium text-slate-900">ID: {item.product_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{item.unit_price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="px-6 py-4 text-right text-slate-500">Jami summasi:</td>
                    <td className="px-6 py-4 text-right text-blue-600 text-lg">{order.total.toLocaleString()} UZS</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">{t('operator.history')}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {order.status_history.map((h, i) => (
                  <div key={h.id} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:hidden">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 border-4 border-white shadow-sm flex items-center justify-center">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t(`operator.status_${h.new_status}`)}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      {h.note && <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          {/* Status Control */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">{t('operator.updateStatus')}</h2>
            
            <div className="space-y-4 mb-6">
              <textarea
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                rows={3}
                placeholder={t('operator.note')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {order.status === 'NEW' && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('CONFIRMED')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {t('operator.status_CONFIRMED')}
                </button>
              )}
              {order.status === 'CONFIRMED' && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('PREPARING')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all disabled:opacity-50"
                >
                  <PlayCircle className="w-5 h-5" />
                  {t('operator.status_PREPARING')}
                </button>
              )}
              {order.status === 'PREPARING' && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('READY_FOR_COURIER')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  <Truck className="w-5 h-5" />
                  {t('operator.status_READY_FOR_COURIER')}
                </button>
              )}
              {['NEW', 'CONFIRMED', 'PREPARING'].includes(order.status) && (
                <button 
                  disabled={updating}
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  className="w-full flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  {t('operator.status_CANCELLED')}
                </button>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To'lov usuli</p>
                <p className="text-sm font-bold text-slate-900">{order.payment_method}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sana</p>
                <p className="text-sm font-bold text-slate-900">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
}
