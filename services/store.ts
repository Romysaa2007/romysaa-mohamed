
import { AppState, Product, Sale, TreasuryTransaction, Attendance, Customer, Purchase, User, Supplier, SalaryRecord } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const STORAGE_KEY = 'alashwal_master_data';
const DB_COLLECTION = 'alashwal_system';
const DB_DOC = 'main_store';

const initialState: AppState = {
  currentUser: null,
  products: [],
  sales: [],
  purchases: [],
  employees: [],
  lastInvoiceNumber: 0,
  suppliers: [],
  salaries: [],
  customers: [],
  attendance: [],
  treasury: []
};

// متغير لتتبع حالة الاستماع للتحديثات
let isListening = false;

// دالة لحفظ البيانات محلياً فقط
const saveLocal = (store: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event('storage'));
};

// تفعيل الاستماع الفوري للتحديثات من السحابة
const startRealtimeSync = () => {
  if (!db || isListening) return;
  
  try {
    isListening = true;
    const docRef = doc(db, DB_COLLECTION, DB_DOC);
    
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as AppState;
        // حفظ البيانات القادمة من السحابة في المتصفح وتحديث الواجهة
        // نستخدم JSON.stringify لمقارنة بسيطة لتجنب التحديث المتكرر
        const currentLocal = localStorage.getItem(STORAGE_KEY);
        if (currentLocal !== JSON.stringify(cloudData)) {
           console.log("☁️ تم استلام تحديثات من السحابة");
           saveLocal(cloudData);
        }
      }
    }, (error) => {
      console.error("Sync Error:", error);
    });
  } catch (e) {
    console.error("Error starting sync", e);
  }
};

// تشغيل المزامنة عند بدء التطبيق
startRealtimeSync();

// قراءة البيانات (تحاول السحابة أولاً، ثم المحلي)
export const getStore = async (): Promise<AppState> => {
  // محاولة القراءة من المحلي أولاً للسرعة
  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
       // إذا كان هناك اتصال بالسحابة ولم نبدأ الاستماع، نبدأه الآن
       if (db && !isListening) startRealtimeSync();
       return JSON.parse(localData);
    }
  } catch (e) {
    console.error("Local Storage Error", e);
  }

  // إذا لم نجد بيانات محلياً، نحاول جلبها من السحابة (لأول مرة)
  if (db) {
    try {
      const docRef = doc(db, DB_COLLECTION, DB_DOC);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AppState;
        saveLocal(data);
        return data;
      }
    } catch (e) {
      console.error("Cloud Fetch Error", e);
    }
  }

  return initialState;
};

// حفظ البيانات (يحفظ محلياً ويرسل للسحابة)
export const saveStore = async (store: AppState) => {
  try {
    // 1. الحفظ المحلي (فوراً)
    saveLocal(store);

    // 2. الحفظ السحابي (في الخلفية)
    if (db) {
      const docRef = doc(db, DB_COLLECTION, DB_DOC);
      // نستخدم setDoc لكتابة البيانات
      // ملاحظة: في التطبيقات الكبيرة نستخدم Collections منفصلة، لكن للتبسيط هنا نستخدم مستند واحد
      setDoc(docRef, store, { merge: true }).catch(err => {
        console.error("❌ فشل الحفظ السحابي:", err);
      });
    }
  } catch (e) {
    console.error("Error saving store", e);
    alert("مساحة التخزين ممتلئة أو حدث خطأ!");
  }
};

// ------------------------------------------------------------------
// باقي الدوال كما هي، لأنها تعتمد على getStore و saveStore اللذان قمنا بتحديثهما
// ------------------------------------------------------------------

const createSubscriber = <T>(selector: (state: AppState) => T, callback: (data: T) => void) => {
  const check = () => getStore().then(store => callback(selector(store)));
  check();
  window.addEventListener('storage', check);
  const interval = setInterval(check, 1000);
  return () => {
    window.removeEventListener('storage', check);
    clearInterval(interval);
  };
};

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  return createSubscriber(state => state.products, callback);
};

export const subscribeToSales = (callback: (sales: Sale[]) => void) => {
  return createSubscriber(state => state.sales, callback);
};

