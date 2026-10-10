import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, Mail, Shield, CheckCircle2, Truck, MapPin, Plus, Trash2 } from 'lucide-react';
import { ManagementLayout } from '../../components/ManagementLayout';
import { StorefrontLayout } from '../../components/StorefrontLayout';
import { authApi, User } from '../../api/auth';
import { AppContext, resolveAppContext } from '../../utils/resolver';

interface CourierData {
  vehicle_type: string;
  license_plate: string;
  is_available: boolean;
}

interface Address {
  id: number;
  title: string;
  address_line: string;
  city: string;
}

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [courierData, setCourierData] = useState<CourierData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const appContext = resolveAppContext();

  const [newAddr, setNewAddr] = useState({ title: '', address_line: '', city: 'Toshkent' });

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAddresses(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        
        if (userData.roles.some(r => r.name === 'COURIER')) {
          const res = await fetch('/api/courier/profile', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) setCourierData(await res.json());
        }

        if (appContext === AppContext.CUSTOMER) {
          await fetchAddresses();
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [appContext]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAddr)
      });
      if (res.ok) {
        setNewAddr({ title: '', address_line: '', city: 'Toshkent' });
        fetchAddresses();
      }
    } catch (err) {}
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await fetch('/api/customer/addresses/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAddresses();
    } catch (err) {}
  };

  const Layout = appContext === AppContext.CUSTOMER ? StorefrontLayout : ManagementLayout;

  if (loading) return <Layout><div className="animate-pulse h-64 bg-white rounded-3xl" /></Layout>;
  if (!user) return <Layout><div>Foydalanuvchi topilmadi</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t('customer.myProfile')}</h1>
          <p className="text-slate-500 mt-2 font-medium">{t('customer.accountSettings')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-16 items-start">
          <div className="lg:col-span-2 space-y-10 sm:space-y-16">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/40">
              <div className="bg-blue-600 h-32 sm:h-40 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
              </div>
              <div className="px-8 sm:px-12 pb-10 sm:pb-16">
                <div className="relative -mt-16 sm:-mt-20 mb-10">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] bg-white p-2 shadow-2xl">
                    <div className="w-full h-full rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100">
                      <UserIcon className="w-16 h-16 sm:w-20 sm:h-20" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t('customer.fullName')}</label>
                      <p className="text-xl font-bold text-slate-900">{user.full_name || t('admin.edit')}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t('customer.emailAddress')}</label>
                      <div className="flex items-center gap-3 text-slate-700">
                        <Mail className="w-5 h-5 text-blue-600/40" />
                        <span className="font-bold">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t('customer.roleInSystem')}</label>
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="font-black text-blue-700 uppercase tracking-widest text-xs">{user.roles.map(r => t(`roles.${r.name}`)).join(', ')}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t('customer.accountStatus')}</label>
                      <div className="flex items-center gap-3 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t('admin.active')}</span>
                      </div>
                    </div>
                    
                    {courierData && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t('courier.vehicle')}</label>
                          <div className="flex items-center gap-3 text-slate-700">
                            <Truck className="w-5 h-5 text-blue-600/40" />
                            <span className="font-bold">{courierData.vehicle_type || "Noma'lum"}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t('courier.licensePlate')}</label>
                          <p className="text-lg font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block">{courierData.license_plate || '—'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {appContext === AppContext.CUSTOMER && (
              <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40">
                 <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><MapPin className="w-6 h-6" /></div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('customer.addresses')}</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {addresses.map(addr => (
                      <div key={addr.id} className="group relative flex items-start justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 hover:border-slate-200">
                         <div className="min-w-0">
                            <p className="font-black uppercase tracking-widest text-[10px] text-blue-600 mb-3">{addr.title}</p>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed truncate">{addr.address_line}</p>
                            <p className="text-xs font-medium text-slate-400 mt-1">{addr.city}</p>
                         </div>
                         <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 text-slate-300 hover:text-red-600 transition-all hover:bg-red-50 rounded-xl">
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))}
                 </div>

                 <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('customer.addressName')}</label>
                       <input 
                         type="text" placeholder={t('customer.addressName')}
                         className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                         value={newAddr.title} onChange={e => setNewAddr({...newAddr, title: e.target.value})}
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('customer.fullAddress')}</label>
                       <input 
                         type="text" placeholder={t('customer.fullAddress')}
                         className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                         value={newAddr.address_line} onChange={e => setNewAddr({...newAddr, address_line: e.target.value})}
                         required
                       />
                    </div>
                    <button className="md:col-span-2 py-5 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                       <Plus className="w-5 h-5" />
                       {t('customer.addAddress')}
                    </button>
                 </form>
              </div>
            )}
          </div>
          
          <div className="space-y-8 sticky top-24">
             <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm"><Shield className="w-5 h-5" /></div>
                   <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{t('customer.security')}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">{t('customer.securityDesc')}</p>
                <button className="w-full py-4 border-2 border-slate-100 text-slate-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                   {t('customer.updatePassword')}
                </button>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
