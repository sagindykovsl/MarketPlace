import { Supplier, Product, Order, OrderStatus, Complaint, ComplaintStatus, LinkStatus } from '../types';

// Mock Suppliers
export const MOCK_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Fresh Farms Ltd', description: 'Premium organic vegetables', image: 'https://picsum.photos/200/200?random=1', isLinked: true, linkStatus: LinkStatus.APPROVED },
  { id: '2', name: 'Metro Meat Corp', description: 'High quality cuts for restaurants', image: 'https://picsum.photos/200/200?random=2', isLinked: false },
  { id: '3', name: 'Global Bev Distributors', description: 'Drinks and spirits', image: 'https://picsum.photos/200/200?random=3', isLinked: true, linkStatus: LinkStatus.PENDING },
];

// Mock Products
export const MOCK_PRODUCTS: Product[] = [
  { id: '101', supplierId: '1', name: 'Organic Tomatos', price: 1200, unit: 'kg', image: 'https://picsum.photos/200/200?random=4' },
  { id: '102', supplierId: '1', name: 'Potatoes', price: 400, unit: 'kg', image: 'https://picsum.photos/200/200?random=5' },
  { id: '103', supplierId: '1', name: 'Cucumbers', price: 850, unit: 'kg', image: 'https://picsum.photos/200/200?random=6' },
];

// Mock Orders (Consumer View)
export const MOCK_ORDERS: Order[] = [
  { 
    id: 'ORD-789', 
    supplierName: 'Fresh Farms Ltd', 
    total: 15600, 
    status: OrderStatus.ACCEPTED, 
    date: '2023-10-25',
    items: [{ ...MOCK_PRODUCTS[0], quantity: 10 }] 
  },
  { 
    id: 'ORD-790', 
    supplierName: 'Fresh Farms Ltd', 
    total: 5000, 
    status: OrderStatus.PENDING, 
    date: '2023-10-26',
    items: [{ ...MOCK_PRODUCTS[1], quantity: 12 }] 
  },
];

// Mock Complaints
export const MOCK_COMPLAINTS: Complaint[] = [
  { id: 'CMP-1', orderId: 'ORD-789', description: 'Tomatoes were too ripe.', status: ComplaintStatus.OPEN, createdAt: '2023-10-25' }
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(amount);
};