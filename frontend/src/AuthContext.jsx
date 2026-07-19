import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("mg_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem("mg_token", data.access_token);
    localStorage.setItem("mg_user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(async (email, password, full_name) => {
    const data = await api.register({ email, password, full_name });
    localStorage.setItem("mg_token", data.access_token);
    localStorage.setItem("mg_user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mg_token");
    localStorage.removeItem("mg_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
