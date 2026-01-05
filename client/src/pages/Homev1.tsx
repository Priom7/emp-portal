// src/pages/Home.tsx
import { Layout } from "@/components/Layout";
import { useEmployee } from "@/context/EmployeeProvider";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  AlertCircle,
  Briefcase,
  FileText,
  User,
  Coffee,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  announcements,
  holidayStats as mockHolidayStats,
  upcomingHolidays,
} from "@/lib/mockData";
import {
  fetchHolidayStats,
  selectHolidayStats,
  selectHolidayStatus,
} from "@/features/holidays/holidaySlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function Home() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const holidayStats = useAppSelector(selectHolidayStats);
  const holidayStatus = useAppSelector(selectHolidayStatus);

  useEffect(() => {
    if (user && holidayStatus === "idle") {
      dispatch(fetchHolidayStats());
    }
  }, [dispatch, user, holidayStatus]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const holiday = holidayStats || mockHolidayStats;
  const firstName = user.employee_name?.split(" ")[0] ?? "Welcome";
  const employmentStatus = user.hr_employment_status === 1 ? "Active" : "Inactive";

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Good day, {firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here’s what’s happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Clock className="mr-2 h-4 w-4" /> Clock In
            </Button>
            <Button variant="outline">Request Time Off</Button>
          </div>
        </div>

        {/* Alerts / Action Required */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-4"
        >
          <div className="bg-accent/20 p-2 rounded-lg text-accent-foreground">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-accent-foreground">Action Required</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Keep an eye on your upcoming holidays and requests. New items will show here.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white hover:bg-white/90 text-accent-foreground border border-accent/20"
          >
            Review
          </Button>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: Clock,
                  label: "Status",
                  value: employmentStatus,
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  icon: MapPin,
                  label: "Sub Org",
                  value: user.sub_organisation || "Not set",
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  icon: Briefcase,
                  label: "User ID",
                  value: user.user_id,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  icon: Calendar,
                  label: "Holiday Left",
                  value: holiday?.remaining ?? "N/A",
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                },
              ].map((stat, i) => (
                <motion.div variants={item} key={i}>
                  <Card className="hover:shadow-md transition-shadow border-none shadow-sm bg-white h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {stat.label}
                        </p>
                        <p className="font-bold text-foreground mt-0.5">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <motion.div variants={item}>
              <h2 className="text-lg font-heading font-semibold mb-4">Quick Access</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: User, label: "Profile", href: "/profile" },
                  { icon: FileText, label: "Documents", href: "/documents" },
                  { icon: Coffee, label: "Holidays", href: "/holidays" },
                  { icon: Users, label: "My Team", href: "/team" },
                ].map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all group"
                    asChild
                  >
                    <a href={action.href}>
                      <action.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-medium">{action.label}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Announcements */}
            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-heading">Announcements</CardTitle>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                        <span className="text-xs font-bold uppercase">
                          {new Date(announcement.date).toLocaleString("default", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {new Date(announcement.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground">{announcement.title}</h4>
                          {announcement.priority === "high" && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Holiday Balance */}
            <motion.div variants={item}>
              <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>

                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-lg font-heading text-white/90">Holiday Balance</CardTitle>
                  <CardDescription className="text-white/70">Current Period</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-bold">{holiday?.remaining ?? "N/A"}</span>
                    <span className="text-white/70 mb-1">
                      / {holiday?.entitlement ?? "-"} days left
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/80">
                      <span>Used: {holiday?.taken ?? "-"}</span>
                      <span>Pending: {holiday?.pending ?? "-"}</span>
                    </div>
                    <Progress
                      value={
                        holiday?.entitlement
                          ? Math.min(100, (holiday.taken / holiday.entitlement) * 100)
                          : 0
                      }
                      className="h-2 bg-black/20"
                      indicatorClassName="bg-white"
                    />
                  </div>
                  <Button className="w-full mt-6 bg-white text-primary hover:bg-white/90 border-none font-semibold">
                    Book Holiday
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Holidays */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-heading">Upcoming Holidays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingHolidays.map((holiday, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{holiday.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(holiday.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {holiday.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View Calendar <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Useful Links */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-heading">Useful Links</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button variant="outline" className="justify-start h-auto py-3 px-4 border-dashed">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-semibold text-primary">Sage Payslips</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        View your payslips online
                      </span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3 px-4 border-dashed">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-semibold text-green-600">Bravo Benefits</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Access your perks and rewards
                      </span>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
