import { useEffect, useState } from 'preact/hooks';

// Hash routes, so the app works from any folder or host, and offline:
//   #/                home        #/search/<q>   home with a query
//   #/t/<thought>     thought     #/e/<entry>    response card
//   #/saved           saved       #/about        about
//   #/privacy         privacy policy
export type Route =
  | { name: 'home'; q: string }
  | { name: 'thought'; id: string }
  | { name: 'entry'; id: string }
  | { name: 'saved' }
  | { name: 'about' }
  | { name: 'privacy' };

export function parse(hash: string): Route {
  const [, a = '', b = ''] = hash.replace(/^#/, '').split('/');
  const arg = decodeURIComponent(b);
  if (a === 't' && arg) return { name: 'thought', id: arg };
  if (a === 'e' && arg) return { name: 'entry', id: arg };
  if (a === 'saved') return { name: 'saved' };
  if (a === 'about') return { name: 'about' };
  if (a === 'privacy') return { name: 'privacy' };
  if (a === 'search') return { name: 'home', q: arg };
  return { name: 'home', q: '' };
}

export const href = {
  home: () => '#/',
  search: (q: string) => (q ? `#/search/${encodeURIComponent(q)}` : '#/'),
  thought: (id: string) => `#/t/${id}`,
  entry: (id: string) => `#/e/${id}`,
  saved: () => '#/saved',
  about: () => '#/about',
  privacy: () => '#/privacy',
};

// How many of our pages lie behind this one, so Back knows whether the previous
// page is ours (history.back) or whether to fall back to a sensible parent. It
// lives in history.state, which survives a reload (pull-to-refresh, the service
// worker updating, the phone discarding the tab); a list in memory would not.
const depth = () => (history.state as { depth?: number } | null)?.depth;
let here = depth() ?? 0;
history.replaceState({ depth: here }, '');

/** Update the URL without adding a history step (used while typing a search). */
export function replace(h: string) {
  history.replaceState(history.state, '', h);
}

export const canGoBack = () => (depth() ?? 0) > 0;

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => {
      // A link adds an entry with no state, one page deeper; Back and Forward land on one already marked.
      if (depth() === undefined) history.replaceState({ depth: here + 1 }, '');
      here = depth()!;
      setRoute(parse(location.hash));
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function back(fallback: string) {
  if (canGoBack()) return history.back();
  // Swap this page for its parent rather than stacking the parent on top of it,
  // or the parent's own Back would return here and the two would bounce.
  history.replaceState({ depth: 0 }, '', fallback);
  dispatchEvent(new HashChangeEvent('hashchange'));
}
