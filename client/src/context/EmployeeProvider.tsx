// src/context/EmployeeProvider.tsx
import { useEffect, type ReactNode } from "react";
import { hydrateSession, logout, selectUser } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateSession());
  }, [dispatch]);

  return <>{children}</>;
}

export function useEmployee() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = "/login";
  };

  return { user, logout: handleLogout };
}
