---
name: manage-local-first-sync
description: Enforces local-first priority, sync metadata isolation, conflict detection, and privacy rules for optional remote sync.
---

# Skill: Local-First & Remote Sync Manager

Use this skill when developing or auditing `**/sync/**`, Supabase/remote integrations, or host sync slices.

## Core rules

### 1. Privacy

- Send only required fields remotely.
- Never log full payloads with competitor/member PII.

### 2. Metadata isolation

- Keep sync metadata (`remote_id`, `last_synced_at`, …) separate from core domain models when possible.
- Sync execution must respect local authorization in the Tauri host.

### 3. Credentials

- Service-role keys stay in trusted host/server environments only — never in Vue/`@shared/api` browser-facing code.

### 4. Conflict handling & local-first

- Never overwrite local records without conflict detection.
- Persist locally first, then optionally queue cloud sync.
