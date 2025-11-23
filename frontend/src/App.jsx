import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import MainLayout from "./components/layout/MainLayout.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterSupplierPage from "./pages/auth/RegisterSupplierPage.jsx";
import RegisterConsumerPage from "./pages/auth/RegisterConsumerPage.jsx";

import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import LinksPage from "./pages/links/LinksPage.jsx";
import CatalogPage from "./pages/catalog/CatalogPage.jsx";
import OrdersPage from "./pages/orders/OrdersPage.jsx";
import OrderDetailPage from "./pages/orders/OrderDetailPage.jsx";
import ChatPage from "./pages/chat/ChatPage.jsx";
import ComplaintsPage from "./pages/complaints/ComplaintsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/supplier" element={<RegisterSupplierPage />} />
      <Route path="/register/consumer" element={<RegisterConsumerPage />} />

      {/* Protected area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/links" element={<LinksPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
