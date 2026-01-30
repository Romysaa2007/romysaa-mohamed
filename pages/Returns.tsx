
import React, { useEffect, useState } from 'react';
import { getStore, processPartialReturn } from '../services/store';
import { Sale, Customer } from '../types';

const Returns: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnQtys, setReturnQtys] = useState<{ [productId: string]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const store = await getStore();
      setSales(store.sales || []);
      setCustomers(store.customers || []);
    };
    fetch();
  }, []);

  const openReturnModal = (sale: Sale) => {
    setSelectedSale(sale);
    setShowSuccess(false);
    const initialQtys: { [productId: string]: number } = {};
    sale.items.forEach(item => {
      initialQtys[item.productId] = 0;
    });
    setReturnQtys(initialQtys);
  };

  const handleReturnAction = async () => {
    if (!selectedSale) return;

    const itemsToReturn = (Object.entries(returnQtys) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, quantityToReturn: qty }));

    if (itemsToReturn.length === 0) return;

    setIsProcessing(true);
    try {
      await processPartialReturn(selectedSale.id, itemsToReturn);
      setShowSuccess(true);
      const store = await getStore();
      setSales(store.sales);
      setCustomers(store.customers);
      setTimeout(() => {
        setSelectedSale(null);
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      alert('حدث خطأ أثناء معالجة المرتجع');
    } finally {
      setIsProcessing(false);
    }
  };

  // حسابات المرتجع الحالية في المودال
  const calculateTotals = () => {
    if (!selectedSale) return { totalValue: 0, debtOffset: 0, netRefund: 0 };
    
    const totalValue = selectedSale.items.reduce((acc, item) => 
      acc + (returnQtys[item.productId] || 0) * item.sellPrice, 0);
    
    const customer = customers.find(c => c.id === selectedSale.customerId);
    const currentDebt = customer ? customer.totalDebt : 0;
    
    // المديونية التي سيتم خصمها (لا تزيد عن قيمة المرتجع ولا عن مديونية العميل)
    const debtOffset = Math.min(currentDebt, totalValue);
    const netRefund = totalValue - debtOffset;

    return { totalValue, debtOffset, netRefund };
  };

  const { totalValue, debtOffset, netRefund } = calculateTotals();

  return (
    <div className="space-y-8 font-['Cairo'] pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">مرتجعات المبيعات</h1>
          <p className="text-slate-500 font-bold text-sm">إرجاع كلي أو جزئي للأصناف المباعة</p>
        </div>
        <div className="relative w-full md:w-80">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="ابحث برقم الفاتورة..." 
            className="p-4 pr-12 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none font-bold w-full focus:ring-4 ring-indigo-50 transition-all"
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
             <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b">
                <tr>
                   <th className="px-8 py-5">رقم الفاتورة</th>
                   <th className="px-8 py-5">العميل</th>
                   <th className="px-8 py-5">تاريخ البيع</th>
                   <th className="px-8 py-5">إجمالي الفاتورة</th>
                   <th className="px-8 py-5 text-center">إجراء</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {sales.filter(s => s.invoiceNumber.toString().includes(searchTerm)).slice().reverse().map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-8 py-5 font-black text-indigo-600">#{s.invoiceNumber}</td>
                     <td className="px-8 py-5 font-black text-slate-700">{s.customerName}</td>
                     <td className="px-8 py-5 text-sm text-slate-400">{new Date(s.date).toLocaleDateString('ar-EG')}</td>
                     <td className="px-8 py-5 font-black text-lg">{s.totalAmount} ج.م</td>
                     <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => openReturnModal(s)} 
                          className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          تفاصيل المرتجع ↺
                        </button>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {showSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                 <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl mb-6 animate-bounce">✓</div>
                 <h2 className="text-3xl font-black text-slate-900 mb-2">تم المرتجع بنجاح</h2>
                 <p className="text-slate-500 font-bold">تم تسوية المديونية وتحديث الخزنة</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">مرتجع فاتورة #{selectedSale.invoiceNumber}</h2>
                    <p className="text-xs text-slate-400 font-bold">العميل: {selectedSale.customerName}</p>
                  </div>
                  <button onClick={() => setSelectedSale(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">✕</button>
                </div>

                <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedSale.items.map(item => {
                    const available = item.quantity - (item.returnedQuantity || 0);
                    if (available <= 0) return null;
                    return (
                      <div key={item.productId} className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 gap-4">
                        <div className="flex-1">
                          <p className="font-black text-slate-800 text-sm">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-bold">المباع: {item.quantity} | السعر: {item.sellPrice}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 bg-white p-1 rounded-xl border">
                               <button onClick={() => setReturnQtys({...returnQtys, [item.productId]: Math.max(0, (returnQtys[item.productId] || 0) - 1)})} className="w-8 h-8 rounded-lg hover:bg-slate-100"> - </button>
                               <input type="number" className="w-10 text-center font-black text-indigo-600 outline-none" value={returnQtys[item.productId] || 0} readOnly />
                               <button onClick={() => setReturnQtys({...returnQtys, [item.productId]: Math.min(available, (returnQtys[item.productId] || 0) + 1)})} className="w-8 h-8 rounded-lg hover:bg-slate-100"> + </button>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4">
                  <div className="flex justify-between items-center text-sm opacity-70">
                    <span>إجمالي قيمة المرتجع:</span>
                    <span className="font-bold">{totalValue} ج.م</span>
                  </div>
                  
                  {debtOffset > 0 && (
                    <div className="flex justify-between items-center text-sm text-orange-400 font-bold bg-orange-400/10 p-3 rounded-xl border border-orange-400/20">
                      <span>خصم من مديونية العميل:</span>
                      <span>- {debtOffset} ج.م</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-white/10 pt-4">
                    <div className="text-right">
                      <p className="text-[10px] opacity-50 font-black uppercase mb-1">الصافي المسترد نقداً</p>
                      <p className="text-3xl font-black text-emerald-400">{netRefund} <small className="text-sm">ج.م</small></p>
                    </div>
                    <button 
                      onClick={handleReturnAction}
                      disabled={isProcessing || totalValue === 0}
                      className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isProcessing ? 'جاري...' : 'تأكيد ↺'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
