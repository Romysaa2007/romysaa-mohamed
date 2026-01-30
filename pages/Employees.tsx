
import React, { useState, useEffect } from 'react';
import { User, UserRole, SalaryRecord, Attendance } from '../types';
import { getStore, saveStore, recordAttendance } from '../services/store';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: UserRole.EMPLOYEE, baseSalary: 3000, phone: '' });
  const [salaryData, setSalaryData] = useState({ bonus: 0, deductions: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const store = await getStore();
      setEmployees(store.employees);
      setSalaries(store.salaries);
      setAttendance(store.attendance);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.phone) return;
    const store = await getStore();
    const newEmp = { ...formData, id: `emp-${Date.now()}` };
    store.employees.push(newEmp);
    await saveStore(store);
    setEmployees(store.employees);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => setFormData({ name: '', email: '', password: '', role: UserRole.EMPLOYEE, baseSalary: 3000, phone: '' });

  const handleAttendance = async (empId: string, status: 'PRESENT' | 'ABSENT') => {
    const date = new Date().toISOString().split('T')[0];
    await recordAttendance({ employeeId: empId, date, status });
    const store = await getStore();
    setAttendance(store.attendance);
  };

  const isSalaryDay = new Date().getDate() >= 25;

  const handlePaySalary = async () => {
    if (!payModal) return;
    const store = await getStore();
    const record: SalaryRecord = {
      id: `sal-${Date.now()}`,
      employeeId: payModal.id,
      month: new Date().toISOString().slice(0, 7),
      amount: payModal.baseSalary,
      bonus: salaryData.bonus,
      deductions: salaryData.deductions,
      date: new Date().toISOString(),
      isPaid: true
    };
    store.salaries.push(record);
    // تسجيل المعاملة في الخزنة
    store.treasury.push({
      id: `sal-tx-${record.id}`,
      date: record.date,
      amount: record.amount + record.bonus - record.deductions,
      type: 'OUT',
      category: 'SALARY',
      method: 'CASH',
      note: `راتب الموظف ${payModal.name}`
    });
    await saveStore(store);
    setSalaries(store.salaries);
    setPayModal(null);
    setSalaryData({ bonus: 0, deductions: 0 });
    alert('تم صرف الراتب وتسجيله في الخزنة بنجاح');
  };

  return (
    <div className="space-y-8 font-['Cairo'] pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">إدارة العاملين</h1>
          <p className="text-slate-500 font-bold">تسجيل الموظفين، الحضور، والمرتبات</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all">➕ إضافة موظف جديد</button>
      </div>

      {isSalaryDay && (
        <div className="bg-orange-50 border-2 border-orange-100 p-6 rounded-[2rem] flex items-center gap-6 animate-pulse">
           <span className="text-4xl">💰</span>
           <div>
              <h3 className="text-orange-800 font-black">حان وقت صرف الرواتب!</h3>
              <p className="text-orange-600 text-sm font-bold">نحن الآن في تاريخ {new Date().getDate()} من الشهر، يرجى مراجعة سجلات الرواتب وصرفها.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
             <h3 className="font-black text-slate-800">سجل الموظفين والحضور اليومي</h3>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {employees.map(emp => {
              const todayAtt = attendance.find(a => a.employeeId === emp.id && a.date === new Date().toISOString().split('T')[0]);
              return (
                <div key={emp.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">👤</div>
                    <div>
                      <h4 className="font-black text-slate-800">{emp.name}</h4>
                      <p className="text-xs text-slate-400 font-bold">📞 {emp.phone} | {emp.role === UserRole.ADMIN ? 'المدير العام' : 'موظف'}</p>
                      <p className="text-[10px] text-indigo-600 font-black mt-1">الراتب الأساسي: {emp.baseSalary} ج.م</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => handleAttendance(emp.id, 'PRESENT')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${todayAtt?.status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-white text-slate-400'}`}
                      >حاضر</button>
                      <button 
                        onClick={() => handleAttendance(emp.id, 'ABSENT')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${todayAtt?.status === 'ABSENT' ? 'bg-red-500 text-white shadow-lg' : 'hover:bg-white text-slate-400'}`}
                      >غائب</button>
                    </div>
                    <button onClick={() => setPayModal(emp)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-slate-900 transition-all">صرف الراتب</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b bg-slate-50">
             <h3 className="font-black text-slate-800">أحدث المدفوعات</h3>
          </div>
          <div className="p-6 space-y-4">
            {salaries.slice(-5).reverse().map(s => {
              const emp = employees.find(e => e.id === s.employeeId);
              return (
                <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm">{emp?.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{s.month}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-indigo-600 font-black">{s.amount + s.bonus - s.deductions} ج.م</p>
                    <span className="text-[8px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black">تم الصرف ✅</span>
                  </div>
                </div>
              );
            })}
            {salaries.length === 0 && <p className="text-center text-slate-300 py-10 italic">لا توجد سجلات صرف</p>}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl">
            <h2 className="text-3xl font-black mb-8 text-slate-800">موظف جديد</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 mr-2">الاسم بالكامل</label>
                 <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 mr-2">رقم الهاتف</label>
                 <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 mr-2">البريد الإلكتروني (للدخول)</label>
                 <input type="email" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 mr-2">كلمة المرور</label>
                 <input type="password" placeholder="••••••" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 mr-2">الراتب الأساسي</label>
                 <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 mr-2">صلاحية النظام</label>
                 <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                   <option value={UserRole.EMPLOYEE}>موظف مبيعات</option>
                   <option value={UserRole.ADMIN}>المدير العام</option>
                 </select>
               </div>
            </div>
            <div className="mt-10 flex gap-4">
               <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95">إضافة الموظف</button>
               <button onClick={() => setShowModal(false)} className="bg-slate-100 text-slate-500 px-10 rounded-[2rem] font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl">
             <h2 className="text-2xl font-black mb-2 text-slate-800">صرف الراتب المستحق</h2>
             <p className="text-slate-400 font-bold mb-8">للموظف: {payModal.name}</p>
             <div className="space-y-6">
                <div className="flex justify-between items-center p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <span className="font-bold text-indigo-400">الراتب الأساسي</span>
                  <span className="text-2xl font-black text-indigo-700">{payModal.baseSalary} ج.م</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-emerald-500 mb-1 block mr-2">مكافآت (+)</label>
                    <input type="number" className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black" value={salaryData.bonus} onChange={e => setSalaryData({...salaryData, bonus: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-red-500 mb-1 block mr-2">خصومات (-)</label>
                    <input type="number" className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl font-black" value={salaryData.deductions} onChange={e => setSalaryData({...salaryData, deductions: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="bg-slate-900 text-white p-6 rounded-3xl text-center">
                   <p className="text-[10px] uppercase font-black opacity-40 mb-1">صافي المبلغ المطلوب صرفه</p>
                   <p className="text-4xl font-black">{payModal.baseSalary + salaryData.bonus - salaryData.deductions} <small className="text-sm">ج.م</small></p>
                </div>
                <div className="flex gap-4">
                   <button onClick={handlePaySalary} className="flex-1 bg-emerald-500 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-100 transition-all active:scale-95">تأكيد الصرف</button>
                   <button onClick={() => setPayModal(null)} className="bg-slate-100 text-slate-500 px-8 rounded-[2rem] font-black">إغلاق</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
