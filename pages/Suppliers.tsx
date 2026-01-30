
import React, { useState, useEffect } from 'react';
import { Supplier, Purchase, Product } from '../types';
import { getStore, updateSuppliers, recordPurchase, saveStore } from '../services/store';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState<Supplier | null>(null);
  const [showPayModal, setShowPayModal] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({ name: '', phone: '', company: '' });
  const [purchaseData, setPurchaseData] = useState({ itemName: '', quantity: 1, totalCost: 0, paidAmount: 0 });
  const [payAmount, setPayAmount] = useState(0);

  useEffect(() => {
    const init = async () => {
      const store = await getStore();
      setSuppliers(store.suppliers || []);
      setPurchases(store.purchases || []);
      setProducts(store.products || []);
    };
    init();
  }, []);

  const handleSaveSupplier = async () => {
    if (!formData.name) return;
    const newSuppliers = [...suppliers, { ...formData, id: Date.now().toString(), totalDebt: 0 }];
    setSuppliers(newSuppliers);
    await updateSuppliers(newSuppliers);
    setShowAddModal(false);
    setFormData({ name: '', phone: '', company: '' });
  };

  const handleSavePurchase = async () => {
    if (!showPurchaseModal || !purchaseData.itemName) return;
    
    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      supplierId: showPurchaseModal.id,
      supplierName: showPurchaseModal.name,
      itemName: purchaseData.itemName,
      quantity: purchaseData.quantity,
      totalCost: purchaseData.totalCost,
      paidAmount: purchaseData.paidAmount,
      debtAmount: purchaseData.totalCost - purchaseData.paidAmount, // الحسبة الجديدة
      date: new Date().toISOString()
    };

    await recordPurchase(newPurchase);
    
    const store = await getStore();
    setPurchases(store.purchases);
    setSuppliers(store.suppliers);
    setShowPurchaseModal(null);
    setPurchaseData({ itemName: '', quantity: 1, totalCost: 0, paidAmount: 0 });
    alert('تم تسجيل المشتريات وتحديث حساب المورد والمخزن ✅');
  };

  const handlePaySupplier = async () => {
    if (!showPayModal || payAmount <= 0) return;
    
    const store = await getStore();
    const supplier = store.suppliers.find(s => s.id === showPayModal.id);
    if (supplier) {
      supplier.totalDebt -= payAmount;
      
      // تسجيل المعاملة في الخزنة
      store.treasury.push({
        id: `pay-sup-${Date.now()}`,
        date: new Date().toISOString(),
        amount: payAmount,
        type: 'OUT',
        category: 'SUPPLIER_PAYMENT',
        method: 'CASH',
        note: `سداد مديونية للمورد: ${supplier.name}`
      });
      
      await saveStore(store);
      setSuppliers(store.suppliers);
      setShowPayModal(null);
      setPayAmount(0);
      alert('تم سداد المبلغ وخصمه من مديونية المورد والخزنة ✅');
    }
  };

  return (
    <div className="space-y-8 font-['Cairo'] pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">الموردين والمشتريات</h1>
          <p className="text-slate-500 font-bold">إدارة الموردين والديون وسجل المشتريات</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
        >
          ➕ إضافة مورد جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-2 h-full ${s.totalDebt > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <h3 className="text-xl font-black text-slate-800">{s.name}</h3>
            <p className="text-slate-400 font-bold text-sm mt-1">🏢 الشركة: {s.company}</p>
            <p className="text-indigo-600 font-black mt-2">📞 {s.phone}</p>
            
            <div className="bg-slate-50 p-4 rounded-2xl mt-4 border border-slate-100">
               <p className="text-[10px] text-slate-400 font-black uppercase mb-1">إجمالي المطلوب مننا:</p>
               <p className={`text-2xl font-black ${s.totalDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                 {s.totalDebt.toLocaleString()} <small className="text-xs">ج.م</small>
               </p>
            </div>

            <div className="mt-6 flex gap-2">
               <button 
                 onClick={() => setShowPurchaseModal(s)}
                 className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] hover:bg-indigo-600 transition-all"
               >
                 📦 شراء بضاعة
               </button>
               <button 
                 onClick={() => setShowPayModal(s)}
                 disabled={s.totalDebt <= 0}
                 className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] hover:bg-emerald-600 transition-all disabled:opacity-30"
               >
                 💵 سداد مديونية
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden mt-10">
        <div className="p-8 border-b bg-slate-50">
           <h3 className="font-black text-xl text-slate-800">سجل فواتير المشتريات والديون</h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-right">
              <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b">
                 <tr>
                    <th className="px-8 py-4">التاريخ</th>
                    <th className="px-8 py-4">المورد</th>
                    <th className="px-8 py-4">الصنف</th>
                    <th className="px-8 py-4">الإجمالي</th>
                    <th className="px-8 py-4">المدفوع</th>
                    <th className="px-8 py-4 text-red-500">المتبقي (دين)</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {purchases.slice().reverse().map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 text-sm font-bold">
                      <td className="px-8 py-4 text-slate-400">{new Date(p.date).toLocaleDateString('ar-EG')}</td>
                      <td className="px-8 py-4 text-indigo-600">{p.supplierName}</td>
                      <td className="px-8 py-4 text-slate-800">{p.itemName} ({p.quantity})</td>
                      <td className="px-8 py-4 font-black">{p.totalCost.toLocaleString()}</td>
                      <td className="px-8 py-4 text-emerald-600">{p.paidAmount.toLocaleString()}</td>
                      <td className="px-8 py-4 bg-red-50/30 text-red-600 font-black">
                        {(p.totalCost - p.paidAmount).toLocaleString()} ج.م
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
           {purchases.length === 0 && <p className="py-20 text-center text-slate-300 italic">لا توجد سجلات مشتريات بعد</p>}
        </div>
      </div>

      {/* مودال سداد مديونية */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[500]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-2">سداد للمورد</h2>
            <p className="text-slate-500 font-bold mb-6">المورد: {showPayModal.name} | الدين الحالي: {showPayModal.totalDebt} ج.م</p>
            <div className="space-y-4">
              <input type="number" placeholder="المبلغ المراد سداده" className="w-full p-4 bg-slate-50 border-2 border-emerald-100 rounded-2xl font-black text-center text-2xl" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
              <button onClick={handlePaySupplier} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100">تأكيد السداد 💵</button>
              <button onClick={() => setShowPayModal(null)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* مودالات الإضافة والشراء السابقة كما هي مع تحديث purchaseData.debtAmount عند الحفظ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[500]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">إضافة مورد جديد</h2>
            <div className="space-y-4">
              <input type="text" placeholder="اسم المورد" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="اسم الشركة" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              <input type="text" placeholder="رقم الهاتف" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <div className="flex gap-3 mt-4">
                <button onClick={handleSaveSupplier} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black">حفظ المورد</button>
                <button onClick={() => setShowAddModal(false)} className="bg-slate-100 px-8 py-4 rounded-2xl font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[500]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-1 text-slate-900">شراء بضاعة من: {showPurchaseModal.name}</h2>
            <p className="text-xs text-slate-400 font-bold mb-8">سيتم تحديث المخزن وحساب الدين للمورد</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className="text-xs font-black mr-2 text-slate-500">اسم الصنف</label>
                <input list="products-list" type="text" placeholder="اسم الصنف..." className="w-full p-4 bg-slate-50 border rounded-2xl font-bold mt-1" value={purchaseData.itemName} onChange={e => setPurchaseData({...purchaseData, itemName: e.target.value})} />
                <datalist id="products-list">
                  {products.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-black mr-2 text-slate-500">الكمية</label>
                <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={purchaseData.quantity} onChange={e => setPurchaseData({...purchaseData, quantity: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-xs font-black mr-2 text-slate-900">إجمالي الفاتورة</label>
                <input type="number" className="w-full p-4 bg-slate-100 border rounded-2xl font-black" value={purchaseData.totalCost} onChange={e => setPurchaseData({...purchaseData, totalCost: Number(e.target.value)})} />
              </div>
              <div className="col-span-full">
                <label className="text-xs font-black mr-2 text-emerald-600">المبلغ المدفوع كاش الآن</label>
                <input type="number" className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black" value={purchaseData.paidAmount} onChange={e => setPurchaseData({...purchaseData, paidAmount: Number(e.target.value)})} />
              </div>
              <div className="col-span-full bg-red-50 p-4 rounded-xl">
                 <p className="text-xs font-bold text-red-400">المتبقي للمورد (دين):</p>
                 <p className="text-xl font-black text-red-600">{purchaseData.totalCost - purchaseData.paidAmount} ج.م</p>
              </div>
            </div>
            
            <div className="mt-10 flex gap-4">
              <button onClick={handleSavePurchase} className="flex-1 bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg">تأكيد المشتريات 📦</button>
              <button onClick={() => setShowPurchaseModal(null)} className="bg-slate-100 px-10 py-5 rounded-[2rem] font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
