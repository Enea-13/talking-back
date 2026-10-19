import { useEffect, useRef, useState } from 'preact/hooks';

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** What the voice is given. Each swap keeps the length, so character positions still match the text on screen. */
const forVoice = (text: string) => text.replace(/…/g, ' ').replace(/\bLORD\b/g, 'Lord').replace(/\bGOD\b/g, 'God');

/**
 * Speak text aloud with the device voice. Returns [speaking, toggle, at], where `at` is the
 * character position of the word being spoken, or -1 until the voice reports one. Some voices
 * never report word boundaries; they still speak, and `at` stays -1.
 */
export function useSpeech(text: string): [boolean, () => void, number] {
  const [speaking, setSpeaking] = useState(false);
  const [at, setAt] = useState(-1);
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(
    () => () => {
      current.current = null;
      if (canSpeak) speechSynthesis.cancel();
    },
    [text],
  );

  const toggle = () => {
    if (!canSpeak) return;
    if (speaking) {
      current.current = null;
      speechSynthesis.cancel();
      setSpeaking(false);
      setAt(-1);
      return;
    }
    const u = new SpeechSynthesisUtterance(forVoice(text));
    u.rate = 0.92;
    // Events from an utterance that was cancelled or replaced are ignored.
    u.onboundary = (ev) => {
      if (current.current === u && (!ev.name || ev.name === 'word')) setAt(ev.charIndex);
    };
    u.onend = u.onerror = () => {
      if (current.current !== u) return;
      current.current = null;
      setSpeaking(false);
      setAt(-1);
    };
    speechSynthesis.cancel();
    current.current = u;
    speechSynthesis.speak(u);
    setSpeaking(true);
  };

  return [speaking, toggle, at];
}
