// src/pages/orders/OrderDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function OrderDetailPage() {
    const { id } = useParams();
    const orderId = id;
    const navigate = useNavigate();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const isOwnerManager = user && ["OWNER", "MANAGER"].includes(user.role);

    useEffect(() => {
        const loadOrder = async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const res = await api.get(`/api/orders/${orderId}`);
                setOrder(res.data);

                // If order has complaint, try to find it
                if (res.data.has_complaint) {
                    try {
                        // We have to fetch all complaints and filter because API doesn't support filtering by order_id yet
                        const compRes = await api.get("/api/complaints");
                        const list = Array.isArray(compRes.data) ? compRes.data : [];
                        const found = list.find((c) => c.order_id === Number(orderId));
                        setComplaint(found || null);
                    } catch (e) {
                        console.warn("Failed to load complaint details", e);
                    }
                }
            } catch (err) {
                console.error("Failed to load order", err.response?.data || err);
                setLoadError(
                    err.response?.status === 404
                        ? "Order not found."
                        : "Failed to load order. Check console for details."
                );
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [orderId]);

    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
        try {
            await api.put(`/api/orders/${orderId}`, { status: newStatus });
            // Reload
            const res = await api.get(`/api/orders/${orderId}`);
            setOrder(res.data);
        } catch (err) {
            console.error("Update status failed:", err.response?.data || err);
            alert("Failed to update status.");
        }
    };

    const handleResolveComplaint = async () => {
        if (!complaint) return;
        if (!window.confirm("Mark this complaint as resolved?")) return;
        try {
            await api.put(`/api/complaints/${complaint.id}`, { status: "RESOLVED" });
            // Reload complaint
            const compRes = await api.get("/api/complaints");
            const list = Array.isArray(compRes.data) ? compRes.data : [];
            const found = list.find((c) => c.order_id === Number(orderId));
            setComplaint(found || null);
        } catch (err) {
            console.error("Resolve complaint failed:", err.response?.data || err);
            alert("Failed to resolve complaint.");
        }
    };

    if (loading) {
        return <div className="p-6 text-lg">Loading order…</div>;
    }

    if (loadError) {
        return (
            <div className="p-6 space-y-4">
                <button
                    onClick={() => navigate(-1)}
                    className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
                >
                    ← Back
                </button>
                <div className="text-red-600">{loadError}</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
                >
                    ← Back
                </button>
                <div className="mt-4 text-gray-600">No data.</div>
            </div>
        );
    }

    const createdAt = order.created_at
        ? new Date(order.created_at).toLocaleString()
        : "—";
    const updatedAt = order.updated_at
        ? new Date(order.updated_at).toLocaleString()
        : "—";

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 font-medium">
                        Order #{order.id ?? orderId}
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-primary-900">Order Details</h1>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                >
                    ← Back
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard label="Status" value={order.status} />
                <SummaryCard label="Total Amount" value={`${order.total_amount ?? 0} ₸`} />
                <SummaryCard label="Created at" value={createdAt} />
                <SummaryCard label="Updated at" value={updatedAt} />
            </div>

            {/* Actions for OWNER/MANAGER */}
            {isOwnerManager && order.status === "PENDING" && (
                <div className="flex gap-3">
                    <button
                        onClick={() => handleStatusChange("ACCEPTED")}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm"
                    >
                        Accept Order
                    </button>
                    <button
                        onClick={() => handleStatusChange("REJECTED")}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm"
                    >
                        Reject Order
                    </button>
                </div>
            )}

            {/* Supplier / Consumer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface rounded-2xl shadow-soft p-6 space-y-2 border border-white/50">
                    <h2 className="font-heading font-semibold text-lg text-primary-800 mb-2">Supplier</h2>
                    <div className="text-sm space-y-2 text-gray-600">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Company:</span>
                            <span className="text-gray-900">{order.supplier?.company_name ??
                                (order.supplier_id != null
                                    ? `Supplier #${order.supplier_id}`
                                    : "—")}</span>
                        </div>
                        {order.supplier?.address && (
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Address:</span>
                                <span className="text-right">{order.supplier.address}</span>
                            </div>
                        )}
                        {order.supplier?.phone && (
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Phone:</span>
                                <span>{order.supplier.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-surface rounded-2xl shadow-soft p-6 space-y-2 border border-white/50">
                    <h2 className="font-heading font-semibold text-lg text-primary-800 mb-2">Consumer</h2>
                    <div className="text-sm space-y-2 text-gray-600">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Restaurant:</span>
                            <span className="text-gray-900">{order.consumer?.restaurant_name ?? "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Contact:</span>
                            <span>{order.consumer?.full_name ?? "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Email:</span>
                            <span>{order.consumer?.email ?? "—"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-surface rounded-2xl shadow-soft p-6 border border-white/50">
                <h2 className="font-heading font-semibold text-lg text-primary-800 mb-4">Items</h2>

                {!order.items || order.items.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">This order has no items.</p>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Quantity</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Price / unit</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {order.items.map((item, idx) => {
                                    const productName =
                                        item.product?.name ||
                                        item.product_name ||
                                        (item.product_id != null
                                            ? `Product #${item.product_id}`
                                            : "—");
                                    const qty = item.quantity ?? "—";
                                    const unitPrice =
                                        item.price_per_unit ??
                                        item.unit_price ??
                                        item.price ??
                                        "—";
                                    const total =
                                        item.total_amount ??
                                        (typeof unitPrice === "number" && typeof qty === "number"
                                            ? unitPrice * qty
                                            : "—");

                                    return (
                                        <tr key={item.id ?? idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{productName}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{qty}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{unitPrice} ₸</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">{total} ₸</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Complaint flag if backend provides it */}
            {typeof order.has_complaint === "boolean" && (
                <div className="bg-surface rounded-2xl shadow-soft p-6 border border-white/50 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Has complaint:</span>{" "}
                        {order.has_complaint ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                YES
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                NO
                            </span>
                        )}
                    </div>

                    {complaint && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                            <h3 className="text-sm font-bold text-red-800">Complaint Details</h3>
                            <div className="text-sm text-red-700">
                                <span className="font-medium">Status:</span> {complaint.status}
                            </div>
                            <div className="text-sm text-red-700">
                                <span className="font-medium">Description:</span> {complaint.description}
                            </div>
                            {isOwnerManager && complaint.status !== "RESOLVED" && (
                                <button
                                    onClick={handleResolveComplaint}
                                    className="mt-2 px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50"
                                >
                                    Mark Resolved
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="bg-surface rounded-2xl shadow-soft p-6 border border-white/50">
            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
                {label}
            </div>
            <div className="text-xl font-heading font-bold text-primary-900">{value ?? "—"}</div>
        </div>
    );
}
