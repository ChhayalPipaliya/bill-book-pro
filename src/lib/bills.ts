export type BillItem = {
  name: string;
  qty: number;
  amount: number;
};

export type Bill = {
  id: string;
  billNo: string;
  partyName: string;
  address: string;
  mobile: string;
  eventDate: string;
  eventTime: string;
  items: BillItem[];
  discount: number;
  advance: number;
  createdAt: string;
};

export const DJ_PROFILE = {
  brand: "DJ Billing Book",
  djName: "DJ NATIONAL",
  ownerName: "SAMIRBHAI GAMI",
  mobile: "99796 41682",
  altMobile: "99796 41682",
  tagline: "All Types of D.J. Sound System Available.",
  addressLine1: "A-84, Viram Nagar Society, Akhan Anadh College Near,",
  addressLine2: "Ved Road, Katargam, Surat - 395004.",
  address: "A-84, Viram Nagar Society, Akhan Anadh College Near, Ved Road, Katargam, Surat - 395004.",
  tagline1: "POWER OF SOUND",
  tagline2: "MEMORIES FOR LIFE",
};


export const DEFAULT_ITEM_NAMES = [
  "Bass",
  "Top",
  "Array",
  "Trust",
  "Sharfi",
  "LED",
  "Betal",
  "Blender",
  "Junretar",
  "Bolero Tempo",
  "Chota Hathi",
  "Eicher",
];

export const ITEM_ROWS = DEFAULT_ITEM_NAMES.length;

export function blankItems(): BillItem[] {
  return DEFAULT_ITEM_NAMES.map((name) => ({ name, qty: 0, amount: 0 }));
}

/** Keeps older saved bills in sync with the current 12-row item list. */
function normalizeItems(items: unknown): BillItem[] {
  const existing = Array.isArray(items) ? (items as BillItem[]) : [];
  return DEFAULT_ITEM_NAMES.map((name, i) => ({
    name: existing[i]?.name || name,
    qty: Number(existing[i]?.qty) || 0,
    amount: Number(existing[i]?.amount) || 0,
  }));
}


export function currency(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export function subtotal(bill: Pick<Bill, "items">) {
  return bill.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
}

/** GRAND TOTAL = SUB TOTAL - DISCOUNT. Advance is shown separately on the bill. */
export function grandTotal(bill: Pick<Bill, "items" | "discount" | "advance">) {
  return Math.max(0, subtotal(bill) - (bill.discount || 0));
}

export function formatDate(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd} / ${mm} / ${d.getFullYear()}`;
}

export function formatTime(value: string) {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

const STORAGE_KEY = "dj-billing-book:bills";

export function nextBillNo(bills: Bill[]) {
  const max = bills.reduce((acc, b) => {
    const n = Number(String(b.billNo).replace(/\D/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.max(acc, n) : acc;
  }, 393);
  return String(max + 1);
}

function makeBill(overrides: Partial<Bill>): Bill {
  return {
    id: crypto.randomUUID(),
    billNo: "",
    partyName: "",
    address: "",
    mobile: "",
    eventDate: "",
    eventTime: "",
    items: blankItems(),
    discount: 0,
    advance: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function emptyBill(billNo: string): Bill {
  return makeBill({
    billNo,
    eventDate: "",
    eventTime: "",
  });
}

export function loadBills(): Bill[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Bill[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((b) => ({
      ...b,
      items: normalizeItems(b.items),
    }));
  } catch {
    return [];
  }
}

function persist(bills: Bill[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bills.slice(0, 200)));
  } catch {
    /* storage unavailable */
  }
}

export function saveBill(bill: Bill): Bill[] {
  const bills = loadBills();
  const idx = bills.findIndex((b) => b.id === bill.id);
  const next = idx >= 0 ? bills.map((b) => (b.id === bill.id ? bill : b)) : [bill, ...bills];
  persist(next);
  return next;
}

export function deleteBill(id: string): Bill[] {
  const next = loadBills().filter((b) => b.id !== id);
  persist(next);
  return next;
}
