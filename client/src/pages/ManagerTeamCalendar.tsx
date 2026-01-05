import { Layout } from "@/components/Layout";
import { teamMembers, teamLeaveEvents, analyticsData } from "@/lib/mockData";
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
  CalendarDays
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
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
  isWithinInterval
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

export default function ManagerTeamCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 9)); // Mocking Dec 9th 2025 as "Today"
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const { toast } = useToast();

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

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

  // Helper to check for events on a day
  const getEventsForDay = (day: Date) => {
    return teamLeaveEvents.filter(event => {
      const start = parseISO(event.start);
      const end = parseISO(event.end);
      return isWithinInterval(day, { start, end });
    });
  };

  const handleDownloadICS = () => {
    toast({
      title: "Calendar Downloaded",
      description: "Team_Holiday_Calendar.ics has been saved to your device.",
    });
  };

  const handleEmailSelf = () => {
    toast({
      title: "Email Sent",
      description: "A copy of the calendar has been sent to your Outlook email.",
    });
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
            <Button variant="outline" onClick={handleDownloadICS}>
              <Download className="mr-2 h-4 w-4" /> Download .ics
            </Button>
            <Button variant="outline" onClick={handleEmailSelf}>
              <Mail className="mr-2 h-4 w-4" /> Email to Me
            </Button>
            <Button>
              <CalendarDays className="mr-2 h-4 w-4" /> New Request
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Main Calendar Area (3 Cols) */}
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

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked>Approved</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Pending</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Rejected</DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked>Full Day</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked>Half Day</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Calendar Grid */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
                  {calendarDays.map((day, idx) => {
                    const events = getEventsForDay(day);
                    const isSelectedMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isSameDay(day, new Date(2025, 11, 9)); // Mock Today

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
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 hidden sm:flex">
                              {events.length} Away
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          {events.map((event, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "text-[10px] sm:text-xs p-1.5 rounded-md truncate font-medium border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1",
                                event.type === 'Half Day AM' 
                                  ? "bg-gradient-to-r from-orange-100 to-transparent border-orange-200 text-orange-800 dark:from-orange-900/40 dark:text-orange-200"
                                  : event.type === 'Half Day PM'
                                  ? "bg-gradient-to-l from-purple-100 to-transparent border-purple-200 text-purple-800 dark:from-purple-900/40 dark:text-purple-200"
                                  : "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200",
                                event.status === 'Pending' && "opacity-70 border-dashed"
                              )}
                            >
                              <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", 
                                event.status === 'Approved' ? "bg-green-500" : 
                                event.status === 'Pending' ? "bg-yellow-500" : "bg-red-500"
                              )} />
                              {event.name.split(' ')[0]} 
                              {event.type.includes('Half') && <span className="opacity-70 text-[9px] ml-auto font-bold">{event.type === 'Half Day AM' ? 'AM' : 'PM'}</span>}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Late Arrivals Chart */}
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

          {/* Right Sidebar (Status & Widgets) */}
          <div className="space-y-6">
            
            {/* Status Summary */}
            <Card className="bg-primary text-primary-foreground border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today's Overview</CardTitle>
                <CardDescription className="text-primary-foreground/80">{format(new Date(2025, 11, 9), 'EEEE, d MMM yyyy')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold">4</span>
                    <p className="text-xs opacity-80 uppercase mt-1">In Office</p>
                  </div>
                   <div className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold">1</span>
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
                  <Badge variant="secondary">1</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamLeaveEvents.filter(e => isSameDay(parseISO(e.start), new Date(2025, 11, 10)) || e.userId === '45023').map((event, i) => (
                   <div key={i} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                       <AvatarFallback>{event.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.type}</p>
                    </div>
                    <Badge variant={event.type.includes('Half') ? "outline" : "secondary"} className="text-[10px]">
                      {event.type.includes('Half') ? '½ Day' : 'Leave'}
                    </Badge>
                   </div>
                ))}
                {/* Fallback if no one is away for demo */}
                <div className="flex items-center gap-3">
                   <Avatar className="h-8 w-8 bg-orange-100 text-orange-600">
                      <AvatarFallback>SP</AvatarFallback>
                   </Avatar>
                   <div className="flex-1 overflow-hidden">
                     <p className="text-sm font-medium truncate">Sarah Parker</p>
                     <p className="text-xs text-muted-foreground">Annual Leave</p>
                   </div>
                   <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-700">On Leave</Badge>
                </div>
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
              <CardContent className="space-y-4">
                {teamMembers.filter(m => m.status !== 'On Leave').map((member, i) => (
                  <div key={i} className="flex items-center gap-3 group">
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
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

             {/* Late Stats Summary */}
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
                   <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                   <p className="text-xs text-red-800 dark:text-red-200 leading-snug">
                     <strong>Attention Needed:</strong> Emily Blunt has been late 3 times this month.
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
