import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useState, useMemo } from "react";
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
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*                            MOCK DATA                               */
/* ------------------------------------------------------------------ */

const teamMembers = [
  { id: "1", name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?img=1", status: "Present", clockIn: "09:00 AM", holidayBalance: 12 },
  { id: "2", name: "Bob Smith", avatar: "https://i.pravatar.cc/150?img=2", status: "On Leave", clockIn: "On Leave", holidayBalance: 8 },
  { id: "3", name: "Carol White", avatar: "https://i.pravatar.cc/150?img=3", status: "On Leave", clockIn: "On Leave", holidayBalance: 15 },
  { id: "4", name: "David Brown", avatar: "https://i.pravatar.cc/150?img=4", status: "On Leave", clockIn: "On Leave", holidayBalance: 10 },
  { id: "5", name: "Emily Blunt", avatar: "https://i.pravatar.cc/150?img=5", status: "On Leave", clockIn: "On Leave", holidayBalance: 5 },
  { id: "6", name: "Frank Wilson", avatar: "https://i.pravatar.cc/150?img=6", status: "On Leave", clockIn: "On Leave", holidayBalance: 14 },
  { id: "7", name: "Grace Lee", avatar: "https://i.pravatar.cc/150?img=7", status: "On Leave", clockIn: "On Leave", holidayBalance: 9 },
  { id: "8", name: "Henry Zhang", avatar: "https://i.pravatar.cc/150?img=8", status: "On Leave", clockIn: "On Leave", holidayBalance: 11 },
  { id: "9", name: "Iris Martinez", avatar: "https://i.pravatar.cc/150?img=9", status: "On Leave", clockIn: "On Leave", holidayBalance: 6 },
  { id: "10", name: "Jack Thompson", avatar: "https://i.pravatar.cc/150?img=10", status: "On Leave", clockIn: "On Leave", holidayBalance: 13 },
  { id: "11", name: "Kate Anderson", avatar: "https://i.pravatar.cc/150?img=11", status: "On Leave", clockIn: "On Leave", holidayBalance: 7 },
  { id: "12", name: "Liam O'Brien", avatar: "https://i.pravatar.cc/150?img=12", status: "On Leave", clockIn: "On Leave", holidayBalance: 10 },
];

const generateLeaveEvents = () => {
  return [
    // December 2025
    { id: "1", userId: "1", name: "Alice Johnson", type: "Full Day", status: "Approved", start: "2025-12-15", end: "2025-12-18" },
    { id: "1", userId: "1", name: "Alice Johnson", type: "Full Day", status: "Approved", start: "2025-12-15", end: "2025-12-18" },
    { id: "1", userId: "1", name: "Alice Johnson", type: "Full Day", status: "Approved", start: "2025-12-15", end: "2025-12-18" },
    
    { id: "2", userId: "2", name: "Bob Smith", type: "Half Day AM", status: "Approved", start: "2025-12-09", end: "2025-12-11" },
    { id: "3", userId: "3", name: "Carol White", type: "Full Day", status: "Pending", start: "2025-12-20", end: "2025-12-22" },
    { id: "4", userId: "4", name: "David Brown", type: "Half Day PM", status: "Approved", start: "2025-12-10", end: "2025-12-12" },
    { id: "5", userId: "5", name: "Emily Blunt", type: "Full Day", status: "Approved", start: "2025-12-25", end: "2025-12-26" },
    { id: "16", userId: "1", name: "Alice Johnson", type: "Full Day", status: "Approved", start: "2025-12-09", end: "2025-12-09" },
    // January 2026
    { id: "6", userId: "1", name: "Alice Johnson", type: "Full Day", status: "Approved", start: "2026-01-05", end: "2026-01-09" },
    { id: "7", userId: "2", name: "Bob Smith", type: "Full Day", status: "Pending", start: "2026-01-15", end: "2026-01-17" },
    { id: "8", userId: "3", name: "Carol White", type: "Full Day", status: "Approved", start: "2026-01-20", end: "2026-01-23" },
    { id: "9", userId: "4", name: "David Brown", type: "Half Day AM", status: "Approved", start: "2026-01-10", end: "2026-01-10" },
    { id: "10", userId: "5", name: "Emily Blunt", type: "Full Day", status: "Approved", start: "2026-01-25", end: "2026-01-28" },
    // February 2026
    { id: "11", userId: "1", name: "Alice Johnson", type: "Full Day", status: "Approved", start: "2026-02-02", end: "2026-02-06" },
    { id: "12", userId: "2", name: "Bob Smith", type: "Half Day PM", status: "Approved", start: "2026-02-14", end: "2026-02-14" },
    { id: "13", userId: "3", name: "Carol White", type: "Full Day", status: "Pending", start: "2026-02-18", end: "2026-02-20" },
    { id: "14", userId: "4", name: "David Brown", type: "Full Day", status: "Approved", start: "2026-02-08", end: "2026-02-12" },
    { id: "15", userId: "5", name: "Emily Blunt", type: "Full Day", status: "Approved", start: "2026-02-23", end: "2026-02-26" },
  ];
};

const analyticsData = [
  { month: "Jul", late: 3 },
  { month: "Aug", late: 5 },
  { month: "Sep", late: 2 },
  { month: "Oct", late: 4 },
  { month: "Nov", late: 6 },
  { month: "Dec", late: 2 },
];

/* ------------------------------------------------------------------ */
/*                         HELPER FUNCTIONS                           */
/* ------------------------------------------------------------------ */

const getStatusColors = (status: string) => {
  switch (status) {
    case "Approved":
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        border: "border-green-300 dark:border-green-800",
        text: "text-green-800 dark:text-green-200",
        dot: "bg-green-600",
      };
    case "Pending":
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        border: "border-yellow-300 dark:border-yellow-800",
        text: "text-yellow-800 dark:text-yellow-200",
        dot: "bg-yellow-500",
      };
    case "Rejected":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        border: "border-red-300 dark:border-red-800",
        text: "text-red-800 dark:text-red-200",
        dot: "bg-red-600",
      };
    default:
      return {
        bg: "bg-muted",
        border: "border-muted",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground",
      };
  }
};

