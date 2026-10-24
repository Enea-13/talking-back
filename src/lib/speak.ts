import { useEffect, useRef, useState } from 'preact/hooks';
import audio from '../../data/audio.json';
import { isNative } from './native';

// Each response's verses are a recording made ahead of time (scripts/audio/generate.py), bundled
// with the app, so they sound the same everywhere and play offline.

/** A recording, and when each word on screen starts: gaps from the word before, in hundredths of a second. */
export interface Clip {
  file: string;
  words: number[];
}

const clips = (audio as unknown as { clips: Record<string, Clip> }).clips;

/** The entry's recording, unless it has none or was made from different words (the data changed since). */
export function clipFor(id: string, wordCount: number): Clip | undefined {
  const clip = clips[id];
  return clip?.words.length === wordCount ? clip : undefined;
}

/** One reading in progress. */
interface Reading {
  stop(): void;
}

function play(clip: Clip, onWord: (i: number) => void, onEnd: () => void): Reading {
  const url = `${import.meta.env.BASE_URL}audio/${clip.file}.m4a`;
  // The player asks for byte ranges, which the service worker doesn't keep; one plain fetch gives it
  // the whole file, so the verse plays offline next time (vite.config.ts).
  if (!isNative) fetch(url).catch(() => {});
  let t = 0;
  const starts = clip.words.map((gap) => (t += gap));
  const el = new Audio(url);
  let frame = 0;
  let word = -1;
  const tick = () => {
    const now = el.currentTime * 100;
    let i = word;
    while (i + 1 < starts.length && starts[i + 1] <= now) i++;
    if (i !== word) onWord((word = i));
    frame = requestAnimationFrame(tick);
  };
  const end = () => {
    cancelAnimationFrame(frame);
    onEnd();
  };
  el.onplaying = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  };
  el.onended = el.onerror = end;
  el.play().catch(end);
  return {
    stop() {
      el.onended = el.onerror = null;
      cancelAnimationFrame(frame);
      el.pause();
      el.removeAttribute('src');
      el.load();
    },
  };
}

/**
 * Play an entry's recording. Returns [speaking, toggle, word], where `word` is the index of the
 * word being spoken, counted across all the verses, or -1 before the first.
 */
export function useSpeech(clip: Clip | undefined): [boolean, () => void, number] {
  const [speaking, setSpeaking] = useState(false);
  const [word, setWord] = useState(-1);
  const current = useRef<Reading | null>(null);

  useEffect(
    () => () => {
      current.current?.stop();
      current.current = null;
    },
    [clip],
  );

  const toggle = () => {
    if (!clip) return;
    if (speaking) {
      current.current?.stop();
      current.current = null;
      setSpeaking(false);
      setWord(-1);
      return;
    }
    // Events from a reading that was stopped or replaced are ignored.
    const reading: Reading = play(
      clip,
      (i) => current.current === reading && setWord(i),
      () => {
        if (current.current !== reading) return;
        current.current = null;
        setSpeaking(false);
        setWord(-1);
      },
    );
    current.current = reading;
    setSpeaking(true);
  };

  return [speaking, toggle, word];
}
