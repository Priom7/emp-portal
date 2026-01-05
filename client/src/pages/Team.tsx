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
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const filterDefaults = {
    search: "",
    employeeId: "",
    department: "all",
    statuses: [] as string[],
    manager: "all",
    startDate: { from: "", to: "" },
    tenure: { min: "", max: "" },
    role: "",
  };
  const createDefaultFilters = () => ({
    ...filterDefaults,
    statuses: [],
    startDate: { ...filterDefaults.startDate },
    tenure: { ...filterDefaults.tenure },
  });
  const [filters, setFilters] = useState(createDefaultFilters);
  const [useDummyData, setUseDummyData] = useState(false);
  const [dummyMembers, setDummyMembers] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "start" | "status">("name");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "hierarchy">("cards");
  const [debug, setDebug] = useState(false);
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null);
  const [dragOverManager, setDragOverManager] = useState<string | null>(null);
  const [managerOverrides, setManagerOverrides] = useState<Record<string, string>>({});
  const [hierarchySearch, setHierarchySearch] = useState("");
  const [focusedManager, setFocusedManager] = useState<string>("all");
  const [collapsedManagers, setCollapsedManagers] = useState<Record<string, boolean>>({});
  const [compactHierarchy, setCompactHierarchy] = useState(false);
  // const isManager = Number(user?.team_member) > 0;
  const isManager = true; // For testing purposes

  useEffect(() => {
    if (isManager && user?.user_id) {
      dispatch(fetchTeam({ portal_user: user.user_id, team_member: user.team_member, portal_id: "employee" }));
    }
  }, [dispatch, isManager, user]);

  const activeMembers = useMemo(() => (useDummyData ? dummyMembers : members), [useDummyData, dummyMembers, members]);

  const derived = useMemo(() => {
    const statusSet = new Set<string>();
    const deptSet = new Set<string>();
    let active = 0;
    let onLeave = 0;
    let totalTenureYears = 0;
    let tenureSamples = 0;

    activeMembers.forEach((m: any) => {
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
      total: activeMembers.length,
      avgTenure: tenureSamples ? (totalTenureYears / tenureSamples).toFixed(1) : "0",
    };
  }, [activeMembers]);

  type FilterField =
    | { key: keyof typeof filterDefaults; label: string; type: "text"; placeholder?: string }
    | { key: keyof typeof filterDefaults; label: string; type: "select"; options: string[] }
    | { key: keyof typeof filterDefaults; label: string; type: "multi"; options: string[] }
    | { key: keyof typeof filterDefaults; label: string; type: "dateRange" }
    | { key: keyof typeof filterDefaults; label: string; type: "numberRange" };

  const managerOptions = useMemo(() => {
    const managers = new Set<string>();
    activeMembers.forEach((m: any) => {
      const manager =
        m.manager_name ||
        m.manager ||
        m.reporting_manager ||
        m.reporting_manager_name ||
        "Unassigned manager";
      managers.add(manager);
    });
    Object.values(managerOverrides).forEach((m) => managers.add(m));
    return Array.from(managers);
  }, [activeMembers, managerOverrides]);

  const filterFields: FilterField[] = useMemo(
    () => [
      { key: "employeeId", label: "Employee ID", type: "text", placeholder: "ID or badge number" },
      { key: "role", label: "Role / Title", type: "text", placeholder: "Search by title" },
      {
        key: "department",
        label: "Department",
        type: "select",
        options: ["all", ...derived.departmentOptions],
      },
      {
        key: "statuses",
        label: "Employment status",
        type: "multi",
        options: derived.statusOptions,
      },
      {
        key: "manager",
        label: "Manager",
        type: "select",
        options: ["all", ...managerOptions],
      },
      { key: "startDate", label: "Start date", type: "dateRange" },
      { key: "tenure", label: "Tenure (years)", type: "numberRange" },
    ],
    [derived.departmentOptions, derived.statusOptions, managerOptions],
  );

  const updateFilter = (key: keyof typeof filterDefaults, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const getMemberId = (member: any) =>
    (
      member.employee_id ||
      member.employment_id ||
      member.id ||
      member.email ||
      member.mobile ||
      `${member.first_name || ""}-${member.last_name || ""}` ||
      "unknown"
    ).toString();

  const resolveManager = (member: any) => {
    const memberId = getMemberId(member);
    const override = managerOverrides[memberId];
    if (override !== undefined) return override;
    return (
      member.manager_name ||
      member.manager ||
      member.reporting_manager ||
      member.reporting_manager_name ||
      "Unassigned manager"
    );
  };

  const handleDropOnManager = (managerName: string) => {
    if (!draggingMemberId) return;
    setManagerOverrides((prev) => ({ ...prev, [draggingMemberId]: managerName }));
    setDraggingMemberId(null);
    setDragOverManager(null);
  };

  const toggleManagerCollapse = (managerName: string) =>
    setCollapsedManagers((prev) => ({ ...prev, [managerName]: !prev[managerName] }));

  const applyDummyHierarchy = () => {
    const sample = [
      {
        employee_id: "EMP-001",
        first_name: "Alex",
        last_name: "Rivera",
        designation: "Engineering Manager",
        department: "Engineering",
        employment_status: "Active",
        start_date: "2019-01-15",
        manager_name: "VP Engineering",
      },
      {
        employee_id: "EMP-002",
        first_name: "Priya",
        last_name: "Nair",
        designation: "Backend Engineer",
        department: "Engineering",
        employment_status: "Active",
        start_date: "2020-06-10",
        manager_name: "Alex Rivera",
      },
      {
        employee_id: "EMP-003",
        first_name: "Sam",
        last_name: "Lee",
        designation: "Frontend Engineer",
        department: "Engineering",
        employment_status: "Active",
        start_date: "2021-02-01",
        manager_name: "Alex Rivera",
      },
      {
        employee_id: "EMP-004",
        first_name: "Jordan",
        last_name: "Chen",
        designation: "QA Lead",
        department: "Quality",
        employment_status: "Active",
        start_date: "2018-09-20",
        manager_name: "VP Engineering",
      },
      {
        employee_id: "EMP-005",
        first_name: "Taylor",
        last_name: "Smith",
        designation: "QA Analyst",
        department: "Quality",
        employment_status: "Active",
        start_date: "2022-03-05",
        manager_name: "Jordan Chen",
      },
      {
        employee_id: "EMP-006",
        first_name: "Morgan",
        last_name: "Diaz",
        designation: "Product Manager",
        department: "Product",
        employment_status: "Active",
        start_date: "2019-11-11",
        manager_name: "VP Product",
      },
      {
        employee_id: "EMP-007",
        first_name: "Jamie",
        last_name: "Patel",
        designation: "Designer",
        department: "Design",
        employment_status: "Active",
        start_date: "2020-04-18",
        manager_name: "VP Product",
      },
      {
        employee_id: "EMP-008",
        first_name: "Casey",
        last_name: "Nguyen",
        designation: "Ops Coordinator",
        department: "Operations",
        employment_status: "On Leave",
        start_date: "2017-07-07",
        manager_name: "COO",
      },
    ];

    const activeSet = sample;
    setDummyMembers(sample);
    setUseDummyData(true);

    const poolSource =
      managerOptions.length && !useDummyData
        ? managerOptions
        : Array.from(new Set(activeSet.map((m: any) => resolveManager(m))));
    const managerPool =
      poolSource.length > 0 ? poolSource : ["Team Lead", "Squad Lead", "Unassigned manager"];

    const overrides: Record<string, string> = {};
    activeSet.forEach((m: any, idx: number) => {
      const id = getMemberId(m);
      if (!id) return;
      const manager = managerPool[idx % managerPool.length];
      overrides[id] = manager;
    });
    setManagerOverrides(overrides);
    setViewMode("hierarchy");
  };

  const filtered = useMemo(() => {
    const withFilters = activeMembers.filter((m: any) => {
      const name = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
      const dept = (m.department || m.sub_organisation || "").toLowerCase();
      const statusLabel = (m.employment_status || m.status || "active").toString().toLowerCase();
      const managerLabel = resolveManager(m).toString().toLowerCase();
      const role = (m.designation || m.title || "").toString().toLowerCase();

      const matchesGlobalSearch =
        !filters.search ||
        name.includes(filters.search.toLowerCase()) ||
        dept.includes(filters.search.toLowerCase()) ||
        role.includes(filters.search.toLowerCase()) ||
        (m.employee_id || "").toString().includes(filters.search);

      const matchesEmployeeId =
        !filters.employeeId ||
        (m.employee_id || "").toString().toLowerCase().includes(filters.employeeId.toLowerCase());

      const matchesRole = !filters.role || role.includes(filters.role.toLowerCase());

      const matchesStatus =
        !filters.statuses.length ||
        filters.statuses.some((s) => statusLabel.includes(s.toString().toLowerCase()));

      const matchesDept =
        filters.department === "all"
          ? true
          : dept === filters.department.toString().toLowerCase();

      const matchesManager =
        filters.manager === "all"
          ? true
          : managerLabel === filters.manager.toString().toLowerCase();

      const startDate =
        m.employment_start_date ||
        m.start_date ||
        m.hr_start_date ||
        m.joining_date;
      const start = toDateSafe(startDate);

      const matchesStartFrom =
        !filters.startDate.from || (start && start >= new Date(filters.startDate.from).getTime());
      const matchesStartTo =
        !filters.startDate.to || (start && start <= new Date(filters.startDate.to).getTime());

      const tenureYears = start ? (Date.now() - start) / (1000 * 60 * 60 * 24 * 365) : 0;
      const minTenure =
        filters.tenure.min !== "" && filters.tenure.min !== undefined
          ? Number(filters.tenure.min)
          : undefined;
      const maxTenure =
        filters.tenure.max !== "" && filters.tenure.max !== undefined
          ? Number(filters.tenure.max)
          : undefined;
      const matchesTenureMin = minTenure === undefined || tenureYears >= minTenure;
      const matchesTenureMax = maxTenure === undefined || tenureYears <= maxTenure;

      return (
        matchesGlobalSearch &&
        matchesEmployeeId &&
        matchesRole &&
        matchesStatus &&
        matchesDept &&
        matchesManager &&
        matchesStartFrom &&
        matchesStartTo &&
        matchesTenureMin &&
        matchesTenureMax
      );
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
  }, [activeMembers, filters, sortBy, managerOverrides]);

  const hierarchy = useMemo(() => {
    const grouped = new Map<string, any[]>();
    filtered.forEach((m: any) => {
      const manager = resolveManager(m);
      if (!grouped.has(manager)) grouped.set(manager, []);
      grouped.get(manager)?.push(m);
    });

    return Array.from(grouped.entries()).map(([manager, reports]) => ({
      manager,
      reports,
    }));
  }, [filtered]);

  const hierarchyView = useMemo(() => {
    const query = hierarchySearch.trim().toLowerCase();
    return hierarchy
      .filter((group) => (focusedManager === "all" ? true : group.manager === focusedManager))
      .map((group) => {
        const reports = query
          ? group.reports.filter((member: any) => {
              const name = `${member.first_name || ""} ${member.last_name || ""}`.toLowerCase();
              const department = (member.department || member.sub_organisation || "").toLowerCase();
              const role = (member.designation || member.title || "").toString().toLowerCase();
              const id = (member.employee_id || "").toString().toLowerCase();
              return (
                name.includes(query) ||
                department.includes(query) ||
                role.includes(query) ||
                id.includes(query)
              );
            })
          : group.reports;
        return { ...group, reports };
      })
      .filter((group) => group.reports.length > 0);
  }, [hierarchy, hierarchySearch, focusedManager]);

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
            {useDummyData && (
              <p className="text-xs text-orange-600 mt-1">
                Dummy data is loaded for hierarchy preview. Switch back to live data when ready.
              </p>
            )}
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
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFilters(createDefaultFilters());
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filterFields.map((field) => {
              if (field.type === "text") {
                return (
                  <div key={field.key} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
                    <Input
                      placeholder={field.placeholder || "Type to filter"}
                      value={(filters as any)[field.key]}
                      onChange={(e) => updateFilter(field.key, e.target.value)}
                    />
                  </div>
                );
              }

              if (field.type === "select" && field.options) {
                const value = (filters as any)[field.key] as string;
                return (
                  <div key={field.key} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
                    <Select value={value} onValueChange={(v) => updateFilter(field.key, v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt} value={opt.toString().toLowerCase()}>
                            {opt === "all" ? "Any" : opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              if (field.type === "multi" && field.options) {
                const selected = (filters as any)[field.key] as string[];
                return (
                  <div key={field.key} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {selected.length ? `${selected.length} selected` : "Any"}
                          <Filter className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[240px]">
                        <DropdownMenuCheckboxItem
                          checked={!selected.length}
                          onCheckedChange={() => updateFilter(field.key, [])}
                        >
                          Any
                        </DropdownMenuCheckboxItem>
                        {field.options.map((opt) => (
                          <DropdownMenuCheckboxItem
                            key={opt}
                            checked={selected.includes(opt)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? Array.from(new Set([...selected, opt]))
                                : selected.filter((s) => s !== opt);
                              updateFilter(field.key, next);
                            }}
                          >
                            {opt}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex flex-wrap gap-1">
                      {selected.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              }

              if (field.type === "dateRange") {
                return (
                  <div key={field.key} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={filters.startDate.from}
                        onChange={(e) =>
                          updateFilter("startDate", { ...filters.startDate, from: e.target.value })
                        }
                      />
                      <Input
                        type="date"
                        value={filters.startDate.to}
                        onChange={(e) =>
                          updateFilter("startDate", { ...filters.startDate, to: e.target.value })
                        }
                      />
                    </div>
                  </div>
                );
              }

              if (field.type === "numberRange") {
                return (
                  <div key={field.key} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.tenure.min}
                        onChange={(e) => updateFilter("tenure", { ...filters.tenure, min: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.tenure.max}
                        onChange={(e) => updateFilter("tenure", { ...filters.tenure, max: e.target.value })}
                      />
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <TabsList className="grid grid-cols-3 w-full md:w-[420px]">
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsContent value="cards" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((member: any, i: number) => {
                const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.employee_id;
                const manager = resolveManager(member);
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

          <TabsContent value="table" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Start date</TableHead>
                        <TableHead>Tenure</TableHead>
                        <TableHead className="text-right">Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((member: any, i: number) => {
                        const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.employee_id;
                        const department = member.sub_organisation || member.department || "Org";
                        const statusLabel = member.employment_status || member.status || "Active";
                        const manager = resolveManager(member);
                        const startDate =
                          member.employment_start_date ||
                          member.start_date ||
                          member.hr_start_date ||
                          member.joining_date;

                        return (
                          <TableRow key={member.employment_id || member.employee_id || i}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <SmartAvatar src={member.avatar_url} name={name} size={36} />
                                <div>
                                  <p className="font-semibold leading-tight">{name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.designation || member.title || department}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{department}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusBadge(statusLabel)}>
                                {statusLabel}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{manager}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDateDisplay(startDate)}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatTenureYears(startDate)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <Mail className="h-4 w-4 mr-1" />
                                  Email
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 px-2">
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {!filtered.length && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                            No team members match these filters yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hierarchy" className="mt-0 space-y-4">
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Hierarchy Builder</p>
                    <p className="text-xs text-muted-foreground">
                      Drag people between manager groups. Use search and filters to focus on a slice of the org.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button size="sm" variant="secondary" onClick={applyDummyHierarchy}>
                      Load dummy hierarchy
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setManagerOverrides({})}>
                      Reset hierarchy
                    </Button>
                    {useDummyData && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setUseDummyData(false);
                          setDummyMembers([]);
                          setManagerOverrides({});
                        }}
                      >
                        Use live data
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={compactHierarchy ? "default" : "outline"}
                      onClick={() => setCompactHierarchy((prev) => !prev)}
                    >
                      {compactHierarchy ? "Comfort view" : "Compact view"}
                    </Button>
                    {draggingMemberId && <Badge variant="secondary">Drop to reassign</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_0.8fr] gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search people, titles, departments..."
                      className="pl-9"
                      value={hierarchySearch}
                      onChange={(e) => setHierarchySearch(e.target.value)}
                    />
                  </div>
                  <Select value={focusedManager} onValueChange={(value) => setFocusedManager(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Focus manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All managers</SelectItem>
                      {managerOptions.map((manager) => (
                        <SelectItem key={manager} value={manager}>
                          {manager}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{hierarchyView.reduce((sum, group) => sum + group.reports.length, 0)} people shown</span>
                    <span>{hierarchyView.length} manager groups</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ScrollArea className="max-h-[70vh] pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverManager("Unassigned manager");
                }}
                onDragLeave={() => setDragOverManager(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnManager("Unassigned manager");
                }}
                className={
                  dragOverManager === "Unassigned manager"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-dashed"
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Unassigned manager
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Drop here to remove a reporting line and mark as unassigned.
                </CardContent>
              </Card>

              {hierarchyView.map(({ manager, reports }) => {
                const activeCount = reports.filter((m: any) =>
                  (m.employment_status || m.status || "").toString().toLowerCase().includes("active"),
                ).length;
                const leaveCount = reports.filter((m: any) =>
                  (m.employment_status || m.status || "").toString().toLowerCase().includes("leave"),
                ).length;
                const isCollapsed = collapsedManagers[manager];
                return (
                  <Card
                    key={manager}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverManager(manager);
                    }}
                    onDragLeave={() => setDragOverManager(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnManager(manager);
                    }}
                    className={
                      dragOverManager === manager
                        ? "border-primary bg-primary/5 shadow-sm"
                        : draggingMemberId
                          ? "border-primary/60"
                          : undefined
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <span className="truncate">{manager}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {reports.length} reports
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleManagerCollapse(manager)}
                          >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          {activeCount} active
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-orange-500" />
                          {leaveCount} on leave
                        </span>
                      </div>
                    </CardHeader>
                    {!isCollapsed && (
                      <CardContent className={compactHierarchy ? "space-y-2" : "space-y-3"}>
                        <div className="relative pl-4">
                          <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />
                        {reports.map((member: any, idx: number) => {
                          const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.employee_id;
                          const department = member.sub_organisation || member.department || "Org";
                          return (
                            <div
                              key={`${manager}-${idx}`}
                              draggable
                              onDragStart={() => setDraggingMemberId(getMemberId(member))}
                              onDragEnd={() => setDraggingMemberId(null)}
                              className={
                                compactHierarchy
                                  ? "flex items-center gap-2 rounded-md border bg-secondary/30 px-2 py-2 cursor-move"
                                  : "flex items-center gap-3 p-2 rounded-lg border bg-secondary/30 cursor-move"
                              }
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <SmartAvatar src={member.avatar_url} name={name} size={compactHierarchy ? 32 : 40} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.designation || department}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {member.employment_status || member.status || "Active"}
                              </Badge>
                            </div>
                          );
                        })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
              {!hierarchyView.length && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No reporting lines available for the current filters.
                  </CardContent>
                </Card>
              )}
              </div>
            </ScrollArea>
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
                      filters: { ...filters, sortBy, viewMode },
                      totals: derived,
                      managerOverrides,
                      draggingMemberId,
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

function formatDateDisplay(value: any): string {
  const ts = toDateSafe(value);
  if (!ts) return value || "N/A";
  return new Date(ts).toLocaleDateString();
}

function formatTenureYears(value: any): string {
  const ts = toDateSafe(value);
  if (!ts) return "—";
  const years = (Date.now() - ts) / (1000 * 60 * 60 * 24 * 365);
  return `${years.toFixed(1)} yrs`;
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