import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { createElement } from "react";
import { post } from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  tenant_id?: string;
  role?: "super_admin" | "tenant_admin" | "seller";
  is_super_admin?: boolean;
  tenants?: Array<{ tenant_id: string; role: string; crm_tenants?: { id: string; name: string; slug: string } }>;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    const raw = localStorage.getItem("crm_user");
    if (token && raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        // invalid stored user
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await post<{ access_token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("crm_token", data.access_token);
    localStorage.setItem("crm_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    setUser(null);
  };

  return createElement(Ctx.Provider, { value: { user, loading, login, logout } }, children);
}

export const useAuth = () => useContext(Ctx);
