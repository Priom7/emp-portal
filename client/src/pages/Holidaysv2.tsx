"use client";

import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
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
  Palmtree,
  CalendarDays,
  Info,
  Plus,
  Bug,
  Eye,
  FileCode2,
  ListTree,
  Activity as ActivityIcon,
  Database,
  Search,
  X,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchHolidayEntitlement,
  fetchHolidayHistory,
  selectHolidayEntitlement,
  selectHolidayEntitlementStatus,
  selectHolidayEntitlementError,
  selectHolidayHistory,
  selectHolidayHistoryStatus,
  selectHolidayHistoryError,
  validateHoliday,
  submitHoliday,
  selectHolidaySubmissionStatus,
  selectHolidaySubmissionError,
} from "@/features/holidays/holidaySlice";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------ */

type NormalizedRequest = {
  start: Date;
  end: Date;
  days: number;
  type: string;
  status: string;
  source: "history" | "booked";
  raw?: unknown;
};

type DebugTab = "overview" | "entitlement" | "history" | "requests" | "raw";

/* ------------------------------------------------------------------
   Component
------------------------------------------------------------------ */

export default function Holidays() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const entitlement = useAppSelector(selectHolidayEntitlement);
  const entitlementStatus = useAppSelector(selectHolidayEntitlementStatus);
  const entitlementError = useAppSelector(selectHolidayEntitlementError);

  const history = useAppSelector(selectHolidayHistory);
  const historyStatus = useAppSelector(selectHolidayHistoryStatus);
  const historyError = useAppSelector(selectHolidayHistoryError);

  const submissionStatus = useAppSelector(selectHolidaySubmissionStatus);
  const submissionError = useAppSelector(selectHolidaySubmissionError);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("annual");
  const [notes, setNotes] = useState("");

  const [holidayYear, setHolidayYear] = useState<number>(
    new Date().getMonth() + 1 >= 12
      ? new Date().getFullYear() + 1
      : new Date().getFullYear(),
  );

  // Debug state
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugTab, setDebugTab] = useState<DebugTab>("overview");
  const [debugSelectedRequestIndex, setDebugSelectedRequestIndex] = useState<
    number | null
  >(null);
  const [debugFilter, setDebugFilter] = useState("");

  // Holiday year start 1 Dec (prev year) to 30 Nov (year)
  const cycleStart = useMemo(
    () => new Date(holidayYear - 1, 11, 1),
    [holidayYear],
  );
  const cycleEnd = useMemo(
    () => new Date(holidayYear, 10, 30),
    [holidayYear],
  );

  const workingDayIds = useMemo(() => {
    if (!entitlement?.workhours) return [1, 2, 3, 4, 5];
    return entitlement.workhours.map((wh: any) => Number(wh.day_id));
  }, [entitlement]);

  const bookedDates = useMemo(
    () => entitlement?.holiday_dates || [],
    [entitlement],
  );
  const publicDates = useMemo(
    () => entitlement?.public_and_xmas_holiday_dates || [],
    [entitlement],
  );

  /* ------------------------------------------------------------------
     Helpers
  ------------------------------------------------------------------ */

  const parseDdMmYyyy = (value: string) => {
    const token = value.split(" ")[0];
    const [dd, mm, yyyy] = token.split("/");
    if (!dd || !mm || !yyyy) return null;
    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const isWorkingDay = (day: Date) => {
    const dow = day.getDay(); // 0 Sun .. 6 Sat
    const dayId = dow === 0 ? 7 : dow; // 1 Mon ... 7 Sun
    return workingDayIds.includes(dayId);
  };

  const isBooked = (day: Date) =>
    bookedDates.some((d: string) => {
      const parsed = parseDdMmYyyy(d);
      return parsed ? isSameDay(parsed, day) : false;
    });

  const isPublicHoliday = (day: Date) =>
    publicDates.some((d: string) => {
      const parsed = parseDdMmYyyy(d);
      return parsed ? isSameDay(parsed, day) : false;
    });

  const parseHistoryDate = (value: string | undefined) => {
    if (!value) return null;
    const iso = new Date(value);
    if (!isNaN(iso.getTime())) return iso;
    return parseDdMmYyyy(value);
  };

  const safeStringify = (value: unknown) => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "Unable to stringify value.";
    }
  };

  /* ------------------------------------------------------------------
     Normalised Requests
  ------------------------------------------------------------------ */

  const requests: NormalizedRequest[] = useMemo(() => {
    const fromHistory: NormalizedRequest[] =
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
          source: "history",
          raw: h,
        };
      }) || [];

    const fallbackFromBooked: NormalizedRequest[] = bookedDates
      .map((d: string) => {
        const parsed = parseDdMmYyyy(d);
        return parsed
          ? {
              start: parsed,
              end: parsed,
              days: 1,
              type: "Annual Leave",
              status: "Approved",
              source: "booked",
              raw: d,
            }
          : null;
      })
      .filter((entry): entry is NormalizedRequest => Boolean(entry));

    const base = (fromHistory.length ? fromHistory : fallbackFromBooked).filter(
      (entry): entry is NormalizedRequest => Boolean(entry),
    );

    return base.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [history, bookedDates]);

  const filteredDebugRequests = useMemo(() => {
    if (!debugFilter.trim()) return requests;
    const q = debugFilter.toLowerCase();
    return requests.filter((r) => {
      const label = `${format(r.start, "dd/MM/yyyy")} ${r.type} ${
        r.status
      } ${r.source}`;
      return label.toLowerCase().includes(q);
    });
  }, [requests, debugFilter]);

  const publicHolidayList = useMemo(
    () =>
      publicDates
        .map((d: string) => {
          const parsed = parseDdMmYyyy(d);
          return parsed ? { date: parsed, label: d } : null;
        })
        .filter(
          (entry): entry is { date: Date; label: string } => Boolean(entry),
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [publicDates],
  );

  const yearTabs = useMemo(() => {
    const current = holidayYear;
    return [current - 1, current, current + 1];
  }, [holidayYear]);

  /* ------------------------------------------------------------------
     Handlers
  ------------------------------------------------------------------ */

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    if (selectedDate < cycleStart || selectedDate > cycleEnd) {
      toast({
        title: "Out of holiday year",
        description: `Select between ${format(
          cycleStart,
          "dd/MM/yyyy",
        )} and ${format(cycleEnd, "dd/MM/yyyy")}.`,
        variant: "destructive",
      });
      return;
    }

    if (!isWorkingDay(selectedDate)) {
      toast({
        title: "Non-working day",
        description:
          "You can only book holidays on your contracted working days.",
        variant: "destructive",
      });
      return;
    }

    setDate(selectedDate);
    setIsBookingOpen(true);
  };

  const handleBookHoliday = async () => {
    if (!date || !user?.user_id) return;
    const payload: Record<string, unknown> = {
      start_date: format(date, "dd/MM/yyyy"),
      end_date: format(date, "dd/MM/yyyy"),
      holiday_year: holidayYear,
      type: leaveType,
      employee_id: user.user_id,
      portal_id: "employee",
    };

    if (notes.trim()) {
      payload.note = notes.trim();
    }

    try {
      await dispatch(validateHoliday(payload as any)).unwrap();
      await dispatch(submitHoliday(payload as any)).unwrap();

      toast({
        title: "Request submitted",
        description: `Your holiday request for ${format(
          date,
          "PPP",
        )} has been sent for approval.`,
      });

      dispatch(
        fetchHolidayEntitlement({
          holiday_year: holidayYear,
          employee_id: user.user_id,
        }),
      );
      dispatch(fetchHolidayHistory({ holiday_year: holidayYear }));
      setIsBookingOpen(false);
      setDate(undefined);
      setNotes("");
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err || submissionError || "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!user?.user_id) return;
    dispatch(
      fetchHolidayEntitlement({
        holiday_year: holidayYear,
        employee_id: user.user_id,
      }),
    );
    dispatch(fetchHolidayHistory({ holiday_year: holidayYear }));
    setDate(undefined);
  }, [dispatch, holidayYear, user?.user_id]);

  /* ------------------------------------------------------------------
     Derived debug metrics
  ------------------------------------------------------------------ */

  const debugMetrics = useMemo(
    () => ({
      holidayYear,
      cycleStart: format(cycleStart, "dd/MM/yyyy"),
      cycleEnd: format(cycleEnd, "dd/MM/yyyy"),
      workingDayIds,
      bookedCount: bookedDates.length,
      publicHolidayCount: publicHolidayList.length,
      requestCount: requests.length,
    }),
    [holidayYear, cycleStart, cycleEnd, workingDayIds, bookedDates.length, publicHolidayList.length, requests.length],
  );

  const selectedDebugRequest =
    debugSelectedRequestIndex != null
      ? filteredDebugRequests[debugSelectedRequestIndex]
      : null;

  /* ------------------------------------------------------------------
     Render
  ------------------------------------------------------------------ */

  return (
    <Layout>
      <div className="relative space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">My Holidays</h1>

            {/* Year toggle */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {yearTabs.map((yr) => (
                <Button
                  key={yr}
                  size="sm"
                  variant={yr === holidayYear ? "default" : "outline"}
                  onClick={() => setHolidayYear(yr)}
                  className="rounded-full"
                >
                  {`${yr - 1}/${yr}`}
                </Button>
              ))}
            </div>

            {entitlement && (
              <p className="text-muted-foreground mt-1 text-sm">
                Holiday cycle:{" "}
                <span className="font-medium text-foreground">
                  {entitlement.holiday_cycle_start} -{" "}
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
              onClick={() => {
                // Placeholder: open policy document or route
                console.info("Open policy guide");
              }}
            >
              <Info className="h-4 w-4 mr-2" />
              Policy guide
            </Button>

            <Button
              variant={debugOpen ? "default" : "outline"}
              className="gap-2"
              onClick={() => setDebugOpen((prev) => !prev)}
            >
              {debugOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              <Bug className="h-4 w-4" />
              Debug
            </Button>

            <Button className="gap-2" onClick={() => setIsBookingOpen(true)}>
              <Plus className="h-4 w-4" /> New request
            </Button>
          </div>
        </div>

        {/* Entitlement Summary */}
        {entitlement && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-1 bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4 pt-6">
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">
                  Entitlement
                </p>
                <p className="text-3xl font-bold text-yellow-900">
                  {Number(entitlement.holiday_entitlement).toFixed(2)}
                </p>
                <p className="text-xs text-yellow-700/80 mt-1">Total days</p>
              </CardContent>
            </Card>

            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 pt-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Booked
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {entitlement.total_booked_holiday}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 pt-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Christmas
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {entitlement.total_mandatory_xmas_holiday}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 pt-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Carry forward
                  </p>
                  <p className="text-2xl font-bold text-slate-600">
                    {entitlement.holiday_balance_carried_forward}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4 pt-6">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                    Remaining
                  </p>
                  <p className="text-3xl font-bold text-green-700">
                    {Number(entitlement.remaining_holiday).toFixed(2)}
                  </p>
                  <p className="text-xs text-green-700/80 mt-1">
                    Available to book
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="h-full border-2 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/20">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Select dates
                  </CardTitle>
                  <CardDescription>
                    Click on a date within your holiday year to request leave.
                  </CardDescription>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    Approved
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    Pending
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    Non-working
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-center w-full">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    className="rounded-md w-full max-w-full"
                    disabled={(day) =>
                      !isWorkingDay(day) ||
                      isBefore(day, cycleStart) ||
                      isAfter(day, cycleEnd)
                    }
                    modifiers={{
                      booked: (d) => isBooked(d),
                      publicDay: (d) => isPublicHoliday(d),
                      weekend: (d) => !isWorkingDay(d),
                    }}
                    modifiersStyles={{
                      booked: {
                        fontWeight: "bold",
                        textDecoration: "underline",
                        color: "var(--primary)",
                      },
                      publicDay: {
                        backgroundColor: "#fff7ed",
                        color: "#d97706",
                      },
                      weekend: {
                        color: "#cbd5e1",
                        opacity: 0.5,
                      },
                    }}
                    fromDate={cycleStart}
                    toDate={cycleEnd}
                    classNames={{
                      months:
                        "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                      month: "space-y-4 w-full",
                      caption:
                        "flex justify-center pt-1 relative items-center mb-4",
                      caption_label: "text-lg font-bold text-foreground",
                      nav: "space-x-1 flex items-center",
                      nav_button:
                        "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border rounded-md hover:bg-muted transition-colors",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full mb-2",
                      head_cell:
                        "text-muted-foreground rounded-md w-full font-semibold text-[0.9rem] uppercase tracking-wider",
                      row: "flex w-full mt-2 gap-2",
                      cell: "h-14 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: cn(
                        "h-14 w-full p-0 font-medium aria-selected:opacity-100 hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20",
                      ),
                      day_selected:
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md scale-105",
                      day_today:
                        "bg-accent text-accent-foreground border-accent-foreground/20",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled:
                        "text-muted-foreground opacity-30 bg-secondary/20 cursor-not-allowed",
                      day_range_middle:
                        "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Requests & Public Holidays */}
          <div className="space-y-6">
            {/* My Requests */}
            <Card>
              <CardHeader>
                <CardTitle>My requests</CardTitle>
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
                {requests.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No leave recorded for this holiday year.
                  </p>
                )}
                {requests.map((req, i) => (
                  <div
                    key={`${req.start.toISOString()}-${i}`}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-blue-100 text-blue-600">
                        <Palmtree className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {format(req.start, "MMM d, yyyy")}
                          {req.end > req.start &&
                            ` – ${format(req.end, "MMM d, yyyy")}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {req.days} day{req.days !== 1 ? "s" : ""} •{" "}
                          {req.type} •{" "}
                          <span className="uppercase text-[10px] tracking-wide">
                            {req.source}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="default"
                        className={cn(
                          "text-[10px]",
                          req.status?.toLowerCase() === "approved"
                            ? "bg-green-500 hover:bg-green-600"
                            : req.status?.toLowerCase() === "pending"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-slate-500 hover:bg-slate-600",
                        )}
                      >
                        {req.status}
                      </Badge>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] gap-1"
                        onClick={() => {
                          setDebugOpen(true);
                          setDebugTab("requests");
                          const index = filteredDebugRequests.findIndex(
                            (r) =>
                              r.start.getTime() === req.start.getTime() &&
                              r.end.getTime() === req.end.getTime() &&
                              r.type === req.type &&
                              r.status === req.status,
                          );
                          setDebugSelectedRequestIndex(
                            index >= 0 ? index : 0,
                          );
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </div>
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
                  Reload history
                </Button>
              </CardFooter>
            </Card>

            {/* Upcoming Public Holidays */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  Public holidays
                </CardTitle>
                <CardDescription>
                  Bank and mandatory closures within this holiday year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publicHolidayList.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No public holidays in this holiday year.
                    </p>
                  )}
                  {publicHolidayList.map((holiday, i) => (
                    <div
                      key={`${holiday.label}-${i}`}
                      className="flex items-center gap-3"
                    >
                      <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {holiday.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {holiday.date.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0"
                      >
                        Public
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Dialog */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Book time off</DialogTitle>
              <DialogDescription>
                Request leave for your contracted working days within the
                selected holiday year.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled
                  >
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    {date ? format(date, "PPP") : "Select date from calendar"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50 text-sm">
                    1 day
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Leave type</Label>
                <RadioGroup
                  value={leaveType}
                  onValueChange={setLeaveType}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="annual"
                      id="annual"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="annual"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Palmtree className="mb-2 h-6 w-6" />
                      Annual leave
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="sick"
                      id="sick"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="sick"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Info className="mb-2 h-6 w-6" />
                      Other / Sick
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add any comments for your manager..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsBookingOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookHoliday}
                disabled={submissionStatus === "loading" || !date}
              >
                {submissionStatus === "loading"
                  ? "Submitting..."
                  : "Submit request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Debug Drawer */}
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l bg-background shadow-2xl transition-transform duration-300",
            debugOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-12 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                Holidays debug console
              </span>
              <Badge variant="outline" className="ml-2 text-[10px]">
                Technical view
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setDebugOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b px-4 py-2 gap-2">
            <div className="flex flex-wrap gap-1">
              <DebugTabButton
                label="Overview"
                icon={ActivityIcon}
                active={debugTab === "overview"}
                onClick={() => setDebugTab("overview")}
              />
              <DebugTabButton
                label="Entitlement"
                icon={Database}
                active={debugTab === "entitlement"}
                onClick={() => setDebugTab("entitlement")}
              />
              <DebugTabButton
                label="History"
                icon={ListTree}
                active={debugTab === "history"}
                onClick={() => setDebugTab("history")}
              />
              <DebugTabButton
                label="Requests"
                icon={Palmtree}
                active={debugTab === "requests"}
                onClick={() => setDebugTab("requests")}
              />
              <DebugTabButton
                label="Raw"
                icon={FileCode2}
                active={debugTab === "raw"}
                onClick={() => setDebugTab("raw")}
              />
            </div>

            {debugTab === "requests" && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    className="h-8 w-40 rounded-md border bg-muted px-6 text-xs"
                    placeholder="Filter requests..."
                    value={debugFilter}
                    onChange={(e) => setDebugFilter(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="h-[calc(100vh-3rem)]">
            <div className="p-4 space-y-4 text-xs">
              {debugTab === "overview" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ActivityIcon className="h-4 w-4 text-primary" />
                    Runtime overview
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <DebugMetric label="Holiday year" value={debugMetrics.holidayYear} />
                    <DebugMetric
                      label="Cycle start"
                      value={debugMetrics.cycleStart}
                    />
                    <DebugMetric
                      label="Cycle end"
                      value={debugMetrics.cycleEnd}
                    />
                    <DebugMetric
                      label="Working days"
                      value={debugMetrics.workingDayIds.join(", ")}
                    />
                    <DebugMetric
                      label="Booked dates"
                      value={debugMetrics.bookedCount}
                    />
                    <DebugMetric
                      label="Public holidays"
                      value={debugMetrics.publicHolidayCount}
                    />
                    <DebugMetric
                      label="Normalised requests"
                      value={debugMetrics.requestCount}
                    />
                    <DebugMetric
                      label="Submission status"
                      value={submissionStatus}
                    />
                  </div>
                </div>
              )}

              {debugTab === "entitlement" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Entitlement payload
                  </h3>
                  {entitlement ? (
                    <pre className="rounded-md bg-muted p-3 text-[11px] leading-relaxed overflow-x-auto">
                      {safeStringify(entitlement)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">
                      Entitlement not loaded.
                    </p>
                  )}
                </div>
              )}

              {debugTab === "history" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ListTree className="h-4 w-4 text-primary" />
                    Raw history rows
                  </h3>
                  {history && history.length > 0 ? (
                    <pre className="rounded-md bg-muted p-3 text-[11px] leading-relaxed overflow-x-auto">
                      {safeStringify(history)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">
                      No history records available.
                    </p>
                  )}
                </div>
              )}

              {debugTab === "requests" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Palmtree className="h-4 w-4 text-primary" />
                    Normalised requests
                  </h3>
                  {filteredDebugRequests.length === 0 ? (
                    <p className="text-muted-foreground">
                      No requests matched the current filter.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredDebugRequests.map((req, index) => {
                        const active = index === debugSelectedRequestIndex;
                        return (
                          <button
                            key={`${req.start.toISOString()}-${index}`}
                            type="button"
                            onClick={() =>
                              setDebugSelectedRequestIndex((prev) =>
                                prev === index ? null : index,
                              )
                            }
                            className={cn(
                              "w-full text-left rounded-md border px-3 py-2 text-[11px] transition-colors",
                              active
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted",
                            )}
                          >
                            <div className="flex justify-between gap-2">
                              <span className="font-semibold">
                                {format(req.start, "dd/MM/yyyy")}
                                {req.end > req.start &&
                                  ` – ${format(req.end, "dd/MM/yyyy")}`}
                              </span>
                              <span className="uppercase text-[10px] text-muted-foreground">
                                {req.source}
                              </span>
                            </div>
                            <div className="flex justify-between gap-2 mt-1">
                              <span>
                                {req.days} day{req.days !== 1 ? "s" : ""} •{" "}
                                {req.type}
                              </span>
                              <span>{req.status}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedDebugRequest && (
                    <div className="space-y-2 pt-3 border-t">
                      <h4 className="text-xs font-semibold flex items-center gap-2">
                        <Eye className="h-3 w-3 text-primary" />
                        Selected request details
                      </h4>
                      <pre className="rounded-md bg-muted p-3 text-[11px] leading-relaxed overflow-x-auto">
                        {safeStringify(selectedDebugRequest.raw)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {debugTab === "raw" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-primary" />
                      Redux slice state
                    </h3>
                    <pre className="mt-2 rounded-md bg-muted p-3 text-[11px] leading-relaxed overflow-x-auto">
                      {safeStringify({
                        entitlement,
                        history,
                        submissionStatus,
                        submissionError,
                      })}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------
   Debug helpers
------------------------------------------------------------------ */

function DebugTabButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] border transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function DebugMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border bg-muted/40 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold truncate">{String(value)}</p>
    </div>
  );
}
