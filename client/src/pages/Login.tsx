"use client";

import { useState } from "react";
import { useLocation } from "wouter";
import {
  loginEmployee,
  selectAuthError,
  selectAuthStatus,
} from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { UserRound, Lock, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loading = authStatus === "loading";
  const activeError = error || authError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!empId || !password) {
      setError("Please enter your Employee ID and password.");
      return;
    }

    try {
      await dispatch(
        loginEmployee({ empId: Number(empId), password })
      ).unwrap();
      setLocation("/");
    } catch {
      setError("Unable to sign in. Please try again.");
    }
  }

  return (
    <main className="min-h-screen flex bg-[#e8eef7]">
      {/* ---------------------------------------------------------------- */}
      {/* Left panel – Branding (Desktop only)                              */}
      {/* ---------------------------------------------------------------- */}
      <aside className="hidden md:flex w-1/2 bg-[#253A70] text-white items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-md space-y-6">
          <div className="bg-white p-3 rounded-lg shadow-md w-fit">
            <img
              src="https://www.planeteducationnetworks.uk/images/logo.png"
              alt="Planet Education Networks"
              className="h-10 w-auto"
            />
          </div>

          <h1 className="text-4xl font-semibold leading-tight">
            Welcome back to
            <br />
            <span className="text-blue-200">Employee Portal</span>
          </h1>

          <p className="text-sm text-blue-100/80">
            Access attendance, holidays and internal HR tools securely.
          </p>

          <div className="space-y-4 text-sm pt-4">
            <FeatureItem
              icon={<UserRound className="h-4 w-4" />}
              text="Employee self-service access"
            />
          </div>

          <p className="text-[11px] text-blue-200/70 pt-6">
            By signing in, you agree to company IT & data security policies.{" "}
            <br></br>© Planet Education Networks 2026<br></br> Phone : 0800 328
            9999<br></br> Email : enquiries@pengroup.com
          </p>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Right panel – Login                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="flex w-full md:w-1/2 flex-col items-center justify-center px-4 py-8 md:py-12">
        {/* ---------------- Mobile Header ---------------- */}
        <div className="md:hidden w-full max-w-md mb-6 text-center">
          <div className="flex justify-center mb-3">
            <img
              src="https://www.planeteducationnetworks.uk/images/logo.png"
              alt="Planet Education Networks"
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            Employee Portal
          </h1>
          <p className="text-xs text-slate-500">Secure employee access</p>
        </div>

        {/* ---------------- Login Card ---------------- */}
        <Card className="w-full max-w-md bg-white shadow-xl border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              Sign in to continue
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your Employee ID and password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {activeError && (
              <div className="rounded-md border border-red-400 bg-red-50 px-3 py-2 text-xs text-red-700">
                {activeError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Employee ID */}
              <div className="space-y-1">
                <Label className="text-xs">Employee ID</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    placeholder="e.g. 10234"
                    required
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                  Remember this device
                </label>

                <button type="button" className="text-primary hover:underline">
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Card footer */}
            <div className="pt-2 border-t border-border/70 flex justify-between text-[11px] text-muted-foreground">
              <span>Need help? Contact HR / IT</span>
              <span className="hidden sm:flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                System online
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ---------------- Mobile Footer ---------------- */}
        <div className="md:hidden w-full max-w-md mt-6 text-center space-y-1 text-[11px] text-muted-foreground">
          <p>By signing in, you agree to company IT & data security policies.</p>
          <p>© Planet Education Networks 2026</p>
          <p>Support: IT / HR Desk</p>
          <p>0800 328 9999 · enquiries@pengroup.com</p>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------- */
/* Feature Item                                                          */
/* -------------------------------------------------------------------- */
function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm text-blue-100">{text}</span>
    </div>
  );
}
