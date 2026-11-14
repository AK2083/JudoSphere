---
description: SOLID design principles for Vue/FSD and Tauri host slices — required for all feature and host work
alwaysApply: true
---

# SOLID principles

Implement features and host logic following **SOLID**. Prefer small, focused units over large catch-all modules. SOLID complements FSD (frontend) and vertical slices (Tauri host) — do not invent a parallel architecture.

## S — Single Responsibility

- One module / composable / command / slice does **one** job.
- Vue: UI in `ui/`, state and use-case flow in `model/`, host access in slice `api/` — do not mix persistence, auth, and presentation in one file.
- Rust: thin `commands.rs` adapters; domain/persistence stay separate as the slice grows.
- Split when a type or function needs unrelated reasons to change.

## O — Open/Closed

- Extend behavior with new slices, strategies, or clear extension points — avoid editing unrelated core paths for every new case.
- Prefer adding a new settings key, permission, or host command over growing a god-switch `match` / `if` chain in shared code.
- Shared UI primitives stay generic; feature-specific behavior lives in features.

## L — Liskov Substitution

- Implementations of the same contract (facade, trait, interface) must be safely interchangeable without surprising callers.
- Mocks and real `@shared/api` / host facades honor the same signatures and error semantics.
- Do not weaken preconditions or strengthen error types in “compatible” replacements.

## I — Interface Segregation

- Export narrow public APIs via barrels (`index.ts` / `mod.rs`) — callers should not depend on fat surfaces they do not use.
- Prefer small facades and command sets over one mega-API for “everything host”.
- Vue components take only the props/emits they need; avoid grab-bag option objects without cause.

## D — Dependency Inversion

- High-level policy depends on abstractions: features use slice `api/` → `@shared/api` → Tauri/Vue — never import SDKs deep in UI or domain.
- Host domain logic does not depend on Vue or HTTP details; adapters (commands, routes) depend on domain.
- Invert ownership: shared kernels stay free of feature knowledge; features depend inward/downward per FSD and VSA rules.

## Checklist (before finishing a change)

1. Can you name a **single** responsibility for each new file/type?
2. Would a new variant need a **new module** rather than bloating an existing one?
3. Are public exports **minimal** and stable for callers?
4. Do features/host domain depend on **facades/traits**, not concrete SDKs or UI frameworks?
5. Does the change still respect FSD import direction and host slice boundaries?
