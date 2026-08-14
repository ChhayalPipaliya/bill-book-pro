export type BillItem = {
  name: string;
  /** Free text: "2", "02", "2 Pis", "1000 sq", "65 kv". Never used in arithmetic. */
  qty: string;
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
  /** Bill-level total amount entered by the owner. */
  subTotal: number;
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
  address:
    "A-84, Viram Nagar Society, Akhan Anadh College Near, Ved Road, Katargam, Surat - 395004.",
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
  "LED Screen",
  "Junretar",
  "Bolero Tempo",
  "Chota Hathi",
  "Eicher",
];

export const ITEM_ROWS = DEFAULT_ITEM_NAMES.length;

export function blankItems(): BillItem[] {
  return DEFAULT_ITEM_NAMES.map((name) => ({ name, qty: "" }));
}

/** Keeps older saved bills in sync with the current item list and the text quantity model. */
function normalizeItems(items: unknown): BillItem[] {
  const existing = Array.isArray(items) ? (items as Partial<BillItem>[]) : [];
  const byName = new Map<string, string>();
  for (const item of existing) {
    const name = String(item?.name ?? "").trim();
    if (!name) continue;
    const qty = item?.qty === undefined || item?.qty === null ? "" : String(item.qty);
    byName.set(name.toLowerCase(), qty === "0" ? "" : qty);
  }
  return DEFAULT_ITEM_NAMES.map((name) => ({
    name,
    qty: byName.get(name.toLowerCase()) ?? "",
  }));
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(num(value));
}

export function subtotal(bill: Pick<Bill, "subTotal">) {
  return num(bill.subTotal);
}

/** Single source of truth: GRAND TOTAL = (SUB TOTAL - DISCOUNT) - ADVANCE, never negative. */
export function grandTotal(bill: Pick<Bill, "subTotal" | "discount" | "advance">) {
  return Math.max(0, num(bill.subTotal) - num(bill.discount) - num(bill.advance));
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
const COUNTER_KEY = "dj-billing-book:billno-counter";

function readCounters(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COUNTER_KEY) || "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeCounters(counters: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COUNTER_KEY, JSON.stringify(counters));
  } catch {
    /* storage unavailable */
  }
}

function formatBillNo(year: number, seq: number) {
  return `${year}-${String(seq).padStart(4, "0")}`;
}

/** Highest sequence already used for the given year, across saved bills and the counter. */
function highestSeq(year: number, bills: Bill[]) {
  const counters = readCounters();
  let max = num(counters[String(year)]);
  for (const bill of bills) {
    const match = /^(\d{4})-(\d+)$/.exec(String(bill?.billNo ?? ""));
    if (match && Number(match[1]) === year) max = Math.max(max, Number(match[2]));
  }
  return max;
}

/** Preview of the next bill number, without consuming it. */
export function peekNextBillNo(bills: Bill[] = loadBills()) {
  const year = new Date().getFullYear();
  return formatBillNo(year, highestSeq(year, bills) + 1);
}

/** Consumes and persists the next bill number so it can never be reused. */
export function reserveBillNo(): string {
  const year = new Date().getFullYear();
  const next = highestSeq(year, loadBills()) + 1;
  const counters = readCounters();
  counters[String(year)] = next;
  writeCounters(counters);
  return formatBillNo(year, next);
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
    subTotal: 0,
    discount: 0,
    advance: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function emptyBill(billNo: string): Bill {
  return makeBill({ billNo });
}

function normalizeBill(bill: Partial<Bill>): Bill {
  return {
    id: String(bill?.id ?? crypto.randomUUID()),
    billNo: String(bill?.billNo ?? ""),
    partyName: String(bill?.partyName ?? ""),
    address: String(bill?.address ?? ""),
    mobile: String(bill?.mobile ?? ""),
    eventDate: String(bill?.eventDate ?? ""),
    eventTime: String(bill?.eventTime ?? ""),
    items: normalizeItems(bill?.items),
    subTotal: num(bill?.subTotal),
    discount: num(bill?.discount),
    advance: num(bill?.advance),
    createdAt: String(bill?.createdAt ?? new Date().toISOString()),
  };
}

export function loadBills(): Bill[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((b) => normalizeBill(b as Partial<Bill>));
  } catch {
    return [];
  }
}

function persist(bills: Bill[]) {
  if (typeof window === "undefined") return;
  // No history truncation: every saved bill is kept.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
}

/** Saves a bill. New bills get a freshly reserved, unique bill number. */
export function saveBill(bill: Bill): { bills: Bill[]; bill: Bill } {
  const bills = loadBills();
  const existing = bills.find((b) => b.id === bill.id);
  const saved: Bill = existing
    ? { ...bill, billNo: existing.billNo, createdAt: existing.createdAt }
    : { ...bill, billNo: reserveBillNo(), createdAt: new Date().toISOString() };
  const next = existing ? bills.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...bills];
  persist(next);
  return { bills: next, bill: saved };
}

export function deleteBill(id: string): Bill[] {
  const next = loadBills().filter((b) => b.id !== id);
  persist(next);
  return next;
}

export function pdfFileName(bill: Pick<Bill, "billNo">) {
  const dj = DJ_PROFILE.djName.replace(/\s+/g, "-").toUpperCase();
  return `${dj}-Bill-${bill.billNo || "draft"}.pdf`;
}
