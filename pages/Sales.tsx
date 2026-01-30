
import React, { useState, useEffect } from 'react';
import { Product, SaleItem, User, Sale, PaymentMethod, Customer } from '../types';
import { getStore, processSale, findOrCreateCustomer } from '../services/store';

const Sales: React.FC<{ user: User }> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const store = await getStore();
      setProducts(store.products || []);
    };
    fetchData();
  }, []);

  const total = cart.reduce((acc, item) => acc + item.total, 0);

  useEffect(() => {
    if (paymentMethod !== 'DEBT') {
      setPaidAmount(total);
    }
  }, [total, paymentMethod]);

  const handleMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'DEBT') {
      setPaidAmount(0);
    } else {
      setPaidAmount(total);
    }
  };

  const addToCart = (p: Product) => {
    if (p.quantity <= 0) return alert('هذا الصنف غير متوفر في المخزن');
    const existing = cart.find(item => item.productId === p.id);
    if (existing) {
      if (existing.quantity >= p.quantity) return alert('الكمية المطلوبة أكبر من المتاح');
      setCart(cart.map(item => item.productId === p.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.sellPrice } : item));
    } else {
      setCart([...cart, { productId: p.id, productName: p.name, quantity: 1, returnedQuantity: 0, sellPrice: p.sellPrice, buyPriceAtSale: p.buyPrice, total: p.sellPrice }]);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'DEBT' && !customerName.trim()) {
      alert('يرجى كتابة اسم العميل لتسجيل المديونية عليه');
      return;
    }

    setIsProcessing(true);

    try {
      let finalCustomerId = undefined;
      let finalCustomerName = customerName.trim() || 'عميل نقدي';

      // إذا كان البيع آجل، نجد العميل أو ننشئه
      if (paymentMethod === 'DEBT' || customerName.trim()) {
        finalCustomerId = await findOrCreateCustomer(finalCustomerName);
      }

      const newSale: Sale = {
        id: Date.now().toString(),
        invoiceNumber: 0,
        date: new Date().toISOString(),
        items: [...cart],
        totalAmount: total,
        paidAmount: paidAmount,
        debtAmount: total - paidAmount,
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        employeeName: user.name,
        paymentMethod
      };

      await processSale(newSale);
      setLastSale(newSale);
      setShowInvoice(true);
      
      const updated = await getStore();
      setProducts(updated.products);
      
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeInvoiceAndReset = () => {
    setShowInvoice(false);
    setCart([]);
    setCustomerName('');
    setPaidAmount(0);
    setPaymentMethod('CASH');
    setLastSale(null);
  };

  return (
    <div className="font-['Cairo'] pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            <input 
              type="text" 
              placeholder="ابحث بكود الصنف أو اسمه لبيعه..." 
              className="w-full p-5 pr-14 bg-white border border-slate-100 rounded-[2rem] shadow-sm outline-none font-black text-lg focus:ring-4 ring-indigo-50 transition-all"
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {products.filter(p => p.name.includes(searchTerm) || p.code.includes(searchTerm)).map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="p-6 bg-white rounded-3xl border border-slate-100 text-right hover:border-indigo-600 hover:shadow-xl transition-all shadow-sm group relative overflow-hidden">
                <span className="text-[10px] text-slate-400 font-black">#{p.code}</span>
                <h4 className="font-black text-slate-800 text-lg mt-1">{p.name}</h4>
                <p className="text-xs text-slate-400 mb-4">{p.size} - {p.type}</p>
                <div className="flex justify-between items-end">
                  <span className="text-indigo-600 font-black text-xl">{p.sellPrice} <small className="text-[10px]">ج.م</small></span>
                  <span className={`text-[10px] px-2 py-1 rounded-lg ${p.quantity < 5 ? 'bg-red-50 text-red-500' : 'bg-slate-50'}`}>المخزون: {p.quantity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white h-fit sticky top-6 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black">قائمة البيع</h3>
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{cart.length} أصناف</span>
          </div>
          
          <div className="space-y-3 mb-8 max-h-[30vh] overflow-y-auto custom-scrollbar flex-1">
            {cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex-1">
                  <p className="font-bold text-sm truncate">{item.productName}</p>
                  <p className="text-[10px] opacity-50">{item.quantity} × {item.sellPrice} ج.م</p>
                </div>
                <div className="flex items-center gap-3">
                   <p className="font-black text-indigo-400">{item.total} ج.م</p>
                   <button onClick={() => setCart(cart.filter(i => i.productId !== item.productId))} className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10">
            <div>
               <label className="text-[10px] font-black text-slate-500 mr-2 uppercase">اسم العميل</label>
               <input 
                 type="text"
                 placeholder="اكتب اسم العميل هنا..."
                 className="w-full mt-1 p-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white focus:bg-white/10 transition-all"
                 value={customerName}
                 onChange={e => setCustomerName(e.target.value)}
               />
            </div>

            <div>
               <label className="text-[10px] font-black text-slate-500 mr-2 uppercase">طريقة الدفع</label>
               <div className="grid grid-cols-4 gap-2 mt-1">
                 {[
                   { id: 'CASH', label: 'كاش', icon: '💵' },
                   { id: 'NETWORK', label: 'شبكة', icon: '💳' },
                   { id: 'TRANSFER', label: 'تحويل', icon: '📲' },
                   { id: 'DEBT', label: 'آجل', icon: '📝' }
                 ].map(m => (
                   <button 
                    key={m.id}
                    onClick={() => handleMethodChange(m.id as PaymentMethod)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${paymentMethod === m.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                   >
                     <span className="text-lg">{m.icon}</span>
                     <span className="text-[10px] font-bold mt-1">{m.label}</span>
                   </button>
                 ))}
               </div>
            </div>

            {paymentMethod === 'DEBT' && (
              <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/30 animate-in slide-in-from-top duration-300">
                <label className="text-[10px] font-black text-orange-400 mr-2 uppercase">المبلغ المدفوع (عربون)</label>
                <input 
                  type="number" 
                  className="w-full mt-1 p-3 bg-white/10 rounded-xl outline-none font-black text-white text-center text-xl focus:bg-white/20"
                  value={paidAmount}
                  onChange={e => setPaidAmount(Number(e.target.value))}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-[10px] text-slate-400 font-bold">الإجمالي: {total}</p>
                  <p className="text-[10px] text-red-400 font-black">الباقي آجل: {total - paidAmount} ج.م</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center py-4">
              <span className="text-slate-400 font-bold uppercase text-xs">إجمالي الفاتورة</span>
              <span className="text-4xl font-black">{total} <small className="text-sm">ج.م</small></span>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all active:scale-95 disabled:opacity-50 ${paymentMethod === 'DEBT' ? 'bg-orange-500 hover:bg-orange-400' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
              {isProcessing ? 'جاري الحفظ...' : (paymentMethod === 'DEBT' ? 'إصدار فاتورة آجلة 📝' : 'إصدار فاتورة مبيعات ✅')}
            </button>
          </div>
        </div>
      </div>

      {showInvoice && lastSale && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[2000] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-8 md:p-12 text-right shadow-2xl relative rounded-[2.5rem] animate-in zoom-in duration-300" id="invoice-printable">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-sm shadow-xl">
              تم الحفظ بنجاح ✅
            </div>

            <div className="text-center border-b-2 border-slate-900 border-dashed pb-8 mb-8">
              <h1 className="text-4xl font-black text-slate-900 mb-2">الأشوال للدهانات</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-black">فاتورة {lastSale.paymentMethod === 'DEBT' ? 'بيع آجل' : 'مبيعات'} # {lastSale.invoiceNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 text-[10px] font-black">
              <div><p className="text-slate-400 mb-1">التاريخ</p><p>{new Date(lastSale.date).toLocaleDateString('ar-EG')}</p></div>
              <div className="text-left"><p className="text-slate-400 mb-1">البائع</p><p>{lastSale.employeeName}</p></div>
              <div><p className="text-slate-400 mb-1">العميل</p><p className="text-lg">{lastSale.customerName}</p></div>
              <div className="text-left"><p className="text-slate-400 mb-1">نظام الدفع</p><p className={`px-2 py-1 rounded inline-block ${lastSale.paymentMethod === 'DEBT' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>{lastSale.paymentMethod === 'DEBT' ? 'آجل 📝' : 'نقدي ✅'}</p></div>
            </div>

            <table className="w-full mb-8 text-sm border-t border-b border-slate-100">
              <thead><tr className="text-slate-400 text-[10px] font-black uppercase"><th className="py-4 text-right">الصنف</th><th className="py-4 text-center">الكمية</th><th className="py-4 text-left">الإجمالي</th></tr></thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {lastSale.items.map((item, idx) => (
                  <tr key={idx}><td className="py-4 text-slate-800">{item.productName}</td><td className="py-4 text-center">{item.quantity}</td><td className="py-4 text-left font-black">{item.total} ج.م</td></tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-2 border-t-2 border-slate-900 pt-4">
              <div className="flex justify-between items-center"><span className="text-sm font-black">المبلغ الإجمالي</span><span className="text-2xl font-black">{lastSale.totalAmount} ج.م</span></div>
              <div className="flex justify-between items-center text-emerald-600"><span className="text-xs font-bold">المبلغ المدفوع</span><span className="text-lg font-black">{lastSale.paidAmount} ج.م</span></div>
              {lastSale.debtAmount > 0 && (
                <div className="flex justify-between items-center text-red-600 bg-red-50 p-4 rounded-2xl border-2 border-red-100 border-dashed mt-2">
                  <span className="text-sm font-black">المتبقي للحساب الآجل</span>
                  <span className="text-2xl font-black underline underline-offset-4 decoration-2">{lastSale.debtAmount} ج.م</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 print:hidden">
              <button onClick={() => window.print()} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">طباعة 🖨️</button>
              <button onClick={closeInvoiceAndReset} className="bg-slate-100 text-slate-500 px-8 rounded-2xl font-black">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
