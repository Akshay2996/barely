import { create } from "zustand";
import type { Screen, Section, Settings, ToastItem, DayDetail, Tone } from "@/types";

// ── Settings persistence (localStorage) ───────────────────────────────

export const SETTINGS_KEY = "barely-settings";

const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  reminderTime: "09:00",
  reminderOn: true,
  carryEnabled: false,
  tone: "Gentle",
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

// ── Store ─────────────────────────────────────────────────────────────

interface CheckinState {
  step: number; // 0..3
  workInput: string;
  personalInput: string;
  draftWork: string[];
  draftPersonal: string[];
}

interface AppState {
  screen: Screen;
  checkin: CheckinState;
  settings: Settings;
  toast: ToastItem | null;
  dayDetail: DayDetail | null;
  // voice
  listening: Section | null;
  transcript: string;
}

interface AppActions {
  go: (screen: Screen) => void;
  startNewDay: () => void;
  // checkin
  beginCheckin: () => void;
  setStep: (n: number) => void;
  setWorkInput: (v: string) => void;
  setPersonalInput: (v: string) => void;
  addDraft: (which: Section) => void;
  removeDraft: (which: Section, index: number) => void;
  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: () => void;
  // toast
  showToast: (title: string, body: string) => void;
  dismissToast: () => void;
  // day detail
  openDayDetail: (d: DayDetail) => void;
  closeDayDetail: () => void;
  // voice
  startListening: (which: Section) => void;
  stopListening: () => void;
  setTranscript: (t: string) => void;
}

const MAX_PER_SECTION = 3;

let toastTimer: ReturnType<typeof setTimeout> | null = null;

const emptyCheckin: CheckinState = {
  step: 0,
  workInput: "",
  personalInput: "",
  draftWork: [],
  draftPersonal: [],
};

export const useAppStore = create<AppState & AppActions>((set) => {
  const settings = loadSettings();
  return {
    screen: settings.onboarded ? "today" : "onboarding",
    checkin: { ...emptyCheckin },
    settings,
    toast: null,
    dayDetail: null,
    listening: null,
    transcript: "",

    go: (screen) => set({ screen, dayDetail: null }),

    startNewDay: () => set({ screen: "checkin", checkin: { ...emptyCheckin }, dayDetail: null }),

    beginCheckin: () => set((s) => ({ checkin: { ...s.checkin, step: 1 } })),
    setStep: (n) => set((s) => ({ checkin: { ...s.checkin, step: n } })),
    setWorkInput: (v) => set((s) => ({ checkin: { ...s.checkin, workInput: v } })),
    setPersonalInput: (v) => set((s) => ({ checkin: { ...s.checkin, personalInput: v } })),

    addDraft: (which) =>
      set((s) => {
        const c = s.checkin;
        if (which === "work") {
          const v = c.workInput.trim();
          if (!v || c.draftWork.length >= MAX_PER_SECTION) return {};
          return { checkin: { ...c, draftWork: [...c.draftWork, v], workInput: "" } };
        }
        const v = c.personalInput.trim();
        if (!v || c.draftPersonal.length >= MAX_PER_SECTION) return {};
        return { checkin: { ...c, draftPersonal: [...c.draftPersonal, v], personalInput: "" } };
      }),

    removeDraft: (which, index) =>
      set((s) => {
        const c = s.checkin;
        if (which === "work") {
          const arr = [...c.draftWork];
          arr.splice(index, 1);
          return { checkin: { ...c, draftWork: arr } };
        }
        const arr = [...c.draftPersonal];
        arr.splice(index, 1);
        return { checkin: { ...c, draftPersonal: arr } };
      }),

    updateSettings: (patch) =>
      set((s) => {
        const next = { ...s.settings, ...patch };
        persistSettings(next);
        return { settings: next };
      }),

    completeOnboarding: () =>
      set((s) => {
        const next = { ...s.settings, onboarded: true };
        persistSettings(next);
        return { settings: next };
      }),

    showToast: (title, body) => {
      if (toastTimer) clearTimeout(toastTimer);
      set({ toast: { title, body } });
      toastTimer = setTimeout(() => set({ toast: null }), 5000);
    },
    dismissToast: () => {
      if (toastTimer) clearTimeout(toastTimer);
      set({ toast: null });
    },

    openDayDetail: (d) => set({ dayDetail: d }),
    closeDayDetail: () => set({ dayDetail: null }),

    startListening: (which) => set({ listening: which, transcript: "" }),
    stopListening: () => set({ listening: null }),
    setTranscript: (t) => set({ transcript: t }),
  };
});

export const TONE_OPTIONS: Tone[] = ["Gentle", "Extra gentle", "A little sassy"];
