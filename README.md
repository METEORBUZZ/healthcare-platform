# 🏥 HealthCare+ Platform

HealthCare+ is a full-stack healthcare appointment and patient-care management platform built with React, TypeScript, Express, and PostgreSQL.

Status: The shared package and API workspace are in place, and the web app is being finalized alongside Docker, CI, and documentation improvements.

A full-stack, enterprise-grade **Healthcare Appointment & Patient-Care Management Platform** built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **Express**, and **PostgreSQL**.

Includes portals for **Patients**, **Doctors**, and **Administrators** with role-based access control (RBAC), appointment scheduling, clinical profile management, analytics, and a separately hosted administrator application.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [💻 Local Setup (Localhost pe kaise chalayein)](#-local-setup-localhost-pe-kaise-chalayein)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone & Install Dependencies](#step-1-clone--install-dependencies)
  - [Step 2: Environment Variables (.env)](#step-2-environment-variables-env)
  - [Step 3: Run Development Server](#step-3-run-development-server)
  - [Step 4: Access in Browser & Demo Logins](#step-4-access-in-browser--demo-logins)
- [🐳 DevOps & Docker Setup](#-devops--docker-setup)
  - [Run with Docker Compose (Single Command)](#run-with-docker-compose-single-command)
  - [Build and Run with Dockerfile](#build-and-run-with-dockerfile)
- [🗄️ Database Setup (PostgreSQL)](#️-database-setup-postgresql)
  - [Zero-Config Fallback Mode](#zero-config-fallback-mode)
  - [Connecting Real PostgreSQL](#connecting-real-postgresql)
- [🚀 Production Deployment Guide](#-production-deployment-guide)
  - [Production Build & Start](#production-build--start)
  - [PM2 Process Management](#pm2-process-management)
  - [Nginx Reverse Proxy Config](#nginx-reverse-proxy-config)
  - [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
- [⚙️ Environment Variables (.env)](#️-environment-variables-env)
- [📜 NPM Scripts](#-npm-scripts)
- [🛠️ Troubleshooting & FAQs](#️-troubleshooting--faqs)

---

## ✨ Features

- **Public Directory & Search**: Search verified doctors by specialty, ratings, consultation fees, and real-time availability ("Available Today").
- **Patient Workspace**: 4-step interactive booking wizard, appointment timeline, history filters, prescription tracker, and emergency health profiles.
- **Doctor Workspace**: Clinical schedule manager, daily consultation ledger, inline appointment actions (Confirm, Complete, Cancel), and consultation fee settings.
- **Admin Control Center**: Clinic analytics dashboard, user account activation controls, and global booking oversight.
- **Security**: JWT authentication, bcrypt password hashing, and role-based route protection.

---

## 💻 Local Setup (Localhost pe kaise chalayein)

Yeh project standard Node.js environment pe run hota hai. Isme frontend (React Vite) aur backend (Express API) ek hi port `3000` par unified tarike se chalta hai.

### Prerequisites

Aapke computer me yeh installed hone chahiye:

1. **Node.js**: v18.0.0 ya v20+ (Download from: [nodejs.org](https://nodejs.org/))
2. **Git**: (Optional, repo clone karne ke liye)
3. **npm** (Node.js ke sath automatically install ho jata hai) ya **bun**

Check versions:

```bash
node -v   # Should be v18+ or v20+
npm -v    # Should be v9+ or v10+
```

---

### Step 1: Clone & Install Dependencies

Project directory me enter karein aur saari packages install karein:

```bash
# 1. Project folder me jayein
cd healthcare-platform

# 2. Dependencies install karein
npm install
```

---

### Step 2: Environment Variables (.env)

Default `.env.example` file se apni `.env` file banayein:

```bash
# Linux / macOS:
cp .env.example .env

# Windows (Command Prompt):
copy .env.example .env

# Windows (PowerShell):
Copy-Item .env.example .env
```

Set `PUBLIC_APP_URL=http://localhost:3000` and `ADMIN_APP_URL=http://localhost:3001` for local development. Generate a unique local signing key with `openssl rand -base64 48` and place it in `.env` as `JWT_ACCESS_SECRET`. The API requires PostgreSQL; it does not fall back to an in-memory database. Keep development secrets separate from production secrets.

For the local one-click demo accounts only, set `SEED_PASSWORD=Demo@12345` before running `npm run db:seed`. Never use this demo password or seed data in production.
---

### Step 3: Run Development Server

Project root se app start karein. This starts the API, public app, and dedicated admin app as separate local processes:

```bash
npm run dev
```

Ye root script backend aur frontend ko ek sath start karta hai. Agar sirf API chahiye ho, toh yeh command use karein:

```bash
npm run dev -w @healthcare/api
```

Before the first start, apply any pending database migrations with `npm run db:migrate`. Terminal me API and Vite startup output dikhega:

```
API: http://localhost:4000
Public app: http://localhost:3000
Admin app: http://localhost:3001
```

---

### Step 4: Access in Browser & Demo Logins

Patients and clinical staff use the public application:
👉 **[http://localhost:3000](http://localhost:3000)**

Administrators sign in only through the separate admin application:
👉 **[http://localhost:3001](http://localhost:3001)**

The public app does not offer an administrator sign-in or administrator station switch. For a local demo database seeded with `SEED_PASSWORD=Demo@12345`, use the demo administrator credentials below. If you created the administrator with the one-time bootstrap tool instead, use the email and password you supplied there. Never use seeded/demo credentials in production.

| Role        | Email                                              | Password              | Access Area                     |
| :---------- | :------------------------------------------------- | :-------------------- | :------------------------------ |
| **Patient** | `patient@demo.test`                                | Local `SEED_PASSWORD` | Patient Portal & Booking Wizard |
| **Doctor**  | `doctor@demo.test`                                 | Local `SEED_PASSWORD` | Doctor Schedule & Consultations |
| **Admin**   | `admin@demo.test` *(seeded local demo only)*         | `Demo@12345` *(only when `SEED_PASSWORD=Demo@12345`)* | Dedicated Admin Application |

---

## 🐳 DevOps & Docker Setup

Docker Compose is optional. Its production-oriented configuration requires a strong URL-safe `POSTGRES_PASSWORD`, a private-network `DATABASE_URL`, and an HTTPS `CORS_ORIGINS` value. It does not seed demo accounts, does not publish the database port, and binds the application to loopback for an HTTPS reverse proxy.

### Run with Docker Compose (Single Command)

Before starting Compose, configure the required secrets and production HTTPS origin in the deployment environment.

```bash
# 1. Docker containers build and start karein
docker compose up --build
```

Background / Detached mode me chalane ke liye:

```bash
docker compose up -d --build
```

Isse 2 containers chalenge:

1. `healthcare_postgres`: PostgreSQL 16 with a required deployment password and private networking.
2. `healthcare_app`: Production Node.js container bound to `127.0.0.1:3000`; place it behind an HTTPS reverse proxy.

Apply database migrations and create the first administrator once before serving traffic:

```bash
docker compose exec app node apps/api/dist/migrate.js
docker compose exec app node apps/api/dist/createAdmin.js
```

Provide unique `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` values for that one-time command, then remove them.

**App URL behind your HTTPS reverse proxy**: [https://your-domain](https://your-domain)

Containers stop karne ke liye:

```bash
docker compose down
```

The following removes the persistent database volume and permanently deletes its data. Never use this on a production deployment.

```bash
docker compose down -v
docker compose up --build
```

---

### Build and Run with Dockerfile

For deployment, configure the required production secrets and HTTPS settings described in the production security checklist. Do not pass JWT or database secrets as command-line arguments; use your deployment secret manager.

## 🗄️ Database Setup (PostgreSQL)

### PostgreSQL Requirement

A running PostgreSQL database is required. Configure `DATABASE_URL`, then run the database migrations before starting the API. The application does not silently switch to an in-memory database.

### Connecting Real PostgreSQL

Real PostgreSQL database use karne ke steps:

1. **Database create karein**:

   ```bash
   psql -U postgres -c "CREATE DATABASE healthcare_db;"
   ```

2. **Schema aur Seed tables import karein**:

   ```bash
   psql -U postgres -d healthcare_db -f database/schema.sql
   psql -U postgres -d healthcare_db -f database/seed.sql
   ```

3. **Apni `.env` file me `DATABASE_URL` update karein**:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/healthcare_db"
   ```

---

## 🚀 Production Deployment Guide

### Production Security Requirements

- Generate a unique `JWT_ACCESS_SECRET` with `openssl rand -base64 48`; production requires at least 64 characters.
- Set `COOKIE_SECURE=true` and serve the site only over HTTPS. The API refuses production startup if secure cookies are disabled.
- Configure `DATABASE_URL`, `DATABASE_SSL=require` where supported, and `CORS_ORIGINS` with only trusted HTTPS origins.
- Apply migrations, then create the first administrator exactly once using `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and a unique `ADMIN_BOOTSTRAP_PASSWORD` of at least 14 characters:
  `node apps/api/dist/migrate.js` and `node apps/api/dist/createAdmin.js`.
- Remove bootstrap credentials from the environment after use. Never run demo database seeding in production.
- Administrators provision staff logins from the staff form, with a unique initial password that must be shared out-of-band. Staff accounts and their initial shift are created together; password credentials are never returned by the API.
- Doctor accounts must be verified and have an appointment relationship with a patient to view that patient's tracking data or record their vitals. Administrative routes are restricted to administrators.
- Admin shift and location assignments are stored in PostgreSQL and tied to the staff member's sign-in email. Doctor and staff dashboards check for changes every 10 seconds and refresh immediately when returning to the tab; assignment changes are also recorded in the shift audit table.
- Access tokens are bound to active server-side sessions. After deploying this change, existing users must sign in again once; logging out or revoking a session invalidates its access tokens.
- Clinical-access audit events are stored in PostgreSQL. Configure and periodically verify an appropriate retention and protected off-site archival process; application logging alone does not provide immutable audit storage or SOC 2 certification.

### Production Build & Start

Production environment me client bundle compile karne aur optimized server run karne ke liye:

```bash
# 1. Client & Server bundle build karein (Output: /dist)
npm run build

# Apply database migrations and create the first admin once, before deployment.
node apps/api/dist/migrate.js
node apps/api/dist/createAdmin.js

# Start the production API and built web client.
npm run start -w @healthcare/api
```

---

### PM2 Process Management

VPS (AWS EC2, DigitalOcean, Hetzner, Ubuntu Server) par continuous background execution aur auto-restart ke liye **PM2** use karein:

```bash
# 1. PM2 globally install karein
npm install -g pm2

# 2. Production build create karein
npm run build

# 3. PM2 se start karein (one process per host; scale with a process manager/orchestrator)
pm2 start npm --name "healthcare-app" -- run start -w @healthcare/api

# 4. Logs check karein
pm2 logs healthcare-app

# 5. System reboot ke baad auto-start enable karein
pm2 startup
pm2 save
```

---

### Nginx Reverse Proxy Config

Set `PUBLIC_APP_URL=https://example.com` and `ADMIN_APP_URL=https://admin.example.com` in the production environment used by both the API and the frontend build. Point both DNS names at the HTTPS reverse proxy; it can serve the same built SPA/API process while the frontend selects the dedicated admin experience by the configured admin origin. Set `COOKIE_SECURE=true` and configure `TRUST_PROXY=1` when one trusted proxy is in front of the API.

The example below routes both HTTPS origins to the local Node API/static-server port:

```nginx
# /etc/nginx/sites-available/healthcare.conf

server {
    listen 80;
    server_name example.com admin.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name admin.example.com;

    ssl_certificate /etc/letsencrypt/live/admin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable karein aur restart karein:

```bash
sudo ln -s /etc/nginx/sites-available/healthcare.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Free SSL certificates for both origins:
sudo certbot --nginx -d example.com -d admin.example.com
```

---

### CI/CD Pipeline (GitHub Actions)

Automatic testing, linting aur Docker image build ke liye `.github/workflows/deploy.yml` create karein:

```yaml
name: HealthCare+ CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: TypeScript Lint & Type Check
        run: npm run lint

      - name: Production Build
        run: npm run build

      - name: Build Docker Image
        run: docker build -t healthcare-platform:${{ github.sha }} .
```

---

## ⚙️ Environment Variables (.env)

| Variable                   | Description                        | Development                        | Production                                        |
| :------------------------- | :--------------------------------- | :--------------------------------- | :------------------------------------------------ |
| `NODE_ENV`                 | Runtime mode                       | `development`                      | `production`                                      |
| `PORT`                     | API server port                    | `4000`                             | Set by deployment                                 |
| `DATABASE_URL`             | PostgreSQL connection string       | Local PostgreSQL URL               | Required private database URL                     |
| `DATABASE_SSL`             | PostgreSQL TLS mode                | `disable` for local DB             | `require` when supported                          |
| `JWT_ACCESS_SECRET`        | JWT signing key                    | Generate a local-only random value | Unique generated value, 64+ characters            |
| `CORS_ORIGINS`             | Allowed browser origins            | `http://localhost:5173`            | Trusted HTTPS origin(s) only                      |
| `COOKIE_SECURE`            | Require HTTPS for auth cookies     | `false`                            | Must be `true`                                    |
| `SEED_PASSWORD`            | Shared local demo-account password | Required only for local `db:seed`  | Do not set; demo seeding is disabled              |
| `ADMIN_BOOTSTRAP_NAME`     | Initial administrator name         | Not required                       | One-time bootstrap only                           |
| `ADMIN_BOOTSTRAP_EMAIL`    | Initial administrator email        | Not required                       | One-time bootstrap only                           |
| `ADMIN_BOOTSTRAP_PASSWORD` | Initial administrator password     | Not required                       | Unique password, 14+ characters; remove after use |

---

## 📜 NPM Scripts

| Script                             | Command                     | Description                                  |
| :--------------------------------- | :-------------------------- | :------------------------------------------- |
| `npm run dev`                      | `concurrently`              | Runs API and web development servers locally |
| `npm run build`                    | Workspace builds            | Builds production API and web assets         |
| `npm run start -w @healthcare/api` | `node dist/server.js`       | Runs the production API and built web client |
| `npm run typecheck`                | Workspace TypeScript checks | Type-checks all workspaces                   |
| `npm test`                         | Workspace Vitest suites     | Runs available tests                         |
| `npm run lint`                     | ESLint                      | Lints the project                            |

---

## 🛠️ Troubleshooting & FAQs

#### Q1: Port 3000 already in use error: `EADDRINUSE: address already in use :::3000`

**Solution**: Port 3000 par koi aur process chal raha hai. Us process ko stop karein:

- **Windows**: `netstat -ano | findstr :3000` fir `taskkill /PID <PID> /F`
- **Mac/Linux**: `lsof -i :3000` fir `kill -9 <PID>`
- Ya `.env` file me `PORT=3001` change kar dein.

#### Q2: Login error "Invalid credentials"

**Solution**: Demo login credentials verify karein:

- Email: `patient@demo.com`
- Password: `demo123`
  _(Make sure caps lock off hai)_

#### Q3: Database connection warning in terminal

Agar terminal me `Could not connect to PostgreSQL DATABASE_URL, using integrated robust relational engine` dikhe, toh ghabraye nahi! App bina PostgreSQL ke bhi smoothly chalegi using built-in memory store.

---

## 📄 License

This project is open-source and ready for commercial or educational use.# healthcare-platform
