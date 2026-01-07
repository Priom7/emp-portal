"use client";

import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { SmartAvatar } from "@/components/SmartAvatar";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Download,
  Building2,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
  Timer,
  Crown,
  Award,
  File as FileIcon,
  Activity,
  BarChart3,
  GitCompare,
} from "lucide-react";
import { motion } from "framer-motion";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchEmployeeProfile,
  selectEmployeeProfile,
  selectProfileStatus,
  selectProfileError,
  fetchEmploymentHistory,
  selectEmploymentHistory,
  selectEmploymentHistoryStatus,
  selectEmploymentHistoryError,
} from "@/features/profile/profileSlice";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

/* --------------------------------------------------
   Main Component
-------------------------------------------------- */

export default function Employment() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();

  const employee = useAppSelector(selectEmployeeProfile);
  const status = useAppSelector(selectProfileStatus);
  const error = useAppSelector(selectProfileError);

  const historyData = useAppSelector(selectEmploymentHistory);
  const historyStatus = useAppSelector(selectEmploymentHistoryStatus);
  const historyError = useAppSelector(selectEmploymentHistoryError);

  const [openSection, setOpenSection] = useState<string | null>("employment");
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "active" | "ended"
  >("all");

  const [debug, setDebug] = useState(false);
  const [contractPreview, setContractPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(
        fetchEmployeeProfile({
          portal_user: user.user_id,
          portal_id: "employee",
        })
      );
      dispatch(
        fetchEmploymentHistory({
          portal_user: user.user_id,
          portal_id: "employee",
        })
      );
    }
  }, [dispatch, user]);

  const profile = employee || {};

  // Basic data
  const displayName =
    profile.employee_name || profile.name || user?.employee_name || "Employee";

  const department =
    profile.department ||
    profile.sub_organisation ||
    profile.hr_department ||
    "Department";

  const email = profile.email || profile.employee_email || user?.email || "N/A";
  const phone = profile.phone || profile.employee_phone || "N/A";
  const location = profile.location || "London HQ";

  const startDate =
    profile.start_date ||
    profile.employment_start_date ||
    profile.hr_start_date;

  const managerName = profile.manager_name || profile.manager || "N/A";

  const holidayRequests = profile.holiday_requests || [];
  const absences = profile.absences || [];

  const employmentHistory: any[] =
    (historyData && historyData.length > 0
      ? historyData
      : profile.employment_history ||
        profile.hr_employee_employment_history ||
        []) || [];

  // Sort + filter employment history
  const sortedEmploymentHistory = useMemo(() => {
    if (!employmentHistory?.length) return [];

    const filtered = employmentHistory.filter((item: any) => {
      if (historyFilter === "all") return true;
      const ended = Boolean(
        item.hr_employment_end_status || item.hr_employment_end_status_date
      );
      return historyFilter === "ended" ? ended : !ended;
    });

    return filtered.sort((a: any, b: any) => {
      const aDate = toDateSafe(a.effective_from || a.start_date);
      const bDate = toDateSafe(b.effective_from || b.start_date);
      return bDate - aDate;
    });
  }, [employmentHistory, historyFilter]);

  useEffect(() => {
    setSelectedHistoryIndex(0);
  }, [sortedEmploymentHistory.length, historyFilter]);

  const metrics = useMemo(() => {
    const holidaysTaken = holidayRequests.filter(
      (h: any) => h.request_status === "Approved"
    ).length;

    const sickDays = absences.filter(
      (a: any) => a.type === "Sick" || a.request_type === "Sick"
    ).length;

    let yearsOfService = "";
    if (startDate) {
      const start = toDateSafe(startDate);
      if (!Number.isNaN(start)) {
        const diff = Date.now() - start;
        const years = diff / (1000 * 60 * 60 * 24 * 365);
        yearsOfService = years.toFixed(1);
      }
    }

    return [
      {
        title: "Years of Service",
        value: yearsOfService || "0",
        icon: Timer,
      },
      {
        title: "Approved Holidays",
        value: holidaysTaken,
        icon: Award,
      },
      {
        title: "Sick Days",
        value: sickDays,
        icon: Shield,
      },
    ];
  }, [holidayRequests, absences, startDate, profile.job_level]);

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const currentHistory =
    sortedEmploymentHistory[
      Math.min(selectedHistoryIndex, sortedEmploymentHistory.length - 1)
    ] || null;

  const previousHistory =
    sortedEmploymentHistory.length > 1
      ? sortedEmploymentHistory[
          Math.min(selectedHistoryIndex + 1, sortedEmploymentHistory.length - 1)
        ]
      : null;

  // Salary chart data
  const salaryChartData = useMemo(() => {
    if (!employmentHistory?.length) return [];
    const ascending = [...employmentHistory].sort(
      (a, b) => toDateSafe(a.effective_from) - toDateSafe(b.effective_from)
    );

    return ascending.map((h: any) => ({
      label: h.effective_from || h.start_date || "-",
      salary: Number(h.latest_wages || h.wages || 0),
    }));
  }, [employmentHistory]);

  // Holiday entitlement view (for current history)
  const entitlement = currentHistory
    ? {
        base: currentHistory.holiday_entitlement ?? null,
        additional: currentHistory.holiday_additional ?? null,
        carryForward: currentHistory.holiday_balance_carried_forward ?? null,
        details: currentHistory.carry_forward_holiday_balance_details || null,
      }
    : null;

  return (
    <Layout>
      <div className="space-y-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold">
              Employment &amp; Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal details, history, and employment records.
            </p>
            {status === "loading" && (
              <p className="text-xs mt-1 text-muted-foreground">Loading…</p>
            )}
            {error && <p className="text-xs text-red-600">{String(error)}</p>}
          </div>

          <div className="flex gap-2 items-center">

            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export Profile PDF
            </Button>
          </div>
        </motion.div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: PROFILE */}
          <ProfileCard
            displayName={displayName}
            department={department}
            email={email}
            phone={phone}
            location={location}
            profile={profile}
          />

          {/* RIGHT: TABS + ACCORDION */}
          <div className="md:col-span-2 space-y-6">
            <SummaryMetrics metrics={metrics} />

            {/* Main Tabs for analytics vs records */}
            <Tabs defaultValue="records" className="w-full">
              <TabsList className="bg-secondary/30 rounded-xl p-1 mb-4 grid grid-cols-2 sm:w-auto">
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* RECORDS TAB */}
              <TabsContent value="records" className="space-y-6">
                <AccordionCard
                  id="employment"
                  open={openSection}
                  toggle={toggleSection}
                  title="Current Employment"
                  icon={Building2}
                >
                  <EmploymentDetails
                    profile={profile}
                    user={user}
                    startDate={startDate}
                    managerName={managerName}
                  />
              
                </AccordionCard>

                <AccordionCard
                  id="history"
                  open={openSection}
                  toggle={toggleSection}
                  title="Employment History & Contracts"
                  icon={Briefcase}
                >
                  <HistorySection
                    historyFilter={historyFilter}
                    setHistoryFilter={setHistoryFilter}
                    sortedEmploymentHistory={sortedEmploymentHistory}
                    historyStatus={historyStatus}
                    historyError={historyError}
                    selectedHistoryIndex={selectedHistoryIndex}
                    setSelectedHistoryIndex={setSelectedHistoryIndex}
                    currentHistory={currentHistory}
                    previousHistory={previousHistory}
                    onPreviewContract={(fileName) =>
                      setContractPreview(fileName)
                    }
                  />
                </AccordionCard>

                <AccordionCard
                  id="holidays"
                  open={openSection}
                  toggle={toggleSection}
                  title="Holiday Requests"
                  icon={Calendar}
                >
                  <HolidayRequests holidayRequests={holidayRequests} />
                </AccordionCard>

                <AccordionCard
                  id="absences"
                  open={openSection}
                  toggle={toggleSection}
                  title="Absences"
                  icon={Shield}
                >
                  <Absences absences={absences} />
                </AccordionCard>
              </TabsContent>

              {/* ANALYTICS TAB */}
              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsSection
                  salaryChartData={salaryChartData}
                  currentHistory={currentHistory}
                  entitlement={entitlement}
                  history={sortedEmploymentHistory}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* CONTRACT PREVIEW MODAL */}
        <Dialog
          open={!!contractPreview}
          onOpenChange={() => setContractPreview(null)}
        >
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Contract Preview</DialogTitle>
            </DialogHeader>
            {contractPreview ? (
              <div className="h-full border rounded-md overflow-hidden">
                {/* You will likely adjust this path to your real file location */}
                <iframe
                  src={`/contracts/${contractPreview}`}
                  className="w-full h-full"
                  title="Contract PDF"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No contract selected.
              </p>
            )}
          </DialogContent>
        </Dialog>

        {/* DEBUG PANEL */}
  
      </div>
    </Layout>
  );
}

