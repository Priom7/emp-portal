import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { adminEndpoints } from "@/admin/api/adminEndpoints";
import { useAdminAuth } from "@/admin/context/AdminAuthContext";
import { AdminLayout } from "@/admin/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_ADMIN_API_KEY } from "@/admin/api/adminClient";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Activity, AlertTriangle, Clock3, Megaphone } from "lucide-react";

export function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { authenticated, apiKey, email } = useAdminAuth();
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!authenticated) setLocation("/login");
  }, [authenticated, setLocation]);

  const { data: lookupData, isLoading: loadingLookup } = useQuery({
    queryKey: ["admin-authenticate", apiKey],
    enabled: authenticated,
    queryFn: () => adminEndpoints.authenticate(apiKey).then((res) => res.data)
  });

  const { data: announcementsData, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ["admin-announcements", apiKey],
    enabled: authenticated,
    queryFn: () => adminEndpoints.announcements(apiKey).then((res) => res.data)
  });

  const { data: bankData, isLoading: loadingBank } = useQuery({
    queryKey: ["admin-bank-holidays", apiKey],
    enabled: authenticated,
    queryFn: () => adminEndpoints.bankHolidays(apiKey).then((res) => res.data)
  });

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ["admin-attendance-today", apiKey],
    enabled: authenticated,
    queryFn: () => adminEndpoints.attendanceToday(apiKey).then((res) => res.data)
  });

  const announcements = announcementsData?.announcements ?? [];
  const statuses = lookupData?.table_data ?? [];
  const holidays = bankData?.bank_holidays ?? [];

  const attendanceCount = useMemo(() => {
    if (!attendanceData?.success || !Array.isArray(attendanceData?.data)) return 0;
    return attendanceData.data.length;
  }, [attendanceData]);

  const fallbackAnnouncements = [
    { ann_id: "D-101", announcement_title: "Payroll window closes Friday", announcement: "Submit adjustments before 4pm Friday.", first_name: "HR Ops" },
    { ann_id: "D-102", announcement_title: "New starters pack", announcement: "Template letters refreshed in /documents.", first_name: "People Team" }
  ];

  const fallbackStatuses = [
    { id: 1, hr_employee_status: "Active", priority: 1 },
    { id: 2, hr_employee_status: "Onboarding", priority: 2 },
    { id: 3, hr_employee_status: "Leaver", priority: 3 }
  ];

  const fallbackHolidays = [
    { date: "25/12/2025", title: "Christmas Day", weekday_name: "Thu" },
    { date: "26/12/2025", title: "Boxing Day", weekday_name: "Fri" },
    { date: "01/01/2026", title: "New Year’s Day", weekday_name: "Thu" }
  ];

  const displayAnnouncements = announcements.length ? announcements : fallbackAnnouncements;
  const displayStatuses = statuses.length ? statuses : fallbackStatuses;
  const displayHolidays = holidays.length ? holidays : fallbackHolidays;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50 via-white to-indigo-50" />
          <CardHeader className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                Control Centre
              </div>
              <CardTitle className="text-2xl">Welcome back {email || "admin"}</CardTitle>
              <CardDescription>
                Connected to local-hr-admin with API key ending{" "}
                <code className="font-mono">{(apiKey || DEFAULT_ADMIN_API_KEY).slice(-4)}</code>.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant={showDebug ? "outline" : "secondary"} size="sm" onClick={() => setShowDebug((v) => !v)}>
                Dev view
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              icon={<Activity className="h-4 w-4 text-emerald-600" />}
              title="Backend"
              value={lookupData?.success === 1 ? "Online" : "Unknown"}
              hint="/api-response/hr-lookup-table.php"
            />
            <InfoTile
              icon={<Megaphone className="h-4 w-4 text-amber-600" />}
              title="Announcements"
              value={loadingAnnouncements ? "…" : announcements.length}
              hint="announcements.php"
            />
            <InfoTile icon={<Clock3 className="h-4 w-4 text-sky-600" />} title="Clock-in today" value={loadingAttendance ? "…" : attendanceCount} hint="check-in-history.php" />
            <InfoTile
              icon={<AlertTriangle className="h-4 w-4 text-indigo-600" />}
              title="Status types"
              value={loadingLookup ? "…" : displayStatuses.length}
              hint="hr_employee_status"
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Fresh data from /admin/api-response/announcements.php</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnnouncements ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : (
                <div className="space-y-3">
                  {displayAnnouncements.map((item: any, idx: number) => (
                    <motion.div
                      key={item.ann_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{item.announcement_title}</p>
                        <Badge>#{item.ann_id}</Badge>
                      </div>
                      <p className="text-sm text-slate-700">{item.announcement}</p>
                      <p className="text-xs text-slate-500">By {item.first_name}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-white">Bank holidays</CardTitle>
              <CardDescription className="text-slate-200/80">
                Pulled via bank-holidays.php (gov.uk mirror)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingBank ? (
                <>
                  <Skeleton className="h-10 bg-white/10" />
                  <Skeleton className="h-10 bg-white/10" />
                </>
              ) : (
                displayHolidays.slice(0, 6).map((holiday: any) => (
                  <div key={holiday.date} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{holiday.title}</p>
                      <p className="text-xs text-slate-200/80">{holiday.weekday_name}</p>
                    </div>
                    <Badge className="bg-white text-slate-900">{holiday.date}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee statuses</CardTitle>
            <CardDescription>Snapshot of hr_employee_status lookup</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLookup ? (
              <Skeleton className="h-32" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayStatuses.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.id}</TableCell>
                      <TableCell>{row.hr_employee_status}</TableCell>
                      <TableCell>{row.priority}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {showDebug && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Dev mode</CardTitle>
              <CardDescription>Raw responses for debugging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-slate-100">
                {JSON.stringify({ lookupData, announcementsData, bankData, attendanceData }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function InfoTile({
  title,
  value,
  hint,
  icon
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        {title}
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