export const processSale = async (sale: Sale) => {
  const store = await getStore();
  
  const nextInvoice = (store.lastInvoiceNumber || 0) + 1;
  const finalSale = { ...sale, invoiceNumber: nextInvoice, id: `sale-${Date.now()}` };
  
  store.products = store.products.map(p => {
    const item = sale.items.find(si => si.productId === p.id);
    if (item) {
      return { ...p, quantity: p.quantity - item.quantity };
    }
    return p;
  });

  if (sale.customerId && sale.debtAmount > 0) {
    store.customers = store.customers.map(c => {
      if (c.id === sale.customerId) {
        return {
          ...c,
          totalDebt: c.totalDebt + sale.debtAmount,
          transactions: [...(c.transactions || []), {
            id: `tr-${Date.now()}`,
            date: sale.date,
            amount: sale.debtAmount,
            type: 'DEBT',
            note: `فاتورة #${nextInvoice}`
          }]
        };
      }
      return c;
    });
  }

  if (sale.paidAmount > 0) {
    store.treasury.push({
      id: `tx-${Date.now()}`,
      date: sale.date,
      amount: sale.paidAmount,
      type: 'IN',
      category: 'SALE',
      method: sale.paymentMethod,
      note: `فاتورة #${nextInvoice} - ${sale.customerName}`
    });
  }

  store.sales.unshift(finalSale);
  store.lastInvoiceNumber = nextInvoice;
  await saveStore(store);
};

export const findOrCreateCustomer = async (name: string): Promise<string> => {
  const store = await getStore();
  const existing = store.customers.find(c => c.name.trim() === name.trim());
  if (existing) return existing.id;

  const newId = `cust-${Date.now()}`;
  store.customers.push({
    id: newId,
    name: name.trim(),
    phone: '',
    totalDebt: 0,
    transactions: []
  });
  await saveStore(store);
  return newId;
};

export const updateSuppliers = async (suppliers: Supplier[]) => {
  const store = await getStore();
  store.suppliers = suppliers;
  await saveStore(store);
};

export const updateCustomers = async (customers: Customer[]) => {
  const store = await getStore();
  store.customers = customers;
  await saveStore(store);
};

export const recordPurchase = async (purchase: Purchase) => {
  const store = await getStore();
  store.purchases.unshift({ ...purchase, id: `pur-${Date.now()}` });
  
  store.suppliers = store.suppliers.map(s => {
    if (s.id === purchase.supplierId) {
      return { ...s, totalDebt: s.totalDebt + purchase.debtAmount };
    }
    return s;
  });

  store.products = store.products.map(p => {
    if (p.name === purchase.itemName) {
      return { ...p, quantity: p.quantity + purchase.quantity };
    }
    return p;
  });

  if (purchase.paidAmount > 0) {
    store.treasury.push({
      id: `tx-pur-${Date.now()}`,
      date: purchase.date,
      amount: purchase.paidAmount,
      type: 'OUT',
      category: 'SUPPLIER_PAYMENT',
      method: 'CASH',
      note: `مشتريات: ${purchase.itemName}`
    });
  }

  await saveStore(store);
};

export const recordAttendance = async (att: Omit<Attendance, 'id'>) => {
  const store = await getStore();
  const id = `${att.employeeId}_${att.date}`;
  const filtered = store.attendance.filter(a => a.id !== id);
  store.attendance = [...filtered, { ...att, id }];
  await saveStore(store);
};

export const processPartialReturn = async (saleId: string, itemsToReturn: { productId: string, quantityToReturn: number }[]) => {
  const store = await getStore();
  const saleIndex = store.sales.findIndex(s => s.id === saleId);
  if (saleIndex === -1) return;

  const sale = store.sales[saleIndex];
  let totalReturnAmount = 0;

  sale.items = sale.items.map(item => {
    const r = itemsToReturn.find(it => it.productId === item.productId);
    if (r) {
      item.returnedQuantity = (item.returnedQuantity || 0) + r.quantityToReturn;
      totalReturnAmount += r.quantityToReturn * item.sellPrice;
      store.products = store.products.map(p => p.id === item.productId ? { ...p, quantity: p.quantity + r.quantityToReturn } : p);
    }
    return item;
  });

  sale.isReturn = true;

  if (sale.customerId) {
    const customer = store.customers.find(c => c.id === sale.customerId);
    if (customer) {
      const reduction = Math.min(customer.totalDebt, totalReturnAmount);
      customer.totalDebt -= reduction;
      const refundCash = totalReturnAmount - reduction;
      if (refundCash > 0) {
        store.treasury.push({
          id: `tx-ret-${Date.now()}`,
          date: new Date().toISOString(),
          amount: refundCash,
          type: 'OUT',
          category: 'RETURN',
          method: 'CASH',
          note: `مرتجع نقدي (فرق دين) فاتورة #${sale.invoiceNumber}`
        });
      }
    }
  } else {
    store.treasury.push({
      id: `tx-ret-cash-${Date.now()}`,
      date: new Date().toISOString(),
      amount: totalReturnAmount,
      type: 'OUT',
      category: 'RETURN',
      method: 'CASH',
      note: `مرتجع نقدي فاتورة #${sale.invoiceNumber}`
    });
  }

  await saveStore(store);
};

export const getQuickStats = async () => {
  const store = await getStore();
  return {
    salesCount: store.sales.length,
    productsCount: store.products.length,
    customersCount: store.customers.length
  };
};
