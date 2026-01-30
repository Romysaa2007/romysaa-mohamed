
import React, { useEffect, useState } from 'react';
import { getStore, subscribeToSales, subscribeToProducts } from '../services/store';
import { Sale, Product, User, UserRole } from '../types';
import { db, isConfigured } from '../services/firebase';
import { TrendingUp, Users, Package, FileText, Wallet, ShieldCheck, Wifi, WifiOff, Cloud } from 'lucide-react';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState({ sales: 0, products: 0, customers: 0, profit: 0 });
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // التحقق من حالة الاتصال
    setIsOnline(!!db && isConfigured);

    const load = async () => {
      const store = await getStore();
      setRecentSales(store.sales.slice(0, 5));
      
      const today = new Date().toISOString().split('T')[0];
      const todaySales = store.sales.filter(s => s.date.startsWith(today));
      const total = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
      
      setStats({
        sales: total,
        products: store.products.length,
        customers: store.customers.length,
        profit: todaySales.length
      });
    };
    
    load();
    const unsubSales = subscribeToSales((sales) => {
      setRecentSales(sales.slice(0, 5));
    });
    
    return () => unsubSales();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* الترحيب وحالة النظام */}
      <div className={`flex flex-col md:flex-row justify-between items-center gap-6 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden ${isOnline ? 'bg-gradient-to-r from-emerald-900 to-teal-900' : 'bg-gradient-to-r from-slate-900 to-indigo-950'}`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 text-center md:text-right">
          <div className="flex items-center gap-4 mb-4 justify-center md:justify-start">
             {isOnline ? (
               <>
                 <Cloud className="text-emerald-400 w-6 h-6 animate-pulse" />
                 <span className="text-xs font-black uppercase tracking-widest text-emerald-400">متصل بالسحابة - مزامنة فورية</span>
               </>
             ) : (
               <>
                 <ShieldCheck className="text-orange-400 w-5 h-5" />
                 <span className="text-xs font-black uppercase tracking-widest text-orange-400">نظام محلي - غير متصل</span>
               </>
             )}
          </div>
          <h1 className="text-4xl font-black mb-2">مرحباً، {user.name} 👋</h1>
          <p className="text-indigo-100 font-medium">
            {isOnline 
              ? 'بياناتك محفوظة بأمان على السحابة (Firebase). يمكنك متابعة العمل من أي جهاز.' 
              : 'بياناتك محفوظة على هذا الجهاز فقط. يرجى توصيل الإنترنت للمزامنة.'}
          </p>
        </div>
        
        <div className="flex gap-4 relative z-10">
           <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 text-center">
              <p className="text-[10px] font-black uppercase text-indigo-300 mb-1">مبيعات اليوم</p>
              <p className="text-3xl font-black">{stats.sales.toLocaleString()} <small className="text-xs">ج.م</small></p>
           </div>
        </div>
      </div>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Package className="text-blue-500" />} label="الأصناف بالمخزن" value={stats.products} color="blue" />
        <StatCard icon={<TrendingUp className="text-emerald-500" />} label="فواتير اليوم" value={stats.profit} color="emerald" />
        <StatCard icon={<Users className="text-purple-500" />} label="قاعدة العملاء" value={stats.customers} color="purple" />
        <StatCard 
          icon={isOnline ? <Wifi className="text-emerald-500" /> : <WifiOff className="text-orange-500" />} 
          label="حالة الاتصال" 
          value={isOnline ? "أونلاين" : "أوفلاين"} 
          color={isOnline ? "emerald" : "orange"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-800">أحدث عمليات البيع</h3>
            <button className="text-indigo-600 font-black text-xs hover:underline">سجل المبيعات</button>
          </div>
          <div className="space-y-4">
            {recentSales.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-50 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">🧾</div>
                  <div>
                    <p className="font-black text-slate-800">{s.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-bold">#{s.invoiceNumber} • {new Date(s.date).toLocaleTimeString('ar-EG')}</p>
                  </div>
                </div>
                <div className="text-left">
                   <p className="font-black text-indigo-600">{s.totalAmount} ج.م</p>
                   <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{s.paymentMethod}</span>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && <p className="text-center py-20 text-slate-300 italic">لا توجد عمليات بيع مسجلة بعد</p>}
          </div>
        </div>

        <div className={`p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden ${isOnline ? 'bg-indigo-900' : 'bg-slate-800'}`}>
           <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mb-16 -mr-16"></div>
           <h3 className="text-xl font-black mb-6 flex items-center gap-2">
             <ShieldCheck className={isOnline ? "text-emerald-400" : "text-orange-400"} />
             {isOnline ? 'أمان البيانات السحابي' : 'أمان البيانات المحلي'}
           </h3>
           <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-xs font-bold text-indigo-300 mb-1">الخصوصية</p>
                 <p className="text-sm font-medium">
                   {isOnline 
                     ? 'البيانات مشفرة ومحفوظة على سيرفرات Google Cloud الآمنة.' 
                     : 'البيانات مخزنة على هذا المتصفح فقط.'}
                 </p>
              </div>
              <div className={`p-4 rounded-2xl border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                 <p className={`text-xs font-bold mb-1 ${isOnline ? 'text-emerald-400' : 'text-orange-400'}`}>نسخ احتياطي</p>
                 <p className="text-sm font-medium">
                   {isOnline 
                     ? 'يتم أخذ نسخ احتياطية تلقائية مع كل عملية بيع.' 
                     : 'تحذير: قد تفقد البيانات إذا تم مسح بيانات المتصفح.'}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-indigo-100 hover:shadow-xl transition-all group">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 bg-${color}-50 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
    <p className={`text-3xl font-black mt-1 text-${color}-600`}>{value}</p>
  </div>
);

export default Dashboard;
