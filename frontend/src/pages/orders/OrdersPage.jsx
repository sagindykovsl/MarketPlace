// frontend/src/pages/orders/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- simple create-order form state (CONSUMER only) ---
    const [supplierId, setSupplierId] = useState("");
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [creating, setCreating] = useState(false);

    const isConsumer = user && user.role === "CONSUMER";

    async function loadOrders() {
        setLoading(true);
        try {
            const res = await api.get("/api/orders", {
                // if you want only PENDING, uncomment:
                // params: { status: "PENDING" },
            });
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to load orders:", err.response?.data || err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOrders();
    }, []);

    // ---------- CREATE ORDER (POST /api/orders) ----------
    async function createOrder(e) {
        e.preventDefault();
        if (!isConsumer) {
            alert("Only CONSUMER users can create orders.");
            return;
        }

        const sId = Number(supplierId);
        const pId = Number(productId);
        const qty = Number(quantity);

        if (!sId || !pId || qty <= 0) {
            alert("Please provide valid supplier id, product id and quantity.");
            return;
        }

        const payload = {
            supplier_id: sId,
            items: [
                {
                    product_id: pId,
                    quantity: qty,
                },
            ],
        };

        try {
            setCreating(true);
            console.log("Creating order with payload:", payload);
            const res = await api.post("/api/orders", payload);
            console.log("Create order response:", res.status, res.data);
            alert(`Order #${res.data.id} created with status ${res.data.status}`);

            // clear form
            setProductId("");
            setQuantity(1);

            // refresh list
            await loadOrders();
        } catch (err) {
            console.error("Create order failed:", err.response?.data || err);
            alert("Failed to create order. Check console for details.");
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-heading font-bold text-primary-900">Orders</h1>

            {/* CONSUMER: simple create-order form */}
            {isConsumer && (
                <div className="bg-surface p-6 rounded-2xl shadow-soft border border-white/50 space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-heading font-semibold text-primary-800">Create test order</h2>
                        <p className="text-xs text-gray-500">
                            For now this is a minimal form: you enter supplier ID, one product ID
                            and quantity. Backend will validate that IDs exist and min_order_quantity.
                        </p>
                    </div>

                    <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={createOrder}>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Supplier ID</label>
                            <input
                                type="number"
                                className="w-full border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                placeholder="e.g. 1"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Product ID</label>
                            <input
                                type="number"
                                className="w-full border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                placeholder="e.g. 3"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="number"
                                className="w-full border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="10"
                                min={1}
                            />
                        </div>

                        <div className="md:col-span-3 flex justify-end mt-2">
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition-all active:scale-95"
                            >
                                {creating ? "Creating..." : "Create Order"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Orders list */}
            {loading ? (
                <div className="text-lg text-gray-500 animate-pulse">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl shadow-soft border border-dashed border-gray-300">
                    <p className="text-gray-500">No orders yet.</p>
                </div>
            ) : (
                <div className="overflow-hidden bg-surface rounded-2xl shadow-soft border border-gray-100">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">ID</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Supplier</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Created at</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((o) => (
                                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{o.id}</td>
                                    <td className="px-6 py-4 text-gray-700">{o.supplier_id}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {o.created_at
                                            ? new Date(o.created_at).toLocaleString()
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