/* --------------------------------------------------
   Helper: safe date
-------------------------------------------------- */

function toDateSafe(dateLike: any): number {
  if (!dateLike) return 0;
  // handle dd/mm/yyyy or yyyy-mm-dd
  if (typeof dateLike === "string" && dateLike.includes("/")) {
    const [d, m, y] = dateLike.split("/");
    const dNum = Number(d);
    const mNum = Number(m);
    const yNum = Number(y);
    if (!Number.isNaN(dNum) && !Number.isNaN(mNum) && !Number.isNaN(yNum)) {
      return new Date(yNum, mNum - 1, dNum).getTime();
    }
  }
  const ts = new Date(dateLike).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

/* --------------------------------------------------
   Profile Card
-------------------------------------------------- */

function ProfileCard({
  displayName,
  department,
  email,
  phone,
  location,
  profile,
}: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full shadow-md hover:shadow-lg transition-all rounded-xl">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <SmartAvatar src={profile.avatar_url} name={displayName} size={128} />

          <h2 className="text-xl font-bold">{displayName}</h2>
          <p className="text-muted-foreground mb-3">
            {profile.job_title || "Employee"}
          </p>

          <Badge className="mb-4" variant="secondary">
            {department}
          </Badge>

          <div className="w-full space-y-3 text-left">
            <InfoRow icon={Mail} label="Email" value={email} />
            <InfoRow icon={Phone} label="Phone" value={phone} />
            <InfoRow icon={MapPin} label="Location" value={location} />
          </div>

          <Button className="w-full mt-6 shadow-sm hover:shadow active:scale-[.98] transition">
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border hover:bg-secondary/60 transition">
      <Icon className="h-4 w-4 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------
   Summary Metrics
-------------------------------------------------- */

function SummaryMetrics({ metrics }: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m: any, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <Card className="p-4 hover:bg-accent/30 transition cursor-default rounded-xl">
            <div className="flex items-center gap-3">
              <m.icon className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{m.title}</p>
                <p className="font-bold text-lg">{m.value}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* --------------------------------------------------
   Accordion Card
-------------------------------------------------- */

function AccordionCard({ id, open, toggle, title, icon: Icon, children }: any) {
  const isOpen = open === id;

  return (
    <Card className="overflow-hidden shadow rounded-xl">
      <CardHeader
        onClick={() => toggle(id)}
        className="cursor-pointer flex items-center justify-between hover:bg-accent/30 transition py-4"
      >
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </CardHeader>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        <CardContent className="p-6">{children}</CardContent>
      </motion.div>
    </Card>
  );
}

/* --------------------------------------------------
   Current Employment Details
-------------------------------------------------- */

function EmploymentDetails({ profile, user, startDate, managerName }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
      <DetailField
        label="Employee ID"
        value={profile.user_id || user?.user_id}
      />
      <DetailField
        label="Start Date"
        value={
          startDate
            ? new Date(toDateSafe(startDate)).toLocaleDateString()
            : "Not available"
        }
      />
      <DetailField
        label="Contract Type"
        value={
          profile.contract_type || profile.hr_employment_type || "Permanent"
        }
      />
      <DetailField label="Manager" value={managerName} />
    </div>
  );
}

function DetailField({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

/* --------------------------------------------------
   History Section (with analytics + comparison)
-------------------------------------------------- */

function HistorySection({
  historyFilter,
  setHistoryFilter,
  sortedEmploymentHistory,
  historyStatus,
  historyError,
  selectedHistoryIndex,
  setSelectedHistoryIndex,
  currentHistory,
  previousHistory,
  onPreviewContract,
}: any) {
  if (historyStatus === "loading") {
    return <p className="text-sm text-muted-foreground">Loading history…</p>;
  }

  if (historyError) {
    return <p className="text-sm text-red-600">{String(historyError)}</p>;
  }

  if (!sortedEmploymentHistory?.length) {
    return <p className="text-sm text-muted-foreground">No history found.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="mb-2 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "ended", label: "Ended" },
        ].map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={historyFilter === f.key ? "default" : "outline"}
            onClick={() => setHistoryFilter(f.key)}
            className="rounded-full"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Record selector */}
      <div className="flex flex-wrap gap-2">
        {sortedEmploymentHistory.map((job: any, i: number) => {
          const active = i === selectedHistoryIndex;
          const label = job.effective_from
            ? `From ${job.effective_from}`
            : job.start_date
            ? `From ${job.start_date}`
            : `Record ${i + 1}`;
          return (
            <Button
              key={job.employment_id || i}
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setSelectedHistoryIndex(i)}
              className="rounded-full"
            >
              {label}
            </Button>
          );
        })}
      </div>

      {currentHistory && (
        <EmploymentHistoryDetail
          current={currentHistory}
          previous={previousHistory}
          onPreviewContract={onPreviewContract}
        />
      )}
    </div>
  );
}

function EmploymentHistoryDetail({
  current,
  previous,
  onPreviewContract,
}: any) {
  return (
    <div className="space-y-4">
      {/* Top 3 cards */}
      <motion.div
        key={current?.employment_id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase">Type</p>
            <p className="text-lg font-bold">
              {current.hr_employment_status ||
                current.employment_status ||
                "Status"}
            </p>
            <p className="text-sm">
              {current.hr_employment_type ||
                current.employment_type ||
                "Contract"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200/60">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase">
              Compensation
            </p>
            <p className="text-lg font-bold">
              {current.latest_wages || current.wages || "—"}{" "}
              <span className="text-sm text-muted-foreground">
                /{" "}
                {current.latest_payment_frequency ||
                  current.hr_payment_frequency ||
                  "Year"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Effective{" "}
              {current.latest_wages_effective_from ||
                current.effective_from ||
                "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase">Manager</p>
            <p className="text-lg font-bold">
              {current.line_manager_name || current.manager || "Not set"}
            </p>
            <p className="text-sm text-muted-foreground">
              Sub Org: {current.hr_sub_organisation || "—"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline & Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Timeline &amp; Details
          </CardTitle>
          <CardDescription>
            Effective from {current.effective_from || "—"}
            {current.contract_end_date || current.hr_employment_end_status_date
              ? ` to ${
                  current.contract_end_date ||
                  current.hr_employment_end_status_date
                }`
              : " • Present"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow
            icon={Briefcase}
            label="Designation"
            value={current.hr_designation || "—"}
          />
          <InfoRow
            icon={Building2}
            label="Department"
            value={current.hr_department || "—"}
          />
          <InfoRow
            icon={Shield}
            label="Probation (months)"
            value={current.probation_period_month ?? "0"}
          />
          <InfoRow
            icon={User}
            label="Line Manager"
            value={current.line_manager_name || "—"}
          />
          <InfoRow
            icon={Award}
            label="Holiday Entitlement"
            value={current.holiday_entitlement ?? "—"}
          />
          <InfoRow
            icon={Crown}
            label="Carry Forward"
            value={current.holiday_balance_carried_forward ?? 0}
          />
          <InfoRow
            icon={Timer}
            label="End Status"
            value={current.hr_employment_end_status || "Active"}
          />
        </CardContent>
      </Card>

      {/* Work Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Work Pattern
          </CardTitle>
          <CardDescription>Hours and locations</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase">Workhours</p>
            {current.workhours?.length ? (
              <div className="space-y-1">
                {current.workhours.map((wh: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md border p-2 text-sm bg-secondary/20"
                  >
                    <span className="font-semibold">{wh.day}</span>
                    <span className="text-muted-foreground">
                      {wh.start_time} - {wh.end_time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No workhours provided.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase">
              Workplaces
            </p>
            {current.workplaces?.length ? (
              <div className="space-y-1">
                {current.workplaces.map((wp: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm bg-secondary/20"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{wp.workplace}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No workplaces listed.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contract & Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Contract &amp; Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <InfoRow
            icon={FileIcon}
            label="Contract Reference"
            value={current.eSignatureUniqReference || "—"}
          />
          <InfoRow
            icon={FileIcon}
            label="Contract File"
            value={current.uniq_file_name || "No contract uploaded"}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {current.uniq_file_name && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreviewContract(current.uniq_file_name)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Preview Contract
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => console.log("Contract record:", current)}
                >
                  Inspect Contract JSON
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Change Comparison */}
      {previous && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-primary" />
              Role Change Comparison
            </CardTitle>
            <CardDescription>
              Comparing this record with the previous employment record
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ComparisonRow
              label="Designation"
              previous={previous.hr_designation}
              current={current.hr_designation}
            />
            <ComparisonRow
              label="Department"
              previous={previous.hr_department}
              current={current.hr_department}
            />
            <ComparisonRow
              label="Wages"
              previous={previous.latest_wages || previous.wages}
              current={current.latest_wages || current.wages}
            />
            <ComparisonRow
              label="Employment Status"
              previous={previous.hr_employment_status}
              current={current.hr_employment_status}
            />
            <ComparisonRow
              label="Employment Type"
              previous={previous.hr_employment_type}
              current={current.hr_employment_type}
            />
          </CardContent>
        </Card>
      )}

      {/* Inspect JSON Button */}
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => console.log("Current history record:", current)}
      >
        Inspect Current History JSON
      </Button>
    </div>
  );
}

function ComparisonRow({ label, previous, current }: any) {
  const changed =
    previous !== undefined &&
    current !== undefined &&
    String(previous) !== String(current);

  return (
    <div className="flex flex-col border rounded-md p-3 bg-secondary/20">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <div className="flex justify-between gap-3 text-xs">
        <span className="flex-1">
          <span className="font-semibold">Before: </span>
          {previous ?? "—"}
        </span>
        <span className="flex-1">
          <span className="font-semibold">Now: </span>
          {current ?? "—"}
        </span>
      </div>
      {changed && (
        <span className="mt-1 inline-flex items-center text-[10px] text-green-700 bg-green-100 rounded-full px-2 py-0.5">
          Changed
        </span>
      )}
    </div>
  );
}

/* --------------------------------------------------
   Analytics Section (Salary Chart + Entitlement)
-------------------------------------------------- */

function AnalyticsSection({
  salaryChartData,
  currentHistory,
  entitlement,
  history,
}: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Salary chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Salary History
          </CardTitle>
          <CardDescription>
            Latest wages over employment records
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          {salaryChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No salary data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salaryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="salary"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Entitlement / extra info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Holiday Entitlement Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {currentHistory && entitlement ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <EntitlementBlock
                  label="Base Entitlement"
                  value={entitlement.base}
                  suffix="days"
                />
                <EntitlementBlock
                  label="Additional"
                  value={entitlement.additional}
                  suffix="days"
                />
                <EntitlementBlock
                  label="Carry Forward"
                  value={entitlement.carryForward}
                  suffix="days"
                />
              </div>

              {entitlement.details && (
                <div className="p-3 rounded-md bg-secondary/30 border text-xs space-y-1">
                  <p>
                    <span className="font-semibold">Holiday Year:</span>{" "}
                    {entitlement.details.holiday_year}
                  </p>
                  <p>
                    <span className="font-semibold">Holidays Taken:</span>{" "}
                    {entitlement.details.holidays_taken}
                  </p>
                  <p>
                    <span className="font-semibold">
                      Calculated Entitlement:
                    </span>{" "}
                    {entitlement.details.calculated_holiday_entitlement}
                  </p>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() =>
                  console.log("Entitlement details:", { currentHistory })
                }
              >
                Inspect Entitlement JSON
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No entitlement info available for selected record.
            </p>
          )}

          {/* Quick stats */}
          <div className="pt-3 border-t mt-3">
            <p className="text-xs text-muted-foreground mb-2">
              Total employment records: {history?.length || 0}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EntitlementBlock({ label, value, suffix }: any) {
  return (
    <div className="p-3 rounded-md bg-secondary/30 border text-center">
      <p className="text-[11px] text-muted-foreground uppercase mb-1">
        {label}
      </p>
      <p className="text-lg font-bold">
        {value ?? "—"}{" "}
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
}

/* --------------------------------------------------
   Holiday Requests
-------------------------------------------------- */

function HolidayRequests({ holidayRequests }: any) {
  if (!holidayRequests.length) {
    return (
      <p className="text-sm text-muted-foreground">No holiday requests.</p>
    );
  }

  return (
    <div className="space-y-3">
      {holidayRequests.map((req: any, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="p-3 border rounded-lg bg-secondary/20 hover:bg-secondary/30 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{req.holiday_type || "Holiday"}</p>
                <p className="text-xs text-muted-foreground">
                  {req.date_from} - {req.date_till}
                </p>
              </div>
              <Badge variant="outline">{req.request_status}</Badge>
            </div>
            {req.holiday_status_comment && (
              <p className="text-xs text-muted-foreground mt-1">
                {req.holiday_status_comment}
              </p>
            )}
            <Button
              size="xs"
              variant="outline"
              className="mt-2"
              onClick={() => console.log("Holiday request:", req)}
            >
              Inspect JSON
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* --------------------------------------------------
   Absences
-------------------------------------------------- */

function Absences({ absences }: any) {
  if (!absences.length) {
    return <p className="text-sm text-muted-foreground">No absences.</p>;
  }

  return (
    <div className="space-y-3">
      {absences.map((a: any, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="p-3 border rounded-lg bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/60 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{a.type || "Absence"}</p>
                <p className="text-xs text-muted-foreground">
                  {a.from} - {a.till}
                </p>
              </div>
              <Badge variant="outline">{a.abs_status || "Status"}</Badge>
            </div>
            {a.abs_note && (
              <p className="text-xs text-muted-foreground mt-1">{a.abs_note}</p>
            )}
            <Button
              size="xs"
              variant="outline"
              className="mt-2"
              onClick={() => console.log("Absence:", a)}
            >
              Inspect JSON
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
