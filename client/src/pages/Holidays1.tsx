import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Palmtree, CalendarDays, Info, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export default function Holidays() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
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
  const [holidayYear, setHolidayYear] = useState<number>(new Date().getMonth() + 1 >= 12 ? new Date().getFullYear() + 1 : new Date().getFullYear());
  const { toast } = useToast();

  // Holiday year start 1 Dec (prev year) to 30 Nov (year)
  const cycleStart = useMemo(() => new Date(holidayYear - 1, 11, 1), [holidayYear]);
  const cycleEnd = useMemo(() => new Date(holidayYear, 10, 30), [holidayYear]);

  const workingDayIds = useMemo(() => {
    if (!entitlement?.workhours) return [1, 2, 3, 4, 5];
    return entitlement.workhours.map((wh: any) => Number(wh.day_id));
  }, [entitlement]);

  const bookedDates = useMemo(() => entitlement?.holiday_dates || [], [entitlement]);
  const publicDates = useMemo(() => entitlement?.public_and_xmas_holiday_dates || [], [entitlement]);

  const parseDdMmYyyy = (value: string) => {
    const token = value.split(" ")[0];
    const [dd, mm, yyyy] = token.split("/");
    if (!dd || !mm || !yyyy) return null;
    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const isWorkingDay = (day: Date) => {
    const dow = day.getDay(); // 0 Sun .. 6 Sat
    // Convert JS day to day_id (1 Mon ... 7 Sun)
    const dayId = dow === 0 ? 7 : dow;
    return workingDayIds.includes(dayId);
  };

  const isBooked = (day: Date) => {
    return bookedDates.some((d: string) => {
      // dates in dd/mm/YYYY
      const parsed = parseDdMmYyyy(d);
      return parsed ? isSameDay(parsed, day) : false;
    });
  };

  const isPublicHoliday = (day: Date) => {
    return publicDates.some((d: string) => {
      const parsed = parseDdMmYyyy(d);
      return parsed ? isSameDay(parsed, day) : false;
    });
  };

  const parseHistoryDate = (value: string | undefined) => {
    if (!value) return null;
    // try ISO
    const iso = new Date(value);
    if (!isNaN(iso.getTime())) return iso;
    return parseDdMmYyyy(value);
  };

  const requests = useMemo(() => {
    const fromHistory =
      history?.map((h: any) => {
        const start = parseHistoryDate(h.start_date || h.date_from || h.from || h.date);
        const end = parseHistoryDate(h.end_date || h.date_till || h.till || h.date);
        if (!start) return null;
        return {
          start,
          end: end || start,
          days: h.days || 1,
          type: h.holiday_type || h.type || "Annual Leave",
          status: h.request_status || h.status || "Pending",
        };
      }) || [];

    const fallbackFromBooked = bookedDates.map((d: string) => {
      const parsed = parseDdMmYyyy(d);
      return parsed ? { start: parsed, end: parsed, days: 1, type: "Annual Leave", status: "Approved" } : null;
    });

    return (fromHistory.length ? fromHistory : fallbackFromBooked).filter(
      (entry): entry is { start: Date; end: Date; days: number; type: string; status: string } => Boolean(entry)
    );
  }, [history, bookedDates]);

  const publicHolidayList = useMemo(() => {
    return publicDates
      .map((d: string) => {
        const parsed = parseDdMmYyyy(d);
        return parsed ? { date: parsed, label: d } : null;
      })
      .filter((entry): entry is { date: Date; label: string } => Boolean(entry));
  }, [publicDates]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    if (selectedDate < cycleStart || selectedDate > cycleEnd) {
      toast({
        title: "Out of holiday year",
        description: `Select between ${format(cycleStart, "dd/MM/yyyy")} and ${format(cycleEnd, "dd/MM/yyyy")}.`,
        variant: "destructive",
      });
      return;
    }
    
    if (!isWorkingDay(selectedDate)) {
      toast({
        title: "Non-working Day",
        description: "You can only book holidays on your contracted working days.",
        variant: "destructive"
      });
      return;
    }
    
    setDate(selectedDate);
    setIsBookingOpen(true);
  };

  const handleBookHoliday = async () => {
    if (!date || !user?.user_id) return;
    const payload = {
      start_date: format(date, "dd/MM/yyyy"),
      end_date: format(date, "dd/MM/yyyy"),
      holiday_year: holidayYear,
      type: leaveType,
      employee_id: user.user_id,
      portal_id: "employee",
    };
    try {
      await dispatch(validateHoliday(payload)).unwrap();
      await dispatch(submitHoliday(payload)).unwrap();
      toast({
        title: "Request Submitted",
        description: `Your holiday request for ${format(date, "PPP")} has been sent for approval.`,
      });
      dispatch(fetchHolidayEntitlement({ holiday_year: holidayYear, employee_id: user.user_id }));
      dispatch(fetchHolidayHistory({ holiday_year: holidayYear }));
      setIsBookingOpen(false);
      setDate(undefined);
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
    dispatch(fetchHolidayEntitlement({ holiday_year: holidayYear, employee_id: user.user_id }));
    dispatch(fetchHolidayHistory({ holiday_year: holidayYear }));
    setDate(undefined);
  }, [dispatch, holidayYear, user?.user_id]);

  const yearTabs = useMemo(() => {
    const current = holidayYear;
    return [current - 1, current, current + 1];
  }, [holidayYear]);

  return (
    <Layout>
      <div className="space-y-8">
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
                Holiday Cycle: <span className="font-medium text-foreground">{entitlement.holiday_cycle_start} - {entitlement.holiday_cycle_end}</span>
              </p>
            )}
            {entitlementStatus === "loading" && <p className="text-xs text-muted-foreground mt-1">Loading entitlement...</p>}
            {entitlementError && <p className="text-xs text-red-600 mt-1">{entitlementError}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Policy Guide</Button>
            <Button className="gap-2" onClick={() => setIsBookingOpen(true)}>
              <Plus className="h-4 w-4" /> New Request
            </Button>
          </div>
        </div>

        {/* Entitlement */}
        {entitlement && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="md:col-span-1 bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4 pt-6">
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">Entitlement</p>
                <p className="text-3xl font-bold text-yellow-900">{Number(entitlement.holiday_entitlement).toFixed(2)}</p>
                <p className="text-xs text-yellow-700/80 mt-1">Total Days</p>
              </CardContent>
            </Card>
            
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 pt-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Booked</p>
                  <p className="text-2xl font-bold text-blue-600">{entitlement.total_booked_holiday}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 pt-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Christmas</p>
                  <p className="text-2xl font-bold text-red-600">{entitlement.total_mandatory_xmas_holiday}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 pt-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Carry Forward</p>
                  <p className="text-2xl font-bold text-slate-600">{entitlement.holiday_balance_carried_forward}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4 pt-6">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Remaining</p>
                  <p className="text-3xl font-bold text-green-700">{Number(entitlement.remaining_holiday).toFixed(2)}</p>
                  <p className="text-xs text-green-700/80 mt-1">Available to Book</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="h-full border-2 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/20">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Select Dates
                  </CardTitle>
                  <CardDescription>Click on a date within your holiday year to book leave.</CardDescription>
                </div>
                <div className="flex gap-3 text-xs">
                   <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span> Approved
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span> Pending
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-200"></span> Non-working
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
                    disabled={(day) => !isWorkingDay(day) || isBefore(day, cycleStart) || isAfter(day, cycleEnd)}
                    modifiers={{
                      booked: (date) => isBooked(date),
                      publicDay: (date) => isPublicHoliday(date),
                      weekend: (date) => !isWorkingDay(date)
                    }}
                    modifiersStyles={{
                      booked: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' },
                      publicDay: { backgroundColor: '#fff7ed', color: '#d97706' },
                      weekend: { color: '#cbd5e1', opacity: 0.5 } // Light gray for non-working
                    }}
                    fromDate={cycleStart}
                    toDate={cycleEnd}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center mb-4",
                      caption_label: "text-lg font-bold text-foreground",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border rounded-md hover:bg-muted transition-colors",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full mb-2",
                      head_cell: "text-muted-foreground rounded-md w-full font-semibold text-[0.9rem] uppercase tracking-wider",
                      row: "flex w-full mt-2 gap-2",
                      cell: "h-14 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: cn(
                        "h-14 w-full p-0 font-medium aria-selected:opacity-100 hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20",
                      ),
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md scale-105",
                      day_today: "bg-accent text-accent-foreground border-accent-foreground/20",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-30 bg-secondary/20 cursor-not-allowed",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: History & Upcoming */}
          <div className="space-y-6">
            
            {/* My Requests */}
            <Card>
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
                <CardDescription>Recent leave history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {historyStatus === "loading" && <p className="text-xs text-muted-foreground">Loading history...</p>}
                {historyError && <p className="text-xs text-red-600">{historyError}</p>}
                {requests.length === 0 && (
                  <p className="text-sm text-muted-foreground">No leave recorded for this holiday year.</p>
                )}
                {requests.map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-blue-100 text-blue-600">
                        <Palmtree className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{format(req.start, 'MMM d, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{req.days} day • {req.type}</p>
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className={cn(
                        "text-[10px]",
                        req.status?.toLowerCase() === "approved"
                          ? "bg-green-500 hover:bg-green-600"
                          : req.status?.toLowerCase() === "pending"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-slate-500 hover:bg-slate-600"
                      )}
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                 <Button
                   variant="ghost"
                   className="w-full text-xs"
                   onClick={() => dispatch(fetchHolidayHistory({ holiday_year: holidayYear }))}
                 >
                   Refresh History
                 </Button>
              </CardFooter>
            </Card>

            {/* Upcoming Public Holidays */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading">Public Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publicHolidayList.length === 0 && (
                    <p className="text-sm text-muted-foreground">No public holidays in this holiday year.</p>
                  )}
                  {publicHolidayList.map((holiday, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{holiday.label}</p>
                        <p className="text-xs text-muted-foreground">{holiday.date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">Public</Badge>
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
              <DialogTitle>Book Time Off</DialogTitle>
              <DialogDescription>
                Request leave for your contracted working days within the selected holiday year.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => {}}>
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    {date ? format(date, 'PPP') : "Select date"}
                  </Button>
                </div>
                 <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50 text-sm">
                    1 Day(s)
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Leave Type</Label>
                <RadioGroup defaultValue="annual" onValueChange={setLeaveType} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="annual" id="annual" className="peer sr-only" />
                    <Label
                      htmlFor="annual"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Palmtree className="mb-2 h-6 w-6" />
                      Annual Leave
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="sick" id="sick" className="peer sr-only" />
                    <Label
                      htmlFor="sick"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Info className="mb-2 h-6 w-6" />
                      Other / Sick
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea placeholder="Add any comments for your manager..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBookingOpen(false)}>Cancel</Button>
              <Button onClick={handleBookHoliday} disabled={submissionStatus === "loading"}>
                {submissionStatus === "loading" ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
