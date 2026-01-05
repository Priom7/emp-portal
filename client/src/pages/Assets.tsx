"use client";

import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Package,
  Laptop,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  CalendarClock,
  Clock3,
  Sparkles,
  Ticket,
  AlertTriangle,
  Trash2,
  Pencil,
  History,
} from "lucide-react";
import {
  assetInventory as mockAssets,
  licenseInventory as mockLicenses,
  assetRequests as mockRequests,
} from "@/lib/mockData";

type Asset = (typeof mockAssets)[number];
type License = (typeof mockLicenses)[number];
type AssetRequest = (typeof mockRequests)[number];
type AssetHistory = {
  id: string;
  type: "Issue" | "Swap" | "Note";
  title: string;
  details: string;
  status: "Open" | "In progress" | "Closed";
  date: string;
  neededBy?: string;
};

const variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const storageKeys = {
  assets: "assets-data",
  licenses: "licenses-data",
  requests: "asset-requests-data",
};

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function Assets() {
  const [tab, setTab] = useState<"assets" | "licenses" | "requests">("assets");
  const [search, setSearch] = useState("");
  const [assetStatus, setAssetStatus] = useState<string>("all");
  const [licenseStatus, setLicenseStatus] = useState<string>("all");
  const [assetPage, setAssetPage] = useState(0);
  const [licensePage, setLicensePage] = useState(0);
  const [radarPage, setRadarPage] = useState(0);
  const [riskPage, setRiskPage] = useState(0);
  const perPage = 5;

  const [assets, setAssets] = useState<Asset[]>(() =>
    readLocal(storageKeys.assets, mockAssets).map((a: Asset) => ({
      ...a,
      history: (a as any).history || [],
    })),
  );
  const [licenses, setLicenses] = useState<License[]>(() => readLocal(storageKeys.licenses, mockLicenses));
  const [requests, setRequests] = useState<AssetRequest[]>(() => readLocal(storageKeys.requests, mockRequests));

  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [licenseFormOpen, setLicenseFormOpen] = useState(false);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [issueAsset, setIssueAsset] = useState<Asset | null>(null);
  const [issueType, setIssueType] = useState<"Issue" | "Swap">("Issue");
  const seedAssets = () => setAssets(mockAssets.map((a: any) => ({ ...a, history: (a as any).history || [] })));
  const seedLicenses = () => setLicenses(mockLicenses);
  const seedRequests = () => setRequests(mockRequests);

  useEffect(() => {
    localStorage.setItem(storageKeys.assets, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem(storageKeys.licenses, JSON.stringify(licenses));
  }, [licenses]);

  useEffect(() => {
    localStorage.setItem(storageKeys.requests, JSON.stringify(requests));
  }, [requests]);

  const metrics = useMemo(() => {
    const activeAssets = assets.filter((a) => a.status.toLowerCase().includes("use")).length;
    const totalAssets = assets.length;
    const activeLicenses = licenses.filter((l) => l.status.toLowerCase() !== "trial").length;
    const renewalsSoon = licenses.filter((l) => daysUntil(l.renewal) <= 60).length;
    const openRequests = requests.filter((r) => r.status.toLowerCase() !== "approved").length;
    const openIssues = assets.reduce((acc, a) => {
      const list = (a as any).history || [];
      const open = list.filter((h: AssetHistory) => h.status === "Open").length;
      return acc + open;
    }, 0);
    const atRisk = assets.filter(
      (a) => daysUntil(a.renewal) <= 45 || daysUntil(a.warrantyEnd) <= 45 || a.status.toLowerCase().includes("maintenance"),
    ).length;
    const inWarranty = assets.filter((a) => daysUntil(a.warrantyEnd) > 0).length;
    const avgAge =
      assets.reduce((acc, a) => acc + assetAgeYears(a.assignedDate), 0) / (assets.length || 1);
    const typeCounts = assets.reduce((acc: Record<string, number>, a) => {
      const key = a.type || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      activeAssets,
      totalAssets,
      activeLicenses,
      renewalsSoon,
      openRequests,
      openIssues,
      atRisk,
      inWarranty,
      avgAge: avgAge.toFixed(1),
      typeCounts,
    };
  }, [assets, licenses, requests]);

  const filteredAssets = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter((asset) => {
      const matchesSearch =
        !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.type.toLowerCase().includes(q) ||
        asset.tag.toLowerCase().includes(q) ||
        asset.serial.toLowerCase().includes(q);
      const matchesStatus =
        assetStatus === "all"
          ? true
          : asset.status.toLowerCase() === assetStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [search, assetStatus, assets]);

  const filteredLicenses = useMemo(() => {
    const q = search.toLowerCase();
    return licenses.filter((license) => {
      const matchesSearch =
        !q ||
        license.product.toLowerCase().includes(q) ||
        license.id.toLowerCase().includes(q) ||
        (license.notes || "").toLowerCase().includes(q);
      const matchesStatus =
        licenseStatus === "all"
          ? true
          : license.status.toLowerCase() === licenseStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [search, licenseStatus, licenses]);

  const pagedAssets = useMemo(() => {
    const start = assetPage * perPage;
    return filteredAssets.slice(start, start + perPage);
  }, [filteredAssets, assetPage]);

  const pagedLicenses = useMemo(() => {
    const start = licensePage * perPage;
    return filteredLicenses.slice(start, start + perPage);
  }, [filteredLicenses, licensePage]);

  const renewalsSorted = useMemo(
    () => [...licenses].sort((a, b) => toDateSafe(a.renewal) - toDateSafe(b.renewal)),
    [licenses],
  );

  const atRiskAssets = useMemo(
    () =>
      assets.filter(
        (a) =>
          daysUntil(a.renewal) <= 45 ||
          daysUntil(a.warrantyEnd) <= 45 ||
          a.status.toLowerCase().includes("maintenance"),
      ),
    [assets],
  );

  const radarPerPage = 4;
  const radarPaged = useMemo(() => {
    const start = radarPage * radarPerPage;
    return renewalsSorted.slice(start, start + radarPerPage);
  }, [renewalsSorted, radarPage]);

  const riskPerPage = 4;
  const riskPaged = useMemo(() => {
    const start = riskPage * riskPerPage;
    return atRiskAssets.slice(start, start + riskPerPage);
  }, [atRiskAssets, riskPage]);

  useEffect(() => {
    setAssetPage(0);
  }, [search, assetStatus]);

  useEffect(() => {
    setLicensePage(0);
  }, [search, licenseStatus]);

  useEffect(() => {
    setRadarPage(0);
  }, [renewalsSorted.length]);

  useEffect(() => {
    setRiskPage(0);
  }, [atRiskAssets.length]);

  const handleAddAsset = (asset: Asset) => {
    setAssets((prev) => [{ ...asset, history: (asset as any).history || [] }, ...prev]);
    setAssetFormOpen(false);
  };

  const handleAddLicense = (license: License) => {
    setLicenses((prev) => [license, ...prev]);
    setLicenseFormOpen(false);
  };

  const handleAddRequest = (req: AssetRequest) => {
    setRequests((prev) => [req, ...prev]);
    setRequestFormOpen(false);
  };

  const handleDeleteAsset = (id: string) => setAssets((prev) => prev.filter((a) => a.id !== id));
  const handleDeleteLicense = (id: string) => setLicenses((prev) => prev.filter((l) => l.id !== id));
  const handleDeleteRequest = (id: string) => setRequests((prev) => prev.filter((r) => r.id !== id));

  const handleAddHistory = (assetId: string, entry: AssetHistory) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, history: [{ ...entry, id: entry.id || `H-${Date.now()}` }, ...(a as any).history || []] }
          : a,
      ),
    );
  };

  return (
    <Layout>
      <motion.div className="space-y-6 pb-12" initial="hidden" animate="show" variants={variants}>
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-heading font-bold">Assets & Licenses</h1>
            <p className="text-muted-foreground mt-1">
              Track assigned hardware, software seats, renewals, and requests. Fully CRUD-enabled with local JSON persistence.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={() => exportJson({ assets, licenses, requests })}>
              <RefreshCw className="h-4 w-4" /> Export JSON
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => { seedAssets(); seedLicenses(); seedRequests(); }}>
              Reset to seed
            </Button>
            <Button className="gap-2" onClick={() => setRequestFormOpen(true)}>
              <Sparkles className="h-4 w-4" /> New Request
            </Button>
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard icon={Package} label="Assigned Assets" value={`${metrics.activeAssets}/${metrics.totalAssets}`} tone="text-blue-600" />
          <MetricCard icon={Laptop} label="Active Licenses" value={metrics.activeLicenses} tone="text-green-600" />
          <MetricCard icon={CalendarClock} label="Renewals ≤ 60d" value={metrics.renewalsSoon} tone="text-orange-600" />
          <MetricCard icon={Ticket} label="Open Requests" value={metrics.openRequests} tone="text-purple-600" />
          <MetricCard icon={ShieldCheck} label="Open Issues" value={`${metrics.openIssues}`} tone="text-amber-600" />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            title="Operational coverage"
            items={[
              { label: "In warranty", value: `${metrics.inWarranty}/${metrics.totalAssets}` },
              { label: "Avg age (yrs)", value: metrics.avgAge },
              { label: "At risk", value: metrics.atRisk },
            ]}
          />
          <InsightCard
            title="Asset mix"
            items={Object.entries(metrics.typeCounts).map(([k, v]) => ({ label: k, value: v }))}
          />
          <InsightCard
            title="License load"
            items={licenses.slice(0, 3).map((l) => ({
              label: l.product,
              value: `${l.seatsUsed}/${l.seatsTotal}`,
            }))}
          />
        </motion.div>

        <motion.div variants={item} className="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets, tags, serials, licenses..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={assetStatus === "all" ? "default" : "secondary"} className="cursor-pointer" onClick={() => setAssetStatus("all")}>
                All asset statuses
              </Badge>
              {["In use", "Maintenance", "Pending return"].map((s) => (
                <Badge
                  key={s}
                  variant={assetStatus === s.toLowerCase() ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setAssetStatus(s.toLowerCase())}
                >
                  {s}
                </Badge>
              ))}
              <Badge
                variant={licenseStatus === "all" ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setLicenseStatus("all")}
              >
                All license statuses
              </Badge>
              {["Active", "Expiring soon", "Trial"].map((s) => (
                <Badge
                  key={s}
                  variant={licenseStatus === s.toLowerCase() ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setLicenseStatus(s.toLowerCase())}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid grid-cols-3 w-full md:w-[420px]">
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="licenses">Licenses</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsContent value="assets" className="mt-0">
                <div className="flex justify-between mb-3 gap-2 flex-wrap">
                  <Button size="sm" className="gap-2" onClick={() => setAssetFormOpen(true)}>
                    <Package className="h-4 w-4" /> Add asset
                  </Button>
                  <Pagination
                    page={assetPage}
                    total={Math.ceil(filteredAssets.length / perPage)}
                    onPrev={() => setAssetPage((p) => Math.max(0, p - 1))}
                    onNext={() =>
                      setAssetPage((p) => (p + 1 < Math.ceil(filteredAssets.length / perPage) ? p + 1 : p))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pagedAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onDelete={handleDeleteAsset}
                      onIssue={(type) => {
                        setIssueAsset(asset);
                        setIssueType(type);
                      }}
                    />
                  ))}
                  {!filteredAssets.length && (
                    <Card className="col-span-full">
                      <CardContent className="p-8 text-center text-muted-foreground">No assets match this filter yet.</CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="licenses" className="mt-0">
                <div className="flex justify-between mb-3 gap-2 flex-wrap">
                  <Button size="sm" className="gap-2" onClick={() => setLicenseFormOpen(true)}>
                    <KeyRound className="h-4 w-4" /> Add license
                  </Button>
                  <Pagination
                    page={licensePage}
                    total={Math.ceil(filteredLicenses.length / perPage)}
                    onPrev={() => setLicensePage((p) => Math.max(0, p - 1))}
                    onNext={() =>
                      setLicensePage((p) => (p + 1 < Math.ceil(filteredLicenses.length / perPage) ? p + 1 : p))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pagedLicenses.map((license) => (
                    <LicenseCard key={license.id} license={license} onDelete={handleDeleteLicense} />
                  ))}
                  {!filteredLicenses.length && (
                    <Card className="col-span-full">
                      <CardContent className="p-8 text-center text-muted-foreground">No licenses match this filter yet.</CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="requests" className="mt-0 space-y-4">
                <RequestCenter
                  requests={requests}
                  onDelete={handleDeleteRequest}
                  onCreate={() => setRequestFormOpen(true)}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" /> Renewal radar
                </CardTitle>
                <CardDescription>Next renewals across assets and licenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  {radarPaged.map((license) => (
                    <div key={license.id} className="p-3 border rounded-lg bg-secondary/30 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                        {daysUntil(license.renewal)}d
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{license.product}</p>
                        <p className="text-xs text-muted-foreground">
                          Renewal {license.renewal} · {license.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={radarPage}
                  total={Math.ceil(renewalsSorted.length / radarPerPage)}
                  onPrev={() => setRadarPage((p) => Math.max(0, p - 1))}
                  onNext={() =>
                    setRadarPage((p) =>
                      p + 1 < Math.ceil(renewalsSorted.length / radarPerPage) ? p + 1 : p,
                    )
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" /> At-risk assets
                </CardTitle>
                <CardDescription>Renewal/warranty in ≤45 days or in maintenance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  {riskPaged.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border bg-secondary/30">
                      <div className="h-9 w-9 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-semibold">
                        {Math.min(daysUntil(a.renewal), daysUntil(a.warrantyEnd) || 999)}d
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Renewal {a.renewal} · Warranty {a.warrantyEnd}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!riskPaged.length && (
                    <p className="text-sm text-muted-foreground">No at-risk assets right now.</p>
                  )}
                </div>
                <Pagination
                  page={riskPage}
                  total={Math.ceil(atRiskAssets.length / riskPerPage)}
                  onPrev={() => setRiskPage((p) => Math.max(0, p - 1))}
                  onNext={() =>
                    setRiskPage((p) =>
                      p + 1 < Math.ceil(atRiskAssets.length / riskPerPage) ? p + 1 : p,
                    )
                  }
                />
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Tiger Asset Management
                </CardTitle>
                <CardDescription>Tracking IDs, tags, and warranty dates synced nightly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Device tags use the Tiger format (e.g. Tiger-044) with serials stored for audit.</p>
                <p>• Renewals trigger reminders 60/30/7 days before expiry.</p>
                <Button size="sm" variant="outline" className="gap-2 w-full">
                  <RefreshCw className="h-4 w-4" /> Trigger manual sync
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>

      <AssetDialog
        open={assetFormOpen}
        onOpenChange={setAssetFormOpen}
        onSubmit={(payload) =>
          handleAddAsset({
            ...payload,
            id: payload.id || `AST-${Date.now()}`,
            status: payload.status || "In use",
          })
        }
      />

      <LicenseDialog
        open={licenseFormOpen}
        onOpenChange={setLicenseFormOpen}
        onSubmit={(payload) =>
          handleAddLicense({
            ...payload,
            id: payload.id || `LIC-${Date.now()}`,
            status: payload.status || "Active",
            seatsTotal: Number(payload.seatsTotal) || 1,
            seatsUsed: Number(payload.seatsUsed) || 0,
          })
        }
      />

      <RequestDialog
        open={requestFormOpen}
        onOpenChange={setRequestFormOpen}
        onSubmit={(payload) =>
          handleAddRequest({
            ...payload,
            id: payload.id || `REQ-${Date.now()}`,
            status: payload.status || "Pending",
          })
        }
      />

      <IssueDialog
        open={!!issueAsset}
        asset={issueAsset}
        defaultType={issueType}
        onOpenChange={(open) => {
          if (!open) setIssueAsset(null);
        }}
        onSubmit={(entry) => {
          if (!issueAsset) return;
          handleAddHistory(issueAsset.id, entry);
          setIssueAsset(null);
        }}
      />
    </Layout>
  );
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("use") || value.includes("active")) return "bg-green-100 text-green-700";
  if (value.includes("expiring") || value.includes("pending")) return "bg-orange-100 text-orange-700";
  if (value.includes("maintenance") || value.includes("trial")) return "bg-blue-100 text-blue-700";
  return "bg-secondary text-foreground";
}

function AssetCard({
  asset,
  onDelete,
  onIssue,
}: {
  asset: Asset;
  onDelete: (id: string) => void;
  onIssue: (type: "Issue" | "Swap") => void;
}) {
  const history: AssetHistory[] = (asset as any).history || [];
  const openIssues = history.filter((h) => h.status === "Open").length;
  const [historyPage, setHistoryPage] = useState(0);
  const historyPerPage = 2;
  const historyTotal = Math.ceil(history.length / historyPerPage);
  const historySlice = history.slice(historyPage * historyPerPage, historyPage * historyPerPage + historyPerPage);
  return (
    <Card className="h-full border-border/60 flex flex-col">
      <CardContent className="p-4 space-y-3 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">{asset.type}</p>
            <h3 className="font-semibold">{asset.name}</h3>
            <p className="text-xs text-muted-foreground">
              Tag {asset.tag} · {asset.serial}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={statusTone(asset.status)} variant="secondary">
              {asset.status}
            </Badge>
            {openIssues > 0 && (
              <Badge variant="destructive" className="text-[11px]">
                {openIssues} open
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(asset.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <InfoLine label="Assigned" value={asset.owner} />
          <InfoLine label="Location" value={asset.location} />
          <InfoLine label="Assigned on" value={asset.assignedDate} />
          <InfoLine label="Warranty" value={asset.warrantyEnd} />
          <InfoLine label="Renewal" value={asset.renewal} />
          <InfoLine label="Managed by" value={asset.managedBy} />
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{asset.notes}</p>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="w-full" onClick={() => onIssue("Issue")}>
            Mark issue
          </Button>
          <Button size="sm" className="w-full" onClick={() => onIssue("Swap")}>
            Request swap
          </Button>
          <Button size="sm" variant="ghost" className="w-full" asChild>
            <a href={`/assets/${asset.id}`}>View details</a>
          </Button>
        </div>

        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground">
            <History className="h-4 w-4" /> History
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No events logged yet.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {historySlice.map((h) => (
                <div key={h.id} className="flex items-start gap-2 rounded-md border bg-background/50 p-2">
                  <Badge variant="secondary" className={statusTone(h.status)}>
                    {h.type}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-semibold">{h.title}</p>
                    <p className="text-muted-foreground">{h.details}</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {h.status} · {h.date}
                      {h.neededBy ? ` · Needed ${h.neededBy}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {historyTotal > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={historyPage === 0}
                  >
                    Prev
                  </Button>
                  <span className="text-[11px] text-muted-foreground">
                    Page {historyPage + 1} / {historyTotal}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setHistoryPage((p) => (p + 1 < historyTotal ? p + 1 : p))}
                    disabled={historyPage + 1 >= historyTotal}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LicenseCard({ license, onDelete }: { license: License; onDelete: (id: string) => void }) {
  const usage = Math.min(100, Math.round((license.seatsUsed / license.seatsTotal) * 100));
  return (
    <Card className="h-full border-border/60 flex flex-col">
      <CardContent className="p-4 space-y-3 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">License</p>
            <h3 className="font-semibold">{license.product}</h3>
            <p className="text-xs text-muted-foreground">Key {license.key}</p>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={statusTone(license.status)} variant="secondary">
              {license.status}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(license.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress value={usage} />
            <p className="text-[11px] text-muted-foreground mt-1">
              {license.seatsUsed} / {license.seatsTotal} seats in use
            </p>
          </div>
          <KeyRound className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <InfoLine label="Owner" value={license.owner} />
          <InfoLine label="Assigned" value={license.assignedTo} />
          <InfoLine label="Renewal" value={license.renewal} />
          <InfoLine label="Status" value={license.status} />
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{license.notes}</p>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="w-full">
            Request seat
          </Button>
          <Button size="sm" className="w-full">
            Export key
          </Button>
          <Button size="sm" variant="ghost" className="w-full" asChild>
            <a href={`/licenses/${license.id}`}>View details</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestCenter({
  requests,
  onDelete,
  onCreate,
}: {
  requests: AssetRequest[];
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Start a request
          </CardTitle>
          <CardDescription>Hardware, subscription, or license seats.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full gap-2" onClick={onCreate}>
            <Package className="h-4 w-4" /> Hardware request
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={onCreate}>
            <Laptop className="h-4 w-4" /> Software / license seat
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={onCreate}>
            <Ticket className="h-4 w-4" /> Subscription renewal
          </Button>
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500" />
            Requests create tickets for the IT queue with SLAs and priority tags.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-4 w-4" /> My requests
          </CardTitle>
          <CardDescription>Status, needed-by date, and priority.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="max-h-64 pr-2">
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="flex items-start justify-between p-3 rounded-lg border bg-secondary/30">
                  <div>
                    <p className="text-sm font-semibold">{req.item}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.type} · Needed by {req.neededBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={statusTone(req.status)} variant="secondary">
                      {req.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(req.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {!requests.length && (
              <div className="text-sm text-muted-foreground pt-2">No requests yet. Start one above.</div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg bg-muted/50 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <p className="font-semibold text-lg">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function InsightCard({ title, items }: { title: string; items: { label: string; value: any }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it, idx) => (
          <div key={`${it.label}-${idx}`} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{it.label}</span>
            <span className="font-semibold">{it.value}</span>
          </div>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">No data yet.</p>}
      </CardContent>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/30 p-2 rounded-lg">
      <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
      <p className="text-xs font-medium">{value}</p>
    </div>
  );
}

function toDateSafe(dateLike: any): number {
  if (!dateLike) return 0;
  const ts = new Date(dateLike).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function daysUntil(dateLike: any): number {
  const ts = toDateSafe(dateLike);
  if (!ts) return 0;
  const diff = ts - Date.now();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function assetAgeYears(dateLike: any): number {
  const ts = toDateSafe(dateLike);
  if (!ts) return 0;
  const diff = Date.now() - ts;
  return diff / (1000 * 60 * 60 * 24 * 365);
}

function exportJson(payload: any) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "assets-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function Pagination({
  page,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Button size="sm" variant="outline" onClick={onPrev} disabled={page === 0}>
        Prev
      </Button>
      <span>
        Page {page + 1} / {total}
      </span>
      <Button size="sm" variant="outline" onClick={onNext} disabled={page + 1 >= total}>
        Next
      </Button>
    </div>
  );
}

function IssueDialog({
  open,
  onOpenChange,
  onSubmit,
  asset,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (entry: AssetHistory) => void;
  asset: Asset | null;
  defaultType: "Issue" | "Swap";
}) {
  const [form, setForm] = useState({
    type: defaultType,
    title: "",
    details: "",
    status: "Open",
    neededBy: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({ type: defaultType, title: "", details: "", status: "Open", neededBy: "" });
    } else {
      setForm((prev) => ({ ...prev, type: defaultType }));
    }
  }, [open, defaultType]);

  if (!asset) return null;

  const submit = () => {
    if (!form.title) return;
    onSubmit({
      id: `H-${Date.now()}`,
      type: form.type as AssetHistory["type"],
      title: form.title,
      details: form.details || (form.type === "Swap" ? "Swap requested" : "Issue logged"),
      status: form.status as AssetHistory["status"],
      date: new Date().toISOString().slice(0, 10),
      neededBy: form.neededBy,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {form.type === "Swap" ? "Request swap" : "Log issue"} · {asset.name}
          </DialogTitle>
          <CardDescription className="text-sm">
            Create a trackable event against this asset. Status defaults to Open until resolved.
          </CardDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "Issue" | "Swap" })}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Issue">Issue</SelectItem>
              <SelectItem value="Swap">Swap</SelectItem>
              <SelectItem value="Note">Note</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <Textarea
            placeholder="Describe the issue, impact, or swap reason"
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In progress">In progress</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Needed by (optional)" value={form.neededBy} onChange={(e) => setForm({ ...form, neededBy: e.target.value })} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} className="gap-2">
            <Pencil className="h-4 w-4" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssetDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (asset: Asset) => void;
}) {
  const [form, setForm] = useState<Partial<Asset>>({
    name: "",
    type: "Laptop",
    status: "In use",
    tag: "",
    serial: "",
    location: "",
    assignedDate: "",
    warrantyEnd: "",
    renewal: "",
    managedBy: "Tiger Asset Management",
    notes: "",
    owner: "You",
    id: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({
        name: "",
        type: "Laptop",
        status: "In use",
        tag: "",
        serial: "",
        location: "",
        assignedDate: "",
        warrantyEnd: "",
        renewal: "",
        managedBy: "Tiger Asset Management",
        notes: "",
        owner: "You",
        id: "",
      });
    }
  }, [open]);

  const submit = () => {
    if (!form.name || !form.tag) return;
    onSubmit(form as Asset);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add asset</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Asset ID (optional)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Type (Laptop/Monitor/etc.)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input placeholder="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <Input placeholder="Tiger tag" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
          <Input placeholder="Serial" value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <Input placeholder="Assigned date" value={form.assignedDate} onChange={(e) => setForm({ ...form, assignedDate: e.target.value })} />
          <Input placeholder="Warranty end" value={form.warrantyEnd} onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })} />
          <Input placeholder="Renewal date" value={form.renewal} onChange={(e) => setForm({ ...form, renewal: e.target.value })} />
          <Input placeholder="Managed by" value={form.managedBy} onChange={(e) => setForm({ ...form, managedBy: e.target.value })} />
          <Textarea
            className="col-span-2"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} className="gap-2">
            <Pencil className="h-4 w-4" /> Save asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LicenseDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (license: License) => void;
}) {
  const [form, setForm] = useState<Partial<License>>({
    id: "",
    product: "",
    status: "Active",
    seatsTotal: 1,
    seatsUsed: 0,
    renewal: "",
    owner: "",
    assignedTo: "",
    key: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({
        id: "",
        product: "",
        status: "Active",
        seatsTotal: 1,
        seatsUsed: 0,
        renewal: "",
        owner: "",
        assignedTo: "",
        key: "",
        notes: "",
      });
    }
  }, [open]);

  const submit = () => {
    if (!form.product) return;
    onSubmit(form as License);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add license</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="License ID (optional)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <Input placeholder="Product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <Input placeholder="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <Input
            placeholder="Seats total"
            value={form.seatsTotal}
            onChange={(e) => setForm({ ...form, seatsTotal: Number(e.target.value) })}
          />
          <Input
            placeholder="Seats used"
            value={form.seatsUsed}
            onChange={(e) => setForm({ ...form, seatsUsed: Number(e.target.value) })}
          />
          <Input placeholder="Renewal date" value={form.renewal} onChange={(e) => setForm({ ...form, renewal: e.target.value })} />
          <Input placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <Input placeholder="Assigned to" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
          <Input placeholder="License key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <Textarea
            className="col-span-2"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} className="gap-2">
            <Pencil className="h-4 w-4" /> Save license
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (req: AssetRequest) => void;
}) {
  const [form, setForm] = useState<Partial<AssetRequest>>({
    id: "",
    type: "Hardware",
    item: "",
    status: "Pending",
    neededBy: "",
    priority: "Medium",
  });

  useEffect(() => {
    if (!open) {
      setForm({
        id: "",
        type: "Hardware",
        item: "",
        status: "Pending",
        neededBy: "",
        priority: "Medium",
      });
    }
  }, [open]);

  const submit = () => {
    if (!form.item) return;
    onSubmit(form as AssetRequest);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Request ID (optional)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <Input placeholder="Type (Hardware/License/Subscription)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input placeholder="Item" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          <Input placeholder="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <Input placeholder="Needed by" value={form.neededBy} onChange={(e) => setForm({ ...form, neededBy: e.target.value })} />
          <Input placeholder="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} className="gap-2">
            <Pencil className="h-4 w-4" /> Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
