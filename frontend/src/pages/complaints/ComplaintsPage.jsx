import React, { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ComplaintsPage() {
    const { user } = useAuth();
    const isConsumer = user?.role === "CONSUMER";
    const isSupplierStaff = user && ["OWNER", "MANAGER", "SALES"].includes(user.role);

    const [statusFilter, setStatusFilter] = useState("OPEN"); // OPEN / RESOLVED / ALL
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reloadFlag, setReloadFlag] = useState(0); // to force reload after updates
    const [createOpen, setCreateOpen] = useState(false);

    // Load complaints whenever filter or reloadFlag changes
    useEffect(() => {
        const loadComplaints = async () => {
            setLoading(true);
            try {
                const params = {};
                if (statusFilter !== "ALL") params.status = statusFilter;

                const res = await api.get("/api/complaints", { params });
                const list = Array.isArray(res.data) ? res.data : [];
                setComplaints(list);
            } catch (err) {
                console.error("Failed to load complaints:", err.response?.status, err.response?.data || err);
            } finally {
                setLoading(false);
            }
        };

        loadComplaints();
    }, [statusFilter, reloadFlag]);

    const triggerReload = () => setReloadFlag((x) => x + 1);

    // Supplier staff actions
    const assignToMe = async (complaint) => {
        if (!user?.id) return;
        try {
            await api.put(`/api/complaints/${complaint.id}`, {
                status: complaint.status, // keep current status
                assigned_to_user_id: user.id,
            });
            triggerReload();
        } catch (err) {
            console.error("Assign failed:", err.response?.status, err.response?.data || err);
            alert("Failed to assign complaint. Check console for details.");
        }
    };

    const markResolved = async (complaint) => {
        if (!user?.id) return;
        try {
            const payload = { status: "RESOLVED" };
            // Only include assigned_to_user_id if not a consumer
            if (!isConsumer) {
                payload.assigned_to_user_id = complaint.assigned_to_user_id || user.id;
            }

            await api.put(`/api/complaints/${complaint.id}`, payload);
            triggerReload();
        } catch (err) {
            console.error("Resolve failed:", err.response?.status, err.response?.data || err);
            alert("Failed to update complaint. Check console for details.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center gap-4">
                <h1 className="text-2xl font-heading font-bold text-primary-900">Complaints</h1>

                <div className="flex items-center gap-3">
                    <select
                        className="border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-surface shadow-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="OPEN">Open</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="ALL">All</option>
                    </select>

                    {isConsumer && (
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition-all active:scale-95"
                        >
                            + Create Complaint
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-lg text-gray-500 animate-pulse">Loading complaints...</div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl shadow-soft border border-dashed border-gray-300">
                    <p className="text-gray-500">No complaints found.</p>
                </div>
            ) : (
                <div className="overflow-hidden bg-surface rounded-2xl shadow-soft border border-gray-100">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">ID</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Order</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                                {isSupplierStaff && (
                                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Raised by</th>
                                )}
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Assigned to</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Description</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Created</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Resolved</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {complaints.map((c) => {
                                const created = c.created_at
                                    ? new Date(c.created_at).toLocaleString()
                                    : "-";
                                const resolved = c.resolved_at
                                    ? new Date(c.resolved_at).toLocaleString()
                                    : "-";
                                const assignedName =
                                    c.assigned_to_user?.full_name ||
                                    (c.assigned_to_user_id ? `User #${c.assigned_to_user_id}` : "Unassigned");
                                const raisedByName =
                                    c.raised_by_user?.full_name ||
                                    (c.raised_by_user_id ? `User #${c.raised_by_user_id}` : "-");

                                return (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">#{c.id}</td>
                                        <td className="px-6 py-4 text-gray-700">Order #{c.order_id}</td>
                                        <td className="px-6 py-4">
                                            {c.status === "RESOLVED" ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Resolved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Open
                                                </span>
                                            )}
                                        </td>
                                        {isSupplierStaff && (
                                            <td className="px-6 py-4 text-gray-700">{raisedByName}</td>
                                        )}
                                        <td className="px-6 py-4 text-gray-700">{assignedName}</td>
                                        <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={c.description}>
                                            {c.description}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{created}</td>
                                        <td className="px-6 py-4 text-gray-500">{resolved}</td>

                                        <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                            {isSupplierStaff && !c.assigned_to_user_id && c.status !== "RESOLVED" && (
                                                <button
                                                    onClick={() => assignToMe(c)}
                                                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                                >
                                                    Assign to me
                                                </button>
                                            )}
                                            {c.status !== "RESOLVED" && (
                                                <button
                                                    onClick={() => markResolved(c)}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                                >
                                                    Mark resolved
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {createOpen && isConsumer && (
                <CreateComplaintModal
                    onClose={() => setCreateOpen(false)}
                    onCreated={() => {
                        setCreateOpen(false);
                        triggerReload();
                    }}
                />
            )}
        </div>
    );
}

// Modal for consumers to create a complaint for an order
function CreateComplaintModal({ onClose, onCreated }) {
    const [orderId, setOrderId] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get("/api/orders");
                if (Array.isArray(res.data)) {
                    // Filter out orders that already have complaints? 
                    // For now, let's show all, or maybe only those without complaints if the backend restricts it.
                    // Assuming we want to let them choose from any order.
                    // Sorting by date descending is usually better.
                    const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setOrders(sorted);
                }
            } catch (err) {
                console.error("Failed to load orders", err);
            } finally {
                setLoadingOrders(false);
            }
        };
        fetchOrders();
    }, []);

    const canSave = orderId && description.trim().length > 0;

    const submit = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            await api.post(`/api/orders/${orderId}/complaint`, {
                description: description.trim(),
            });
            onCreated();
        } catch (err) {
            console.error(
                "Create complaint failed:",
                err.response?.status,
                err.response?.data || err
            );
            alert("Failed to create complaint. Check console for details.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-2xl p-8 shadow-2xl w-full max-w-md space-y-6 border border-white/50">
                <h2 className="text-xl font-heading font-bold text-primary-900">Create Complaint</h2>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Order</label>
                        {loadingOrders ? (
                            <div className="text-sm text-gray-500 animate-pulse">Loading orders...</div>
                        ) : (
                            <select
                                className="w-full border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                            >
                                <option value="">Select an order</option>
                                {orders.map((order) => (
                                    <option key={order.id} value={order.id}>
                                        #{order.id} • {new Date(order.created_at).toLocaleDateString()} • {order.supplier?.company_name || "Unknown Supplier"} • {Number(order.total_amount).toLocaleString()} ₸
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            className="w-full border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue with this order"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-600/20 transition-all"
                        onClick={submit}
                        disabled={saving || !canSave}
                    >
                        {saving ? "Submitting..." : "Submit Complaint"}
                    </button>
                </div>
            </div>
        </div>
    );
}
