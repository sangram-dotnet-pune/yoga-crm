# YogaCare CRM — Desktop App Context

> **Purpose of this document.** A complete, self-contained description of the existing **YogaCare CRM**
> desktop application so that a website version can be built without re-reading the desktop source.
> It is written from a full read of the committed working tree at branch `main` (HEAD `57fcaa7`).
> Where something could not be verified from the source it is explicitly marked **UNVERIFIED**.
> This document is a description of the desktop app only; it does not add product requirements.

---

## 1. Project Overview

**What it is.** A local-first desktop CRM for a yoga / rehabilitation clinic. A physiotherapist
(or yoga therapist) tracks a patient from first visit → treatment plan → follow-up, recording pain
scores, mobility, prescribed exercises, before/after X-rays, fees/payments and exporting a
paginated PDF outcome report.

**Who uses it.** A single clinician working at one clinic on one machine. There is **no login, no
accounts, no roles, no multi-user** concept anywhere in the code. The UI hardcodes the practitioner
as *Dr. Pradnesh Naikwade*.

**Product names in use.** Product/UI name **YogaCare CRM**; npm package `yoga-patient-crm`; Rust
crate `yoga-patient-crm` (lib `yoga_patient_crm_lib`); Tauri identifier `com.yogacare.crm`; the
repository is also referred to as **MedYoga**. Version `0.1.0`.

**Architecture in one line.** Tauri 2 shell → Vite 7 + React 19 + TypeScript 5.9 SPA → all state in
the WebView's `localStorage`. The Rust side has **zero custom commands**; it only ships
`tauri-plugin-opener`.

**Explicit non-goals / safety posture (must be preserved in the website).**
- It is a **record-keeping and before/after comparison tool**. It must **never** claim to diagnose,
  grade, or read X-rays. Existing disclaimer copy must remain (see §3.13).
- No backend today. A website adds a backend — that is a deliberate architectural change that needs
  server-side validation, auth and authorization (see §13, §16).

---

## 2. Repository & Structure

```
index.html                     one-line HTML shell, mounts /src/main.tsx into #root
vite.config.ts                 react plugin, dev port 1423, strictPort: true
tsconfig.json                  solution file -> references app + node configs
tsconfig.app.json              strict TS for src/ (noEmit)
tsconfig.node.json             strict TS for vite.config.ts
package.json                   scripts + deps (npm only)
src/main.tsx                   app root: state, routing, page switching, sample data, NewPatient,
                               Payments, Dashboard, PatientDetail, Overview, Plan, Report,
                               EditPatient, Outcomes, SettingsPage, App
src/types.ts                   ALL domain types + enum arrays (single source of truth)
src/lib/format.ts              id / date / time / money / sorting / download helpers
src/lib/fields.ts              normalize() input coercion + safePatient() shape guard
src/lib/payment.ts             payment math + Patient-with-payment helpers
src/lib/storage.ts             localStorage read/write + error surfacing
src/lib/pdf.ts                 jsPDF report builder (buildReport / exportPDF)
src/lib/pdfFonts.ts            base64 DM Sans subsets for the ₹ glyph  **  SEE WARNING BELOW  **
src/components/ui.tsx          Stat, Badge, Metric, Field, XrayBox, PageTitle, Empty, Confirm, useEscape
src/components/Appointments.tsx
src/components/Expenses.tsx
src/components/Visits.tsx
src/components/Timeline.tsx
src/components/Progress.tsx
src/components/PaymentHistory.tsx
src/components/Xrays.tsx
src/styles.css                 the entire stylesheet (design tokens + light + dark + payment + responsive)
src/polish.css                 dashboard/analytics additive styles
src/fonts/DMSans-latin.woff2   bundled DM Sans variable font, latin subset, weight axis 400–700
src-tauri/tauri.conf.json      product/window/bundle config
src-tauri/Cargo.toml           Rust deps (tauri, tauri-plugin-opener, serde, serde_json)
src-tauri/src/main.rs          calls yoga_patient_crm_lib::run()
src-tauri/src/lib.rs           Tauri builder + tauri_plugin_opener only
src-tauri/capabilities/default.json   permissions: core:default, opener:default
src-tauri/icons/*              generated app icons (do not hand-edit)
src-tauri/gen/*                Tauri-generated schemas (do not hand-edit)
.github/workflows/windows-build.yml   Windows CI: builds nsis + msi installers
```

### ⚠️ CRITICAL: `src/lib/pdfFonts.ts` is a placeholder

The file is committed and is only **193 bytes / 2 lines** containing truncated placeholder strings:

```ts
export const FONT_R = 'AAEAAAAPAIAAAwBwR1BPUzJiLC4A...';   // the full string from your old file
export const FONT_B = 'AAEAAAAPAIAAAwBwR1BPUzLfLWgA...';   // the full string from your old file
```

`src/lib/pdf.ts` imports these and calls `doc.addFileToVFS(...)` / `doc.addFont(...,'DMans',...)`.
`addFileToVFS` with an invalid base64 payload, and a `try/catch`-free `addImage`/font path, means the
**₹ glyph embedding is broken in the committed state**. Built-in jsPDF fonts (WinAnsi) cannot render
`₹`, so payment amounts may render as a missing glyph / blank in the generated PDF.
**This must be verified by generating a real PDF before trusting the report output.**
(Contrast this with earlier local work in which `pdf.ts` contained the full base64 inline; the
committed tree does not.) Treat the committed tree as the truth. — **UNVERIFIED at runtime.**

`AGENTS.md` also exists in the working tree but is **gitignored** and describes an *earlier
single-file architecture* (`src/main.tsx` "58 lines ~2.5k LOC", fonts inline). It is **stale**
relative to the current modular `src/components/*` + `src/lib/*` layout. Do not treat it as
authoritative.

---

## 3. Feature Inventory

