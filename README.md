# JudoSphere

Offline-first [Tauri](https://tauri.app/) application for managing **smaller judo competitions** and **small clubs**.

## Features

- Local tournament administration on a host machine
- Shared UI for organizers and scoring judges on the LAN
- Offline-first operation without a cloud requirement

## Tech Stack

- **Frontend:** [Vue 3](https://vuejs.org/) + TypeScript (Feature-Sliced Design)
- **Desktop / host runtime:** [Tauri 2](https://tauri.app/) + Rust (vertical slices)
- **Build tooling:** [Vite](https://vite.dev/), [Vue TSC](https://www.npmjs.com/package/vue-tsc)
- **Testing:** [Vitest](https://vitest.dev/), [Storybook](https://storybook.js.org/)
- **Code quality:** [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)
- **UI foundation:** Tailwind and a design system planned under `src/shared/ui`

## Operating model

1. The Tauri host app starts on one machine and acts as a local server.
2. Scoring judges and organizers open the host-provided website in a browser.
3. Spectators and participants are out of scope for this software.
4. The product must work offline / without cloud dependency.

## Quick Start

**Requirements:** Node.js, Rust, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri dev
```

Other common commands: `npm run storybook`, `npm run type:check`, `npm run test:unit`.

## Documentation

- [Contributing](CONTRIBUTING.md) — development workflow, scripts, quality checks
- [Architecture](docs/architecture.md) — FSD frontend, vertical slices in Tauri

## License

See [LICENSE](LICENSE).
