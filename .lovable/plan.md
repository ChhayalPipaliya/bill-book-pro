# DJ Billing Book — audit findings and fixes

This project workspace is currently the blank starter, so step one is importing your uploaded app (source files only, no git metadata) and getting it running. The existing UI, colors, layout and invoice design stay exactly as they are.

## Audit findings (from reading the uploaded code)

The app is fully local: no backend, no login page in the current build, bills stored in `localStorage` under `dj-billing-book:bills`. Dashboard (`/`) lists bills; `/create` builds/edits a bill with a live A4 preview (`PrintedBill`).

Confirmed problems:

1. **PDF clipping.** `exportBillPdf` renders the preview node with html2pdf at a fixed 794x1123 sheet, `pagebreak: avoid-all`, and the invoice root has `overflow: hidden`. Anything past the fixed sheet height is cropped and a second page is never created. This is the root cause of the cut-off bottom.
2. **Grand Total formula is wrong.** `grandTotal()` = subtotal − discount; Advance is ignored entirely.
3. **Quantity is numeric.** `BillItem.qty` is a `number`; the form strips non-digits, so "2 Pis", "1000 sq", "65 kv" are impossible and "02" collapses to 2.
4. **Amount column is in the invoice table.** The printed bill renders a per-item amount column.
5. **LED SCREEN missing.** The predefined list has 12 items and no LED SCREEN.
6. **Bill number is manual and unreliable.** It is an editable input, generated as `max(numbers, 393) + 1` only on mount. Creating two bills in a row without navigating, or editing after saving, can reuse or change numbers. No year format.
7. **Save/state issues.** Saving does not refresh the dashboard list state, the saved bill's `id` stays in component state so edits are ambiguous, no loading state on Save, and duplicate clicks are possible.
8. **Bill history gaps.** No created-date column, no visible grand total consistency guarantee (uses the same wrong formula).
9. **Dead code.** `nextBillNo` fallback seed 393, amount plumbing in `normalizeItems`, unused item amount styling.

## Fixes

**Import & run** — copy the app source into this project, install its dependencies, verify dev server and console are clean.

**PDF (root-cause fix, same design)**
- Keep html2pdf/jsPDF but stop forcing a fixed-height single page: measure the real rendered height of the invoice node, render at A4 width (794px), and paginate by actual content height into as many A4 pages as needed.
- Remove `overflow: hidden` from the invoice root and remove `avoid-all`; use row-safe page breaks so no item row or totals block is split.
- One page when it fits, extra A4 pages automatically when it doesn't. Nothing clipped, no distortion, no dead whitespace.
- Filename becomes dynamic: `DJ-NATIONAL-Bill-2026-0001.pdf` from DJ name + bill number.
- Dashboard PDF download uses the exact same renderer and the same saved bill object as the preview, so values always match.

**Bill number**
- Single source of truth in `src/lib/bills.ts`: format `YYYY-NNNN`, sequence derived from saved bills for the current year plus a persisted counter in localStorage, so it survives reload and never reuses a number.
- Generated automatically on new bill; the field becomes read-only in the form.
- Editing a saved bill never regenerates its number.
- Number is reserved at save time, so consecutive saves without a refresh increment correctly.

**Items & quantity**
- Items are SR. NO. | ITEM NAME | QTY. only — everywhere. Per-item Amount is removed completely from the form, the `BillItem` model, validation, `normalizeItems`, live preview, invoice/PDF, save payload, edit flow and bill history; old saved bills drop the field on migration.
- Sub Total (Total Amount) becomes a bill-level field the owner types manually, below the Items section, next to Discount and Advance. It is never summed from items.
- `qty` becomes a string, stored and printed verbatim ("2 Pis", "1000 sq", "65 kv", "02"), never parsed as a number. Long values wrap without breaking the layout.
- Predefined list becomes the 13 fixed rows including LED SCREEN, in your order; old saved bills are migrated (numeric qty -> string, new row appended).

**Totals**
- One shared helper: `grandTotal = Math.max(0, (subTotal - discount) - advance)`, used by form, live preview, saved bill, history and PDF. No second formula anywhere.

**Save, state, errors**
- Save persists immediately, shows a success toast, and the dashboard reloads bills on focus/navigation so the new bill appears with no refresh.
- Save and Generate PDF get disabled/loading states ("Saving…", "Generating PDF…") to prevent double submissions.
- Failures show a friendly toast; the real error goes to `console.error` only.
- Empty-state, null/undefined and date/currency formatting hardened.

**Cleanup** — remove all per-item amount code paths (`subtotal()` summing, amount inputs, invoice column, normalizer), the 393 seed, duplicate calculations and stray logs; no new dependencies.

## Verification
Playwright end-to-end run of your TEST 1–15 list: create a 13-item bill with text quantities, sub total 100000 / discount 0 / advance 350 -> grand total 99650, save, confirm history entry, download PDF and inspect the rendered pages as images to confirm header, all rows, LED SCREEN, quantity text, totals and footer are present and nothing is clipped; then a long-content bill to prove multi-page output; plus consecutive-create, refresh, and edit-keeps-number checks. A final audit report follows the same numbered structure you asked for.
