
import React, { useState, useEffect } from 'react';
import { getStore, saveStore } from '../services/store';
import { db, isConfigured } from '../services/firebase';
import { User, UserRole } from '../types';
import { Lock, Mail, LogIn, Paintbrush, Wifi, WifiOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // التحقق من حالة الاتصال عند فتح الصفحة
    setIsOnline(!!db && isConfigured);

    const autoInitialize = async () => {
      const store = await getStore();
      
      // تحديث اسم المدير إذا كان بالاسم القديم
      const adminIndex = store.employees.findIndex(e => e.id === 'admin-1');
      if (adminIndex !== -1) {
        if (store.employees[adminIndex].name === "المدير العام") {
          store.employees[adminIndex].name = "Mahmoud Alashwal";
          await saveStore(store);
          console.log("✅ تم تحديث اسم المدير إلى Mahmoud Alashwal");
        }
      }

      // إذا كان النظام فارغاً، أنشئ حساب المدير تلقائياً
      if (store.employees.length === 0) {
        const adminUser: User = {
          id: 'admin-1',
          name: "Mahmoud Alashwal",
          email: "admin@alashwal.com",
          password: "123456",
          role: UserRole.ADMIN,
          baseSalary: 0,
          phone: "01000000000"
        };
        store.employees.push(adminUser);
        await saveStore(store);
        console.log("✅ تم تهيئة حساب Mahmoud Alashwal تلقائياً");
      }
    };
    autoInitialize();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(async () => {
      const store = await getStore();
      const user = store.employees.find(u => u.email === email.trim() && u.password === password);
      
      if (user) {
        localStorage.setItem('alashwal_user', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('البيانات التي أدخلتها غير صحيحة، تأكد من البريد وكلمة المرور.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-['Cairo'] select-none">
      {/* عناصر جمالية في الخلفية */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      
      <div className="w-full max-w-lg p-6 relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/10 p-10 md:p-14 transition-all duration-500 hover:border-white/20">
          
          <div className="text-center mb-10">
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-indigo-600 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.2rem] flex items-center justify-center text-4xl shadow-2xl mb-6 mx-auto transform group-hover:rotate-6 transition-transform duration-300">
                <Paintbrush className="text-white w-12 h-12" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">نظام الأشوال</h1>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.3em] opacity-60">الجيل الجديد لإدارة الدهانات</p>
          </div>

          {/* مؤشر حالة الاتصال */}
          <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 justify-center ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
             {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
             <div className="text-right">
                <p className="text-xs font-black">{isOnline ? 'متصل بالسحابة (Online)' : 'يعمل محلياً (Offline)'}</p>
                {!isOnline && <p className="text-[10px] opacity-70 mt-1">يجب إضافة مفاتيح Firebase لتفعيل المزامنة</p>}
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl text-[12px] font-black text-right border border-rose-500/20 animate-in shake duration-300">
                 {error}
              </div>
            )}
            
            <div className="space-y-2 group">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mr-5 text-right group-focus-within:text-indigo-400 transition-colors">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input 
                  type="email" 
                  required 
                  placeholder="example@alashwal.com"
                  className="w-full p-5 pr-14 bg-white/5 border border-white/10 rounded-[1.8rem] outline-none text-white font-bold text-right focus:border-indigo-500 focus:bg-white/10 transition-all placeholder:text-slate-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mr-5 text-right group-focus-within:text-indigo-400 transition-colors">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full p-5 pr-14 bg-white/5 border border-white/10 rounded-[1.8rem] outline-none text-white font-bold text-right focus:border-indigo-500 focus:bg-white/10 transition-all placeholder:text-slate-700"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xl transition-all active:scale-[0.97] shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:shadow-[0_15px_40px_rgba(79,70,229,0.4)] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>دخول النظام</span>
                    <LogIn size={22} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-in.shake {
          animation: shake 0.3s ease-in-out 2;
        }
      `}</style>
    </div>
  );
};

export default Login;
