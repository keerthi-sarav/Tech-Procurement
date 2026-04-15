# SOGFusion — Procurement Module: Complete Team Briefing

> Prepared for internal team knowledge sharing.  
> **App URL:** http://localhost:5173 | **API URL:** http://localhost:8000 | **API Docs:** http://localhost:8000/docs

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (User)                           │
│              http://localhost:5173                              │
│              React 19 + Vite 6 + TailwindCSS v4               │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTP requests to /api/...
                         │  (Vite proxies these to port 8000)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                               │
│              http://localhost:8000                              │
│              Python FastAPI + Uvicorn                           │
│              Auto-reloads on code changes                       │
└────────────────────────┬────────────────────────────────────────┘
                         │  mysql-connector-python
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL DATABASE                               │
│              Host: 127.0.0.1 | Port: 3306                      │
│              Database: procurement_db                           │
│              20 tables covering the full procurement cycle      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Folder Structure

```
Tech-Procurement/
│
├── backend/                      ← Python FastAPI server
│   ├── main.py                   ← App entry point, server starts here
│   ├── database.py               ← DB connection + table creation + seed data
│   ├── models.py                 ← Pydantic validation models (request/response shapes)
│   ├── requirements.txt          ← Python dependencies
│   └── routes/                   ← One file per feature module
│       ├── vendors.py            ← Vendor & Items master API
│       ├── purchase_requisitions.py
│       ├── rfqs.py
│       ├── vendor_quotations.py
│       ├── purchase_orders.py
│       ├── goods_receipts.py
│       ├── purchase_invoices.py
│       └── cylinders.py          ← All 4 cylinder routes combined
│
├── src/                          ← React frontend
│   ├── main.jsx                  ← React app entry point
│   ├── App.jsx                   ← Router — maps URLs to page components
│   ├── index.css                 ← Design system (colors, fonts, animations)
│   ├── context/
│   │   └── ProcurementContext.jsx ← Global state shared across all pages
│   ├── components/
│   │   └── Layout.jsx            ← Sidebar + top header shell
│   └── pages/                    ← One file per page (10 pages total)
│       ├── PurchaseRequisition.jsx
│       ├── RequestForQuotation.jsx
│       ├── VendorQuotation.jsx
│       ├── PurchaseOrder.jsx
│       ├── GoodsReceiptNote.jsx
│       ├── PurchaseInvoice.jsx
│       ├── CylinderPurchase.jsx
│       ├── CylinderSerialNumber.jsx
│       ├── CylinderTesting.jsx
│       └── CylinderReturn.jsx
│
├── package.json                  ← Node.js dependencies
├── vite.config.js                ← Vite config + API proxy rule
└── index.html                    ← Root HTML file
```

---

## ⚙️ Tech Stack — Exact Versions

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19.0 |
| Build Tool | Vite | 6.2 |
| CSS Framework | TailwindCSS | v4 (via @tailwindcss/vite) |
| Router | React Router DOM | v7.5 |
| Icons | Lucide React | 0.487 |
| Backend Framework | FastAPI | 0.135 |
| Server | Uvicorn | 0.44 |
| Data Validation | Pydantic | v2 |
| DB Driver | mysql-connector-python | latest |
| Database | MySQL | 8.x |

---

## 🔵 BACKEND — Deep Dive

### How to Start the Backend

```powershell
# Navigate to the backend folder
cd C:\Users\vskee\Desktop\Tech-Procurement\backend

# Start the server (auto-creates DB + tables on first run)
python main.py
```

On every startup, the backend:
1. Connects to MySQL
2. Creates `procurement_db` if it doesn't exist
3. Creates all 20 tables if they don't exist
4. Seeds 4 demo vendors + 5 demo items (only if the DB is empty)
5. Starts the API server on port 8000

---

### `database.py` — The Foundation

This file has three key functions:

| Function | What it Does |
|---|---|
| `get_connection()` | Returns a live MySQL connection to `procurement_db` |
| `init_database()` | Creates the database + all 20 tables |
| `seed_demo_data()` | Inserts demo vendors/items if the DB is empty |

