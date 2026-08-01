import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useTaskStore } from "@/stores/taskStore";
import { Icon } from "@/components/Icon";
import { toneCopy } from "@/utils/tone";
import { today } from "@/utils/date";
import type { Task, Section } from "@/types";

function TaskRow({ task }: { task: Task }) {
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const editTask = useTaskStore((s) => s.editTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const isWork = task.section === "work";
  const fill = isWork ? "var(--color-accent)" : "var(--color-accent-2-500)";
  const accent = isWork ? "var(--color-accent-700)" : "var(--color-accent-2-700)";

  const beginEdit = () => {
    setDraft(task.text);
    setEditing(true);
  };
  const save = () => {
    editTask(task.id, draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(task.text);
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className="card elev-sm"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: "var(--color-surface)",
        }}
      >
        <input
          className="input"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button
          className="btn btn-icon"
          onClick={save}
          aria-label="Save"
          style={{ background: "var(--color-accent-100)", color: accent, flex: "none" }}
        >
          <Icon name="check" size={16} strokeWidth={3} />
        </button>
        <button className="btn btn-icon" onClick={cancel} aria-label="Cancel" style={{ flex: "none" }}>
          <Icon name="x" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="card elev-sm barely-taskrow"
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        gap: 0,
        padding: 0,
        overflow: "hidden",
        background: "var(--color-surface)",
      }}
    >
      <div
        className="barely-taskhit"
        onClick={() => toggleTask(task.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleTask(task.id);
          }
        }}
        role="button"
        tabIndex={0}
        aria-pressed={task.done}
        aria-label={`${task.done ? "Mark not done" : "Mark done"}: ${task.text}`}
      >
        <span
          style={{
            position: "relative",
            width: 26,
            height: 26,
            flex: "none",
            borderRadius: 999,
            border: "2px solid var(--color-neutral-400)",
            display: "grid",
            placeItems: "center",
          }}
        >
          {task.done && (
            <span
              style={{
                position: "absolute",
                inset: -2,
                borderRadius: 999,
                background: fill,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="check" size={15} strokeWidth={3.2} color="var(--color-bg)" />
            </span>
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {task.done ? (
            <span style={{ textDecoration: "line-through", opacity: 0.5 }}>{task.text}</span>
          ) : (
            <span>{task.text}</span>
          )}
          {task.carried && (
            <span className="tag tag-neutral" style={{ marginLeft: 8, verticalAlign: "middle" }}>
              carried
            </span>
          )}
        </div>
      </div>
      <div className="barely-rowactions">
        <button
          type="button"
          className="barely-rowbtn"
          onClick={(e) => {
            e.stopPropagation();
            beginEdit();
          }}
          aria-label="Edit task"
          title="Edit"
        >
          <Icon name="pencil" size={16} />
        </button>
        <button
          type="button"
          className="barely-rowbtn is-danger"
          onClick={(e) => {
            e.stopPropagation();
            removeTask(task.id);
          }}
          aria-label="Delete task"
          title="Delete"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}

function SectionColumn({ section, tasks }: { section: Section; tasks: Task[] }) {
  const isWork = section === "work";
  const doneCount = tasks.filter((t) => t.done).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
        <span
          style={{
            width: 26,
            height: 26,
            flex: "none",
            borderRadius: 999,
            background: isWork ? "var(--color-accent-100)" : "var(--color-accent-2-100)",
            color: isWork ? "var(--color-accent-700)" : "var(--color-accent-2-700)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name={isWork ? "briefcase" : "coffee"} size={15} />
        </span>
        <h4 style={{ margin: 0 }}>{isWork ? "Work" : "Personal"}</h4>
        <span
          className={isWork ? "tag tag-accent" : "tag tag-accent-2"}
          style={{ marginLeft: "auto" }}
        >
          {doneCount}/{tasks.length}
        </span>
      </div>
      {tasks.length > 0 ? (
        tasks.map((t) => <TaskRow key={t.id} task={t} />)
      ) : (
        <div className="text-muted" style={{ fontSize: 13, padding: "8px 2px" }}>
          {isWork ? "Nothing here - and that’s allowed." : "Nothing here - rest counts too."}
        </div>
      )}
    </div>
  );
}

export function Today() {
  const tone = useAppStore((s) => s.settings.tone);
  const tasks = useTaskStore((s) => s.tasks);
  const carryPending = useTaskStore((s) => s.carryPending);
  const doCarry = useTaskStore((s) => s.doCarry);
  const doLetGo = useTaskStore((s) => s.doLetGo);

  const copy = toneCopy(tone);
  const work = tasks.filter((t) => t.section === "work");
  const personal = tasks.filter((t) => t.section === "personal");
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const allDone = total > 0 && done === total;

  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const dateKicker = new Date(today() + "T00:00:00")
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    .toUpperCase();

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 720,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        // Center the tracker vertically when it's shorter than the viewport;
        // auto margins collapse (overflow downward) when content is taller.
        margin: "auto 0",
        paddingBlock: "var(--space-4)",
        animation: "barely-fade-up .35s ease",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: 4,
          }}
        >
          {dateKicker}
        </div>
        <h1 className="barely-h1" style={{ margin: "0 0 4px" }}>
          {greeting}.
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          {copy.todaySub}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "color-mix(in srgb, var(--color-text) 9%, transparent)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 999,
              background: "var(--color-accent)",
              transition: "width .4s ease",
              width: total ? `${Math.round((done / total) * 100)}%` : "0%",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          <span>
            {done} of {total} done
          </span>
          <span>{done < total ? "The rest can wait. It really can." : "Every last one. Wow."}</span>
        </div>
      </div>

      {carryPending && (
        <div
          className="card elev-sm barely-carry"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: "var(--space-3)",
            background: "var(--color-accent-2-100)",
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              flex: "none",
              borderRadius: 999,
              background: "var(--color-accent-2-200)",
              color: "var(--color-accent-2-700)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="rotateCcw" size={18} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>You left one thing yesterday.</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              “{carryPending.text}” - no guilt. Bring it along, or let it go.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={doLetGo}>
            Let it go
          </button>
          <button className="btn btn-primary" onClick={doCarry}>
            Carry over
          </button>
        </div>
      )}

      {allDone && (
        <div
          className="card elev-md"
          style={{
            alignItems: "center",
            textAlign: "center",
            background: "var(--color-accent-100)",
            padding: "var(--space-6)",
            animation: "barely-pop .4s ease",
          }}
        >
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              background: "var(--color-accent-200)",
              color: "var(--color-accent-700)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="sparkles" size={26} />
          </span>
          <h3 style={{ margin: "8px 0 2px" }}>{copy.allDone}</h3>
          <p className="text-muted" style={{ margin: 0 }}>
            Tomorrow’s three can wait until tomorrow.
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-4)",
          marginTop: "var(--space-2)",
        }}
      >
        <SectionColumn section="work" tasks={work} />
        <SectionColumn section="personal" tasks={personal} />
      </div>
    </section>
  );
}
