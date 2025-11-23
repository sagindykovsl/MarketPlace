import React from 'react';
import { MOCK_ORDERS, formatCurrency } from '../../services/mockData';
import { OrderStatus } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { Package, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';

export const Orders = () => {
  const { t } = useI18n();
  
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ACCEPTED: return 'bg-green-100 text-green-700';
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.REJECTED: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
      switch (status) {
          case OrderStatus.ACCEPTED: return <CheckCircle size={16} className="mr-1" />;
          case OrderStatus.PENDING: return <Clock size={16} className="mr-1" />;
          case OrderStatus.REJECTED: return <XCircle size={16} className="mr-1" />;
          default: return null;
      }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t('nav.orders')}</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {MOCK_ORDERS.map((order, index) => (
            <div key={order.id} className={`p-6 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${index !== MOCK_ORDERS.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Package size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{order.supplierName}</h4>
                        <p className="text-sm text-gray-500">Order #{order.id} • {order.date}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {t(`status.${order.status.toLowerCase()}`)}
                        </span>
                    </div>
                    <ChevronRight className="text-gray-400" size={20} />
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};