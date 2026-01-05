// src/pages/Home.tsx
"use client";

import { Layout } from "@/components/Layout";
import { useEmployee } from "@/context/EmployeeProvider";
import { useEffect } from "react";
import { motion } from "framer-motion";

import {
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  AlertCircle,
  Briefcase,
  FileText,
  User,
  Coffee,
  Users,
  BarChart3,
  Activity,
  Bug,
  Package,
  KeyRound,
  CalendarClock,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  announcements,
  holidayStats as mockHolidayStats,
  upcomingHolidays,
  assetInventory,
  licenseInventory,
  assetRequests,
} from "@/lib/mockData";

import {
  fetchHolidayStats,
  selectHolidayStats,
  selectHolidayStatus,
} from "@/features/holidays/holidaySlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// --------------------------------------------------------
// Animation Config
// --------------------------------------------------------
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// --------------------------------------------------------
// MAIN PAGE
// --------------------------------------------------------
export default function Home() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const holidayStats = useAppSelector(selectHolidayStats);
  const holidayStatus = useAppSelector(selectHolidayStatus);

  useEffect(() => {
    if (user && holidayStatus === "idle") dispatch(fetchHolidayStats());
  }, [dispatch, user, holidayStatus]);

  const holiday = holidayStats || mockHolidayStats;
  const firstName = user?.employee_name?.split(" ")[0] ?? "Welcome";
  const employmentStatus = user?.hr_employment_status === 1 ? "Active" : "Inactive";
  const assets = assetInventory;
  const licenses = licenseInventory;
  const requests = assetRequests;

  return (
    <Layout>
      <div className="space-y-8">
        {/* -------------------- TOP SECTION -------------------- */}
        <TopGreeting firstName={firstName} />

        {/* -------------------- ACTION REQUIRED -------------------- */}
        <ActionBanner />

        {/* -------------------- MAIN GRID -------------------- */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* LEFT = Main area */}
          <div className="md:col-span-2 space-y-6">
            <QuickStats user={user} holiday={holiday} />
            <QuickActions />
            <AssetSpotlight assets={assets} licenses={licenses} requests={requests} />
            <Announcements />
            <MiniReports />
          </div>

          {/* RIGHT = Sidebar */}
          <div className="space-y-6">
            <HolidayBalance holiday={holiday} />
            <UpcomingHolidayList />
            <UsefulLinks />
            <DevModePanel user={user} holiday={holiday} />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

// ========================================================
// COMPONENTS
// ========================================================

// --------------------------------------------------------
// Greeting section
// --------------------------------------------------------
function TopGreeting({ firstName }: { firstName: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Good day, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here’s what’s happening today.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Clock className="mr-2 h-4 w-4" /> Clock In
        </Button>
        <Button variant="outline">Request Time Off</Button>
      </div>
    </div>
  );
}

// --------------------------------------------------------
// Banner
// --------------------------------------------------------
function ActionBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-4"
    >
      <div className="bg-accent/20 p-2 rounded-lg text-accent-foreground">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-accent-foreground">Action Required</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Keep an eye on your upcoming holidays and requests.
        </p>
      </div>
      <Button size="sm" variant="secondary">
        Review
      </Button>
    </motion.div>
  );
}

