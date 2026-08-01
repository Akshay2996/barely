import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/appStore";

/**
 * Drives the Web Speech API from the app store's `listening` state.
 * When a section starts listening, transcribes speech live into that
 * section's check-in input; stops on end/error or when cleared.
 */
export function useVoiceCapture() {
  const listening = useAppStore((s) => s.listening);
  const setTranscript = useAppStore((s) => s.setTranscript);
  const setWorkInput = useAppStore((s) => s.setWorkInput);
  const setPersonalInput = useAppStore((s) => s.setPersonalInput);
  const stopListening = useAppStore((s) => s.stopListening);
  const showToast = useAppStore((s) => s.showToast);

  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!listening) {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
      return;
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      showToast(
        "Voice needs a supported browser",
        "Try Chrome or Edge - or just type it, that’s allowed too.",
      );
      stopListening();
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      t = t.trim();
      setTranscript(t);
      if (listening === "work") setWorkInput(t);
      else setPersonalInput(t);
    };
    rec.onerror = () => stopListening();
    rec.onend = () => stopListening();

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      stopListening();
    }

    return () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);
}
