import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';

interface Order {
  id: number;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

export default function OrderList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
        ...(statusFilter && { status_filter: statusFilter }),
        ...(search && { search })
      });
      
      const response = await fetch(`/api/operator/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data && Array.isArray(data.items)) {
        setOrders(data.items);
        setTotal(data.total || 0);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'CONFIRMED': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'PREPARING': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'READY_FOR_COURIER': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'DELIVERED': return 'bg-green-50 text-green-700 border-green-100';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <ManagementLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t('operator.orders')}</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Barcha buyurtmalarni ko'rish va boshqarish</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <form onSubmit={handleSearch} className="flex-grow max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
            placeholder={t('operator.orderNumber')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <select
          className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t('operator.status')}</option>
          <option value="NEW">{t('operator.status_NEW')}</option>
          <option value="CONFIRMED">{t('operator.status_CONFIRMED')}</option>
          <option value="PREPARING">{t('operator.status_PREPARING')}</option>
          <option value="READY_FOR_COURIER">{t('operator.status_READY_FOR_COURIER')}</option>
          <option value="CANCELLED">{t('operator.status_CANCELLED')}</option>
        </select>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('operator.orderNumber')}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('operator.date')}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('operator.total')}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('operator.status')}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6"><div className="h-4 bg-slate-50 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                       <ClipboardList className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Buyurtmalar topilmadi</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-6">
                       <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">#{order.order_number}</span>
                    </td>
                    <td className="px-6 py-6 text-sm font-bold text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-slate-900">{order.total.toLocaleString()}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase">UZS</span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {t(`operator.status_${order.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <button 
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="p-2.5 text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-xl hover:shadow-blue-600/10 rounded-xl transition-all active:scale-90 border border-transparent hover:border-blue-100"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Jami: <span className="font-semibold text-slate-900">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium px-4">{page}</span>
              <button
                disabled={page * 10 >= total || loading}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
