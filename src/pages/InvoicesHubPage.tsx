import React, { useState } from 'react';
import { FileText, FilePlus, ShoppingCart, FileSignature, List, Gem } from 'lucide-react';
import SalesPage from './SalesPage';
import DraftInvoicesPage from './DraftInvoicesPage';
import InvoicesPage from './InvoicesPage';
import QuotePage from './QuotePage';
import SavedQuotesPage from './SavedQuotesPage';
import OrdersPage from './OrdersPage';

const tabs = [
  { key: 'create', label: 'إنشاء فاتورة', icon: ShoppingCart },
  { key: 'quote', label: 'إنشاء عرض أسعار', icon: FileSignature },
  { key: 'saved-quotes', label: 'عروض الأسعار المحفوظة', icon: List },
  { key: 'orders', label: 'طلبيات ذهب وسبائك', icon: Gem },
  { key: 'draft', label: 'إنشاء فاتورة مبدئية', icon: FilePlus },
  { key: 'view', label: 'عرض الفواتير', icon: FileText },
];

const InvoicesHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'create' && <SalesPage />}
      {activeTab === 'quote' && <QuotePage />}
      {activeTab === 'saved-quotes' && <SavedQuotesPage />}
      {activeTab === 'orders' && <OrdersPage />}
      {activeTab === 'draft' && <DraftInvoicesPage />}
      {activeTab === 'view' && <InvoicesPage />}
    </div>
  );
};

export default InvoicesHubPage;
