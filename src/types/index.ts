export interface JewelryItem {
  id: number;
  item_code: string;
  item_type: string;
  karat: string;
  origin: string;
  category: string;
  status: string;
  model_name: string;
  weight: number;
  price: number;
  stock_qty: number;
  qr_path?: string;
  created_at?: string;
}

export interface CartItem extends JewelryItem {
  quantity: number;
  total: number;
}

export interface SaleInvoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  items: CartItem[];
  total_amount: number;
  seller_name: string;
  seller_code: string;
  created_at: string;
  related_order_number?: string;
  related_receipt_number?: string;
  linked_gold_invoice_number?: string;
  invoice_link_key?: string;
}