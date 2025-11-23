import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_PRODUCTS, formatCurrency, MOCK_SUPPLIERS } from '../../services/mockData';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';
import { Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';

export const Catalog = () => {
  const { supplierId } = useParams();
  const { t } = useI18n();
  const { items, addToCart, removeFromCart, total } = useCart();
  
  const supplier = MOCK_SUPPLIERS.find(s => s.id === supplierId);
  const products = MOCK_PRODUCTS.filter(p => p.supplierId === supplierId);

  const getQuantity = (id: string) => items.find(i => i.id === id)?.quantity || 0;

  const handleUpdateQty = (product: any, delta: number) => {
    const current = getQuantity(product.id);
    if (current + delta <= 0) {
        removeFromCart(product.id);
    } else {
        addToCart(product, delta);
    }
  };

  if (!supplier) return <div>Supplier not found</div>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
             <Link to="/" className="p-2 hover:bg-gray-200 rounded-full text-gray-600">
                <ArrowLeft size={20} />
             </Link>
             <div>
                <h2 className="text-2xl font-bold text-gray-800">{supplier.name} Catalog</h2>
                <p className="text-gray-500 text-sm">{products.length} products available</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
        {products.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <div className="flex justify-between items-end mt-auto pt-4">
                    <div>
                        <p className="text-blue-600 font-bold text-lg">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-gray-400">per {product.unit}</p>
                    </div>
                    
                    <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button 
                            onClick={() => handleUpdateQty(product, -1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow rounded-md transition-all"
                            disabled={getQuantity(product.id) === 0}
                        >
                            <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{getQuantity(product.id)}</span>
                        <button 
                             onClick={() => handleUpdateQty(product, 1)}
                            className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-white hover:shadow rounded-md transition-all"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Floating Cart Bar */}
      {items.length > 0 && (
          <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-lg flex items-center justify-between z-10 animate-slide-up">
              <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-gray-500">{items.length} items selected</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
                  </div>
              </div>
              <button 
                onClick={() => alert("Order Placed! (This would go to Review Screen)")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all"
              >
                  {t('cart.checkout')}
              </button>
          </div>
      )}
    </div>
  );
};