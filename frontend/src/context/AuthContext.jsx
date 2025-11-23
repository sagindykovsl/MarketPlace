import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null); // { id, email, role, ... }
  const [loading, setLoading] = useState(true);

  // Load current user if we have a token
  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data);
      } catch (e) {
        console.error("Failed to load /me, clearing token", e);
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, [token]);

  const handleAuthSuccess = (accessToken) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
  };

  // --- API wrappers ---

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    handleAuthSuccess(res.data.access_token);
    // user will be loaded by effect above
  };

  const registerSupplier = async ({
    company_name,
    owner_full_name,
    owner_email,
    password,
  }) => {
    const res = await api.post("/api/auth/register/supplier", {
      company_name,
      owner_full_name,
      owner_email,
      password,
    });
    handleAuthSuccess(res.data.access_token);
  };

  const registerConsumer = async ({
    full_name,
    restaurant_name,
    email,
    password,
  }) => {
    const res = await api.post("/api/auth/register/consumer", {
      full_name,
      restaurant_name,
      email,
      password,
    });
    handleAuthSuccess(res.data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    registerSupplier,
    registerConsumer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
