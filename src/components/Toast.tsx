import { useAppStore } from "@/stores/appStore";
import { Icon } from "@/components/Icon";

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const dismiss = useAppStore((s) => s.dismissToast);

  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 90,
        width: 340,
        maxWidth: "calc(100vw - 40px)",
        animation: "barely-toast-in .3s ease",
      }}
    >
      <div
        className="card elev-lg"
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          background: "var(--color-neutral-100)",
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            flex: "none",
            borderRadius: 999,
            background: "var(--color-accent-2-200)",
            color: "var(--color-accent-2-700)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="bell" size={19} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{toast.title}</div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {toast.body}
          </div>
        </div>
        <button
          className="btn btn-icon"
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ width: 28, height: 28 }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  );
}
