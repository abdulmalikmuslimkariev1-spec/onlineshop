import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';

interface Stats {
  new_orders: number;
  processing_orders: number;
  ready_orders: number;
  today_total: number;
}

export default function OperatorDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/operator/dashboard', {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </ManagementLayout>
    );
  }

  const statCards = [
    { label: t('operator.newOrders'), value: stats?.new_orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('operator.processingOrders'), value: stats?.processing_orders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('operator.readyOrders'), value: stats?.ready_orders, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('operator.todayTotal'), value: stats?.today_total, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <ManagementLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('operator.dashboard')}</h1>
        <p className="text-slate-500 mt-1">Bugungi ish faoliyati va buyurtmalar statistikasi</p>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center gap-4 text-red-700">
          <AlertCircle className="w-6 h-6" />
          <p>{t('common.error')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{card.value || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ManagementLayout>
  );
}
