# PYQVerse Single-Project Vercel Deployment Guide

## 1. Single-Project Architecture Overview

PYQVerse deploys as a **unified single-project application** on [Vercel](https://vercel.com):

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Single Vercel Project & Domain                       │
│                   (e.g., https://pyqverse.vercel.app)                  │
├──────────────────────────────────┬─────────────────────────────────────┤
│      Vite React 19 Frontend      │     Vercel Python Function          │
│      Static SPA (dist/)          │     FastAPI Backend (api/index.py)  │
│      Served via Vercel Edge CDN  │     Python 3.12 Serverless Runtime  │
├──────────────────────────────────┴─────────────────────────────────────┤
│  Routing Architecture (vercel.json):                                   │
│  • /api/(.*)  ──► api/index.py (FastAPI Serverless Function)           │
│  • /(.*)      ──► /index.html  (Vite Client-Side Routing)              │
│  • Assets     ──► Static /dist/ assets served directly with zero proxy │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                    Managed External Cloud Services:
    ┌──────────────────────────────┼──────────────────────────────┐
    ▼                              ▼                              ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  MongoDB Atlas   │      │  Cloudflare R2   │      │  Google Sheets   │
│  Persistent DB   │      │  S3 Object Vault │      │  Catalog Bridge  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### Key Architectural Characteristics:
1. **One GitHub Repository**: All code (frontend, backend, tests, configs) resides in one repository.
2. **One Vercel Project**: Single Vercel deployment builds the static Vite bundle and provisions the Python serverless function.
3. **One Production Domain**: Frontend and backend share the exact same domain.
4. **Same-Origin API Requests**: Browser requests use relative paths (`/api/v1/health`, `/api/v1/exams`, etc.). No external backend host is required, eliminating cross-origin CORS latency in production.
5. **Zero Business Logic Duplication**: `api/index.py` directly imports the existing FastAPI app from `backend/app/main.py`.

---

## 2. Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- Requests to `/api/*` are rewritten to Vercel's Python runtime entry point `api/index.py`.
- All other paths are routed to `/index.html` to support React Router client-side navigation.
- Physical asset files in `dist/assets/*` are automatically matched and served directly by Vercel CDN.

---

## 3. Serverless Function Entry Point (`api/index.py`)

Vercel automatically detects `api/index.py` and deploys it using `@vercel/python` (Python 3.12).

- **Module Resolution**: Dynamically configures `sys.path` to include `backend/`, allowing `from app.main import app` to resolve without relocating or copying any existing code.
- **Path Normalization**: Bridges URL paths so that both `/api/v1/...` and stripped `/v1/...` paths match FastAPI route tables.
- **Serverless Database Safety**:
  - Reuses active MongoDB Atlas connections across warm function invocations (`maxPoolSize=20`).
  - Implements lazy reconnection if cold-started without lifespan triggers.
  - Enforces strict error gates in production mode (`APP_ENV=production` returns HTTP 503 rather than falling back to in-memory fixtures).

---

## 4. Environment Variables in Vercel

All variables are configured in **Vercel Project Settings → Environment Variables**.

### 4.1 Server-Side Secrets (Never exposed to client JS)
These variables are injected only into the Python serverless runtime (`api/index.py`):

| Variable | Sensitive | Description | Example Production Value |
|---|---|---|---|
| `APP_ENV` | No | Set to `production` to enforce MongoDB connection gates and disable demo persona logins. | `production` |
| `MONGODB_URI` | **YES** | MongoDB Atlas connection string. | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DATABASE` | No | Production database name. | `pyqverse_production` |
| `JWT_SECRET` | **YES** | 64-character hex secret for signing tokens (`openssl rand -hex 32`). | `0123456789abcdef...` |
| `DEMO_PERSONAS_ENABLED` | No | Enforces that demo switcher is disabled in production. | `false` |
| `GEMINI_API_KEY` | **YES** | Google AI Studio Gemini API key. | `AIzaSy...` |
| `GROQ_API_KEY` | **YES** | Groq API key for low-latency Llama fallback. | `gsk_...` |
| `CLOUDFLARE_ACCOUNT_ID`| **YES** | Cloudflare account ID. | `abc123...` |
| `R2_ACCESS_KEY_ID` | **YES** | Cloudflare R2 access key. | `123456...` |
| `R2_SECRET_ACCESS_KEY` | **YES** | Cloudflare R2 secret key. | `789xyz...` |
| `R2_BUCKET_NAME` | No | R2 bucket name. | `pyqverse-vault` |
| `GOOGLE_APPS_SCRIPT_URL` | No | Web App URL of the Google Sheets catalog bridge. | `https://script.google.com/macros/s/<ID>/exec` |
| `GOOGLE_APPS_SCRIPT_SHARED_SECRET` | **YES** | Shared bearer secret for sheet synchronization. | `super_strong_secret` |

### 4.2 Client-Side Variables (Bundled into Vite output)
Only non-sensitive variables:

| Variable | Sensitive | Description | Default in Single-Project Vercel |
|---|---|---|---|
| `VITE_API_URL` | No | Base API URL. | Leave **EMPTY** (defaults to same-origin `/api/v1`). |
| `VITE_APP_URL` | No | Public production domain. | `https://pyqverse.vercel.app` |

---

## 5. Local Development Workflows

Local development continues to work without modifying external services:

### Workflow A: Two-Process Dev Server (Fastest HMR)
```bash
# Terminal 1 — FastAPI Backend (Port 8000)
npm run dev:backend

# Terminal 2 — Vite Dev Server (Port 3000)
npm run dev:frontend
```
Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`.

### Workflow B: Unified Dev Server
```bash
# Terminal 1 — FastAPI Backend (Port 8000)
npm run dev:backend

# Terminal 2 — Express Reverse Proxy + Vite Middleware (Port 3000)
npm run dev
```

---

## 6. GitHub-to-Vercel Deployment Steps

1. **Push Repository to GitHub**:
   Ensure root files include `package.json`, `vercel.json`, `requirements.txt`, `api/index.py`, and `backend/`.
2. **Import Project on Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: `Vite` (auto-detected).
   - **Root Directory**: `./`.
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
   - **Install Command**: `npm install --legacy-peer-deps`.
4. **Add Environment Variables**:
   - Enter all variables from Section 4.1 in Vercel Settings → Environment Variables.
   - Leave `VITE_API_URL` empty to use same-origin `/api/v1`.
5. **Deploy**:
   - Click **Deploy**.
   - Vercel builds the static Vite bundle and compiles the Python serverless function `api/index.py`.
6. **Execute One-Time Database Migration**:
   ```bash
   curl -X POST "https://<your-project>.vercel.app/api/v1/admin/migrate-from-json?dry_run=false" \
     -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
   ```
7. **Verify Production Health**:
   ```bash
   curl -s "https://<your-project>.vercel.app/api/v1/health" | jq .
   ```

---

## 7. Pre-Deployment Automated Verification

```bash
# Full test suite (10 Frontend TypeScript tests + 34 Backend pytest tests):
npm test

# TypeScript typecheck:
npm run lint

# Production Vite build:
npm run build
```
