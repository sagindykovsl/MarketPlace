import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-surface shadow-soft flex items-center justify-between px-6 z-20 relative">
      <span className="font-heading font-bold text-xl text-primary-800 tracking-tight">Supplier Console</span>
      <div className="flex items-center gap-4 text-sm">
        {user && <span className="text-gray-600 font-medium">{user.full_name} <span className="text-xs bg-secondary-100 text-secondary-800 px-2 py-0.5 rounded-full ml-1">{user.role}</span></span>}
        <button
          onClick={logout}
          className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium uppercase tracking-wider"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
