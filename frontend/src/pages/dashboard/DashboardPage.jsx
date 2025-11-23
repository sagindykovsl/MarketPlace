import React, { useEffect, useState } from "react";
import api from "../../api/client.js";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pendingLinks: 0,
    pendingOrders: 0,
    openComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // pending link requests (owner/manager only; if forbidden, we just log error)
        let pendingLinks = 0;
        let pendingOrders = 0;
        let openComplaints = 0;

        try {
          const linksRes = await api.get("/api/links/pending");
          pendingLinks = Array.isArray(linksRes.data) ? linksRes.data.length : 0;
        } catch (e) {
          console.warn("Cannot load pending links (maybe role is CONSUMER):", e?.response?.status);
        }

        try {
          const ordersRes = await api.get("/api/orders", {
            params: { status: "PENDING" },
          });
          pendingOrders = Array.isArray(ordersRes.data) ? ordersRes.data.length : 0;
        } catch (e) {
          console.warn("Cannot load orders:", e?.response?.status);
        }

        try {
          const complaintsRes = await api.get("/api/complaints");
          const list = Array.isArray(complaintsRes.data) ? complaintsRes.data : [];
          openComplaints = list.filter((c) => c.status === "OPEN").length;
        } catch (e) {
          console.warn("Cannot load complaints:", e?.response?.status);
        }

        setStats({
          pendingLinks,
          pendingOrders,
          openComplaints,
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="p-6 text-lg font-medium">Loading dashboard…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Pending link requests" value={stats.pendingLinks} color="text-blue-600" />
        <Card title="Pending orders" value={stats.pendingOrders} color="text-green-600" />
        <Card title="Open complaints" value={stats.openComplaints} color="text-red-600" />
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-white/50">
      <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">{title}</div>
      <div className={`mt-3 text-4xl font-heading font-bold ${color}`}>{value}</div>
    </div>
  );
}
