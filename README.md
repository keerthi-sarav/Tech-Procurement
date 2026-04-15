# Tech-Procurement (SOGFusion Procurement Module)

A full-stack **Procurement Management System** for gas/industrial operations—covering the end-to-end purchase lifecycle (PR → RFQ → Quotes → PO → GRN → Invoice) plus **cylinder asset procurement & testing**.

- **Frontend:** React + Vite + TailwindCSS  
- **Backend:** FastAPI (Python)  
- **Database:** MySQL (`procurement_db`)

---

## Table of Contents

- [Key Features](#key-features)
- [Modules Covered](#modules-covered)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1) Clone & Install](#1-clone--install)
  - [2) Configure Environment](#2-configure-environment)
  - [3) Start the Backend (FastAPI)](#3-start-the-backend-fastapi)
  - [4) Start the Frontend (Vite)](#4-start-the-frontend-vite)
- [API](#api)
- [Database](#database)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Key Features

### Procurement workflow (end-to-end)
- Purchase Requisition (PR) creation with line items
- RFQ creation + vendor selection
- Vendor quotation entry + **side-by-side comparison**
- Purchase Order creation + approval workflow (Approve/Reject)
- GRN entry (Received/Rejected/Accepted quantities)
- Purchase Invoice with GST calculation + payment status

### Cylinder asset lifecycle
- Cylinder bulk purchase tracking
- Individual cylinder serial number registry
- Send cylinders for hydro testing/repair
- Return from vendor with **auto status updates** (Passed → Active, Failed → Scrapped)

### Operational advantages
- Single source of truth (no Excel/WhatsApp-based tracking)
- Clear audit trail across linked documents (PR → RFQ → PO → GRN → Invoice)
- Consistent UI with reusable layout + shared global state

---

## Modules Covered

### Purchase Flow
1. Purchase Requisition (PR)
2. Request for Quotation (RFQ)
3. Vendor Quotation & Comparison
4. Purchase Order (PO)
5. Goods Receipt Note (GRN)
6. Purchase Invoice

### Cylinders
7. Cylinder Purchase
8. Serial Number Entry (Cylinder Registry)
9. Send for Testing
10. Return from Vendor

---

## Tech Stack

**Frontend**
- React (via Vite)
- TailwindCSS
- React Router
- Lucide Icons

**Backend**
- FastAPI + Uvicorn
- Pydantic

**Database**
- MySQL 8.x
- `mysql-connector-python`

---

## Project Structure

```text
Tech-Procurement/
├── backend/                    # FastAPI server
│   ├── main.py                 # API entry point
│   ���── database.py             # DB init + connections + seed data
│   ├── models.py               # Pydantic models
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Example environment variables
│   └── routes/                 # Route modules (vendors, PR, RFQ, PO, etc.)
│
├── src/                        # React frontend
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Router
│   ├── index.css               # Global styles / theme
│   ├── context/                # Global app state
│   ├── components/             # Layout, shared UI components
│   └── pages/                  # Page modules for each workflow step
│
├── index.html                  # Root HTML
├── vite.config.js              # Vite + API proxy (/api -> backend)
├── package.json                # Node dependencies + scripts
└── package-lock.json
```

---

## Getting Started

### Prerequisites
- **Node.js** (recommended: latest LTS)
- **Python 3.10+** (3.11+ recommended)
- **MySQL Server** running locally (default port `3306`)

> The backend will initialize the database and create tables on first run.

---

### 1) Clone & Install

```bash
git clone https://github.com/keerthi-sarav/Tech-Procurement.git
cd Tech-Procurement
npm install
```

---

### 2) Configure Environment

1. Copy the backend env file:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Update MySQL credentials in `backend/.env` (based on your local setup).

---

### 3) Start the Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# activate your venv:
# Windows (PowerShell): .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate

pip install -r requirements.txt
python main.py
```

Backend runs at:
- **API:** `http://localhost:8000`
- **Docs (Swagger):** `http://localhost:8000/docs`

---

### 4) Start the Frontend (Vite)

From the repo root:

```bash
npm run dev
```

Frontend runs at:
- **App:** `http://localhost:5173`

> The frontend uses a Vite proxy so any request to `/api/...` is forwarded to `http://localhost:8000/api/...`.

---

## API

- Base URL: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

Common endpoints (examples):
- `GET /api/vendors`
- `POST /api/purchase-requisitions`
- `POST /api/rfqs`
- `GET /api/vendor-quotations/compare/{rfq}`
- `PATCH /api/purchase-orders/{po}/approve`
- `POST /api/goods-receipts`
- `PATCH /api/purchase-invoices/{inv}/paid`
- `GET /api/cylinder-registry`
- `POST /api/cylinder-testing`
- `POST /api/cylinder-returns`

---

## Database

- Database name: `procurement_db`
- The backend initializes:
  - Database (if missing)
  - Required tables
  - Optional demo seed data (if DB is empty)

---

## Scripts

From the repo root:

```bash
npm run dev       # start frontend dev server
npm run build     # production build
npm run preview   # preview production build locally
npm run lint      # run eslint
```

---

## Troubleshooting

### Port conflicts
- Frontend default: `5173`
- Backend default: `8000`
If either is in use, stop the other process or change ports.

### MySQL connection issues
- Ensure MySQL is running and accessible
- Confirm credentials in `backend/.env`
- Confirm MySQL port (commonly `3306`)

---