Legend: **Implemented** = present and wired in the committed code. **Partial** = present with known
gaps. **Not present** = absent (do not assume it exists).

### 3.1 App shell & navigation — Implemented
- Fixed sidebar: brand, **New patient**, nav items Dashboard / Patients / Appointments / Payments /
  Expenses / Outcomes, bottom nav Settings + hardcoded practitioner card (`PN`, "Dr. Pradnesh
  Naikwade", "Yoga therapist").
- Topbar: long-form current date, greeting "Good afternoon, Dr. Pradnesh Naikwade" (greeting text is
  static, it does not change by time of day), search input, theme toggle, add-patient button.
- Page/route switching is a single `page` union in `App` (`src/main.tsx:48`). There is **no router**.
- Global **Cmd/Ctrl + K** focuses the patient search box.
- Search filters patients by name + id + condition + phone (case-insensitive substring).

### 3.2 Dashboard — Implemented
- Hero band with clinic overview copy + "average pain change" stat.
- KPI row 1: Total patients, Active plans, Follow-ups due (`status !== 'Completed'`), Improved pain.
- KPI row 2: Appointments today, Outstanding (sum of balances), Collected today (sum of payments
  dated today), `<Month> expenses` (expenses in current month).
- Recent patients table (latest 5).
- Follow-up queue (up to 4 non-completed patients, + "View all N").
- Today's schedule list; when empty shows an empty-state plus a "Collections · Last 7 days" mini
  bar chart (`ActivitySnapshot`).
- Upcoming list (next 5 scheduled appointments from today).

### 3.3 Patients list — Implemented
- Wide table: Patient (name / id / age / gender), Contact, Condition, Initial pain (with "N pts
  better" when follow-up pain < initial), Follow-up date, Status badge.
- Header shows total record count; New patient button.

### 3.4 Patient detail — Implemented
- Back button, identity block (initials avatar, name, status badge, id/age/gender/phone, last visit).
- Header actions: Edit patient (inline edit form), Export PDF.
- **Tabs:** Overview · Visits · Timeline · Exercise plan · X-rays · Progress · Payments · Outcome
  report. Tab list is in `src/main.tsx:55`; the tab type is `Tab` in `src/types.ts:22`.

### 3.5 Overview tab — Implemented
- Clinical snapshot metrics: Pain score (before→after /10), Mobility (before→after text), Plan
  duration (months), Follow-up date.
- Clinical notes: Diagnosis, Condition, Doctor, Notes.
- "3-month outcome" card: before/after pain bars + a delta pill ("N point pain reduction/increase"
  or "No change").

### 3.6 Visits tab — Implemented (`src/components/Visits.tsx`)
- Dated visit list (newest first) with pain chip (`/10`), mobility chip (`/100`), treatment,
  prescribed exercises, notes, logged timestamp.
- Add/Edit/Delete visit modal. Fields: date, visit type (same list as appointment types), pain score
  0–10 (optional), mobility score 0–100 (optional), treatment, exercises, notes.
- Deleting a visit is guarded by a `Confirm` dialog.

### 3.7 Timeline tab — Implemented (`src/components/Timeline.tsx`)
- Merges, newest first: patient registration, visits, payments, dated X-ray records, treatment-plan
  changes (`planLog`), and appointments for that patient.
- Each event has kind icon/label; payments show amount chip.

### 3.8 Exercise plan tab — Implemented (`src/main.tsx` `Plan`)
- Editable list of exercises: name, frequency, duration, instructions. Add/remove exercise.
- Treatment duration (months) with `min=1`; on blur normalizes to ≥1 and writes a **planLog** entry
  (`{id,date,months}`) — first entry dated at the visit date if none exists.

### 3.9 X-rays tab — Implemented (`src/components/Xrays.tsx`)
- **Legacy paired comparison**: `patient.xray.before` / `patient.xray.after` upload + side-by-side
  display.
- **Dated X-ray records**: `patient.xrays[]` each `{id,image,date,bodyArea?,title?,notes?}`; upload →
  metadata modal; edit metadata; delete (confirmed); thumbnail list.
- **In-app viewer**: full-screen; zoom 0.4×–4× in 0.1 steps, rotate 90°, click-image to reset zoom.
- Privacy/persistence notes are shown inline ("Store only images … appropriate for your clinic's
  privacy…", "Images are stored as data URLs in this device's local storage…").

### 3.10 Progress tab — Implemented (`src/components/Progress.tsx`)
- Pain score trend (0–10) and mobility score trend (0–100) as hand-rolled inline SVG polylines
  (`viewBox 0 0 600 230`), no charting library.
- Snapshot metrics: pain before→latest, mobility first→latest, visits logged, first→latest dates.
- Explicit copy: charts describe recorded scores only and are not a diagnosis.

### 3.11 Payments tab (patient) — Implemented (`src/components/PaymentHistory.tsx`)
- KPI stats: Total fee, Total paid, Outstanding, Status.
- Fee input; "Add payment" ledger rows: date, method, reference, notes, amount. Edit/delete
  (delete confirmed).
- **Reconciliation banner** when `sum(payments amounts) !== patient.paid` with a "Use payment
  history" button that recomputes `paid` from the ledger.

### 3.12 Report tab — Implemented (`src/main.tsx` `Report`)
- In-app preview of the outcome report + "Generate PDF" button.
- Contains the disclaimer: *"This report summarizes recorded clinical information and
  patient-reported/clinician-entered outcomes. It is not an automated radiological diagnosis."*

### 3.13 Payments page (clinic-wide) — Implemented (`src/main.tsx` `Payments`)
- KPI stats: Billed, Collected, Pending, With balance.
- Table per patient: name/id link, editable fee, editable paid, computed balance (or credit), payment
  status select (Done / Pending / Partially paid).

### 3.14 Appointments — Implemented (`src/components/Appointments.tsx`)
- KPI stats: Today, Upcoming scheduled, Next 7 days, No shows.
- Filters: segmented Today / Upcoming / All + a specific date picker; grouped by date.
- Book/Edit/Delete appointment modal: patient, type, date, status, start time, end time, notes.
- Inline status dropdown per row.

### 3.15 Expenses — Implemented (`src/components/Expenses.tsx`)
- KPI stats: This month, Filtered total, Entries shown, All time.
- Filters: text search, category, date from/to, clear.
- Table + "By category" all-time mini bar list.
- Add/Edit/Delete expense modal: date, category, amount, payment method, description, optional related
  patient, notes.

### 3.16 Outcomes & analytics — Implemented (`src/main.tsx` `Outcomes`)
- Range selector Day / Week / Month / Quarter / **Year** (default Month; note: `InsightRange` includes
  Year but the selector list is `["Day","Week","Month","Quarter","Year"]`).
- KPIs: Collected in period, New patients in period, Follow-ups in period, Avg pain reduction.
- Charts: Revenue collected bars; Patients & follow-up demand grouped bars; "Pain improvement trend"
  progress rows (pain improved, mobility improved, active plans).

### 3.17 Settings — Implemented (`src/main.tsx` `SettingsPage`)
- **Backup**: downloads `yogacare-backup-YYYY-MM-DD.json` = `{exportedAt, patients, appointments,
  expenses}` (2-space pretty JSON).
- **Restore**: accepts a bare array **or** `{patients,...}` envelope; validates via `safePatient`
  (drops unreadable rows); requires an explicit `Confirm`; **downloads a backup of current records
  before replacing**; can restore appointments/expenses when present in the file.
- **Demo data**: 3 fictional patients (`YC-1001..1003`) can only be loaded when there are **no**
  patient records, and can be removed again. A real install starts empty.
- Appearance card notes the current theme preference and hardcoded doctor name.
- Hint (must keep): *"Backup files contain sensitive patient data. Store them securely."*

### 3.18 PDF outcome report — Implemented (see §10).

### 3.19 Not present (explicitly)
- No authentication / login / users / roles.
- No multi-clinic / tenant concept.
- No notifications / SMS / WhatsApp / email.
- No cloud sync.
- No database (no SQLite).
- No audit log.
- No consent-tracking field (only a static privacy note on the X-rays tab).
- No tests, no linter, no formatter config.
- No PDF *import*; reports are export-only.

---

## 4. UI/UX & Design System

### 4.1 Typography tokens (`src/styles.css` line 1 `:root`)
- `--font-family`: `"DM Sans", Inter, ui-sans-serif, system-ui, …` (bundled; no network font).
- Sizes: `--font-size-2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl` = 10/12/14/16/18/20/24/32/40/48.
- Weights: regular 400, medium 500, semibold 600, bold 700.
- Line heights: tight 1.2, snug 1.3, control 1.4, body 1.5, relaxed 1.6.
- Letter spacing: tighter -0.02em, wide 0.05em, wider 0.11em.
- **Rule:** every rule consumes tokens; raw `font-size`/`font-weight`/`line-height` are not allowed,
  except `line-height:1` on grid-centred cells.

### 4.2 Colour palette (light, hardcoded hex)
- Blue primary `#1d63be` (hover `#1856a4`), tint `#eaf2ff`.
- Green `#198754`, tint `#e9f8f1`.
- Red `#d9363e`, tint `#fff0f0`.
- Borders `#e4eaf1` / `#e6ebf2` / `#eef1f5`; muted text `#8490a1`; ink `#142033`; page `#f7f9fc`.
- Amber accents used for reconcile/partial: `#9a6400` on `#fff7e6`.

### 4.3 Theme
- Light is default. Dark is layered via `html[data-theme="dark"]` overrides, driven by
  `document.documentElement.dataset.theme`.
- Dark variables: `--page #0d1420`, `--surface #151f2d`, `--ink #e7edf6`, `--muted #a5b2c3`,
  `--line #29384a` (a second pass in styles.css line 4 re-declares these).
- **Rule:** a new surface (card/table/input) needs a dark override or it renders as a white slab.

### 4.4 Layout primitives
- `.app` flex; fixed `.sidebar` 245px (200px under 1000px); `.main` offset accordingly.
- `.content` padding 30px 34px 45px, `max-width:1500px`, centred.
- Grids: `.stats` (4-col), `.grid2` (1.55fr/1fr), `.detailGrid` (1fr 1fr), `.snapshot` (2-col metrics).
- Tables: `.table` + `.tr` grid; `.tr.th` uppercase 10px header; `.tr.row` clickable `<button>`
  (or non-clickable `<div>` for editable rows like `.paymentRow{cursor:default!important}`).
  Each table overrides `grid-template-columns` (`.wide`, `.paymentTable`, `.paymentHistoryTable`,
  `.apptTable`, `.expenseTable`).
- Status classes are **generated from data**:
  - `Badge` → `status.toLowerCase().replace(/[- ]/g,'')` → `.badge.active|completed|followup`.
  - appointment status select → `.apptStatus.scheduled|completed|cancelled|no-show`.
  - payment select → `.paymentStatus.done|pending|partially-paid`.
  Renaming a status literal requires adding/adjusting a CSS class.
- `.modalWrap` is `position:fixed` + `place-items:center` with no scroll. **The New Patient modal is
  ~654px tall and the window minimum height is 720px**, so form typography must not grow without
  checking `getBoundingClientRect()`.

### 4.5 Accessibility baseline (match this bar in the website)
- Icon-only buttons have `title` and/or `aria-label`.
- Repeated-row inputs use interpolated `aria-label` (e.g. `` `${p.name} treatment fee` ``).
- Decorative SVG gets `role="img"` + `aria-label`; data points get `<title>`.
- Modals are `role="dialog"`/`aria-modal` named, closable with `Esc` (`useEscape`).
- Tabs use `role="tab"` / `aria-selected`; nav uses `aria-current="page"`.
- Tables keep a real `.tr.th` header row (do not convert to div-only).
- Search has `aria-label`; alerts use `role="alert"`, status messages `role="status"`.

### 4.6 Conventions
- Class names kebab-case (`.cardHead`, `.patientCard`, `.bigAvatar`). One stylesheet, no framework, no
  Tailwind, no CSS modules, no preprocessor.
- `src/polish.css` is an additive second file for dashboard/analytics styles.

---

## 5. Data Models

All types live in `src/types.ts`. All dates are ISO `YYYY-MM-DD` **strings**. Times are `HH:mm`
strings. One flat `Patient` object holds plan, exercises, X-rays, visits, payments and plan history
inline.

```ts
type Xray      = { before?: string; after?: string }                       // base64 data URLs
type XrayImage = { id: string; image: string; date: string;
                   bodyArea?: string; title?: string; notes?: string }
type Exercise  = { name: string; frequency: string; duration: string; notes: string }
type PayMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other'
type Payment   = { id: string; patientId: string; amount: number; date: string;
                   paymentMethod: PayMethod; reference?: string; notes?: string; createdAt: string }
type Visit     = { id: string; patientId: string; date: string; visitType: string;
                   painScore?: number; mobility?: number; treatment?: string;
                   exercises?: string; notes?: string; createdAt: string }
type ApptStatus= 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show'
type Appointment = { id: string; patientId: string; date: string; startTime: string;
                     endTime: string; type: string; status: ApptStatus; notes?: string;
                     createdAt: string; updatedAt: string }
type ExpenseCat= 'Equipment' | 'Supplies' | 'Rent' | 'Utilities' | 'Marketing'
                | 'Staff' | 'Maintenance' | 'Other'
type Expense   = { id: string; date: string; category: ExpenseCat; description: string;
                   amount: number; paymentMethod: PayMethod; patientId?: string;
                   notes?: string; createdAt: string }
type PlanLog   = { id: string; date: string; months: number }
type Patient   = {
  id: string                     // 'YC-1001' style
  name: string; age: number; gender: string; phone: string
  visitDate: string              // registration date, ISO
  condition: string; painBefore: number          // 0-10
  painAfter?: number             // 0-10, optional; 0 is a valid score
  mobilityBefore: string; mobilityAfter?: string
  notes: string; diagnosis: string; doctor: string
  planMonths: number             // 3 is the product default
  followUpDate: string
  xray: Xray                     // legacy before/after pair
  exercises: Exercise[]
  status: 'Active' | 'Completed' | 'Follow-up'
  fee?: number; paid?: number
  paymentStatus?: 'Done' | 'Pending' | 'Partially paid'   // stored, but display is derived
  visits?: Visit[]; payments?: Payment[]; xrays?: XrayImage[]; planLog?: PlanLog[]
}
type TimelineKind = 'visit'|'appointment'|'payment'|'xray'|'plan'|'registration'
type TimelineEvent = { id:string; kind:TimelineKind; date:string; time?:string;
                       title:string; detail?:string; status?:string; amount?:number }
type Page = 'dashboard'|'patients'|'patient'|'appointments'|'payments'|'expenses'|'outcomes'|'settings'
type Tab  = 'overview'|'visits'|'timeline'|'plan'|'imaging'|'progress'|'payments'|'report'
```

**Enum arrays exported from `src/types.ts` (used to drive dropdowns):**
- `PAY_METHODS = ['Cash','UPI','Card','Bank Transfer','Other']`
- `EXPENSE_CATS = ['Equipment','Supplies','Rent','Utilities','Marketing','Staff','Maintenance','Other']`
- `APPT_STATUS = ['Scheduled','Completed','Cancelled','No Show']`
- `APPT_TYPES = ['Initial assessment','Follow-up','Rehabilitation','Therapy session','Consultation']`
- `VISIT_TYPES` = same 5 values as `APPT_TYPES`

### 5.1 Optional/missing-key discipline (must carry to the website)
Old records may lack today's keys (e.g. `visits`, `payments`, `xrays`, `planLog`, `painAfter`,
`mobilityAfter`, `fee`, `paid`). Always read optionals defensively (`p.x ?? fallback`,
`p.painAfter != null` — never truthiness, because `0` is a valid score). `safePatient` backfills the
required strings/arrays on restore.

---

## 6. Database & Persistence

### 6.1 There is no database
There is **no SQLite, no server, no file store**. All state is JSON in the WebView's `localStorage`
(origin `http://localhost:1423` in dev; the packaged WebView origin in release).

### 6.2 localStorage keys (`src/lib/storage.ts`)
| Key | Holds |
|---|---|
| `yogacare-patients` | `Patient[]` JSON |
| `yogacare-appointments` | `Appointment[]` JSON |
| `yogacare-expenses` | `Expense[]` JSON |
| `yogacare-theme` | `'light' | 'dark'` |

### 6.3 Read path — `readList<T>(key,label,fallback)`
- Missing key → returns `fallback` with no error.
- Non-array JSON → returns `fallback` + an error slot ("… are not a list and were left untouched…").
- Filters out entries that are not objects or lack a non-empty string `id`; if any dropped, returns
  the good rows + an error slot telling the user to export raw data first.
- JSON parse failure → `fallback` + error slot (the corrupt raw value is **left untouched**).
- Returns `{data, err}`. `App` keeps read errors and blocks writes for the affected key until resolved.

### 6.4 Write path — `writeList(key, value)`
- `JSON.stringify` + `setItem`; on failure returns a human message. `QuotaExceededError` gets a
  specific "Remove large X-ray images…" message; all other failures get a generic "changes are NOT
  saved" message.
- `App` writes via `useEffect` on changes to `patients` / `appts` / `expenses`, but **skips the write
  when the key has a read error** (so corrupted data is never silently overwritten).
- Write errors are surfaced in a top `role="alert"` banner with a "Retry save" button; read errors
  offer "Export raw data" (`exportRaw` downloads the untouched raw string).

### 6.5 Backup / restore / demo (Settings, §3.17)
- Backup file: `yogacare-backup-YYYY-MM-DD.json` = `{exportedAt, patients, appointments, expenses}`.
- Restore accepts bare array or envelope; validates via `safePatient`; confirms; auto-backs-up first.

### 6.6 Known persistence limits (carry forward as requirements)
- **PHI at rest is unencrypted** in `localStorage`.
- **~5–10 MB origin quota** shared with base64 X-ray images. Large images raise `QuotaExceededError`;
  the app surfaces this from `writeList` (error banner), but the write still fails (data can be lost
  if the user ignores it). `exportPDF` downscales images for the report but the **stored originals are
  never altered**.
- No concurrency/versioning; the last write wins.
- No schema migrations.

---

## 7. Business Logic & Rules

### 7.1 Payment math (`src/lib/payment.ts`) — authoritative
```
feeOf(p)     = num(p.fee)
paidOf(p)    = num(p.paid)
ledgerOf(p)  = sum(num(x.amount) for x in p.payments)
balanceOf(p) = max(0, fee - paid)
creditOf(p)  = max(0, paid - fee)
statusOf(p)  = derive(fee, paid)
derive(fee,paid) = (fee <= 0 || paid <= 0) ? 'Pending'
                 : (paid >= fee)          ? 'Done'
                                          : 'Partially paid'
withPaid(p,n)   = {...p, paid: max(0, num(n))}
withFee(p,n)    = {...p, fee:  max(0, num(n))}
withLedger(p,payments) = {...p, paid: max(0, sum(amounts)), payments}
```
- `statusOf` is **derived** from fee/paid; the stored `paymentStatus` field is not relied on for
  display. Keep fee/paid/derived-status mutually consistent.
- The Payments page status select (`src/main.tsx:62`):
  - `'Partially paid'` → sets `paymentStatus` only (leaves `paid`).
  - `'Done'` → `withPaid(p, feeOf(p))` (sets paid = fee); **disabled when fee is 0/blank**.
  - `'Pending'` → `withPaid(p, 0)`.
- PaymentHistory writes `paid` from the ledger (`withLedger`), and shows a reconciliation banner when
  `ledgerOf(p) !== paidOf(p)`.

### 7.2 Input normalization (`src/lib/fields.ts`)
- `normalize(key, value)`:
  - Blank → `undefined` for optional keys (`painAfter, mobilityAfter, fee, paid, paymentStatus,
    doctor`), `0` for numeric keys (`age, planMonths, painBefore`), else `''`.
  - Range-clamped & rounded via `RANGE`: age 0–120, planMonths 1–36, painBefore 0–10,
    painAfter 0–10, fee 0–10,000,000, paid 0–10,000,000.
  - Strings are `trim()`-ed.
- `safePatient(v)`: rejects non-objects and rows without a non-empty string `id` and non-empty `name`;
  coerces optional strings; defaults unknown `status` to `'Active'`; coerces `xray` to `{}`;
  sanitizes `exercises` entries.

### 7.3 IDs and formatting (`src/lib/format.ts`)
- `uid()` = `Math.random().toString(36).slice(2,9)`.
- `id(prefix, taken)` = prefix + uid, retry ≤50 on collision. Prefixes used: `ap_`, `ex_`, `pay_`,
  `v_`, `img_`.
- `patientId(taken)` = `'YC-' + (1001..9998)` random, retry ≤200, then linear fallback to the first
  free `YC-N`.
- `money(n)` = `'₹' + Number(n||0).toLocaleString('en-IN')`.
- Dates: `dayKey/today/parseDate/addDays/dateLabel/dayLabel/monthLabel/weekDay/monthKey/monthStart/
  monthEnd`, `MON` abbreviations. `timeLabel` → 12-hour `h:mm AM/PM`; `timeRange` joins two.
- `sortDateDesc`/`sortDateAsc` sort by string compare on the ISO date; `sumBy`; `download(name,
  content,type)` creates a Blob + anchor.

### 7.4 Derived/aggregate rules
- Dashboard "average pain change" = mean over patients of `(painAfterOrBefore) - painBefore`… as
  coded: `avg = round( mean( -(painBefore - (painAfter ?? painBefore)) ) * 10 ) / 10`; i.e. the mean
  of pain *reduction*, using initial score as the fallback when no follow-up exists.
- "Improved pain" = patients where `painAfter < painBefore` (numeric).
- "Follow-ups due" = `status !== 'Completed'`.
- Outcomes range buckets: Day=1; Week=7 days; Month=4 weeks; Quarter=4 quarters; Year=12 months.
  Revenue bucketed by **payment date**; new patients by **visitDate**; follow-ups by **followUpDate**
  where `status !== 'Completed'`.
- `ActivitySnapshot`: last 7 days of collections (by payment date).

### 7.5 Status literals
- Patient: `Active`, `Completed`, `Follow-up` (badge class `followup`).
- Appointment: `Scheduled`, `Completed`, `Cancelled`, `No Show` (class `no-show`).
- Payment: `Done`, `Pending`, `Partially paid` (class `partially-paid`).

### 7.6 Mutation rule (desktop pattern)
`update(p) = setPatients(a => a.map(x => x.id === p.id ? p : x))` with a **full new object**
(`{...p, field}`). Never mutate in place. Restore/reset use `setPatients` directly. The website should
replace this with explicit server endpoints, but the "replace whole entity" semantics are a useful
hint for the update payload shape.

---

## 8. User Workflows

### 8.1 New patient
Sidebar/Topbar "New patient" → modal (name & condition required; age, gender, phone, initial pain,
diagnosis, follow-up date defaulting to today+90 days, notes; doctor prefilled). On create: id via
`patientId(taken)`, prepend to list, open the new patient. Defaults: `planMonths:3`,
`status:'Active'`, `mobilityBefore:'Not recorded'`, `xray:{}`, `exercises:[]`.

### 8.2 Treat → follow-up
Open patient → **Overview** (baseline) → **Visits** (log each session: pain/mobility/treatment) →
**Progress** (see trends) → **Exercise plan** (prescribe) → **X-rays** (upload before/after + dated
records) → **Payments** (fee + ledger) → **Report** → Export PDF.

### 8.3 Scheduling
Appointments page → New appointment (patient, type, date, times, status) → inline status changes →
Today/Upcoming/All or a specific date.

### 8.4 Billing
Payments page (clinic-wide, editable fee/paid/status) or per-patient Payments tab (dated ledger with
reconciliation). Dashboard shows outstanding & collected-today.

### 8.5 Expenses
Expenses page → New expense (category, amount, method, description, optional patient) → filter/search
→ category breakdown.

### 8.6 Backup/restore/demo
Settings → Download backup / Restore backup (confirm + auto-backup of current) / Load or Remove demo
data.

---

## 9. Desktop / Backend Architecture

- **Shell:** Tauri 2.8 (`tauri` 2.8.0 in `Cargo.toml`; resolve 2.12.0 in `Cargo.lock`).
- **Rust surface:** `src-tauri/src/lib.rs` = `tauri::Builder::default().plugin(tauri_plugin_opener::
  init()).run(...)`; `main.rs` calls `yoga_patient_crm_lib::run()`. **No custom `#[tauri::command]`
  anywhere.**
- **Capabilities:** only `core:default` and `opener:default` (`capabilities/default.json`).
- **Config:** `frontendDist: ../dist`, `devUrl: http://localhost:1423`, `beforeDevCommand: npm run
  dev`, `beforeBuildCommand: npm run build`, window 1440×920 (min 1100×720), CSP `null`, bundle
  targets `all`.
- **Frontend:** Vite 7 dev server pinned to port 1423 `strictPort: true`. `index.html` → `#root` →
  `src/main.tsx`. React 19 + TS 5.9 strict.
- **No router / no state library / no UI kit / no test runner / no linter / no form library.**
- **CI:** `.github/workflows/windows-build.yml` (windows-latest, Node 20 + npm cache, Rust stable,
  `npm ci`, `npm run tauri build -- --bundles nsis,msi`, uploads `nsis/*.exe` and `msi/*.msi`).

---

## 10. Asset & Document Generation

### 10.1 Bundled assets
- `src/fonts/DMSans-latin.woff2` (62,556 bytes), DM Sans variable, latin subset, weight axis 400–700,
  declared via `@font-face` in `styles.css`. **No network fonts.**
- App icons under `src-tauri/icons/` (generated).
- PDF glyph font: two DM Sans subsets intended for the `₹` sign, base64 in `src/lib/pdfFonts.ts`.
  **Currently placeholders — see §2 warning.**

### 10.2 PDF builder (`src/lib/pdf.ts`)
- Entry points: `buildReport(p): jsPDF` (pure) and `exportPDF(p): Promise<void>` (shrinks images,
  builds, `doc.save(...)`).
- Filename: `${id}-${name-with-dashes}-report.pdf` (README says `…-outcome-report.pdf`; the code
  produces `…-report.pdf` — **discrepancy, verify**).
- Page: A4, unit mm, `compress:true`. Layout constants `MX=16, MW=178, PAGE_W=210, BOTTOM=280`.
- Theme map `C` mirrors the app colours (incl. `zebra:'#f6f9fc'`).
- `shrink(src,maxPx=1400,q=0.82)`: draws images to a canvas on white, re-encodes JPEG. Applied to
  `xray.before/after` and every `xrays[].image` before building. **Stored originals are unchanged.**
- Structure/helpers: `slim()` running header, `ensure(h)` page-break (adds page + `slim()`),
  `section(title,keep=30)` numbered section headings, `subHead`, `note`, `empty`, `grid` (3-col
  label/value), `tableHead`, `tableRow` (whole-row page moves + zebra + optional money column using
  the `DMans` font).
- Sections: 01 Patient information · 02 Clinical overview (+ 3 KPI cards) · 03 Visit history ·
  04 Progress (hand-drawn pain/mobility line charts) · 05 Exercise & home plan · 06 X-ray records
  (paired before/after tiles + dated records, aspect-preserved, bounded print size) · Payment summary
  (only when `fee>0 || payments.length`) · Notes + disclaimer · footer `Page X of Y` on every page.
- `₹` rendering relies on the embedded `DMans` font for money cells.
- Every section must advance the same `y` cursor and use `ensure()`; new sections must call
  `ensure()` before drawing.

### 10.3 JSON exports
- Backup: `yogacare-backup-YYYY-MM-DD.json`.
- Raw export (error recovery): `yogacare-raw-<label>-YYYY-MM-DD.json` (the untouched raw localStorage
  string).

---

## 11. Dependencies & Configuration

**Runtime (`package.json`):**
- `@tauri-apps/api` ^2.8.0, `jspdf` ^3.0.3, `lucide-react` ^0.468.0, `react` ^19.1.1,
  `react-dom` ^19.1.1.
- jspdf pulls in html2canvas + a DOM-purify dependency → the ~650 kB bundle warning is **expected**.

**Dev:** `@tauri-apps/cli` ^2.8.0, `@types/react` ^19.1.12, `@types/react-dom` ^19.1.9,
`@vitejs/plugin-react` ^5.0.4, `typescript` ^5.9.2, `vite` ^7.1.7.

**Scripts:** `dev` (vite), `build` (`tsc -b && vite build`), `preview`, `tauri`, `tauri:dev`,
`tauri:build`.

**Rust (`Cargo.toml`):** `tauri` 2.8.0, `tauri-plugin-opener` 2.5.0, `serde` 1, `serde_json` 1;
build-dep `tauri-build` 2.4.1. Edition 2021.

**TypeScript:** `strict: true` (app + node configs); no emit for app config.

**Gotchas:** `npm run build` **is** the typecheck (`tsc -b && vite build`); there is no other
automated check (no lint, no tests). Windows release builds need MSVC "Desktop development with C++".

---

## 12. Desktop → Website Migration Mapping

> This section maps each desktop capability to what a multi-user website must add. It does **not**
> invent requirements — items marked **(decision)** require an explicit product decision.

| Desktop capability | Desktop mechanism | Website equivalent (to build) |
|---|---|---|
| Single implicit user | hardcoded doctor name | **Auth + user account + clinic/tenant (decision)** |
| All state in `localStorage` | `storage.ts` | Server DB + REST/JSON API; client cache |
| No authorization | n/a | **Server-side authorization** so one clinic/user's data is never visible to another |
| Patient record mutation | `update()` full-object replace | `PUT/PATCH /patients/:id` with validation |
| IDs generated client-side | `patientId()` random `YC-N` | Server-generated IDs (keep human-facing `YC-N`) |
| Payment status | derived in `payment.ts` | **Same derivation, enforced server-side** |
| X-rays as base64 in localStorage | `FileReader` → data URL | Object/media storage + signed URLs (decision: local disk vs bucket) |
| PDF generated in browser | jsPDF in WebView | Server-side PDF (so reports don't depend on client) — or keep client-side (decision) |
| Backup = JSON download | `SettingsPage.dump()` | Server backup/export + scheduled backups |
| No audit log | n/a | **Audit logging (decision; README calls for it)** |
| No consent field | static note only | **Consent tracking (decision)** |
| Demo patients | `sample[]` | Optional seed/fixtures per environment |
| Theme in localStorage | `yogacare-theme` | Per-user preference |
| Cmd+K search, Esc modals, aria patterns | inline | Carry the same keyboard/a11y behaviour |
| Disclaimer copy (§3.12, PDF, README) | static strings | **Must be preserved verbatim in intent** |

**Invariants to preserve:** ISO date strings; the payment derivation; pain 0–10 / mobility 0–100;
`planMonths` ≥ 1; optional `painAfter` (0 valid); the "no automated diagnosis" posture.

---

## 13. Proposed Website Architecture (PROPOSAL — requires approval)

> The following is a **proposed** target based on the user's stated intent. It is not derived from
> the desktop code and needs sign-off before implementation.

- **Frontend:** Next.js + React + TypeScript + Tailwind CSS.
- **Backend:** Node.js + Express + TypeScript REST API.
- **DB:** a relational database (Postgres) with per-tenant scoping. *(decision)*
- **Auth:** sessions/JWT with role-based access (at minimum a clinician role). *(decision)*
- **Media:** X-ray images in object storage / filesystem, not base64 in the DB; access via signed,
  authorized URLs. *(decision)*
- **Reports:** server-generated PDF (recommended) or client-side jsPDF (faster parity). *(decision)*
- **Validation:** all business rules from §7 enforced **server-side**, mirrored client-side for UX.
- **Tenancy/authorization:** every query scoped to the owning user/clinic; never leak across accounts.

Hard requirements from the user (apply to any architecture):
1. Do not modify the desktop app.
2. Work only in the designated website project directory.
3. Do not blindly copy desktop APIs or the localStorage model.
4. Do not omit features because migration is hard.
5. Do not invent business requirements.
6. No unnecessary dependencies or features.
7. No secrets or DB credentials in the frontend.
8. Clear frontend/backend separation.
9. Validate business rules server-side.
10. Never expose one user's business data to another.
11. Ask before irreversible architectural decisions.

---

## 14. Data Migration

- Source of truth to import: the desktop **Settings backup JSON** `{exportedAt, patients,
  appointments, expenses}` (or a bare `Patient[]`).
- Import must run through the same shape guard as `safePatient` (drop/flag unreadable rows; never
  silently coerce).
- Timestamps: patients/appointments/expenses carry `createdAt`/`updatedAt`/`exportedAt` ISO strings;
  visits/payments carry `createdAt`; `planLog`, `xrays` carry `date` only.
- Embeddings: desktop X-rays are base64 data URLs inside the JSON → migration must **extract** them to
  media storage and replace with URLs/keys (do not keep multi-MB base64 in the DB).
- Optional fields may be missing on old records — migrate defensively (`??` fallbacks), never assume
  today's schema.
- Preserve `id` values where possible so references (`patientId` on visits/payments/appointments/
  expenses) stay valid; otherwise remap with a persistent map.
- `paymentStatus` in the export is stored but display-derived; recompute on import from `fee`/`paid`.

---

## 15. Feature-Parity Checklist

Use this to confirm the website reproduces the desktop app. All items are **Implemented** on desktop
unless marked otherwise.

**Shell & nav**
- [ ] Sidebar nav (Dashboard, Patients, Appointments, Payments, Expenses, Outcomes, Settings)
- [ ] Topbar date, greeting, search, theme toggle, add patient
- [ ] Cmd/Ctrl+K focuses search
- [ ] Light/dark theme
- [ ] Patient search (name/id/condition/phone)

**Dashboard**
- [ ] Hero + average pain change
- [ ] KPIs: total patients, active plans, follow-ups due, improved pain
- [ ] KPIs: appointments today, outstanding, collected today, month expenses
- [ ] Recent patients (5)
- [ ] Follow-up queue (4 + view all)
- [ ] Today's schedule (+ empty state + 7-day collections chart)
- [ ] Upcoming (5)

**Patients**
- [ ] List table with the 6 columns incl. "N pts better"
- [ ] Detail header + Edit patient + Export PDF
- [ ] Tabs: Overview, Visits, Timeline, Exercise plan, X-rays, Progress, Payments, Outcome report

**Per patient**
- [ ] Overview snapshot + notes + 3-month outcome bars/delta pill
- [ ] Visits CRUD (pain 0–10, mobility 0–100, treatment, exercises, notes)
- [ ] Timeline (registration, visit, appointment, payment, xray, plan)
- [ ] Exercise plan CRUD + plan duration + planLog
- [ ] Legacy paired X-rays + dated X-ray records + viewer (zoom/rotate)
- [ ] Progress SVG trends (pain, mobility) + disclaimers
- [ ] Payment ledger + reconciliation + fee field
- [ ] Report preview + PDF export

**Clinic-wide**
- [ ] Payments page (billed/collected/pending/with balance; editable fee/paid/status)
- [ ] Appointments (KPIs, filters, grouped list, CRUD, inline status)
- [ ] Expenses (KPIs, filters, table, by-category, CRUD)
- [ ] Outcomes (range selector, 4 KPIs, 3 charts)
- [ ] Settings (backup, restore+confirm, demo data, theme note)

**Documents & data**
- [ ] A4 paginated PDF with all sections + repeat headers + page moves + `Page X of Y`
- [ ] `₹` rendered correctly (verify — see §2 warning)
- [ ] Image downscale for PDF; originals preserved
- [ ] JSON backup restore (array or envelope, shape-validated)
- [ ] Error surfacing for unsavable/unreadable data

**Safety**
- [ ] No diagnosis claims anywhere; disclaimers preserved
- [ ] Backup-is-PHI warning
- [ ] No secrets in frontend

---

## 16. Risks, Unknowns & Open Questions

**Verified issues in the current committed desktop app**
1. **`src/lib/pdfFonts.ts` is placeholder data** → the `₹` glyph is likely broken in exported PDFs.
   Must be runtime-verified. (See §2.)
2. **Filename discrepancy:** README says `…-outcome-report.pdf`; `exportPDF` builds `…-report.pdf`.
3. **`AGENTS.md` is stale** (describes a single-file architecture that no longer exists) and is
   gitignored.
4. **No tests / no lint** — the only quality gate is `npm run build`.
5. **Data loss window:** the localStorage write can fail on quota; the app warns but cannot recover
   the unsaved change.

**UNVERIFIED (could not confirm from static reads)**
- Actual runtime `₹` rendering (depends on the broken font file).
- Whether any real patient data exists in any environment (none found in the repo's tracked sample —
  the 3 sample patients are fictional).
- Exact greeting-by-time behaviour (greeting is a static string in code).

**Open decisions for the website** (do not assume; ask)
- Auth model, roles, and multi-clinic/multi-tenant scope.
- Which database and ORM.
- Media storage location and retention.
- Server-side vs client-side PDF generation.
- Consent-tracking field and workflow.
- Audit-logging scope.
- WhatsApp/SMS reminders were discussed separately for a different effort — **not part of this app**;
  do not fold them into the website scope without an explicit decision.

**Security/PHI carry-over**
- Desktop stores PHI unencrypted, has CSP `null`, and no auth. A website **must** fix all three on the
  server side (server-side validation/authorization, TLS, secrets only on the server, encrypted DB).

---

## 17. Implementation Order (SUGGESTED — confirm before building)

1. Confirm target architecture & decisions (§13, §16) with the user.
2. Scaffold the designated website directory (frontend + backend) — do not touch the desktop repo.
3. Data model + DB schema mirroring §5, with per-tenant scoping.
4. Auth + authorization + tenant isolation.
5. Core patient CRUD + list/detail + search.
6. Visits, exercises/plan, payments ledger (+ server-side payment derivation).
7. X-ray/media upload + dated records + viewer; migrate base64 → media storage.
8. Appointments, expenses, outcomes analytics.
9. PDF report generation (server-side; reproduce §10.2 sections) + `₹`.
10. Backup/restore/export parity; audit log; consent.
11. Accessibility + theme + responsive pass; parity checklist sign-off.

---

## 18. Testing

- The desktop app has **no tests**; `npm run build` is the only check.
- Website should have: unit tests for payment derivation, `normalize`-equivalent validation, ID/date
  helpers, and the PDF section layout; API/integration tests for authorization/tenant isolation; and
  a feature-parity pass against the checklist in §15.
- Recommended (not desktop-verified) tooling: Vitest/Jest for unit, Playwright for e2e — **propose,
  don't assume** (the desktop repo deliberately has no test runner).

---

## 19. Quick Reference

**Commands (desktop):** `npm install` · `npm run dev` (Vite :1423) · `npm run tauri:dev` (real app) ·
`npm run build` (= typecheck) · `npm run tauri:build` · `cargo check --manifest-path src-tauri/Cargo.toml`.

**Key files:** `src/main.tsx` (shell+pages) · `src/types.ts` (models) · `src/lib/{format,fields,payment,
storage,pdf,pdfFonts}.ts` · `src/components/*.tsx` · `src/styles.css` + `src/polish.css`.

**localStorage keys:** `yogacare-patients`, `yogacare-appointments`, `yogacare-expenses`,
`yogacare-theme`.

**Payment rule:** `fee<=0 || paid<=0 → Pending; paid>=fee → Done; else Partially paid`;
`balance = max(0, fee-paid)`; `credit = max(0, paid-fee)`.

**Statuses:** Patient `Active|Completed|Follow-up`; Appointment `Scheduled|Completed|Cancelled|No Show`;
Payment `Done|Pending|Partially paid`.

**Pain 0–10 (0 valid, optional).** Mobility 0–100. Plan months ≥ 1 (default 3, default follow-up
today+90d).

**Product facts:** Tauri 2 + React 19 + Vite 7 + TS 5.9; no DB; no auth; identifier
`com.yogacare.crm`; version 0.1.0.
