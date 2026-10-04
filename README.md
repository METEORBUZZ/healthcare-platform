# 🏥 HealthCare+ Platform

HealthCare+ is a full-stack healthcare appointment and patient-care management platform built with React, TypeScript, Express, PostgreSQL, and Docker.

Includes dedicated portals for **Patients**, **Doctors**, and **Administrators** with role-based access control (RBAC), appointment scheduling, clinical profile management, analytics, and instant one-click demo credentials.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🔐 First-Login Password Change Security Flow](#-first-login-password-change-security-flow)
- [💻 Local Setup](#-local-setup)
  - [Prerequisites](#prerequisites)
  - [Step 1: Install Dependencies](#step-1-install-dependencies)
  - [Step 2: Environment Variables (.env)](#step-2-environment-variables-env)
  - [Step 3: Database Migrations & Seed](#step-3-database-migrations--seed)
  - [Step 4: Run Development Server](#step-4-run-development-server)
  - [Step 5: Access in Browser & Demo Logins](#step-5-access-in-browser--demo-logins)
- [🐳 DevOps & Docker Setup](#-devops--docker-setup)
  - [2-Stage Dockerfile Architecture](#2-stage-dockerfile-architecture)
  - [Run with Docker Compose (Single Command)](#run-with-docker-compose-single-command)
  - [Docker Useful Commands](#docker-useful-commands)
- [🗄️ Database Setup (PostgreSQL)](#️-database-setup-postgresql)
- [🚀 Production Deployment Guide](#-production-deployment-guide)
  - [Production Security Requirements](#production-security-requirements)
  - [Production Build & Start](#production-build--start)
  - [PM2 Process Management](#pm2-process-management)
  - [Nginx Reverse Proxy Config](#nginx-reverse-proxy-config)
  - [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
- [⚙️ Environment Variables (.env)](#️-environment-variables-env)
- [📜 NPM Scripts](#-npm-scripts)
- [🛠️ Troubleshooting & FAQs](#️-troubleshooting--faqs)

---

## ✨ Features

- **Public Directory & Search**: Search verified doctors by specialty, ratings, consultation fees, and real-time availability.
- **Patient Workspace**: 4-step interactive booking wizard, appointment timeline, history filters, prescription tracker, and emergency health profiles.
- **Doctor Workspace**: Clinical schedule manager, daily consultation ledger, inline appointment actions (Confirm, Complete, Cancel), and consultation fee settings.
- **Admin Control Center**: Clinic analytics dashboard, user account activation controls, and global staff/doctor provisioning.
- **First-Login Force Password Change**: Cryptographically secure temporary password generation for admin-created users, with server-side API blocking and forced `/change-password` redirection until an updated password is saved.
- **Security & RBAC**: JWT access tokens with server-side session binding, refresh token rotation, bcrypt password hashing, rate limiting, and HTTP security headers via Helmet.

---

## 🔐 First-Login Password Change Security Flow

When an Administrator creates a new user (Staff or Doctor):
1. **User Creation**: The backend generates a cryptographically secure random temporary password (satisfying uppercase, lowercase, digit, and symbol constraints via `crypto.randomInt`).
2. **Hashing**: Only the bcrypt hash is stored in PostgreSQL. Plaintext passwords are never saved to the database, never logged, and never placed into persistent browser storage.
3. **Flag Set**: Account is marked with `must_change_password = true` (defaults to `false` for existing users).
4. **First Login**: The user signs in using the temporary password.
   - The server authenticates credentials and returns:
     ```json
     {
       "authenticated": true,
       "mustChangePassword": true,
       "message": "Password change required"
     }
     ```
5. **Enforced Gatekeeping**:
   - **Frontend**: The user is immediately redirected to `/change-password` and blocked from navigating to `/dashboard`, `/appointments`, or other routes.
   - **Backend**: While `mustChangePassword === true`, all functional API endpoints (`/api/dashboard`, `/api/appointments`, `/api/profile`, etc.) are blocked with **HTTP 403 Forbidden** (`PASSWORD_CHANGE_REQUIRED`). Only `/auth/change-password`, `/auth/logout`, and `/auth/me` are permitted.
6. **Password Change**:
   - `POST /api/v1/auth/change-password` (or `/api/auth/change-password`) verifies current password, validates new password complexity (minimum 8 characters, letter + number, different from current), sets `must_change_password = false`, rotates tokens/sessions, and grants full application access.

---

## 💻 Local Setup

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

### Step 1: Install Dependencies

```bash
npm install
```

---

### Step 2: Environment Variables (.env)

Copy the default environment template:

```bash
cp .env.example .env

# Windows (Command Prompt):
copy .env.example .env

# Windows (PowerShell):
Copy-Item .env.example .env
```

The API requires PostgreSQL; it does not fall back to an in-memory database. Set `DATABASE_URL` to your local PostgreSQL database and set `JWT_ACCESS_SECRET` to a unique value generated with:

```bash
openssl rand -base64 48
```

For Docker Compose, generate `POSTGRES_PASSWORD` as well:

```bash
openssl rand -hex 32
```

Put each generated value into the matching `.env` variable. Keep local secrets separate from production secrets.

---

### Step 3: Run Development Server

Project root se dependencies install karne ke baad app start karein:

```bash
npm install
npm run dev
```

Seed initial demo data (doctors, patients, appointment records):

```bash
npm run dev -w @healthcare/api
```

Terminal me aapko yeh output dikhega:
```
[HealthCare+] Server running on http://0.0.0.0:3000
```

---

### Step 4: Access in Browser & Demo Logins

Browser open karein aur visit karein:
👉 **[http://localhost:3000](http://localhost:3000)**

Login page par aap **One-Click Demo Login** buttons se directly login kar sakte hain ya neeche diye credentials use kar sakte hain:

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@demo.test` | Local `SEED_PASSWORD` | Patient Portal & Booking Wizard |
| **Doctor** | `doctor@demo.test` | Local `SEED_PASSWORD` | Doctor Schedule & Consultations |
| **Admin** | `admin@demo.test` *(seeded local demo only)* | `Demo@12345` *(only when `SEED_PASSWORD=Demo@12345`)* | Dedicated Admin Application |

Create an administrator with your chosen credentials using the one-time bootstrap tool if you do not use the local demo seed. Never use seeded/demo credentials in production.

---

## 🐳 DevOps & Docker Setup

Agar aapko complete system (App + PostgreSQL Database) bina kisi manual dependency ke ek command me chalana hai, toh **Docker Compose** use karein.

### Run with Docker Compose (Single Command)

Is project me `Dockerfile` aur `docker-compose.yml` pre-configured hain.

```bash
# Copy .env.example to .env and set unique JWT_ACCESS_SECRET and POSTGRES_PASSWORD values.
# 1. Docker containers build and start karein
docker compose up --build
```

Background / Detached mode me chalane ke liye:
```bash
docker compose up -d --build
```

Isse PostgreSQL aur application containers chalenge. Database migrations run automatically; demo data is not seeded. Compose requires non-empty `JWT_ACCESS_SECRET` and `POSTGRES_PASSWORD` values in `.env`.

**App URL**: [http://localhost:3000](http://localhost:3000)

Containers stop karne ke liye:
```bash
docker compose down
```

Data reset karke fresh start karne ke liye:
```bash
docker compose down -v
docker compose up --build
```

---

### Build and Run with Dockerfile

Agar sirf app ka Docker image alag se build karna ho:

```bash
# 1. Docker image build karein
docker build -t healthcare-platform:latest .

# 2. Container run karein
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/healthcare" \
  -e JWT_ACCESS_SECRET="$(openssl rand -base64 48)" \
  --name healthcare-app healthcare-platform:latest
```

The container requires a reachable PostgreSQL database; configure `HOST`, `USER`, and `PASSWORD` for your environment.

---

## 🗄️ Database Setup (PostgreSQL)

### Zero-Config Fallback Mode
By default, agar `DATABASE_URL` connect nahi hoti, toh app automatically **built-in relational data engine** par switch ho jati hai jisme complete initial doctors, appointments, patients aur admin accounts pre-loaded rehte hain.

### Connecting Real PostgreSQL

Real PostgreSQL database use karne ke steps:

1. **Database create karein**:
   ```bash
   createdb healthcare
   # or via psql:
   psql -U postgres -c "CREATE DATABASE healthcare;"
   ```

2. **Schema aur Seed tables import karein**:
   ```bash
   npm run db:migrate
   ```
3. **Database Seed (Optional for development)**:
   ```bash
   npm run db:seed
   ```

---

## 🚀 Production Deployment Guide

### Production Build & Start

```bash
# 1. Build application assets
npm run build

# 2. Production server start karein
npm run start
```

---

### PM2 Process Management

For VPS deployments (Ubuntu, Debian, Amazon Linux):

```bash
# 1. Install PM2
npm install -g pm2

# 2. Build assets
npm run build

# 3. PM2 se start karein
pm2 start dist/server.cjs --name "healthcare-app" -i max

# 4. Logs check karein
pm2 logs healthcare-app

# 4. Save PM2 startup list
pm2 save
pm2 startup
```

---

### Nginx Reverse Proxy Config

Production server par SSL (HTTPS) aur port 80/443 ko internal port 3000 par route karne ke liye Nginx config:

```nginx
# /etc/nginx/sites-available/healthcare.conf

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

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

# Free SSL ke liye Certbot run karein:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### CI/CD Pipeline (GitHub Actions)

Example `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

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

| Variable | Description | Local default | Required |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Environment (`development` / `test` / `production`) | `development` | No |
| `PORT` | API and web server port | `4000` locally / `3000` in Docker | No |
| `DATABASE_URL` | PostgreSQL connection string | Local PostgreSQL URL | Yes |
| `DATABASE_SSL` | PostgreSQL TLS mode | `disable` locally | Production database setting |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | Generate a unique local value | Yes; 64+ high-entropy characters in production |
| `POSTGRES_PASSWORD` | PostgreSQL password for Docker Compose | None | Yes for Docker Compose |
| `CORS_ORIGINS` | Additional trusted browser origins | Empty | No |
| `COOKIE_SECURE` | Require HTTPS for authentication cookies | `false` | Must be `true` in production |
| `CLINIC_TIMEZONE` | Time zone used for clinic scheduling | `Asia/Kolkata` | No |
| `SEED_PASSWORD` | Password for local demo seed accounts | Unset | Only when running the demo seed |

---

## 📜 NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Dev server with hot reloading on port 3000 |
| `npm run build` | `vite build && esbuild ...` | Compiles client SPA & bundles production `dist/server.cjs` |
| `npm run start` | `node dist/server.cjs` | Runs the compiled production server |
| `npm run lint` | `tsc --noEmit` | Runs TypeScript type checking without errors |
| `npm run clean` | `rm -rf dist` | Cleans build artifacts |

---

## 🛠️ Troubleshooting & FAQs

#### Q1: Port 3000 already in use error: `EADDRINUSE: address already in use :::3000`
**Solution**: Port 3000 par koi aur process chal raha hai. Us process ko stop karein:
- **Windows**: `netstat -ano | findstr :3000` fir `taskkill /PID <PID> /F`
- **Mac/Linux**: `lsof -i :3000` fir `kill -9 <PID>`
- Ya `.env` file me `PORT=3001` change kar dein.

#### Q2: Login error "Invalid credentials"
**Solution**: Demo login credentials verify karein:
- Email: `patient@demo.test`
- Password: The value configured as `SEED_PASSWORD` before running `npm run db:seed`.
*(Make sure caps lock off hai)*

#### Q3: Database connection warning in terminal
The API requires a reachable PostgreSQL database. Confirm that PostgreSQL is running and that `DATABASE_URL` points to the correct database.

---

## 📄 License
This project is open-source and ready for commercial or educational use.# healthcare-platform
