import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const isSupplier = user && ["OWNER", "MANAGER", "SALES"].includes(user.role);

  const [data, setData] = useState({
    orders: [],
    links: [],
    complaints: [],
    products: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, linksRes, complaintsRes, productsRes] = await Promise.allSettled([
          api.get("/api/orders"),
          isSupplier ? api.get("/api/links/me") : api.get("/api/links/me"), // Adjust endpoint if needed
          api.get("/api/complaints"),
          isSupplier ? api.get("/api/supplier/products") : Promise.resolve({ data: [] }),
        ]);

        setData({
          orders: ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value.data) ? ordersRes.value.data : [],
          links: linksRes.status === "fulfilled" && Array.isArray(linksRes.value.data) ? linksRes.value.data : [],
          complaints: complaintsRes.status === "fulfilled" && Array.isArray(complaintsRes.value.data) ? complaintsRes.value.data : [],
          products: productsRes.status === "fulfilled" && Array.isArray(productsRes.value.data) ? productsRes.value.data : [],
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isSupplier]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  // --- Derived Stats ---

  // Orders
  const totalOrders = data.orders.length;
  const newOrdersCount = data.orders.filter(o => o.status === "PENDING").length;
  const inProgressOrdersCount = data.orders.filter(o => o.status === "ACCEPTED").length;
  const recentOrders = [...data.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  // Links
  const totalLinks = data.links.length;
  const activeLinksCount = data.links.filter(l => l.status === "APPROVED").length;
  const pendingLinksCount = data.links.filter(l => l.status === "PENDING").length;

  // Incidents (Complaints)
  const totalComplaints = data.complaints.length;
  const openComplaintsCount = data.complaints.filter(c => c.status === "OPEN").length;

  // Products
  const totalProducts = data.products.length;

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of orders, links, and incidents.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total orders"
          value={totalOrders}
          subtext={`${newOrdersCount} new • ${inProgressOrdersCount} in progress`}
          linkTo="/orders"
          linkText="Go to orders →"
        />
        <SummaryCard
          title={isSupplier ? "Linked consumers" : "Linked suppliers"}
          value={totalLinks}
          subtext={`${activeLinksCount} active • ${pendingLinksCount} pending`}
          linkTo="/links"
          linkText="Manage links →"
        />
        <SummaryCard
          title="Incidents"
          value={totalComplaints}
          subtext={`${openComplaintsCount} open`}
          linkTo="/complaints"
          linkText="View incidents →"
        />
        {isSupplier && (
          <SummaryCard
            title="Catalog products"
            value={totalProducts}
            subtext="Active in catalog"
            linkTo="/catalog"
            linkText="Manage catalog →"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders (Left - 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent orders</h2>
            <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              See all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No orders found.</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary-700">Order #{order.id}</span>
                      <span className="text-sm text-gray-500">
                        • {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {isSupplier ? order.consumer?.full_name || `Consumer #${order.consumer_id}` : order.supplier?.company_name || `Supplier #${order.supplier_id}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{Number(order.total_amount).toLocaleString()} ₸</div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attention Needed (Right - 1 col) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Attention needed</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <AttentionItem
              title="Pending link requests"
              description="Approve or reject consumers who want to work with you."
              count={pendingLinksCount}
              linkTo="/links"
            />
            <AttentionItem
              title="New orders"
              description="Review and accept or reject new orders."
              count={newOrdersCount}
              linkTo="/orders"
            />
            <AttentionItem
              title="Open incidents"
              description="Complaints escalated from orders that need your decision."
              count={openComplaintsCount}
              linkTo="/complaints"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtext, linkTo, linkText }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className="mt-2 text-4xl font-bold text-gray-900">{value}</div>
        <div className="mt-1 text-sm text-gray-500">{subtext}</div>
      </div>
      <div className="mt-6">
        <Link to={linkTo} className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
          {linkText}
        </Link>
      </div>
    </div>
  );
}

function AttentionItem({ title, description, count, linkTo }) {
  if (count === 0) return null;
  return (
    <div className="p-6 flex items-start justify-between hover:bg-gray-50 transition-colors">
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col items-end gap-2 ml-4">
        <span className="text-xl font-bold text-gray-900">{count}</span>
        <Link to={linkTo} className="text-xs font-medium text-primary-600 hover:text-primary-700 uppercase tracking-wide">
          Open
        </Link>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
