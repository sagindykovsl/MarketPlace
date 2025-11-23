import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RegisterSupplierPage() {
    const { registerSupplier } = useAuth();
    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await registerSupplier({
                company_name: companyName,
                owner_full_name: ownerName,
                owner_email: ownerEmail,
                password,
            });
            // After registration we are logged in
            navigate("/dashboard");
        } catch (e) {
            console.error("Register supplier failed", e);
            setError(
                e?.response?.data?.detail ||
                "Failed to register supplier. Please check your data."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md bg-surface rounded-2xl shadow-soft p-8 space-y-8 border border-white/50">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-heading font-bold text-primary-800">Register Supplier</h1>
                    <p className="text-gray-500">Create your supplier account</p>
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 ml-1">Company name</label>
                        <input
                            className="w-full border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 ml-1">Owner full name</label>
                        <input
                            className="w-full border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 ml-1">Owner email</label>
                        <input
                            type="email"
                            className="w-full border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                            value={ownerEmail}
                            onChange={(e) => setOwnerEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 ml-1">Password</label>
                        <input
                            type="password"
                            className="w-full border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 active:scale-[0.98]"
                    >
                        {loading ? "Registering..." : "Register as Supplier"}
                    </button>
                </form>

                <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium hover:underline">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
