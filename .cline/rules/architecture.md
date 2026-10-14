---
description: JudoSphere — Gesamtarchitektur (Vue FSD + Tauri Vertical Slices + Extractable Crates)
globs: src/**/*,src-tauri/**/*
alwaysApply: true
---

# JudoSphere — Architektur

JudoSphere ist eine Desktop-Anwendung auf Basis von **Tauri 2** (Rust-Backend) und **Vue 3** (Frontend-Renderer). Beide Seiten folgen eigenen, klar abgegrenzten Architekturprinzipien.

```
┌─────────────────────────────────────────────────────────────┐
│                        JudoSphere                           │
│                                                             │
│  src/                       src-tauri/                      │
│  Vue 3 Frontend             Rust Backend                    │
│  Feature-Sliced Design      Vertical Slices                 │
│  (FSD)                      (domain-orientiert)             │
│                                                             │
│  IPC-Grenze: Tauri invoke / emit                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Teil 1 — Vue-Frontend: Feature-Sliced Design (FSD)

> Gilt für alle Dateien unter `src/`.

Der Renderer ist nach **Feature-Sliced Design** aufgebaut. Code liegt unter `src/` in fünf Layern. Imports zeigen **nur nach unten** — niemals aus `shared` in Richtung `features`, `pages`, `widgets` oder `app`.

```
app → pages, widgets, features, shared
pages → features, widgets, shared
widgets → features, shared
features → shared  (+ Slices derselben Feature untereinander)
shared → nur intern
```

### Layer-Übersicht

```
src/
├── app/                   # Kompositions-Root
│   ├── providers/         # Router, Pinia, i18n, UI-Framework
│   └── main.ts
├── pages/                 # Route-Komponenten
│   └── <page>/
│       ├── ui/
│       └── index.ts
├── widgets/               # Standalone UI-Bausteine
│   └── <widget>/
│       ├── ui/
│       ├── i18n/
│       └── index.ts
├── features/              # Business-Funktionalität
│   └── <feature>/
│       └── <slice>/
│           ├── ui/
│           ├── model/
│           ├── api/
│           ├── i18n/
│           ├── service/   # (optional)
│           └── index.ts
└── shared/                # Austauschbare Abhängigkeiten
    ├── api/               # IPC-Bridge-Client, perspektivisch Supabase-Client
    ├── lib/
    │   ├── browser/
    │   ├── validation/
    │   ├── pinia/
    │   ├── i18n/
    │   └── logging/
    ├── ui/                # Feature-unabhängige Vue-Komponenten
    ├── model/
    ├── store/
    ├── types/
    └── errors/
