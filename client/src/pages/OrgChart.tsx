import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { SmartAvatar } from "@/components/SmartAvatar";
import { useEmployee } from "@/context/EmployeeProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTeam,
  selectTeamMembers,
  selectTeamStatus,
  selectTeamError,
} from "@/features/team/teamSlice";
import {
  Search,
  Users,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  List,
  Target,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Maximize2,
  Minimize2,
  Route,
  Info,
} from "lucide-react";

// -------------------- Types --------------------
type OrgNode = {
  id: string;
  name: string;
  title: string;
  department: string;
  status: string;
  managerName: string;
  managerId?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  location?: string;
  startDate?: string;
  type?: string;
  lastActive?: string;
};

// -------------------- UI Helpers --------------------
const statusBadgeClass = (status: string) => {
  const label = (status || "").toLowerCase();
  if (label.includes("leave") || label.includes("absent")) {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (label.includes("contract")) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// -------------------- Component --------------------
export default function OrgChart() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectTeamMembers);
  const status = useAppSelector(selectTeamStatus);
  const error = useAppSelector(selectTeamError);

  // Views
  const [viewMode, setViewMode] = useState<"chart" | "directory">("chart");

  // Filters
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search); // smoother typing for 2k+ lists
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [focusManagerId, setFocusManagerId] = useState("all");

  // Canvas controls
  const [zoom, setZoom] = useState(1);
  const [maxNodes, setMaxNodes] = useState(1200); // safer default for big orgs
  const [compactCards, setCompactCards] = useState(false);
  const [showMeta, setShowMeta] = useState(true);
  const [showExtendedCard, setShowExtendedCard] = useState(false); // <-- requested “extended view”
  const [maxDepth, setMaxDepth] = useState(20); // protect DOM for huge orgs

  // Demo
  const [useDemoData, setUseDemoData] = useState(false);
  const [demoSize, setDemoSize] = useState(240);

  // Selection + Fullscreen
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const chartScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user?.user_id) dispatch(fetchTeam({ portal_user: user.user_id }));
  }, [dispatch, user]);

  const demoMembers = useMemo(() => generateDemoOrg(demoSize), [demoSize]);
  const hasLiveData = members.length > 0;
  const isDemoMode = useDemoData || !hasLiveData;
  const activeMembers = useMemo(
    () => (isDemoMode ? demoMembers : members),
    [isDemoMode, demoMembers, members],
  );

  /**
   * Build org graph once per data change.
   * This is the heaviest part; we keep it tight and reuse maps/sets.
   */
  const orgData = useMemo(() => {
    const nodes: OrgNode[] = activeMembers.map((member: any, idx: number) => {
      const id = getMemberId(member, idx);
      const first = member.first_name || "";
      const last = member.last_name || "";
      const name =
        member.employee_name ||
        member.name ||
        `${first} ${last}`.trim() ||
        member.employee_id ||
        `Employee ${idx + 1}`;
      const managerName =
        member.manager_name ||
        member.manager ||
        member.reporting_manager ||
        member.reporting_manager_name ||
        "";
      const managerId =
        member.manager_id ||
        member.manager_employee_id ||
        member.manager_user_id;

      return {
        id,
        name,
        title: member.designation || member.title || member.role || "Team member",
        department:
          member.department || member.sub_organisation || member.org || "General",
        status: member.employment_status || member.status || "Active",
        managerName,
        managerId: managerId ? managerId.toString() : undefined,
        avatar: member.avatar_url,
        email: member.email || member.work_email,
        phone: member.mobile || member.phone,
        location: member.location || member.work_location || member.office || "Remote",
        startDate:
          member.employment_start_date ||
          member.start_date ||
          member.hr_start_date ||
          member.joining_date,
        type: member.employee_type || member.type || "Employee",
        lastActive: member.last_active || member.last_seen || "Recently active",
      };
    });

    const baseNodeById = new Map(nodes.map((node) => [node.id, node]));
    const nameToId = new Map(nodes.map((node) => [normalizeKey(node.name), node.id]));

    // Resolve managerId by id or name
    const resolvedNodes = nodes.map((node) => {
      const managerById =
        node.managerId && baseNodeById.has(node.managerId) ? node.managerId : undefined;
      const managerByName = node.managerName
        ? nameToId.get(normalizeKey(node.managerName))
        : undefined;
      return { ...node, managerId: managerById || managerByName };
    });

    const nodeById = new Map(resolvedNodes.map((node) => [node.id, node]));
    const childrenById = new Map<string, OrgNode[]>();
    const parentById = new Map<string, string>();
    const roots: OrgNode[] = [];

    const managerIds = new Set<string>();
    const departments = new Set<string>();
    const statuses = new Set<string>();

    for (const node of resolvedNodes) {
      departments.add(node.department);
      statuses.add(node.status);

      if (node.managerId && nodeById.has(node.managerId)) {
        parentById.set(node.id, node.managerId);
        const list = childrenById.get(node.managerId) || [];
        list.push(node);
        childrenById.set(node.managerId, list);
        managerIds.add(node.managerId);
      } else {
        roots.push(node);
      }
    }

    // sort only once
    childrenById.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    roots.sort((a, b) => a.name.localeCompare(b.name));

    const managerOptions = Array.from(managerIds)
      .map((id) => nodeById.get(id))
      .filter(Boolean) as OrgNode[];
    managerOptions.sort((a, b) => a.name.localeCompare(b.name));

    // Precompute report counts for extended view (O(n))
    const directReportsCountById = new Map<string, number>();
    childrenById.forEach((list, managerId) => {
      directReportsCountById.set(managerId, list.length);
    });

    return {
      nodes: resolvedNodes,
      nodeById,
      roots,
      childrenById,
      parentById,
      managerOptions,
      departmentOptions: Array.from(departments).sort(),
      statusOptions: Array.from(statuses).sort(),
      directReportsCountById,
    };
  }, [activeMembers]);

  const selectedNode = useMemo(
    () => (selectedId ? orgData.nodeById.get(selectedId) : undefined),
    [selectedId, orgData.nodeById],
  );

  const focusOptions = useMemo(() => {
    const base = [...orgData.managerOptions];
    if (selectedNode && !base.some((node) => node.id === selectedNode.id)) {
      base.unshift(selectedNode);
    }
    return base;
  }, [orgData.managerOptions, selectedNode]);

  /**
   * Visible + ordering:
   * - Filter matches
   * - Include ancestors for context
   * - Optional focus branch
   * - BFS to produce levels
   * - Protect DOM with maxNodes + maxDepth
   */
  const visibleOrg = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const hasFilters = Boolean(
      query || departmentFilter !== "all" || statusFilter !== "all",
    );

    const matches = new Set<string>();
    const allIds = new Set(orgData.nodes.map((node) => node.id));

    for (const node of orgData.nodes) {
      if (departmentFilter !== "all" && node.department !== departmentFilter) continue;
      if (statusFilter !== "all" && !(node.status || "").toLowerCase().includes(statusFilter))
        continue;

      if (query) {
        const haystack = [
          node.name,
          node.title,
          node.department,
          node.id,
          node.type || "",
          node.managerName || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) continue;
      }
      matches.add(node.id);
    }

    const visible = hasFilters ? new Set(matches) : new Set(allIds);

    // Add ancestors of matches so paths remain visible
    if (hasFilters) {
      for (const id of matches) {
        let current = orgData.parentById.get(id);
        while (current) {
          visible.add(current);
          current = orgData.parentById.get(current);
        }
      }
    }

    // Focus branch
    let focusSet: Set<string> | null = null;
    if (focusManagerId !== "all" && orgData.nodeById.has(focusManagerId)) {
      focusSet = new Set<string>();
      const queue = [focusManagerId];
      while (queue.length) {
        const id = queue.shift();
        if (!id || focusSet.has(id)) continue;
        focusSet.add(id);
        const children = orgData.childrenById.get(id) || [];
        for (const child of children) queue.push(child.id);
      }
    }

    if (focusSet) {
      for (const id of Array.from(visible)) {
        if (!focusSet.has(id)) visible.delete(id);
      }
      if (!visible.size && focusManagerId !== "all") visible.add(focusManagerId);
    }

    const startNodes =
      focusManagerId !== "all" && orgData.nodeById.has(focusManagerId)
        ? [orgData.nodeById.get(focusManagerId)!]
        : orgData.roots;

    const levels: OrgNode[][] = [];
    const ordered: OrgNode[] = [];
    const queue = startNodes.map((node) => ({ node, level: 0 }));
    let truncated = false;
    let depthTruncated = false;

    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;

      const { node, level } = current;

      if (level > maxDepth) {
        depthTruncated = true;
        continue;
      }
      if (!visible.has(node.id)) continue;

      if (ordered.length >= maxNodes) {
        truncated = true;
        break;
      }

      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
      ordered.push(node);

      const children = orgData.childrenById.get(node.id) || [];
      for (const child of children) queue.push({ node: child, level: level + 1 });
    }

    return {
      levels,
      ordered,
      visibleCount: visible.size,
      truncated,
      depthTruncated,
      total: orgData.nodes.length,
    };
  }, [
    orgData,
    deferredSearch,
    departmentFilter,
    statusFilter,
    focusManagerId,
    maxNodes,
    maxDepth,
  ]);

  const selectedReports = selectedNode ? orgData.childrenById.get(selectedNode.id) || [] : [];

  const selectedPath = useMemo(() => {
    if (!selectedNode) return [];
    const path: OrgNode[] = [];
    let current: OrgNode | undefined = selectedNode;
    while (current) {
      path.unshift(current);
      const parentId = orgData.parentById.get(current.id);
      current = parentId ? orgData.nodeById.get(parentId) : undefined;
    }
    return path;
  }, [selectedNode, orgData.parentById, orgData.nodeById]);

  // Make paths more visible: a fast lookup set for styling.
  const selectedPathIds = useMemo(() => new Set(selectedPath.map((n) => n.id)), [selectedPath]);
  const selectedDirectReportIds = useMemo(
    () => new Set(selectedReports.map((n) => n.id)),
    [selectedReports],
  );

  const centerOnSelected = () => {
    if (!selectedId) return;
    const element = document.getElementById(`org-node-${selectedId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  };

  const adjustZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return clamp(next, 0.6, 1.4);
    });
  };

  const totalManagers = orgData.managerOptions.length;
  const totalDepartments = orgData.departmentOptions.length;

  // -------------------- Directory Virtualization (no extra libs) --------------------
  const dirScrollRef = useRef<HTMLDivElement | null>(null);
  const [dirScrollTop, setDirScrollTop] = useState(0);

  const rowHeight = 52; // approximate, keeps it performant
  const overscan = 10;

  const onDirScroll = () => {
    const el = dirScrollRef.current;
    if (!el) return;
    setDirScrollTop(el.scrollTop);
  };

  const dirViewportHeight = 70 * 16; // ~70vh in px-ish baseline; recalculated below if we can
  const dirHeight = dirScrollRef.current?.clientHeight || dirViewportHeight;
  const dirTotal = visibleOrg.ordered.length;

  const startIndex = clamp(Math.floor(dirScrollTop / rowHeight) - overscan, 0, dirTotal);
  const endIndex = clamp(
    Math.ceil((dirScrollTop + dirHeight) / rowHeight) + overscan,
    0,
    dirTotal,
  );

  const dirSlice = useMemo(
    () => visibleOrg.ordered.slice(startIndex, endIndex),
    [visibleOrg.ordered, startIndex, endIndex],
  );

  // -------------------- Fullscreen wrapper styles --------------------
  const CanvasWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!isFullscreen) return <>{children}</>;

    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="h-full w-full">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto max-w-[1600px] px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-semibold truncate">Organization Chart</h2>
                  {isDemoMode && <Badge variant="secondary">Demo data</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Fullscreen canvas — use search / focus / zoom. ({status})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsFullscreen(false)}>
                  <Minimize2 className="h-4 w-4 mr-1" />
                  Exit
                </Button>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1600px] px-4 py-4 h-[calc(100vh-57px)] overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <CanvasWrapper>
        <div className="space-y-6">
          {!isFullscreen && (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-heading font-bold">Organization Chart</h1>
                  {isDemoMode && <Badge variant="secondary">Demo data</Badge>}
                </div>
                <p className="text-muted-foreground mt-1">
                  Explore reporting lines, focus teams, and manage the org at scale. ({status})
                </p>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => user?.user_id && dispatch(fetchTeam({ portal_user: user.user_id }))}
                >
                  Refresh
                </Button>
                <Button
                  variant={useDemoData ? "default" : "outline"}
                  disabled={!hasLiveData && isDemoMode}
                  onClick={() => {
                    if (!hasLiveData) {
                      setUseDemoData(true);
                      return;
                    }
                    setUseDemoData((prev) => !prev);
                  }}
                >
                  {isDemoMode ? (hasLiveData ? "Use live data" : "Demo data active") : "Load demo data"}
                </Button>
                <Button variant="outline" onClick={() => setIsFullscreen(true)}>
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Full page
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_320px] gap-6">
            {/* Left Sidebar */}
            <aside className="space-y-4">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" /> Org snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total people</span>
                    <span className="font-semibold">{orgData.nodes.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Managers</span>
                    <span className="font-semibold">{totalManagers}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Departments</span>
                    <span className="font-semibold">{totalDepartments}</span>
                  </div>

                  <div className="rounded-lg bg-secondary/30 p-3 text-xs text-muted-foreground space-y-1">
                    <div>
                      Showing {Math.min(visibleOrg.ordered.length, maxNodes)} of {visibleOrg.total} nodes.
                      {visibleOrg.truncated && " Increase the limit to see more."}
                    </div>
                    {visibleOrg.depthTruncated && (
                      <div className="flex items-center gap-2">
                        <Info className="h-3.5 w-3.5" />
                        Depth limited. Increase “Max depth” to render deeper levels.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Department focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    size="sm"
                    variant={departmentFilter === "all" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setDepartmentFilter("all")}
                  >
                    All departments
                  </Button>
                  <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
                    {orgData.departmentOptions.map((dept) => (
                      <Button
                        key={dept}
                        size="sm"
                        variant={departmentFilter === dept ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setDepartmentFilter(dept)}
                      >
                        {dept}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Performance controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Node limit</span>
                      <span>{maxNodes}</span>
                    </div>
                    <Slider
                      value={[maxNodes]}
                      min={200}
                      max={4000}
                      step={200}
                      onValueChange={(value) => setMaxNodes(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Max depth</span>
                      <span>{maxDepth}</span>
                    </div>
                    <Slider
                      value={[maxDepth]}
                      min={6}
                      max={60}
                      step={2}
                      onValueChange={(value) => setMaxDepth(value[0])}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={compactCards ? "default" : "outline"}
                      onClick={() => setCompactCards((prev) => !prev)}
                    >
                      {compactCards ? "Comfort" : "Compact"}
                    </Button>
                    <Button
                      size="sm"
                      variant={showMeta ? "default" : "outline"}
                      onClick={() => setShowMeta((prev) => !prev)}
                    >
                      {showMeta ? "Hide meta" : "Show meta"}
                    </Button>
                    <Button
                      size="sm"
                      variant={showExtendedCard ? "default" : "outline"}
                      onClick={() => setShowExtendedCard((prev) => !prev)}
                    >
                      {showExtendedCard ? "Extended on" : "Extended off"}
                    </Button>
                  </div>

                  {isDemoMode && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Demo size</span>
                        <span>{demoSize}</span>
                      </div>
                      <Slider
                        value={[demoSize]}
                        min={80}
                        max={2000}
                        step={80}
                        onValueChange={(value) => setDemoSize(value[0])}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>

            {/* Main */}
            <section className="space-y-4 min-w-0">
              <Card className="border-dashed">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search people, titles, departments..."
                        className="pl-9"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {orgData.statusOptions.map((option) => (
                            <SelectItem key={option} value={option.toLowerCase()}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={focusManagerId} onValueChange={setFocusManagerId}>
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Focus manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All managers</SelectItem>
                          {focusOptions.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Tabs
                        value={viewMode}
                        onValueChange={(value) => setViewMode(value as typeof viewMode)}
                      >
                        <TabsList>
                          <TabsTrigger value="chart" className="gap-1">
                            <LayoutGrid className="h-4 w-4" /> Chart
                          </TabsTrigger>
                          <TabsTrigger value="directory" className="gap-1">
                            <List className="h-4 w-4" /> Directory
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>

                      {!isFullscreen && (
                        <Button variant="outline" onClick={() => setIsFullscreen(true)}>
                          <Maximize2 className="h-4 w-4 mr-1" />
                          Full page
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Path visibility (requested): show breadcrumb + styling will highlight */}
                  {selectedPath.length > 0 && (
                    <div className="rounded-xl border bg-background/60 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Route className="h-4 w-4" />
                        <span className="font-medium text-foreground">Reporting path</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{selectedPath.length} hops</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedPath.map((n) => (
                          <button
                            key={`crumb-${n.id}`}
                            type="button"
                            className="text-left"
                            onClick={() => setSelectedId(n.id)}
                            title="Jump to person"
                          >
                            <Badge
                              variant="outline"
                              className={`text-[10px] transition ${
                                n.id === selectedId
                                  ? "border-primary/60 bg-primary/5"
                                  : "hover:bg-secondary/40"
                              }`}
                            >
                              {n.name}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {visibleOrg.visibleCount} visible
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3 w-3" /> {visibleOrg.levels.length} levels
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => adjustZoom(-0.1)}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <div className="w-[140px]">
                        <Slider
                          value={[Math.round(zoom * 100)]}
                          min={60}
                          max={140}
                          step={10}
                          onValueChange={(value) => setZoom(value[0] / 100)}
                        />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => adjustZoom(0.1)}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={centerOnSelected} disabled={!selectedId}>
                        <Target className="h-4 w-4 mr-1" />
                        Center
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
                {/* -------------------- Chart -------------------- */}
                <TabsContent value="chart" className="mt-0">
                  <Card className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-slate-100">
                    <div className="absolute inset-0 bg-[radial-gradient(#d7e0ea_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 via-transparent to-amber-50/60" />

                    <CardContent className="relative p-0">
                      <div ref={chartScrollRef} className="h-[70vh] overflow-auto">
                        <div
                          className="min-w-[1200px] px-10 py-12"
                          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                        >
                          {visibleOrg.levels.map((level, levelIndex) => {
                            const cardWidth = compactCards ? 210 : 260;
                            const minWidth = Math.max(960, level.length * cardWidth);

                            return (
                              <div key={`level-${levelIndex}`} className="relative pb-10">
                                {/* horizontal guide line */}
                                {levelIndex > 0 && (
                                  <div
                                    className={`absolute left-0 right-0 top-5 border-t border-dashed ${
                                      selectedPath.length ? "border-primary/20" : "border-slate-300/70"
                                    }`}
                                  />
                                )}

                                <div
                                  className="relative flex items-center justify-center gap-6 pt-6"
                                  style={{ minWidth }}
                                >
                                  {level.map((node) => {
                                    const isSelected = selectedId === node.id;
                                    const isOnPath = selectedPathIds.has(node.id);
                                    const isDirectReport = selectedDirectReportIds.has(node.id);

                                    // Make direct paths more visible:
                                    // - highlight breadcrumb nodes
                                    // - highlight direct reports
                                    // - keep selection strongest
                                    const highlightClass = isSelected
                                      ? "ring-2 ring-primary/70 shadow-md"
                                      : isOnPath
                                        ? "ring-1 ring-primary/40"
                                        : isDirectReport
                                          ? "ring-1 ring-sky-300/70"
                                          : "ring-0";

                                    const bgClass = isSelected
                                      ? "bg-white"
                                      : isOnPath
                                        ? "bg-primary/5"
                                        : isDirectReport
                                          ? "bg-sky-50/70"
                                          : "bg-white/90";

                                    const reportsCount = orgData.directReportsCountById.get(node.id) || 0;

                                    return (
                                      <div key={node.id} className="relative flex flex-col items-center">
                                        {/* vertical connector (stronger for path nodes) */}
                                        {levelIndex > 0 && (
                                          <div
                                            className={`absolute -top-6 left-1/2 h-6 w-px ${
                                              isOnPath ? "bg-primary/40" : "bg-slate-300/70"
                                            }`}
                                          />
                                        )}

                                        <button
                                          id={`org-node-${node.id}`}
                                          onClick={() => setSelectedId(node.id)}
                                          className="text-left"
                                          type="button"
                                        >
                                          <Card
                                            className={`rounded-xl border shadow-sm transition hover:shadow-md ${
                                              compactCards ? "w-[210px]" : "w-[260px]"
                                            } ${bgClass} ${highlightClass}`}
                                          >
                                            <CardContent className={compactCards ? "p-3" : "p-4"}>
                                              <div className="flex items-start gap-3">
                                                <SmartAvatar
                                                  src={node.avatar}
                                                  name={node.name}
                                                  size={compactCards ? 32 : 40}
                                                />

                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                      <p className="text-sm font-semibold truncate">{node.name}</p>
                                                      <p className="text-xs text-muted-foreground truncate">
                                                        {node.title}
                                                      </p>
                                                    </div>

                                                    {/* fast info badge */}
                                                    {reportsCount > 0 && (
                                                      <Badge
                                                        variant="outline"
                                                        className="text-[10px] shrink-0"
                                                        title="Direct reports"
                                                      >
                                                        {reportsCount}
                                                      </Badge>
                                                    )}
                                                  </div>

                                                  {showMeta && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                      <Badge
                                                        variant="secondary"
                                                        className={statusBadgeClass(node.status)}
                                                      >
                                                        {node.status}
                                                      </Badge>
                                                      <Badge variant="outline" className="text-[10px]">
                                                        {node.department}
                                                      </Badge>
                                                      <Badge variant="outline" className="text-[10px]">
                                                        {node.type}
                                                      </Badge>
                                                    </div>
                                                  )}

                                                  {/* Extended view requested: show richer stats without opening side panel */}
                                                  {showExtendedCard && (
                                                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                                                      <div className="rounded-md border bg-background/70 px-2 py-1">
                                                        <span className="block">Reports</span>
                                                        <span className="font-medium text-foreground">{reportsCount}</span>
                                                      </div>
                                                      <div className="rounded-md border bg-background/70 px-2 py-1">
                                                        <span className="block">Manager</span>
                                                        <span className="font-medium text-foreground truncate block">
                                                          {node.managerName || "—"}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              {showMeta && !compactCards && (
                                                <div className="mt-3 text-[11px] text-muted-foreground">
                                                  {node.lastActive}
                                                </div>
                                              )}
                                            </CardContent>
                                          </Card>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {!visibleOrg.levels.length && (
                            <div className="text-center text-muted-foreground">
                              No nodes match the current filters.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* -------------------- Directory (Virtualized) -------------------- */}
                <TabsContent value="directory" className="mt-0">
                  <Card>
                    <CardContent className="p-0">
                      <div
                        ref={dirScrollRef}
                        onScroll={onDirScroll}
                        className="max-h-[70vh] overflow-auto"
                      >
                        {/* Virtualized spacer */}
                        <div style={{ height: dirTotal * rowHeight, position: "relative" }}>
                          <div style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
                            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground">
                                <div className="col-span-3">Name</div>
                                <div className="col-span-2">Title</div>
                                <div className="col-span-2">Department</div>
                                <div className="col-span-2">Manager</div>
                                <div className="col-span-1">Status</div>
                                <div className="col-span-2">Location</div>
                              </div>
                            </div>

                            {dirSlice.map((node) => {
                              const isSelected = node.id === selectedId;
                              return (
                                <button
                                  key={`dir-${node.id}`}
                                  type="button"
                                  onClick={() => setSelectedId(node.id)}
                                  className={`w-full text-left border-b px-4 py-3 hover:bg-secondary/30 transition ${
                                    isSelected ? "bg-primary/5" : "bg-transparent"
                                  }`}
                                  style={{ height: rowHeight }}
                                >
                                  <div className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-3 font-medium truncate">{node.name}</div>
                                    <div className="col-span-2 truncate text-sm text-muted-foreground">
                                      {node.title}
                                    </div>
                                    <div className="col-span-2 truncate text-sm text-muted-foreground">
                                      {node.department}
                                    </div>
                                    <div className="col-span-2 truncate text-sm text-muted-foreground">
                                      {node.managerName || "Unassigned"}
                                    </div>
                                    <div className="col-span-1">
                                      <Badge
                                        variant="secondary"
                                        className={`${statusBadgeClass(node.status)} text-[10px]`}
                                      >
                                        {node.status}
                                      </Badge>
                                    </div>
                                    <div className="col-span-2 truncate text-sm text-muted-foreground">
                                      {node.location}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}

                            {!dirTotal && (
                              <div className="py-10 text-center text-muted-foreground">
                                No matching people found.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>

            {/* Right Sidebar */}
            <aside className="space-y-4">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" /> Focus tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    Focus a leader to trim the canvas to a single branch. Clear focus to restore the full org.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedNode && setFocusManagerId(selectedNode.id)}
                      disabled={!selectedNode}
                    >
                      Focus selection
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setFocusManagerId("all")}>
                      Clear focus
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Selected profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedNode ? (
                    <>
                      <div className="flex items-start gap-3">
                        <SmartAvatar src={selectedNode.avatar} name={selectedNode.name} size={48} />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{selectedNode.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{selectedNode.title}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge
                              variant="secondary"
                              className={statusBadgeClass(selectedNode.status)}
                            >
                              {selectedNode.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {selectedNode.department}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{selectedNode.email || "No email on file"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedNode.phone || "No phone listed"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedNode.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Started {formatDateDisplay(selectedNode.startDate)}</span>
                        </div>
                      </div>

                      {/* Requested: show number + info on extended view */}
                      <div className="rounded-lg border bg-secondary/20 p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Direct reports</span>
                          <span className="font-semibold">{selectedReports.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Reports to</span>
                          <span className="font-semibold">{selectedNode.managerName || "None"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total visible</span>
                          <span className="font-semibold">{visibleOrg.ordered.length}</span>
                        </div>
                      </div>

                      {selectedPath.length > 1 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Reporting path</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedPath.map((node) => (
                              <button
                                key={`path-${node.id}`}
                                type="button"
                                onClick={() => setSelectedId(node.id)}
                                className="text-left"
                              >
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    node.id === selectedId
                                      ? "border-primary/60 bg-primary/5"
                                      : "hover:bg-secondary/40"
                                  }`}
                                >
                                  {node.name}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          View profile
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Message
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Select a person on the chart to see profile details.
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </CanvasWrapper>
    </Layout>
  );
}

