import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SmartAvatar } from "@/components/SmartAvatar";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreHorizontal, Mail, Calendar, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useMemo, useState } from "react";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTeam,
  selectTeamMembers,
  selectTeamStatus,
  selectTeamError,
} from "@/features/team/teamSlice";

const statusBadge = (status: string) => {
  if (!status) return "bg-blue-100 text-blue-700 hover:bg-blue-200";
  const normalized = status.toString().toLowerCase();
  if (normalized.includes("leave") || normalized.includes("absent")) {
    return "bg-orange-100 text-orange-700 hover:bg-orange-200";
  }
  if (normalized.includes("active") || normalized.includes("present")) {
    return "bg-green-100 text-green-700 hover:bg-green-200";
  }
  return "bg-blue-100 text-blue-700 hover:bg-blue-200";
};

export default function Team() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectTeamMembers);
  const status = useAppSelector(selectTeamStatus);
  const error = useAppSelector(selectTeamError);
  const [search, setSearch] = useState("");
  // const isManager = Number(user?.team_member) > 0;
  const isManager = true; // For testing purposes

  useEffect(() => {
    if (isManager && user?.user_id) {
      dispatch(fetchTeam({ portal_user: user.user_id, team_member: user.team_member, portal_id: "employee" }));
    }
  }, [dispatch, isManager, user]);

  const filtered = useMemo(() => {
    if (!search) return members;
    return members.filter((m: any) => {
      const name = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
      return name.includes(search.toLowerCase()) || (m.department || "").toLowerCase().includes(search.toLowerCase());
    });
  }, [members, search]);

  if (!isManager) {
    return (
      <Layout>
        <div className="p-6">
          <p className="font-medium">Team view is available only for managers.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">My Team</h1>
            <p className="text-muted-foreground mt-1">
              Manage your team members and view their status. ({status})
            </p>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button disabled>Add Member</Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl shadow-sm border">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto ml-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              Department
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              Status
            </Button>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((member: any, i: number) => {
            const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.employee_id;
            return (
              <motion.div
                key={member.employment_id || member.employee_id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="secondary" className={statusBadge(member.employment_status || "Active")}>
                        {member.employment_status || "Active"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Employment Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Report Issue</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-col items-center text-center mb-6">
                    <SmartAvatar src={member.avatar_url} name={name} size={128} />
                   
                      <h3 className="text-lg font-bold font-heading">{name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {member.designation || member.department || "Team member"}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded-full">
                        <Briefcase className="h-3 w-3" /> {member.sub_organisation || member.department || "Org"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-secondary/30 p-2 rounded-lg text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Phone</p>
                        <p className="text-sm font-medium">{member.mobile || member.phone || "N/A"}</p>
                      </div>
                      <div className="bg-secondary/30 p-2 rounded-lg text-center">
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Started</p>
                        <p className="text-sm font-medium">
                          {member.employment_start_date
                            ? member.employment_start_date
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none">
                        <Mail className="h-4 w-4 mr-2" /> Email
                      </Button>
                      <Button variant="outline" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
