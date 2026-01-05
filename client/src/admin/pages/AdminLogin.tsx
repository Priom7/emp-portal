import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/admin/context/AdminAuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_ADMIN_API_KEY, ADMIN_API_BASE } from "@/admin/api/adminClient";
import { ShieldCheck, Mail, Lock } from "lucide-react";

export function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { login, loading } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState(DEFAULT_ADMIN_API_KEY);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    try {
      await login({ email, password, apiKey });
      setLocation("/dashboard");
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Login failed. Check credentials or API key.";
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-lg bg-white/95 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-600 text-white">
              <ShieldCheck />
            </div>
            <div>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>Authenticates against local-hr-admin/admin/login.php</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Admin email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">API key (for /api-response)</label>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              <p className="text-[11px] text-slate-500">Backend: {ADMIN_API_BASE}</p>
            </div>
            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? "Authenticating..." : "Enter admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
