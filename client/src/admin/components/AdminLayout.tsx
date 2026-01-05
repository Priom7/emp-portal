import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/admin/context/AdminAuthContext";
import { withAdminBase } from "@/lib/paths";
import { motion } from "framer-motion";
import { ShieldCheck, LayoutDashboard, ListChecks } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { email, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-100">
            <ShieldCheck />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">HR Admin</p>
            <h1 className="text-lg font-semibold">Control Centre</h1>
            <p className="text-xs text-slate-500">Backend: {withAdminBase("")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {email && (
            <div className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {email}
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </motion.header>

      <nav className="sticky top-0 z-10 flex flex-wrap gap-2 border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur">
        <NavPill icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active />
        <NavPill icon={<ListChecks className="h-4 w-4" />} label="Monitoring" />
        <NavPill icon={<ShieldCheck className="h-4 w-4" />} label="Access" />
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}

function NavPill({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
        active ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}
