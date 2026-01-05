import { useEffect, useState } from "react";
import { inventoryCatalog, inventoryUsers } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type InventoryItem = (typeof inventoryCatalog)[number];

export const statusTone: Record<string, string> = {
  "in stock": "bg-emerald-100 text-emerald-700 border-emerald-200",
  allocated: "bg-blue-100 text-blue-700 border-blue-200",
  reserved: "bg-amber-100 text-amber-700 border-amber-200",
  "in transit": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "pending return": "bg-rose-100 text-rose-700 border-rose-200",
  maintenance: "bg-orange-100 text-orange-700 border-orange-200",
  installed: "bg-teal-100 text-teal-700 border-teal-200",
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = "default",
}: {
  icon: any;
  label: string;
  value: string;
  meta: string;
  tone?: "default" | "warning";
}) {
  return (
    <Card className={tone === "warning" ? "border-amber-200 bg-amber-50/70" : ""}>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-none mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{meta}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase();
  const classes = statusTone[normalized] || "bg-slate-100 text-slate-700 border-slate-200";
  return <Badge className={`border ${classes} capitalize`}>{status}</Badge>;
}

export function InventoryForm({
  defaults,
  onSubmit,
}: {
  defaults?: Partial<InventoryItem>;
  onSubmit: (item: Partial<InventoryItem>) => void;
}) {
  const [form, setForm] = useState<Partial<InventoryItem>>(
    defaults || {
      status: "In stock",
      condition: "New",
      owner: "IT Ops",
      location: "London HQ",
      quantity: 1,
      minLevel: 2,
      reorderTo: 6,
      supplier: "Amazon Business",
    },
  );

  useEffect(() => {
    setForm(
      defaults || {
        status: "In stock",
        condition: "New",
        owner: "IT Ops",
        location: "London HQ",
        quantity: 1,
        minLevel: 2,
        reorderTo: 6,
        supplier: "Amazon Business",
      },
    );
  }, [defaults]);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Input value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Location</Label>
          <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Owner</Label>
          <Input value={form.owner || ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Supplier</Label>
          <Input value={form.supplier || ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Quantity</Label>
          <Input
            type="number"
            value={form.quantity || 0}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>Min level</Label>
          <Input
            type="number"
            value={form.minLevel || 0}
            onChange={(e) => setForm({ ...form, minLevel: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>Reorder to</Label>
          <Input
            type="number"
            value={form.reorderTo || 0}
            onChange={(e) => setForm({ ...form, reorderTo: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>Unit cost</Label>
          <Input
            type="number"
            value={form.unitCost || 0}
            onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>Warranty end</Label>
          <Input
            value={form.warrantyEnd || ""}
            onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Tags</Label>
          <Input
            value={(form.tags || []).join(", ")}
            onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()) })}
          />
        </div>
      </div>
      <DialogFooter className="pt-4">
        <Button onClick={() => onSubmit({ ...defaults, ...form })}>{defaults?.id ? "Save changes" : "Create item"}</Button>
      </DialogFooter>
    </>
  );
}

export function MovementForm({
  defaults,
  onSubmit,
}: {
  defaults?: Partial<InventoryMovement>;
  onSubmit: (movement: Partial<InventoryMovement>) => void;
}) {
  const [form, setForm] = useState<Partial<InventoryMovement>>(
    defaults || { type: "Restock", status: "Scheduled", quantity: 5 },
  );

  useEffect(() => setForm(defaults || { type: "Restock", status: "Scheduled", quantity: 5 }), [defaults]);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>SKU</Label>
          <Input value={form.sku || ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Input value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Quantity</Label>
          <Input
            type="number"
            value={form.quantity || 0}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>Location</Label>
          <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Actor</Label>
          <Input value={form.actor || ""} onChange={(e) => setForm({ ...form, actor: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Input value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Project</Label>
          <Input value={form.project || ""} onChange={(e) => setForm({ ...form, project: e.target.value })} />
        </div>
      </div>
      <DialogFooter className="pt-4">
        <Button onClick={() => onSubmit(form)}>Save movement</Button>
      </DialogFooter>
    </>
  );
}

type InventoryMovement = {
  id: string;
  sku: string;
  name: string;
  type: string;
  date: string;
  quantity: number;
  actor: string;
  location: string;
  status: string;
  project: string;
};

type InventoryOrder = {
  id: string;
  vendor: string;
  status: string;
  priority: string;
  eta: string;
  items: string[];
  value: number;
  tracking: string;
};

type InventoryTicket = {
  id: string;
  title: string;
  status: string;
  owner: string;
  priority: string;
  category: string;
  opened: string;
  relatedSku: string;
};

export function TicketForm({ onSubmit }: { onSubmit: (ticket: Partial<InventoryTicket>) => void }) {
  const [form, setForm] = useState<Partial<InventoryTicket>>({
    status: "Open",
    owner: "Inventory Ops",
    priority: "Medium",
    category: "Maintenance",
  });

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Status</Label>
            <Input value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Priority</Label>
            <Input value={form.priority || ""} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Owner</Label>
            <Input value={form.owner || ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Related SKU</Label>
          <Input value={form.relatedSku || ""} onChange={(e) => setForm({ ...form, relatedSku: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Notes</Label>
          <Textarea
            rows={4}
            value={(form as any).notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value } as any)}
          />
        </div>
      </div>
      <DialogFooter className="pt-4">
        <Button onClick={() => onSubmit(form)}>Save ticket</Button>
      </DialogFooter>
    </>
  );
}

export function OrderForm({ onSubmit }: { onSubmit: (order: Partial<InventoryOrder>) => void }) {
  const [form, setForm] = useState<Partial<InventoryOrder>>({
    status: "Pending approval",
    priority: "Standard",
    items: [],
    eta: new Date().toISOString().slice(0, 10),
  });

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Vendor</Label>
          <Input value={form.vendor || ""} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Status</Label>
            <Input value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Priority</Label>
            <Input value={form.priority || ""} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>ETA</Label>
            <Input value={form.eta || ""} onChange={(e) => setForm({ ...form, eta: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Tracking</Label>
            <Input value={form.tracking || ""} onChange={(e) => setForm({ ...form, tracking: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Items (comma separated)</Label>
          <Input
            value={(form.items || []).join(", ")}
            onChange={(e) => setForm({ ...form, items: e.target.value.split(",").map((v) => v.trim()) })}
          />
        </div>
        <div className="space-y-1">
          <Label>Value</Label>
          <Input
            type="number"
            value={form.value || 0}
            onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
          />
        </div>
      </div>
      <DialogFooter className="pt-4">
        <Button onClick={() => onSubmit(form)}>Save PO</Button>
      </DialogFooter>
    </>
  );
}

type InventoryRequest = {
  id: string;
  requester: string;
  userId: string;
  item: string;
  type: string;
  status: string;
  neededBy: string;
  priority: string;
  notes?: string;
};

export function RequestForm({ onSubmit }: { onSubmit: (req: Partial<InventoryRequest>) => void }) {
  const [form, setForm] = useState<Partial<InventoryRequest>>({
    type: "Hardware",
    status: "Pending",
    priority: "Medium",
    neededBy: new Date().toISOString().slice(0, 10),
    userId: inventoryUsers[0]?.id,
    requester: inventoryUsers[0]?.name,
  });

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Requester</Label>
          <Select
            value={form.userId}
            onValueChange={(v) => {
              const user = inventoryUsers.find((u) => u.id === v);
              setForm({ ...form, userId: v, requester: user?.name });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select requester" />
            </SelectTrigger>
            <SelectContent>
              {inventoryUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {u.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Item</Label>
            <Input value={form.item || ""} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Input value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Status</Label>
            <Input value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Priority</Label>
            <Input value={form.priority || ""} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Needed by</Label>
            <Input value={form.neededBy || ""} onChange={(e) => setForm({ ...form, neededBy: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Notes</Label>
          <Textarea rows={4} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <DialogFooter className="pt-4">
        <Button onClick={() => onSubmit(form)}>Save request</Button>
      </DialogFooter>
    </>
  );
}

export function AllocationForm({
  users,
  mode,
  item,
  onSubmit,
}: {
  users: typeof inventoryUsers;
  mode: "allocate" | "deallocate";
  item: InventoryItem;
  onSubmit: (payload: { userId: string; userName: string; quantity: number; notes?: string }) => void;
}) {
  const [userId, setUserId] = useState(users[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const selectedUser = users.find((u) => u.id === userId);

  return (
    <>
      <div className="space-y-3">
        <div className="rounded-lg border p-3">
          <p className="text-sm font-semibold">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.category} · {item.location}
          </p>
          <p className="text-xs text-muted-foreground">
            On hand: {item.quantity} · Min {item.minLevel}
          </p>
        </div>
        <div className="space-y-1">
          <Label>User</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Assign to user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {u.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Quantity</Label>
          <Input type="number" value={quantity} min={1} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <DialogFooter className="pt-4">
        <Button
          onClick={() =>
            onSubmit({
              userId,
              userName: selectedUser?.name || "Unassigned",
              quantity,
              notes,
            })
          }
        >
          {mode === "allocate" ? "Allocate" : "De-allocate"}
        </Button>
      </DialogFooter>
    </>
  );
}