// --------------------------------------------------------
// Quick Stats
// --------------------------------------------------------
function QuickStats({ user, holiday }: any) {
  const stats = [
    {
      icon: Clock,
      label: "Status",
      value: user.hr_employment_status === 1 ? "Active" : "Inactive",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: MapPin,
      label: "Sub Org",
      value: user.sub_organisation || "Not set",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Briefcase,
      label: "User ID",
      value: user.user_id,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: Calendar,
      label: "Holiday Left",
      value: holiday?.remaining ?? "N/A",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div variants={item} key={i}>
          <Card className="hover:shadow-md transition-shadow border-none shadow-sm bg-white h-full">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </p>
                <p className="font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// --------------------------------------------------------
// Quick Actions Shelf
// --------------------------------------------------------
function QuickActions() {
  const items = [
    { icon: User, label: "Profile", href: "/employment" },
    { icon: FileText, label: "Documents", href: "/documents" },
    { icon: Coffee, label: "Holidays", href: "/holidays" },
    { icon: Users, label: "My Team", href: "/team" },
    { icon: Package, label: "Assets", href: "/assets" },
  ];

  return (
    <motion.div variants={item}>
      <h2 className="text-lg font-heading font-semibold mb-4">Quick Access</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((a, i) => (
          <Button
            key={i}
            variant="outline"
            className="h-24 flex flex-col gap-2 hover:bg-primary/5 transition-all"
            asChild
          >
            <a href={a.href}>
              <a.icon className="h-6 w-6 text-muted-foreground" />
              <span>{a.label}</span>
            </a>
          </Button>
        ))}
      </div>
    </motion.div>
  );
}

// --------------------------------------------------------
// Assets & Licenses snapshot
// --------------------------------------------------------
function AssetSpotlight({ assets, licenses, requests }: any) {
  const assigned = assets.filter((a: any) => a.status.toLowerCase() === "in use").length;
  const expiring = licenses.filter((l: any) => daysUntil(l.renewal) <= 60).length;
  const openRequests = requests.filter((r: any) => r.status.toLowerCase() !== "approved").length;
  const nextRenewal = [...licenses].sort((a, b) => toDateSafe(a.renewal) - toDateSafe(b.renewal))[0];

  const tiles = [
    {
      icon: Package,
      label: "Assigned assets",
      value: `${assigned}/${assets.length}`,
      hint: "Managed by Tiger Asset Management",
      color: "text-blue-600",
    },
    {
      icon: KeyRound,
      label: "Active licenses",
      value: licenses.length,
      hint: `${expiring} renewals due soon`,
      color: "text-emerald-600",
    },
    {
      icon: CalendarClock,
      label: "Requests in flight",
      value: openRequests,
      hint: requests[0]?.item || "Raise a hardware or license request",
      color: "text-purple-600",
    },
  ];

  return (
    <motion.div variants={item}>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-semibold">Assets & Licenses</h2>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="/assets">
              Manage <ChevronRight className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {tiles.map((tile, i) => (
            <Card key={i} className="p-3 border-dashed">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg bg-muted/50 ${tile.color}`}>
                  <tile.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{tile.label}</p>
                  <p className="font-semibold text-lg leading-tight">{tile.value}</p>
                  <p className="text-[11px] text-muted-foreground">{tile.hint}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {nextRenewal && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Next license renewal: {nextRenewal.product} on {nextRenewal.renewal} ({daysUntil(nextRenewal.renewal)} days)
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// --------------------------------------------------------
// Announcements
// --------------------------------------------------------
function Announcements() {
  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader className="flex justify-between pb-2">
          <CardTitle className="text-lg font-heading">Announcements</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition border border-transparent hover:border-border"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                <span className="text-xs font-bold uppercase">
                  {new Date(a.date).toLocaleString("default", { month: "short" })}
                </span>
                <span className="text-lg font-bold leading-none">
                  {new Date(a.date).getDate()}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h4 className="font-medium">{a.title}</h4>
                  {a.priority === "high" && (
                    <Badge variant="destructive" className="text-[10px] px-1.5">
                      High
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {a.content}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --------------------------------------------------------
// Mini Reports (NEW)
// --------------------------------------------------------
function MiniReports() {
  const items = [
    {
      icon: BarChart3,
      title: "Attendance Pattern",
      value: "On Time · 92%",
      color: "text-green-600",
    },
    {
      icon: Activity,
      title: "System Health",
      value: "Stable",
      color: "text-blue-600",
    },
  ];

  return (
    <motion.div variants={item}>
      <h2 className="text-lg font-heading font-semibold mb-3">Reports</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((r, i) => (
          <Card key={i} className="p-4 flex gap-3 items-center border border-border/50">
            <div className="p-3 rounded-lg bg-muted/50">
              <r.icon className={`h-6 w-6 ${r.color}`} />
            </div>
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

function toDateSafe(dateLike: any): number {
  if (!dateLike) return 0;
  const ts = new Date(dateLike).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function daysUntil(dateLike: any): number {
  const ts = toDateSafe(dateLike);
  if (!ts) return 0;
  const diff = ts - Date.now();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// --------------------------------------------------------
// Holiday Balance Card
// --------------------------------------------------------
function HolidayBalance({ holiday }: any) {
  return (
    <motion.div variants={item}>
      <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-white/90">Holiday Balance</CardTitle>
          <CardDescription className="text-white/70">
            Current Period
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold">{holiday?.remaining ?? "-"}</span>
            <span className="text-white/70 mb-1">
              / {holiday?.entitlement ?? "-"} days
            </span>
          </div>

          <Progress
            value={
              holiday?.entitlement
                ? (holiday.taken / holiday.entitlement) * 100
                : 0
            }
            className="h-2 bg-black/20"
            indicatorClassName="bg-white"
          />

          <Button className="w-full mt-5 bg-white text-primary font-semibold">
            Book Holiday
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --------------------------------------------------------
// Upcoming Holidays
// --------------------------------------------------------
function UpcomingHolidayList() {
  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Holidays</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {upcomingHolidays.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <Badge variant="secondary" className="text-[10px]">
                  {h.type}
                </Badge>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="w-full mt-4 text-xs">
            View Calendar <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --------------------------------------------------------
// Useful Links
// --------------------------------------------------------
function UsefulLinks() {
  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Useful Links</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-2">
          <Button variant="outline" className="justify-start h-auto py-3 px-4 border-dashed">
            <div>
              <p className="font-semibold text-primary">Sage Payslips</p>
              <p className="text-xs text-muted-foreground">View your payslips</p>
            </div>
          </Button>

          <Button variant="outline" className="justify-start h-auto py-3 px-4 border-dashed">
            <div>
              <p className="font-semibold text-green-600">Bravo Benefits</p>
              <p className="text-xs text-muted-foreground">Perks & rewards</p>
            </div>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --------------------------------------------------------
// Developer Debug Panel (DEV MODE ONLY)
// --------------------------------------------------------
function DevModePanel({ user, holiday }: any) {
  if (!import.meta.env.DEV) return null;

  return (
    <motion.div variants={item}>
      <Card className="border-red-200 shadow-red-100">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-red-600">
            <Bug className="h-4 w-4" /> Developer Debug Panel
          </CardTitle>
          <Badge variant="destructive">DEV</Badge>
        </CardHeader>

        <CardContent className="space-y-3 text-xs">
          <div>
            <strong>User:</strong>
            <pre className="bg-red-50 p-2 text-[10px] mt-1 rounded">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Holiday Stats:</strong>
            <pre className="bg-red-50 p-2 text-[10px] mt-1 rounded">
              {JSON.stringify(holiday, null, 2)}
            </pre>
          </div>

          <Button
            variant="outline"
            className="w-full text-xs"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>

          <Button
            variant="ghost"
            className="w-full text-xs text-red-600"
            onClick={() => console.clear()}
          >
            Clear Console Logs
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
