"use client";

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
  Table as TableIcon,
  LayoutGrid,
  GitBranch,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* -------------------------------- Utils -------------------------------- */

const statusBadge = (status: string) => {
  const s = status?.toLowerCase() || "active";
  if (s.includes("leave") || s.includes("absent"))
    return "bg-orange-100 text-orange-700";
  if (s.includes("active") || s.includes("present"))
    return "bg-green-100 text-green-700";
  return "bg-blue-100 text-blue-700";
};

function toDateSafe(value: any): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

/* -------------------------------- KPI -------------------------------- */

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  icon: any;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div
        className={cn(
          "p-2 rounded-md",
          tone === "success" && "bg-green-100 text-green-700",
          tone === "warning" && "bg-orange-100 text-orange-700",
          !tone && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

/* =============================== MAIN =============================== */

export default function Team() {
  const { user } = useEmployee();
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectTeamMembers);
  const status = useAppSelector(selectTeamStatus);
  const error = useAppSelector(selectTeamError);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "start">("name");
  const [view, setView] = useState<"cards" | "table" | "hierarchy">("cards");
  const [debug, setDebug] = useState(false);

  const isManager = true;

  useEffect(() => {
    if (isManager && user?.user_id) {
      dispatch(
        fetchTeam({
          portal_user: user.user_id,
          team_member: user.team_member,
          portal_id: "employee",
        }),
      );
    }
  }, [dispatch, user, isManager]);

  /* ----------------------------- Derived ----------------------------- */

  const derived = useMemo(() => {
    let active = 0;
    let onLeave = 0;
    members.forEach((m: any) => {
      const s = (m.employment_status || m.status || "").toLowerCase();
      if (s.includes("active")) active++;
      if (s.includes("leave")) onLeave++;
    });
    return {
      total: members.length,
      active,
      onLeave,
    };
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members
      .filter((m: any) => {
        const name = `${m.first_name} ${m.last_name}`.toLowerCase();
        const s = (m.employment_status || "").toLowerCase();
        return (
          (!q || name.includes(q)) &&
          (statusFilter === "all" || s.includes(statusFilter))
        );
      })
      .sort((a: any, b: any) => {
        if (sortBy === "name")
          return `${a.first_name}`.localeCompare(`${b.first_name}`);
        if (sortBy === "status")
          return `${a.status}`.localeCompare(`${b.status}`);
        return (
          toDateSafe(b.employment_start_date) -
          toDateSafe(a.employment_start_date)
        );
      });
  }, [members, search, statusFilter, sortBy]);

  /* ----------------------------- Render ----------------------------- */

  return (
    <Layout>
      <div className="space-y-6">

        {/* ================= HERO ================= */}
        <Card className="bg-gradient-to-r from-primary/5 to-background">
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-heading font-bold">My Team</h1>
                <p className="text-muted-foreground">
                  Manage and monitor your reporting structure
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant={debug ? "default" : "outline"}
                  onClick={() => setDebug(!debug)}
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Devtools
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Total Team" value={derived.total} icon={Users} />
              <Kpi
                label="Active"
                value={derived.active}
                icon={Sparkles}
                tone="success"
              />
              <Kpi
                label="On Leave"
                value={derived.onLeave}
                icon={Filter}
                tone="warning"
              />
              <Kpi label="System Status" value={status} icon={Layers} />
            </div>
          </CardContent>
        </Card>

        {/* ================= CONTROLS ================= */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search team members"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("status")}>
                  Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("start")}>
                  Start Date
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="cards">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="table">
                  <TableIcon className="h-4 w-4 mr-1" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="hierarchy">
                  <GitBranch className="h-4 w-4 mr-1" />
                  Hierarchy
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* ================= VIEWS ================= */}

        {/* ---------- TABLE VIEW ---------- */}
        {view === "table" && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m: any) => (
                    <TableRow key={m.employee_id}>
                      <TableCell className="flex items-center gap-2">
                        <SmartAvatar
                          name={`${m.first_name} ${m.last_name}`}
                          size={32}
                        />
                        {m.first_name} {m.last_name}
                      </TableCell>
                      <TableCell>{m.department || "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge(m.status)}>
                          {m.status || "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {m.employment_start_date || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ---------- CARD VIEW ---------- */}
        {view === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((m: any, i: number) => (
              <motion.div
                key={m.employee_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <Badge className={statusBadge(m.status)}>
                        {m.status || "Active"}
                      </Badge>
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-2">
                      <SmartAvatar
                        name={`${m.first_name} ${m.last_name}`}
                        size={72}
                      />
                      <div>
                        <p className="font-semibold">
                          {m.first_name} {m.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.designation || "Team Member"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* ---------- DEBUG ---------- */}
        {debug && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Inspector</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[300px]">
                <pre className="text-xs">
                  {JSON.stringify(filtered, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
