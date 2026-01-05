import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Download,
  Building2,
  CreditCard,
  User,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchEmployeeProfile,
  selectEmployeeProfile,
  selectProfileStatus,
} from "@/features/profile/profileSlice";

export default function Employment() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const employee = useAppSelector(selectEmployeeProfile);
  const status = useAppSelector(selectProfileStatus);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(fetchEmployeeProfile({ portal_user: user.user_id, portal_id: "employee" }));
    }
  }, [dispatch, user]);

  const profile = employee || {};
  const displayName = profile.employee_name || profile.name || user?.employee_name || "Employee";
  const department = profile.department || profile.sub_organisation || "Department";
  const email = profile.email || profile.employee_email || user?.email || "";
  const phone = profile.phone || profile.employee_phone || "";
  const startDate = profile.start_date || profile.hr_start_date || profile.employment_start_date;
  const managerName = profile.manager_name || profile.manager || "";
  const holidayRequests = profile.holiday_requests || [];
  const absences = profile.absences || [];
  const employmentHistory = profile.employment_history || profile.hr_employee_employment_history || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Employment & Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal details and view employment history.</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1"
          >
            <Card className="h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4 ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold font-heading">{displayName}</h2>
                <p className="text-muted-foreground mb-4">{profile.role || profile.job_title || ""}</p>
                <Badge variant="secondary" className="mb-6">{department}</Badge>
                
                <div className="w-full space-y-4 text-left">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Mail className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{email || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Phone className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium truncate">{phone || "Not set"}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium truncate">London HQ</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6">Edit Profile</Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Current Employment */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Current Employment
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Employee ID</p>
                    <p className="font-medium">{profile.user_id || user?.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                    <p className="font-medium">
                      {startDate ? new Date(startDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Manager</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>DC</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{managerName || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contract Type</p>
                    <Badge variant="outline">{profile.contract_type || "Permanent"}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Employment History */}
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Employment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-muted ml-2 space-y-8 pb-2">
                    {Array.isArray(employmentHistory) && employmentHistory.length > 0 ? (
                      employmentHistory.map((job: any, i: number) => (
                        <div key={i} className="ml-6 relative">
                          <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                          <h3 className="font-bold text-base">{job.role || job.hr_job_title || "Role"}</h3>
                          <p className="text-primary font-medium">{job.company || job.sub_organisation || "Company"}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {job.startDate || job.start_date || job.hr_start_date || "-"} -{" "}
                            {job.endDate || job.end_date || job.hr_end_date || "Present"} •{" "}
                            {job.type || job.employment_type || ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground pl-4">No employment history available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

             {/* Holiday Requests */}
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Holiday Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {holidayRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No holiday requests.</p>
                  ) : (
                    <div className="space-y-3">
                      {holidayRequests.map((req: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg bg-secondary/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{req.holiday_type || "Holiday"}</p>
                              <p className="text-xs text-muted-foreground">
                                {req.date_from} - {req.date_till} • {req.financial_year}
                              </p>
                            </div>
                            <Badge variant="outline">{req.request_status}</Badge>
                          </div>
                          {req.holiday_status_comment && (
                            <p className="text-xs text-muted-foreground mt-1">{req.holiday_status_comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

             {/* Absences */}
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Absences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {absences.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No absences recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {absences.map((abs: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg bg-secondary/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{abs.type || "Absence"}</p>
                              <p className="text-xs text-muted-foreground">
                                {abs.from} - {abs.till}
                              </p>
                            </div>
                            <Badge variant="outline">{abs.abs_status || "Status"}</Badge>
                          </div>
                          {abs.abs_note && (
                            <p className="text-xs text-muted-foreground mt-1">{abs.abs_note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