> **Important:** Every route file calls `get_connection()` when it needs to talk to the DB. The connection is opened, used, and closed within each request — this is the standard pattern used throughout.

---

### `models.py` — Data Contracts (Pydantic)

Every API request body and response is validated against a **Pydantic model**. This gives:
- Automatic type checking (e.g., `rate` must be a float)
- Clear error messages if a field is missing or wrong type
- Auto-generated API documentation at `/docs`

Example pattern:
```python
class PRCreate(BaseModel):       # Used for POST/PUT requests (input)
    pr_number: str
    pr_date: str
    requested_by: str
    ...

class PROut(BaseModel):          # Used for GET responses (output)
    id: int
    pr_number: str
    ...
    line_items: List[PRLineItemOut]
```

---

### `main.py` — API Entry Point

This registers all route files and starts the server:
```python
app.include_router(vendors_router, prefix="/api")
app.include_router(pr_router, prefix="/api")
# ... 6 more routers
```

Every route in every file is prefixed with `/api`, so the frontend calls `/api/purchase-requisitions`, etc.

**CORS** is configured to allow requests from `http://localhost:5173` (the React app).

---

### 📊 Database Schema — All 20 Tables

#### Purchase Flow Tables

| Table | Purpose |
|---|---|
| `vendors` | Master list of suppliers with contact details |
| `items_master` | Master list of purchasable items (item code, UOM, category) |
| `purchase_requisitions` | PR header (who requested, when, department) |
| `pr_line_items` | PR detail rows — items + quantities needed |
| `rfqs` | RFQ header (date, validity, PR reference) |
| `rfq_vendors` | Which vendors were contacted for each RFQ (many-to-many) |
| `rfq_line_items` | Items + expected rates added to the RFQ |
| `vendor_quotations` | Actual quotes received from vendors (rate, delivery, terms) |
| `purchase_orders` | Final PO issued to a vendor |
| `po_line_items` | PO line items with rate, tax%, discount%, total |
| `goods_receipts` | GRN header — goods receipt from vendor |
| `grn_line_items` | What was received, rejected, and accepted |
| `purchase_invoices` | Vendor invoice with GST calculation and payment status |

#### Cylinder Asset Tables

| Table | Purpose |
|---|---|
| `cylinder_purchases` | Bulk cylinder purchase event |
| `cylinder_purchase_items` | Types + quantities + costs per purchase |
| `cylinder_registry` | **Individual cylinder tracking by serial number** |
| `cylinder_testing` | Record of cylinders sent for hydro testing/repair |
| `cylinder_testing_items` | Which serial numbers were sent and why |
| `cylinder_returns` | Cylinders received back from testing |
| `cylinder_return_items` | Pass/fail result + next test date per cylinder |

---

### API Endpoints Summary

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/vendors` | List all vendors |
| POST | `/api/vendors` | Create vendor |
| PUT | `/api/vendors/{id}` | Update vendor |
| DELETE | `/api/vendors/{id}` | Delete vendor |
| GET | `/api/purchase-requisitions` | List all PRs with line items |
| POST | `/api/purchase-requisitions` | Create PR |
| PUT | `/api/purchase-requisitions/{pr_number}` | Update PR |
| DELETE | `/api/purchase-requisitions/{pr_number}` | Delete PR |
| GET | `/api/rfqs` | List all RFQs |
| POST | `/api/rfqs` | Create RFQ |
| GET | `/api/vendor-quotations` | All quotes |
| GET | `/api/vendor-quotations/compare/{rfq}` | Comparison view sorted by rate |
| POST | `/api/vendor-quotations` | Add a quote |
| PATCH | `/api/vendor-quotations/{id}/select` | Mark vendor as selected |
| GET | `/api/purchase-orders` | List POs |
| POST | `/api/purchase-orders` | Create PO |
| PATCH | `/api/purchase-orders/{po}/approve` | Approve PO |
| PATCH | `/api/purchase-orders/{po}/reject` | Reject PO |
| GET | `/api/goods-receipts` | List GRNs |
| POST | `/api/goods-receipts` | Create GRN |
| GET | `/api/purchase-invoices` | List invoices |
| POST | `/api/purchase-invoices` | Create invoice |
| PATCH | `/api/purchase-invoices/{inv}/paid` | Mark as paid |
| POST | `/api/cylinder-purchases` | Record cylinder purchase |
| GET | `/api/cylinder-registry` | All cylinder serial numbers |
| POST | `/api/cylinder-registry` | Register a new cylinder |
| PUT | `/api/cylinder-registry/{sn}` | Update cylinder details |
| POST | `/api/cylinder-testing` | Send cylinders for testing |
| POST | `/api/cylinder-returns` | Record returned cylinders + auto-update status |

> 💡 **Tip:** Visit http://localhost:8000/docs for the full interactive API documentation with try-it-out capability.

---

## 🟦 FRONTEND — Deep Dive

### How to Start the Frontend

```powershell
cd C:\Users\vskee\Desktop\Tech-Procurement
npm run dev
# Opens at http://localhost:5173
```

---

### `vite.config.js` — The Proxy Rule

```js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

