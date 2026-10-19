import { useEffect, useRef, useState } from 'preact/hooks';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isNative } from './native';

// In the iOS and Android apps the device's own speech engine reads aloud (Android's web view has
// no Web Speech); in a browser, Web Speech does.
const nativeVoice = isNative && Capacitor.isPluginAvailable('TextToSpeech');
const webVoice = typeof window !== 'undefined' && 'speechSynthesis' in window;

export const canSpeak = nativeVoice || webVoice;

const RATE = 0.92;

/** What the voice is given. Each swap keeps the length, so character positions still match the text on screen. */
const forVoice = (text: string) => text.replace(/…/g, ' ').replace(/\bLORD\b/g, 'Lord').replace(/\bGOD\b/g, 'God');

/** One reading in progress. onWord gets the character position of each word as it is reached. */
interface Reading {
  stop(): void;
}

function readNative(text: string, onWord: (at: number) => void, onEnd: () => void): Reading {
  // Android reports each word; iOS's engine (in this plugin) does not, so there `at` stays -1.
  const listening = TextToSpeech.addListener('onRangeStart', ({ start }) => onWord(start));
  const unlisten = () => void listening.then((l) => l.remove());
  TextToSpeech.speak({ text, rate: RATE })
    .catch(() => {})
    .finally(() => {
      unlisten();
      onEnd();
    });
  return {
    stop() {
      unlisten();
      TextToSpeech.stop().catch(() => {});
    },
  };
}

function readWeb(text: string, onWord: (at: number) => void, onEnd: () => void): Reading {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = RATE;
  u.onboundary = (ev) => {
    if (!ev.name || ev.name === 'word') onWord(ev.charIndex);
  };
  u.onend = u.onerror = onEnd;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  return { stop: () => speechSynthesis.cancel() };
}

/**
 * Speak text aloud with the device voice. Returns [speaking, toggle, at], where `at` is the
 * character position of the word being spoken, or -1 until the voice reports one. Some voices
 * never report word boundaries; they still speak, and `at` stays -1.
 */
export function useSpeech(text: string): [boolean, () => void, number] {
  const [speaking, setSpeaking] = useState(false);
  const [at, setAt] = useState(-1);
  const current = useRef<Reading | null>(null);

  useEffect(
    () => () => {
      current.current?.stop();
      current.current = null;
    },
    [text],
  );

  const toggle = () => {
    if (!canSpeak) return;
    if (speaking) {
      current.current?.stop();
      current.current = null;
      setSpeaking(false);
      setAt(-1);
      return;
    }
    // Events from a reading that was stopped or replaced are ignored.
    const reading: Reading = (nativeVoice ? readNative : readWeb)(
      forVoice(text),
      (i) => current.current === reading && setAt(i),
      () => {
        if (current.current !== reading) return;
        current.current = null;
        setSpeaking(false);
        setAt(-1);
      },
    );
    current.current = reading;
    setSpeaking(true);
  };

  return [speaking, toggle, at];
}
