import React, { useState } from 'react';
import { MOCK_SUPPLIERS } from '../../services/mockData';
import { LinkStatus } from '../../types';
import { Link } from 'react-router-dom';
import { Search, Link as LinkIcon, Check, Clock } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export const SupplierList = () => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS);

  const handleRequestLink = (id: string) => {
    setSuppliers(prev => prev.map(s => 
      s.id === id ? { ...s, isLinked: true, linkStatus: LinkStatus.PENDING } : s
    ));
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{t('nav.suppliers')}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={t('supplier.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 bg-gray-200 relative">
              <img src={supplier.image} alt={supplier.name} className="w-full h-full object-cover" />
              {supplier.linkStatus === LinkStatus.APPROVED && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Check size={12} className="mr-1" /> Linked
                  </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-900">{supplier.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{supplier.description}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-50">
                {supplier.linkStatus === LinkStatus.APPROVED ? (
                   <Link 
                     to={`/catalog/${supplier.id}`}
                     className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                   >
                     View Catalog
                   </Link>
                ) : supplier.linkStatus === LinkStatus.PENDING ? (
                    <button disabled className="w-full flex items-center justify-center bg-gray-100 text-gray-400 font-medium py-2 rounded-lg cursor-not-allowed">
                        <Clock size={16} className="mr-2" /> {t('status.pending')}
                    </button>
                ) : (
                    <button 
                        onClick={() => handleRequestLink(supplier.id)}
                        className="w-full flex items-center justify-center bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 rounded-lg transition-colors"
                    >
                        <LinkIcon size={16} className="mr-2" /> {t('supplier.request')}
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};