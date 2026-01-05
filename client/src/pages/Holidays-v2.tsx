

import { Layout } from "@/components/Layout";
import { holidayStats as initialHolidayStats } from "@/lib/mockData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Palmtree,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { eachDayOfInterval, format, isAfter, isBefore } from "date-fns";

type BookingStatus = "Approved" | "Pending" | "Rejected";
type BookingType = "Annual Leave" | "Christmas" | "Bank Holiday";

interface Booking {
  id: number;
  from: Date;
  to: Date;
  type: BookingType;
  status: BookingStatus;
  workingDays: number; // counted based on contract
}

// --- CONFIG: Working pattern from contract ---
// 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
// Example: contract is Tue & Wed only.
const WORKING_DAYS: number[] = [2, 3];

const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getWorkingDaysInRange = (from: Date, to: Date) => {
  const days = eachDayOfInterval({ start: from, end: to });
  return days.filter((d) => WORKING_DAYS.includes(d.getDay()));
};

export default function Holidays() {
  const [stats, setStats] = useState(initialHolidayStats);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [leaveType, setLeaveType] = useState<BookingType>("Annual Leave");

  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 1,
      from: new Date("2025-12-24"),
      to: new Date("2025-12-31"),
      type: "Christmas",
      status: "Approved",
      workingDays: getWorkingDaysInRange(
        new Date("2025-12-24"),
        new Date("2025-12-31")
      ).length,
    },
  ]);

  const totalEntitlement =
    stats.taken + stats.remaining + (stats.pending ?? 0);

  const data = [
    { name: "Taken", value: stats.taken, color: "var(--chart-2)" },
    { name: "Remaining", value: stats.remaining, color: "var(--chart-4)" },
    { name: "Pending", value: stats.pending ?? 0, color: "var(--chart-5)" },
  ];

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentSelectionWorkingDays = useMemo(() => {
    if (!selectedRange.from || !selectedRange.to) return 0;
    return getWorkingDaysInRange(selectedRange.from, selectedRange.to).length;
  }, [selectedRange]);

  const modifiers = useMemo(() => {
    const approvedDates: Date[] = [];
    const pendingDates: Date[] = [];

    bookings.forEach((b) => {
      const dates = eachDayOfInterval({ start: b.from, end: b.to });
      dates.forEach((d) => {
        if (!WORKING_DAYS.includes(d.getDay())) return;
        if (b.status === "Approved") approvedDates.push(d);
        if (b.status === "Pending") pendingDates.push(d);
      });
    });

    return {
      approved: approvedDates,
      pending: pendingDates,
    };
  }, [bookings]);

  const handleBookTimeOff = () => {
    if (!selectedRange.from || !selectedRange.to) return;

    const from = selectedRange.from;
    const to = selectedRange.to;

    // Ensure from <= to
    const start = isAfter(from, to) ? to : from;
    const end = isAfter(from, to) ? from : to;

    const workingDays = getWorkingDaysInRange(start, end);
    const workingCount = workingDays.length;

    if (workingCount === 0) {
      alert("Your selection does not contain any of your working days.");
      return;
    }

    if (workingCount > stats.remaining) {
      alert(
        `You only have ${stats.remaining.toFixed(
          2
        )} days remaining. Please reduce the selection.`
      );
      return;
    }

    const newBooking: Booking = {
      id: Date.now(),
      from: start,
      to: end,
      type: leaveType,
      status: "Pending",
      workingDays: workingCount,
    };

    setBookings((prev) => [newBooking, ...prev]);
    setStats((prev) => ({
      ...prev,
      pending: (prev.pending ?? 0) + workingCount,
      remaining: prev.remaining - workingCount,
    }));

    // Reset selection
    setSelectedRange({});
  };

  const handleBookButtonScroll = () => {
    const el = document.getElementById("book-time-off-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">
              My Holidays &amp; Time Off
            </h1>
            <p className="text-muted-foreground mt-1">
              View your entitlement, see booked days, and request new leave.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">View Holiday Policy</Button>
            <Button className="gap-2" onClick={handleBookButtonScroll}>
              <Plane className="h-4 w-4" />
              Book Holiday
            </Button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: Calendar + booking form */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="h-full">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Holiday Calendar</CardTitle>
                  <CardDescription>
                    Only your contracted working days can be booked.
                  </CardDescription>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Working pattern:{" "}
                    <span className="font-medium">
                      {WORKING_DAYS.map((d) => dayNamesShort[d]).join(", ")}
                    </span>{" "}
                    • {WORKING_DAYS.length} day(s) per week
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-start md:items-end">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-500" />
                    Approved
                    <span className="h-3 w-3 rounded-sm bg-amber-100 border border-amber-500" />
                    Pending
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Only future dates on your working days are selectable.
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Calendar */}
                  <div className="flex-1">
                    <div className="relative rounded-xl border bg-card shadow-sm p-4">
                      {/* Sticky Month Header */}
                      <div className="sticky top-0 z-10 bg-card pb-3 border-b mb-3 flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-muted"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() - 1,
                                1
                              )
                            )
                          }
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <div className="text-base font-semibold tracking-wide">
                          {format(calendarMonth, "MMMM yyyy")}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-muted"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() + 1,
                                1
                              )
                            )
                          }
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Google Calendar–style grid */}
                      <Calendar
                        mode="range"
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        selected={selectedRange}
                        onSelect={(range) => setSelectedRange(range ?? {})}
                        disabled={(date) => {
                          const d = new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate()
                          );
                          const isNotWorkingDay = !WORKING_DAYS.includes(
                            d.getDay()
                          );
                          return isBefore(d, today) || isNotWorkingDay;
                        }}
                        modifiers={modifiers}
                        modifiersClassNames={{
                          approved: "cal-approved",
                          pending: "cal-pending",
                        }}
                        className="holiday-calendar-grid rounded-md w-full max-w-full"
                        classNames={{
                          head_row: "grid grid-cols-7 mb-2",
                          head_cell:
                            "text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wide",
                          row: "grid grid-cols-7 mb-1",
                          cell: "relative w-full h-12 flex items-center justify-center",
                          day: "day h-9 w-9 flex items-center justify-center rounded-md text-xs font-normal hover:bg-accent aria-selected:opacity-100 transition",
                          day_selected:
                            "bg-primary text-primary-foreground font-semibold shadow-sm",
                          day_range_middle:
                            "bg-accent text-accent-foreground rounded-md",
                          day_today: "cal-today",
                          day_disabled:
                            "cal-disabled text-muted-foreground/70 cursor-not-allowed",
                        }}
                      />
                    </div>
                  </div>

                  {/* Booking side panel */}
                  <div
                    id="book-time-off-section"
                    className="w-full lg:w-80 space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <Palmtree className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Book time off</p>
                        <p className="text-xs text-muted-foreground">
                          Selected dates calculate only your working days.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm rounded-xl border bg-muted/40 p-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Selected range
                        </p>
                        {selectedRange.from && selectedRange.to ? (
                          <p className="text-sm font-medium">
                            {format(selectedRange.from, "dd MMM yyyy")} –{" "}
                            {format(selectedRange.to, "dd MMM yyyy")}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Click on the calendar to choose a start and end
                            date.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Working days in selection
                        </span>
                        <span className="font-semibold">
                          {currentSelectionWorkingDays}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Type of leave
                        </label>
                        <select
                          value={leaveType}
                          onChange={(e) =>
                            setLeaveType(e.target.value as BookingType)
                          }
                          className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                        >
                          <option>Annual Leave</option>
                          <option>Christmas</option>
                          <option>Bank Holiday</option>
                        </select>
                      </div>

                      <Button
                        className="w-full mt-2 gap-2"
                        disabled={
                          !selectedRange.from ||
                          !selectedRange.to ||
                          currentSelectionWorkingDays === 0
                        }
                        onClick={handleBookTimeOff}
                      >
                        <CalendarDays className="h-4 w-4" />
                        Submit Holiday Request
                      </Button>

                      <p className="text-[11px] text-muted-foreground">
                        Your request will be sent to your line manager. Pending
                        days will be deducted from your remaining balance until
                        a decision is made.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requests list */}
            <Card>
              <CardHeader>
                <CardTitle>My Holiday Requests</CardTitle>
                <CardDescription>
                  Latest requests with status and working-day counts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have not requested any holidays yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 8).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm hover:bg-accent/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-md bg-primary/10 p-2 text-primary">
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {format(req.from, "dd MMM yyyy")} –{" "}
                              {format(req.to, "dd MMM yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {req.type} • {req.workingDays} working day
                              {req.workingDays !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            req.status === "Approved"
                              ? "default"
                              : req.status === "Pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Entitlement summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Holiday Entitlement</CardTitle>
                <CardDescription>Leave year 2025 / 2026</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {/* Pie chart */}
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Big numbers */}
                <div className="grid grid-cols-2 w-full gap-3 text-center">
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-[11px] uppercase text-muted-foreground">
                      Remaining
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.remaining.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">days</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-[11px] uppercase text-muted-foreground">
                      Taken (approved)
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.taken.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">days</p>
                  </div>
                </div>

                {/* Breakdown list */}
                <div className="w-full mt-2 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Total entitlement (incl. bank &amp; Christmas)
                    </span>
                    <span className="font-semibold">
                      {totalEntitlement.toFixed(2)} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Pending requests
                    </span>
                    <span className="font-semibold">
                      {(stats.pending ?? 0).toFixed(2)} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Contracted working days
                    </span>
                    <span className="font-semibold">
                      {WORKING_DAYS.length} day(s) / week
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                    <strong>How this works:</strong> your entitlement is
                    pro-rated based on your {WORKING_DAYS.length}-day working
                    week. Only days that fall on your working pattern reduce
                    your balance. Bank and company closure days falling outside
                    your working days do not reduce your allowance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
