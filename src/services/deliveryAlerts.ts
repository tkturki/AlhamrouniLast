// خدمة تنبيهات التسليم عبر واتساب
import { StoredReceipt } from './goldOrdersStorage';
import { getReceipts } from './goldOrdersStorage';
import { getSystemSettings } from './settings';
import { formatNumber } from './supabase';

export interface DeliveryAlertSettings {
  enabled: boolean;
  daysBeforeDelivery: number;
  phoneNumbers: string[];
  lastChecked: string;
}

const ALERT_STORAGE_KEY = 'delivery_alert_settings';
const SENT_ALERTS_KEY = 'sent_delivery_alerts';

// Default settings
const DEFAULT_ALERT_SETTINGS: DeliveryAlertSettings = {
  enabled: true,
  daysBeforeDelivery: 20,
  phoneNumbers: ['+218912133218', '+218913157496'],
  lastChecked: '',
};

// Get/Set alert settings
export const getAlertSettings = (): DeliveryAlertSettings => {
  try {
    const raw = localStorage.getItem(ALERT_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(raw) };
    }
    return DEFAULT_ALERT_SETTINGS;
  } catch {
    return DEFAULT_ALERT_SETTINGS;
  }
};

export const saveAlertSettings = (settings: DeliveryAlertSettings): void => {
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(settings));
};

// Get sent alerts to avoid duplicates
const getSentAlerts = (): Record<string, string[]> => {
  try {
    const raw = localStorage.getItem(SENT_ALERTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const markAlertSent = (orderId: string, alertType: string): void => {
  const sent = getSentAlerts();
  if (!sent[orderId]) sent[orderId] = [];
  if (!sent[orderId].includes(alertType)) {
    sent[orderId].push(alertType);
    localStorage.setItem(SENT_ALERTS_KEY, JSON.stringify(sent));
  }
};

const isAlertSent = (orderId: string, alertType: string): boolean => {
  const sent = getSentAlerts();
  return sent[orderId]?.includes(alertType) || false;
};

// Get orders with upcoming delivery dates
export const getUpcomingDeliveries = (daysBefore: number = 20): Array<{
  order: StoredReceipt;
  daysRemaining: number;
  deliveryDate: Date;
}> => {
  const receipts = getReceipts();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const upcoming: Array<{
    order: StoredReceipt;
    daysRemaining: number;
    deliveryDate: Date;
  }> = [];

  receipts.forEach(receipt => {
    if (!receipt.delivery_date) return;
    
    const deliveryDate = new Date(receipt.delivery_date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const diffTime = deliveryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= daysBefore && diffDays >= -30) {
      upcoming.push({
        order: receipt,
        daysRemaining: diffDays,
        deliveryDate,
      });
    }
  });

  return upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

// Generate WhatsApp message
export const generateWhatsAppMessage = (
  receipt: StoredReceipt,
  daysRemaining: number
): string => {
  const customerName = receipt.customer_name || 'عميل';
  const receiptNum = receipt.receipt_number;
  const deliveryDateStr = new Date(receipt.delivery_date).toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  let urgency = '';
  let emoji = '';
  
  if (daysRemaining < 0) {
    urgency = `⚠️ تأخر ${Math.abs(daysRemaining)} يوم عن موعد التسليم!`;
    emoji = '🚨';
  } else if (daysRemaining === 0) {
    urgency = '📅 موعد التسليم اليوم!';
    emoji = '⏰';
  } else if (daysRemaining <= 7) {
    urgency = `⏰ باقي ${daysRemaining} أيام فقط على موعد التسليم`;
    emoji = '⏳';
  } else {
    urgency = `📋 باقي ${daysRemaining} يوم على موعد التسليم`;
    emoji = '📌';
  }

  const itemsList = receipt.items?.map(item => 
    `• ${item.description || 'قطعة'} - ${item.count || 1} قطعة`
  ).join('\n') || 'لا توجد تفاصيل';

  return `${emoji} *تنبيه موعد تسليم طلبية*

${urgency}

*العميل:* ${customerName}
*رقم الإيصال:* ${receiptNum}
*تاريخ التسليم:* ${deliveryDateStr}

*تفاصيل الطلبية:*
${itemsList}

*الوزن الكلي:* ${formatNumber(receipt.total_weight || 0)} غرام
*المبلغ الكلي:* ${formatNumber(receipt.total_value || 0)} د.ل

---
شركة أعمال للصرافة والحوالات
📞 للتأكيد: ${getSystemSettings().storePhone || '021-XXXXXXX'}`;
};

// Open WhatsApp with pre-filled message
export const sendWhatsAppMessage = (phone: string, message: string): void => {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
};

// Send alerts for upcoming deliveries
export const sendDeliveryAlerts = (): {
  sent: number;
  failed: number;
  details: Array<{ orderId: string; customer: string; status: string }>;
} => {
  const settings = getAlertSettings();
  if (!settings.enabled) {
    return { sent: 0, failed: 0, details: [] };
  }

  const upcoming = getUpcomingDeliveries(settings.daysBeforeDelivery);
  const results = {
    sent: 0,
    failed: 0,
    details: [] as Array<{ orderId: string; customer: string; status: string }>,
  };

  upcoming.forEach(({ order, daysRemaining }) => {
    const orderId = order.receipt_number || 'unknown';
    const alertType = daysRemaining <= 0 ? 'overdue' : daysRemaining <= 7 ? 'urgent' : 'upcoming';
    
    // Don't send duplicate alerts
    if (isAlertSent(order.receipt_number, alertType)) {
      return;
    }

    const message = generateWhatsAppMessage(order, daysRemaining);
    
    settings.phoneNumbers.forEach(phone => {
      try {
        sendWhatsAppMessage(phone, message);
        results.sent++;
        markAlertSent(orderId, alertType);
      } catch (error) {
        results.failed++;
      }
    });

    results.details.push({
      orderId,
      customer: order.customer_name || 'عميل',
      status: `تم إرسال تنبيه (${daysRemaining} يوم)`,
    });
  });

  // Update last checked
  saveAlertSettings({ ...settings, lastChecked: new Date().toISOString() });
  
  return results;
};

// Check and notify (called from UI or timer)
export const checkDeliveryAlerts = (): void => {
  const settings = getAlertSettings();
  if (!settings.enabled) return;

  const lastChecked = settings.lastChecked ? new Date(settings.lastChecked) : null;
  const now = new Date();
  
  // Check at most once per day
  if (lastChecked) {
    const hoursSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastCheck < 24) return;
  }

  sendDeliveryAlerts();
};

// Manual send for specific order
export const sendManualAlert = (receipt: StoredReceipt, customMessage?: string): void => {
  const settings = getAlertSettings();
  const message = customMessage || generateWhatsAppMessage(receipt, 0);
  
  settings.phoneNumbers.forEach(phone => {
    sendWhatsAppMessage(phone, message);
  });
};
