# 🚀 Installation & Setup Guide

This guide covers two development scenarios:

1. **Code-Server on Unraid** (Primary — recommended for remote development)
2. **Local Development** (Fallback — for native desktop development)

---

## 📋 Quick Start

**Where do you want to develop?**

- **→ Code-Server (Unraid):** Jump to [Scenario A](#scenario-a-code-server-on-unraid) (Remote development on NAS)
- **→ Local Machine:** Jump to [Scenario B](#scenario-b-local-development) (Native desktop app development)

---

## Scenario A: Code-Server on Unraid (PRIMARY)

### Overview

```
┌─────────────────────────────────────┐
│     Unraid NAS (Linux)              │
│  ┌──────────────────────────────┐   │
│  │  Docker Container            │   │
│  │  ├─ Node.js 18+             │   │
│  │  ├─ Rust + Cargo            │   │
│  │  ├─ SQLite3                 │   │
│  │  ├─ Git                     │   │
│  │  └─ Code-Server (8443)      │   │
│  │     ├─ Vite Dev (5173)      │   │
│  │     └─ Tauri Backend HTTP   │   │
│  │        (Port 3001)          │   │
│  └──────────────────────────────┘   │
│  └─ Volume: /data/judosphere/       │
│     ├─ repo/                        │
│     └─ data.db (SQLite)             │
└─────────────────────────────────────┘
         ↓ SSH Tunnel (local machine)
    Browser: http://localhost:8443
```

### Step 1: Prerequisites

Ensure your Unraid system has:

- **Docker** installed and running
- **SSH access** enabled (for port tunneling to local machine)
- At least **10 GB free space** in data volume (`/mnt/user/appdata/` or similar)

### Step 2: Docker Container Setup

Create a Docker container with Node.js, Rust, and SQLite3.

**Container Requirements:**

- Base Image: `ubuntu:22.04` or `debian:bookworm`
- Node.js: 18+ (LTS recommended)
- Rust: Latest stable (via rustup)
- Cargo: Included with Rust
- SQLite3: Command-line tool
- Git: Version control
- Code-Server: Latest (installed inside container)

**Volumes:**

- `/data/judosphere/` (on host) → `/home/judosphere/` (in container)
  - Stores repo + SQLite database
  - Persists across container restarts

**Ports:**

- `8443:8443` — Code-Server UI
- `5173:5173` — Vite Frontend Dev Server (optional, if exposing)
- `3001:3001` — Tauri Backend HTTP API (optional, if exposing)

**Environment Variables:**

```bash
PASSWORD=<your-secure-password>  # Code-Server password
SUDO_PASSWORD=<same-password>    # For sudo commands in Code-Server terminal
NODE_ENV=development
RUST_LOG=debug
```

### Step 3: SSH Tunnel Setup

On your **local machine**, create an SSH tunnel to Unraid:

```bash
ssh -L 8443:127.0.0.1:8443 \
    -L 5173:127.0.0.1:5173 \
    -L 3001:127.0.0.1:3001 \
    <unraid-user>@<unraid-ip>
```

This forwards:

- `http://localhost:8443` → Code-Server on Unraid
- `http://localhost:5173` → Vite Frontend (optional)
- `http://localhost:3001` → Tauri Backend API (optional)

**Note:** Keep this SSH tunnel open in a terminal while developing.

Alternatively, use **SSH Config** for persistence:

```bash
# ~/.ssh/config
Host judosphere-unraid
    HostName <unraid-ip>
    User <unraid-user>
    LocalForward 8443 127.0.0.1:8443
    LocalForward 5173 127.0.0.1:5173
    LocalForward 3001 127.0.0.1:3001
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Then connect: `ssh judosphere-unraid`

### Step 4: Inside Container — Clone Repository

1. **Connect to Code-Server:**
   - Open browser: `http://localhost:8443`
   - Enter password (set in Docker environment)

2. **Open Integrated Terminal** (Ctrl+`):

   ```bash
   cd /home/judosphere
   git clone https://github.com/AK2083/JudoSphere.git
   cd JudoSphere
   ```

3. **Verify Git Setup:**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### Step 5: Install Dependencies

In Code-Server terminal:

```bash
# Frontend dependencies
npm install

# Rust backend dependencies (compiles on first build)
cargo build --release
```

This will take **5–10 minutes** (first-time compilation).

**Monitor progress:**

- `npm install` should show `added X packages` at the end
- `cargo build` should show `Finished release` when complete

### Step 6: SQLite & Migrations Setup

#### 6a. Database Location

SQLite database will be stored at:

```
/data/judosphere/data.db
```

Inside container: `/home/judosphere/data.db`

#### 6b. Migrations System

Migrations are SQL files in `src-tauri/migrations/`:

```
migrations/
├── 001-init.sql           # CREATE TABLE athletes, competitions, belts
├── 002-add-indexes.sql    # CREATE INDEX on belt_rank, competition_id
└── 003-add-audit-logs.sql # CREATE TABLE audit_logs
```

**Each migration file:**

- Numbered sequentially: `001-`, `002-`, `003-`, etc.
- Naming: `NNN-description.sql`
- Contains complete SQL (no partial statements)
- Is idempotent (can run multiple times without errors)

#### 6c. Run Migrations on Startup

Migrations **automatically run** when Tauri backend starts:

```bash
npm run tauri dev:backend
```

The backend will:

1. Check `_migrations` table (tracks which migrations ran)
2. Run any pending migrations from `migrations/` folder
3. Log migration progress
4. Start HTTP API on port 3001

**Verify migrations ran:**

```bash
# Inside Code-Server terminal
sqlite3 /home/judosphere/data.db ".tables"
# Should show: athletes, competitions, belts, …
```

### Step 7: Tauri Backend (HTTP Mode)

#### 7a. Why HTTP Mode?

In Code-Server, there's **no desktop window** like in local development. Instead:

- **Local (Desktop):** Tauri IPC (JSON-RPC over channels)
- **Code-Server:** HTTP API (REST endpoints on port 3001)

Frontend communicates via HTTP requests, not Tauri `invoke()`.

#### 7b. Start Backend

In Code-Server terminal:

```bash
npm run tauri dev:backend
# or
cargo run --manifest-path src-tauri/Cargo.toml
```

**Expected output:**

```
Starting Tauri backend (HTTP mode)…
Migrations: Running 001-init.sql … OK
Migrations: Running 002-add-indexes.sql … OK
Backend listening on http://0.0.0.0:3001
CORS enabled for http://localhost:5173
Ready for requests
```

**Leave this terminal running.** Open a new terminal for next step.

#### 7c. Backend API Endpoints

Once running, backend exposes:

```
POST   http://localhost:3001/api/athlete
GET    http://localhost:3001/api/athletes
PUT    http://localhost:3001/api/athlete/:id
DELETE http://localhost:3001/api/athlete/:id

POST   http://localhost:3001/api/competition
GET    http://localhost:3001/api/competitions
…
```

**CORS headers:**

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Step 8: Vite Frontend Dev Server

In a **new Code-Server terminal**:

```bash
npm run dev:frontend
# or
npm run dev
```

**Expected output:**

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://127.0.0.1:5173/
➜  press h + enter to show help
```

**Note:** Vite runs inside Code-Server. To access from local browser, it's already forwarded via SSH tunnel to `http://localhost:5173`.

#### Hot Module Reload (HMR)

Changes to Vue files automatically reload in browser:

1. Edit `src/features/athlete/ui/AthleteCard.vue`
2. Save file
3. Browser auto-refreshes in 1–2 seconds

If HMR doesn't work, check SSH tunnel is active.

### Step 9: Validate Installation

#### Option A: Run Tests (Recommended)

In a **new Code-Server terminal**:

```bash
# Smoke tests (fast, ~30 seconds)
npm run test:e2e:smoke
```

**Expected output:**

```
✓ AthleteCard renders on desktop viewport
✓ AthleteForm submits creates new athlete via POST /api/athlete
✓ AthletePage loads athlete list from GET /api/athletes
… (more tests)

✓ 15 passed in 28.4s
```

**If tests pass:** ✅ Installation complete!

**If tests fail:**

- Check Backend running on port 3001: `curl http://localhost:3001/api/athletes`
- Check Frontend running on port 5173: Browser shows JudoSphere UI
- Check SQLite migrations ran: `sqlite3 data.db ".tables"`

#### Option B: Manual Validation

If you prefer to validate manually:

**Step 1: Check Backend is Running**

```bash
# From local machine terminal
curl http://localhost:3001/api/athletes
# Expected: [] (empty array) or error 400 (if auth required)
```

**Step 2: Open Frontend in Browser**

- Navigate to: `http://localhost:5173`
- Should see JudoSphere app UI
- Language: German or English (depends on browser settings)

**Step 3: Create Athlete Manually**

1. Click "Neue Athletin" (New Athlete)
2. Fill form:
   - Name: "Test Athlete"
   - DOB: "2010-05-15"
   - Belt: "White"
   - Contact: (optional)
3. Click "Speichern" (Save)
4. Verify in browser Network tab (DevTools F12):
   - Request: `POST http://localhost:3001/api/athlete`
   - Response: `200 OK` with athlete data

**Step 4: Verify Database**

```bash
# From Code-Server terminal
sqlite3 data.db "SELECT name, belt_rank FROM athletes;"
# Expected:
# Test Athlete|white
```

✅ **If all 4 steps succeed:** Installation complete!

### Step 10: Troubleshooting

#### Port Already in Use

```bash
# Check which port is in use
lsof -i :5173  # Vite
lsof -i :3001  # Tauri Backend
lsof -i :8443  # Code-Server

# Kill process (if needed)
kill -9 <PID>
```

#### SQLite: "database locked"

- Only one `npm run tauri dev:backend` should run
- Close other instances if multiple started
- SQLite WAL mode (Journaling) should handle concurrent reads

#### Vite HMR Not Working

- Check SSH tunnel is active: `ssh judosphere-unraid`
- Verify Vite running: `curl http://localhost:5173`
- Check browser Network tab (F12) for WebSocket errors

#### Tauri Backend Fails to Start

```bash
# Check Rust compilation errors
cargo check --manifest-path src-tauri/Cargo.toml

# Check tauri.conf.json paths are correct
cat src-tauri/tauri.conf.json | grep -A5 '"devPath"'

# Check SQLite database exists
ls -lh data.db
```

#### Code-Server Connection Drops

- SSH tunnel disconnected (restart `ssh judosphere-unraid`)
- Network timeout after 60 seconds? Increase in SSH config:
  ```bash
  ServerAliveInterval 30
  ServerAliveCountMax 5
  ```

#### Out of Memory or Slow Performance

- Cargo builds can be CPU/RAM intensive
- Close unnecessary Code-Server extensions
- Run builds at off-peak times or use `cargo build --release -j 2` (limit parallelism)

---

## Scenario B: Local Development

### Overview (Quick Version)

For native desktop application development on your local machine:

```
Local Machine
├─ Node.js 18+
├─ Rust + Cargo
├─ SQLite3
├─ Git
├─ Code-Editor (VS Code, Sublime, etc.)
└─ Tauri (builds desktop app)
   ├─ Vite Frontend Dev Server (5173)
   ├─ Tauri IPC Backend
   └─ Desktop Window (Tauri App Window)
```

### Prerequisites

- **macOS:** Xcode Command Line Tools + Rust + Node.js
- **Windows:** Visual Studio Build Tools + Rust + Node.js
- **Linux:** Build essentials + Rust + Node.js

### Installation Steps

1. **Clone repository:**

   ```bash
   git clone https://github.com/AK2083/JudoSphere.git
   cd JudoSphere
   ```

2. **Install dependencies:**

   ```bash
   npm install
   cargo build --release
   ```

3. **Run migrations:**

   ```bash
   # Migrations run automatically on first app start
   npm run tauri dev
   ```

4. **Validate:**
   - Tauri window opens (desktop app)
   - Athlete list visible
   - Create athlete → appears in list + database

### Differences from Code-Server

| Aspect                | Code-Server                | Local                                 |
| --------------------- | -------------------------- | ------------------------------------- |
| **App Communication** | HTTP API (port 3001)       | Tauri IPC                             |
| **Frontend**          | Vite DevServer (5173)      | Vite DevServer embedded in Tauri      |
| **Desktop Window**    | None (web-based)           | Native window (Windows/macOS/Linux)   |
| **Hot Reload**        | Browser F5 or HMR          | Automatic (both frontend + backend)   |
| **Database Location** | `/data/judosphere/data.db` | `~/.judosphere/data.db` (OS-specific) |

### Troubleshooting

- Tauri window won't open? Check Rust compilation: `cargo check`
- IPC errors? Ensure backend running: logs in Tauri dev console

---

## SQLite Setup & Migrations

### Database Schema Overview

**Tables (created by migrations):**

- `athletes` — Athlete profiles (name, DOB, belt rank, contact)
- `competitions` — Tournament records (date, location, results)
- `belts` — Belt progression history (test date, result, feedback)
- `audit_logs` — Compliance logging (user actions, data changes)

### Migrations Workflow

**When you add a new table:**

1. Create file: `src-tauri/migrations/NNN-description.sql`

   ```sql
   CREATE TABLE IF NOT EXISTS new_table (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. Commit to git: `git add migrations/NNN-*.sql`

3. Next app start: Tauri backend auto-runs migration

4. Verify: `sqlite3 data.db ".tables"`

### Backup Strategy

Database is located at:

- **Code-Server:** `/data/judosphere/data.db`
- **Local:** `~/.judosphere/data.db` (or `%APPDATA%\judosphere` on Windows)

**Manual backup:**

```bash
cp data.db data.db.backup.$(date +%Y%m%d_%H%M%S)
```

**Automated backups (planned):**

- Daily scheduled backup to `/data/judosphere/backups/`
- Keep last 7 days
- (Implement via cron or Tauri scheduler, TBD)

### WAL Mode (Write-Ahead Logging)

SQLite uses WAL mode by default:

- Faster writes
- Allows concurrent reads while writing
- Creates additional files: `data.db-shm`, `data.db-wal`
- **Do not delete these files!**

### Foreign Keys

All tables have foreign key constraints enabled:

```sql
PRAGMA foreign_keys = ON;
```

This prevents orphaned data (e.g. deleting athlete while competition references them).

---

## Tauri Backend in HTTP Mode (Deep Dive)

### Architecture

**Code-Server (HTTP Mode):**

```
Frontend (Vue)
    ↓ HTTP fetch()
Backend (Rust Actix/Axum server)
    ↓ SQL queries
SQLite Database
```

**Local (IPC Mode):**

```
Frontend (Vue)
    ↓ Tauri invoke()
Tauri IPC Bridge
    ↓ async channel
Backend (Rust)
    ↓ SQL queries
SQLite Database
```

### API Endpoints

All endpoints return JSON:

```
POST /api/athlete
  Body: { name, dob, belt_rank, contact }
  Response: { id, name, dob, belt_rank, created_at }

GET /api/athletes
  Query: ?belt=white&sort=name&limit=50
  Response: [{ id, name, belt_rank }, …]

PUT /api/athlete/:id
  Body: { name, belt_rank, … }
  Response: { id, name, … }

DELETE /api/athlete/:id
  Response: { success: true }

POST /api/competition
  Body: { name, date, location, … }
  Response: { id, name, … }

GET /api/competitions
  Response: […]

POST /api/belt/promote
  Body: { athlete_id, new_rank, test_date, feedback }
  Response: { athlete_id, new_rank, … }
```

### Error Handling

All errors return JSON with status code:

```json
{
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "dob": "Invalid date format (expected YYYY-MM-DD)"
  },
  "status": 400
}
```

### CORS Configuration

Frontend at `http://localhost:5173` can request Backend at `http://localhost:3001`:

```
Access-Control-Allow-Origin: http://localhost:5173, http://127.0.0.1:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

### Production vs. Development

**Development (Code-Server):**

- Backend HTTP on `localhost:3001`
- CORS allows `localhost:5173`
- Debug logging enabled
- SQLite file-based

**Production (Desktop):**

- Tauri IPC (no HTTP)
- App packaged as `.exe`, `.dmg`, `.AppImage`
- SQLite embedded in app data directory
- Error handling strict, logging minimal

---

## Next Steps After Setup

1. ✅ **Installation Complete** — Tests pass or manual validation done

2. **Explore Codebase:**
   - Read `.cline/rules/README.md` for architecture overview
   - Browse `src/features/` for Vue components
   - Browse `src-tauri/src/` for Rust backend

3. **Create Your First Feature:**
   - Follow `.cline/rules/vue-frontend.md` guidelines
   - Create Storybook story
   - Create Playwright E2E test
   - Commit and push to feature branch

4. **Learn Development Workflow:**
   - See `.cline/rules/project-overview.md` for commit conventions
   - See `.cline/rules/architecture.md` for system design

5. **Setup Security & Compliance:**
   - Review `SECURITY.md` for responsible disclosure
   - Review `.cline/rules/legal.md` for GDPR/compliance

---

## Support & Questions

- **Setup Issues?** Check Troubleshooting sections above
- **Architecture Questions?** See `.cline/rules/` documentation
- **Security/Legal?** See `SECURITY.md` and `.cline/rules/legal.md`
- **Code Guidelines?** See `.cline/rules/vue-frontend.md` and `.cline/rules/architecture-backend.md`

---

## Quick Reference

### Key Commands

**Code-Server:**

```bash
# Backend (HTTP on 3001)
npm run tauri dev:backend

# Frontend (Vite on 5173)
npm run dev:frontend

# Tests (E2E smoke tests)
npm run test:e2e:smoke

# Linting & type checking
npm run lint:fix
npm run type:check
```

**Local:**

```bash
# Desktop app (Tauri + Vite combined)
npm run tauri dev

# Tests
npm run test:e2e:smoke

# Build release
npm run tauri build
```

### Ports

- **8443:** Code-Server UI
- **5173:** Vite Frontend Dev Server
- **3001:** Tauri Backend HTTP API (Code-Server only)

### Database Files

- Code-Server: `/data/judosphere/data.db` (+ `.db-shm`, `.db-wal`)
- Local: `~/.judosphere/data.db`

### Logs

- Code-Server terminal: Backend logs (Rust `tracing`)
- Browser Console (F12): Frontend logs (Vue)
- Browser Network (F12): HTTP requests to backend

---

**Last Updated:** 2026-10-14  
**Primary Scenario:** Code-Server on Unraid  
**Fallback:** Local Desktop Development
