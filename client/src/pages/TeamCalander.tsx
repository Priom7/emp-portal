// ManagerTeamCalander-v3.tsx
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartAvatar } from "@/components/SmartAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  CalendarDays,
  X,
  MessageSquare,
  User,
  TrendingUp,
  Send,
  CheckCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isWithinInterval,
  isBefore,
  isAfter,
  differenceInCalendarDays,
} from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTeamCalendar,
  selectTeamCalendar,
  selectTeamStatus,
  selectTeamError,
} from "@/features/team/teamSlice";

const analyticsData = [
  { month: "Jul", late: 3 },
  { month: "Aug", late: 5 },
  { month: "Sep", late: 2 },
  { month: "Oct", late: 4 },
  { month: "Nov", late: 6 },
  { month: "Dec", late: 2 },
];

/* ----------------------------- Component ------------------------------ */

export default function ManagerTeamCalendar() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const calendarData = useAppSelector(selectTeamCalendar);
  const calendarStatus = useAppSelector(selectTeamStatus);
  const calendarError = useAppSelector(selectTeamError);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [filters, setFilters] = useState({
    statuses: ["Approved", "Pending", "Rejected"],
    types: ["Full Day", "Half Day AM", "Half Day PM"],
  });
  const [clockInModal, setClockInModal] = useState<any | null>(null);
  const { toast } = useToast();

  const holidays = calendarData.holidays || [];
  const employees = calendarData.employees || [];
  const attendances = calendarData.attendances || [];
  const isManager = true;

  useEffect(() => {
    if (isManager && user?.user_id) {
      dispatch(fetchTeamCalendar({ portal_user: user.user_id }));
    }
  }, [dispatch, isManager, user]);

  const teamLeaveEvents = useMemo(() => {
    return holidays.map((h: any, idx: number) => ({
      id: `${idx}-${h.employee_id}`,
      userId: h.employee_id?.toString(),
      name: `${h.first_name || ""} ${h.last_name || ""}`.trim(),
      type: h.holiday_type || "Full Day",
      status: h.status || "Planned",
      start: h.date_from,
      end: h.date_till,
    }));
  }, [holidays]);

  /* --------------------------- Filtered events -------------------------- */
  const filteredEvents = useMemo(() => {
    return teamLeaveEvents.filter((event) => {
      const statusMatch = filters.statuses.includes(event.status);
      const typeMatch = filters.types.includes(event.type);
      return statusMatch && typeMatch;
    });
  }, [filters, teamLeaveEvents]);

  /* --------------------------- Calendar setup -------------------------- */
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Create week start dates across the calendar grid
  const weeks = useMemo(() => {
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const w: Date[] = [];
    for (let i = 0; i < days.length; i += 7) {
      w.push(days[i]);
    }
    return w;
  }, [calendarStart, calendarEnd]);

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => {
      const start = parseISO(event.start);
      const end = parseISO(event.end);
      return isWithinInterval(day, { start, end });
    });
  };

  /* ---------------------------- Navigation ------------------------------ */
  const nextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const prevPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const today = () => setCurrentDate(new Date());

  /* ------------------------- Action handlers ---------------------------- */
  const handleApproveLeave = (eventId: string) => {
    const event = teamLeaveEvents.find((e) => e.id === eventId);
    if (event) {
      event.status = "Approved";
      toast({
        title: "Leave Approved",
        description: `${event.name}'s ${event.type} leave has been approved.`,
      });
      setSelectedEvent(null);
    }
  };

  const handleRejectLeave = (eventId: string) => {
    const event = teamLeaveEvents.find((e) => e.id === eventId);
    if (event) {
      event.status = "Rejected";
      toast({
        title: "Leave Rejected",
        description: `${event.name}'s ${event.type} leave has been rejected.`,
      });
      setSelectedEvent(null);
    }
  };

  const handleManualClockIn = (employeeId: string, time: string) => {
    const member = employees.find(
      (m: any) => m.employee_id?.toString() === employeeId
    );
    if (member) {
      toast({
        title: "Clock In Recorded",
        description: `${member.first_name} ${member.last_name} clocked in at ${time}.`,
      });
      setClockInModal(null);
    }
  };

  const handleSendReminder = (employeeId: string) => {
    const member = employees.find(
      (m: any) => m.employee_id?.toString() === employeeId
    );
    if (member) {
      toast({
        title: "Reminder Sent",
        description: `A clock-in reminder has been sent to ${member.first_name} ${member.last_name}.`,
      });
      setClockInModal(null);
    }
  };

  const toggleFilter = (filterType: "statuses" | "types", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((v: string) => v !== value)
        : [...prev[filterType], value],
    }));
  };

  const todayDateStr = format(new Date(), "yyyy-MM-dd");
  const isOnHolidayToday = (empId: string) => {
    return holidays.some((h: any) => {
      if (h.employee_id?.toString() !== empId) return false;
      const start = parseISO(h.date_from);
      const end = parseISO(h.date_till);
      return isWithinInterval(new Date(), { start, end });
    });
  };

  const hasAttendanceToday = (empId: string) => {
    return attendances.some(
      (a: any) =>
        a.scanned_by?.toString() === empId &&
        a.scanned &&
        a.scanned.startsWith(todayDateStr)
    );
  };
  const awayToday = useMemo(() => {
    return filteredEvents.filter((e) => {
      const start = parseISO(e.start);
      const end = parseISO(e.end);
      return isWithinInterval(new Date(), { start, end });
    });
  }, [filteredEvents]);

  const clockedTodayIds = useMemo(
    () =>
      new Set(
        attendances
          .filter((a: any) => a.scanned?.startsWith(todayDateStr))
          .map((a: any) => a.scanned_by?.toString())
      ),
    [attendances, todayDateStr]
  );

  const clockedToday = useMemo(
    () =>
      employees.filter(
        (m: any) =>
          clockedTodayIds.has(m.employee_id?.toString()) &&
          !isOnHolidayToday(m.employee_id?.toString())
      ),
    [employees, clockedTodayIds]
  );

  const notClocked = useMemo(
    () =>
      employees.filter(
        (m: any) =>
          !clockedTodayIds.has(m.employee_id?.toString()) &&
          !isOnHolidayToday(m.employee_id?.toString())
      ),
    [employees, clockedTodayIds]
  );

  const inOfficeCount = clockedToday.length;

  /* -------------------------- Colors & Badges --------------------------- */
  const getStatusColors = (status: string) => {
    switch (status) {
      case "Approved":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          border: "border-green-300 dark:border-green-800",
          text: "text-green-800 dark:text-green-200",
          dot: "bg-green-600",
          pillBg: "bg-green-600/10",
        };
      case "Pending":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          border: "border-yellow-300 dark:border-yellow-800",
          text: "text-yellow-800 dark:text-yellow-200",
          dot: "bg-yellow-500",
          pillBg: "bg-yellow-500/10",
        };
      case "Rejected":
        return {
          bg: "bg-red-100 dark:bg-red-900/30",
          border: "border-red-300 dark:border-red-800",
          text: "text-red-800 dark:text-red-200",
          dot: "bg-red-600",
          pillBg: "bg-red-600/10",
        };
      default:
        return {
          bg: "bg-muted",
          border: "border-muted",
          text: "text-muted-foreground",
          dot: "bg-muted-foreground",
          pillBg: "bg-muted-200",
        };
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "Full Day") return "FD";
    if (type === "Half Day AM") return "AM";
    if (type === "Half Day PM") return "PM";
    return type;
  };

  /* ----------------------- Week segment helpers ------------------------- */
  // For a given event and a week's start date, compute segment info
  const getSegmentsForWeek = (event: any, weekStartDate: Date) => {
    const evStart = parseISO(event.start);
    const evEnd = parseISO(event.end);

    const weekStart = weekStartDate;
    const weekEnd = addDays(weekStartDate, 6);

    // clamp to week boundaries
    const segStart = isBefore(evStart, weekStart) ? weekStart : evStart;
    const segEnd = isAfter(evEnd, weekEnd) ? weekEnd : evEnd;

    if (isAfter(segStart, segEnd)) return null;

    const startIndex = differenceInCalendarDays(segStart, weekStart); // 0..6
    const span = differenceInCalendarDays(segEnd, segStart) + 1; // 1..
    const isEventStartOnSegment = isSameDay(evStart, segStart);

    return {
      startIndex,
      span,
      segStart,
      segEnd,
      isEventStartOnSegment,
    };
  };

  // Pack segments vertically to avoid overlap within same week row.
  // Input: segments array [{ startIndex, span, event }]
  // Output: segments with .row (0..n)
  const packSegments = (segments: Array<any>) => {
    const rows: Array<Array<{ s: number; e: number }>> = [];
    const placed: Array<any> = [];

    segments.forEach((seg) => {
      const s = seg.startIndex;
      const e = seg.startIndex + seg.span - 1;
      // find first row without overlap
      let rowIndex = 0;
      for (; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const conflict = row.some((r) => !(e < r.s || s > r.e));
        if (!conflict) break;
      }
      // if new row needed
      if (rowIndex === rows.length) rows.push([]);
      rows[rowIndex].push({ s, e });
      placed.push({ ...seg, row: rowIndex });
    });

    return placed;
  };

  /* --------------------------- Render Month ---------------------------- */
  const renderMonth = () => {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="space-y-6 p-4">
            {weeks.map((weekStartDate, weekIdx) => {
              const days = eachDayOfInterval({
                start: weekStartDate,
                end: addDays(weekStartDate, 6),
              });

              // collect segments for events intersecting this week
              const rawSegments: Array<any> = [];
              filteredEvents.forEach((ev) => {
                const seg = getSegmentsForWeek(ev, weekStartDate);
                if (seg) {
                  rawSegments.push({
                    event: ev,
                    ...seg,
                  });
                }
              });

              // pack to rows to avoid overlap
              const packed = packSegments(rawSegments);

              // max rows determines container height for segments area
              const maxRows = Math.max(
                1,
                packed.reduce((acc, p) => Math.max(acc, p.row + 1), 0)
              );

              return (
                <div key={weekStartDate.toISOString()} className="relative">
                  {/* Grid: day-cells + segments as children */}
                  <div
                    className="grid grid-cols-7 gap-1 relative"
                    style={{ alignItems: "start" }}
                  >
                    {/* Day cells */}
                    {days.map((day) => {
                      const eventsForDay = getEventsForDay(day);
                      const inCurrentMonth = isSameMonth(day, currentDate);
                      const currentFlag = isToday(day);
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "min-h-[84px] border rounded-md p-2 bg-white",
                            !inCurrentMonth &&
                              "bg-muted/10 text-muted-foreground"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <span
                              className={cn(
                                "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                currentFlag
                                  ? "bg-primary text-primary-foreground"
                                  : "text-foreground/70"
                              )}
                            >
                              {format(day, "d")}
                            </span>
                            {eventsForDay.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-1.5"
                              >
                                {eventsForDay.length}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-2 space-y-1">
                            {/* small inline indicators (first two) */}
                            {eventsForDay.slice(0, 2).map((ev) => {
                              const colors = getStatusColors(ev.status);
                              return (
                                <div
                                  key={ev.id}
                                  onClick={() => setSelectedEvent(ev)}
                                  className={cn(
                                    "text-[10px] font-medium px-1 py-0.5 rounded-sm truncate cursor-pointer",
                                    colors.bg,
                                    colors.border,
                                    colors.text
                                  )}
                                >
                                  {ev.name.split(" ")[0]}{" "}
                                  <span className="ml-1 text-[9px] opacity-70">
                                    {getTypeBadge(ev.type)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Segments container uses same grid, segments are placed by gridColumn inline style */}
                    {packed.map((p, i) => {
                      const colors = getStatusColors(p.event.status);
                      // gridColumn: start / span
                      const gridColumn = `${p.startIndex + 1} / span ${p.span}`;
                      // vertical position: row index => translateY (rows * (segmentHeight + gap))
                      // We'll position using marginTop to stack segments visually above the day content.
                      const segHeight = 30; // px per row
                      const gap = 6;
                      const topOffset = -8 + p.row * (segHeight + gap); // adjust to place segments just above the cells content area
                      const isStart = p.isEventStartOnSegment;
                      const displayName = isStart
                        ? p.event.name.split(" ")[0]
                        : "●●";

                      return (
                        <div
                          key={`${p.event.id}-${weekIdx}-${i}`}
                          style={{ gridColumn }}
                          className="z-10 pointer-events-auto"
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelectedEvent(p.event)}
                            className={cn(
                              "rounded-md py-1 px-2 flex items-center gap-2 shadow-sm cursor-pointer overflow-hidden",
                              colors.bg,
                              colors.border,
                              colors.text,
                              p.event.status === "Pending" && "border-dashed"
                            )}
                            style={{
                              marginTop: topOffset,
                              height: segHeight,
                              alignItems: "center",
                            }}
                          >
                            <div
                              className={cn(
                                "h-2.5 w-2.5 rounded-full shrink-0",
                                colors.dot
                              )}
                            />
                            <div className="truncate font-semibold text-[13px]">
                              {displayName}
                            </div>
                            <Badge className="ml-auto px-1.5 py-0 text-[10px] rounded-sm bg-black/5 dark:bg-white/5">
                              {getTypeBadge(p.event.type)}
                            </Badge>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Provide spacing below each week to accommodate stacked segments */}
                  <div
                    style={{
                      height: Math.max(
                        0,
                        packed.reduce((a, b) => Math.max(a, b.row + 1), 0) * 36
                      ),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  /* --------------------------- Render Week ----------------------------- */
  const renderWeek = () => {
    const weekStart = startOfWeek(currentDate);
    const days = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {days.map((day) => (
                  <div
                    key={day.toString()}
                    className="p-3 text-center border-r"
                  >
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {format(day, "EEE")}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold mt-1",
                        isSameDay(day, new Date(2025, 11, 9)) && "text-blue-600"
                      )}
                    >
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-[minmax(150px,auto)]">
                {days.map((day) => {
                  const events = getEventsForDay(day);
                  return (
                    <div
                      key={day.toString()}
                      className="border-r border-b p-2 relative group hover:bg-accent/5 transition-colors"
                    >
                      <div className="space-y-2">
                        {events.map((event, i) => {
                          const colors = getStatusColors(event.status);
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => setSelectedEvent(event)}
                              className={cn(
                                "text-xs p-2 rounded-md font-medium border cursor-pointer hover:shadow-md transition-all flex items-center gap-2",
                                colors.bg,
                                colors.border,
                                colors.text,
                                event.status === "Pending" &&
                                  "border-dashed opacity-80"
                              )}
                            >
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  colors.dot
                                )}
                              />
                              <span className="font-semibold">
                                {event.name.split(" ")[0]}
                              </span>
                              <p className="text-[10px] opacity-75 mt-0">
                                {getTypeBadge(event.type)}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* --------------------------- Render List ----------------------------- */
  const renderList = () => (
    <Card>
      <CardHeader>
        <CardTitle>Holiday Requests</CardTitle>
        <CardDescription>
          All leave requests for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No leave requests found with current filters
            </p>
          ) : (
            filteredEvents.map((event) => {
              const colors = getStatusColors(event.status);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedEvent(event)}
                  className="p-4 rounded-lg border hover:border-primary hover:bg-accent/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <SmartAvatar src={""} name={"test"} size={50} />
                        <div>
                          <p className="font-semibold text-sm">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(event.start), "MMM d")} -{" "}
                            {format(parseISO(event.end), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5"
                      >
                        {getTypeBadge(event.type)}
                      </Badge>
                      <div>
                        <Badge
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            event.status === "Approved" &&
                              "bg-green-100 text-green-800",
                            event.status === "Pending" &&
                              "bg-yellow-100 text-yellow-800",
                            event.status === "Rejected" &&
                              "bg-red-100 text-red-800"
                          )}
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );

  /* ------------------------------ JSX --------------------------------- */
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">
              Team Calendar & Attendance
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage team holidays, track attendance, and monitor schedule
              adherence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download .ics
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Email to Me
            </Button>
            <Button>
              <CalendarDays className="mr-2 h-4 w-4" /> New Request
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main */}
          <div className="xl:col-span-3 space-y-6">
            {/* Controls */}
            <div className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg">
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={prevPeriod}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-bold w-32 text-center text-lg">
                    {format(currentDate, "MMMM yyyy")}
                  </span>
                  <Button variant="ghost" size="icon" onClick={nextPeriod}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={today}>
                  Today
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filters.statuses.includes("Approved")}
                    onCheckedChange={() => toggleFilter("statuses", "Approved")}
                  >
                    Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.statuses.includes("Pending")}
                    onCheckedChange={() => toggleFilter("statuses", "Pending")}
                  >
                    Pending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.statuses.includes("Rejected")}
                    onCheckedChange={() => toggleFilter("statuses", "Rejected")}
                  >
                    Rejected
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filters.types.includes("Full Day")}
                    onCheckedChange={() => toggleFilter("types", "Full Day")}
                  >
                    Full Day
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.types.includes("Half Day AM")}
                    onCheckedChange={() => toggleFilter("types", "Half Day AM")}
                  >
                    Half Day AM
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.types.includes("Half Day PM")}
                    onCheckedChange={() => toggleFilter("types", "Half Day PM")}
                  >
                    Half Day PM
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Views */}
            {viewMode === "month" && renderMonth()}
            {viewMode === "week" && renderWeek()}
            {viewMode === "list" && renderList()}

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Lateness Trends</CardTitle>
                <CardDescription>
                  Late arrivals tracking over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
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
                    <Tooltip />
                    <Bar
                      dataKey="late"
                      fill="hsl(var(--destructive))"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                      name="Late Arrivals"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today's Overview</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {format(new Date(), "EEEE, d MMM yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold">{inOfficeCount}</span>
                    <p className="text-xs opacity-80 uppercase mt-1">
                      In Office
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold">
                      {awayToday.length}
                    </span>
                    <p className="text-xs opacity-80 uppercase mt-1">Away</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Away Today
                  <Badge variant="secondary">{awayToday.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {awayToday.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-all"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <SmartAvatar src={""} name={"test"} size={50} />
                    <div className="flex-1 overflow-hidden min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.type}
                      </p>
                    </div>
                    <Badge
                      variant={
                        event.status === "Pending" ? "outline" : "secondary"
                      }
                      className="text-[10px] shrink-0"
                    >
                      {event.status === "Pending" ? "Pending" : "Away"}
                    </Badge>
                  </motion.div>
                ))}
                {awayToday.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No one away today
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Clocked In Office
                  <Badge
                    variant="outline"
                    className="text-green-600 bg-green-50 border-green-200"
                  >
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground uppercase text-xs">
                      Yes
                    </span>
                    <Badge className="bg-green-600 text-white hover:bg-green-700">
                      {clockedToday.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground uppercase text-xs">
                      No
                    </span>
                    <Badge className="bg-red-600 text-white hover:bg-red-700">
                      {notClocked.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {clockedToday.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No clock-ins yet today.
                    </p>
                  )}
                  {clockedToday.slice(0, 3).map((m: any, idx: number) => {
                    const avatarFallback =
                      `${m.first_name?.charAt(0) || ""}${
                        m.last_name?.charAt(0) || ""
                      }` || "EM";
                    const scanned = attendances
                      .find(
                        (a: any) =>
                          a.scanned_by?.toString() === m.employee_id?.toString()
                      )
                      ?.scanned?.slice(11, 16);
                    return (
                      <div
                        key={`clocked-${idx}`}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-green-50"
                      >
                        <SmartAvatar
                          src={""}
                          name={"test"}
                          size={50}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">
                            {m.first_name} {m.last_name}
                          </p>
                          <p className="text-xs text-green-700">
                            Clocked in at {scanned || "—"}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {notClocked.slice(0, 3).map((m: any, idx: number) => {
                    const avatarFallback =
                      `${m.first_name?.charAt(0) || ""}${
                        m.last_name?.charAt(0) || ""
                      }` || "EM";
                    return (
                      <div
                        key={`noclock-${idx}`}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50"
                      >
                        <SmartAvatar
                          src={""}
                          name={"test"}
                          size={50}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">
                            {m.first_name} {m.last_name}
                          </p>
                          <p className="text-xs text-red-600">
                            Clock in: not yet
                          </p>
                          <Button
                            size="sm"
                            className="mt-2 bg-cyan-600 hover:bg-cyan-700 text-white"
                            onClick={() =>
                              handleManualClockIn(
                                m.employee_id?.toString(),
                                format(new Date(), "HH:mm")
                              )
                            }
                          >
                            Manual clock in
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(clockedToday.length > 3 || notClocked.length > 3) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                  >
                    See more
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lateness Insight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Team Average
                  </span>
                  <span className="font-bold">2.1%</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    Worst Day
                  </span>
                  <span className="font-medium text-foreground">Monday</span>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 dark:text-red-200 leading-snug">
                    <strong>Attention Needed:</strong> Emily Blunt has been late
                    3 times this month.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card rounded-2xl shadow-2xl max-w-md w-full border overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedEvent.name}
                      </h2>
                      <p className="text-blue-100 mt-1">{selectedEvent.type}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedEvent(null)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">
                          From
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {format(parseISO(selectedEvent.start), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">
                          To
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {format(parseISO(selectedEvent.end), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">
                        Status
                      </p>
                      <Badge
                        className="mt-2"
                        variant={
                          selectedEvent.status === "Approved"
                            ? "default"
                            : selectedEvent.status === "Pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {selectedEvent.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-900/40">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                        Holiday Balance
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Remaining
                        </p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-200 mt-1">
                          8
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Total Allocated
                        </p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-200 mt-1">
                          20
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/40">
                    <p className="text-xs text-blue-700 dark:text-blue-300 uppercase font-semibold mb-3">
                      Employee Info
                    </p>
                    <div className="flex items-center gap-3 mb-4">
                      <SmartAvatar
                        src={""}
                        name={"test"}
                        size={50}
                      />

                      <div>
                        <p className="font-semibold">{selectedEvent.name}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          ID: {selectedEvent.userId}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedEvent(null)}
                    >
                      <User className="mr-2 h-4 w-4" /> View Profile
                    </Button>
                  </div>

                  {selectedEvent.status === "Pending" && (
                    <div className="space-y-3 pt-4 border-t">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveLeave(selectedEvent.id)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Leave
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleRejectLeave(selectedEvent.id)}
                      >
                        Reject Leave
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <Mail className="mr-2 h-4 w-4" /> Send Email
                    </Button>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clock In Modal */}
        <AnimatePresence>
          {clockInModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setClockInModal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card rounded-2xl shadow-2xl max-w-sm w-full border"
              >
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                  <h2 className="text-2xl font-bold">
                    {clockInModal.type === "clockin"
                      ? "Manual Clock In"
                      : "Send Reminder"}
                  </h2>
                  <p className="text-green-100 mt-1">
                    {clockInModal.memberName}
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {clockInModal.type === "clockin" ? (
                    <>
                      <div>
                        <label className="text-sm font-medium">
                          Clock In Time
                        </label>
                        <input
                          type="time"
                          defaultValue="09:00"
                          id="clockInTime"
                          className="w-full mt-2 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Notes (Optional)
                        </label>
                        <textarea
                          placeholder="Add any notes..."
                          className="w-full mt-2 p-2 border rounded-lg bg-background text-sm resize-none h-20"
                        />
                      </div>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          const time =
                            (
                              document.getElementById(
                                "clockInTime"
                              ) as HTMLInputElement
                            )?.value || "09:00";
                          handleManualClockIn(
                            clockInModal.memberId,
                            time + " AM"
                          );
                        }}
                      >
                        <CheckCheck className="mr-2 h-4 w-4" /> Confirm Clock In
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/40">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          A reminder will be sent to{" "}
                          <strong>{clockInModal.memberName}</strong> to clock
                          in.
                        </p>
                      </div>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleSendReminder(clockInModal.memberId)
                        }
                      >
                        <Send className="mr-2 h-4 w-4" /> Send Reminder
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setClockInModal(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
