type InventorySeed = {
  category: string;
  models: string[];
  owner: string;
  supplier: string;
  baseCost: number;
  locations: string[];
  tags: string[];
  multiplier: number;
  conditions: string[];
  statuses: string[];
};

const inventorySeeds: InventorySeed[] = [
  {
    category: "Laptops",
    models: [
      "MacBook Pro 14” (M3)",
      "Lenovo X1 Carbon Gen 11",
      "Dell Latitude 7450",
      "HP EliteBook 845",
      "Framework 13",
    ],
    owner: "End User Compute",
    supplier: "Insight Europe",
    baseCost: 1850,
    locations: ["London HQ", "Berlin Lab", "NYC Hub", "Remote stock"],
    tags: ["endpoint", "encrypted", "warranty"],
    multiplier: 4,
    conditions: ["New", "Excellent", "Good"],
    statuses: ["In stock", "Allocated", "In transit", "Reserved", "Maintenance"],
  },
  {
    category: "Monitors",
    models: [
      "Dell UltraSharp 27 4K",
      "LG 34” Ultrawide",
      "Apple Studio Display",
      "BenQ 24” FHD",
      "Samsung Smart Monitor M8",
    ],
    owner: "Workplace",
    supplier: "CDW",
    baseCost: 420,
    locations: ["London HQ", "Dublin Hub", "NYC Hub", "Remote stock"],
    tags: ["display", "desk", "ergonomics"],
    multiplier: 5,
    conditions: ["New", "Excellent", "Good", "Fair"],
    statuses: ["In stock", "Allocated", "Reserved", "Maintenance"],
  },
  {
    category: "Peripherals",
    models: [
      "Logitech MX Keys",
      "Logitech MX Master 3s",
      "Jabra Evolve2 75",
      "Anker USB-C Dock",
      "Keychron K3",
      "MX Palm Rest",
      "Ergo Footrest",
    ],
    owner: "IT Logistics",
    supplier: "Amazon Business",
    baseCost: 95,
    locations: ["London HQ", "Warehouse A", "Remote stock"],
    tags: ["accessory", "comfort"],
    multiplier: 6,
    conditions: ["New", "Excellent", "Good"],
    statuses: ["In stock", "Allocated", "Reserved"],
  },
  {
    category: "Networking",
    models: [
      "Ubiquiti Unifi AP",
      "Cisco Meraki Switch",
      "Aruba Access Point",
      "Netgear PoE Switch",
      "Ubiquiti Security Gateway",
    ],
    owner: "Network Ops",
    supplier: "Softcat",
    baseCost: 650,
    locations: ["London HQ", "Data Centre", "Berlin Lab"],
    tags: ["network", "infrastructure"],
    multiplier: 4,
    conditions: ["New", "Excellent", "Good", "Fair"],
    statuses: ["In stock", "Allocated", "In transit", "Maintenance"],
  },
  {
    category: "Mobility",
    models: [
      "iPhone 15",
      "Samsung S24",
      "iPad Air",
      "iPad Pro 11",
      "Zebra TC52",
      "Pixel 8",
    ],
    owner: "Mobile Fleet",
    supplier: "BT Enterprise",
    baseCost: 980,
    locations: ["IT Locker", "London HQ", "NYC Hub", "APAC Hub"],
    tags: ["mobile", "sim", "mdm"],
    multiplier: 4,
    conditions: ["New", "Excellent", "Good", "Fair"],
    statuses: ["In stock", "Allocated", "Pending return", "Maintenance"],
  },
  {
    category: "AV & Rooms",
    models: [
      "Logitech Rally Bar",
      "Poly Studio USB",
      "Neat Bar",
      "Logitech Tap Scheduler",
      "Jabra PanaCast 50",
    ],
    owner: "Workplace",
    supplier: "Krisp AV",
    baseCost: 1250,
    locations: ["Meeting Room A", "Meeting Room B", "NYC Boardroom", "Berlin Lab"],
    tags: ["meeting", "rooms", "video"],
    multiplier: 3,
    conditions: ["New", "Excellent", "Good"],
    statuses: ["In stock", "Installed", "Maintenance"],
  },
  {
    category: "Security & Access",
    models: [
      "HID Access Card",
      "Kisi Smart Tag",
      "YubiKey 5 NFC",
      "Cable Lock",
      "Logitech 4K Webcam",
    ],
    owner: "Security",
    supplier: "HID Global",
    baseCost: 55,
    locations: ["London HQ", "Berlin Lab", "Warehouse A", "APAC Hub"],
    tags: ["security", "badge"],
    multiplier: 7,
    conditions: ["New", "Excellent", "Good"],
    statuses: ["In stock", "Allocated", "Reserved"],
  },
];

