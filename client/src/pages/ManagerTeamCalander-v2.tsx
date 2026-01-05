import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle2,
  List,
  Grid3X3,
  MoreHorizontal,
  CalendarDays,
  X,
  MessageSquare,
  User,
  TrendingUp,
  Send,
  CheckCheck
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
  isToday,
  parseISO,
  isWithinInterval,
  isBefore,
  isAfter
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Enhanced Mock Data
const teamMembers = [
  { id: '1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?img=1', status: 'Present', clockIn: '09:00 AM', holidayBalance: 12 },
  { id: '2', name: 'Bob Smith', avatar: 'https://i.pravatar.cc/150?img=2', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 8 },
  { id: '3', name: 'Carol White', avatar: 'https://i.pravatar.cc/150?img=3', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 15 },
  { id: '4', name: 'David Brown', avatar: 'https://i.pravatar.cc/150?img=4', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 10 },
  { id: '5', name: 'Emily Blunt', avatar: 'https://i.pravatar.cc/150?img=5', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 5 },
  { id: '6', name: 'Frank Wilson', avatar: 'https://i.pravatar.cc/150?img=6', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 14 },
  { id: '7', name: 'Grace Lee', avatar: 'https://i.pravatar.cc/150?img=7', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 9 },
  { id: '8', name: 'Henry Zhang', avatar: 'https://i.pravatar.cc/150?img=8', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 11 },
  { id: '9', name: 'Iris Martinez', avatar: 'https://i.pravatar.cc/150?img=9', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 6 },
  { id: '10', name: 'Jack Thompson', avatar: 'https://i.pravatar.cc/150?img=10', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 13 },
  { id: '11', name: 'Kate Anderson', avatar: 'https://i.pravatar.cc/150?img=11', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 7 },
  { id: '12', name: 'Liam O\'Brien', avatar: 'https://i.pravatar.cc/150?img=12', status: 'On Leave', clockIn: 'On Leave', holidayBalance: 10 },
];

const generateLeaveEvents = () => {
  const baseDate = new Date(2025, 11, 9);
  return [
    // December 2025
    { id: '1', userId: '1', name: 'Alice Johnson', type: 'Full Day', status: 'Approved', start: '2025-12-15', end: '2025-12-18' },
    { id: '2', userId: '2', name: 'Bob Smith', type: 'Half Day AM', status: 'Approved', start: '2025-12-09', end: '2025-12-11' },
    { id: '3', userId: '3', name: 'Carol White', type: 'Full Day', status: 'Pending', start: '2025-12-20', end: '2025-12-22' },
    { id: '4', userId: '4', name: 'David Brown', type: 'Half Day PM', status: 'Approved', start: '2025-12-10', end: '2025-12-12' },
    { id: '5', userId: '5', name: 'Emily Blunt', type: 'Full Day', status: 'Approved', start: '2025-12-25', end: '2025-12-26' },
    { id: '16', userId: '1', name: 'Alice Johnson', type: 'Full Day', status: 'Approved', start: '2025-12-09', end: '2025-12-' },
    // January 2026
    { id: '6', userId: '1', name: 'Alice Johnson', type: 'Full Day', status: 'Approved', start: '2026-01-05', end: '2026-01-09' },
    { id: '7', userId: '2', name: 'Bob Smith', type: 'Full Day', status: 'Pending', start: '2026-01-15', end: '2026-01-17' },
    { id: '8', userId: '3', name: 'Carol White', type: 'Full Day', status: 'Approved', start: '2026-01-20', end: '2026-01-23' },
    { id: '9', userId: '4', name: 'David Brown', type: 'Half Day AM', status: 'Approved', start: '2026-01-10', end: '2026-01-10' },
    { id: '10', userId: '5', name: 'Emily Blunt', type: 'Full Day', status: 'Approved', start: '2026-01-25', end: '2026-01-28' },
    // February 2026
    { id: '11', userId: '1', name: 'Alice Johnson', type: 'Full Day', status: 'Approved', start: '2026-02-02', end: '2026-02-06' },
    { id: '12', userId: '2', name: 'Bob Smith', type: 'Half Day PM', status: 'Approved', start: '2026-02-14', end: '2026-02-14' },
    { id: '13', userId: '3', name: 'Carol White', type: 'Full Day', status: 'Pending', start: '2026-02-18', end: '2026-02-20' },
    { id: '14', userId: '4', name: 'David Brown', type: 'Full Day', status: 'Approved', start: '2026-02-08', end: '2026-02-12' },
    { id: '15', userId: '5', name: 'Emily Blunt', type: 'Full Day', status: 'Approved', start: '2026-02-23', end: '2026-02-26' },
  ];
};

