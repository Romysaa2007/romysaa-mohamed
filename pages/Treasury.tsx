
import React, { useEffect, useState } from 'react';
import { getStore } from '../services/store';
import { TreasuryTransaction, PaymentMethod } from '../types';

const Treasury: React.FC = () => {
  const [txs, setTxs] = useState<TreasuryTransaction[]>([]);
  const [filter, setFilter] = useState<PaymentMethod | 'ALL'>('ALL');

  useEffect(() => {
    const fetch = async () => {
      const store = await getStore();
      setTxs(store.treasury || []);
    };
    fetch();
  }, []);

  const totalCash = txs.filter(t => t.method === 'CASH').reduce((acc, t) => acc + (t.type === 'IN' ? t.amount : -t.amount), 0);
  const totalNetwork = txs.filter(t => t.method === 'NETWORK').reduce((acc, t) => acc + (t.type === 'IN' ? t.amount : -t.amount), 0);
  const totalTransfer = txs.filter(t => t.method === 'TRANSFER').reduce((acc, t) => acc + (t.type === 'IN' ? t.amount : -t.amount), 0);

  const filteredTxs = filter === 'ALL' ? txs : txs.filter(t => t.method === filter);

  return (
    <div className="space-y-8 font-['Cairo'] pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">الخزنة والسيولة</h1>
          <p className="text-slate-500 font-bold">تتبع حركة النقدية، الشبكة، والتحويلات البنكية</p>
        </div>
        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           {['ALL', 'CASH', 'NETWORK', 'TRANSFER'].map(m => (
             <button 
                key={m} 
                onClick={() => setFilter(m as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filter === m ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-400'}`}
             >
                {m === 'ALL' ? 'الكل' : m === 'CASH' ? 'كاش' : m === 'NETWORK' ? 'شبكة' : 'تحويل'}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150"></div>
           <p className="text-slate-400 text-[10px] font-black uppercase mb-2">رصيد الكاش</p>
           <h3 className="text-3xl font-black text-emerald-600">{totalCash.toLocaleString()} <small className="text-sm">ج.م</small></h3>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150"></div>
           <p className="text-slate-400 text-[10px] font-black uppercase mb-2">رصيد الشبكة (فيزا)</p>
           <h3 className="text-3xl font-black text-blue-600">{totalNetwork.toLocaleString()} <small className="text-sm">ج.م</small></h3>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150"></div>
           <p className="text-slate-400 text-[10px] font-black uppercase mb-2">رصيد التحويلات</p>
           <h3 className="text-3xl font-black text-purple-600">{totalTransfer.toLocaleString()} <small className="text-sm">ج.م</small></h3>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
           <h3 className="font-black text-xl text-slate-800">سجل المعاملات المالية</h3>
           <div className="bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black">إجمالي: {(totalCash + totalNetwork + totalTransfer).toLocaleString()} ج.م</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
             <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <tr>
                   <th className="px-8 py-5">المعاملة</th>
                   <th className="px-8 py-5">المبلغ</th>
                   <th className="px-8 py-5">النوع</th>
                   <th className="px-8 py-5">التاريخ</th>
                   <th className="px-8 py-5">بيان</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {filteredTxs.slice().reverse().map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${t.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                           {t.type === 'IN' ? 'توريد ⬇' : 'صرف ⬆'}
                        </span>
                     </td>
                     <td className={`px-8 py-5 font-black text-lg ${t.type === 'IN' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {t.type === 'IN' ? '+' : '-'}{t.amount.toLocaleString()} <small className="text-[10px]">ج.م</small>
                     </td>
                     <td className="px-8 py-5">
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-500">{t.method === 'CASH' ? 'نقدي' : t.method === 'NETWORK' ? 'فيزا/شبكة' : 'تحويل بنكي'}</span>
                     </td>
                     <td className="px-8 py-5 text-sm text-slate-400 font-bold">{new Date(t.date).toLocaleString('ar-EG')}</td>
                     <td className="px-8 py-5 text-sm font-black text-slate-700">{t.note}</td>
                  </tr>
                ))}
             </tbody>
          </table>
          {filteredTxs.length === 0 && <div className="py-20 text-center text-slate-300 font-black text-xl italic opacity-30">لا توجد سجلات مالية</div>}
        </div>
      </div>
    </div>
  );
};

export default Treasury;