// -------------------- Utils --------------------
function formatDateDisplay(value: any): string {
  if (!value) return "N/A";
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return value;
  return new Date(ts).toLocaleDateString();
}

function getMemberId(member: any, index: number): string {
  return (
    member.employee_id ||
    member.employment_id ||
    member.id ||
    member.email ||
    `${member.first_name || "member"}-${member.last_name || index}`
  ).toString();
}

function generateDemoOrg(size: number): any[] {
  const firstNames = [
    "Avery",
    "Jordan",
    "Taylor",
    "Riley",
    "Parker",
    "Rowan",
    "Casey",
    "Jamie",
    "Skyler",
    "Reese",
    "Morgan",
    "Quinn",
    "Payton",
    "Ari",
    "Emerson",
    "Charlie",
  ];
  const lastNames = [
    "Morgan",
    "Lee",
    "Patel",
    "Nguyen",
    "Kim",
    "Garcia",
    "Owens",
    "Ali",
    "Reed",
    "Cooper",
    "Diaz",
    "Singh",
    "Hughes",
    "Baker",
  ];
  const departments = ["Engineering", "Product", "Design", "Operations", "Finance", "People", "Security", "Sales"];
  const titles = ["Director", "Manager", "Lead", "Senior", "Associate", "Principal", "Specialist"];
  const statuses = ["Active", "On Leave", "Contractor"];
  const locations = ["Remote", "London", "Austin", "Berlin", "Toronto", "Singapore"];

  const members: any[] = [
    {
      employee_id: "EMP-0001",
      first_name: "Avery",
      last_name: "Morgan",
      designation: "Chief Executive Officer",
      department: "Executive",
      employment_status: "Active",
      manager_name: "",
      start_date: "2015-01-15",
      location: "Global",
    },
  ];

  let managerIndex = 0;
  let employeeIndex = 2;
  const maxReports = 6;

  while (members.length < size && managerIndex < members.length) {
    const manager = members[managerIndex];
    const remaining = size - members.length;
    const reports = Math.min(maxReports, remaining);

    for (let i = 0; i < reports; i += 1) {
      const idx = employeeIndex + i;
      const first = firstNames[idx % firstNames.length];
      const last = lastNames[Math.floor(idx / firstNames.length) % lastNames.length];
      const department = departments[idx % departments.length];
      const title = titles[idx % titles.length];
      const year = 2016 + (idx % 8);
      const month = String((idx % 12) + 1).padStart(2, "0");
      const day = String((idx % 26) + 1).padStart(2, "0");

      members.push({
        employee_id: `EMP-${String(idx).padStart(4, "0")}`,
        first_name: first,
        last_name: last,
        designation: `${title} ${department}`,
        department,
        employment_status: statuses[idx % statuses.length],
        manager_name: `${manager.first_name} ${manager.last_name}`.trim(),
        start_date: `${year}-${month}-${day}`,
        location: locations[idx % locations.length],
        employee_type: idx % 5 === 0 ? "Contractor" : "Employee",
      });
    }

    employeeIndex += reports;
    managerIndex += 1;
  }

  return members;
}
