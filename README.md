# 🚚 Shipper Admin Dashboard

A complete back-office system for a delivery platform with 4 main modules:
- **Dashboard** — Revenue & order charts, summary cards, online drivers
- **Order Management** — List, detail, timeline, complaint handling, audit logs
- **Pricing Engine** — Configure pricing, versioning, and simulation
- **Driver Management & COD** — Approve drivers, lock accounts, COD settlement, CSV export

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript, MongoDB, Mongoose |
| Auth | JWT, RBAC (Admin/Staff) |
| Validation | Zod |
| Realtime | Socket.IO |
| Docs | Swagger OpenAPI |
| Frontend | React (Vite), TailwindCSS, React Router, React Query, ECharts |

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running (local or remote)

### 1. Configure MongoDB URL

Edit `server/.env` and set your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/shipper-admin
```

### 2. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 3. Seed Database

```bash
cd server
npx ts-node src/seed.ts
```

This creates:
- 50 orders (mixed statuses)
- 10 drivers (pending/approved/online/offline)
- 2 pricing configurations
- Admin user: `admin@shipper.com` / `admin123`
- Staff user: `staff@shipper.com` / `admin123`

### 4. Start Development

```bash
# Terminal 1: Server
cd server
npm run dev

# Terminal 2: Client
cd client
npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/api-docs

## API Overview

| Module | Endpoint | Method |
|--------|----------|--------|
| Auth | `/api/auth/login` | POST |
| Stats | `/api/admin/stats/revenue` | GET |
| Stats | `/api/admin/stats/orders-summary` | GET |
| Stats | `/api/admin/stats/drivers/online` | GET |
| Orders | `/api/admin/orders` | GET |
| Orders | `/api/admin/orders/:id` | GET/PATCH |
| Orders | `/api/admin/orders/:id/complaint` | PATCH |
| Orders | `/api/admin/orders/:id/audit` | GET |
| Pricing | `/api/admin/pricing` | GET/POST |
| Pricing | `/api/admin/pricing/active` | GET |
| Pricing | `/api/admin/pricing/:id/activate` | POST |
| Pricing | `/api/admin/pricing/simulate` | POST |
| Drivers | `/api/admin/drivers` | GET |
| Drivers | `/api/admin/drivers/:id` | GET |
| Drivers | `/api/admin/drivers/:id/approve` | PATCH |
| Drivers | `/api/admin/drivers/:id/lock` | PATCH |
| COD | `/api/admin/drivers/cod/summary` | GET |
| COD | `/api/admin/drivers/cod/settle` | POST |
| COD | `/api/admin/drivers/cod/settlements` | GET |
| COD | `/api/admin/drivers/cod/export.csv` | GET |

## Project Structure

```
shipper/
├── server/
│   ├── src/
│   │   ├── config/        # DB connection, env config
│   │   ├── middleware/     # Auth, RBAC, validation, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express route handlers
│   │   ├── services/       # Business logic
│   │   ├── swagger.ts      # OpenAPI spec
│   │   ├── seed.ts         # Database seeder
│   │   └── index.ts        # Server entry point
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/            # Axios instance & API services
│   │   ├── components/     # Layout, ProtectedRoute
│   │   ├── contexts/       # AuthContext
│   │   ├── pages/          # All page components
│   │   ├── App.tsx         # Router setup
│   │   └── main.tsx        # Entry point
│   └── package.json
└── README.md
```
