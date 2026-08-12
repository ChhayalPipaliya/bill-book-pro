import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Download,
  Eye,
  FilePlus2,
  Receipt,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppNavbar } from "@/components/AppNavbar";
import { DjBackdrop } from "@/components/DjBackdrop";
import { PrintedBill } from "@/components/PrintedBill";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency, deleteBill, formatDate, grandTotal, loadBills, type Bill } from "@/lib/bills";
import { exportBillPdf } from "@/lib/pdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DJ Billing Book" },
      {
        name: "description",
        content:
          "See total, today's and monthly bills, create a new DJ bill, and download or delete past bills from your billing book.",
      },
      { property: "og:title", content: "Dashboard — DJ Billing Book" },
      {
        property: "og:description",
        content: "Bills overview and quick actions for your DJ sound service billing book.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => setBills(loadBills());
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  useEffect(() => {
    if (!pdfBill || !hiddenRef.current) return;
    const node = hiddenRef.current;
    const bill = pdfBill;
    const t = window.setTimeout(() => {
      exportBillPdf(node, pdfFileName(bill))
        .then(() => toast.success("PDF downloaded"))
        .catch((error) => {
          console.error("PDF generation failed", error);
          toast.error("Could not generate the PDF. Please try again.");
        })
        .finally(() => setPdfBill(null));
    }, 60);
    return () => window.clearTimeout(t);
  }, [pdfBill]);


  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: bills.length,
      today: bills.filter((b) => b.createdAt.slice(0, 10) === today).length,
      monthly: bills.filter((b) => b.createdAt.slice(0, 7) === today.slice(0, 7)).length,
    };
  }, [bills]);

  function handleDelete(bill: Bill) {
    setBills(deleteBill(bill.id));
    toast.success(`Bill ${bill.billNo} deleted`);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="relative overflow-hidden">
        <DjBackdrop />

        <div className="relative mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                Overview
              </p>
              <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your bill book at a glance — create, download or remove bills.
              </p>
            </div>
          </div>

          <section className="mt-7 grid gap-5 sm:grid-cols-3">
            <StatCard
              label="Total Bills"
              value={String(stats.total)}
              hint="All bills saved"
              icon={Receipt}
              tone="purple"
            />
            <StatCard
              label="Today's Bills"
              value={String(stats.today)}
              hint="Created today"
              icon={CalendarDays}
              tone="blue"
            />
            <StatCard
              label="Monthly Bills"
              value={String(stats.monthly)}
              hint="This calendar month"
              icon={FilePlus2}
              tone="neon"
            />
          </section>

          <section className="glass-card mt-6 flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold">Ready for the next gig?</h2>
              <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                Fill the bill form and download a print-ready A4 copy of your bill book page.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="btn-glow h-14 rounded-2xl px-7 text-base font-semibold text-primary-foreground hover:text-primary-foreground"
            >
              <Link to="/create" search={{}}>
                <FilePlus2 className="size-5" />
                Create New Bill
              </Link>
            </Button>
          </section>

          <section className="glass-card mt-6 overflow-hidden">
            <div className="border-b border-border/70 px-6 py-5">
              <h2 className="font-display text-xl font-semibold">Recent Bills</h2>
              <p className="text-sm text-muted-foreground">Saved bills from your billing book</p>
            </div>

            {bills.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                No bills yet. Create your first bill to see it here.
              </p>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">Bill Number</TableHead>
                        <TableHead>Party Name</TableHead>
                        <TableHead>Event Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="pr-6 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bills.map((bill) => (
                        <TableRow key={bill.id} className="transition-colors hover:bg-accent/40">
                          <TableCell className="pl-6 font-medium text-primary">
                            {bill.billNo}
                          </TableCell>
                          <TableCell className="font-medium">{bill.partyName || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(bill.eventDate) || "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹ {currency(grandTotal(bill))}
                          </TableCell>
                          <TableCell className="pr-6">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg"
                                onClick={() =>
                                  navigate({ to: "/create", search: { id: bill.id } })
                                }
                              >
                                <Eye className="size-3.5" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg border-primary/25 text-primary hover:text-primary"
                                onClick={() => setPdfBill(bill)}
                                disabled={pdfBill !== null}
                              >
                                <Download className="size-3.5" /> PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg border-destructive/30 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(bill)}
                              >
                                <Trash2 className="size-3.5" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="divide-y divide-border/70 md:hidden">
                  {bills.map((bill) => (
                    <div key={bill.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{bill.billNo}</p>
                          <p className="mt-0.5 font-medium">{bill.partyName || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(bill.eventDate) || "—"}
                          </p>
                        </div>
                        <p className="font-display font-semibold">
                          ₹ {currency(grandTotal(bill))}
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 rounded-lg"
                          onClick={() => navigate({ to: "/create", search: { id: bill.id } })}
                        >
                          <Eye className="size-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 rounded-lg border-primary/25 text-primary hover:text-primary"
                          onClick={() => setPdfBill(bill)}
                          disabled={pdfBill !== null}
                        >
                          <Download className="size-3.5" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 rounded-lg border-destructive/30 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(bill)}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Off-screen sheet used for PDF export from the table */}
      {pdfBill ? (
        <div aria-hidden className="pointer-events-none fixed -top-[3000px] left-0">
          <PrintedBill ref={hiddenRef} bill={pdfBill} />
        </div>
      ) : null}
    </div>
  );
}
