import { useEffect, useState } from 'preact/hooks';

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Speak text aloud with the device voice; returns [speaking, toggle]. */
export function useSpeech(text: string): [boolean, () => void] {
  const [speaking, setSpeaking] = useState(false);

  useEffect(
    () => () => {
      if (canSpeak) speechSynthesis.cancel();
    },
    [text],
  );

  const toggle = () => {
    if (!canSpeak) return;
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text.replace(/…/g, ' ').replace(/\bLORD\b/g, 'Lord'));
    u.rate = 0.92;
    u.onend = u.onerror = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    setSpeaking(true);
  };

  return [speaking, toggle];
}
