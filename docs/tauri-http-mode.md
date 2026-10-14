# Tauri Backend in HTTP Mode

Technical guide for Code-Server remote development on Unraid.

---

## Problem

- **Local:** Tauri IPC (native window)
- **Code-Server:** Headless (no window) → use HTTP server instead

---

## Architecture

```
Browser (localhost:5173)
  ↓ HTTP fetch()
Rust HTTP Server (localhost:3001)
  ↓ SQL
SQLite
```

---

## API Endpoints

```
POST   /api/athlete            # Create
GET    /api/athletes           # List
PUT    /api/athlete/:id        # Update
DELETE /api/athlete/:id        # Delete

POST   /api/competition
GET    /api/competitions

POST   /api/belt/promote       # Promote athlete
```

---

## Request/Response

### Create Athlete

```bash
POST /api/athlete
Content-Type: application/json

{
  "name": "Max Mustermann",
  "dob": "2010-05-15",
  "belt_rank": "white"
}
```

### Response (201 Created)

```json
{
  "id": "ath_123",
  "name": "Max Mustermann",
  "dob": "2010-05-15",
  "belt_rank": "white",
  "created_at": "2026-10-14T12:34:56Z"
}
```

### Error Response (400)

```json
{
  "error": "Validation failed",
  "status": 400,
  "details": {
    "name": "Required",
    "dob": "Invalid format"
  }
}
```

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | GET, PUT success |
| 201 | POST created |
| 204 | DELETE success |
| 400 | Validation error |
| 404 | Not found |
| 500 | Server error |

---

## CORS Headers

Backend must return:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Browsers auto-send OPTIONS preflight request before POST/PUT/DELETE.

---

## Frontend (Vue)

```typescript
// src/shared/api/client.ts

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function createAthlete(data) {
  const res = await fetch(`${API}/api/athlete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error)
  }

  return res.json()
}
```

### .env.development

```
VITE_API_URL=http://localhost:3001
```

---

## Backend (Rust)

### Axum Example

```rust
use axum::{routing::{get, post}, Json, Router, http::StatusCode};

async fn start_server() {
    let app = Router::new()
        .route("/api/athlete", post(create_athlete))
        .route("/api/athletes", get(list_athletes));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001")
        .await.unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn create_athlete(Json(input): Json<CreateAthleteInput>) 
    -> (StatusCode, Json<Athlete>) {
    // Save to DB
    (StatusCode::CREATED, Json(athlete))
}
```

---

## Testing

### curl

```bash
curl -X POST http://localhost:3001/api/athlete \
  -H "Content-Type: application/json" \
  -d '{"name":"Max","dob":"2010-05-15","belt_rank":"white"}'

curl http://localhost:3001/api/athletes
```

### Playwright

```typescript
test('Create athlete', async ({ page }) => {
  const res = await page.request.post('http://localhost:3001/api/athlete', {
    data: { name: 'Test', dob: '2010-05-15', belt_rank: 'white' }
  })
  expect(res.status()).toBe(201)
})
```

---

## Debugging

### Enable Logs

```bash
RUST_LOG=debug npm run tauri dev:backend
```

### Browser DevTools

F12 → Network: Check requests, responses, CORS headers

### Common Issues

| Issue | Fix |
|-------|-----|
| CORS error | Backend missing `Access-Control-Allow-Origin` header |
| 500 error | Check `RUST_LOG=debug` logs |
| Request hangs | Check backend running: `curl http://localhost:3001/api/athletes` |
| Preflight fails | Backend must respond 200 to OPTIONS |

---

**See:** [INSTALL.md](../INSTALL.md) for full setup
