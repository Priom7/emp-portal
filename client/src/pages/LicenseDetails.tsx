"use client";

import { useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, History, KeyRound, CalendarClock, ShieldCheck, Trash2, Pencil, Sparkles } from "lucide-react";
import { licenseInventory } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type License = (typeof licenseInventory)[number] & { history?: LicenseHistory[] };
type LicenseHistory = {
  id: string;
  type: "Issue" | "Seat" | "Renewal" | "Note";
  title: string;
  details: string;
  status: "Open" | "In progress" | "Closed";
  date: string;
};

const storageKeys = { licenses: "licenses-data" };

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

export default function LicenseDetails() {
  const [match, params] = useRoute("/licenses/:id");
  const [, setLocation] = useLocation();
  const licenseId = params?.id;

  const [licenses, setLicenses] = useState<License[]>(() =>
    readLocal(storageKeys.licenses, licenseInventory).map((l: any) => ({ ...l, history: (l as any).history || [] })),
  );
  const license = useMemo(() => licenses.find((l) => l.id === licenseId), [licenses, licenseId]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    type: "Issue",
    title: "",
    details: "",
    status: "Open",
  });

  if (!match || !license) {
    return (
      <Layout>
        <div className="p-6 space-y-3">
          <Button variant="outline" onClick={() => setLocation("/assets")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to assets
          </Button>
          <Card>
            <CardContent className="p-6 text-muted-foreground">License not found.</CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const history = license.history || [];
  const renewDays = daysUntil(license.renewal);
  const usage = Math.min(100, Math.round((license.seatsUsed / license.seatsTotal) * 100));

  const addHistory = () => {
    if (!form.title) return;
    const entry: LicenseHistory = {
      id: `HL-${Date.now()}`,
      type: form.type as LicenseHistory["type"],
      title: form.title,
      details: form.details || "Logged event",
      status: form.status as LicenseHistory["status"],
      date: new Date().toISOString().slice(0, 10),
    };
    const next = licenses.map((l) => (l.id === license.id ? { ...l, history: [entry, ...(l.history || [])] } : l));
    setLicenses(next);
    localStorage.setItem(storageKeys.licenses, JSON.stringify(next));
    setDialogOpen(false);
    setForm({ type: "Issue", title: "", details: "", status: "Open" });
  };

  const deleteHistory = (hid: string) => {
    const next = licenses.map((l) => (l.id === license.id ? { ...l, history: (l.history || []).filter((h) => h.id !== hid) } : l));
    setLicenses(next);
    localStorage.setItem(storageKeys.licenses, JSON.stringify(next));
  };

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/assets")} className="mb-3">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-3xl font-heading font-bold">{license.product}</h1>
            <p className="text-muted-foreground">{license.id} · Key {license.key}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={statusTone(license.status)} variant="secondary">
              {license.status}
            </Badge>
            <Badge variant={renewDays <= 45 ? "destructive" : "secondary"}>Renewal in {renewDays}d</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> License overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <Info label="Owner" value={license.owner} />
                <Info label="Assigned" value={license.assignedTo} />
                <Info label="Renewal" value={license.renewal} />
                <Info label="Status" value={license.status} />
                <Info label="Seats" value={`${license.seatsUsed}/${license.seatsTotal}`} />
              </div>
              <p className="text-sm text-muted-foreground">{license.notes}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Seat utilization</span>
                  <span className="font-semibold">{usage}%</span>
                </div>
                <Progress value={usage} />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" /> Log event
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
                <span className="font-semibold">{healthScore(license)}%</span>
              </div>
              <Progress value={healthScore(license)} />
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• {renewDays <= 60 ? "Renewal due soon" : "Renewal stable"}</li>
                <li>• Seat usage {usage}%</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" /> History & workflow
            </CardTitle>
            <CardDescription>Seat requests, incidents, renewals.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet. Log an event to start tracking.</p>
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
                          {h.status} · {h.date}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Log event for {license.product}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Issue">Issue</SelectItem>
                <SelectItem value="Seat">Seat request</SelectItem>
                <SelectItem value="Renewal">Renewal</SelectItem>
                <SelectItem value="Note">Note</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea
              placeholder="Details"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />

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
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
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

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-secondary/30 rounded-lg p-2">
      <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm font-medium">{value}</p>
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

function healthScore(license: License) {
  let score = 100;
  if (daysUntil(license.renewal) <= 60) score -= 20;
  const usage = Math.min(100, Math.round((license.seatsUsed / license.seatsTotal) * 100));
  if (usage >= 90) score -= 15;
  if (score < 0) score = 0;
  return score;
}
