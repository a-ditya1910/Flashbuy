# FlashBuy ⚡

A distributed flash sale system built with 3 Node.js microservices, event-driven via Kafka (SAGA choreography pattern), and a React frontend.

**Live demo:** https://flashbuy-mu.vercel.app

---

## Architecture

```
React Frontend (Vercel)
        │
        ▼
┌──────────────────┐   order-events   ┌───────────────────┐   payment-events    ┌────────────────────────┐
│  order-service   │ ───────────────► │  payment-service  │ ──────────────────► │  notification-service  │
│  (port 4001)     │ ◄─────────────── │  (port 4002)      │                     │  (port 4003)           │
└──────────────────┘  payment-events  └───────────────────┘                     └────────────────────────┘
        │                      │                                                           │
        ▼                      ▼                                                           ▼
     MySQL               MySQL + Redis                                                  MySQL
```

**Flow:** User places order → order-service publishes to `order-events` → payment-service processes payment (90% success) → publishes to `payment-events` → order-service updates order status + notification-service notifies user.

---

## Tech Stack

| Layer | Local | Production |
|---|---|---|
| Services | Node.js + TypeScript (PM2) | Render (free tier) |
| Database | MySQL 8 (Docker) | TiDB Cloud Serverless |
| Cache / Inventory | Redis 7 (Docker) | Upstash Redis |
| Message broker | Apache Kafka (Docker) | RedPanda Cloud |
| Frontend | Vite + React | Vercel |

---

## Local Setup

### Prerequisites
- Node.js 18+
- Docker Desktop
- PM2 (`npm install -g pm2`)

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-username/flashbuy.git
cd flashbuy

cd services/order-service && npm install && cd ../..
cd services/payment-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd frontend && npm install && cd ..
```

### 2. Start infrastructure

```bash
docker-compose up -d
```

This starts MySQL on port 3308, Redis on port 6380, and Kafka on port 9092.

Wait ~15 seconds for Kafka to be ready, then verify:

```bash
docker ps
```

All 3 containers should show `healthy`.

### 3. Run database migrations

```bash
cd services/order-service && npm run migrate && cd ../..
```

### 4. Seed sample data (products + flash sales)

```bash
cd services/order-service && npm run seed && cd ../..
```

### 5. Start all services with PM2

```bash
pm2 delete all && pm2 start ecosystem.config.js
pm2 status
```

All 3 services should show `online`.

### 6. Start the frontend

```bash
cd frontend && npm run dev
```

Open http://localhost:5173

### Local environment variables

All env vars are in `ecosystem.config.js` — no `.env` files needed locally.

| Variable | Value |
|---|---|
| DB_HOST | localhost |
| DB_PORT | 3308 |
| DB_USER | root |
| DB_PASSWORD | root |
| DB_NAME | flashbuy |
| REDIS_HOST | localhost |
| REDIS_PORT | 6380 |
| KAFKA_BROKER | localhost:9092 |
| JWT_SECRET | flashbuy-super-secret-key-2026 |
| ADMIN_SECRET | flashbuy-admin-2026 |

### Create an admin account (local)

1. Open http://localhost:5173
2. Click **"Don't have an account? Sign up"**
3. Fill in name, email, password
4. Enter admin code: `flashbuy-admin-2026`
5. Click **Create Account**

Admins can create products and schedule flash sales from the dashboard.

---

## Production Deployment

### Deployed URLs

| Service | URL |
|---|---|
| Frontend | https://flashbuy-mu.vercel.app |
| order-service | https://flashbuy-oyia.onrender.com |
| payment-service | https://flashbuy-payment-service.onrender.com |
| notification-service | https://flashbuy-notification-service.onrender.com |

### Cloud services used

- **TiDB Cloud Serverless** — free MySQL-compatible database
- **Upstash Redis** — free Redis with TLS
- **RedPanda Cloud** — free Kafka with SASL/SCRAM-SHA-256 auth
- **Render** — free tier Node.js hosting (spins down after 15 min inactivity)
- **Vercel** — React frontend hosting

### Render environment variables

Set these in each service's **Environment** tab on Render:

**All 3 services:**

```
DB_HOST=<tidb-host>
DB_PORT=4000
DB_USER=<tidb-user>
DB_PASSWORD=<tidb-password>
DB_NAME=flashbuy
DB_SSL=true
REDIS_HOST=<upstash-host>
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-password>
KAFKA_BROKER=<redpanda-broker>
KAFKA_USERNAME=<redpanda-username>
KAFKA_PASSWORD=<redpanda-password>
JWT_SECRET=flashbuy-super-secret-key-2026
```

**order-service only (add this extra var):**

```
ADMIN_SECRET=flashbuy-super-secret-key-2026
```

### Vercel environment variables

```
VITE_ORDER_SERVICE_URL=https://flashbuy-oyia.onrender.com
VITE_NOTIFICATION_SERVICE_URL=https://flashbuy-notification-service.onrender.com
VITE_PAYMENT_SERVICE_URL=https://flashbuy-payment-service.onrender.com
```

### Create an admin account (production)

1. Open https://flashbuy-mu.vercel.app
2. Click **"Don't have an account? Sign up"**
3. Fill in name, email, password
4. Enter admin code: `flashbuy-super-secret-key-2026`
5. Click **Create Account**
---

## Database schema

```sql
users (id, email, name, password_hash, role, created_at)
products (id, name, description, image_url, original_price)
sales (id, product_id, flash_price, total_slots, starts_at, ends_at)
orders (id, user_id, sale_id, product_id, status, created_at)
payments (id, order_id, user_id, amount, status, reason, created_at)
notifications (id, user_id, message, type, read, created_at)
```
