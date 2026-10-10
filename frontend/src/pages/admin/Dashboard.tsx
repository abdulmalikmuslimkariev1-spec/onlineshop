import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  ShieldCheck, 
  ShoppingBag, 
  Truck, 
  Package, 
  ClipboardList,
  UserCheck
} from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';

interface Stats {
  total_users: number;
  total_admins: number;
  total_operators: number;
  total_couriers: number;
  total_customers: number;
  total_products: number;
  total_orders: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', {
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

  if (error) {
    return (
      <ManagementLayout>
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <p className="text-slate-600 mb-4">{t('common.error')}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 font-semibold hover:underline"
          >
            Tizimni qayta yuklash
          </button>
        </div>
      </ManagementLayout>
    );
  }

  const statCards = [
    { label: t('admin.totalUsers'), value: stats?.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('admin.totalAdmins'), value: stats?.total_admins, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: t('admin.totalOperators'), value: stats?.total_operators, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('admin.totalCouriers'), value: stats?.total_couriers, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: t('admin.totalCustomers'), value: stats?.total_customers, icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: t('admin.totalProducts'), value: stats?.total_products, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('admin.totalOrders'), value: stats?.total_orders, icon: ClipboardList, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <ManagementLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('admin.dashboard')}</h1>
        <p className="text-slate-500 mt-1">Tizim bo'yicha umumiy statistik ma'lumotlar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
    </ManagementLayout>
  );
}
