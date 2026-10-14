# Setup & Installation Guide

> Part of the [JudoSphere `.cline/rules/` documentation](README.md)

---

## Overview

This guide documents the installation and setup procedures for JudoSphere development, with a focus on **Code-Server on Unraid** (primary scenario) and **Local Desktop Development** (fallback).

**See:** [`INSTALL.md`](../../INSTALL.md) (comprehensive, in repo root)

---

## Quick Links

### For Code-Server on Unraid (Primary)

**Process Overview:**

1. Docker Container with Node.js, Rust, SQLite3
2. SSH Tunnel to Unraid (port forwarding)
3. Code-Server inside container (port 8443)
4. Backend HTTP API (port 3001)
5. Frontend Vite Dev Server (port 5173)
6. SQLite auto-migrations on startup
7. Validation via tests or manual

**Key Sections in INSTALL.md:**

- [Step 1-10: Code-Server Setup](#scenario-a-code-server-on-unraid) (full walkthrough)
- [Troubleshooting](#step-10-troubleshooting) (port conflicts, SSL, HMR issues)
- [Database Migrations](#sqlite-setup--migrations)

### For Local Desktop Development

**Process Overview:**

1. Clone repo locally
2. `npm install` + `cargo build`
3. `npm run tauri dev` (desktop app)
4. Tests via `npm run test:e2e:smoke`

**Key Section in INSTALL.md:**

- [Scenario B: Local Development](#scenario-b-local-development) (quick version)

---

## SQLite & Migrations

**Key Points:**

- Migrations in `src-tauri/migrations/` (numbered: `001-*.sql`, `002-*.sql`, etc.)
- Auto-run on backend startup
- Tracked in `_migrations` table
- WAL mode for concurrency
- Foreign keys enabled

**See:** [`SQLite Setup & Migrations`](../../INSTALL.md#sqlite-setup--migrations) in INSTALL.md

---

## Tauri Backend in HTTP Mode

**Only for Code-Server** (local uses IPC):

- Frontend via HTTP `fetch()` to `http://localhost:3001`
- Backend: Actix/Axum REST API
- CORS enabled for `localhost:5173`
- JSON requests/responses

**API Endpoints:**

- `POST /api/athlete`, `GET /api/athletes`, etc.
- Error responses: JSON with status code + details

**See:** [`Tauri Backend in HTTP Mode`](../../INSTALL.md#tauri-backend-in-http-mode-deep-dive) in INSTALL.md

---

## Validation Methods

### Option A: Automated Tests (Recommended)

```bash
npm run test:e2e:smoke
```

- ~30 seconds
- If ✅ passes → Setup complete
- If ❌ fails → Check troubleshooting guide

### Option B: Manual Validation

1. Backend check: `curl http://localhost:3001/api/athletes`
2. Frontend: Open `http://localhost:5173` in browser
3. Create athlete manually (UI)
4. Verify in database: `sqlite3 data.db "SELECT name FROM athletes;"`

**See:** [`Step 9: Validate Installation`](../../INSTALL.md#step-9-validate-installation) in INSTALL.md

---

## Quick Commands

### Code-Server

```bash
npm run tauri dev:backend      # Backend HTTP on 3001
npm run dev:frontend           # Frontend Vite on 5173
npm run test:e2e:smoke         # Smoke tests
npm run lint:fix && npm run type:check
```

### Local

```bash
npm run tauri dev              # Desktop app + Vite combined
npm run test:e2e:smoke
npm run tauri build            # Production build
```

---

## Common Issues

| Issue                        | Solution                                   |
| ---------------------------- | ------------------------------------------ |
| Port already in use          | `lsof -i :PORT` then `kill -9 PID`         |
| SQLite "database locked"     | Stop other backend processes               |
| Vite HMR not working         | Check SSH tunnel is active                 |
| Tauri backend fails          | `cargo check` for Rust errors              |
| Code-Server connection drops | Restart SSH tunnel, check timeout settings |

**See:** [`Step 10: Troubleshooting`](../../INSTALL.md#step-10-troubleshooting) in INSTALL.md for full details

---

## Next Steps

- ✅ Installation complete? → Browse [`.cline/rules/README.md`](README.md) for other guidelines
- Start coding? → Read [`.cline/rules/vue-frontend.md`](vue-frontend.md)
- Backend development? → Read [`.cline/rules/architecture-backend.md`](architecture-backend.md)
- Security concerns? → Read [`SECURITY.md`](../../SECURITY.md)

---

**See full installation guide:** [`INSTALL.md`](../../INSTALL.md)
