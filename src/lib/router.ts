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

// Hashes visited in this session, so Back knows whether the previous page is
// ours (history.back) or whether to fall back to a sensible parent.
const stack = [location.hash || '#/'];

/** Update the URL without adding a history step (used while typing a search). */
export function replace(h: string) {
  history.replaceState(null, '', h);
  stack[stack.length - 1] = h;
}

export const canGoBack = () => stack.length > 1;

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => {
      const h = location.hash || '#/';
      if (stack.length > 1 && stack[stack.length - 2] === h) stack.pop();
      else stack.push(h);
      setRoute(parse(h));
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function back(fallback: string) {
  if (canGoBack()) history.back();
  else location.hash = fallback;
}
