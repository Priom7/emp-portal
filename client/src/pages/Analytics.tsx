"use client";

import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

import {
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Activity,
  CalendarDays,
  Code,
} from "lucide-react";

import { motion } from "framer-motion";

import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTeam,
  fetchTeamCalendar,
  selectTeamCalendar,
  selectTeamMembers,
  selectTeamStatus,
  selectTeamError,
} from "@/features/team/teamSlice";

import {
  parseISO,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  subMonths,
  isWithinInterval,
  differenceInCalendarDays,
  format,
} from "date-fns";

/* ----------------------------- Component ------------------------------ */

export default function Analytics() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const [showDebug, setShowDebug] = useState(false);

  const calendarData = useAppSelector(selectTeamCalendar);
  const members = useAppSelector(selectTeamMembers);
  const status = useAppSelector(selectTeamStatus);
  const error = useAppSelector(selectTeamError);

  const holidays = calendarData?.holidays || [];
  const employees = calendarData?.employees || [];
  const attendances = calendarData?.attendances || [];
  const isManager = true;

  // Fetch real data
  useEffect(() => {
    if (!isManager || !user?.user_id) return;
    const payload: any = {
      portal_user: user.user_id,
      team_member: user.team_member,
    };
    dispatch(fetchTeam(payload));
    dispatch(fetchTeamCalendar(payload));
  }, [dispatch, isManager, user]);

  // --- Derived analytics data (last 6 months) ---
  const {
    attendanceTrendData,
    leaveTrendData,
    keyMetrics,
  } = useMemo(
    () => buildAnalytics(attendances, holidays, employees, members),
    [attendances, holidays, employees, members]
  );

  const handleExport = (type: "attendance" | "leave" | "raw") => {
    let rows: any[] = [];
    if (type === "attendance") {
      rows = attendanceTrendData;
    } else if (type === "leave") {
      rows = leaveTrendData;
    } else {
      rows = [
        { __section: "employees", data: employees },
        { __section: "members", data: members },
        { __section: "holidays", data: holidays },
        { __section: "attendances", data: attendances },
      ];
    }

    if (!rows.length) return;

    const csv = toCSV(rows);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `analytics-${type}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
              Analytics Dashboard
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {status || "live"}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Live insights on attendance, leave trends, and team coverage using
              real data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug((v) => !v)}
              className="flex items-center gap-1"
            >
              <Code className="h-4 w-4" />
              Debug Data
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("raw")}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export Raw
            </Button>
            <Button onClick={() => handleExport("attendance")}>
              View Full Report
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Key Metrics (live) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Attendance Coverage",
              value: `${keyMetrics.avgAttendance.toFixed(1)}%`,
              change:
                keyMetrics.attendanceDelta > 0
                  ? `+${keyMetrics.attendanceDelta.toFixed(1)}%`
                  : `${keyMetrics.attendanceDelta.toFixed(1)}%`,
              trend: keyMetrics.attendanceDelta >= 0 ? "up" : "down",
              icon: Users,
              helper: "Last 6 months",
            },
            {
              label: "Team Size (Employees)",
              value: String(keyMetrics.totalEmployees),
              change: "",
              trend: null,
              icon: Users,
              helper: "Active in calendar",
            },
            {
              label: "Avg. Monthly Leave",
              value: keyMetrics.avgMonthlyLeave.toFixed(1),
              change:
                keyMetrics.leaveDelta > 0
                  ? `+${keyMetrics.leaveDelta}`
                  : `${keyMetrics.leaveDelta}`,
              trend:
                keyMetrics.leaveDelta === 0
                  ? null
                  : keyMetrics.leaveDelta > 0
                  ? "up"
                  : "down",
              icon: CalendarDays,
              helper: "Requests / month",
            },
            {
              label: "Absence Load (Holidays)",
              value: `${keyMetrics.totalLeaveDays}`,
              change: "",
              trend: null,
              icon: Activity,
              helper: "Total days in data",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="relative overflow-hidden">
                <div className="absolute -right-6 -top-6 opacity-[0.05]">
                  <div className="h-16 w-16 rounded-full bg-primary" />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    {stat.trend && stat.change && (
                      <div
                        className={`flex items-center gap-1 text-xs font-medium ${
                          stat.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {stat.helper && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {stat.helper}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Trend (real data) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Attendance Coverage</CardTitle>
                  <CardDescription>
                    Estimated check-in coverage by month (last 6 months)
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport("attendance")}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData}>
                    <defs>
                      <linearGradient
                        id="colorAttendance"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                      formatter={(value: any, name: any) =>
                        name === "attendance"
                          ? [`${value.toFixed?.(1) || value}%`, "Coverage"]
                          : [value, name]
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorAttendance)"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Leave Analysis (real data) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>
                    Number of leave events starting in each month
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport("leave")}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={leaveTrendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar
                      dataKey="leaves"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                      name="Leave Requests"
                    />
                  </ReBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Debug Area */}
        {showDebug && (
          <Card className="border-t-4 border-primary mt-4">
            <CardHeader>
              <CardTitle>Developer Debug View</CardTitle>
              <CardDescription>
                Raw structures and derived metrics – useful while wiring new
                analytics.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs max-h-[500px] overflow-auto">
              <DebugBlock label="calendarData.employees" data={employees} />
              <DebugBlock label="team members (roster)" data={members} />
              <DebugBlock label="calendarData.holidays" data={holidays} />
              <DebugBlock label="calendarData.attendances" data={attendances} />
              <DebugBlock
                label="attendanceTrendData"
                data={attendanceTrendData}
              />
              <DebugBlock label="leaveTrendData" data={leaveTrendData} />
              <DebugBlock label="keyMetrics" data={keyMetrics} />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

/* ------------------------- Analytics Builder -------------------------- */

function buildAnalytics(
  attendances: any[],
  holidays: any[],
  employees: any[],
  members: any[]
) {
  const now = new Date();
  const start = startOfMonth(subMonths(now, 5)); // last 6 months
  const end = endOfMonth(now);
  const months = eachMonthOfInterval({ start, end });

  const employeeCount = employees.length || members.length || 1;

  const attendanceTrendData = months.map((m) => {
    const mStart = startOfMonth(m);
    const mEnd = endOfMonth(m);
    const daysInMonth =
      differenceInCalendarDays(mEnd, mStart) + 1 || 1;

    const attInMonth = attendances.filter((a: any) => {
      if (!a.scanned) return false;
      try {
        const d = parseISO(a.scanned);
        return isWithinInterval(d, { start: mStart, end: mEnd });
      } catch {
        return false;
      }
    });

    // Approx coverage: scans / (employees * days)
    const coverage = Math.max(
      0,
      Math.min(100, (attInMonth.length / (employeeCount * daysInMonth)) * 100)
    );

    return {
      month: format(m, "MMM"),
      attendance: Number.isFinite(coverage) ? coverage : 0,
      rawScans: attInMonth.length,
    };
  });

  const leaveTrendData = months.map((m) => {
    const mStart = startOfMonth(m);
    const mEnd = endOfMonth(m);

    const leavesInMonth = holidays.filter((h: any) => {
      if (!h.date_from) return false;
      try {
        const d = parseISO(h.date_from);
        return isWithinInterval(d, { start: mStart, end: mEnd });
      } catch {
        return false;
      }
    });

    return {
      month: format(m, "MMM"),
      leaves: leavesInMonth.length,
    };
  });

  const avgAttendance =
    attendanceTrendData.reduce((s, d) => s + d.attendance, 0) /
      (attendanceTrendData.length || 1) || 0;

  const attendanceDelta =
    attendanceTrendData.length >= 2
      ? attendanceTrendData[attendanceTrendData.length - 1].attendance -
        attendanceTrendData[0].attendance
      : 0;

  const avgMonthlyLeave =
    leaveTrendData.reduce((s, d) => s + d.leaves, 0) /
      (leaveTrendData.length || 1) || 0;

  const leaveDelta =
    leaveTrendData.length >= 2
      ? leaveTrendData[leaveTrendData.length - 1].leaves -
        leaveTrendData[0].leaves
      : 0;

  const totalLeaveDays = holidays.reduce((sum, h: any) => {
    if (!h.date_from || !h.date_till) return sum;
    try {
      const s = parseISO(h.date_from);
      const e = parseISO(h.date_till);
      return sum + differenceInCalendarDays(e, s) + 1;
    } catch {
      return sum;
    }
  }, 0);

  return {
    attendanceTrendData,
    leaveTrendData,
    keyMetrics: {
      avgAttendance,
      attendanceDelta,
      totalEmployees: employeeCount || 0,
      avgMonthlyLeave,
      leaveDelta,
      totalLeaveDays,
    },
  };
}

/* ----------------------------- Debug Block ---------------------------- */

function DebugBlock({ label, data }: { label: string; data: any }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="bg-slate-950 text-slate-100 rounded-md w-full"
    >
      <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] opacity-70">
          {Array.isArray(data) ? `${data.length} items` : typeof data}
        </span>
      </summary>
      <pre className="px-3 py-2 max-h-40 overflow-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

/* ------------------------------- Utils -------------------------------- */

function toCSV(rows: any[]): string {
  if (!rows.length) return "";

  // If rows contain { __section, data } we flatten slightly
  const flatRows: any[] = [];
  rows.forEach((r) => {
    if (r && r.__section && Array.isArray(r.data)) {
      r.data.forEach((item: any) =>
        flatRows.push({ __section: r.__section, ...item })
      );
    } else {
      flatRows.push(r);
    }
  });

  const headers = Array.from(
    flatRows.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const escape = (value: any) => {
    let v =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value ?? "");
    if (/("|,|\n)/.test(v)) {
      v = `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const lines = [
    headers.join(","),
    ...flatRows.map((row) =>
      headers.map((h) => escape((row as any)?.[h])).join(",")
    ),
  ];

  return lines.join("\n");
}
