import React from 'react';
import { MOCK_ORDERS, formatCurrency } from '../../services/mockData';
import { OrderStatus } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { Check, X } from 'lucide-react';

export const SalesOrders = () => {
  const { t } = useI18n();

  const handleAction = (id: string, action: 'accept' | 'reject') => {
    alert(`${action.toUpperCase()} order ${id}`);
    // In real app, call API here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Incoming Orders</h2>
          <div className="flex space-x-2">
              <span className="px-3 py-1 bg-white border rounded-full text-sm font-medium shadow-sm">All</span>
              <span className="px-3 py-1 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-full text-sm font-medium">Pending (1)</span>
          </div>
      </div>
      
      <div className="space-y-4">
        {MOCK_ORDERS.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                                order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">From: Consumer Corp • {order.date}</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(order.total)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items Requested</h4>
                    <ul className="space-y-2">
                        {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                                <span><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                                <span className="text-gray-600">{formatCurrency(item.price * item.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {order.status === OrderStatus.PENDING && (
                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={() => handleAction(order.id, 'reject')}
                            className="flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                        >
                            <X size={18} className="mr-2" /> Reject
                        </button>
                        <button 
                            onClick={() => handleAction(order.id, 'accept')}
                            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm transition-colors"
                        >
                            <Check size={18} className="mr-2" /> Accept Order
                        </button>
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};