import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartAvatar } from "@/components/SmartAvatar";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Calendar,
  Briefcase,
  Users,
  Layers,
  Sparkles,
  ArrowUpDown,
  Bug,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "start" | "status">("name");
  const [viewMode, setViewMode] = useState<"cards" | "hierarchy">("cards");
  const [debug, setDebug] = useState(false);
  // const isManager = Number(user?.team_member) > 0;
  const isManager = true; // For testing purposes

  useEffect(() => {
    if (isManager && user?.user_id) {
      dispatch(fetchTeam({ portal_user: user.user_id, team_member: user.team_member, portal_id: "employee" }));
    }
  }, [dispatch, isManager, user]);

  const derived = useMemo(() => {
    const statusSet = new Set<string>();
    const deptSet = new Set<string>();
    let active = 0;
    let onLeave = 0;
    let totalTenureYears = 0;
    let tenureSamples = 0;

    members.forEach((m: any) => {
      const label = (m.employment_status || m.status || "Active").toString();
      statusSet.add(label);
      const normalized = label.toLowerCase();
      if (normalized.includes("active") || normalized.includes("present")) active += 1;
      if (normalized.includes("leave") || normalized.includes("absent")) onLeave += 1;

      const dept = m.department || m.sub_organisation || m.org || "";
      if (dept) deptSet.add(dept);

      const startDate =
        m.employment_start_date ||
        m.start_date ||
        m.hr_start_date ||
        m.joining_date;
      const start = toDateSafe(startDate);
      if (start) {
        tenureSamples += 1;
        const diffYears = (Date.now() - start) / (1000 * 60 * 60 * 24 * 365);
        totalTenureYears += diffYears;
      }
    });

    return {
      statusOptions: Array.from(statusSet),
      departmentOptions: Array.from(deptSet),
      active,
      onLeave,
      total: members.length,
      avgTenure: tenureSamples ? (totalTenureYears / tenureSamples).toFixed(1) : "0",
    };
  }, [members]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    const withFilters = members.filter((m: any) => {
      const name = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
      const dept = (m.department || m.sub_organisation || "").toLowerCase();
      const statusLabel = (m.employment_status || m.status || "active").toString().toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        dept.includes(query) ||
        (m.employee_id || "").toString().includes(query);

      const matchesStatus = statusFilter === "all" ? true : statusLabel.includes(statusFilter.toLowerCase());
      const matchesDept = departmentFilter === "all" ? true : dept === departmentFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesDept;
    });

    return withFilters.sort((a: any, b: any) => {
      if (sortBy === "name") {
        const aName = `${a.first_name || ""} ${a.last_name || ""}`.trim().toLowerCase();
        const bName = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase();
        return aName.localeCompare(bName);
      }
      if (sortBy === "status") {
        const aStatus = (a.employment_status || a.status || "").toString().toLowerCase();
        const bStatus = (b.employment_status || b.status || "").toString().toLowerCase();
        return aStatus.localeCompare(bStatus);
      }
      const aStart =
        toDateSafe(a.employment_start_date || a.start_date || a.joining_date) || 0;
      const bStart =
        toDateSafe(b.employment_start_date || b.start_date || b.joining_date) || 0;
      return bStart - aStart;
    });
  }, [members, search, statusFilter, departmentFilter, sortBy]);

  const hierarchy = useMemo(() => {
    const grouped = new Map<string, any[]>();
    filtered.forEach((m: any) => {
      const manager =
        m.manager_name ||
        m.manager ||
        m.reporting_manager ||
        m.reporting_manager_name ||
        "Unassigned manager";
      if (!grouped.has(manager)) grouped.set(manager, []);
      grouped.get(manager)?.push(m);
    });

    return Array.from(grouped.entries()).map(([manager, reports]) => ({
      manager,
      reports,
    }));
  }, [filtered]);

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
            <Button
              variant="outline"
              onClick={() =>
                user?.user_id &&
                dispatch(
                  fetchTeam({
                    portal_user: user.user_id,
                    team_member: user.team_member,
                    portal_id: "employee",
                  }),
                )
              }
            >
              <Calendar className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button variant={debug ? "default" : "outline"} onClick={() => setDebug((d) => !d)}>
              <Bug className="mr-2 h-4 w-4" />
              Devtools
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Total Team
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 text-2xl font-bold">{derived.total}</CardContent>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Active
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 text-2xl font-bold text-green-600">{derived.active}</CardContent>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" /> On Leave
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 text-2xl font-bold text-orange-600">{derived.onLeave}</CardContent>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4" /> Avg Tenure (yrs)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 text-2xl font-bold">{derived.avgTenure}</CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="space-y-3 bg-card p-4 rounded-xl shadow-sm border">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID or department..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDepartmentFilter("all");
                  setSortBy("name");
                }}
              >
                Reset filters
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" /> Sort: {sortBy === "name" ? "Name" : sortBy === "status" ? "Status" : "Start date"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("status")}>Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("start")}>Start date</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={statusFilter === "all" ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setStatusFilter("all")}
            >
              All statuses
            </Badge>
            {derived.statusOptions.map((s) => (
              <Badge
                key={s}
                variant={statusFilter === s ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={departmentFilter === "all" ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setDepartmentFilter("all")}
            >
              All departments
            </Badge>
            {derived.departmentOptions.map((dept) => (
              <Badge
                key={dept}
                variant={departmentFilter === dept.toLowerCase() ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setDepartmentFilter(dept.toLowerCase())}
              >
                {dept}
              </Badge>
            ))}
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <TabsList className="grid grid-cols-2 w-full md:w-[320px]">
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsContent value="cards" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((member: any, i: number) => {
                const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.employee_id;
                const manager =
                  member.manager_name ||
                  member.manager ||
                  member.reporting_manager ||
                  member.reporting_manager_name ||
                  "Unassigned manager";
                const department = member.sub_organisation || member.department || "Org";
                const statusLabel = member.employment_status || member.status || "Active";
                return (
                  <motion.div
                    key={member.employment_id || member.employee_id || i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-all duration-300 group h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="secondary" className={statusBadge(statusLabel)}>
                            {statusLabel}
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

                        <div className="flex flex-col items-center text-center mb-6 gap-2">
                          <SmartAvatar src={member.avatar_url} name={name} size={96} />
                          <div>
                            <h3 className="text-lg font-bold font-heading">{name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {member.designation || department || "Team member"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded-full">
                            <Briefcase className="h-3 w-3" /> {department}
                          </div>
                          <p className="text-xs text-muted-foreground">Reports to {manager}</p>
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
                                : member.start_date || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-auto flex gap-2">
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
              {!filtered.length && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No team members match these filters yet.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hierarchy" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hierarchy.map(({ manager, reports }) => (
                <Card key={manager}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      {manager} <span className="text-xs text-muted-foreground">({reports.length} reports)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reports.map((member: any, idx: number) => {
                      const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.employee_id;
                      const department = member.sub_organisation || member.department || "Org";
                      return (
                        <div key={`${manager}-${idx}`} className="flex items-center gap-3 p-2 rounded-lg border bg-secondary/30">
                          <SmartAvatar src={member.avatar_url} name={name} size={40} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{name}</p>
                            <p className="text-xs text-muted-foreground">{member.designation || department}</p>
                          </div>
                          <Badge variant="outline">{member.employment_status || member.status || "Active"}</Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
              {!hierarchy.length && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No reporting lines available for the current filters.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {debug && (
          <Card className="border-primary/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bug className="h-4 w-4" /> Inspector (filtered view)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[320px] border rounded-md p-3 text-xs bg-muted/30">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(
                    {
                      filters: { search, statusFilter, departmentFilter, sortBy, viewMode },
                      totals: derived,
                      members: filtered,
                    },
                    null,
                    2,
                  )}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function toDateSafe(value: any): number {
  if (!value) return 0;
  if (typeof value === "string" && value.includes("/")) {
    const [d, m, y] = value.split("/");
    const dNum = Number(d);
    const mNum = Number(m);
    const yNum = Number(y);
    if (!Number.isNaN(dNum) && !Number.isNaN(mNum) && !Number.isNaN(yNum)) {
      return new Date(yNum, mNum - 1, dNum).getTime();
    }
  }
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}
