"use client";

import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTeam,
  fetchTeamCalendar,
  fetchAnnouncements,
  selectTeamMembers,
  selectTeamCalendar,
  selectTeamAnnouncements,
  selectTeamStatus,
  selectTeamError,
} from "@/features/team/teamSlice";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Calendar,
  Users,
  Bell,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Code,
  Briefcase,
  MapPin,
  Activity,
  CalendarRange,
  FileDown,
  BarChart2,
  Sun,
  Umbrella,
} from "lucide-react";

import { differenceInCalendarDays, parse, parseISO } from "date-fns";

export default function Manager() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const isManager = true;

  const [search, setSearch] = useState("");
  const [expandAll, setExpandAll] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const members = useAppSelector(selectTeamMembers);
  const calendarData = useAppSelector(selectTeamCalendar);
  const holidays = calendarData?.holidays || []; // Team Holidays structure
  const announcements = useAppSelector(selectTeamAnnouncements);
  const status = useAppSelector(selectTeamStatus);
  const error = useAppSelector(selectTeamError);

  // --- Fetch data ---
  useEffect(() => {
    if (!isManager) return;
    const payload: any = {
      portal_user: user.user_id,
      team_member: user.team_member,
    };
    dispatch(fetchTeam(payload));
    dispatch(fetchTeamCalendar(payload));
    dispatch(fetchAnnouncements());
  }, [dispatch, user, isManager]);

  // --- Roster stats from members (Team Roster data structure) ---
  const rosterStats = useMemo(() => {
    const departmentsMap = new Map<string, number>();
    const absenceByTypeMap = new Map<string, number>();

    let fullTimeCount = 0;
    let partTimeCount = 0;
    let totalHolidayRecords = 0;
    let totalSickRecords = 0;
    let totalAbsenceRecords = 0;

    members.forEach((m: any) => {
      if (m.department) {
        incrementMap(departmentsMap, m.department);
      }

      if ((m.employment_type || "").toLowerCase().includes("full")) {
        fullTimeCount++;
      } else {
        partTimeCount++;
      }

      (m.holidays_and_absences || []).forEach((a: any) => {
        totalAbsenceRecords++;
        const type = a.request_type || "Other";
        incrementMap(absenceByTypeMap, type);

        if (type === "Full day") {
          totalHolidayRecords++;
        }
        if (type === "Sick") {
          totalSickRecords++;
        }
      });
    });

    const absenceByType = Array.from(absenceByTypeMap.entries()).map(
      ([label, value]) => ({ label, value })
    );

    return {
      totalMembers: members.length,
      departmentsCount: departmentsMap.size,
      fullTimeCount,
      partTimeCount,
      totalHolidayRecords,
      totalSickRecords,
      totalAbsenceRecords,
      absenceByType,
    };
  }, [members]);

  // --- Holiday load from Team Holidays (calendarData.holidays) ---
  const holidayLoad = useMemo(() => {
    const map = new Map<string, { label: string; value: number }>();

    holidays.forEach((h: any) => {
      const label =
        `${h.first_name || ""} ${h.last_name || ""}`.trim() ||
        String(h.employee_id);

      const days = safeCountIsoRangeDays(h.date_from, h.date_till);

      const existing = map.get(label) || { label, value: 0 };
      existing.value += days;
      map.set(label, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [holidays]);

  // --- Filters ---
  const filteredMembers = useMemo(
    () =>
      members.filter((m: any) => {
        const name =
          `${m.first_name || ""} ${m.last_name || ""}` ||
          m.employee_name ||
          m.user_name ||
          "";
        return name.toLowerCase().includes(search.toLowerCase());
      }),
    [members, search]
  );

  const filteredHolidays = holidays; // Placeholder for future filters (status, date, etc.)

  const handleRefresh = () => {
    if (!isManager) return;
    const payload: any = {
      portal_user: user.user_id,
      team_member: user.team_member,
    };
    dispatch(fetchTeam(payload));
    dispatch(fetchTeamCalendar(payload));
    dispatch(fetchAnnouncements());
  };

  const handleDownload = (type: "roster" | "holidays") => {
    const dataToExport = type === "roster" ? members : holidays;
    if (!dataToExport || dataToExport.length === 0) return;

    const csv = toCSV(dataToExport);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isManager) {
    return (
      <Layout>
        <Card>
          <CardContent className="py-6">
            <p className="font-medium">
              Manager tools are not available for this account.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Manager Hub</h1>
            <Badge variant="secondary">Line Manager</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug((prev) => !prev)}
            >
              <Code className="h-4 w-4 mr-1" />
              Debug
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Team Members"
            icon={<Users className="h-4 w-4" />}
            count={rosterStats.totalMembers}
            subtitle="Direct reports"
          />
          <StatCard
            title="Departments"
            icon={<Briefcase className="h-4 w-4" />}
            count={rosterStats.departmentsCount}
            subtitle="Distinct departments"
          />
          <StatCard
            title="Holidays Records"
            icon={<Sun className="h-4 w-4" />}
            count={rosterStats.totalHolidayRecords}
            subtitle="Holiday entries (roster)"
          />
          <StatCard
            title="Sick / Absence"
            icon={<Activity className="h-4 w-4" />}
            count={rosterStats.totalSickRecords}
            subtitle={`${rosterStats.totalAbsenceRecords} total absences`}
          />
        </div>

        {/* Charts & Insights */}
        {(rosterStats.absenceByType.length > 0 || holidayLoad.length > 0) && (
          <Card className="border-l-4 border-primary/70 shadow-sm">
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-base">
                    Team Attendance & Holiday Overview
                  </CardTitle>
                  <CardDescription>
                    Visual breakdown of absence types and holiday load by team
                    member.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Absence by type */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Absence by Type</p>
                </div>
                <SegmentedBar
                  segments={rosterStats.absenceByType.map((t, idx) => ({
                    label: t.label,
                    value: t.value,
                    className: barColorByIndex(idx),
                  }))}
                />
                <ul className="space-y-1 text-xs">
                  {rosterStats.absenceByType.map((t, idx) => (
                    <li
                      key={t.label}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${barColorByIndex(
                            idx
                          )}`}
                        />
                        <span>{t.label}</span>
                      </div>
                      <span className="font-medium">{t.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Holiday load per employee */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Holiday Load by Employee
                  </p>
                </div>
                {holidayLoad.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No team holidays found yet.
                  </p>
                ) : (
                  <MiniBarList data={holidayLoad} maxItems={5} unit="days" />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members by name…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandAll((p) => !p)}
              className="flex items-center gap-1"
            >
              {expandAll ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Collapse all
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> Expand all
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Team Roster (from Team Roster data) */}
          <DataCard
            title="Team Roster"
            badge={status || "synced"}
            data={filteredMembers}
            expandAll={expandAll}
            empty="No team data yet."
            type="roster"
            onDownload={() => handleDownload("roster")}
          />

          {/* Team Holidays (from calendarData.holidays) */}
          <DataCard
            title="Team Holidays"
            badge="synced"
            data={filteredHolidays}
            expandAll={expandAll}
            empty="No holidays scheduled."
            type="holidays"
            onDownload={() => handleDownload("holidays")}
          />
        </div>

        {/* Announcements */}
        <AnnouncementsCard announcements={announcements} />

        {/* Debug view */}
        {showDebug && (
          <Card className="mt-4 border-t-4 border-primary/80">
            <CardHeader>
              <CardTitle>Developer Debug View</CardTitle>
              <CardDescription>
                Raw data structures from API: useful while developing / mapping
                new features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-auto text-xs">
              <DebugBlock label="User" data={user} />
              <DebugBlock label="Team Members (Roster)" data={members} />
              <DebugBlock label="Team Holidays (Calendar)" data={holidays} />
              <DebugBlock label="Announcements" data={announcements} />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

/* ---------------------- Small reusable components ---------------------- */

function StatCard({
  title,
  count,
  icon,
  subtitle,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  subtitle: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-6 -top-6 opacity-[0.04]">
        <div className="h-16 w-16 rounded-full bg-primary" />
      </div>
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        {icon}
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-3xl font-bold tracking-tight">{count}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function DataCard({
  title,
  badge,
  data,
  expandAll,
  empty,
  type,
  onDownload,
}: {
  title: string;
  badge?: string;
  data: any[];
  expandAll: boolean;
  empty: string;
  type: "roster" | "holidays";
  onDownload?: () => void;
}) {
  const icon =
    type === "roster" ? (
      <Users className="h-4 w-4 text-primary" />
    ) : (
      <Calendar className="h-4 w-4 text-primary" />
    );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {badge && <Badge variant="outline">{badge}</Badge>}
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={onDownload}
            >
              <FileDown className="h-4 w-4" />
              CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-auto text-sm">
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          data.map((item: any, idx: number) =>
            type === "roster" ? (
              <RosterItemCard key={idx} member={item} expandAll={expandAll} />
            ) : (
              <HolidayItemCard key={idx} holiday={item} expandAll={expandAll} />
            )
          )
        )}
      </CardContent>
    </Card>
  );
}

/* --- Team Roster card (from Team Roster structure) --- */

function RosterItemCard({
  member,
  expandAll,
}: {
  member: any;
  expandAll: boolean;
}) {
  const [open, setOpen] = useState(expandAll);

  useEffect(() => setOpen(expandAll), [expandAll]);

  const fullName =
    `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
    member.employee_name ||
    member.user_name ||
    member.employee_id;

  const workPattern = summarizeWorkPattern(member.workhours || []);
  const workplaces = member.workplaces || [];

  const holidayRecords =
    (member.holidays_and_absences || []).filter(
      (a: any) => a.hol_or_abs === 1
    ) || [];
  const absences =
    (member.holidays_and_absences || []).filter(
      (a: any) => a.hol_or_abs === 2
    ) || [];
  const holidayRequests = member.holiday_requests || [];

  return (
    <div className="p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="font-medium">{fullName}</p>
            <Badge variant="secondary" className="text-[10px]">
              #{member.employee_id}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {member.designation || "Team member"} ·{" "}
            {member.department || "No department"}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {workplaces.map((w: any) => w.workplace).join(", ") ||
              "No workplace set"}
          </p>
          {workPattern && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {workPattern}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className="text-[10px]">
            {member.employment_status || "Status unknown"}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] mt-1 bg-primary/5 text-primary border-primary/20"
          >
            {member.employment_type || "Type unknown"}
          </Badge>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground mt-1" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-amber-300 text-amber-700 bg-amber-50"
        >
          <Sun className="h-3 w-3" />
          Holidays: {holidayRecords.length}
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-red-300 text-red-700 bg-red-50"
        >
          <Activity className="h-3 w-3" />
          Absences: {absences.length}
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-blue-300 text-blue-700 bg-blue-50"
        >
          <Calendar className="h-3 w-3" />
          Requests: {holidayRequests.length}
        </Badge>
      </div>

      {open && (
        <div className="mt-3 space-y-3 text-xs">
          {/* Holiday / absence timeline */}
          {(holidayRecords.length > 0 || absences.length > 0) && (
            <div className="space-y-1">
              <p className="font-semibold text-[11px] flex items-center gap-1">
                <CalendarRange className="h-3 w-3" />
                Holidays & Absences
              </p>
              <div className="space-y-1 max-h-32 overflow-auto pr-1">
                {[...holidayRecords, ...absences].map((h: any) => (
                  <div
                    key={`${h.request_id}-${h.start_date}-${h.request_type}`}
                    className="flex justify-between items-center border rounded px-2 py-1 bg-gray-50"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-[11px]">
                        {h.request_type}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {h.start_date} → {h.end_date} ·{" "}
                        {h.request_status || "Pending"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] whitespace-nowrap"
                    >
                      {h.note ? "With note" : h.request_status || "Status"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON for this member */}
          <details className="bg-gray-50 rounded-md p-2">
            <summary className="text-[11px] font-semibold cursor-pointer flex items-center gap-1">
              <Code className="h-3 w-3" />
              Raw data (JSON)
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px]">
              {JSON.stringify(member, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

/* --- Team Holidays cards (from calendarData.holidays structure) --- */

function HolidayItemCard({
  holiday,
  expandAll,
}: {
  holiday: any;
  expandAll: boolean;
}) {
  const [open, setOpen] = useState(expandAll);
  useEffect(() => setOpen(expandAll), [expandAll]);

  const fullName =
    `${holiday.first_name || ""} ${holiday.last_name || ""}`.trim() ||
    holiday.employee_id;

  const days = safeCountIsoRangeDays(holiday.date_from, holiday.date_till);

  return (
    <div className="p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="font-medium">{fullName}</p>
            <Badge variant="outline" className="text-[10px]">
              #{holiday.employee_id}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CalendarRange className="h-3 w-3" />
            {holiday.date_from} → {holiday.date_till} ({days} day
            {days !== 1 ? "s" : ""})
          </p>
        </div>
        <Badge
          className={`text-[10px] ${
            (holiday.status || "").toLowerCase() === "approved"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
          variant="outline"
        >
          {holiday.status || "Planned"}
        </Badge>
      </div>

      {open && (
        <div className="mt-3 space-y-2 text-xs">
          <p className="text-[11px] text-muted-foreground">
            Holiday record from team calendar API.
          </p>
          <details className="bg-gray-50 rounded-md p-2">
            <summary className="text-[11px] font-semibold cursor-pointer flex items-center gap-1">
              <Code className="h-3 w-3" />
              Raw holiday JSON
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px]">
              {JSON.stringify(holiday, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

/* --- Announcements --- */

function AnnouncementsCard({ announcements }: { announcements: any[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <div>
          <CardTitle className="text-base">Announcements</CardTitle>
          <CardDescription className="text-xs">
            Latest updates from HR / Admin.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          announcements.map((a: any, idx: number) => (
            <div
              key={idx}
              className="p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">
                  {a.title || a.name || "Announcement"}
                </p>
                <Badge variant="secondary" className="text-[10px]">
                  {a.priority || "info"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {a.date || a.created_at || ""}
              </p>
              <p className="text-sm mt-1 text-foreground">
                {a.content || a.message || ""}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* --- Debug block --- */

function DebugBlock({ label, data }: { label: string; data: any }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="bg-slate-950 text-slate-100 rounded-md"
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

/* --- Charts helpers --- */

function SegmentedBar({
  segments,
}: {
  segments: { label: string; value: number; className?: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div className="h-2 rounded-full bg-muted flex overflow-hidden">
      {segments.map((s) => (
        <div
          key={s.label}
          className={`h-full ${s.className || ""}`}
          style={{ width: `${(s.value / total) * 100}%` }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  );
}

function MiniBarList({
  data,
  maxItems = 5,
  unit = "",
}: {
  data: { label: string; value: number }[];
  maxItems?: number;
  unit?: string;
}) {
  const top = data.slice(0, maxItems);
  const max = top.reduce((m, d) => Math.max(m, d.value), 0) || 1;

  return (
    <div className="space-y-1 text-xs">
      {top.map((d) => (
        <div key={d.label} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="truncate pr-2">{d.label}</span>
            <span className="font-medium">
              {d.value} {unit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary/70"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {data.length > maxItems && (
        <p className="text-[10px] text-muted-foreground mt-1">
          +{data.length - maxItems} more…
        </p>
      )}
    </div>
  );
}

/* --- Utils --- */

function incrementMap(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

function summarizeWorkPattern(workhours: any[]): string {
  if (!workhours || workhours.length === 0) return "";
  const days = workhours.map((w: any) => w.day).join(", ");
  const start = workhours[0]?.start_time;
  const end = workhours[0]?.end_time;
  if (!start || !end) return days;
  return `${days} · ${start}–${end}`;
}

function safeCountIsoRangeDays(from?: string, till?: string): number {
  try {
    if (!from || !till) return 1;
    const s = parseISO(from);
    const e = parseISO(till);
    return differenceInCalendarDays(e, s) + 1;
  } catch {
    return 1;
  }
}

function barColorByIndex(idx: number): string {
  const classes = [
    "bg-emerald-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-indigo-500",
  ];
  return classes[idx % classes.length];
}

function toCSV(rows: any[]): string {
  if (!rows.length) return "";

  const headers = Array.from(
    rows.reduce((set, row) => {
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
    ...rows.map((row) =>
      headers.map((h) => escape((row as any)?.[h])).join(",")
    ),
  ];

  return lines.join("\n");
}
