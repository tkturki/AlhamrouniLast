// Orders Management System
export type OrderStatus = 'completed' | 'pending' | 'in_progress' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'returned';

export interface Order {
  id: string;
  orderNumber: string;
  orderType: string; // نوع وبيان الطلبية
  karat: string;
  goldWeight: number; // وزن الذهب بالجرام
  metalType: string; // نوع المعدن
  totalValue: number; // القيمة الاجمالية
  deposit: number; // العربون
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  receiveDate: string; // تاريخ الاستلام
  deliveryDate: string; // تاريخ التسليم
  notes?: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
}

const ORDERS_KEY = 'orders';

// Generate order number
export const generateOrderNumber = (): string => {
  const now = new Date();
  const prefix = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
};

// Get all orders
export const getOrders = (): Order[] => {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
};

// Get order by ID
export const getOrderById = (id: string): Order | null => {
  const orders = getOrders();
  return orders.find(o => o.id === id) || null;
};

// Get order by number
export const getOrderByNumber = (orderNumber: string): Order | null => {
  const orders = getOrders();
  return orders.find(o => o.orderNumber === orderNumber) || null;
};

// Add new order
export const addOrder = (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order => {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: Date.now().toString(),
    orderNumber: generateOrderNumber(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return newOrder;
};

// Update order
export const updateOrder = (id: string, updates: Partial<Order>): Order | null => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return null;

  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return orders[index];
};

// Delete order
export const deleteOrder = (id: string): boolean => {
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== id);
  if (filtered.length === orders.length) return false;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
  return true;
};

// Search orders
export const searchOrders = (query: string): Order[] => {
  const orders = getOrders();
  const lowerQuery = query.toLowerCase();
  return orders.filter(o =>
    o.orderNumber.toLowerCase().includes(lowerQuery) ||
    o.customerName.toLowerCase().includes(lowerQuery) ||
    o.orderType.toLowerCase().includes(lowerQuery)
  );
};

// Get orders by status
export const getOrdersByStatus = (status: OrderStatus): Order[] => {
  const orders = getOrders();
  return orders.filter(o => o.status === status);
};

// Get order statistics
export const getOrderStats = (): {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  cancelled: number;
  totalValue: number;
  totalDeposit: number;
} => {
  const orders = getOrders();
  return {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalValue: orders.reduce((sum, o) => sum + o.totalValue, 0),
    totalDeposit: orders.reduce((sum, o) => sum + o.deposit, 0),
  };
};

// Print order receipt (A5 format)
export const printOrderReceipt = (order: Order): void => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 20px; font-size: 14px; }
        .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 28px; color: #333; margin-bottom: 5px; }
        .header p { color: #666; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .info-box { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        .info-box label { display: block; color: #666; font-size: 12px; margin-bottom: 3px; }
        .info-box span { font-weight: bold; font-size: 16px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #333; color: white; padding: 10px; text-align: right; }
        .items-table td { border-bottom: 1px solid #ddd; padding: 10px; }
        .totals { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .totals .row { display: flex; justify-content: space-between; padding: 5px 0; }
        .totals .total { font-size: 20px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-completed { background: #4CAF50; color: white; }
        .status-pending { background: #FFC107; color: black; }
        .status-in_progress { background: #2196F3; color: white; }
        .status-cancelled { background: #f44336; color: white; }
        @media print { body { padding: 0; } *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>مجوهرات الحمروني</h1>
        <p>أجود المجوهرات وأفخرها</p>
        <p style="margin-top: 10px;">سند استلام - ${order.orderNumber}</p>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <label>رقم الطلبية</label>
          <span>${order.orderNumber}</span>
        </div>
        <div class="info-box">
          <label>اسم الزبون</label>
          <span>${order.customerName}</span>
        </div>
        <div class="info-box">
          <label>نوع الطلبية</label>
          <span>${order.orderType}</span>
        </div>
        <div class="info-box">
          <label>العيار</label>
          <span>عيار ${order.karat}</span>
        </div>
        <div class="info-box">
          <label>تاريخ الاستلام</label>
          <span>${new Date(order.receiveDate).toLocaleDateString('en-CA')}</span>
        </div>
        <div class="info-box">
          <label>تاريخ التسليم</label>
          <span>${new Date(order.deliveryDate).toLocaleDateString('en-CA')}</span>
        </div>
      </div>

      <div class="info-box" style="margin-bottom: 20px;">
        <label>الحالة</label>
        <span class="status-badge status-${order.status}">
          ${order.status === 'completed' ? 'تم التجهيز' :
            order.status === 'pending' ? 'لم يتم التجهيز' :
            order.status === 'in_progress' ? 'جاري التجهيز' : 'ملغاة'}
        </span>
      </div>

      <div class="totals">
        <div class="row">
          <span>القيمة الإجمالية:</span>
          <span>${order.totalValue.toLocaleString()} د.ل</span>
        </div>
        <div class="row">
          <span>العربون:</span>
          <span>${order.deposit.toLocaleString()} د.ل</span>
        </div>
        <div class="row">
          <span>المتبقي:</span>
          <span>${(order.totalValue - order.deposit).toLocaleString()} د.ل</span>
        </div>
        <div class="row total">
          <span>الإجمالي:</span>
          <span>${order.totalValue.toLocaleString()} د.ل</span>
        </div>
      </div>

      ${order.notes ? `
      <div class="info-box" style="margin-top: 20px;">
        <label>ملاحظات</label>
        <span>${order.notes}</span>
      </div>
      ` : ''}

      <div class="footer">
        <p>تم إصدار هذا السند بتاريخ ${new Date(order.createdAt).toLocaleDateString('en-CA')}</p>
        <p style="margin-top: 10px;">التوقيع: _______________</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
};