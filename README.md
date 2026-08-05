<div align="center">

<img src="public/icon.svg" alt="Barely logo" width="96" height="96" />

# Barely

**The least you can do.** A gentle, offline-first daily tracker for people who just need three tiny things done today - not another guilt-machine to-do app.

### 🌱 [Try it live → barelytrack.vercel.app](https://barelytrack.vercel.app/)

[![Live](https://img.shields.io/badge/live-barelytrack.vercel.app-c67139.svg)](https://barelytrack.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-c67139.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-7a8a5e.svg)](#install-it-add-to-home-screen)
[![Built with React + TypeScript](https://img.shields.io/badge/React%2018-TypeScript-c67139.svg)](#tech-stack)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-7a8a5e.svg)](CONTRIBUTING.md)

<br />

<img src="barely.png" alt="Barely - the least you can do" width="420" />

</div>

---

> **Just exploring?** Open **[barelytrack.vercel.app/?demo=1](https://barelytrack.vercel.app/?demo=1)** to fill the Progress calendar with sample history so you can see the app with data in it (it's off by default and lives only on your device). Add `?demo=0` to clear it.

## Why Barely?

Most productivity apps optimize for _more_. Barely optimizes for _enough_. You write down **at most three things** for the day - split between work and personal - and that's it. Make the bed? Counts. Two minutes on the deck? Counts. Rest day? Also allowed. The tone stays kind on purpose.

It runs entirely in the browser, works offline, and installs to your phone's home screen like a native app - no account, no server, no app store.

## Features

- **Two-question morning check-in** - type your three tiny things, or **speak them** with the built-in voice input (Web Speech API, with a graceful fallback).
- **Today view** - tap to complete, inline **edit** and **delete**, and a soft progress bar that never nags.
- **Progress calendar** - a real month-by-month heatmap of what you actually did, backed by IndexedDB. Tap any past day to see the detail.
- **One gentle nudge** - a single, opt-in daily reminder delivered as a real system notification (via the service worker, so it works on Android too).
- **Carry-over** - optionally bring one unfinished thing to tomorrow. Off by default; no task should follow you around.
- **Installable PWA** - add to your home screen on **iOS and Android**; fully responsive from phone to desktop, with safe-area support for notches and home indicators.
- **Offline-first & private** - all data lives on your device in IndexedDB. If storage is ever unavailable, the app degrades gracefully to an in-memory session instead of breaking.
- **Optional cross-device sync** - three ways to keep your phone and laptop in step (a manual backup file, your own Google Drive, or an end-to-end-encrypted passphrase). Pick one, or none - [see below](#sync-across-your-devices).

## Sync across your devices

Barely is **offline-first** - it needs no account and no server, and your data lives on your device. When you _do_ want your phone and laptop to share the same three-things history, you pick **one** of three methods. Each is fully optional, and **none of them send readable data to us.**

| Method | How it works | Where your data lives | You need |
| --- | --- | --- | --- |
| **① Manual backup** | Export a JSON file, import it on the other device | A file you keep | Nothing |
| **② Google Drive** | Sign in with Google; syncs automatically in the background | A hidden folder in **your own** Google Drive (`appDataFolder`) | A Google account |
| **③ Passphrase** | Enter the same secret code on both devices; syncs automatically, **end-to-end encrypted** | A tiny serverless key-value store - only ciphertext | Just a passphrase |

**Your privacy holds either way.** The Google Drive file lives in _your_ Drive (the app can't see the rest of it). For passphrase sync, the snapshot is encrypted **in your browser** - AES-GCM with a key derived from your passphrase via PBKDF2 - so the backend (a Vercel Edge Function backed by Upstash Redis) only ever stores an **opaque id and ciphertext**. Lose every device _and_ forget the passphrase and that data can't be recovered - which is the point (keep a manual backup as a fallback).

### How a sync merges

Every sync is a **pull → merge → push** pass that converges no matter which device wrote last:

- Tasks merge **by id** - the newest `updatedAt` wins.
- Deletions travel as **soft-delete tombstones**, so a task you removed on one device doesn't resurrect from another.
- Each device keeps its own **settings and reminder** - a sync never clobbers your local preferences.

## Architecture

Everything runs in the browser. The UI talks to state, state talks to a storage layer that prefers IndexedDB (and silently falls back to memory), and an optional, provider-agnostic **sync engine** fans out to whichever method you chose.

```mermaid
flowchart TD
    subgraph device["📱 Your device (browser or installed PWA)"]
        direction TB
        UI["🖥️ React + TypeScript UI<br/>Onboarding · Check-in · Today · Progress · Reminders"]
        store["🗂️ Zustand stores<br/>appStore · taskStore"]
        repo["🔌 Repository layer<br/>task / reminder interfaces"]
        idb[("💾 IndexedDB")]
        mem[("🧠 In-memory fallback")]
        sw["⚙️ Service Worker<br/>offline cache · daily nudge"]
        engine["🔄 Sync engine<br/>pull → merge → push<br/>newest-wins · tombstones"]
        UI --> store --> repo --> idb
        repo -. "storage blocked" .-> mem
        store --> engine --> repo
        sw -. "notification" .-> UI
    end

    engine -->|"① Manual"| file["⬇️ JSON backup file"]
    engine -->|"② Google Drive"| gdrive["☁️ Google Drive<br/>appDataFolder in your Drive"]
    engine -->|"③ Passphrase"| edge["🔒 /api/sync · Vercel Edge"]
    edge --> redis[("🗝️ Upstash Redis<br/>opaque id + ciphertext")]

    classDef ui fill:#c67139,stroke:#8f4e22,color:#ffffff;
    classDef state fill:#e9dcc4,stroke:#b9a888,color:#4a3f2f;
    classDef data fill:#7a8a5e,stroke:#586845,color:#ffffff;
    classDef sync fill:#d98b4e,stroke:#a6602c,color:#ffffff;
    classDef cloud fill:#5b7d9a,stroke:#3f5a70,color:#ffffff;

    class UI ui;
    class store,repo,sw state;
    class idb,mem data;
    class engine sync;
    class file,gdrive,edge,redis cloud;
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full technical walkthrough.

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
| Sync (optional) | [Web Crypto](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API) (AES-GCM + PBKDF2), Google Drive `appdata`, [Vercel Edge Functions](https://vercel.com/docs/functions) + [Upstash Redis](https://upstash.com/) |

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

Barely is a PWA, so you can install it like an app. Open **[barelytrack.vercel.app](https://barelytrack.vercel.app/)** on your device, then:

- **Android (Chrome):** menu (⋮) → **Install app** / **Add to Home screen**.
- **iOS (Safari):** Share → **Add to Home Screen**.
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
├─ utils/             # date, tone, notify, backup + sync engine
│                     #   sync.ts / syncManager.ts (provider-agnostic engine)
│                     #   googleDrive.ts · passphrase.ts · crypto.ts (AES-GCM/PBKDF2)
├─ types/             # Shared TypeScript types
└─ index.css          # Design tokens + component styles

api/
└─ sync.ts            # Vercel Edge Function for passphrase sync (Upstash-backed)
```

## Contributing

Contributions are welcome and appreciated! This project uses **GitHub Issues** to track work and **pull requests** for all changes - the `main` branch is protected.

1. Found a bug or have an idea? **[Open an issue](https://github.com/Akshay2996/barely/issues/new/choose).**
2. Want to write code? Read **[CONTRIBUTING.md](CONTRIBUTING.md)** first - it covers setup, the branch/PR workflow, and code style.

## License

[MIT](LICENSE) © Akshay Sharma
