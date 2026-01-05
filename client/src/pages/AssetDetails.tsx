"use client";

import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, History, Package, ShieldCheck, CalendarClock, Trash2, Sparkles } from "lucide-react";
import { assetInventory } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

type Asset = typeof assetInventory[number] & { history?: AssetHistory[] };
type AssetHistory = {
  id: string;
  type: "Issue" | "Swap" | "Note";
  title: string;
  details: string;
  status: "Open" | "In progress" | "Closed";
  date: string;
  neededBy?: string;
};

const storageKeys = {
  assets: "assets-data",
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

export default function AssetDetails() {
  const [match, params] = useRoute("/assets/:id");
  const [, setLocation] = useLocation();
  const assetId = params?.id;

  const [assets, setAssets] = useState<Asset[]>(() =>
    readLocal(storageKeys.assets, assetInventory).map((a: any) => ({
      ...a,
      history: (a as any).history || [],
    })),
  );

  const asset = useMemo(() => assets.find((a) => a.id === assetId), [assets, assetId]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    type: "Issue",
    title: "",
    details: "",
    status: "Open",
    neededBy: "",
  });

  if (!match || !asset) {
    return (
      <Layout>
        <div className="p-6 space-y-3">
          <Button variant="outline" onClick={() => setLocation("/assets")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to assets
          </Button>
          <Card>
            <CardContent className="p-6 text-muted-foreground">Asset not found.</CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const history = asset.history || [];
  const daysToRenewal = daysUntil(asset.renewal);
  const daysToWarranty = daysUntil(asset.warrantyEnd);
  const health = computeHealth(asset);

  const addHistory = () => {
    if (!issueForm.title) return;
    const entry: AssetHistory = {
      id: `H-${Date.now()}`,
      type: issueForm.type as AssetHistory["type"],
      title: issueForm.title,
      details: issueForm.details || (issueForm.type === "Swap" ? "Swap requested" : "Issue logged"),
      status: issueForm.status as AssetHistory["status"],
      date: new Date().toISOString().slice(0, 10),
      neededBy: issueForm.neededBy,
    };
    const next = assets.map((a) => (a.id === asset.id ? { ...a, history: [entry, ...(a.history || [])] } : a));
    setAssets(next);
    localStorage.setItem(storageKeys.assets, JSON.stringify(next));
    setIssueOpen(false);
    setIssueForm({ type: "Issue", title: "", details: "", status: "Open", neededBy: "" });
  };

  const deleteHistory = (hid: string) => {
    const next = assets.map((a) =>
      a.id === asset.id ? { ...a, history: (a.history || []).filter((h) => h.id !== hid) } : a,
    );
    setAssets(next);
    localStorage.setItem(storageKeys.assets, JSON.stringify(next));
  };

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/assets")} className="mb-3">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-3xl font-heading font-bold">{asset.name}</h1>
            <p className="text-muted-foreground">
              {asset.type} · Tag {asset.tag} · Serial {asset.serial}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={statusTone(asset.status)} variant="secondary">
              {asset.status}
            </Badge>
            <Badge variant={daysToRenewal <= 45 ? "destructive" : "secondary"}>
              Renewal in {daysToRenewal}d
            </Badge>
            <Badge variant={daysToWarranty <= 45 ? "destructive" : "secondary"}>
              Warranty in {daysToWarranty}d
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Asset overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <Info label="Owner" value={asset.owner} />
                <Info label="Location" value={asset.location} />
                <Info label="Assigned" value={asset.assignedDate} />
                <Info label="Warranty ends" value={asset.warrantyEnd} />
                <Info label="Renewal" value={asset.renewal} />
                <Info label="Managed by" value={asset.managedBy} />
              </div>

              <p className="text-sm text-muted-foreground">{asset.notes}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Timeline label="Warranty runway" value={daysToWarranty} max={365} />
                <Timeline label="Renewal runway" value={daysToRenewal} max={365} />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setIssueOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" /> Log issue / swap
                </Button>
                <Button size="sm" variant="ghost" onClick={() => window.print()}>
                  Print summary
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Health score</span>
                <span className="font-semibold">{health.score}%</span>
              </div>
              <Progress value={health.score} />
              <ul className="text-xs text-muted-foreground space-y-1">
                {health.notes.map((n, i) => (
                  <li key={i}>• {n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" /> History & workflow
            </CardTitle>
            <CardDescription>Issues, swaps, and notes logged for this asset.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet. Log an issue or swap to start tracking.</p>
            ) : (
              <ScrollArea className="max-h-[360px] pr-2">
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 border rounded-lg p-3 bg-secondary/30">
                      <Badge variant="secondary" className={statusTone(h.status)}>
                        {h.type}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{h.title}</p>
                        <p className="text-xs text-muted-foreground">{h.details}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {h.status} · {h.date} {h.neededBy ? `· Needed ${h.neededBy}` : ""}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteHistory(h.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Log issue / swap for {asset.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={issueForm.type} onValueChange={(v) => setIssueForm({ ...issueForm, type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Issue">Issue</SelectItem>
                <SelectItem value="Swap">Swap</SelectItem>
                <SelectItem value="Note">Note</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Title" value={issueForm.title} onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })} />
            <Textarea
              placeholder="Details"
              value={issueForm.details}
              onChange={(e) => setIssueForm({ ...issueForm, details: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select value={issueForm.status} onValueChange={(v) => setIssueForm({ ...issueForm, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In progress">In progress</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Needed by"
                value={issueForm.neededBy}
                onChange={(e) => setIssueForm({ ...issueForm, neededBy: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addHistory} className="gap-2">
              <Pencil className="h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/30 rounded-lg p-2">
      <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function Timeline({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value} days</span>
      </div>
      <Progress value={pct} />
    </div>
  );
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("use") || value.includes("active")) return "bg-green-100 text-green-700";
  if (value.includes("expiring") || value.includes("pending")) return "bg-orange-100 text-orange-700";
  if (value.includes("maintenance") || value.includes("trial")) return "bg-blue-100 text-blue-700";
  return "bg-secondary text-foreground";
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

function computeHealth(asset: Asset) {
  const renewal = daysUntil(asset.renewal);
  const warranty = daysUntil(asset.warrantyEnd);
  let score = 100;
  const notes: string[] = [];
  if (renewal <= 60) {
    score -= 20;
    notes.push("Renewal due soon");
  }
  if (warranty <= 60) {
    score -= 15;
    notes.push("Warranty ending soon");
  }
  if (asset.status.toLowerCase().includes("maintenance")) {
    score -= 25;
    notes.push("In maintenance");
  }
  if (score < 0) score = 0;
  return { score, notes: notes.length ? notes : ["Healthy"] };
}