This means when the React app calls `/api/vendors`, Vite forwards it to `http://localhost:8000/api/vendors`. **The frontend never directly talks to MySQL.**

---

### `index.css` — Design System

All colors are defined as CSS variables using TailwindCSS v4's `@theme` block:

| Variable | Color | Used For |
|---|---|---|
| `--color-primary` | `#1a56db` | Buttons, links, active nav, PR numbers |
| `--color-success` | `#16a34a` | Approved status, accepted qty, passed badges |
| `--color-rejected` | `#dc2626` | Rejected status, delete buttons, failed badges |
| `--color-pending` | `#d97706` | Pending/Draft status, warning messages |
| `--color-sidebar` | `#1e2a3a` | Dark sidebar background |
| `--color-page` | `#f9fafb` | Main content area background |

---

### `ProcurementContext.jsx` — Global State

This React Context holds shared data that multiple pages need:
- `vendors` — Used by PR, RFQ, PO, GRN, Invoice, Cylinder pages
- `prs` — Used by RFQ (PR reference dropdown) and PO
- `rfqs` — Used by Vendor Quotation and PO
- `pos` — Used by GRN and Invoice (reference dropdowns)
- `grns` — Used by Invoice

Each data set has a `fetch...()` function. When a page saves new data, it calls `fetchXxx()` to refresh the relevant global list so all other pages see the update immediately.

---

### `Layout.jsx` — The Shell

The sidebar + top header that wraps every page:
- **Collapsible sidebar** — click the `<` button to collapse to icon-only mode
- **Two nav groups**: Purchase (6 items) and Cylinders (4 items)
- **Active state** — current page highlighted in blue
- **Top header** — shows current page title + notification bell + user avatar
- Used `Outlet` from React Router — each page renders inside the shell without it re-rendering

---

## 📋 THE 10 PAGES — How Each Works

---

### 1️⃣ Purchase Requisition (PR)

**Route:** `/purchase-requisition`  
**Purpose:** Internal request raised by any department when they need materials.

**Three modes:**
- **List view** — searchable table of all PRs with status badges
- **New/Edit form** — header fields + dynamic line items table
- **View mode** — read-only version for review

**Key features:**
- PR Number is **auto-generated** (`PR-YYYY-MM-XXXX`)
- Status options: `Draft → Pending → Approved / Rejected`
- Line items: Item Code, Item Name, Quantity, UOM, Remarks
- ➕ Add / 🗑️ Remove line items dynamically
- Status badge colors: 🟡 Draft/Pending, 🟢 Approved, 🔴 Rejected
- 👁️ View | ✏️ Edit | 🗑️ Delete action buttons per row

**Data flow:** `POST /api/purchase-requisitions` → saves to `purchase_requisitions` + `pr_line_items`

---

### 2️⃣ Request for Quotation (RFQ)

**Route:** `/rfq`  
**Purpose:** Send a formal request to multiple vendors asking for their price and delivery terms.

**Key features:**
- RFQ Number auto-generated (`RFQ-YYYY-MM-XXXX`)
- **Vendor multi-select** — click checkboxes to select multiple vendors
- Optional **PR Reference** — link this RFQ back to the original PR
- Validity Date — quote expiry date
- Line items — items to be quoted with expected rate for comparison
- Status: `Open → Closed / Cancelled`

