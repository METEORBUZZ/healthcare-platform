# 🏥 HealthCare+ Platform

HealthCare+ is a full-stack healthcare appointment and patient-care management platform built with React, TypeScript, Express, and PostgreSQL.

Status: The shared package and API workspace are in place, and the web app is being finalized alongside Docker, CI, and documentation improvements.

A full-stack, enterprise-grade **Healthcare Appointment & Patient-Care Management Platform** built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **Express**, and **PostgreSQL**.

Includes dedicated portals for **Patients**, **Doctors**, and **Administrators** with role-based access control (RBAC), appointment scheduling, clinical profile management, analytics, and instant one-click demo credentials.

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

Aapki `.env` file aisi dikhegi:
```env
# Database Connection URL (Optional: Agar PostgreSQL na ho toh app automatically in-memory database me chalti hai)
DATABASE_URL="postgresql://postgres:password@localhost:5432/healthcare_db"

# JWT Secret Key
JWT_SECRET="healthcare_super_secure_jwt_secret_key_2025"

# Server Port (Default: 3000)
PORT=3000

# Base URL
APP_URL="http://localhost:3000"
```

> 💡 **Note**: Agar aapke paas abhi PostgreSQL installed nahi hai, tab bhi koi dikkat nahi hai! Project me pre-loaded mock database engine hai jo automatically initialize ho jata hai.

---

### Step 3: Run Development Server

Project root se dependencies install karne ke baad app start karein:

```bash
npm install
npm run dev
```

Ye root script backend aur frontend ko ek sath start karta hai. Agar sirf API chahiye ho, toh yeh command use karein:

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
| **Patient** | `patient@demo.com` | `demo123` | Patient Portal & Booking Wizard |
| **Doctor** | `doctor@demo.com` | `demo123` | Doctor Schedule & Consultations |
| **Admin** | `admin@demo.com` | `demo123` | Admin Analytics & User Ledger |

---

## 🐳 DevOps & Docker Setup

Agar aapko complete system (App + PostgreSQL Database) bina kisi manual dependency ke ek command me chalana hai, toh **Docker Compose** use karein.

### Run with Docker Compose (Single Command)

Is project me `Dockerfile` aur `docker-compose.yml` pre-configured hain.

```bash
# 1. Docker containers build and start karein
docker compose up --build
```

Background / Detached mode me chalane ke liye:
```bash
docker compose up -d --build
```

Isse 2 containers chalenge:
1. `healthcare_postgres`: PostgreSQL 16 Alpine database with persistent volume (`pgdata`) aur auto-imported `schema.sql` + `seed.sql`.
2. `healthcare_app`: Production Node.js 20 container listening on port `3000`.

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
  -e JWT_SECRET=my_secret_key_123 \
  --name healthcare-app healthcare-platform:latest
```

---

## 🗄️ Database Setup (PostgreSQL)

### Zero-Config Fallback Mode
By default, agar `DATABASE_URL` connect nahi hoti, toh app automatically **built-in relational data engine** par switch ho jati hai jisme complete initial doctors, appointments, patients aur admin accounts pre-loaded rehte hain.

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

### Production Build & Start

Production environment me client bundle compile karne aur optimized server run karne ke liye:

```bash
# 1. Client & Server bundle build karein (Output: /dist)
npm run build

# 2. Production server start karein
npm run start
```

---

### PM2 Process Management

VPS (AWS EC2, DigitalOcean, Hetzner, Ubuntu Server) par continuous background execution aur auto-restart ke liye **PM2** use karein:

```bash
# 1. PM2 globally install karein
npm install -g pm2

# 2. Production build create karein
npm run build

# 3. PM2 se start karein
pm2 start dist/server.cjs --name "healthcare-app" -i max

# 4. Logs check karein
pm2 logs healthcare-app

# 5. System reboot ke baad auto-start enable karein
pm2 startup
pm2 save
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
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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

Automatic testing, linting aur Docker image build ke liye `.github/workflows/deploy.yml` create karein:

```yaml
name: HealthCare+ CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

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

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `PORT` | Web server port | `3000` | Optional |
| `NODE_ENV` | Environment (`development` / `production`) | `development` | Optional |
| `JWT_SECRET` | Secret key for signing & verifying JWT tokens | `healthcare_super_secure_...` | Recommended |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | Optional (Auto-fallback to in-memory) |
| `GEMINI_API_KEY` | Google Gemini AI API key (Server-side) | `""` | Optional |
| `APP_URL` | Application canonical base URL | `http://localhost:3000` | Optional |

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
- Email: `patient@demo.com`
- Password: `demo123`
*(Make sure caps lock off hai)*

#### Q3: Database connection warning in terminal
Agar terminal me `Could not connect to PostgreSQL DATABASE_URL, using integrated robust relational engine` dikhe, toh ghabraye nahi! App bina PostgreSQL ke bhi smoothly chalegi using built-in memory store.

---

## 📄 License
This project is open-source and ready for commercial or educational use.# healthcare-platform
