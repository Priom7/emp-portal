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

import { UserRound, Lock, Loader2, Mail, ShieldCheck } from "lucide-react";
import { TfiMicrosoftAlt } from "react-icons/tfi";

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
    } catch (err) {
      if (typeof err === "string") setError(err);
      else setError("Unable to sign in. Please try again.");
    }
  }

  return (
    <main className="min-h-screen flex bg-[#e8eef7] md:bg-[#e8eef7]">
      {/* Left panel (dark branding) */}
      <aside
        className="hidden md:flex w-full md:w-1/2 bg-[#253A70] text-white 
        items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Background subtle pattern */}
        <div className="absolute inset-0 bg-[url('/login-pattern.svg')] opacity-10"></div>

        <div className="relative z-10 max-w-md space-y-6">
          {/* Logo + Portal Text */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shadow">
              <img src="/favicon.png" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xl font-semibold">HR Portal</p>
              <p className="text-sm text-white/70 -mt-1">
                Empowering People. Driving Performance.
              </p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-heading font-semibold leading-tight">
            Welcome Back
            <br />
            <span className="text-blue-200">Employee Hub</span>
          </h1>

          <p className="text-sm text-blue-100/80 leading-relaxed">
            View holidays, payslips, attendance and HR updates in one secure
            place.
          </p>

          {/* Feature List */}
          <div className="grid grid-cols-1 gap-4 text-sm mt-6">
            <FeatureItem
              icon={<ShieldCheck className="h-4 w-4" />}
              text="Enterprise-grade security"
            />
            <FeatureItem
              icon={<Mail className="h-4 w-4" />}
              text="Microsoft 365 integration"
            />
            <FeatureItem
              icon={<UserRound className="h-4 w-4" />}
              text="Employee self-service"
            />
          </div>

          <p className="text-[11px] text-blue-200/70 pt-6">
            By signing in you agree to IT & Data Security policies.
          </p>
        </div>
      </aside>

      {/* Right panel (login card) */}
      <section className="flex w-full md:w-1/2 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-white shadow-xl border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              Sign in to continue
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your Employee ID or use Microsoft sign-in.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Microsoft Login */}
            <Button
              variant="outline"
              className="w-full h-11 flex items-center justify-center gap-2 border-[#2563eb] text-[#2563eb] hover:bg-blue-50"
              onClick={() => console.log("Microsoft OAuth")}
            >
              <TfiMicrosoftAlt className="h-4 w-4" />
              Single Sign On
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue
                </span>
              </div>
            </div>

            {activeError && (
              <div className="rounded-md border border-red-400 bg-red-50 px-3 py-2 text-xs text-red-700">
                {activeError}
              </div>
            )}

            {/* Form */}
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
                className="w-full h-11 text-sm font-semibold shadow-sm"
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
            {/* Small footer meta inside card */}
            <div className="pt-1 border-t border-border/70 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Need help? Contact HR or IT support.</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>System status: Online</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

/* -------------------------------------------------------- */
/* Feature item for left panel                              */
/* -------------------------------------------------------- */
function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
        {icon}
      </div>
      <span className="text-sm text-blue-100">{text}</span>
    </div>
  );
}