**Data flow:** Saves to `rfqs` + `rfq_vendors` (one row per vendor selected) + `rfq_line_items`

---

### 3️⃣ Vendor Quotation & Comparison

**Route:** `/vendor-quotation`  
**Purpose:** After vendors respond to the RFQ, enter their quotes and compare prices side-by-side.

**Two sections:**
1. **Add Quotation form** — enter one vendor's response (rate, delivery days, payment terms, item details)
2. **Comparison table** — select an RFQ from the dropdown to see all vendor quotes sorted by rate

**Comparison logic:**
- Quotes sorted **lowest rate first**
- 🟢 Lowest rate highlighted in green with a "Lowest" badge
- **Select winner** — click the ⭐ star button on the best vendor to mark them as selected
- All other vendors for that RFQ are automatically deselected

**Data flow:** `POST /api/vendor-quotations` | `PATCH /api/vendor-quotations/{id}/select`

---

### 4️⃣ Purchase Order (PO)

**Route:** `/purchase-order`  
**Purpose:** The formal legal document issued to the selected vendor to purchase goods.

**Key features:**
- Links back to RFQ and PR references
- Vendor selected from the master list (auto-fills payment terms)
- Currency selector (INR / USD / EUR)
- Terms & Conditions text field
- **Line items with auto-calculation:**
  - Enter: Quantity × Rate → minus Discount% → plus Tax% = **Total per line**
  - **Grand Total** shown in the table footer
- **Approval Workflow:**
  - Status starts as `Pending`
  - ✅ Approve button or ❌ Reject button appear in the list view
  - Can also change status from the edit form

**Data flow:** Saves to `purchase_orders` + `po_line_items`. Approve/Reject via PATCH endpoints.

---

### 5️⃣ Goods Receipt Note (GRN)

**Route:** `/goods-receipt`  
**Purpose:** When goods physically arrive at the warehouse, this records what was received vs. what was ordered.

**Key features:**
- Links to a PO (optional — can create standalone GRN)
- Warehouse Location field
- **QC Required** toggle (Yes/No radio buttons)
- Line items with 4 quantity fields per item:
  - **Ordered Qty** — what was expected
  - **Received Qty** — what physically arrived
  - **Rejected Qty** — what was rejected (damaged/wrong)
  - **Accepted Qty** — **auto-calculated** = Received − Rejected (shown in green)

**Data flow:** `POST /api/goods-receipts` → saves to `goods_receipts` + `grn_line_items`

---

### 6️⃣ Purchase Invoice

**Route:** `/purchase-invoice`  
**Purpose:** Record the vendor's tax invoice and track payment status.

**Key features:**
- Links to GRN and PO for cross-reference
- **Auto GST calculation:**
  - Enter subtotal amount
  - Enter tax % (default 18%)
  - Tax Amount and Total Amount are **calculated automatically**
- Payment Status: `Unpaid → Partial → Paid`
- **Quick "Mark Paid"** button (✅ green checkmark) in the list view — no need to open the record
- Due Date tracking

**Data flow:** `POST /api/purchase-invoices` | `PATCH /api/purchase-invoices/{inv}/paid`

---

### 7️⃣ Cylinder Purchase

**Route:** `/cylinder-purchase`  
**Purpose:** When the company buys new cylinders in bulk from a supplier. Treated as **fixed asset procurement** (separate from regular consumables).

**Key features:**
- Linked to a vendor
- Invoice number tracking
- **Multi-type purchase** — one purchase can include different cylinder types:
  - e.g., 50 Oxygen Cylinders + 20 CO2 Cylinders in one transaction
- Per-row: Cylinder Type, Quantity, Unit Cost → **Total Cost auto-calculated**
- **Grand Total** summed from all rows

**Cylinder Types available:** Oxygen, CO2, Nitrogen, Argon, LPG, Acetylene, Hydrogen

**Data flow:** Saves to `cylinder_purchases` + `cylinder_purchase_items`

---

### 8️⃣ Cylinder Serial Number Entry

