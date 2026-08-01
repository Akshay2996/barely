import { useAppStore } from "@/stores/appStore";
import { Icon } from "@/components/Icon";

export function VoiceOverlay() {
  const listening = useAppStore((s) => s.listening);
  const transcript = useAppStore((s) => s.transcript);
  const stopListening = useAppStore((s) => s.stopListening);

  if (!listening) return null;

  return (
    <div
      onClick={stopListening}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "color-mix(in srgb, var(--color-text) 55%, transparent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "barely-toast-in .2s ease",
      }}
    >
      <div
        className="card elev-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 400, alignItems: "center", textAlign: "center", gap: "var(--space-3)" }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 999,
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            display: "grid",
            placeItems: "center",
            animation: "barely-mic 1.6s infinite",
          }}
        >
          <Icon name="mic" size={38} strokeWidth={2.5} />
        </div>
        <h3 style={{ margin: 0 }}>Listening…</h3>
        <p className="text-muted" style={{ margin: 0 }}>
          Say your task out loud. I’ll write it down.
        </p>
        <div style={{ minHeight: 26, fontSize: 16, color: "var(--color-text)" }}>
          {transcript || "…"}
        </div>
        <button className="btn btn-secondary" onClick={stopListening}>
          Done
        </button>
      </div>
    </div>
  );
}
