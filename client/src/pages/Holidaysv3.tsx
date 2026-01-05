"use client";

import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  Info,
  Palmtree,
  Plus,
  Bug,
  Database,
  BarChart3,
  PieChart,
} from "lucide-react";

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  isBefore,
  isAfter,
  isSameDay,
  format,
  eachDayOfInterval,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import {
  fetchHolidayEntitlement,
  fetchHolidayHistory,
  validateHoliday,
  submitHoliday,
  selectHolidayEntitlement,
  selectHolidayEntitlementStatus,
  selectHolidayEntitlementError,
  selectHolidayHistory,
  selectHolidayHistoryStatus,
  selectHolidayHistoryError,
  selectHolidaySubmissionStatus,
  selectHolidaySubmissionError,
} from "@/features/holidays/holidaySlice";

// Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  ChartTooltip,
  ChartLegend,
);

/* --------------------------------------------------------------------
   TYPES
-------------------------------------------------------------------- */

type DayPart = "FD" | "AM" | "PM";

/* --------------------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------------------- */

export default function Holidays() {
  const dispatch = useAppDispatch();
  const { user } = useEmployee();
  const { toast } = useToast();

  // Redux state
  const entitlement = useAppSelector(selectHolidayEntitlement);
  const entitlementStatus = useAppSelector(selectHolidayEntitlementStatus);
  const entitlementError = useAppSelector(selectHolidayEntitlementError);

  const history = useAppSelector(selectHolidayHistory);
  const historyStatus = useAppSelector(selectHolidayHistoryStatus);
  const historyError = useAppSelector(selectHolidayHistoryError);

  const submissionStatus = useAppSelector(selectHolidaySubmissionStatus);
  const submissionError = useAppSelector(selectHolidaySubmissionError);

  // Local UI state
  const [range, setRange] = useState<DateRange | undefined>();
  const [leaveType, setLeaveType] = useState("annual");
  const [notes, setNotes] = useState("");
  const [debug, setDebug] = useState(false);
  const [debugTab, setDebugTab] = useState<
    "summary" | "entitlement" | "history" | "raw"
  >("summary");

  const [startPart, setStartPart] = useState<DayPart>("FD");
  const [endPart, setEndPart] = useState<DayPart>("FD");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const [holidayYear, setHolidayYear] = useState(
    new Date().getMonth() + 1 >= 12
      ? new Date().getFullYear() + 1
      : new Date().getFullYear(),
  );

  /* ----------------------------------------------------------------
     HOLIDAY YEAR RANGE
  ---------------------------------------------------------------- */
  const cycleStart = useMemo(
    () => new Date(holidayYear - 1, 11, 1),
    [holidayYear],
  );
  const cycleEnd = useMemo(
    () => new Date(holidayYear, 10, 30),
    [holidayYear],
  );

  /* ----------------------------------------------------------------
     PARSERS
  ---------------------------------------------------------------- */
  const parseDdMmYyyy = (val: string) => {
    if (!val) return null;
    const token = val.split(" ")[0];
    const [dd, mm, yyyy] = token.split("/");
    if (!dd || !mm || !yyyy) return null;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
  };

  const parseHistoryDate = (v: string | undefined) => {
    if (!v) return null;
    const iso = new Date(v);
    if (!isNaN(iso.getTime())) return iso;
    return parseDdMmYyyy(v);
  };

  /* ----------------------------------------------------------------
     WORKING DAYS
  ---------------------------------------------------------------- */
  const workingDayIds = useMemo(() => {
    if (!entitlement?.workhours) return [1, 2, 3, 4, 5]; // Mon–Fri
    return entitlement.workhours.map((wh: any) => Number(wh.day_id));
  }, [entitlement]);

  const isWorkingDay = (day: Date) => {
    const dow = day.getDay(); // 0 = Sunday
    const id = dow === 0 ? 7 : dow;
    return workingDayIds.includes(id);
  };

  /* ----------------------------------------------------------------
     BOOKED / PUBLIC DATES
  ---------------------------------------------------------------- */
  const bookedDates = useMemo(
    () => entitlement?.holiday_dates || [],
    [entitlement],
  );

  const publicDates = useMemo(
    () => entitlement?.public_and_xmas_holiday_dates || [],
    [entitlement],
  );

  const isBooked = (day: Date) =>
    bookedDates.some((v: string) => {
      const p = parseDdMmYyyy(v);
      return p ? isSameDay(day, p) : false;
    });

  const isPublicHoliday = (day: Date) =>
    publicDates.some((v: string) => {
      const p = parseDdMmYyyy(v);
      return p ? isSameDay(day, p) : false;
    });

  /* ----------------------------------------------------------------
     NORMALISED REQUEST HISTORY
  ---------------------------------------------------------------- */
  const requests = useMemo(() => {
    const fromHistory =
      history?.map((h: any) => {
        const start = parseHistoryDate(
          h.start_date || h.date_from || h.from || h.date,
        );
        const end = parseHistoryDate(
          h.end_date || h.date_till || h.till || h.date,
        );
        if (!start) return null;

        return {
          start,
          end: end || start,
          days: h.days || 1,
          type: h.holiday_type || h.type || "Annual Leave",
          status: h.request_status || h.status || "Pending",
          raw: h,
        };
      }) || [];

    const fallback = bookedDates.map((v: string) => {
      const p = parseDdMmYyyy(v);
      return p
        ? {
            start: p,
            end: p,
            days: 1,
            type: "Annual Leave",
            status: "Approved",
            raw: { source: "fallback_booked_dates", date: v },
          }
        : null;
    });

    return (fromHistory.length ? fromHistory : fallback).filter(
      Boolean,
    ) as {
      start: Date;
      end: Date;
      days: number;
      type: string;
      status: string;
      raw: any;
    }[];
  }, [history, bookedDates]);

  const publicHolidayList = useMemo(
    () =>
      publicDates
        .map((v: string) => {
          const p = parseDdMmYyyy(v);
          return p ? { date: p, label: v } : null;
        })
        .filter(Boolean) as { date: Date; label: string }[],
    [publicDates],
  );

  /* ----------------------------------------------------------------
     RANGE SELECTION (B)
  ---------------------------------------------------------------- */
  const handleRangeChange = (next: DateRange | undefined) => {
    if (!next?.from) {
      setRange(next);
      return;
    }

    const from = next.from;
    const to = next.to ?? next.from;

    if (from < cycleStart || to > cycleEnd) {
      toast({
        title: "Outside holiday year",
        description: `Please select dates between ${format(
          cycleStart,
          "dd/MM/yyyy",
        )} and ${format(cycleEnd, "dd/MM/yyyy")}.`,
        variant: "destructive",
      });
      return;
    }

    // Start & end must be working days
    if (!isWorkingDay(from) || !isWorkingDay(to)) {
      toast({
        title: "Non-working day selected",
        description:
          "Start and end dates must be your contracted working days. Weekends in the middle are allowed and will be excluded automatically.",
        variant: "destructive",
      });
      return;
    }

    // Reset half-day parts when a new range is started
    if (!range?.from || !range?.to || !isSameDay(range.from, from)) {
      setStartPart("FD");
      setEndPart("FD");
    }

    setRange(next);
  };

  /* ----------------------------------------------------------------
     SELECTION STATS (WORKING DAYS + DURATION WITH HALF-DAYS)
  ---------------------------------------------------------------- */
  const selectionStats = useMemo(() => {
    if (!range?.from || !range.to) {
      return {
        hasSelection: false,
        start: undefined,
        end: undefined,
        workingDays: 0,
        effectiveDays: 0,
      };
    }

    const start =
      range.from <= range.to ? range.from : (range.to as Date);
    const end =
      range.to >= range.from ? range.to : (range.from as Date);

    const allDays = eachDayOfInterval({ start, end });
    const workingDays = allDays.filter((d) => isWorkingDay(d));

    if (!workingDays.length) {
      return {
        hasSelection: false,
        start,
        end,
        workingDays: 0,
        effectiveDays: 0,
      };
    }

    const first = workingDays[0];
    const last = workingDays[workingDays.length - 1];

    // Single working day
    if (isSameDay(first, last)) {
      const part = startPart;
      const eff = part === "FD" ? 1 : 0.5;
      return {
        hasSelection: true,
        start: first,
        end: last,
        workingDays: 1,
        effectiveDays: eff,
      };
    }

    const middleCount = Math.max(workingDays.length - 2, 0);
    const startEff = startPart === "FD" ? 1 : 0.5;
    const endEff = endPart === "FD" ? 1 : 0.5;
    const total = middleCount + startEff + endEff;

    return {
      hasSelection: true,
      start: first,
      end: last,
      workingDays: workingDays.length,
      effectiveDays: total,
    };
  }, [range, startPart, endPart, isWorkingDay]);

  /* ----------------------------------------------------------------
     SUBMIT HOLIDAY
  ---------------------------------------------------------------- */
  const handleBookHoliday = async () => {
    if (!selectionStats.hasSelection || !selectionStats.start || !selectionStats.end) {
      toast({
        title: "No range selected",
        description: "Please select a consecutive working-day range first.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.user_id) return;

    const startDate = selectionStats.start;
    const endDate = selectionStats.end;

    const payload: any = {
      start_date: format(startDate, "dd/MM/yyyy"),
      end_date: format(endDate, "dd/MM/yyyy"),
      holiday_year: holidayYear,
      type: leaveType,
      employee_id: user.user_id,
      portal_id: "employee",
      note: notes || undefined,
      start_day_part: startPart,
      end_day_part: endPart,
      duration_days: selectionStats.effectiveDays,
    };

    try {
      await dispatch(validateHoliday(payload)).unwrap();
      await dispatch(submitHoliday(payload)).unwrap();

      toast({
        title: "Request submitted",
        description: `Your holiday request for ${format(
          startDate,
          "dd MMM yyyy",
        )} to ${format(endDate, "dd MMM yyyy")} has been submitted for approval.`,
      });

      dispatch(
        fetchHolidayEntitlement({
          holiday_year: holidayYear,
          employee_id: user.user_id,
        }),
      );
      dispatch(fetchHolidayHistory({ holiday_year: holidayYear }));

      setIsBookingOpen(false);
      setNotes("");
      setLeaveType("annual");
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err || submissionError || "Please try again.",
        variant: "destructive",
      });
    }
  };

  /* ----------------------------------------------------------------
     FETCH WHEN USER / YEAR CHANGES
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!user?.user_id) return;

    dispatch(
      fetchHolidayEntitlement({
        holiday_year: holidayYear,
        employee_id: user.user_id,
      }),
    );
    dispatch(fetchHolidayHistory({ holiday_year: holidayYear }));
    setRange(undefined);
    setStartPart("FD");
    setEndPart("FD");
  }, [dispatch, holidayYear, user?.user_id]);

  /* ----------------------------------------------------------------
     YEAR TABS
  ---------------------------------------------------------------- */
  const yearTabs = useMemo(() => {
    const y = holidayYear;
    return [y - 1, y, y + 1];
  }, [holidayYear]);

  /* ----------------------------------------------------------------
     DEBUG DATA
  ---------------------------------------------------------------- */
  const debugPayload = {
    userId: user?.user_id,
    holidayYear,
    cycleStart: format(cycleStart, "dd/MM/yyyy"),
    cycleEnd: format(cycleEnd, "dd/MM/yyyy"),
    workingDayIds,
    entitlement,
    history,
    selection: selectionStats,
  };

  /* ====================================================================
     RENDER
  ==================================================================== */

  return (
    <Layout>
      <div className="space-y-8 pb-24">
        {/* ------------------------------------------------------------
             HEADER
        ------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">My Holidays</h1>

            <div className="flex items-center gap-2 mt-2">
              {yearTabs.map((yr) => (
                <Button
                  key={yr}
                  size="sm"
                  variant={yr === holidayYear ? "default" : "outline"}
                  onClick={() => setHolidayYear(yr)}
                >
                  {`${yr - 1}/${yr}`}
                </Button>
              ))}
            </div>

            {entitlement && (
              <p className="text-muted-foreground mt-1">
                Holiday cycle:{" "}
                <span className="font-medium text-foreground">
                  {entitlement.holiday_cycle_start} –{" "}
                  {entitlement.holiday_cycle_end}
                </span>
              </p>
            )}

            {entitlementStatus === "loading" && (
              <p className="text-xs text-muted-foreground mt-1">
                Loading entitlement...
              </p>
            )}

            {entitlementError && (
              <p className="text-xs text-red-600 mt-1">{entitlementError}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              onClick={() =>
                console.log("Holiday policy / documentation requested")
              }
            >
              <Info className="h-4 w-4 mr-2" />
              Policy Guide
            </Button>

            <Button
              variant={debug ? "default" : "outline"}
              onClick={() => setDebug((d) => !d)}
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug
            </Button>

            <Button
              className="gap-2"
              onClick={() => {
                if (!selectionStats.hasSelection) {
                  toast({
                    title: "No range selected",
                    description:
                      "Select a consecutive working-day range in the calendar first.",
                    variant: "destructive",
                  });
                  return;
                }
                setIsBookingOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </div>
        </div>

        {/* ------------------------------------------------------------
             ENTITLEMENT SUMMARY
        ------------------------------------------------------------- */}
        {entitlement && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Main block */}
            <Card className="md:col-span-1 bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">
                  Total Entitlement
                </p>
                <p className="text-3xl font-bold text-yellow-900">
                  {Number(entitlement.holiday_entitlement).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            {/* Metrics */}
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryBlock
                label="Booked"
                value={entitlement.total_booked_holiday}
                color="text-blue-600"
              />
              <SummaryBlock
                label="Christmas"
                value={entitlement.total_mandatory_xmas_holiday}
                color="text-red-600"
              />
              <SummaryBlock
                label="Carry Forward"
                value={entitlement.holiday_balance_carried_forward}
                color="text-slate-700"
              />
              <SummaryBlock
                label="Remaining"
                value={Number(entitlement.remaining_holiday).toFixed(2)}
                color="text-green-700"
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
             CHARTS
        ------------------------------------------------------------- */}
        {entitlement && (
          <UsageCharts entitlement={entitlement} requests={requests} />
        )}

        {/* ------------------------------------------------------------
             BODY LAYOUT
        ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT: Calendar + Selection */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-2 shadow-sm">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 bg-muted/20 gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Select Dates
                  </CardTitle>
                  <CardDescription>
                    Select a consecutive working-day range within the holiday
                    year. Weekends are skipped automatically.
                  </CardDescription>
                </div>
                <Legend />
              </CardHeader>
              <SelectionSummary
              selection={selectionStats}
              startPart={startPart}
              endPart={endPart}
              onStartPartChange={setStartPart}
              onEndPartChange={setEndPart}
            />
              <CardContent className="p-6 flex justify-center">
                <div className="w-full max-w-xs sm:max-w-md">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={handleRangeChange}
                    disabled={(d) =>
                      isBefore(d, cycleStart) || isAfter(d, cycleEnd)
                    }
                    modifiers={{
                      booked: (d) => isBooked(d),
                      publicDay: (d) => isPublicHoliday(d),
                      nonWorking: (d) => !isWorkingDay(d),
                    }}
                    modifiersStyles={{
                      booked: {
                        fontWeight: 600,
                        textDecoration: "underline",
                        color: "var(--primary)",
                      },
                      publicDay: {
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                      },
                      nonWorking: {
                        opacity: 0.45,
                        color: "#94a3b8",
                      },
                    }}
                    fromDate={cycleStart}
                    toDate={cycleEnd}
                    classNames={calendarClassNames}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Requests + Public Holidays */}
          <div className="space-y-6">
            {/* My Requests */}
            <Card>
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
                <CardDescription>Recent leave history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {historyStatus === "loading" && (
                  <p className="text-xs text-muted-foreground">
                    Loading history...
                  </p>
                )}
                {historyError && (
                  <p className="text-xs text-red-600">{historyError}</p>
                )}
                {requests.length === 0 && !historyError && (
                  <p className="text-sm text-muted-foreground">
                    No leave recorded for this holiday year.
                  </p>
                )}

                {requests.map((req, i) => (
                  <RequestRow key={i} request={req} />
                ))}
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() =>
                    dispatch(fetchHolidayHistory({ holiday_year: holidayYear }))
                  }
                >
                  Refresh history
                </Button>
              </CardFooter>
            </Card>

            {/* Public Holidays */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  Public Holidays
                </CardTitle>
                <CardDescription>
                  Organisation-wide holidays in this cycle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publicHolidayList.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No public holidays registered for this holiday year.
                    </p>
                  )}

                  {publicHolidayList.map((holiday, i) => (
                    <PublicHolidayRow key={i} holiday={holiday} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ------------------------------------------------------------
             BOOKING DIALOG
        ------------------------------------------------------------- */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Book Time Off</DialogTitle>
              <DialogDescription>
                Review the details of your selection and submit your request.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                  >
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    {selectionStats.start
                      ? format(selectionStats.start, "dd MMM yyyy")
                      : "Select dates from the calendar"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                  >
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    {selectionStats.end
                      ? format(selectionStats.end, "dd MMM yyyy")
                      : "Select dates from the calendar"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Duration</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50 text-sm justify-between">
                    <span>
                      {selectionStats.effectiveDays.toFixed(2)} day
                      {selectionStats.effectiveDays !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectionStats.workingDays} working day
                      {selectionStats.workingDays !== 1 ? "s" : ""} in range
                    </span>
                  </div>
                </div>

                <HalfDaySelector
                  label="Start Day"
                  value={startPart}
                  onChange={setStartPart}
                />
                <HalfDaySelector
                  label="End Day"
                  value={selectionStats.workingDays === 1 ? startPart : endPart}
                  onChange={selectionStats.workingDays === 1 ? undefined : setEndPart}
                  singleDay={selectionStats.workingDays === 1}
                />
              </div>

              <div className="space-y-3">
                <Label>Leave Type</Label>
                <RadioGroup
                  value={leaveType}
                  onValueChange={setLeaveType}
                  className="grid grid-cols-2 gap-4"
                >
                  <LeaveTypeTile
                    value="annual"
                    id="annual"
                    icon={<Palmtree className="mb-2 h-5 w-5" />}
                    label="Annual Leave"
                  />
                  <LeaveTypeTile
                    value="sick"
                    id="sick"
                    icon={<Info className="mb-2 h-5 w-5" />}
                    label="Other / Sick"
                  />
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add a short explanation for your manager..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsBookingOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookHoliday}
                disabled={
                  submissionStatus === "loading" || !selectionStats.hasSelection
                }
              >
                {submissionStatus === "loading"
                  ? "Submitting..."
                  : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ------------------------------------------------------------
             DEBUG PANEL
        ------------------------------------------------------------- */}
        {debug && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-slate-950/95 text-slate-50">
            <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Holiday Data Inspector
                  </span>
                  <span className="text-[11px] text-slate-400">
                    User: {user?.user_id ?? "N/A"} · Year: {holidayYear}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs"
                  onClick={() => setDebug(false)}
                >
                  Close
                </Button>
              </div>

              <Tabs
                value={debugTab}
                onValueChange={(v) =>
                  setDebugTab(
                    v as "summary" | "entitlement" | "history" | "raw",
                  )
                }
              >
                <TabsList className="mb-2">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="entitlement">Entitlement</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>

                <div className="border rounded-md bg-slate-900/60">
                  <ScrollArea className="h-[220px] p-3 text-xs">
                    <TabsContent value="summary" className="mt-0 space-y-2">
                      <p className="font-semibold mb-1">Computed Overview</p>
                      <ul className="space-y-1">
                        <li>
                          Holiday cycle: {format(cycleStart, "dd/MM/yyyy")} –{" "}
                          {format(cycleEnd, "dd/MM/yyyy")}
                        </li>
                        <li>Working day IDs: {workingDayIds.join(", ")}</li>
                        <li>
                          Requests in memory:{" "}
                          <span className="font-semibold">
                            {requests.length}
                          </span>
                        </li>
                        <li>
                          Public holidays:{" "}
                          <span className="font-semibold">
                            {publicHolidayList.length}
                          </span>
                        </li>
                        <li>
                          Current selection days:{" "}
                          {selectionStats.effectiveDays.toFixed(2)}
                        </li>
                      </ul>
                    </TabsContent>

                    <TabsContent value="entitlement" className="mt-0">
                      {entitlement ? (
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(entitlement, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-slate-300">
                          No entitlement data loaded.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                      {history ? (
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(history, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-slate-300">
                          No history data loaded.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="raw" className="mt-0">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(debugPayload, null, 2)}
                      </pre>
                    </TabsContent>
                  </ScrollArea>
                </div>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* --------------------------------------------------------------------
   SUB-COMPONENTS
-------------------------------------------------------------------- */

function SummaryBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      <LegendItem color="bg-green-500" label="Approved / booked" />
      <LegendItem color="bg-slate-300" label="Non-working" />
      <LegendItem color="bg-red-400" label="Public holiday" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(color, "h-2.5 w-2.5 rounded-full")} />
      <span>{label}</span>
    </div>
  );
}

const calendarClassNames = {
    months:
      "flex flex-col sm:flex-row sm:space-x-8 space-y-6 sm:space-y-0 w-full justify-center",
  
    month: "space-y-4 w-full max-w-[360px]",
  
    caption:
      "flex justify-between items-center px-2 mb-2 border-b pb-2 text-sm font-medium",
  
    caption_label: "text-base font-semibold",
  
    nav_button:
      "h-8 w-8 flex items-center justify-center rounded-md border hover:bg-accent transition-colors",
  
    table: "w-full border-separate border-spacing-1",
  
    head_row: "flex w-full text-xs text-muted-foreground",
  
    head_cell:
      "flex-1 text-center py-1 font-semibold tracking-wide uppercase",
  
    row: "flex w-full gap-1",
  
    cell:
      "flex-1 aspect-square p-0 relative text-center border rounded-md overflow-hidden",
  
    day: cn(
      "w-full h-full flex items-center justify-center text-sm rounded-md",
      "transition-all hover:bg-primary/10 hover:border-primary/30"
    ),
  
    day_selected: cn(
      "bg-primary text-primary-foreground font-semibold shadow transition",
      "hover:bg-primary scale-[1.03]"
    ),
  
    day_today:
      "font-semibold border border-primary bg-primary/10 text-primary",
  
    day_outside: "opacity-40 text-muted-foreground",
  
    day_disabled: "opacity-20 cursor-not-allowed",
  
    day_hidden: "invisible",
  };
  

function RequestRow({ request }: { request: any }) {
  const status = (request.status || "").toLowerCase();

  const statusClass =
    status === "approved"
      ? "bg-green-500 hover:bg-green-600"
      : status === "pending"
      ? "bg-yellow-500 hover:bg-yellow-600"
      : "bg-slate-500 hover:bg-slate-600";

  const rangeLabel =
    request.start && request.end && !isSameDay(request.start, request.end)
      ? `${format(request.start, "dd MMM yyyy")} – ${format(
          request.end,
          "dd MMM yyyy",
        )}`
      : format(request.start, "dd MMM yyyy");

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-blue-100 text-blue-600">
          <Palmtree className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{rangeLabel}</p>
          <p className="text-xs text-muted-foreground">
            {request.days} day{request.days > 1 ? "s" : ""} • {request.type}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge
          variant="default"
          className={cn("text-[10px] uppercase tracking-wide", statusClass)}
        >
          {request.status}
        </Badge>
        <Button
          size="xs"
          variant="outline"
          className="text-[10px] h-6 px-2"
          onClick={() => console.log("Holiday request record:", request.raw)}
        >
          View record
        </Button>
      </div>
    </div>
  );
}

function PublicHolidayRow({
  holiday,
}: {
  holiday: { date: Date; label: string };
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{holiday.label}</p>
        <p className="text-xs text-muted-foreground">
          {holiday.date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <Badge variant="outline" className="text-[10px] shrink-0">
        Public
      </Badge>
    </div>
  );
}

function LeaveTypeTile({
  value,
  id,
  icon,
  label,
}: {
  value: string;
  id: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <RadioGroupItem value={value} id={id} className="peer sr-only" />
      <Label
        htmlFor={id}
        className={cn(
          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 text-xs",
          "hover:bg-accent hover:text-accent-foreground cursor-pointer",
          "peer-data-[state=checked]:border-primary",
        )}
      >
        {icon}
        <span className="mt-1 text-sm font-medium text-center">{label}</span>
      </Label>
    </div>
  );
}

/* --------------------------------------------------------------------
   SELECTION SUMMARY + HALF-DAY CONTROLS
-------------------------------------------------------------------- */

function SelectionSummary({
  selection,
  startPart,
  endPart,
  onStartPartChange,
  onEndPartChange,
}: {
  selection: {
    hasSelection: boolean;
    start?: Date;
    end?: Date;
    workingDays: number;
    effectiveDays: number;
  };
  startPart: DayPart;
  endPart: DayPart;
  onStartPartChange: (p: DayPart) => void;
  onEndPartChange: (p: DayPart) => void;
}) {
  const label =
    selection.start && selection.end
      ? `${format(selection.start, "dd MMM yyyy")} to ${format(
          selection.end,
          "dd MMM yyyy",
        )}`
      : "No dates selected";

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Current Selection
        </CardTitle>
        <CardDescription>
          {selection.hasSelection
            ? "Review and refine your selection before submitting a request."
            : "Select a consecutive working-day range in the calendar above."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {selection.effectiveDays.toFixed(2)} day
            {selection.effectiveDays !== 1 ? "s" : ""} requested •{" "}
            {selection.workingDays} working day
            {selection.workingDays !== 1 ? "s" : ""} in range
          </p>
          <div className="flex flex-wrap gap-2 mt-2 text-[11px] items-center">
            <Badge variant="outline">FD</Badge>
            <span>Full Day</span>
            <Badge variant="outline">AM</Badge>
            <span>Morning</span>
            <Badge variant="outline">PM</Badge>
            <span>Afternoon</span>
          </div>
        </div>

        {selection.hasSelection && (
          <div className="flex flex-col sm:flex-row gap-4">
            <HalfDayBadges
              label="Start"
              value={startPart}
              onChange={onStartPartChange}
            />
            <HalfDayBadges
              label="End"
              value={selection.workingDays === 1 ? startPart : endPart}
              onChange={
                selection.workingDays === 1 ? onStartPartChange : onEndPartChange
              }
              singleDay={selection.workingDays === 1}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HalfDayBadges({
  label,
  value,
  onChange,
  singleDay,
}: {
  label: string;
  value: DayPart;
  onChange?: (p: DayPart) => void;
  singleDay?: boolean;
}) {
  const parts: { key: DayPart; text: string }[] = [
    { key: "FD", text: "FD" },
    { key: "AM", text: "AM" },
    { key: "PM", text: "PM" },
  ];

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        {label} Day
      </p>
      <div className="inline-flex rounded-full border bg-muted/60 p-1 gap-1">
        {parts.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={!onChange}
            onClick={() => onChange && onChange(p.key)}
            className={cn(
              "px-3 py-1 text-[11px] rounded-full font-medium transition",
              value === p.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-transparent text-muted-foreground hover:bg-background",
              !onChange && "opacity-60 cursor-default",
            )}
          >
            {p.text}
          </button>
        ))}
      </div>
      {singleDay && label === "End" && (
        <p className="text-[10px] text-muted-foreground">
          Single-day selection: end part follows start day.
        </p>
      )}
    </div>
  );
}

function HalfDaySelector({
  label,
  value,
  onChange,
  singleDay,
}: {
  label: string;
  value: DayPart;
  onChange?: (p: DayPart) => void;
  singleDay?: boolean;
}) {
  const parts: { key: DayPart; text: string }[] = [
    { key: "FD", text: "FD" },
    { key: "AM", text: "AM" },
    { key: "PM", text: "PM" },
  ];

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-1 rounded-full border bg-muted/60 px-1 py-1">
        {parts.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange && onChange(p.key)}
            disabled={!onChange}
            className={cn(
              "flex-1 text-xs py-1.5 rounded-full font-medium transition",
              value === p.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-transparent text-muted-foreground hover:bg-background",
              !onChange && "opacity-60 cursor-default",
            )}
          >
            {p.text}
          </button>
        ))}
      </div>
      {singleDay && (
        <p className="text-[10px] text-muted-foreground">
          Single-day request: end part mirrors start day.
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------
   CHARTS
-------------------------------------------------------------------- */

function UsageCharts({
  entitlement,
  requests,
}: {
  entitlement: any;
  requests: any[];
}) {
  const booked = Number(entitlement.total_booked_holiday || 0);
  const xmas = Number(entitlement.total_mandatory_xmas_holiday || 0);
  const remaining = Number(entitlement.remaining_holiday || 0);
  const carry = Number(entitlement.holiday_balance_carried_forward || 0);

  const barData = {
    labels: ["Booked", "Christmas", "Carry forward", "Remaining"],
    datasets: [
      {
        label: "Days",
        data: [booked, xmas, carry, remaining],
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.2)" },
        ticks: { precision: 0 },
      },
    },
  };

  const totalUsed = booked + xmas;
  const doughnutData = {
    labels: ["Used", "Remaining"],
    datasets: [
      {
        data: [totalUsed, remaining],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { boxWidth: 10, boxHeight: 10 },
      },
    },
    cutout: "65%",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            Usage Breakdown
          </CardTitle>
          <CardDescription>Booked days across this holiday year.</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <Bar data={barData} options={barOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PieChart className="h-4 w-4 text-primary" />
            Used vs Remaining
          </CardTitle>
          <CardDescription>
            Overall utilisation of your allowance.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-56 relative">
          <Doughnut data={doughnutData} options={doughnutOptions} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase">
                Remaining
              </p>
              <p className="text-xl font-semibold">
                {remaining.toFixed(2)} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