**Route:** `/cylinder-serial`  
**Purpose:** After purchasing cylinders, register each individual cylinder with its unique serial number for asset tracking.

**Key features:**
- **4 Summary Cards** at top: Total Cylinders, Active, In Testing, Scrapped
- **Status filter** dropdown — filter the table by status
- **Search** by serial number or barcode
- Fields per cylinder:
  - Serial Number (unique — e.g., `CYL-OX-00001`)
  - Barcode / QR Code value
  - Cylinder Type, Capacity, Capacity Unit
  - Manufacturing Date, Test Due Date
  - Ownership (Company / Customer / Rental)
  - Status: Active / In Testing / Scrapped / Returned
  - Linked Purchase ID
- Full CRUD: Create, View, Edit, Delete

> **This is the master cylinder registry.** Every cylinder that goes for testing or gets returned is tracked here.

---

### 9️⃣ Cylinder Testing (Send for Testing / Repair)

**Route:** `/cylinder-testing`  
**Purpose:** When cylinders need hydro testing (mandatory every 5 years) or repair, record them going out to a testing agency.

**Key features:**
- Testing Agency / Vendor Name
- Date Sent + Expected Return Date
- Status: `Sent → In Progress → Returned / Overdue`
- **Add multiple cylinder serial numbers** in one transaction
- Reason per cylinder: Hydro Testing, Valve Repair, Damage Inspection, General Maintenance, etc.
- List view shows how many cylinders are in each testing batch

**Data flow:** Saves to `cylinder_testing` + `cylinder_testing_items`

---

### 🔟 Cylinder Return from Vendor

**Route:** `/cylinder-return`  
**Purpose:** When the testing agency returns the cylinders, record the results and **automatically update the master registry**.

**Key features:**
- Enter which testing agency returned the cylinders
- Date Received
- Per cylinder entry:
  - Serial Number
  - **Test Result: Passed / Failed**
  - Next Test Due Date
  - Repair Cost (if applicable)
- **⚡ Auto-update on Save:**
  - Cylinders marked **Passed** → status updated to **Active** in cylinder registry
  - Cylinders marked **Failed** → status updated to **Scrapped** in cylinder registry
  - `test_due_date` updated in the registry automatically
- List view shows passed vs failed count per return batch

> This page closes the testing loop — no manual updating of cylinder status required.

---

## 🗃️ HOW TO DELETE DATA IN MySQL

> ⚠️ **WARNING: These commands permanently delete data. Always take a backup first.**

### Connect to MySQL

Open MySQL Workbench or run in terminal:
```sql
mysql -u root -p
-- Enter password: 6369781582
USE procurement_db;
```

---

### 🔴 Delete ALL Data (Clear Everything — Keep Tables)

```sql
-- Disable foreign key checks so we can delete in any order
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all procurement data
TRUNCATE TABLE cylinder_return_items;
TRUNCATE TABLE cylinder_returns;
TRUNCATE TABLE cylinder_testing_items;
TRUNCATE TABLE cylinder_testing;
TRUNCATE TABLE cylinder_registry;
TRUNCATE TABLE cylinder_purchase_items;
TRUNCATE TABLE cylinder_purchases;
TRUNCATE TABLE purchase_invoices;
TRUNCATE TABLE grn_line_items;
TRUNCATE TABLE goods_receipts;
TRUNCATE TABLE po_line_items;
TRUNCATE TABLE purchase_orders;
TRUNCATE TABLE vendor_quotations;
TRUNCATE TABLE rfq_line_items;
TRUNCATE TABLE rfq_vendors;
TRUNCATE TABLE rfqs;
TRUNCATE TABLE pr_line_items;
TRUNCATE TABLE purchase_requisitions;
TRUNCATE TABLE items_master;
TRUNCATE TABLE vendors;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
```

---

### 🟡 Delete Specific Records

