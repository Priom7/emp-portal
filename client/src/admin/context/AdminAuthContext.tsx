import { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { adminEndpoints } from "@/admin/api/adminEndpoints";
import { DEFAULT_ADMIN_API_KEY } from "@/admin/api/adminClient";

type AdminAuthState = {
  apiKey: string;
  email?: string;
  authenticated: boolean;
  loading: boolean;
};

type AdminAuthContextShape = AdminAuthState & {
  login: (input: { email: string; password: string; apiKey?: string }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "admin-auth";

const defaultState: AdminAuthState = {
  apiKey: DEFAULT_ADMIN_API_KEY,
  authenticated: false,
  loading: false
};

const AdminAuthContext = createContext<AdminAuthContextShape | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AdminAuthState;
        return { ...defaultState, ...parsed, loading: false };
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  const login = async ({ email, password, apiKey }: { email: string; password: string; apiKey?: string }) => {
    const key = apiKey || state.apiKey || DEFAULT_ADMIN_API_KEY;
    setState((prev) => ({ ...prev, loading: true }));

    try {
      await adminEndpoints.login({ email, password, remember: true });
      await adminEndpoints.authenticate(key);
      const next = { apiKey: key, email, authenticated: true, loading: false };
      setState(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, authenticated: false }));
      throw error;
    }
  };

  const logout = () => {
    setState({ ...defaultState });
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout
    }),
    [state]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
