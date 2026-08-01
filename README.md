<div align="center">

<img src="public/icon.svg" alt="Barely logo" width="96" height="96" />

# Barely

**The least you can do.** A gentle, offline-first daily tracker for people who just need three tiny things done today - not another guilt-machine to-do app.

[![License: MIT](https://img.shields.io/badge/License-MIT-c67139.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-7a8a5e.svg)](#install-it-add-to-home-screen)
[![Built with React + TypeScript](https://img.shields.io/badge/React%2018-TypeScript-c67139.svg)](#tech-stack)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-7a8a5e.svg)](CONTRIBUTING.md)

</div>

---

## Why Barely?

Most productivity apps optimize for _more_. Barely optimizes for _enough_. You write down **at most three things** for the day - split between work and personal - and that's it. Make the bed? Counts. Two minutes on the deck? Counts. Rest day? Also allowed. The tone stays kind on purpose.

It runs entirely in the browser, works offline, and installs to your phone's home screen like a native app - no account, no server, no app store.

## Features

- **Two-question morning check-in** - type your three tiny things, or **speak them** with the built-in voice input (Web Speech API, with a graceful fallback).
- **Today view** - tap to complete, inline **edit** and **delete**, and a soft progress bar that never nags.
- **Progress calendar** - a real month-by-month heatmap of what you actually did, backed by IndexedDB, with a deterministic fallback so it's never blank. Tap any past day to see the detail.
- **One gentle nudge** - a single, opt-in daily reminder delivered as a real system notification (via the service worker, so it works on Android too).
- **Carry-over** - optionally bring one unfinished thing to tomorrow. Off by default; no task should follow you around.
- **Installable PWA** - add to your home screen on **iOS and Android**; fully responsive from phone to desktop, with safe-area support for notches and home indicators.
- **Offline-first & private** - all data lives on your device in IndexedDB. If storage is ever unavailable, the app degrades gracefully to an in-memory session instead of breaking.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build / dev | [Vite](https://vitejs.dev/) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Storage | [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) via [`idb`](https://github.com/jakearchibald/idb) |
| PWA | [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox service worker) |
| Styling | Hand-rolled CSS design system (design tokens in `src/index.css`) |
| Platform APIs | Web Speech, Notifications + Service Worker, Web App Manifest |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full technical walkthrough.

## Getting started

### Prerequisites

- **Node.js 18+** and npm

### Install & run

```bash
# 1. Clone
git clone https://github.com/Akshay2996/barely.git
cd barely

# 2. Install dependencies
npm install

# 3. Start the dev server (http://localhost:5173)
npm run dev
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check (`tsc`) and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run the TypeScript compiler with no emit |
| `npm run format` | Format the codebase with Prettier |
| `npm run format:check` | Check formatting without writing |

## Install it (Add to Home Screen)

Barely is a PWA, so you can install it like an app:

- **Android (Chrome):** open the site → menu (⋮) → **Install app** / **Add to Home screen**.
- **iOS (Safari):** open the site → Share → **Add to Home Screen**.
- **Desktop (Chrome/Edge):** click the install icon in the address bar.

Once installed it launches full-screen and the daily nudge can fire as a real notification.

## Project structure

```
src/
├─ components/        # UI: screens, layout (top/bottom nav), shared widgets
│  ├─ screens/        # Onboarding, Checkin, Today, Progress, Reminders
│  └─ layout/         # TopNav, BottomNav
├─ hooks/             # useNotifications, useVoiceCapture, useMonthHistory, useInstallPrompt
├─ stores/            # Zustand stores (appStore, taskStore)
├─ repositories/      # Storage layer (IndexedDB + in-memory fallback)
├─ utils/             # date, tone, history seeding, notify helpers
├─ types/             # Shared TypeScript types
└─ index.css          # Design tokens + component styles
```

## Contributing

Contributions are welcome and appreciated! This project uses **GitHub Issues** to track work and **pull requests** for all changes - the `main` branch is protected.

1. Found a bug or have an idea? **[Open an issue](https://github.com/Akshay2996/barely/issues/new/choose).**
2. Want to write code? Read **[CONTRIBUTING.md](CONTRIBUTING.md)** first - it covers setup, the branch/PR workflow, and code style.

## License

[MIT](LICENSE) © Akshay Sharma