function buildInventoryCatalog() {
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const catalog: any[] = [];
  let counter = 1001;

  inventorySeeds.forEach((seed) => {
    seed.models.forEach((model, modelIndex) => {
      for (let i = 0; i < seed.multiplier; i++) {
        const index = counter + i;
        const status = seed.statuses[index % seed.statuses.length] || "In stock";
        const condition = seed.conditions[index % seed.conditions.length] || "Good";
        const location = seed.locations[index % seed.locations.length];
        const quantity = 4 + ((index + modelIndex) % 14);
        const minLevel = 2 + ((index + modelIndex) % 5);
        const reorderTo = quantity + 6 + (index % 3);
        const warrantyYear = 2025 + ((index + modelIndex) % 2);
        const warrantyMonth = months[(index + modelIndex) % months.length];
        const auditMonth = months[(modelIndex + i) % months.length];

        catalog.push({
          id: `INV-${String(counter).padStart(4, "0")}`,
          sku: `${seed.category.slice(0, 3).toUpperCase()}-${String(modelIndex + 1).padStart(2, "0")}-${i + 1}`,
          name: model,
          category: seed.category,
          status,
          condition,
          location,
          owner: seed.owner,
          quantity,
          minLevel,
          reorderTo,
          supplier: seed.supplier,
          unitCost: seed.baseCost + modelIndex * 25 + i * 10,
          batch: `B-${warrantyYear}-${(index % 90).toString().padStart(2, "0")}`,
          warrantyEnd: `${warrantyYear}-${warrantyMonth}-2${(index % 8) + 1}`,
          lastAudit: `2025-${auditMonth}-${String(((index + 3) % 25) + 1).padStart(2, "0")}`,
          tags: Array.from(
            new Set([
              ...seed.tags,
              status.toLowerCase().includes("maint") || status.toLowerCase().includes("repair") ? "needs-care" : "ready",
              condition.toLowerCase(),
            ]),
          ),
        });

        counter++;
      }
    });
  });

  const accessories = ["USB-C Hub Gen3", "Privacy Screen 14", "Privacy Screen 16", "Desk Mount Arm", "Travel Adapter Kit"];
  while (catalog.length < 165) {
    const index = catalog.length + 1200;
    const name = accessories[index % accessories.length];
    catalog.push({
      id: `INV-${String(index).padStart(4, "0")}`,
      sku: `ACC-${(index % 90).toString().padStart(3, "0")}`,
      name,
      category: "Accessories",
      status: index % 3 === 0 ? "Reserved" : "In stock",
      condition: "New",
      location: ["Warehouse A", "London HQ", "Remote stock"][index % 3],
      owner: "IT Logistics",
      quantity: 12 + (index % 9),
      minLevel: 6,
      reorderTo: 22,
      supplier: "Amazon Business",
      unitCost: 45 + (index % 5) * 5,
      batch: `B-2025-${(index % 90).toString().padStart(2, "0")}`,
      warrantyEnd: `2026-${String(((index % 11) + 1)).padStart(2, "0")}-15`,
      lastAudit: `2025-${String(((index % 11) + 1)).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`,
      tags: ["accessory", "ready", "spare"],
    });
  }

  return catalog.sort((a, b) => a.id.localeCompare(b.id));
}

