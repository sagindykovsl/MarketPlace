// src/pages/catalog/CatalogPage.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CatalogPage() {
    const { user } = useAuth();
    const canEdit = user && ["OWNER", "MANAGER"].includes(user.role);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    async function loadProducts() {
        setLoading(true);
        try {
            const res = await api.get("/api/supplier/products");
            const raw = Array.isArray(res.data) ? res.data : [];
            const activeOnly = raw;
            setProducts(activeOnly);
        } catch (err) {
            console.error("Failed to load products", err);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        loadProducts();
    }, []);

    const openCreate = () => {
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEdit = (product) => {
        setEditingProduct(product);
        setModalOpen(true);
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Delete this product?")) return;

        try {
            console.log("Deleting product id:", id);
            const res = await api.delete(`/api/supplier/products/${id}`);

            console.log("Delete response:", res.status, res.data);

            // 204 is what FastAPI usually returns for DELETE
            if (res.status === 204 || res.status === 200) {
                await loadProducts();
            } else {
                alert(`Unexpected delete status: ${res.status}`);
            }
        } catch (err) {
            console.error(
                "Delete failed:",
                err.response?.status,
                err.response?.data || err
            );
            alert("Failed to delete product. Check console for details.");
        }
    };



    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Product Catalog</h1>

                {canEdit && (
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition-all active:scale-95"
                    >
                        + Add Product
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-lg text-gray-600 animate-pulse">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl shadow-soft border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No products found in your catalog.</p>
                    {canEdit && <p className="text-sm text-gray-400 mt-2">Click "Add Product" to get started.</p>}
                </div>
            ) : (
                <div className="overflow-hidden bg-surface rounded-2xl shadow-soft border border-gray-100">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Name</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Description</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Price</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Unit</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Stock</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-600">Min Order</th>
                                {canEdit && <th className="px-6 py-4 text-left font-semibold text-gray-600">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{p.description}</td>
                                    <td className="px-6 py-4 font-medium text-primary-700">{p.price} ₸</td>
                                    <td className="px-6 py-4 text-center">
                                        {p.is_active ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{p.unit}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.stock_quantity}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.min_order_quantity}</td>

                                    {canEdit && (
                                        <td className="px-6 py-4 space-x-2">
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-medium hover:bg-yellow-100 border border-yellow-200 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(p.id)}
                                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 border border-red-200 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalOpen && (
                <ProductModal
                    product={editingProduct}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => {
                        setModalOpen(false);
                        loadProducts();
                    }}
                />
            )}
        </div>
    );
}

function ProductModal({ product, onClose, onSaved }) {
    const isEdit = Boolean(product);

    const [name, setName] = useState(product?.name ?? "");
    const [description, setDescription] = useState(product?.description ?? "");
    const [price, setPrice] = useState(product?.price ?? "");
    const [unit, setUnit] = useState(product?.unit ?? "");
    const [stockQuantity, setStockQuantity] = useState(
        product?.stock_quantity ?? 0
    );
    const [minOrderQuantity, setMinOrderQuantity] = useState(
        product?.min_order_quantity ?? 1
    );
    const [isActive, setIsActive] = useState(
        product?.is_active ?? true
    );
    const [loading, setLoading] = useState(false);

    const saveProduct = async () => {
        setLoading(true);
        try {
            const payload = {
                name,
                description,
                unit,
                price: Number(price),
                stock_quantity: Number(stockQuantity),
                min_order_quantity: Number(minOrderQuantity),
                ...(isEdit ? { is_active: isActive } : {}),
            };

            if (isEdit) {
                await api.put(`/api/supplier/products/${product.id}`, payload);
            } else {
                await api.post("/api/supplier/products", payload);
            }

            onSaved();
        } catch (err) {
            console.error("Save product failed:", err.response?.status, err.response?.data);
            alert("Failed to save product. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-2xl p-8 shadow-2xl w-full max-w-md space-y-6 border border-white/50">
                <h2 className="text-xl font-heading font-bold text-primary-900">
                    {isEdit ? "Edit Product" : "Add Product"}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <input
                            className="w-full border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tomatoes"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            className="w-full border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Fresh red tomatoes"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Price (₸)</label>
                            <input
                                type="number"
                                className="w-full border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="1000"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Unit</label>
                            <input
                                className="w-full border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="kg, pcs, box…"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Stock quantity</label>
                            <input
                                type="number"
                                className="w-full border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                value={stockQuantity}
                                onChange={(e) => setStockQuantity(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Min order quantity</label>
                            <input
                                type="number"
                                className="w-full border-gray-200 rounded-xl px-4 py-2 mt-1 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                value={minOrderQuantity}
                                onChange={(e) => setMinOrderQuantity(e.target.value)}
                                placeholder="1"
                            />
                        </div>
                    </div>

                    {isEdit && (
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                id="isActive"
                                type="checkbox"
                                className="rounded text-primary-600 focus:ring-primary-500"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                Active
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-600/20 transition-all"
                        disabled={loading}
                        onClick={saveProduct}
                    >
                        {loading ? "Saving..." : "Save Product"}
                    </button>
                </div>
            </div>
        </div>
    );
}
