import { useAppStore } from "@/stores/appStore";
import { useTaskStore, MAX_PER_SECTION as MAX } from "@/stores/taskStore";
import { Icon } from "@/components/Icon";
import { toneCopy } from "@/utils/tone";
import type { Section } from "@/types";

// Tasks already logged today for a section - new drafts share the 3-per-section cap.
function useExistingCount(section: Section): number {
  return useTaskStore((s) => s.tasks.filter((t) => t.section === section).length);
}

function SectionLabel({ section }: { section: Section }) {
  const isWork = section === "work";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: isWork ? "var(--color-accent)" : "var(--color-accent-2-700)",
      }}
    >
      <Icon name={isWork ? "briefcase" : "coffee"} size={18} />
      <span
        style={{
          fontSize: 12,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          fontFamily: "var(--font-heading)",
        }}
      >
        {isWork ? "Work" : "Personal"}
      </span>
    </div>
  );
}

function DraftChips({ section }: { section: Section }) {
  const drafts = useAppStore((s) =>
    section === "work" ? s.checkin.draftWork : s.checkin.draftPersonal,
  );
  const removeDraft = useAppStore((s) => s.removeDraft);
  const isWork = section === "work";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {drafts.map((text, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 6px 6px 14px",
            borderRadius: 999,
            background: isWork ? "var(--color-accent-100)" : "var(--color-accent-2-100)",
            color: isWork ? "var(--color-accent-800)" : "var(--color-accent-2-800)",
            fontSize: 14,
          }}
        >
          {text}
          <button
            className="btn btn-icon"
            onClick={() => removeDraft(section, i)}
            aria-label="Remove"
            style={{
              width: 24,
              height: 24,
              color: isWork ? "var(--color-accent-700)" : "var(--color-accent-2-700)",
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </span>
      ))}
    </div>
  );
}

function InputRow({ section }: { section: Section }) {
  const isWork = section === "work";
  const input = useAppStore((s) => (isWork ? s.checkin.workInput : s.checkin.personalInput));
  const drafts = useAppStore((s) => (isWork ? s.checkin.draftWork : s.checkin.draftPersonal));
  const setInput = useAppStore((s) => (isWork ? s.setWorkInput : s.setPersonalInput));
  const addDraft = useAppStore((s) => s.addDraft);
  const startListening = useAppStore((s) => s.startListening);
  const existing = useExistingCount(section);
  const cap = Math.max(0, MAX - existing); // room left in this section for today
  const full = drafts.length >= cap;

  return (
    <div style={{ display: "flex", gap: 8, marginTop: "var(--space-2)" }}>
      <input
        className="input"
        placeholder={full ? "That’s the limit for today" : "Type, or tap the mic →"}
        value={input}
        disabled={full}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (!full) addDraft(section);
          }
        }}
        style={{ flex: 1, minWidth: 0 }}
      />
      <button
        className="btn btn-icon"
        onClick={() => startListening(section)}
        title="Add by voice"
        aria-label="Add by voice"
        style={{
          background: isWork ? "var(--color-accent-100)" : "var(--color-accent-2-100)",
          color: isWork ? "var(--color-accent-700)" : "var(--color-accent-2-700)",
          flex: "none",
        }}
      >
        <Icon name="mic" size={18} />
      </button>
      <button
        className="btn btn-primary"
        onClick={() => addDraft(section)}
        disabled={full}
        style={{ flex: "none" }}
      >
        <Icon name="plus" size={16} />
        Add
      </button>
    </div>
  );
}

function StepQuestion({ section }: { section: Section }) {
  const isWork = section === "work";
  const drafts = useAppStore((s) => (isWork ? s.checkin.draftWork : s.checkin.draftPersonal));
  const setStep = useAppStore((s) => s.setStep);
  const existing = useExistingCount(section);
  const cap = Math.max(0, MAX - existing);
  const hint =
    cap === 0
      ? "You’ve already got three for today - that’s the cap."
      : drafts.length >= cap
        ? "That fills today. More than enough."
        : existing > 0
          ? `${existing} already logged today - room for ${cap} more.`
          : "Up to three. Honestly, one is plenty.";

  return (
    <div
      style={{
        animation: "barely-fade-up .3s ease",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <SectionLabel section={section} />
      <h2 style={{ margin: 0 }}>
        {isWork
          ? "What’s the smallest useful thing you could do for work today?"
          : "And one small thing for you?"}
      </h2>
      <p className="text-muted" style={{ margin: 0 }}>
        {isWork
          ? "Not the whole project. The two-minute version of it."
          : "A glass of water. A short walk. Off your feet counts too."}
      </p>
      <InputRow section={section} />
      <DraftChips section={section} />
      <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
        {hint}
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "var(--space-3)",
        }}
      >
        <a onClick={() => setStep(isWork ? 0 : 1)} style={{ cursor: "pointer", fontSize: 14 }}>
          back
        </a>
        <button className="btn btn-primary" onClick={() => setStep(isWork ? 2 : 3)}>
          Next
          <Icon name="arrowRight" size={17} />
        </button>
      </div>
    </div>
  );
}

