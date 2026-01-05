// src/pages/Login.tsx
"use client";

import { useState } from "react";
import { useLocation } from "wouter";
import { loginEmployee, selectAuthError, selectAuthStatus } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await dispatch(loginEmployee({ empId: Number(empId), password })).unwrap();
      setLocation("/");
    } catch (err) {
      if (typeof err === "string") {
        setError(err);
      } else {
        setError("Server or network error");
      }
    }
  }

  const loading = authStatus === "loading";
  const activeError = error || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white shadow-xl rounded-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Employee Login</h1>

        {activeError && (
          <div className="text-red-600 text-center text-sm mb-4">{activeError}</div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm">Employee ID</label>
            <input
              type="number"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-2 rounded"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
