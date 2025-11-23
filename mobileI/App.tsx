import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SupplierList } from './pages/consumer/SupplierList';
import { Catalog } from './pages/consumer/Catalog';
import { Orders } from './pages/consumer/Orders';
import { SalesOrders } from './pages/sales/SalesOrders';
import { Complaints } from './pages/sales/Complaints';
import { UserRole } from './types';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const RoleRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles: UserRole[] }) => {
    const { user } = useAuth();
    if (user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

const AppContent = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute>{
                user?.role === UserRole.SALES ? <SalesOrders /> : <SupplierList />
            }</ProtectedRoute>} />

            <Route path="/catalog/:supplierId" element={
                <ProtectedRoute>
                    <RoleRoute allowedRoles={[UserRole.CONSUMER]}>
                        <Catalog />
                    </RoleRoute>
                </ProtectedRoute>
            } />

            <Route path="/orders" element={
                <ProtectedRoute>
                    {user?.role === UserRole.SALES ? <SalesOrders /> : <Orders />}
                </ProtectedRoute>
            } />

            <Route path="/complaints" element={
                <ProtectedRoute>
                    <RoleRoute allowedRoles={[UserRole.SALES]}>
                        <Complaints />
                    </RoleRoute>
                </ProtectedRoute>
            } />

            <Route path="/chat" element={
                <ProtectedRoute>
                    <div className="flex items-center justify-center h-[60vh] text-gray-500">
                        Chat functionality coming soon...
                    </div>
                </ProtectedRoute>
            } />
        </Routes>
    );
};

const App = () => {
  return (
    <HashRouter>
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </HashRouter>
  );
};

export default App;