import type { Tone } from "@/types";

interface ToneCopy {
  todaySub: string;
  allDone: string;
  greeting: string;
  skipped: (n: number) => string;
}

const COPY: Record<Tone, ToneCopy> = {
  Gentle: {
    todaySub: "Three things, tops. Two can be tiny. That still counts.",
    allDone: "That’s the whole list. Go close the laptop.",
    greeting: "Good morning. Let’s aim comfortably low.",
    skipped: (n) => `You’ve skipped ${n} days this month. Honestly? Still proud of you.`,
  },
  "Extra gentle": {
    todaySub: "Whatever you manage today is enough. Truly.",
    allDone: "Done is done. Be kind to yourself now.",
    greeting: "Hi. There’s no pressure here at all.",
    skipped: (n) => `${n} days off this month. Rest was probably the right call.`,
  },
  "A little sassy": {
    todaySub: "Three things. You’ve done less on bigger days.",
    allDone: "Look at you, overachieving. Now stop.",
    greeting: "Morning. Let’s lower the bar together.",
    skipped: (n) => `${n} skipped days. We’re not counting. (We counted.)`,
  },
};

export function toneCopy(tone: Tone): ToneCopy {
  return COPY[tone] ?? COPY.Gentle;
}

export function daySummary(count: number): string {
  if (count <= 0) return "A quiet day. Rest counts too.";
  if (count === 1) return "One small thing. That was enough.";
  if (count <= 3) return "A few bare-minimum wins. Nicely done.";
  return "A big day, by Barely’s standards. Look at you.";
}