const getTypeBadge = (type: string) => {
  if (type === "Full Day") return "FD";
  if (type === "Half Day AM") return "AM";
  if (type === "Half Day PM") return "PM";
  return type;
};

type LeaveEvent = {
  id: string;
  userId: string;
  name: string;
  type: string;
  status: string;
  start: string;
  end: string;
};

type WeekSegment = {
  event: LeaveEvent;
  startCol: number; // 0..6
  span: number;
  row: number; // stacked row index
  isRealStart: boolean;
};

/* Build segments for a single week (Google Calendar style bars). */
const buildWeekSegments = (events: LeaveEvent[], weekDays: Date[]): { segments: WeekSegment[]; rows: number } => {
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const raw: Omit<WeekSegment, "row">[] = [];

  events.forEach((ev) => {
    const evStart = parseISO(ev.start);
    const evEnd = parseISO(ev.end);

    if (isAfter(evStart, weekEnd) || isBefore(evEnd, weekStart)) return;

    const segStart = isBefore(evStart, weekStart) ? weekStart : evStart;
    const segEnd = isAfter(evEnd, weekEnd) ? weekEnd : evEnd;

    const startCol = differenceInCalendarDays(segStart, weekStart); // 0..6
    const endCol = differenceInCalendarDays(segEnd, weekStart); // 0..6
    const span = endCol - startCol + 1;

    raw.push({
      event: ev,
      startCol,
      span,
      isRealStart: isSameDay(evStart, segStart),
    });
  });

  raw.sort((a, b) => a.startCol - b.startCol || b.span - a.span);

  const rowEnd: number[] = [];
  const segments: WeekSegment[] = [];

  raw.forEach((seg) => {
    const segEndCol = seg.startCol + seg.span - 1;
    let rowIdx = 0;
    for (; rowIdx < rowEnd.length; rowIdx++) {
      if (seg.startCol > rowEnd[rowIdx]) break;
    }
    if (rowIdx === rowEnd.length) {
      rowEnd.push(segEndCol);
    } else {
      rowEnd[rowIdx] = segEndCol;
    }

    segments.push({
      ...seg,
      row: rowIdx,
    });
  });

  return {
    segments,
    rows: rowEnd.length,
  };
};

