import { useRef } from "react";
import { useAppStore } from "@/stores/appStore";
import { useNotifications } from "@/hooks/useNotifications";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { reminderRepository } from "@/repositories/indexeddb";
import { showNudge } from "@/utils/notify";
import { exportBackup, importBackupFromFile } from "@/utils/backup";
import { Icon } from "@/components/Icon";
import { TimePicker } from "@/components/TimePicker";

function Switch({
  on,
  onChange,
  color = "var(--color-accent)",
}: {
  on: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <div
      onClick={onChange}
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange();
        }
      }}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        background: on ? color : "var(--color-neutral-300)",
        padding: 3,
        cursor: "pointer",
        display: "flex",
        justifyContent: on ? "flex-end" : "flex-start",
        alignItems: "center",
        transition: "background .2s",
        flex: "none",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "var(--color-bg)",
          boxShadow: "var(--shadow-sm)",
        }}
      />
    </div>
  );
}

export function Reminders() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const showToast = useAppStore((s) => s.showToast);
  const { permission, requestPermission } = useNotifications();
  const { canInstall, promptInstall } = useInstallPrompt();
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = async () => {
    try {
      await exportBackup();
      showToast("Backup downloaded", "Keep it safe - you can import it on any device or browser.");
    } catch {
      showToast("Couldn't export", "Something went wrong building the backup file.");
    }
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    try {
      const { tasks } = await importBackupFromFile(file);
      showToast("Backup restored", `Imported ${tasks} task${tasks === 1 ? "" : "s"}. Reloading...`);
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      showToast(
        "Couldn't import",
        err instanceof Error ? err.message : "That file couldn't be read.",
      );
    }
  };

  const saveReminder = (enabled: boolean, time: string) => {
    reminderRepository.save({ id: "main", enabled, time });
  };

  const toggleReminder = () => {
    const next = !settings.reminderOn;
    updateSettings({ reminderOn: next });
    saveReminder(next, settings.reminderTime);
  };

  const onTimeChange = (time: string) => {
    updateSettings({ reminderTime: time });
    saveReminder(settings.reminderOn, time);
  };

  const toggleCarry = () => updateSettings({ carryEnabled: !settings.carryEnabled });

  const sendTestNudge = async () => {
    let granted = permission === "granted";
    if (permission === "default") granted = (await requestPermission()) === "granted";
    // Uses the service worker on mobile (where `new Notification` is forbidden)
    // and the constructor on desktop.
    if (granted)
      await showNudge(
        "Time to open your laptop",
        "Your three things are waiting. Barely counts - remember?",
      );
    showToast(
      "Time to open your laptop",
      "Your three things are waiting. Barely counts - remember?",
    );
  };

  const addToHome = async () => {
    if (canInstall) {
      await promptInstall();
    } else {
      showToast(
        "Add Barely to your home screen",
        "In your browser menu, choose “Add to Home Screen.” One tap to your day.",
      );
    }
  };

  const notifNote =
    permission === "granted"
      ? "Notifications are on - you'll get a real system pop-up at your time, as long as Barely is open in a tab or installed to your home screen."
      : "The test nudge shows an in-app pop-up. Allow notifications for a real system alert - it fires at your time while Barely is open or installed.";

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 620,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        paddingTop: "var(--space-4)",
        animation: "barely-fade-up .35s ease",
      }}
    >
      <div>
        <h1 className="barely-h1" style={{ margin: "0 0 4px" }}>
          One gentle nudge
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          We’ll remind you to open your laptop. Once. That’s the whole deal.
        </p>
      </div>

      <div className="card elev-sm" style={{ gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span
            style={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: 999,
              background: "var(--color-accent-100)",
              color: "var(--color-accent-700)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="briefcase" size={20} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Open-your-laptop reminder</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              A soft pop-up when your day starts.
            </div>
          </div>
          <Switch on={settings.reminderOn} onChange={toggleReminder} />
        </div>

        {settings.reminderOn && (
          <div
            style={{
              borderTop: "1px solid var(--color-divider)",
              paddingTop: "var(--space-3)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
            }}
          >
            <div
              className="barely-reminderrow"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  fontSize: 14,
                  color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
                }}
              >
                Nudge me at
              </label>
              <TimePicker value={settings.reminderTime} onChange={onTimeChange} />
              <button
                className="btn btn-secondary"
                onClick={sendTestNudge}
                style={{ marginLeft: "auto" }}
              >
                <Icon name="bell" size={16} />
                Send a test nudge
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 12,
                color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
              }}
            >
              <Icon name="info" size={15} style={{ flex: "none", marginTop: 1 }} />
              <span>{notifNote}</span>
            </div>
          </div>
        )}
      </div>

      <div
        className="card elev-sm"
        style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-3)" }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            flex: "none",
            borderRadius: 999,
            background: "var(--color-accent-2-100)",
            color: "var(--color-accent-2-700)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="smartphone" size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Add Barely to your home screen</div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            One tap to your three things. No app store, no account.
          </div>
        </div>
        <button className="btn btn-primary" onClick={addToHome}>
          Add
        </button>
      </div>

      <div
        className="card elev-sm"
        style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-3)" }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            flex: "none",
            borderRadius: 999,
            background: "var(--color-neutral-200)",
            color: "var(--color-neutral-700)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="rotateCcw" size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Carry unfinished tasks to tomorrow</div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Off by default. No task should follow you around.
          </div>
        </div>
        <Switch
          on={settings.carryEnabled}
          onChange={toggleCarry}
          color="var(--color-accent-2-500)"
        />
      </div>

      <div className="card elev-sm" style={{ gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span
            style={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: 999,
              background: "var(--color-accent-2-100)",
              color: "var(--color-accent-2-700)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="database" size={20} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Back up your data</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Save everything to a file, then restore it on a new device or browser. It all stays on
              your device.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={onExport}>
            <Icon name="download" size={16} />
            Export backup
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} />
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            style={{ display: "none" }}
          />
        </div>
      </div>
    </section>
  );
}
