import React from "react";
import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded text-sm ${isActive ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-100"
  }`;

export default function Sidebar() {
  return (
    <aside className="w-64 bg-surface h-full p-4 space-y-2 text-gray-600 shadow-soft z-10">
      <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
      <NavLink to="/links" className={linkClass}>Links</NavLink>
      <NavLink to="/catalog" className={linkClass}>Catalog</NavLink>
      <NavLink to="/orders" className={linkClass}>Orders</NavLink>
      <NavLink to="/chat" className={linkClass}>Chat</NavLink>
      <NavLink to="/complaints" className={linkClass}>Complaints</NavLink>
    </aside>
  );
}