/* ------------------------------------------------------------------ */
/*                          MAIN COMPONENT                            */
/* ------------------------------------------------------------------ */

export default function ManagerTeamCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 9));
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null);
  const [filters, setFilters] = useState({
    statuses: ["Approved", "Pending", "Rejected"],
    types: ["Full Day", "Half Day AM", "Half Day PM"],
  });
  const [clockInModal, setClockInModal] = useState<any | null>(null);
  const { toast } = useToast();

  const teamLeaveEvents = generateLeaveEvents();

  /* ---------------------------- FILTERING ---------------------------- */

  const filteredEvents = useMemo(() => {
    return teamLeaveEvents.filter((event) => {
      const statusMatch = filters.statuses.includes(event.status);
      const typeMatch = filters.types.includes(event.type);
      return statusMatch && typeMatch;
    });
  }, [filters]);

  /* ----------------------------- CALENDAR ---------------------------- */

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => {
      const start = parseISO(event.start);
      const end = parseISO(event.end);
      return isWithinInterval(day, { start, end });
    });
  };

  /* --------------------------- NAVIGATION ---------------------------- */

  const nextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const prevPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const today = () => setCurrentDate(new Date(2025, 11, 9));

  /* --------------------------- ACTIONS ------------------------------- */

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
    const member = teamMembers.find((m) => m.id === employeeId);
    if (member) {
      member.status = "Present";
      member.clockIn = time;
      toast({
        title: "Clock In Recorded",
        description: `${member.name} has been clocked in at ${time}.`,
      });
      setClockInModal(null);
    }
  };

  const handleSendReminder = (employeeId: string) => {
    const member = teamMembers.find((m) => m.id === employeeId);
    if (member) {
      toast({
        title: "Reminder Sent",
        description: `A clock-in reminder has been sent to ${member.name}.`,
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

  /* ------------------------- MONTH VIEW ------------------------------ */

  const SEGMENT_HEIGHT = 22;
  const SEGMENT_GAP = 4;
  const SEGMENT_TOP_OFFSET = 26; // below date number

  const renderMonth = () => {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Weekday header */}
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

          {/* Weeks (Google Calendar style) */}
          <div className="space-y-4 p-2">
            {weeks.map((weekDays, weekIndex) => {
              const { segments, rows } = buildWeekSegments(filteredEvents, weekDays);
              const extraHeight = rows > 0 ? rows * (SEGMENT_HEIGHT + SEGMENT_GAP) : 0;

              return (
                <div key={weekIndex} className="relative">
                  {/* Day grid */}
                  <div className="grid grid-cols-7">
                    {weekDays.map((day) => {
                      const inCurrentMonth = isSameMonth(day, currentDate);
                      const isCurrentDay = isSameDay(day, new Date(2025, 11, 9));
                      const eventsCount = getEventsForDay(day).length;

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "min-h-[78px] border p-1 align-top overflow-hidden",
                            !inCurrentMonth && "bg-muted/10 text-muted-foreground"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={cn(
                                "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground/70"
                              )}
                            >
                              {format(day, "d")}
                            </span>
                            {eventsCount > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] px-1 py-0 h-4 leading-none mt-0.5"
                              >
                                {eventsCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Event bar overlay (absolute) */}
                  {segments.length > 0 && (
                    <div className="absolute inset-x-0 pointer-events-none" style={{ top: SEGMENT_TOP_OFFSET }}>
                      <div className="grid grid-cols-7">
                        {segments.map((seg, idx) => {
                          const colors = getStatusColors(seg.event.status);
                          const gridColumn = `${seg.startCol + 1} / span ${seg.span}`;
                          const displayName = seg.isRealStart
                            ? seg.event.name.split(" ")[0]
                            : "●●";

                          return (
                            <div
                              key={`${seg.event.id}-${weekIndex}-${idx}`}
                              style={{ gridColumn }}
                              className="relative"
                            >
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => setSelectedEvent(seg.event)}
                                className={cn(
                                  "flex items-center gap-1 rounded-md px-2 text-[11px] font-medium shadow-sm cursor-pointer truncate",
                                  colors.bg,
                                  colors.border,
                                  colors.text,
                                  seg.event.status === "Pending" && "border-dashed"
                                )}
                                style={{
                                  height: SEGMENT_HEIGHT,
                                  marginTop: seg.row * (SEGMENT_HEIGHT + SEGMENT_GAP),
                                  pointerEvents: "auto",
                                }}
                              >
                                <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
                                <span className="truncate">{displayName}</span>
                                <span className="ml-auto text-[9px] opacity-80">
                                  {getTypeBadge(seg.event.type)}
                                </span>
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Spacer to make room for stacked bars */}
                  {rows > 0 && <div style={{ height: extraHeight }} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  /* -------------------------- WEEK VIEW ------------------------------ */

  const renderWeek = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {weekDays.map((day) => (
                  <div key={day.toString()} className="p-3 text-center border-r">
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
                {weekDays.map((day) => {
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
                                event.status === "Pending" && "border-dashed opacity-80"
                              )}
                            >
                              <div className={cn("h-2 w-2 rounded-full", colors.dot)} />
                              <span className="font-semibold">{event.name.split(" ")[0]}</span>
                              <span className="text-[10px] opacity-75 mt-0">
                                {getTypeBadge(event.type)}
                              </span>
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

  /* -------------------------- LIST VIEW ------------------------------ */

  const renderList = () => (
    <Card>
      <CardHeader>
        <CardTitle>Holiday Requests</CardTitle>
        <CardDescription>All leave requests for the selected period</CardDescription>
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
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{event.name[0]}</AvatarFallback>
                        </Avatar>
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
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {getTypeBadge(event.type)}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[10px] px-2 py-0.5",
                          event.status === "Approved" && "bg-green-100 text-green-800",
                          event.status === "Pending" && "bg-yellow-100 text-yellow-800",
                          event.status === "Rejected" && "bg-red-100 text-red-800"
                        )}
                      >
                        {event.status}
                      </Badge>
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

  /* ------------------------------------------------------------------ */
  /*                                JSX                                 */
  /* ------------------------------------------------------------------ */

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Team Calendar & Attendance</h1>
            <p className="text-muted-foreground mt-1">
              Manage team holidays, track attendance, and monitor schedule adherence.
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
          {/* Main column */}
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

            {/* Lateness Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lateness Trends</CardTitle>
                <CardDescription>Late arrivals tracking over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
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

          {/* Right sidebar */}
          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today's Overview</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {format(new Date(2025, 11, 9), "EEEE, d MMM yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold">
                      {teamMembers.filter((m) => m.status !== "On Leave").length}
                    </span>
                    <p className="text-xs opacity-80 uppercase mt-1">In Office</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold">
                      {filteredEvents.filter((e) =>
                        isSameDay(parseISO(e.start), new Date(2025, 11, 9))
                      ).length}
                    </span>
                    <p className="text-xs opacity-80 uppercase mt-1">Away</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Away Today */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Away Today
                  <Badge variant="secondary">
                    {
                      filteredEvents.filter((e) => {
                        const start = parseISO(e.start);
                        const end = parseISO(e.end);
                        return isWithinInterval(new Date(2025, 11, 9), { start, end });
                      }).length
                    }
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredEvents
                  .filter((e) => {
                    const start = parseISO(e.start);
                    const end = parseISO(e.end);
                    return isWithinInterval(new Date(2025, 11, 9), { start, end });
                  })
                  .map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-all"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{event.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden min-w-0">
                        <p className="text-sm font-medium truncate">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{event.type}</p>
                      </div>
                      <Badge
                        variant={event.status === "Pending" ? "outline" : "secondary"}
                        className="text-[10px] shrink-0"
                      >
                        {event.status === "Pending" ? "Pending" : "Away"}
                      </Badge>
                    </motion.div>
                  ))}
                {filteredEvents.filter((e) => {
                  const start = parseISO(e.start);
                  const end = parseISO(e.end);
                  return isWithinInterval(new Date(2025, 11, 9), { start, end });
                }).length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No one away today
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Clocked In */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Clocked In
                  <Badge
                    variant="outline"
                    className="text-green-600 bg-green-50 border-green-200"
                  >
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 group">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                          member.status === "Late" ? "bg-red-500" : "bg-green-500"
                        )}
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p
                        className={cn(
                          "text-xs",
                          member.status === "Late"
                            ? "text-red-500 font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {member.clockIn}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setClockInModal({
                              memberId: member.id,
                              memberName: member.name,
                              type: "clockin",
                            })
                          }
                        >
                          <Clock className="mr-2 h-4 w-4" /> Manual Clock In
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setClockInModal({
                              memberId: member.id,
                              memberName: member.name,
                              type: "reminder",
                            })
                          }
                        >
                          <MessageSquare className="mr-2 h-4 w-4" /> Send Reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Lateness Insight */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lateness Insight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Team Average</span>
                  <span className="font-bold">2.1%</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Worst Day</span>
                  <span className="font-medium text-foreground">Monday</span>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 dark:text-red-200 leading-snug">
                    <strong>Attention Needed:</strong> Emily Blunt has been late 3 times this month.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Details Modal */}
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
                      <h2 className="text-2xl font-bold">{selectedEvent.name}</h2>
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
                        <p className="text-xs text-muted-foreground uppercase font-semibold">From</p>
                        <p className="text-sm font-medium mt-1">
                          {format(parseISO(selectedEvent.start), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">To</p>
                        <p className="text-sm font-medium mt-1">
                          {format(parseISO(selectedEvent.end), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
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
                        <p className="text-xs text-amber-700 dark:text-amber-300">Remaining</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-200 mt-1">
                          8
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">Total Allocated</p>
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
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-base">
                          {selectedEvent.name[0]}
                        </AvatarFallback>
                      </Avatar>
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
                    {clockInModal.type === "clockin" ? "Manual Clock In" : "Send Reminder"}
                  </h2>
                  <p className="text-green-100 mt-1">{clockInModal.memberName}</p>
                </div>

                <div className="p-6 space-y-4">
                  {clockInModal.type === "clockin" ? (
                    <>
                      <div>
                        <label className="text-sm font-medium">Clock In Time</label>
                        <input
                          type="time"
                          defaultValue="09:00"
                          id="clockInTime"
                          className="w-full mt-2 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Notes (Optional)</label>
                        <textarea
                          placeholder="Add any notes..."
                          className="w-full mt-2 p-2 border rounded-lg bg-background text-sm resize-none h-20"
                        />
                      </div>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          const time =
                            (document.getElementById("clockInTime") as HTMLInputElement)?.value ||
                            "09:00";
                          handleManualClockIn(clockInModal.memberId, time + " AM");
                        }}
                      >
                        <CheckCheck className="mr-2 h-4 w-4" /> Confirm Clock In
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/40">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          A reminder will be sent to <strong>{clockInModal.memberName}</strong> to
                          clock in.
                        </p>
                      </div>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleSendReminder(clockInModal.memberId)}
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
