## Motif Collection — Inventory Management System

Production-ready Inventory Management System for a retail shop named **Motif Collection**.

### Tech stack
- **Backend**: Node.js + Express + MongoDB (Mongoose), JWT auth, role-based access
- **Frontend**: React (Vite) + Material UI, responsive desktop/tablet UI
- **Barcode**: Server-side barcode generation (PNG) + printable labels
- **Printing**: Browser print layouts for invoices (A4; thermal-friendly styling)

### Project structure
- `backend/` REST API + database models + seed script
- `frontend/` React UI
- `docker-compose.yml` local MongoDB

### Prerequisites
- Node.js 20+ (recommended). If you don’t have it installed, install the current LTS from `https://nodejs.org/`
- Docker Desktop (recommended) OR a local MongoDB instance

### Quick start (local)
1) Start MongoDB

```bash
docker compose up -d
```

2) Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

3) Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### Default users (after seed)
- **Admin**: `admin@motif.local` / `Admin@12345`
- **Staff**: `staff@motif.local` / `Staff@12345`

### Notes
- This is a starter that already includes: products + stock, purchases/sales/returns, invoice numbers, barcode generation, printing layouts, and audit logs.
- You can extend it to multi-branch, VAT/GST, or cloud sync later.

