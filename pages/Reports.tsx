
import React, { useEffect, useState } from 'react';
import { subscribeToSales } from '../services/store';
import { analyzeSalesWithAI } from '../services/ai';
import { Sale } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';

const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsub = subscribeToSales((data) => {
      setSales(data);
    });
    return () => unsub();
  }, []);

  const runAI = async () => {
    setIsAnalyzing(true);
    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const profit = totalSales * 0.2; // مثال لصافي الربح
    const result = await analyzeSalesWithAI({ totalSales, count: sales.length }, 500, profit);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-8 font-['Cairo'] pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">التقارير المالية</h1>
          <p className="text-slate-500 font-bold">متابعة الأرباح وتحليلات الذكاء الاصطناعي</p>
        </div>
        
        <button 
          onClick={runAI}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 flex items-center gap-3 hover:scale-105 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
          تحليل الأداء بالذكاء الاصطناعي
        </button>
      </div>

      {aiAnalysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[3rem] border-2 border-indigo-100 shadow-xl animate-in zoom-in duration-500">
           <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-indigo-600" />
              <h3 className="text-xl font-black text-indigo-900">رؤية الأشوال الذكية (AI)</h3>
           </div>
           <p className="text-slate-700 leading-relaxed font-bold whitespace-pre-line">{aiAnalysis}</p>
        </div>
      )}

      {/* باقي جدول التقارير والإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <ReportCard label="مبيعات الفترة" value={sales.reduce((acc, s) => acc + s.totalAmount, 0).toLocaleString() + " ج.م"} />
         <ReportCard label="إجمالي الفواتير" value={sales.length} />
         <ReportCard label="أرباح تقديرية" value={(sales.reduce((acc, s) => acc + s.totalAmount, 0) * 0.15).toLocaleString() + " ج.م"} />
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
         <table className="w-full text-right">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
               <tr>
                  <th className="px-8 py-6">رقم الفاتورة</th>
                  <th className="px-8 py-6">العميل</th>
                  <th className="px-8 py-6">التاريخ</th>
                  <th className="px-8 py-6">القيمة</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {sales.map(s => (
                 <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 font-black text-indigo-600">#{s.invoiceNumber}</td>
                    <td className="px-8 py-5 font-bold">{s.customerName}</td>
                    <td className="px-8 py-5 text-sm text-slate-400">{new Date(s.date).toLocaleDateString('ar-EG')}</td>
                    <td className="px-8 py-5 font-black text-lg">{s.totalAmount} ج.م</td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

const ReportCard = ({ label, value }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center">
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
     <p className="text-3xl font-black text-slate-800">{value}</p>
  </div>
);

export default Reports;
