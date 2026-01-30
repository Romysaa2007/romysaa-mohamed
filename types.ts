
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  baseSalary: number;
  phone: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT';
}

export interface Product {
  id: string;
  code: string;
  name: string;
  type: string;
  size: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minStockAlert: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  returnedQuantity: number;
  sellPrice: number;
  buyPriceAtSale: number;
  total: number;
}

export type PaymentMethod = 'CASH' | 'NETWORK' | 'TRANSFER' | 'DEBT';

export interface Sale {
  id: string;
  invoiceNumber: number;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  customerId?: string;
  customerName: string;
  employeeName: string;
  paymentMethod: PaymentMethod;
  isReturn?: boolean;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  itemName: string;
  quantity: number;
  totalCost: number;
  paidAmount: number;
  debtAmount: number; // المبلغ المتبقي للمورد في هذه الفاتورة
  date: string;
}

export interface TreasuryTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'IN' | 'OUT';
  category: 'SALE' | 'RETURN' | 'SALARY' | 'EXPENSE' | 'DEBT_COLLECTION' | 'SUPPLIER_PAYMENT';
  method: PaymentMethod;
  note: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company: string;
  totalDebt: number; // إجمالي ما يطلبه المورد منك
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string;
  amount: number;
  bonus: number;
  deductions: number;
  date: string;
  isPaid: boolean;
}

export interface CustomerTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'PAYMENT' | 'DEBT';
  note: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  transactions: CustomerTransaction[];
}

export interface AppState {
  currentUser: User | null;
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  employees: User[];
  lastInvoiceNumber: number;
  suppliers: Supplier[];
  salaries: SalaryRecord[];
  customers: Customer[];
  attendance: Attendance[];
  treasury: TreasuryTransaction[];
}
