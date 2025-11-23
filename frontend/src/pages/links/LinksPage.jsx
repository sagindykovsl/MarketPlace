import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function LinksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isConsumer = user?.role === "CONSUMER";
  const isSupplierStaff = user && ["OWNER", "MANAGER", "SALES"].includes(user.role);
  const isOwnerManager = user && ["OWNER", "MANAGER"].includes(user.role);

  const [myLinks, setMyLinks] = useState([]);
  const [pendingLinks, setPendingLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // consumer "request link" modal state
  const [requestOpen, setRequestOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (requestOpen && isConsumer) {
      loadSuppliers();
    }
  }, [requestOpen, isConsumer]);

  async function loadSuppliers() {
    setLoadingSuppliers(true);
    try {
      const res = await api.get("/api/suppliers");
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoadingSuppliers(false);
    }
  }

  async function loadAll() {
    setLoading(true);
    try {
      // Always load "my links"
      const myRes = await api.get("/api/links/me");
      setMyLinks(Array.isArray(myRes.data) ? myRes.data : []);

      // For OWNER/MANAGER also load pending
      if (isOwnerManager) {
        try {
          const pendingRes = await api.get("/api/links/pending");
          setPendingLinks(Array.isArray(pendingRes.data) ? pendingRes.data : []);
        } catch (err) {
          console.warn(
            "Cannot load pending links:",
            err.response?.status,
            err.response?.data || err
          );
        }
      } else {
        setPendingLinks([]);
      }
    } catch (err) {
      console.error("Failed to load links:", err.response?.status, err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }

  // ---------- Consumer: request link ----------
  async function handleRequestLink(e) {
    e.preventDefault();
    if (!supplierId.trim()) return;

    setRequestLoading(true);
    try {
      // Swagger: POST /api/links with { "supplier_id": 0 }
      const payload = { supplier_id: Number(supplierId) };
      const res = await api.post("/api/links", payload);
      console.log("Link request created:", res.data);
      alert("Link request sent.");
      setSupplierId("");
      setRequestOpen(false);
      await loadAll();
    } catch (err) {
      console.error("Request link failed:", err.response?.status, err.response?.data || err);
      alert(err.response?.data?.detail || "Failed to request link. Check console for details.");
    } finally {
      setRequestLoading(false);
    }
  }

  // ---------- Supplier OWNER / MANAGER: approve / reject ----------
  async function handleDecision(linkId, approve) {
    const actionText = approve ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${actionText} this link request?`)) return;

    try {
      // Swagger: POST /api/links/{link_id}/approve  (and /reject)
      const url = `/api/links/${linkId}/${approve ? "approve" : "reject"}`;
      await api.post(url);
      await loadAll();
    } catch (err) {
      console.error(
        `${actionText} link failed:`,
        err.response?.status,
        err.response?.data || err
      );
      alert(`Failed to ${actionText} link. Check console for details.`);
    }
  }

  async function handleUnlink(linkId) {
    if (!window.confirm("Are you sure you want to unlink? This will remove the connection.")) return;
    try {
      await api.delete(`/api/links/${linkId}`);
      await loadAll();
    } catch (err) {
      console.error("Unlink failed:", err.response?.status, err.response?.data || err);
      alert("Failed to unlink. Check console for details.");
    }
  }

  const formatDate = (ts) =>
    ts ? new Date(ts).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary-900">Links</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consumers link to suppliers; links unlock orders and chat.
          </p>
        </div>

        {isConsumer && (
          <button
            onClick={() => setRequestOpen(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition-all active:scale-95"
          >
            Request link
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 animate-pulse">Loading links...</div>
      ) : (
        <>
          {/* My links (for everyone) */}
          <section className="space-y-4">
            <h2 className="font-heading font-semibold text-lg text-primary-800">My links</h2>
            {myLinks.length === 0 ? (
              <div className="text-center py-8 bg-surface rounded-2xl shadow-soft border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">
                  You don&apos;t have any links yet.
                  {isConsumer &&
                    " Use the Request link button above once you know the supplier ID."}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden bg-surface rounded-2xl shadow-soft border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">ID</th>
                      {isConsumer ? (
                        <th className="px-6 py-4 text-left font-semibold text-gray-600">Supplier</th>
                      ) : (
                        <th className="px-6 py-4 text-left font-semibold text-gray-600">Consumer</th>
                      )}
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Created at</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myLinks.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{l.id}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {isConsumer
                            ? l.supplier?.company_name || `Supplier #${l.supplier_id}`
                            : l.consumer?.restaurant_name ||
                            l.consumer?.full_name ||
                            `Consumer #${l.consumer_id}`}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${l.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : l.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(l.created_at)}</td>
                        <td className="px-6 py-4 space-x-2">
                          {l.status === "APPROVED" && (
                            <>
                              <button
                                onClick={() => navigate(`/chat?linkId=${l.id}`)}
                                className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 border border-primary-200 transition-colors"
                              >
                                Open chat
                              </button>
                              <button
                                onClick={() => handleUnlink(l.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 border border-red-200 transition-colors"
                              >
                                Unlink
                              </button>
                            </>
                          )}
                          {l.status === "DECLINED" && isOwnerManager && (
                            <>
                              <button
                                onClick={() => handleDecision(l.id, true)}
                                className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 border border-green-200 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUnlink(l.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 border border-red-200 transition-colors"
                              >
                                Unlink
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Pending list for OWNER/MANAGER */}
          {isOwnerManager && (
            <section className="space-y-4">
              <h2 className="font-heading font-semibold text-lg text-primary-800">Pending requests to my supplier</h2>
              {pendingLinks.length === 0 ? (
                <div className="text-center py-8 bg-surface rounded-2xl shadow-soft border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm">No pending link requests.</p>
                </div>
              ) : (
                <div className="overflow-hidden bg-surface rounded-2xl shadow-soft border border-gray-100">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-gray-600">ID</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-600">Consumer</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-600">Created at</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pendingLinks.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{l.id}</td>
                          <td className="px-6 py-4 text-gray-700">
                            {l.consumer?.restaurant_name ||
                              l.consumer?.full_name ||
                              `Consumer #${l.consumer_id}`}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {l.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(l.created_at)}</td>
                          <td className="px-6 py-4 space-x-2">
                            <button
                              onClick={() => handleDecision(l.id, true)}
                              className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 border border-green-200 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecision(l.id, false)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 border border-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {!isConsumer && !isSupplierStaff && (
            <p className="text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
              Your role doesn&apos;t support link management in this MVP.
            </p>
          )}
        </>
      )}

      {/* Consumer: Request link modal */}
      {isConsumer && requestOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl p-8 shadow-2xl w-full max-w-md space-y-6 border border-white/50">
            <h2 className="text-xl font-heading font-bold text-primary-900">Request link to supplier</h2>
            <p className="text-sm text-gray-500">
              Select a supplier from the list below to request a connection.
              Once approved, you&apos;ll be able to place orders and chat.
            </p>

            <form onSubmit={handleRequestLink} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Supplier</label>
                {loadingSuppliers ? (
                  <div className="text-sm text-gray-500 animate-pulse mt-1">Loading suppliers...</div>
                ) : (
                  <select
                    className="w-full border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setSupplierId("");
                    setRequestOpen(false);
                  }}
                  disabled={requestLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-600/20 transition-all"
                  disabled={requestLoading || !supplierId}
                >
                  {requestLoading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