```

### app vs. shared — Entscheidungshilfe

| Frage                                                                     | → `app` | → `shared` |
| ------------------------------------------------------------------------- | ------- | ---------- |
| Teil des Kompositions-Roots (App starten, Plugins registrieren)?          | Ja      | Nein       |
| Austauschbar/mockbar ohne Features umzuschreiben?                         | Nein    | Ja         |
| Features sollen SDK nicht direkt importieren?                             | —       | Ja         |
| Wechsel erfordert nur Änderungen in `main.ts` / `providers/`?             | Ja      | Nein       |

**Faustregeln:**
- Render-Framework und globale Provider → `app/providers/` — direkt konfigurieren, nicht abstrahieren.
- Vendor-/Infrastruktur-Clients (IPC-Bridge, perspektivisch Supabase) → `shared/api/` — hinter einer öffentlichen API kapseln.
- Dünne Framework-Helfer, die alle Features nutzen → `shared/lib/` (Setup bleibt in `app`).

**Split-Muster:** Eine Abhängigkeit kann beides sein — Instanz/Wiring in `app/providers/`, Nutzungs-API in `shared/lib/` (z. B. Plugin in `app`, Composable in `shared`).

### app

Kompositions-Root — Initialisierung, globale Provider und Framework-Wiring.

- Enthält alles, was die Renderer-Anwendung **zusammensetzt**; wird nicht weiter abstrahiert.
- Beispiele: Vue Router, Pinia-Instanz, UI-Framework, i18n-Plugin.
- Router importiert **ausschließlich** Page-Komponenten aus `@pages/*`.
- Router Guards dürfen `features`/`shared` für app-weite Orchestrierung nutzen (z. B. Auth-Check).

### pages

Route-Komponenten — eine Page pro Route. Der Router kennt nur `@pages/*`.

- Pages komponieren Features und optional Widgets; sie enthalten **keine** Business-Logik.
- Struktur: `ui/`, `index.ts`.
- Jede Datei in `ui/`: `<Name>.vue` + `<Name>.stories.ts` + `<Name>.e2e.spec.ts`.

### widgets

Selbstständige UI-Bausteine ohne Feature-Zugehörigkeit (z. B. `Navigation`). Kein Use-Case-Slice.

- Dürfen Features und `shared` nutzen; sollten nicht von Pages importiert werden, wenn sie global eingebunden sind.
- Struktur: `ui/`, optionales `i18n/`, `index.ts`.
- Jede Komponente in `ui/`: `<Name>.stories.ts` + `<Name>.e2e.spec.ts` (colocated, verpflichtend).

### features

Business-Funktionalität in **Slices** (Use Cases). Ein Slice = ein kohärenter Use Case.

```
features/<feature>/<slice>/
  ui/          # Vue-Komponenten für den Use Case
               # Pro Komponente: <Name>.vue + <Name>.stories.ts + <Name>.e2e.spec.ts
  model/       # Composables, State, Formularlogik
  i18n/        # keys.ts, de.ts, en.ts, index.ts
  api/         # Use-Case-API: kapselt shared/api für diesen Slice
  service/     # (optional) Orchestrierung innerhalb des Slice
  index.ts     # Öffentliche API — nur hier exportieren
```

**API-Layering:**
- Generischer Client-Zugriff liegt in `shared/api/` (IPC-Bridge, perspektivisch Supabase).
- Jeder Slice mit Datenbedarf bekommt ein eigenes `api/`-Verzeichnis mit use-case-spezifischen Funktionen, die `shared/api` aufrufen und Fehler/Monitoring auf Slice-Ebene behandeln.
- `model/` und `service/` importieren **nur** aus dem Slice-eigenen `api/`, **nie** direkt aus `@shared/api`.
- Cross-Slice-Logik innerhalb einer Feature → `features/<feature>/service/` oder `model/`.
- Slices importieren `shared`; sie dürfen andere Slices **derselben** Feature nutzen, **nicht** andere Features, Pages oder Widgets.

### shared

Abstraktion **austauschbarer** Abhängigkeiten. Keine Feature- oder Page-Logik.

| Segment                                              | Ebene      | Inhalt                                                         |
| ---------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| `api/`                                               | Low-level  | IPC-Bridge-Client, perspektivisch Supabase-Client              |
| `lib/browser/`, `lib/validation/`, `lib/pinia/`, `lib/i18n/` | Low-level  | Technische Helfer, Validierung, Store-Utilities    |
| `lib/logging/`                                       | High-level | Fehler-Logging via `logError` (`@shared/lib` Public API)       |
| `ui/`                                                | —          | Wiederverwendbare Vue-Komponenten ohne Feature-Zugehörigkeit   |
| `model/`, `store/`, `types/`, `errors/`              | —          | Geteilte Domain-Typen, Stores, Error-Klassen                   |

- `shared` importiert **keine** Features, Pages, Widgets oder `app`.
- Vue-Komponenten ohne Feature-Zugehörigkeit → `shared/ui/`, nicht in Features.
- Jede Komponente in `shared/ui/`: `<Name>.stories.ts` + `<Name>.e2e.spec.ts` (colocated, verpflichtend).

### Import-Aliases

`@app/*`, `@pages/*`, `@features/*`, `@widgets/*`, `@shared/*` — immer über Aliases importieren, **nie** relative Pfade über Layer-Grenzen hinweg.

### Checkliste für neue Dateien (Vue)

1. Richtiger Layer und Slice gewählt?
2. **app vs. shared:** Wiring oder austauschbare Abstraktion?
3. Import-Richtung eingehalten (nur nach unten)?
4. Öffentliche API via `index.ts` exportiert?
5. i18n-Keys im Slice unter `i18n/`, nicht in `shared`?
6. Wiederverwendbare UI ohne Feature-Zugehörigkeit → `shared/ui/`?
7. API-Zugriff auf `shared/api` → Slice-`api/` als Intermediär, **nicht** direkt in `model/`?
8. Neue/geänderte Datei in `ui/` → colocated `<Name>.stories.ts` und `<Name>.e2e.spec.ts` im selben Commit?

---

## Teil 2 — Tauri-Backend: Vertical Slices

> Gilt für alle Dateien unter `src-tauri/`.

Das Rust-Backend ist nach **Vertical Slices** strukturiert. Jede Domain/Fachlichkeit besitzt ihr eigenes Slice-Verzeichnis und ist vollständig selbstständig — von der Tauri-Command-Registrierung bis zur Datenbankabfrage.

### Grundprinzipien

- **Ein Slice = eine Fachdomäne** (z. B. `athlete`, `competition`, `belt`).
- Jeder Slice registriert seine Commands **selbst** und gibt sie als Modul nach außen.
- `lib.rs` ist der reine **Kompositions-Root** — er ruft nur die `register()`-Funktion jedes Slice auf.
- Slices kommunizieren **nicht direkt** miteinander; gemeinsam genutzte Typen liegen in `shared/`.
- Infrastruktur (DB-Connection, Fehlertypen) wird über `shared/` und `infrastructure/` bereitgestellt.

### Verzeichnisstruktur

```
src-tauri/src/
├── lib.rs                          # Kompositions-Root: registriert alle Slices
├── main.rs                         # Tauri-Einstiegspunkt
│
├── shared/                         # Geteilte Domain-Typen & Fehlerklassen
│   ├── mod.rs
│   ├── errors.rs                   # AppError, Result-Alias
│   └── types.rs                    # Geteilte Value Objects (z. B. BeltRank)
│
├── infrastructure/                 # Technische Querschnittsfunktionen
│   ├── mod.rs
│   ├── db.rs                       # DB-Connection-Pool (SQLite via tauri-plugin-sql)
│   └── logging.rs                  # Tracing-Setup
│
├── athlete/                        # Slice: Athleten-Verwaltung
│   ├── mod.rs                      # pub fn register(app: &mut Builder)
│   ├── commands.rs                 # #[tauri::command]-Funktionen
│   ├── service.rs                  # Business-Logik
│   ├── repository.rs               # DB-Zugriff (ruft infrastructure::db auf)
│   └── models.rs                   # Domain-Modelle & DTOs
│
├── competition/                    # Slice: Wettkampf-Verwaltung
│   ├── mod.rs
│   ├── commands.rs
│   ├── service.rs
│   ├── repository.rs
│   └── models.rs
│
├── belt/                           # Slice: Gürtel-/Prüfungsverwaltung
│   ├── mod.rs
│   ├── commands.rs
│   ├── service.rs
│   ├── repository.rs
│   └── models.rs
│
└── ...                             # Weitere Slices nach Bedarf
```

### Schichtenstruktur innerhalb eines Slice

```
commands.rs   →   service.rs   →   repository.rs   →   infrastructure::db
     ↑                ↑
  Tauri IPC      Business-Logik
```

- **`commands.rs`**: Nur `#[tauri::command]`-Funktionen — keine Logik, kein DB-Zugriff. Delegiert sofort an `service.rs`.
- **`service.rs`**: Business-Logik, Validierung, Orchestrierung. Ruft `repository.rs` auf.
- **`repository.rs`**: Ausschließlich DB-Queries. Importiert den Connection-Pool aus `infrastructure::db`.
- **`models.rs`**: Domain-Modelle, DTOs (mit `serde`), ggf. Mapping-Funktionen.
- **`mod.rs`**: Exportiert `pub fn register(builder: tauri::Builder<...>) -> tauri::Builder<...>` — registriert alle Commands des Slice.

### `lib.rs` — Kompositions-Root

```rust
// lib.rs
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // Infrastruktur
        .setup(|app| {
            infrastructure::db::setup(app)?;
            Ok(())
        })
        // Slices registrieren
        .invoke_handler(tauri::generate_handler![
            athlete::commands::...,
            competition::commands::...,
            belt::commands::...,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Regeln für Tauri-Slices

1. **Commands sind dünn**: Deserialisierung + Delegation an Service — fertig.
2. **Kein direkter Cross-Slice-Import**: Shared-Typen über `crate::shared::*`, niemals `crate::athlete::` aus `crate::competition::`.
3. **Fehler einheitlich**: Alle `repository.rs`-Funktionen geben `Result<T, crate::shared::errors::AppError>` zurück.
4. **Keine Business-Logik in `repository.rs`**: Nur SQL, kein Branching auf Domain-Ebene.
5. **Neue Fachdomäne = neuer Slice-Ordner** — nie in bestehende Slices mischen.

---

## Teil 3 — Extractable Crates (Monolith-first)

Bestimmte Infrastruktur-Pakete werden **vorerst als Module im Monolithen** implementiert, sind aber von Anfang an so geschnitten, dass sie später als **eigenständige Rust-Crates** in den GitHub Package Feed publiziert werden können.

### Kandidaten

| Modul (jetzt)              | Zukünftiger Crate-Name             | Inhalt                                                      |
| -------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `infrastructure/db.rs`     | `judosphere-sqlite`                | SQLite-Abstraktion, Connection-Pool, Migrations-Helper      |
| `shared/errors.rs`         | `judosphere-core`                  | Gemeinsame Error-Typen, Result-Alias, Value Objects         |
| *(perspektivisch)*         | `judosphere-supabase`              | Supabase-Client-Wrapper, Auth, Realtime                     |

### Regeln für extractable Module

1. **Keine Abhängigkeit auf Slice-Code**: `infrastructure/` und `shared/` importieren **keinen** Slice-Code (`athlete`, `competition`, …).
2. **Klare öffentliche API**: Alles, was ein zukünftiger Crate exportieren soll, steht bereits jetzt hinter einer sauberen `pub`-Schnittstelle in `mod.rs`.
3. **Feature-Flags vorbereiten**: Bedingte Kompilierung (`#[cfg(feature = "sqlite")]`, `#[cfg(feature = "supabase")]`) ist in den Modulen von Anfang an vorgesehen — auch wenn initial nur ein Backend aktiv ist.
4. **Keine `tauri`-Abhängigkeit in den extractable Modulen**: `infrastructure/db.rs` und `shared/` dürfen **nicht** direkt auf `tauri`-Typen zugreifen — die Tauri-Integration bleibt in `lib.rs` und den Slice-Commands.
5. **Versionierung**: Jedes extractable Modul bekommt seine eigene `CHANGELOG.md`-Section, damit der Schnitt zum eigenständigen Crate nachvollziehbar bleibt.

### Extraktions-Vorbereitung in `Cargo.toml`

```toml
# Später: Workspace mit separaten Crates
# [workspace]
# members = ["judosphere-app", "judosphere-sqlite", "judosphere-core"]

[features]
default = ["sqlite"]
sqlite  = ["dep:rusqlite"]      # oder tauri-plugin-sql
# supabase = ["dep:postgrest"]  # perspektivisch
```

### Migrationsplan (wenn bereit)

1. `src-tauri/src/infrastructure/` → eigenes Crate-Verzeichnis `crates/judosphere-sqlite/`
2. `src-tauri/src/shared/` → `crates/judosphere-core/`
3. `Cargo.toml` auf Workspace umstellen, Slices als Path-Dependency einbinden
4. Crate in GitHub Packages (privat) publishen: `cargo publish --registry github`

---

## Teil 4 — IPC-Grenze (Vue ↔ Tauri)

```
Vue shared/api/          Tauri commands.rs
  └── invoke(...)   ───►  #[tauri::command]
  └── listen(...)   ◄───  app.emit(...)
```

- **Vue-Seite**: Alle `invoke`- und `listen`-Aufrufe liegen ausschließlich in `src/shared/api/`. Features rufen nie direkt `window.__TAURI__` auf.
- **Tauri-Seite**: Command-Namen sind snake_case und in `commands.rs` des jeweiligen Slice definiert.
- **Payload-Typen**: Shared DTOs werden in `src/shared/types/` (TypeScript) und `src-tauri/src/shared/types.rs` (Rust) parallel geführt. Änderungen an einer Seite erfordern immer die Anpassung der anderen.
- **Fehler**: Commands geben `Result<T, String>` zurück (Tauri-kompatibel); Vue behandelt den Error-String in `shared/api/` und wandelt ihn in einen typisierten `AppError` um.

---

## Übersicht: Welche Regel gilt wo?

| Bereich                         | Architekturprinzip       | Datei-Regel                              |
| ------------------------------- | ------------------------ | ---------------------------------------- |
| `src/app/`                      | FSD — Kompositions-Root  | Kein Feature-Import, nur Wiring          |
| `src/pages/`                    | FSD — Route-Komponenten  | Keine Business-Logik                     |
| `src/widgets/`                  | FSD — UI-Bausteine       | Kein direkter Feature-Export             |
| `src/features/`                 | FSD — Use Cases          | Slices; kein Cross-Feature-Import        |
| `src/shared/`                   | FSD — Abstraktionen      | Kein Import aus höheren Layern           |
| `src-tauri/src/<slice>/`        | Vertical Slices          | Kein Cross-Slice-Import                  |
| `src-tauri/src/infrastructure/` | Extractable Crate        | Kein Tauri-Typ-Import, keine Slice-Deps  |
| `src-tauri/src/shared/`         | Extractable Crate        | Reine Domain-Typen & Fehlerklassen       |