function buildInventoryMovements(catalog: any[]) {
  const movementTypes = ["Check-out", "Return", "Restock", "Maintenance", "Transfer"];
  const actors = ["IT Ops", "Field Support", "Warehouse", "AV Team", "Network Ops", "Security", "EU Logistics"];
  const projects = ["Onboarding", "Project Atlas", "Room Refresh", "Incident Response", "Audit Sprint", "Pilot Run"];

  return catalog.slice(0, 140).map((item, index) => {
    const delta = index % 5 === 0 ? -(1 + (index % 3)) : 5 - (index % 4);
    return {
      id: `MOVE-${String(index + 1).padStart(4, "0")}`,
      sku: item.sku,
      name: item.name,
      type: movementTypes[index % movementTypes.length],
      date: `2025-${String(((index % 12) + 1)).padStart(2, "0")}-${String(((index * 3) % 27) + 1).padStart(2, "0")}`,
      quantity: delta,
      actor: actors[index % actors.length],
      location: item.location,
      status: delta < 0 ? "Completed" : "Scheduled",
      project: projects[index % projects.length],
    };
  });
}

export const inventoryCatalog = buildInventoryCatalog();
export const inventoryMovements = buildInventoryMovements(inventoryCatalog);

export const inventorySuppliers = [
  {
    name: "Insight Europe",
    contact: "supply@insight.com",
    onTime: 97,
    avgLead: 6,
    spendYtd: 125000,
    preferred: true,
    regions: ["EU", "UK", "US"],
  },
  {
    name: "CDW",
    contact: "account@cdw.com",
    onTime: 93,
    avgLead: 8,
    spendYtd: 98000,
    preferred: true,
    regions: ["US", "EU"],
  },
  {
    name: "Softcat",
    contact: "orders@softcat.com",
    onTime: 91,
    avgLead: 10,
    spendYtd: 76000,
    preferred: false,
    regions: ["UK", "EU"],
  },
  {
    name: "Amazon Business",
    contact: "biz@amazon.com",
    onTime: 89,
    avgLead: 3,
    spendYtd: 54000,
    preferred: false,
    regions: ["Global"],
  },
  {
    name: "BT Enterprise",
    contact: "fleet@bt.com",
    onTime: 94,
    avgLead: 7,
    spendYtd: 68000,
    preferred: true,
    regions: ["UK", "EU"],
  },
  {
    name: "Krisp AV",
    contact: "hello@krispav.com",
    onTime: 95,
    avgLead: 9,
    spendYtd: 45000,
    preferred: true,
    regions: ["EU", "US"],
  },
];

export const inventoryOrders = [
  {
    id: "PO-9821",
    vendor: "Insight Europe",
    status: "In transit",
    priority: "Urgent",
    eta: "2025-01-16",
    items: ["MacBook Pro 14” (M3)", "Dell UltraSharp 27 4K"],
    value: 48250,
    tracking: "FEDEX-0092",
  },
  {
    id: "PO-9828",
    vendor: "CDW",
    status: "Awaiting pick",
    priority: "Standard",
    eta: "2025-01-20",
    items: ["LG 34” Ultrawide", "Logitech Rally Bar"],
    value: 22600,
    tracking: "UPS-2281",
  },
  {
    id: "PO-9830",
    vendor: "Amazon Business",
    status: "Received",
    priority: "Standard",
    eta: "2025-01-08",
    items: ["MX Palm Rest", "Desk Mount Arm", "Privacy Screen 14"],
    value: 7800,
    tracking: "AB-119921",
  },
  {
    id: "PO-9840",
    vendor: "BT Enterprise",
    status: "In transit",
    priority: "Critical",
    eta: "2025-01-12",
    items: ["iPhone 15", "Samsung S24"],
    value: 35400,
    tracking: "DHL-77822",
  },
  {
    id: "PO-9845",
    vendor: "Softcat",
    status: "Pending approval",
    priority: "Standard",
    eta: "2025-01-25",
    items: ["Cisco Meraki Switch", "Ubiquiti Unifi AP"],
    value: 28600,
    tracking: "TBC",
  },
];

