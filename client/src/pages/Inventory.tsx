import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Factory,
  Filter,
  MapPin,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  assetInventory as assetSeed,
  inventoryCatalog as seedCatalog,
  inventoryFinance,
  inventoryMovements as seedMovements,
  inventoryOrders as seedOrders,
  inventoryPrograms,
  inventoryRequests as seedRequests,
  inventorySuppliers,
  inventoryTickets as seedTickets,
  inventoryUsers,
} from "@/lib/mockData";
import {
  AllocationForm,
  InventoryForm,
  MetricCard,
  MovementForm,
  OrderForm,
  RequestForm,
  StatusBadge,
  TicketForm,
} from "./inventory/InventoryForms";

type InventoryItem = (typeof seedCatalog)[number];
type InventoryMovement = (typeof seedMovements)[number];
type InventoryOrder = (typeof seedOrders)[number];
type InventorySupplier = (typeof inventorySuppliers)[number];
type InventoryProgram = (typeof inventoryPrograms)[number];
type InventoryTicket = (typeof seedTickets)[number];
type InventoryRequest = (typeof seedRequests)[number];
type InventoryAllocation = {
  id: string;
  sku: string;
  name: string;
  userId: string;
  userName: string;
  action: "allocate" | "deallocate";
  quantity: number;
  location: string;
  date: string;
  notes?: string;
};

const storageKeys = {
  catalog: "inventory-catalog",
  movements: "inventory-movements",
  orders: "inventory-orders",
  tickets: "inventory-tickets",
  requests: "inventory-requests",
  assets: "assets-data",
  allocations: "inventory-allocations",
};

