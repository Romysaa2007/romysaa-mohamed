
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { getStore, updateCustomers, saveStore } from '../services/store';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    const init = async () => {
      const store = await getStore();
      setCustomers(store.customers);
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return;
    const newCustomers = [...customers, { ...formData, id: Date.now().toString(), totalDebt: 0, transactions: [] }];
    setCustomers(newCustomers);
    await updateCustomers(newCustomers);
    setShowModal(false);
    setFormData({ name: '', phone: '' });
  };

  const handlePayment = async () => {
    if (!selectedCustomer || paymentAmount <= 0) return;
    
    const store = await getStore();
    const updatedCustomers = store.customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          totalDebt: c.totalDebt - paymentAmount,
          transactions: [...c.transactions, {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            amount: paymentAmount,
            type: 'PAYMENT' as const,
            note: 'تحصيل مديونية نقداً'
          }]
        };
      }
      return c;
    });

    // تسجيل التحصيل في الخزنة
    store.treasury.push({
      id: `coll-${Date.now()}`,
      date: new Date().toISOString(),
      amount: paymentAmount,
      type: 'IN',
      category: 'DEBT_COLLECTION',
      method: 'CASH',
      note: `تحصيل مديونية من العميل: ${selectedCustomer.name}`
    });

    store.customers = updatedCustomers;
    await saveStore(store);
    setCustomers(updatedCustomers);
    setSelectedCustomer(null);
    setPaymentAmount(0);
    alert('تم تسجيل التحصيل وتحديث الخزنة بنجاح ✅');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">العملاء والتحصيل</h1>
          <p className="text-slate-500">إدارة الديون والمدفوعات الآجلة</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-200">➕ إضافة عميل جديد</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-2 h-full ${c.totalDebt > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800">{c.name}</h3>
                <p className="text-slate-400 font-bold text-sm">📞 {c.phone}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-black ${c.totalDebt > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {c.totalDebt > 0 ? 'عليه ديون' : 'خالص'}
              </span>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-4">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">الرصيد المتبقي</p>
              <p className={`text-2xl font-black ${c.totalDebt > 0 ? 'text-red-600' : 'text-slate-900'}`}>{c.totalDebt.toLocaleString()} ج.م</p>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setSelectedCustomer(c)} className="flex-1 bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">💵 تسجيل تحصيل</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[400]">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">إضافة عميل</h2>
            <div className="space-y-4">
              <input type="text" placeholder="اسم العميل الثلاثي" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="رقم الهاتف" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg">حفظ العميل</button>
              <button onClick={() => setShowModal(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[400]">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-2">تحصيل من {selectedCustomer.name}</h2>
            <p className="text-slate-500 mb-6 font-bold">إجمالي المديونية الحالية: {selectedCustomer.totalDebt} ج.م</p>
            <div className="space-y-4">
              <input type="number" placeholder="المبلغ المحصل" className="w-full p-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-2xl text-center" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} />
              <button onClick={handlePayment} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100">تأكيد استلام الفلوس</button>
              <button onClick={() => setSelectedCustomer(null)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
