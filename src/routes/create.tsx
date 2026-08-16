import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppNavbar } from "@/components/AppNavbar";
import { DjBackdrop } from "@/components/DjBackdrop";
import { PrintedBill } from "@/components/PrintedBill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  currency,
  emptyBill,
  grandTotal,
  loadBills,
  pdfFileName,
  peekNextBillNo,
  saveBill,
  type Bill,
} from "@/lib/bills";
import { exportBillPdf } from "@/lib/pdf";


const SHEET_W = 794;
const SHEET_H = 1123;

/** Scales the fixed 794x1123 A4 sheet to the available width without distortion. */
function useSheetScale() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;
    setScale(Math.min(1, el.clientWidth / SHEET_W));
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { boxRef, scale };
}

/** Tracks the real rendered height of the sheet so the preview never clips content. */
function useSheetHeight(ref: React.RefObject<HTMLDivElement | null>, dep: unknown) {
  const [height, setHeight] = useState(SHEET_H);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight(Math.max(SHEET_H, el.scrollHeight));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, dep]);

  return height;
}




export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): { id?: string } =>
    typeof search.id === "string" ? { id: search.id } : {},

  head: () => ({
    meta: [
      { title: "Billing — DJ Billing Book" },
      {
        name: "description",
        content:
          "Fill the DJ bill form on the left and watch the printed bill book page update live, then download a print-ready A4 PDF.",
      },
      { property: "og:title", content: "Billing — DJ Billing Book" },
      {
        property: "og:description",
        content: "Live preview of the original printed DJ bill with instant A4 PDF download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/create" });
  const [bill, setBill] = useState<Bill>(() => emptyBill(""));
  const [busy, setBusy] = useState(false);
  
  const sheetRef = useRef<HTMLDivElement>(null);
  const pdfSheetRef = useRef<HTMLDivElement>(null);
  const { boxRef, scale } = useSheetScale();
  const sheetHeight = useSheetHeight(sheetRef, bill);

  useEffect(() => {
    const bills = loadBills();
    const existing = id ? bills.find((b) => b.id === id) : undefined;
    setBill(existing ?? emptyBill(peekNextBillNo(bills)));
  }, [id]);

  const total = useMemo(() => grandTotal(bill), [bill]);

  function set<K extends keyof Bill>(key: K, value: Bill[K]) {
    setBill((prev) => ({ ...prev, [key]: value }));
  }

  function setItem(index: number, key: "name" | "qty", value: string) {
    setBill((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  }

  /** Waits for React to commit the saved bill into the hidden PDF sheet. */
  function nextPaint() {
    return new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  }

  async function handleGenerate() {
    if (busy) return;
    if (!bill.partyName.trim()) {
      toast.error("Party name is required before generating the bill");
      return;
    }
    if (!bill.eventDate) {
      toast.error("Event date is required before generating the bill");
      return;
    }

    setBusy(true);
    let saved: Bill;
    try {
      saved = saveBill(bill).bill;
      setBill(saved);
      if (saved.id !== id) navigate({ to: "/create", search: { id: saved.id } });
    } catch (error) {
      console.error("Save bill failed", error);
      toast.error("Could not save the bill. Please try again.");
      setBusy(false);
      return;
    }

    try {
      await nextPaint();
      const node = pdfSheetRef.current ?? sheetRef.current;
      if (!node) throw new Error("Bill preview node is not mounted");
      await exportBillPdf(node, pdfFileName(saved));
      toast.success(`Bill ${saved.billNo} saved and PDF downloaded`);
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.error(
        `Bill ${saved.billNo} was saved, but the PDF could not be generated. You can retry the download from the Dashboard.`,
      );
    } finally {
      setBusy(false);
    }
  }


  function handleReset() {
    setBill(emptyBill(peekNextBillNo(loadBills())));
    navigate({ to: "/create", search: {} });
  }



  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="relative overflow-hidden">
        <DjBackdrop />
        <div className="relative mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                Billing
              </p>
              <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
                {id ? "Edit Bill" : "Create New Bill"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Edit on the left — the printed bill book page on the right updates instantly.
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-xl sm:flex-none"
                onClick={handleReset}
              >
                <RotateCcw className="size-4" /> Reset
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={busy}
                className="btn-glow h-11 flex-1 rounded-xl px-5 font-semibold text-primary-foreground hover:text-primary-foreground sm:flex-none"
              >
                <Download className="size-4" /> {busy ? "Saving & Generating PDF…" : "Generate PDF"}
              </Button>

            </div>
          </div>

          <div className="mt-7 grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
            {/* Form */}
            <section className="glass-card min-w-0 p-4 sm:p-6">
              <h2 className="font-display text-lg font-semibold">Bill Details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="billNo">Bill Number</Label>
                  <Input
                    id="billNo"
                    className="h-11 rounded-xl"
                    value={bill.billNo}
                    readOnly
                    aria-readonly="true"
                    title="Bill numbers are generated automatically"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    inputMode="tel"
                    className="h-11 rounded-xl"
                    value={bill.mobile}
                    onChange={(e) => set("mobile", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="partyName">Party Name</Label>
                  <Input
                    id="partyName"
                    className="h-11 rounded-xl"
                    placeholder=""
                    value={bill.partyName}
                    onChange={(e) => set("partyName", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    className="h-11 rounded-xl"
                    value={bill.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    className="h-11 rounded-xl"
                    value={bill.eventDate}
                    onChange={(e) => set("eventDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Event Time</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    className="h-11 rounded-xl"
                    value={bill.eventTime}
                    onChange={(e) => set("eventTime", e.target.value)}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <h2 className="font-display text-lg font-semibold">Items</h2>
              <div className="mt-3 grid grid-cols-[22px_minmax(0,1fr)_104px] gap-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:grid-cols-[28px_minmax(0,1fr)_130px]">
                <span>Sr.</span>
                <span>Item</span>
                <span>Qty</span>
              </div>
              <div className="mt-2 space-y-2">
                {bill.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[28px_1fr_130px] items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                    <span className="truncate text-sm font-semibold uppercase">{item.name}</span>
                    <Input
                      aria-label={`Item ${i + 1} quantity`}
                      className="h-10 rounded-lg text-center"
                      placeholder="e.g. 2 Pis"
                      value={item.qty}
                      onChange={(e) => setItem(i, "qty", e.target.value)}
                    />
                  </div>
                ))}
              </div>



              <Separator className="my-6" />

              <h2 className="font-display text-lg font-semibold">Totals</h2>
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="subTotal">Total Amount (Sub Total)</Label>
                  <Input
                    id="subTotal"
                    inputMode="numeric"
                    className="h-11 rounded-xl"
                    value={bill.subTotal || ""}
                    onChange={(e) =>
                      set("subTotal", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount</Label>
                    <Input
                      id="discount"
                      inputMode="numeric"
                      className="h-11 rounded-xl"
                      value={bill.discount || ""}
                      onChange={(e) =>
                        set("discount", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advance">Advance</Label>
                    <Input
                      id="advance"
                      inputMode="numeric"
                      className="h-11 rounded-xl"
                      value={bill.advance || ""}
                      onChange={(e) =>
                        set("advance", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                    Grand Total
                  </span>
                  <span className="font-display text-xl font-semibold text-primary">
                    ₹ {currency(total)}
                  </span>
                </div>
              </div>
            </section>

            {/* Live printed-bill preview — A4 width sheet, scaled to fit, height follows content */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Live Bill Preview</h2>
                <span className="text-xs text-muted-foreground">A4 · Original printed layout</span>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-3 sm:p-4">
                <div ref={boxRef} className="mx-auto w-full">
                  <div
                    className="relative mx-auto shadow-[var(--shadow-soft)]"
                    style={{ width: SHEET_W * scale, height: sheetHeight * scale }}
                  >
                    <div
                      style={{
                        width: SHEET_W,
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                        position: "absolute",
                        top: 0,
                        left: 0,
                      }}
                    >
                      <PrintedBill ref={sheetRef} bill={bill} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Unscaled off-screen copy of the sheet — the PDF is always rendered from this
                node so the preview's scale transform can never distort the export. */}
            <div aria-hidden className="pointer-events-none fixed -top-[4000px] left-0">
              <PrintedBill ref={pdfSheetRef} bill={bill} />
            </div>




          </div>
        </div>
      </main>
    </div>
  );
}