```sql
-- Delete a specific PR and its line items
DELETE FROM purchase_requisitions WHERE pr_number = 'PR-2026-04-1234';

-- Delete a specific PO
DELETE FROM purchase_orders WHERE po_number = 'PO-2026-12345';

-- Delete a specific vendor
DELETE FROM vendors WHERE vendor_code = 'VND-001';

-- Delete a specific cylinder serial number
DELETE FROM cylinder_registry WHERE serial_number = 'CYL-OX-00001';

-- Delete all invoices for a vendor
DELETE FROM purchase_invoices WHERE vendor_name = 'Airgas India Pvt Ltd';
```

---

### 🟠 Delete the Entire Database (Nuclear Option)

```sql
DROP DATABASE procurement_db;
-- The next time you run `python main.py`, it will recreate everything from scratch.
```

---

### 🟢 View Data (Useful for Debugging)

```sql
-- See all vendors
SELECT * FROM vendors;

-- See all PRs
SELECT pr_number, requested_by, department, status FROM purchase_requisitions;

-- See all cylinders with their status
SELECT serial_number, cylinder_type, status, test_due_date FROM cylinder_registry;

-- Count records in each table
SELECT 'Vendors' as tbl, COUNT(*) as cnt FROM vendors
UNION ALL SELECT 'PRs', COUNT(*) FROM purchase_requisitions
UNION ALL SELECT 'POs', COUNT(*) FROM purchase_orders
UNION ALL SELECT 'GRNs', COUNT(*) FROM goods_receipts
UNION ALL SELECT 'Invoices', COUNT(*) FROM purchase_invoices
UNION ALL SELECT 'Cylinders', COUNT(*) FROM cylinder_registry;
```

---

## 🚀 How to Start the Full System

Open **two separate terminal windows**:

**Terminal 1 — Backend:**
```powershell
cd C:\Users\vskee\Desktop\Tech-Procurement\backend
python main.py
# ✅ Should print: Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 — Frontend:**
```powershell
cd C:\Users\vskee\Desktop\Tech-Procurement
npm run dev
# ✅ Should print: VITE ready at http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

---

## 💡 Key Design Decisions

| Decision | Reason |
|---|---|
| Separate `procurement_db` from Production DB | Zero risk of interfering with existing production data |
| Auto-generate PR/PO/RFQ numbers | Eliminates human error in numbering, ensures uniqueness |
| Inline line items (not separate page) | Faster data entry — matches physical form workflow |
| Cascade delete on FK relationships | Deleting a PR automatically removes its line items |
| Context API for shared state | Avoids redundant API calls — vendors/PRs loaded once, used everywhere |
| Status as plain VARCHAR | Flexible — easy to add new statuses without DB migrations |
| Cylinder Return auto-updates registry | Eliminates a manual step — data stays consistent automatically |

---

## 🔗 The Full Procurement Lifecycle (End-to-End Flow)

```
Department raises need
        │
        ▼
1. Purchase Requisition (PR)
   "We need 100 Oxygen Cylinder Caps"
        │
        ▼
2. Request for Quotation (RFQ)
   Send to 3 vendors: Airgas / BGCL / National Gas
        │
        ▼
3. Vendor Quotation Entry
   Airgas: ₹45/unit | BGCL: ₹38/unit ← Lowest! | National: ₹42/unit
        │ Select BGCL as winner
        ▼
4. Purchase Order (PO)
   Issue PO to BGCL for 100 caps @ ₹38 = ₹3,800
        │ Await approval
        ▼
5. Goods Receipt Note (GRN)
   100 caps arrive → 98 accepted, 2 rejected (damaged)
        │
        ▼
6. Purchase Invoice
   BGCL invoices ₹3,724 + 18% GST = ₹4,394.32
        │ Mark as Paid
        ▼
   ✅ Procurement cycle complete!
```

```
Cylinder Asset Lifecycle:
        │
        ▼
7. Cylinder Purchase
   Buy 50 Oxygen Cylinders from BGCL
        │
        ▼
8. Serial Number Entry
   Register CYL-OX-00001 through CYL-OX-00050
        │ (Status: Active)
        ▼
9. Cylinder Testing
   Send 10 cylinders for Hydro Testing every 5 years
        │ (Status: In Testing)
        ▼
10. Cylinder Return
    8 pass → Status: Active | 2 fail → Status: Scrapped
    Next test due dates updated automatically ✅
```