function readLocal<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored);
  } catch (_err) {
    return fallback;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Inventory() {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [ticketFormOpen, setTicketFormOpen] = useState(false);
  const [movementFormOpen, setMovementFormOpen] = useState<InventoryItem | null>(null);
  const [allocationForm, setAllocationForm] = useState<{ item: InventoryItem | null; mode: "allocate" | "deallocate" | null }>({
    item: null,
    mode: null,
  });
  const [movementTypeFilter, setMovementTypeFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderPriorityFilter, setOrderPriorityFilter] = useState("all");
  const [restockLocationFilter, setRestockLocationFilter] = useState("all");
  const [categoryDrillFilter, setCategoryDrillFilter] = useState("all");

  const [catalog, setCatalog] = useState<InventoryItem[]>(() =>
    readLocal(storageKeys.catalog, seedCatalog),
  );
  const [movements, setMovements] = useState<InventoryMovement[]>(() =>
    readLocal(storageKeys.movements, seedMovements),
  );
  const [orders, setOrders] = useState<InventoryOrder[]>(() => readLocal(storageKeys.orders, seedOrders));
  const [tickets, setTickets] = useState<InventoryTicket[]>(() => readLocal(storageKeys.tickets, seedTickets));
  const [requests, setRequests] = useState<InventoryRequest[]>(() => readLocal(storageKeys.requests, seedRequests));
  const [allocations, setAllocations] = useState<InventoryAllocation[]>(() =>
    readLocal(storageKeys.allocations, [] as InventoryAllocation[]),
  );

  const perPage = 16;

  useEffect(() => setPage(0), [search, statusFilter, categoryFilter, locationFilter, ownerFilter]);
  useEffect(() => localStorage?.setItem(storageKeys.catalog, JSON.stringify(catalog)), [catalog]);
  useEffect(() => localStorage?.setItem(storageKeys.movements, JSON.stringify(movements)), [movements]);
  useEffect(() => localStorage?.setItem(storageKeys.orders, JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage?.setItem(storageKeys.tickets, JSON.stringify(tickets)), [tickets]);
  useEffect(() => localStorage?.setItem(storageKeys.requests, JSON.stringify(requests)), [requests]);
  useEffect(() => localStorage?.setItem(storageKeys.allocations, JSON.stringify(allocations)), [allocations]);

  const derived = useMemo(() => {
    const totalSkus = catalog.length;
    const unitsOnHand = catalog.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const critical = catalog.filter((item) => item.quantity <= item.minLevel).length;
    const stockValue = catalog.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitCost || 0), 0);
    const statuses = Array.from(new Set(catalog.map((i) => i.status || "")));
    const categories = Array.from(new Set(catalog.map((i) => i.category)));
    const locations = Array.from(new Set(catalog.map((i) => i.location)));
    const owners = Array.from(new Set(catalog.map((i) => i.owner)));
    return { totalSkus, unitsOnHand, critical, stockValue, statuses, categories, locations, owners };
  }, [catalog]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return catalog.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.sku || "").toLowerCase().includes(query) ||
        (item.category || "").toLowerCase().includes(query) ||
        (item.tags || []).some((t: string) => t.toLowerCase().includes(query));

      const matchesStatus = statusFilter === "all" ? true : (item.status || "").toLowerCase().includes(statusFilter);
      const matchesCategory = categoryFilter === "all" ? true : (item.category || "").toLowerCase() === categoryFilter;
      const matchesLocation = locationFilter === "all" ? true : (item.location || "").toLowerCase() === locationFilter;
      const matchesOwner = ownerFilter === "all" ? true : (item.owner || "").toLowerCase() === ownerFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesOwner;
    });
  }, [catalog, search, statusFilter, categoryFilter, locationFilter, ownerFilter]);

  const pagedItems = useMemo(
    () => filtered.slice(page * perPage, page * perPage + perPage),
    [filtered, page],
  );

  const topCategories = useMemo(() => {
    const tally = new Map<string, number>();
    catalog.forEach((item) => {
      tally.set(item.category, (tally.get(item.category) || 0) + (item.quantity || 0));
    });
    return Array.from(tally.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [catalog]);

  const storageMap = useMemo(() => {
    const buckets = new Map<string, { units: number; skus: number }>();
    catalog.forEach((item) => {
      const current = buckets.get(item.location) || { units: 0, skus: 0 };
      buckets.set(item.location, { units: current.units + (item.quantity || 0), skus: current.skus + 1 });
    });
    return Array.from(buckets.entries())
      .map(([location, stats]) => ({ location, ...stats }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);
  }, [catalog]);

  const criticalItems = useMemo(
    () => filtered.filter((item) => item.quantity <= item.minLevel + 1).slice(0, 8),
    [filtered],
  );

  const movementFeed: InventoryMovement[] = useMemo(
    () => movements.slice(0, 12),
    [movements],
  );

  const receiptFeed: InventoryMovement[] = useMemo(
    () => movements.filter((m) => (m.quantity || 0) > 0).slice(0, 20),
    [movements],
  );

  const allocationFeed: InventoryAllocation[] = useMemo(
    () => allocations.slice(0, 20),
    [allocations],
  );

  const filteredMovements = useMemo(() => {
    return movements.filter((m) =>
      movementTypeFilter === "all" ? true : m.type.toLowerCase() === movementTypeFilter,
    );
  }, [movements, movementTypeFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = orderStatusFilter === "all" ? true : o.status.toLowerCase() === orderStatusFilter;
      const matchesPriority = orderPriorityFilter === "all" ? true : o.priority.toLowerCase() === orderPriorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [orders, orderPriorityFilter, orderStatusFilter]);

  const restockList = useMemo(
    () =>
      criticalItems.filter((item) =>
        restockLocationFilter === "all" ? true : item.location.toLowerCase() === restockLocationFilter,
      ),
    [criticalItems, restockLocationFilter],
  );

  const categoryDrill = useMemo(() => {
    const grouped = new Map<string, InventoryItem[]>();
    catalog.forEach((item) => {
      if (!grouped.has(item.category)) grouped.set(item.category, []);
      grouped.get(item.category)?.push(item);
    });
    const entries = Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      skus: items.length,
      units: items.reduce((acc, i) => acc + (i.quantity || 0), 0),
      value: items.reduce((acc, i) => acc + (i.quantity || 0) * (i.unitCost || 0), 0),
      items,
    }));
    const filteredCategory = categoryDrillFilter === "all" ? entries : entries.filter((e) => e.category.toLowerCase() === categoryDrillFilter);
    return filteredCategory.sort((a, b) => b.units - a.units);
  }, [catalog, categoryDrillFilter]);

  const filteredRequests = useMemo(() => requests, [requests]);

  const currentUsage = useMemo(() => {
    const latest = new Map<string, InventoryAllocation>();
    allocations.forEach((alloc) => {
      const prev = latest.get(alloc.sku);
      if (!prev || new Date(alloc.date) > new Date(prev.date)) latest.set(alloc.sku, alloc);
    });
    return Array.from(latest.values()).filter((a) => a.action === "allocate");
  }, [allocations]);

  const start = filtered.length ? page * perPage + 1 : 0;
  const end = filtered.length ? Math.min(page * perPage + perPage, filtered.length) : 0;

  const handleReset = () => {
    setCatalog(seedCatalog);
    setMovements(seedMovements);
    setOrders(seedOrders);
    setTickets(seedTickets);
    setRequests(seedRequests);
    setAllocations([]);
  };

  const handleSaveItem = (item: Partial<InventoryItem>) => {
    if (!item.name || !item.category) return;
    if (item.id) {
      setCatalog((prev) => prev.map((p) => (p.id === item.id ? { ...p, ...item } as InventoryItem : p)));
      return;
    }

    const id = `INV-${(catalog.length + 1001).toString().padStart(4, "0")}`;
    const sku = `NEW-${(catalog.length + 1).toString().padStart(4, "0")}`;
    const next: InventoryItem = {
      id,
      sku,
      name: item.name,
      category: item.category,
      status: item.status || "In stock",
      condition: item.condition || "New",
      location: item.location || "London HQ",
      owner: item.owner || "IT Ops",
      quantity: item.quantity || 1,
      minLevel: item.minLevel || 2,
      reorderTo: item.reorderTo || 6,
      supplier: item.supplier || "Amazon Business",
      unitCost: item.unitCost || 100,
      batch: item.batch || "B-2025-00",
      warrantyEnd: item.warrantyEnd || "2026-12-31",
      lastAudit: item.lastAudit || "2025-01-01",
      tags: item.tags || ["new"],
    };
    setCatalog((prev) => [next, ...prev]);
    setMovements((prev) => [
      {
        id: `MOVE-${(prev.length + 1).toString().padStart(4, "0")}`,
        sku,
        name: next.name,
        type: "Restock",
        date: new Date().toISOString().slice(0, 10),
        quantity: next.quantity,
        actor: "Inventory Ops",
        location: next.location,
        status: "Completed",
        project: "Intake",
      },
      ...prev,
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setCatalog((prev) => prev.filter((item) => item.id !== id));
  };

  const syncAssetFromAllocation = (item: InventoryItem, userName: string) => {
    const assets = readLocal(storageKeys.assets, assetSeed);
    const id = `AST-${item.id}`;
    const now = new Date().toISOString().slice(0, 10);
    const newAsset = {
      id,
      name: item.name,
      type: item.category,
      status: "In use",
      owner: userName || "Allocated",
      tag: item.sku,
      serial: item.sku,
      location: item.location,
      assignedDate: now,
      warrantyEnd: item.warrantyEnd,
      renewal: item.warrantyEnd,
      managedBy: item.owner,
      notes: "Created from inventory allocation",
    };

    const exists = assets.find((a: any) => a.id === id);
    const nextAssets = exists
      ? assets.map((a: any) => (a.id === id ? { ...a, ...newAsset } : a))
      : [newAsset, ...assets];
    localStorage?.setItem(storageKeys.assets, JSON.stringify(nextAssets));
  };

  const handleAllocation = (payload: { item: InventoryItem; mode: "allocate" | "deallocate"; userId: string; userName: string; quantity: number; notes?: string }) => {
    const { item, mode, userId, userName, notes } = payload;
    const quantity = Math.max(1, payload.quantity || 1);
    if (mode === "allocate" && (item.quantity || 0) <= 0) return;

    setCatalog((prev) =>
      prev.map((p) => {
        if (p.id !== item.id) return p;
        const delta = mode === "allocate" ? -quantity : quantity;
        const nextQty = Math.max(0, (p.quantity || 0) + delta);
        const nextStatus = nextQty === 0 && mode === "allocate" ? "Allocated" : mode === "deallocate" ? "In stock" : p.status;
        return { ...p, quantity: nextQty, status: nextStatus };
      }),
    );

    const movementType = mode === "allocate" ? "Check-out" : "Return";
    const movementQuantity = mode === "allocate" ? -Math.abs(quantity) : Math.abs(quantity);
    const movement = {
      id: `MOVE-${(movements.length + 1).toString().padStart(4, "0")}`,
      sku: item.sku,
      name: item.name,
      type: movementType,
      date: new Date().toISOString().slice(0, 10),
      quantity: movementQuantity,
      actor: userName,
      location: item.location,
      status: "Completed",
      project: mode === "allocate" ? "Allocation" : "Return",
    } as InventoryMovement;
    setMovements((prev) => [movement, ...prev]);

    const allocation: InventoryAllocation = {
      id: `ALLOC-${(allocations.length + 1).toString().padStart(4, "0")}`,
      sku: item.sku,
      name: item.name,
      userId,
      userName,
      action: mode,
      quantity,
      location: item.location,
      date: movement.date,
      notes,
    };
    setAllocations((prev) => [allocation, ...prev]);

    if (mode === "allocate") syncAssetFromAllocation(item, userName);
  };

  const handleAddMovement = (movement: Partial<InventoryMovement>) => {
    if (!movement.name || !movement.type) return;
    const id = `MOVE-${(movements.length + 1).toString().padStart(4, "0")}`;
    const payload: InventoryMovement = {
      id,
      sku: movement.sku || "N/A",
      name: movement.name,
      type: movement.type,
      date: movement.date || new Date().toISOString().slice(0, 10),
      quantity: movement.quantity || 0,
      actor: movement.actor || "Inventory Ops",
      location: movement.location || "London HQ",
      status: movement.status || "Scheduled",
      project: movement.project || "Ad-hoc",
    };
    setMovements((prev) => [payload, ...prev]);
  };

  const handleAddTicket = (ticket: Partial<InventoryTicket>) => {
    if (!ticket.title) return;
    const id = `TKT-${(tickets.length + 1).toString().padStart(4, "0")}`;
    const payload: InventoryTicket = {
      id,
      title: ticket.title,
      status: ticket.status || "Open",
      owner: ticket.owner || "Inventory Ops",
      priority: ticket.priority || "Medium",
      category: ticket.category || "Maintenance",
      opened: ticket.opened || new Date().toISOString().slice(0, 10),
      relatedSku: ticket.relatedSku || "",
    };
    setTickets((prev) => [payload, ...prev]);
  };

  const handleAddRequest = (req: Partial<InventoryRequest>) => {
    if (!req.item) return;
    const id = `REQ-${(requests.length + 9001).toString()}`;
    const payload: InventoryRequest = {
      id,
      requester: req.requester || "Unassigned",
      userId: req.userId || "",
      item: req.item,
      type: req.type || "Hardware",
      status: req.status || "Pending",
      neededBy: req.neededBy || new Date().toISOString().slice(0, 10),
      priority: req.priority || "Medium",
      notes: req.notes || "",
    };
    setRequests((prev) => [payload, ...prev]);
  };

  const handleUpdateRequestStatus = (id: string, status: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleAddOrder = (order: Partial<InventoryOrder>) => {
    if (!order.vendor || !order.status) return;
    const id = `PO-${(orders.length + 9821).toString()}`;
    const payload: InventoryOrder = {
      id,
      vendor: order.vendor,
      status: order.status || "Pending approval",
      priority: order.priority || "Standard",
      eta: order.eta || new Date().toISOString().slice(0, 10),
      items: order.items && order.items.length ? order.items : ["TBD"],
      value: order.value || 0,
      tracking: order.tracking || "TBC",
    };
    setOrders((prev) => [payload, ...prev]);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Unified inventory + fulfilment
            </div>
            <h1 className="text-3xl font-heading font-bold">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              CRUD-ready catalog tied to assets, allocations, tickets, and finance-ready exports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <RefreshCcw className="h-4 w-4" />
              Reset to seed
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Boxes className="h-4 w-4" />
                  Intake shipment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Intake shipment</DialogTitle>
                </DialogHeader>
                <MovementForm
                  defaults={{ type: "Restock", status: "Completed" }}
                  onSubmit={(movement) => {
                    handleAddMovement(movement);
                    setCatalog((prev) =>
                      prev.map((p) =>
                        p.sku === movement.sku ? { ...p, quantity: (p.quantity || 0) + (movement.quantity || 0) } : p,
                      ),
                    );
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="restocks">Restocks</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Warehouse}
                label="Stocked SKUs"
                value={derived.totalSkus.toLocaleString()}
                meta={`${derived.unitsOnHand.toLocaleString()} units on hand`}
              />
              <MetricCard
                icon={BarChart3}
                label="Inventory value"
                value={formatCurrency(derived.stockValue)}
                meta="Blended landed cost"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Critical levels"
                value={derived.critical.toString()}
                meta="Tracked below threshold"
                tone="warning"
              />
              <MetricCard
                icon={ShieldCheck}
                label="Compliance & audits"
                value="Fresh"
                meta="Rolling audits updated"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Top categories</CardTitle>
                    <p className="text-sm text-muted-foreground">Volume-based view across the full catalog.</p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {catalog.length}+ SKUs
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topCategories.map((entry) => {
                    const pct = Math.round((entry.total / derived.unitsOnHand) * 100);
                    return (
                      <div key={entry.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{entry.category}</span>
                          <span className="text-muted-foreground">{entry.total.toLocaleString()} units · {pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Programs</CardTitle>
                  <p className="text-sm text-muted-foreground">Ops initiatives with ownership and KPIs.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inventoryPrograms.map((program: InventoryProgram) => (
                    <div key={program.name} className="p-3 rounded-xl bg-muted/40">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{program.name}</p>
                          <p className="text-xs text-muted-foreground">{program.owner}</p>
                        </div>
                        <Badge variant="outline">{program.window}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>{program.kpi}</span>
                        <span className="font-semibold text-primary">{program.progress}%</span>
                      </div>
                      <Progress value={program.progress} className="h-2 mt-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Critical restocks</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Items under minimum threshold with recommended reorder.
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Live risk scoring
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {criticalItems.map((item) => (
                    <div key={item.id} className="rounded-xl border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category} · {item.location}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">On hand</span>
                        <span className="font-semibold">{item.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Min level {item.minLevel}</span>
                        <span>Reorder to {item.reorderTo}</span>
                      </div>
                    </div>
                  ))}
                  {!criticalItems.length && <p className="text-sm text-muted-foreground">No critical items detected.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Movements</CardTitle>
                  <p className="text-sm text-muted-foreground">Inbound and outbound events sampled across the catalog.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-[320px] pr-3">
                    <div className="space-y-3">
                      {movementFeed.map((move) => (
                        <div key={move.id} className="rounded-xl border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">{move.type.toLowerCase()}</Badge>
                            <span className="text-xs text-muted-foreground">{move.date}</span>
                          </div>
                          <p className="font-medium text-sm">{move.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {move.location} · {move.actor}
                          </p>
                          <div className="text-xs font-semibold text-primary">
                            {move.quantity > 0 ? "+" : ""}
                            {move.quantity} units · {move.project}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Storage map</CardTitle>
                  <p className="text-sm text-muted-foreground">Units and SKU density per location.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {storageMap.map((row) => (
                    <div key={row.location} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{row.location}</span>
                        </div>
                        <span className="text-muted-foreground">{row.skus} SKUs</span>
                      </div>
                      <Progress value={(row.units / derived.unitsOnHand) * 100} className="h-2 mt-2" />
                      <div className="text-xs text-muted-foreground mt-1">{row.units.toLocaleString()} units</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Inbound & approvals</CardTitle>
                    <p className="text-sm text-muted-foreground">High-volume PO intake with visibility by ETA.</p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Truck className="h-3 w-3" />
                    {orders.length} active
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orders.map((order: InventoryOrder) => (
                    <div key={order.id} className="border rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{order.id}</Badge>
                          <p className="font-medium">{order.vendor}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize">{order.priority}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ETA {order.eta} · {order.status} · {order.items.join(", ")}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">{order.tracking}</span>
                        <span className="font-semibold">{formatCurrency(order.value)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Finance & reporting</CardTitle>
                  <p className="text-sm text-muted-foreground">Blended finance snapshot with export-ready data.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("finance.csv", inventoryFinance)}>
                  <ArrowDownToLine className="h-4 w-4" />
                  Download finance CSV
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {inventoryFinance.map((row) => (
                  <div key={row.label} className="rounded-xl border p-3 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
                    <p className="text-2xl font-semibold">{formatCurrency(row.value)}</p>
                    <p className="text-xs text-muted-foreground">{row.context}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Categories breakdown</CardTitle>
                  <p className="text-sm text-muted-foreground">Units, value, and SKUs by category with drill-down.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={categoryDrillFilter} onValueChange={setCategoryDrillFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {derived.categories.map((c) => (
                        <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("categories.csv", categoryDrill)}>
                    <ArrowDownToLine className="h-4 w-4" />
                    Export categories
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categoryDrill.map((entry) => (
                  <div key={entry.category} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{entry.category}</p>
                      <Badge variant="outline">{entry.skus} SKUs</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{entry.units.toLocaleString()} units</div>
                    <div className="text-sm font-semibold">{formatCurrency(entry.value)}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {entry.items.slice(0, 3).map((i) => i.name).join(", ")}
                      {entry.items.length > 3 ? "…" : ""}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restocks" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Restock queue</CardTitle>
                  <p className="text-sm text-muted-foreground">Low-stock items with quick actions and filters.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={restockLocationFilter} onValueChange={setRestockLocationFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {derived.locations.map((loc) => (
                        <SelectItem key={loc} value={loc.toLowerCase()}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("restocks.csv", restockList)}>
                    <ArrowDownToLine className="h-4 w-4" />
                    Export restocks
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {restockList.map((item) => (
                  <div key={item.id} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.category} · {item.location}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>On hand {item.quantity}</span>
                      <span>Min {item.minLevel}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => setMovementFormOpen(item)}>Restock</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setTicketFormOpen(true)}>
                        Raise ticket
                      </Button>
                    </div>
                  </div>
                ))}
                {!restockList.length && <p className="text-sm text-muted-foreground">No items need restock.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Movement history</CardTitle>
                  <p className="text-sm text-muted-foreground">Full movement log with filters and export.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {Array.from(new Set(movements.map((m) => m.type.toLowerCase()))).map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("movements.csv", filteredMovements)}>
                    <ArrowDownToLine className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Type</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="capitalize">{m.type.toLowerCase()}</TableCell>
                        <TableCell>{m.sku}</TableCell>
                        <TableCell className="font-semibold">{m.name}</TableCell>
                        <TableCell className="text-muted-foreground">{m.location}</TableCell>
                        <TableCell className="text-muted-foreground">{m.actor}</TableCell>
                        <TableCell className="text-muted-foreground">{m.date}</TableCell>
                        <TableCell className="text-right font-semibold">{m.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!filteredMovements.length && <div className="p-4 text-sm text-muted-foreground text-center">No movements match filters.</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Storage & locations</CardTitle>
                <p className="text-sm text-muted-foreground">SKU density and units by storage site.</p>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {storageMap.map((row) => (
                  <div key={row.location} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{row.location}</span>
                      <Badge variant="outline">{row.skus} SKUs</Badge>
                    </div>
                    <Progress value={(row.units / derived.unitsOnHand) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground">{row.units.toLocaleString()} units</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Procurement / Orders</CardTitle>
                  <p className="text-sm text-muted-foreground">Track POs with status and priority filters.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Array.from(new Set(orders.map((o) => o.status.toLowerCase()))).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={orderPriorityFilter} onValueChange={setOrderPriorityFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      {Array.from(new Set(orders.map((o) => o.priority.toLowerCase()))).map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Truck className="h-4 w-4" />
                        New PO
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create purchase order</DialogTitle>
                      </DialogHeader>
                      <OrderForm onSubmit={(order) => { handleAddOrder(order); }} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("orders.csv", filteredOrders)}>
                    <ArrowDownToLine className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order: InventoryOrder) => (
                  <div key={order.id} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{order.id}</Badge>
                      <Badge variant="secondary" className="capitalize">{order.priority}</Badge>
                    </div>
                    <div className="font-semibold">{order.vendor}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.status} · ETA {order.eta}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{order.items.join(", ")}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{order.tracking}</span>
                      <span className="font-semibold">{formatCurrency(order.value)}</span>
                    </div>
                  </div>
                ))}
                {!filteredOrders.length && <p className="text-sm text-muted-foreground">No orders match filters.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Finance & reporting</CardTitle>
                  <p className="text-sm text-muted-foreground">Detailed breakdown with export.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("finance.csv", inventoryFinance)}>
                  <ArrowDownToLine className="h-4 w-4" />
                  Download CSV
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {inventoryFinance.map((row) => (
                  <div key={row.label} className="rounded-xl border p-3 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
                    <p className="text-2xl font-semibold">{formatCurrency(row.value)}</p>
                    <p className="text-xs text-muted-foreground">{row.context}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>User / self-serve requests</CardTitle>
                  <p className="text-sm text-muted-foreground">Approve, fulfil, or reject incoming requests.</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      New request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Capture request</DialogTitle>
                    </DialogHeader>
                    <RequestForm
                      onSubmit={(req) => {
                        handleAddRequest(req);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>ID</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Needed by</TableHead>
                      <TableHead className="text-right">Priority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.id}</TableCell>
                        <TableCell className="font-semibold">{req.requester}</TableCell>
                        <TableCell>{req.item}</TableCell>
                        <TableCell>{req.type}</TableCell>
                        <TableCell>
                          <StatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{req.neededBy}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="capitalize">
                            {req.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleUpdateRequestStatus(req.id, "Approved")}>
                              Approve
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleUpdateRequestStatus(req.id, "In fulfilment")}>
                              Fulfil
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleUpdateRequestStatus(req.id, "Rejected")}>
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!filteredRequests.length && <div className="p-4 text-center text-sm text-muted-foreground">No requests logged.</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            <Card>
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Catalog & lifecycle</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Filter across {catalog.length}+ line items and lifecycle states.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Wrench className="h-4 w-4" />
                          Add / edit item
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{selectedItem ? "Edit item" : "Create item"}</DialogTitle>
                        </DialogHeader>
                        <InventoryForm
                          defaults={selectedItem || undefined}
                          onSubmit={(payload) => {
                            handleSaveItem(payload);
                            setSelectedItem(null);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="gap-2" onClick={() => downloadCsv("inventory.csv", filtered)}>
                      <Filter className="h-4 w-4" />
                      Export filtered
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2 rounded-lg border p-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search SKU, name, tag"
                      className="border-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {derived.categories.map((c) => (
                        <SelectItem key={c} value={c.toLowerCase()}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {derived.statuses.map((s) => (
                        <SelectItem key={s} value={s.toLowerCase()}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {derived.locations.map((loc) => (
                        <SelectItem key={loc} value={loc.toLowerCase()}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All owners</SelectItem>
                      {derived.owners.map((owner) => (
                        <SelectItem key={owner} value={owner.toLowerCase()}>
                          {owner}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {["In stock", "Allocated", "Reserved", "In transit", "Pending return", "Maintenance"].map((status) => (
                    <Badge
                      key={status}
                      variant={statusFilter === status.toLowerCase() ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() =>
                        setStatusFilter((prev) => (prev === status.toLowerCase() ? "all" : status.toLowerCase()))
                      }
                    >
                      {status}
                    </Badge>
                  ))}
                </div>

                <div className="rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Min</TableHead>
                        <TableHead className="text-right">Supplier</TableHead>
                        <TableHead className="text-right">Warranty</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedItems.map((item: InventoryItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.name}</span>
                              <span className="text-xs text-muted-foreground">{item.owner}</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.location}</TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                          <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.minLevel}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.supplier}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.warrantyEnd}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); }}>
                                Edit
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => setAllocationForm({ item, mode: "allocate" })}>
                                Allocate
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setMovementFormOpen(item)}>
                                Move
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setAllocationForm({ item, mode: "deallocate" })}>
                                De-allocate
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteItem(item.id)}>
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {!pagedItems.length && (
                    <div className="p-6 text-center text-muted-foreground text-sm">No items match your filters.</div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Showing {start}-{end} of {filtered.length.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPage((p) => (p + 1 < Math.ceil(filtered.length / perPage) ? p + 1 : p))
                      }
                      disabled={page + 1 >= Math.ceil(filtered.length / perPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {inventorySuppliers.map((supplier: InventorySupplier) => (
                <Card key={supplier.name} className="h-full">
                  <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        {supplier.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                    </div>
                    {supplier.preferred && <Badge variant="outline">Preferred</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">On-time rate</span>
                      <span className="font-semibold">{supplier.onTime}%</span>
                    </div>
                    <Progress value={supplier.onTime} className="h-2" />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          Avg lead
                        </div>
                        <div className="font-semibold">{supplier.avgLead} days</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BarChart3 className="h-4 w-4" />
                          Spend YTD
                        </div>
                        <div className="font-semibold">{formatCurrency(supplier.spendYtd)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Regions: {supplier.regions.join(", ")}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Recent orders</CardTitle>
                  <p className="text-sm text-muted-foreground">High-density procurement queue.</p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Auto-reviewed
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {orders.map((order: InventoryOrder) => (
                  <div key={order.id} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{order.id}</Badge>
                      <Badge variant="secondary" className="capitalize">{order.priority}</Badge>
                    </div>
                    <div className="font-semibold">{order.vendor}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.status} · ETA {order.eta}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{order.items.join(", ")}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{order.tracking}</span>
                      <span className="font-semibold">{formatCurrency(order.value)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Tickets & issues</h3>
                <p className="text-sm text-muted-foreground">
                  Track issues, renewals, and work orders connected to stock.
                </p>
              </div>
              <Button size="sm" onClick={() => setTicketFormOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Raise ticket
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{ticket.id}</Badge>
                      <Badge variant="secondary" className="capitalize">{ticket.priority}</Badge>
                    </div>
                    <p className="font-semibold">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.category} · {ticket.owner}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <StatusBadge status={ticket.status} />
                      <span className="text-muted-foreground">Opened {ticket.opened}</span>
                    </div>
                    {ticket.relatedSku && <div className="text-xs text-muted-foreground">SKU: {ticket.relatedSku}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Allocation history</CardTitle>
                  <p className="text-sm text-muted-foreground">Full audit trail for assignments and de-allocations.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("allocations.csv", allocations)}>
                  <ArrowDownToLine className="h-4 w-4" />
                  Download CSV
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {allocationFeed.map((alloc) => (
                  <div key={alloc.id} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="capitalize">{alloc.action}</Badge>
                      <span className="text-muted-foreground">{alloc.date}</span>
                    </div>
                    <p className="font-semibold text-sm">{alloc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {alloc.userName} · {alloc.location}
                    </p>
                    <div className="text-sm font-semibold">{alloc.action === "allocate" ? "-" : "+"}{alloc.quantity} units</div>
                    {alloc.notes && <div className="text-xs text-muted-foreground line-clamp-2">{alloc.notes}</div>}
                  </div>
                ))}
                {!allocationFeed.length && <p className="text-sm text-muted-foreground">No allocation history yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Receipts & restocks</CardTitle>
                  <p className="text-sm text-muted-foreground">Completed intake with source visibility.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("receipts.csv", receiptFeed)}>
                  <ArrowDownToLine className="h-4 w-4" />
                  Download receipts
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {receiptFeed.map((move) => (
                  <div key={move.id} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="capitalize">{move.type.toLowerCase()}</Badge>
                      <span className="text-muted-foreground">{move.date}</span>
                    </div>
                    <p className="font-semibold text-sm">{move.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {move.location} · {move.actor}
                    </p>
                    <div className="text-sm font-semibold text-primary">+{move.quantity} units</div>
                  </div>
                ))}
                {!receiptFeed.length && <p className="text-sm text-muted-foreground">No receipts logged.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Current usage map</CardTitle>
                  <p className="text-sm text-muted-foreground">Who currently holds allocated items.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv("current-usage.csv", currentUsage)}>
                  <ArrowDownToLine className="h-4 w-4" />
                  Export usage
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {currentUsage.map((entry) => (
                  <div key={entry.id} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline">Holding</Badge>
                      <span className="text-muted-foreground">{entry.date}</span>
                    </div>
                    <p className="font-semibold text-sm">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.userName} · {entry.location}
                    </p>
                    <div className="text-sm font-semibold">-{entry.quantity} units</div>
                    {entry.notes && <div className="text-xs text-muted-foreground line-clamp-2">{entry.notes}</div>}
                  </div>
                ))}
                {!currentUsage.length && <p className="text-sm text-muted-foreground">No active allocations.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit item" : "Create item"}</DialogTitle>
          </DialogHeader>
          <InventoryForm
            defaults={selectedItem || undefined}
            onSubmit={(payload) => {
              handleSaveItem(payload);
              setSelectedItem(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!movementFormOpen} onOpenChange={(open) => { if (!open) setMovementFormOpen(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock movement</DialogTitle>
          </DialogHeader>
          <MovementForm
            defaults={
              movementFormOpen
                ? { sku: movementFormOpen.sku, name: movementFormOpen.name, location: movementFormOpen.location }
                : undefined
            }
            onSubmit={(movement) => {
              handleAddMovement(movement);
              if (movement.quantity) {
                setCatalog((prev) =>
                  prev.map((p) =>
                    p.sku === movement.sku
                      ? { ...p, quantity: (p.quantity || 0) + (movement.quantity || 0) }
                      : p,
                  ),
                );
              }
              setMovementFormOpen(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!allocationForm.item}
        onOpenChange={(open) => {
          if (!open) setAllocationForm({ item: null, mode: null });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{allocationForm.mode === "deallocate" ? "De-allocate / return" : "Allocate to user"}</DialogTitle>
          </DialogHeader>
          {allocationForm.item && allocationForm.mode && (
            <AllocationForm
              users={inventoryUsers}
              mode={allocationForm.mode}
              item={allocationForm.item}
              onSubmit={(payload) => {
                handleAllocation({
                  item: allocationForm.item as InventoryItem,
                  mode: allocationForm.mode as "allocate" | "deallocate",
                  userId: payload.userId,
                  userName: payload.userName,
                  quantity: payload.quantity || 1,
                  notes: payload.notes,
                });
                setAllocationForm({ item: null, mode: null });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={ticketFormOpen} onOpenChange={setTicketFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise ticket / renewal</DialogTitle>
          </DialogHeader>
          <TicketForm
            onSubmit={(ticket) => {
              handleAddTicket(ticket);
              setTicketFormOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
