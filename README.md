# JudoSphere

Offline-first software for **smaller judo competitions** and **small clubs**.

## What is this?

JudoSphere is the application used to organize and score a competition locally. It starts on one machine as the **host** and serves the application on the local network. Judges and organizers open the host-provided website in a browser — no separate install required.

**Target users:** organizers and scoring judges  
**Out of scope:** spectators and participants

## Operating model

1. The main application runs on the host machine (Tauri desktop app).
2. That host acts as a local server.
3. Other organizer devices access the same application through a browser.
4. The product is **offline-first** and designed to work without a cloud dependency.

## Architecture

| Area              | Technology         | Organization                              |
| ----------------- | ------------------ | ----------------------------------------- |
| Frontend          | Vue 3 + TypeScript | Feature-Sliced Design (`src/`)            |
| Desktop / backend | Tauri 2 + Rust     | Vertical slices (`src-tauri/src/slices/`) |
| UI foundation     | Tailwind planned   | Design system in `src/shared/ui`          |

Keep Vue and Tauri separated: presentation in Vue, domain and host logic in Rust slices.

External runtime dependencies are accessed only through facades in `src/shared/api`.

```
src/                     # Vue (FSD)
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
    ui/                  # future design system
    api/                 # dependency facades (Vue, Tauri, …)
    lib/
    config/

src-tauri/               # Tauri
  src/
    slices/              # vertical slices (e.g. greet; later competition, scoring, network)
    lib.rs               # wiring only
```

## Development

Requirements: Node.js, Rust, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri dev
```

Other scripts:

```bash
npm run dev       # Vite / frontend only
npm run build     # frontend build
npm run tauri     # Tauri CLI
```

## IDE

- VS Code / Cursor + Vue - Official + Tauri + rust-analyzer
- Project rules live under `.cursor/rules/`
