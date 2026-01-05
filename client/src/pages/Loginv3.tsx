// src/pages/Login.tsx
"use client";

import { useState } from "react";
import { useLocation } from "wouter";
import { loginEmployee, selectAuthError, selectAuthStatus } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  ShieldCheck,
  UserRound,
  Lock,
  Loader2,
  Building2,
  Globe2,
} from "lucide-react";

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
      await dispatch(loginEmployee({ empId: Number(empId), password })).unwrap();
      setLocation("/");
    } catch (err) {
      if (typeof err === "string") {
        setError(err);
      } else {
        setError("Unable to sign in. Please check your details and try again.");
      }
    }
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-[pulse_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-[pulse_11s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.09] bg-[radial-gradient(circle_at_top,_#0f172a_0,_transparent_55%),radial-gradient(circle_at_bottom,_#1d4ed8_0,_transparent_55%)]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Left panel: branding / hero */}
          <section className="hidden lg:flex flex-col justify-between h-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
                <img
                  src="/favicon.png"
                  alt="HR Portal"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  <span>HR Employee Portal</span>
                  <Badge variant="outline" className="text-[11px]">
                    Secure Access
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  Powered by your internal HR & People Operations team.
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl xl:text-4xl font-heading font-semibold tracking-tight">
                  Welcome back to your{" "}
                  <span className="text-primary">Employee Hub</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">
                  View your holiday balance, payslips, attendance and HR updates
                  in one secure, central place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <FeatureChip
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  title="Single sign-on"
                  desc="Secure access with role-based permissions."
                />
                <FeatureChip
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  title="Organisation-wide"
                  desc="All teams, departments and locations."
                />
                <FeatureChip
                  icon={<Globe2 className="h-3.5 w-3.5" />}
                  title="24/7 access"
                  desc="From office, home or on the move."
                />
                <FeatureChip
                  icon={<UserRound className="h-3.5 w-3.5" />}
                  title="Employee self-service"
                  desc="Update details, request leave and more."
                />
              </div>
            </div>

            <p className="mt-10 text-[11px] text-muted-foreground">
              By signing in you agree to the company&apos;s IT & Data Security policies.
            </p>
          </section>

          {/* Right panel: login card */}
          <section className="flex justify-center">
            <Card className="w-full max-w-md border border-border/70 shadow-[0_18px_45px_rgba(15,23,42,0.12)] bg-card/95 backdrop-blur-sm animate-[fade-in_0.45s_ease-out]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Sign in to continue</span>
                  <span className="text-[11px] font-normal text-muted-foreground px-2 py-0.5 rounded-full border border-border/80 bg-muted/60">
                    Employee Portal
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter your Employee ID and password to access your account.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {activeError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive animate-[fade-in_0.25s_ease-out]">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                    <p>{activeError}</p>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {/* Employee ID */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Employee ID</Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/70">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={empId}
                        onChange={(e) => setEmpId(e.target.value)}
                        placeholder="e.g. 10234"
                        className="pl-9 pr-3 h-10 text-sm border-input focus-visible:ring-1 focus-visible:ring-ring/80"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Password</Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/70">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your secure password"
                        className="pl-9 pr-3 h-10 text-sm border-input focus-visible:ring-1 focus-visible:ring-ring/80"
                        required
                      />
                    </div>
                  </div>

                  {/* Remember + help */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRemember((prev) => !prev)}
                      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span
                        className={`h-3.5 w-3.5 rounded-[4px] border flex items-center justify-center transition
                          ${remember ? "border-primary bg-primary" : "border-border bg-background"}
                        `}
                      >
                        {remember && (
                          <span className="h-2 w-2 rounded-[3px] bg-primary-foreground" />
                        )}
                      </span>
                      <span>Remember this device</span>
                    </button>

                    <button
                      type="button"
                      className="text-primary text-[11px] font-medium hover:underline underline-offset-4"
                      onClick={() => console.log("Forgot password clicked")}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.99]"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing you in...
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
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Small feature chip for the left hero panel                          */
/* ------------------------------------------------------------------ */

function FeatureChip({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm backdrop-blur-sm">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold leading-tight">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {desc}
        </p>
      </div>
    </div>
  );
}
