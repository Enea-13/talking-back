import { useEffect, useState } from 'preact/hooks';

// Per-device conveniences only. Every read and write is guarded: storage can be
// unavailable (private mode, blocked site data), and the app must still work.
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep the in-memory value */
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const SAVED = 'tb:saved';
let saved: string[] = read(SAVED, []);

export function toggleSaved(id: string) {
  saved = saved.includes(id) ? saved.filter((x) => x !== id) : [id, ...saved];
  write(SAVED, saved);
  notify();
}

export function useSaved() {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return saved;
}

export type Theme = 'auto' | 'light' | 'dark';

const THEME = 'tb:theme';
// The page background in each theme, for the browser and status bar (matches --bg in styles.css).
const BAR = { light: '#f5efe2', dark: '#0a1124' };

/** Light or dark when chosen; on 'auto' the device setting decides. index.html applies it early too, to avoid a flash. */
export function applyTheme(theme = read<Theme>(THEME, 'auto')) {
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.content = BAR[theme === 'auto' ? (m.media.includes('dark') ? 'dark' : 'light') : theme];
  });
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState(() => read<Theme>(THEME, 'auto'));
  return [
    theme,
    (t: Theme) => {
      write(THEME, t);
      applyTheme(t);
      setTheme(t);
    },
  ];
}

const LARGE = 'tb:large-text';

export function applyTextSize(large = read(LARGE, false)) {
  document.documentElement.dataset.size = large ? 'large' : '';
}

export function useLargeText(): [boolean, (v: boolean) => void] {
  const [large, setLarge] = useState(() => read(LARGE, false));
  return [
    large,
    (v: boolean) => {
      write(LARGE, v);
      applyTextSize(v);
      setLarge(v);
    },
  ];
}