export const inventoryPrograms = [
  {
    name: "Zero stockouts",
    owner: "IT Ops",
    progress: 78,
    kpi: "98% fulfilment SLA",
    window: "Q1 2025",
  },
  {
    name: "Lifecycle refresh",
    owner: "Workplace",
    progress: 64,
    kpi: "120 laptops refreshed",
    window: "H1 2025",
  },
  {
    name: "Room uplift",
    owner: "AV Team",
    progress: 52,
    kpi: "15 rooms upgraded",
    window: "Q2 2025",
  },
  {
    name: "MDM hardening",
    owner: "Security",
    progress: 83,
    kpi: "Full device attestation",
    window: "Q1 2025",
  },
];

export const inventoryTickets = [
  {
    id: "TKT-1001",
    title: "Renew AppleCare bulk pack",
    status: "Open",
    owner: "IT Ops",
    priority: "High",
    category: "Renewal",
    opened: "2025-01-03",
    relatedSku: "LAP-01-1",
  },
  {
    id: "TKT-1002",
    title: "Room B camera blur",
    status: "In progress",
    owner: "AV Team",
    priority: "Medium",
    category: "Issue",
    opened: "2025-01-06",
    relatedSku: "AVR-01-1",
  },
  {
    id: "TKT-1003",
    title: "Bulk laptop refresh wave 2",
    status: "Open",
    owner: "Workplace",
    priority: "High",
    category: "Project",
    opened: "2025-01-04",
    relatedSku: "LAP-02-1",
  },
  {
    id: "TKT-1004",
    title: "Inventory audit follow-up",
    status: "Planned",
    owner: "Inventory Ops",
    priority: "Low",
    category: "Compliance",
    opened: "2025-01-07",
    relatedSku: "",
  },
];

export const inventoryFinance = [
  { label: "COGS YTD", value: 184000, context: "Landed cost across intake POs" },
  { label: "Capex reserved", value: 92000, context: "Approved but not received" },
  { label: "Open PO value", value: 142750, context: "Awaiting delivery" },
  { label: "Depreciation YTD", value: 38500, context: "Straight-line, 3-year" },
];

export const inventoryUsers = [
  { id: "U-201", name: "Alex Thompson", department: "Engineering", location: "London HQ" },
  { id: "U-202", name: "Maria Garcia", department: "Product", location: "Berlin Lab" },
  { id: "U-203", name: "James Wilson", department: "Engineering", location: "NYC Hub" },
  { id: "U-204", name: "Sarah Parker", department: "Design", location: "London HQ" },
  { id: "U-205", name: "Emily Blunt", department: "QA", location: "Remote" },
  { id: "U-206", name: "David Chen", department: "IT Ops", location: "London HQ" },
  { id: "U-207", name: "Priya Singh", department: "Security", location: "APAC Hub" },
  { id: "U-208", name: "Luca Rossi", department: "AV Team", location: "Dublin Hub" },
  { id: "U-209", name: "Hannah Lee", department: "Finance", location: "London HQ" },
  { id: "U-210", name: "Tom Walker", department: "Network Ops", location: "Data Centre" },
];

export const inventoryRequests = [
  {
    id: "REQ-9001",
    requester: "Alex Thompson",
    userId: "U-201",
    item: "MacBook Pro 14” (M3)",
    type: "Hardware",
    status: "Pending",
    neededBy: "2025-01-22",
    priority: "High",
    notes: "New hire setup",
  },
  {
    id: "REQ-9002",
    requester: "Maria Garcia",
    userId: "U-202",
    item: "Jabra Evolve2 75",
    type: "Accessory",
    status: "Approved",
    neededBy: "2025-01-15",
    priority: "Medium",
    notes: "Upgrade for remote calls",
  },
  {
    id: "REQ-9003",
    requester: "Sarah Parker",
    userId: "U-204",
    item: "Figma Enterprise Seat",
    type: "License",
    status: "In fulfilment",
    neededBy: "2025-01-18",
    priority: "Low",
    notes: "Design contractor",
  },
];
