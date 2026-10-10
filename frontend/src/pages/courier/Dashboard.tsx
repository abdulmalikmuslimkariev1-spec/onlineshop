import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';

interface Stats {
  assigned_orders: number;
  in_delivery_orders: number;
  completed_today: number;
}

export default function CourierDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/courier/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <ManagementLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </ManagementLayout>
    );
  }

  const statCards = [
    { label: t('courier.assignedOrders'), value: stats?.assigned_orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('courier.inDelivery'), value: stats?.in_delivery_orders, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('courier.completedToday'), value: stats?.completed_today, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <ManagementLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('courier.dashboard')}</h1>
        <p className="text-slate-500 mt-1">Sizning bugungi yetkazib berish ko'rsatkichlaringiz</p>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center gap-4 text-red-700">
          <AlertCircle className="w-6 h-6" />
          <p>{t('common.error')}</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} shadow-sm border border-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </ManagementLayout>
  );
}