const analyticsData = [
  { month: 'Jul', late: 3 },
  { month: 'Aug', late: 5 },
  { month: 'Sep', late: 2 },
  { month: 'Oct', late: 4 },
  { month: 'Nov', late: 6 },
  { month: 'Dec', late: 2 },
];

export default function ManagerTeamCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 9));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    statuses: ['Approved', 'Pending', 'Rejected'],
    types: ['Full Day', 'Half Day AM', 'Half Day PM']
  });
  const [clockInModal, setClockInModal] = useState(null);
  const { toast } = useToast();

  const teamLeaveEvents = generateLeaveEvents();

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return teamLeaveEvents.filter(event => {
      const statusMatch = filters.statuses.includes(event.status);
      const typeMatch = filters.types.includes(event.type);
      return statusMatch && typeMatch;
    });
  }, [filters]);

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day) => {
    return filteredEvents.filter(event => {
      const start = parseISO(event.start);
      const end = parseISO(event.end);
      return isWithinInterval(day, { start, end });
    });
  };

  const getEventsForRange = (startDay, endDay) => {
    return filteredEvents.filter(event => {
      const start = parseISO(event.start);
      const end = parseISO(event.end);
      return (
        isWithinInterval(startDay, { start, end }) ||
        isWithinInterval(endDay, { start, end }) ||
        (isBefore(startDay, start) && isAfter(endDay, end))
      );
    });
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const today = () => setCurrentDate(new Date(2025, 11, 9));

  const handleApproveLeave = (eventId) => {
    const event = teamLeaveEvents.find(e => e.id === eventId);
    if (event) {
      event.status = 'Approved';
      toast({
        title: "Leave Approved",
        description: `${event.name}'s ${event.type} leave has been approved.`,
      });
      setSelectedEvent(null);
    }
  };

  const handleRejectLeave = (eventId) => {
    const event = teamLeaveEvents.find(e => e.id === eventId);
    if (event) {
      event.status = 'Rejected';
      toast({
        title: "Leave Rejected",
        description: `${event.name}'s ${event.type} leave has been rejected.`,
      });
      setSelectedEvent(null);
    }
  };

  const handleManualClockIn = (employeeId, time) => {
    const member = teamMembers.find(m => m.id === employeeId);
    if (member) {
      member.status = 'Present';
      member.clockIn = time;
      toast({
        title: "Clock In Recorded",
        description: `${member.name} has been clocked in at ${time}.`,
      });
      setClockInModal(null);
    }
  };

  const handleSendReminder = (employeeId) => {
    const member = teamMembers.find(m => m.id === employeeId);
    if (member) {
      toast({
        title: "Reminder Sent",
        description: `A clock-in reminder has been sent to ${member.name}.`,
      });
      setClockInModal(null);
    }
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value]
    }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Team Calendar & Attendance</h1>
            <p className="text-muted-foreground mt-1">Manage team holidays, track attendance, and monitor schedule adherence.</p>
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
          {/* Main Calendar Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Calendar Controls */}
            <div className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
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
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                  <Button variant="ghost" size="icon" onClick={nextPeriod}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={today}>Today</Button>
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
                    checked={filters.statuses.includes('Approved')}
                    onCheckedChange={() => toggleFilter('statuses', 'Approved')}
                  >
                    Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.statuses.includes('Pending')}
                    onCheckedChange={() => toggleFilter('statuses', 'Pending')}
                  >
                    Pending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.statuses.includes('Rejected')}
                    onCheckedChange={() => toggleFilter('statuses', 'Rejected')}
                  >
                    Rejected
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filters.types.includes('Full Day')}
                    onCheckedChange={() => toggleFilter('types', 'Full Day')}
                  >
                    Full Day
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.types.includes('Half Day AM')}
                    onCheckedChange={() => toggleFilter('types', 'Half Day AM')}
                  >
                    Half Day AM
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.types.includes('Half Day PM')}
                    onCheckedChange={() => toggleFilter('types', 'Half Day PM')}
                  >
                    Half Day PM
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Month View */}
            {viewMode === 'month' && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b bg-muted/30">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] relative">
                    {calendarDays.map((day, dayIndex) => {
                      const events = getEventsForDay(day);
                      const isSelectedMonth = isSameMonth(day, currentDate);
                      const isCurrentDay = isSameDay(day, new Date(2025, 11, 9));
                      const dayOfWeek = dayIndex % 7;

                      return (
                        <div
                          key={day.toString()}
                          className={cn(
                            "border-b border-r p-2 transition-colors min-h-[120px] relative group hover:bg-accent/5",
                            !isSelectedMonth && "bg-muted/10 text-muted-foreground",
                            isCurrentDay && "bg-blue-50/50 dark:bg-blue-900/10"
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={cn(
                              "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                              isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground/70"
                            )}>
                              {format(day, 'd')}
                            </span>
                            {events.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                {events.length}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1 relative">
                            {filteredEvents.map((event, eventIdx) => {
                              const eventStart = parseISO(event.start);
                              const eventEnd = parseISO(event.end);
                              const isEventDay = isWithinInterval(day, { start: eventStart, end: eventEnd });
                              const isEventStart = isSameDay(day, eventStart);
                              const isEventEnd = isSameDay(day, eventEnd);
                              
                              if (!isEventDay) return null;

                              const getEventColor = (type, status) => {
                                if (type === 'Half Day AM') {
                                  return {
                                    bg: 'bg-orange-100 dark:bg-orange-900/30',
                                    border: 'border-orange-200 dark:border-orange-800',
                                    text: 'text-orange-800 dark:text-orange-200'
                                  };
                                } else if (type === 'Half Day PM') {
                                  return {
                                    bg: 'bg-purple-100 dark:bg-purple-900/30',
                                    border: 'border-purple-200 dark:border-purple-800',
                                    text: 'text-purple-800 dark:text-purple-200'
                                  };
                                }
                                return {
                                  bg: 'bg-blue-100 dark:bg-blue-900/30',
                                  border: 'border-blue-200 dark:border-blue-800',
                                  text: 'text-blue-700 dark:text-blue-200'
                                };
                              };

                              const colors = getEventColor(event.type, event.status);

                              return (
                                <motion.div
                                  key={`${event.id}-${dayIndex}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  onClick={() => setSelectedEvent(event)}
                                  className={cn(
                                    "relative cursor-pointer transition-all hover:shadow-md",
                                    colors.bg,
                                    colors.border,
                                    colors.text,
                                    "text-[10px] sm:text-xs font-medium border rounded-sm py-1 px-1.5",
                                    event.status === 'Pending' && "opacity-70 border-dashed"
                                  )}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                                      event.status === 'Approved' ? "bg-green-500" :
                                        event.status === 'Pending' ? "bg-yellow-500" : "bg-red-500"
                                    )} />
                                    {isEventStart && (
                                      <span className="font-bold truncate">{event.name.split(' ')[0]}</span>
                                    )}
                                    {!isEventStart && <span className="text-[8px]">●●</span>}
                                  </div>

                                  {/* Continuous line connectors */}
                                  {!isEventEnd && dayOfWeek !== 6 && (
                                    <div className={cn(
                                      "absolute top-1/2 -right-2 h-0.5 w-2 -translate-y-1/2",
                                      colors.bg.replace('bg-', 'bg-').split(' ')[0]
                                    )} style={{
                                      backgroundColor: event.type === 'Half Day AM' ? '#ea580c' :
                                        event.type === 'Half Day PM' ? '#a855f7' : '#0ea5e9'
                                    }} />
                                  )}

                                  {/* Wrap around to next week */}
                                  {!isEventEnd && dayOfWeek === 6 && (
                                    <div className={cn(
                                      "absolute top-1/2 -right-[6px] h-0.5 w-1",
                                      colors.bg.replace('bg-', 'bg-').split(' ')[0]
                                    )} style={{
                                      backgroundColor: event.type === 'Half Day AM' ? '#ea580c' :
                                        event.type === 'Half Day PM' ? '#a855f7' : '#0ea5e9'
                                    }} />
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      <div className="grid grid-cols-7 border-b bg-muted/30">
                        {weekDays.map(day => (
                          <div key={day.toString()} className="p-3 text-center border-r">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">{format(day, 'EEE')}</p>
                            <p className={cn("text-sm font-bold mt-1", isSameDay(day, new Date(2025, 11, 9)) && "text-blue-600")}>
                              {format(day, 'd')}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 auto-rows-[minmax(150px,auto)]">
                        {weekDays.map(day => {
                          const events = getEventsForDay(day);
                          return (
                            <div key={day.toString()} className="border-r border-b p-2 relative group hover:bg-accent/5 transition-colors">
                              <div className="space-y-2">
                                {events.map((event, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelectedEvent(event)}
                                    className={cn(
                                      "text-xs p-2 rounded-md font-medium border cursor-pointer hover:shadow-md transition-all",
                                      event.type === 'Half Day AM'
                                        ? "bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200"
                                        : event.type === 'Half Day PM'
                                          ? "bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                                          : "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
                                      event.status === 'Pending' && "border-dashed opacity-70"
                                    )}
                                  >
                                    <div className="flex items-center gap-1">
                                      <div className={cn("h-2 w-2 rounded-full",
                                        event.status === 'Approved' ? "bg-green-500" :
                                          event.status === 'Pending' ? "bg-yellow-500" : "bg-red-500"
                                      )} />
                                      <span className="font-semibold">{event.name.split(' ')[0]}</span>
                                    </div>
                                    <p className="text-[10px] opacity-75 mt-1">{event.type}</p>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <Card>
                <CardHeader>
                  <CardTitle>Holiday Requests</CardTitle>
                  <CardDescription>All leave requests for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredEvents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No leave requests found with current filters</p>
                    ) : (
                      filteredEvents.map(event => (
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
                                    {format(parseISO(event.start), 'MMM d')} - {format(parseISO(event.end), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={event.type.includes('Half') ? "outline" : "secondary"}>
                                {event.type}
                              </Badge>
                              <Badge variant={
                                event.status === 'Approved' ? 'default' :
                                  event.status === 'Pending' ? 'secondary' : 'destructive'
                              }>
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lateness Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lateness Trends</CardTitle>
                <CardDescription>Late arrivals tracking over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
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
            {/* Today's Overview */}
            <Card className="bg-primary text-primary-foreground border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today's Overview</CardTitle>
                <CardDescription className="text-primary-foreground/80">{format(new Date(2025, 11, 9), 'EEEE, d MMM yyyy')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold">{teamMembers.filter(m => m.status !== 'On Leave').length}</span>
                    <p className="text-xs opacity-80 uppercase mt-1">In Office</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold">{filteredEvents.filter(e => isSameDay(parseISO(e.start), new Date(2025, 11, 9))).length}</span>
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
                    {filteredEvents.filter(e => {
                      const start = parseISO(e.start);
                      const end = parseISO(e.end);
                      return isWithinInterval(new Date(2025, 11, 9), { start, end });
                    }).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredEvents
                  .filter(e => {
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
                      <Badge variant={event.status === 'Pending' ? 'outline' : 'secondary'} className="text-[10px] shrink-0">
                        {event.status === 'Pending' ? 'Pending' : 'Away'}
                      </Badge>
                    </motion.div>
                  ))}
                {filteredEvents.filter(e => {
                  const start = parseISO(e.start);
                  const end = parseISO(e.end);
                  return isWithinInterval(new Date(2025, 11, 9), { start, end });
                }).length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">No one away today</p>
                )}
              </CardContent>
            </Card>

            {/* Clocked In */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Clocked In
                  <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Live</Badge>
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
                      <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                        member.status === 'Late' ? "bg-red-500" : "bg-green-500"
                      )} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className={cn("text-xs", member.status === 'Late' ? "text-red-500 font-medium" : "text-muted-foreground")}>
                        {member.clockIn}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setClockInModal({ memberId: member.id, memberName: member.name, type: 'clockin' })}>
                          <Clock className="mr-2 h-4 w-4" /> Manual Clock In
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setClockInModal({ memberId: member.id, memberName: member.name, type: 'reminder' })}>
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
                  {/* Leave Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">From</p>
                        <p className="text-sm font-medium mt-1">{format(parseISO(selectedEvent.start), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">To</p>
                        <p className="text-sm font-medium mt-1">{format(parseISO(selectedEvent.end), 'MMM d, yyyy')}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
                      <Badge className="mt-2" variant={
                        selectedEvent.status === 'Approved' ? 'default' :
                          selectedEvent.status === 'Pending' ? 'secondary' : 'destructive'
                      }>
                        {selectedEvent.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Holiday Balance */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-900/40">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">Holiday Balance</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">Remaining</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-200 mt-1">8</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">Total Allocated</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-200 mt-1">20</p>
                      </div>
                    </div>
                  </div>

                  {/* Employee Card */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/40">
                    <p className="text-xs text-blue-700 dark:text-blue-300 uppercase font-semibold mb-3">Employee Info</p>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-base">{selectedEvent.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedEvent.name}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">ID: {selectedEvent.userId}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedEvent(null)}>
                      <User className="mr-2 h-4 w-4" /> View Profile
                    </Button>
                  </div>

                  {/* Actions */}
                  {selectedEvent.status === 'Pending' && (
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

                  {/* Contact Actions */}
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
                    {clockInModal.type === 'clockin' ? 'Manual Clock In' : 'Send Reminder'}
                  </h2>
                  <p className="text-green-100 mt-1">{clockInModal.memberName}</p>
                </div>

                <div className="p-6 space-y-4">
                  {clockInModal.type === 'clockin' ? (
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
                          const time = document.getElementById('clockInTime')?.value || '09:00';
                          handleManualClockIn(clockInModal.memberId, time + ' AM');
                        }}
                      >
                        <CheckCheck className="mr-2 h-4 w-4" /> Confirm Clock In
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/40">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          A reminder will be sent to <strong>{clockInModal.memberName}</strong> to clock in.
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
                  <Button variant="outline" className="w-full" onClick={() => setClockInModal(null)}>
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