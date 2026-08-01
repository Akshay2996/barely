# Architecture

This document is the technical reference for contributors. It explains how Barely is put together, the important design decisions, and where to make common kinds of changes. Read [`CONTRIBUTING.md`](../CONTRIBUTING.md) first for the workflow.

## Overview

Barely is a **client-only, offline-first single-page app**. There is no backend: all state lives in the browser (IndexedDB + `localStorage`), and the app is packaged as an installable PWA. The stack is React 18 + TypeScript, built with Vite, with Zustand for state and `idb` for storage.

```
┌──────────────────────────────────────────────┐
│  React components (screens, layout, widgets)   │
├──────────────────────────────────────────────┤
│  Hooks (voice, notifications, history, install)│
├──────────────────────────────────────────────┤
│  Zustand stores (appStore, taskStore)          │
├──────────────────────────────────────────────┤
│  Repositories (ITaskRepository, IReminder…)    │
│     ├─ IndexedDB backend (idb)                 │
│     └─ in-memory fallback                      │
└──────────────────────────────────────────────┘
```

The layers depend downward only. Components read/write through hooks and stores; stores depend on **repository interfaces**, not on IndexedDB directly (dependency inversion), which keeps the storage engine swappable and testable.

## Directory map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Root layout, screen routing, global side-effects (init, notifications, storage-fallback toast), nav + FAB. |
| `src/components/screens/` | The five screens: `Onboarding`, `Checkin`, `Today`, `Progress`, `Reminders`. |
| `src/components/layout/` | `TopNav` (desktop) and `BottomNav` (mobile/tablet tab bar). |
| `src/components/` | Shared widgets: `TimePicker`, `DayDetailDialog`, `VoiceOverlay`, `Toast`, `Icon`, `LeafBadge`. |
| `src/stores/` | `appStore` (UI/settings/check-in/voice) and `taskStore` (today's tasks + carry-over). |
| `src/repositories/` | `interfaces.ts` (contracts) and `indexeddb.ts` (IndexedDB backend + in-memory fallback). |
| `src/hooks/` | `useNotifications`, `useVoiceCapture`, `useMonthHistory`, `useInstallPrompt`. |
| `src/utils/` | `date`, `tone`, `history` (deterministic seeding), `notify`. |
| `src/types/` | Shared domain + Web Speech types. |
| `src/index.css` | Design tokens (CSS custom properties) and every component style. |

## State management

Two Zustand stores, deliberately separated by concern:

- **`appStore`** - screen routing, persisted `settings` (onboarding, reminder time/toggle, carry toggle, tone), the check-in draft state, toast, day-detail dialog, and voice (`listening` section + live `transcript`). Settings are persisted to `localStorage` under `barely-settings`.
- **`taskStore`** - the current day's tasks and the carry-over "pending" item. It is created via `createTaskStore(repo)` so a different repository can be injected in tests.

Components subscribe with selectors (`useAppStore(s => s.screen)`) to minimize re-renders.

## Storage layer

Storage is abstracted behind interfaces in `repositories/interfaces.ts` (`ITaskRepository`, `IReminderRepository`). `repositories/indexeddb.ts` provides two backends behind a single async `getBackend()`:

- **IndexedDB backend** (`idb`): object stores `tasks` (keyed by `id`, indexed `by-date`) and `reminders`. DB name `barely`, version `2`.
- **In-memory backend**: a `Map`-based stand-in with the identical interface.

`getBackend()` races the `openDB()` call against a **4-second timeout** and also handles the `blocked` / `blocking` / `terminated` events. If IndexedDB is unavailable, blocked by another tab mid-upgrade, or wedged, it resolves to the in-memory backend instead of hanging forever. `App` calls `storageIsPersistent()` and shows a "temporary mode" toast when the fallback is in use.

> **Why this exists:** a blocked/failed IndexedDB `open()` never fires a callback, which would otherwise freeze the whole app (check-in can't save, navigation stalls) with no error. The timeout + fallback makes storage failures graceful.

## Data model

```ts
interface Task {
  id: string;          // uuid, or "seed-<date>-<section>-<i>" for demo history
  date: string;        // YYYY-MM-DD
  section: "work" | "personal";
  text: string;
  done: boolean;
  carried: boolean;    // brought over from a previous day
  createdAt: number;
}

interface Reminder { id: "main"; time: string /* HH:MM */; enabled: boolean }
```

A day holds **at most 3 tasks per section** (`MAX_PER_SECTION` in `taskStore`). The check-in and `commitCheckin` both enforce this, and `commitCheckin` **appends** to any existing tasks rather than replacing them.

## Progress history & seeding

The Progress calendar reads real tasks via `useMonthHistory(year, month)`, which groups `taskRepository.getInRange()` results by date. To avoid a blank calendar for new users:

- `utils/history.ts` generates **deterministic** demo tasks from a seeded PRNG (`mulberry32` seeded by an FNV-1a hash of the date), so a given date always yields the same tasks.
- On first run, `taskStore` seeds several months of history into IndexedDB (guarded by a `localStorage` flag).
- If a month can't be read from storage, `useMonthHistory` falls back to the same deterministic generator, so the calendar is never empty and never breaks.

## Notifications

`hooks/useNotifications.ts` (the instance in `App` with `{ schedule: true }`) reactively (re)schedules the daily nudge whenever the reminder time, toggle, or permission changes, and re-arms for the next day after firing.

Delivery goes through `utils/notify.ts` → `showNudge()`, which **prefers `ServiceWorkerRegistration.showNotification()`** and falls back to the `new Notification()` constructor. This matters: on Android Chrome the constructor is forbidden, so the SW path is the only way notifications work on mobile.

> **Limitation:** scheduling uses `setTimeout`, so a nudge fires while the app is open (in a tab or installed). True background delivery when the app is fully closed would require push infrastructure (a server + Web Push), which Barely intentionally does not have.

## Voice input

`hooks/useVoiceCapture.ts` drives the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) from `appStore.listening`. When a check-in section starts listening it transcribes live into that field and shows `VoiceOverlay`. Unsupported browsers get a friendly toast instead of an error.

## PWA

Configured in `vite.config.ts` via `vite-plugin-pwa` (Workbox, `registerType: autoUpdate`). The manifest defines name, theme, and `192`/`512` PNG icons (plus a maskable variant). `devOptions.enabled` registers the service worker in dev so install/offline behavior is testable without a production build. `index.html` adds the iOS `apple-touch-icon` and web-app meta tags.

## Responsive & cross-platform

- **Breakpoints** live in `src/index.css`. At **≤840px** the desktop top nav collapses and the floating bottom tab bar + FAB appear - both flip at the _same_ breakpoint so there's never a state without navigation (this covers iPad portrait ~820px).
- **Safe-area insets** (`env(safe-area-inset-*)`) are applied to the top nav, bottom tab bar, and FAB so content clears notches and home indicators on iOS.
- **iOS zoom** is avoided by using 16px inputs; tap highlight, long-press callout, and the 300ms tap delay are neutralized globally.

## Testing hooks

- **Date override:** set `localStorage["barely:test-today"]` to a `YYYY-MM-DD` string to make `today()` return a simulated day. Useful for exercising carry-over across a day boundary. Ignored in normal use.

## Conventions

- Prettier is the formatting source of truth (`.prettierrc`).
- User-facing copy and comments use plain hyphens (`-`), never em/en dashes.
- Keep the storage engine behind the repository interfaces; don't import `idb` from components or stores.
