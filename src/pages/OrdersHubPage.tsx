import React, { useState } from 'react';
import { ShoppingCart, FileText, Receipt } from 'lucide-react';
import OrdersPage from './OrdersPage';
import GoldOrdersPage from './GoldOrdersPage';
import OrderDataPage from './OrderDataPage';

const OrdersHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gold' | 'orders' | 'data'>('gold');

  const tabs = [
    { id: 'gold' as const, label: 'طلبيات ذهب وسبائك', icon: Receipt },
    { id: 'orders' as const, label: 'إدارة الطلبيات', icon: ShoppingCart },
    { id: 'data' as const, label: 'بيانات الطلبية', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400">الطلبيات</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content - all mounted, only active visible */}
      <div style={{ display: activeTab === 'gold' ? 'block' : 'none' }}>
        <GoldOrdersPage />
      </div>
      <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
        <OrdersPage />
      </div>
      <div style={{ display: activeTab === 'data' ? 'block' : 'none' }}>
        <OrderDataPage />
      </div>
    </div>
  );
};

export default OrdersHubPage;