function ReviewList({ section }: { section: Section }) {
  const isWork = section === "work";
  const drafts = useAppStore((s) => (isWork ? s.checkin.draftWork : s.checkin.draftPersonal));
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: isWork ? "var(--color-accent)" : "var(--color-accent-2-700)",
          marginBottom: 6,
        }}
      >
        {isWork ? "Work" : "Personal"}
      </div>
      {drafts.length > 0 ? (
        drafts.map((text, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "3px 0" }}>
            <span
              style={{
                width: 16,
                height: 16,
                flex: "none",
                borderRadius: 999,
                border: `2px solid ${isWork ? "var(--color-accent-300)" : "var(--color-accent-2-300)"}`,
              }}
            />
            {text}
          </div>
        ))
      ) : (
        <div className="text-muted" style={{ fontSize: 13 }}>
          {isWork ? "Nothing - and that’s completely allowed." : "Nothing - rest is a valid goal."}
        </div>
      )}
    </div>
  );
}

export function Checkin() {
  const step = useAppStore((s) => s.checkin.step);
  const tone = useAppStore((s) => s.settings.tone);
  const beginCheckin = useAppStore((s) => s.beginCheckin);
  const setStep = useAppStore((s) => s.setStep);
  const go = useAppStore((s) => s.go);
  const draftWork = useAppStore((s) => s.checkin.draftWork);
  const draftPersonal = useAppStore((s) => s.checkin.draftPersonal);
  const commitCheckin = useTaskStore((s) => s.commitCheckin);

  const copy = toneCopy(tone);

  const finish = async () => {
    await commitCheckin(draftWork, draftPersonal);
    go("today");
  };

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 600,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        paddingTop: "var(--space-6)",
      }}
    >
      {step >= 1 && step <= 3 && (
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
          }}
        >
          Step {step} of 3
        </div>
      )}

      {step === 0 && (
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-3)",
            animation: "barely-fade-up .35s ease",
          }}
        >
          <span
            style={{
              width: 60,
              height: 60,
              borderRadius: 999,
              background: "var(--color-accent-100)",
              color: "var(--color-accent-600)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="sunrise" size={30} strokeWidth={2.5} />
          </span>
          <h2 style={{ margin: 0 }}>{copy.greeting}</h2>
          <p className="text-muted" style={{ margin: 0, maxWidth: "38ch" }}>
            Two little questions, then you’re free. Type your answers - or tap the mic and just say
            them.
          </p>
          <button
            className="btn btn-primary"
            onClick={beginCheckin}
            style={{ marginTop: "var(--space-2)" }}
          >
            Begin
            <Icon name="arrowRight" size={17} />
          </button>
        </div>
      )}

      {step === 1 && <StepQuestion section="work" />}
      {step === 2 && <StepQuestion section="personal" />}

      {step === 3 && (
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-3)",
            animation: "barely-fade-up .3s ease",
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "var(--color-accent-100)",
              color: "var(--color-accent-600)",
              display: "grid",
              placeItems: "center",
              animation: "barely-pop .45s ease",
            }}
          >
            <Icon name="sparkles" size={28} strokeWidth={2.5} />
          </span>
          <h2 style={{ margin: 0 }}>That’s your whole day.</h2>
          <p className="text-muted" style={{ margin: 0 }}>
            Seriously. Anything past this is a bonus round.
          </p>
          <div
            className="card elev-sm"
            style={{ width: "100%", textAlign: "left", gap: "var(--space-3)" }}
          >
            <ReviewList section="work" />
            <ReviewList section="personal" />
          </div>
          <button className="btn btn-primary btn-block" onClick={finish}>
            See today
            <Icon name="arrowRight" size={17} />
          </button>
          <a onClick={() => setStep(2)} style={{ cursor: "pointer", fontSize: 14 }}>
            go back
          </a>
        </div>
      )}
    </section>
  );
}
