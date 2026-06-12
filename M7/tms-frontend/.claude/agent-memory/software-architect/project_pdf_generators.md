---
name: project-pdf-generators
description: Cross-app PDF generation inventory — 10 generators across TMS/WMS/customer-portal, all jsPDF, severe code duplication, no shared abstraction
metadata:
  type: project
---

All three apps share the same PDF generation approach with near-identical boilerplate.

**Library:** jsPDF (all apps, all generators)

**TMS Frontend** (`src/lib/pdf/`):
- `shipmentRoutePdfGenerator.ts` — standalone async function, ShipmentInfo + TrackingEvent[], timeline with circles
- `documentPdfGenerator.ts` — standalone async function, Document model; only generator with dual export (save + blob); has watermark option
- `receiptPdfGenerator.ts` — standalone async function, PaymentReceiptData

**WMS Frontend** (`src/app/lib/pdf/`):
- `invoicePdfGenerator.ts` — standalone async function, Invoice + extended InvoiceData
- `cargoReportPdfGenerator.ts` — standalone async function, InventoryItem extended; has multi-section tables (events, location history, documents)
- `financialReportPdfGenerator.ts` — standalone async function, BillingOverview + Invoice[]; aggregations computed inline

**Customer Portal** (`lib/pdf/`):
- `pdfGenerator.ts` — **object namespace** (`PDFGenerator`) with `loadLogo()` and `addFooter()` extracted; two methods: generateTransportationRequestPDF + generateWarehousingRequestPDF
- `invoicePdfGenerator.ts` — standalone async function, local InvoiceData interface (simpler than WMS version)
- `transportationRequestPdfGenerator.ts` — standalone async function, form-submission variant (form data model vs. API entity model)
- `reportsPdfGenerator.ts` — standalone async function, ReportsData with routePerformance table

**Hooks in customer-portal:**
- `use-transportation-request-pdf.ts` — Vue composable wrapping `PDFGenerator`
- `use-transportation-listing-pdf.ts` — Vue composable wrapping `transportationRequestPdfGenerator.ts` (different generator than the details hook!)
- `use-warehousing-request-pdf.ts` — Vue composable wrapping `PDFGenerator`
- `use-warehousing-listing-pdf.ts` — Vue composable wrapping `warehousingRequestPdfGenerator.ts` (fetches full data before generating)

**Key duplication facts:**
- Logo loading (fetch → blob → FileReader → DataURL): copy-pasted in every generator except `pdfGenerator.ts` which extracted it as `loadLogo()`
- Footer (address, phone, email, horizontal line, page numbers): copy-pasted in every generator except `pdfGenerator.ts` which extracted it as `addFooter()`
- Section header pattern (`setFillColor(248,250,252)` + `rect + text`): identical in every generator, never extracted
- Field row pattern (bold label + normal value): identical in every generator, never extracted
- Page-break guard (`if (yPos + N > pageHeight - 30) { addPage(); yPos = 20 }`): copy-pasted throughout
- Font: always 'helvetica'
- Logo path inconsistency: TMS/customer-portal use `/deliveroo-pdf-logo.png`, WMS uses `/assets/deliveroo-pdf-logo.png`
- Date formatting done inline with `Intl.DateTimeFormat` in each file; formatDate exists only in `documentPdfGenerator.ts` and `pdfGenerator.ts`
- Currency formatting done inline in each file; formatCurrency extracted only in `pdfGenerator.ts`

**Design inconsistencies (blocking for shared lib):**
1. Two transportationRequest generators exist in customer-portal for the same document type (pdfGenerator.ts method vs. transportationRequestPdfGenerator.ts) — one takes API entity shape, one takes form-submission shape
2. Similarly two warehousingRequest generators co-exist
3. WMS generators hardcode `/assets/` prefix for logo path, others do not
4. `documentPdfGenerator.ts` is the only generator exposing a Blob output — all others are save-only

**Why:** Analysis was done as preparation for designing a shared PDF abstraction across apps.
**How to apply:** Any proposal for a shared PDF layer must account for the dual-generator issue in customer-portal and the logo path inconsistency.
