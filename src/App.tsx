import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { useTaskStore } from "@/stores/taskStore";
import { useNotifications } from "@/hooks/useNotifications";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { LeafBadge } from "@/components/LeafBadge";
import { Icon } from "@/components/Icon";
import { Onboarding } from "@/components/screens/Onboarding";
import { Checkin } from "@/components/screens/Checkin";
import { Today } from "@/components/screens/Today";
import { Progress } from "@/components/screens/Progress";
import { Reminders } from "@/components/screens/Reminders";
import { DayDetailDialog } from "@/components/DayDetailDialog";
import { VoiceOverlay } from "@/components/VoiceOverlay";
import { Toast } from "@/components/Toast";
import { storageIsPersistent } from "@/repositories/indexeddb";

/** Floating "new day" action button - shown on mobile/tablet (where the top
 *  "New day" button is hidden), pinned to the side above the bottom tab bar. */
function NewDayFab() {
  const startNewDay = useAppStore((s) => s.startNewDay);
  return (
    <button
      className="barely-fab"
      onClick={startNewDay}
      aria-label="Start a new day"
      title="New day"
    >
      <Icon name="plus" size={26} />
    </button>
  );
}

function FlowHeader() {
  const go = useAppStore((s) => s.go);
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        padding: "var(--space-6) var(--space-4) 0",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={() => go("today")}
        aria-label="Barely - go home"
        className="nav-brand"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          margin: 0,
          fontSize: 18,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "inherit",
        }}
      >
        <LeafBadge />
        Barely
      </button>
    </div>
  );
}

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const carryEnabled = useAppStore((s) => s.settings.carryEnabled);
  const init = useTaskStore((s) => s.init);
  const showToast = useAppStore((s) => s.showToast);

  // Drive the recurring reminder scheduling + voice capture.
  useNotifications({ schedule: true });
  useVoiceCapture();

  // Load today's tasks (and the carry-over nudge) on mount and when the
  // carry-over setting changes.
  useEffect(() => {
    init(carryEnabled);
  }, [init, carryEnabled]);

  // Warn once if storage fell back to in-memory (IndexedDB unavailable/blocked),
  // so the user knows changes won't survive a reload.
  useEffect(() => {
    let cancelled = false;
    storageIsPersistent().then((ok) => {
      if (!cancelled && !ok) {
        showToast(
          "Working in temporary mode",
          "Storage is unavailable, so today's changes won't be saved after you close Barely.",
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const showFullHeader = screen === "today" || screen === "progress" || screen === "reminders";
  // Onboarding renders its own hero brand, so the compact flow header is only
  // needed during check-in (otherwise the leaf/logo would appear twice).
  const isFlow = screen === "checkin";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Ambient background blobs */}
      <div
        style={{
          position: "absolute",
          top: -150,
          right: -120,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: "radial-gradient(circle at center, var(--color-accent-200), transparent 68%)",
          opacity: 0.55,
          pointerEvents: "none",
          filter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -170,
          left: -150,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle at center, var(--color-accent-2-200), transparent 68%)",
          opacity: 0.5,
          pointerEvents: "none",
          filter: "blur(6px)",
        }}
      />

      {showFullHeader && <TopNav />}
      {isFlow && <FlowHeader />}

      <main
        className="barely-main"
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "0 var(--space-4) var(--space-8)",
        }}
      >
        {screen === "onboarding" && <Onboarding />}
        {screen === "checkin" && <Checkin />}
        {screen === "today" && <Today />}
        {screen === "progress" && <Progress />}
        {screen === "reminders" && <Reminders />}
      </main>

      {showFullHeader && <NewDayFab />}
      {showFullHeader && <BottomNav />}

      <DayDetailDialog />
      <VoiceOverlay />
      <Toast />
    </div>
  );
}
