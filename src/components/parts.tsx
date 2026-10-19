import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { href, back } from '../lib/router';
import { thoughtById, type Entry } from '../lib/data';
import { useSaved } from '../lib/storage';
import { HELPLINES, useCountry } from '../lib/care';
import * as I from './icons';

export function TopBar({ backTo, backLabel, hero }: { backTo?: string; backLabel?: string; hero?: boolean }) {
  const saved = useSaved();
  return (
    <div class={`topbar-wrap${hero ? ' on-hero' : ''}`}>
      <header class="topbar">
        {backTo ? (
          <button class="back" onClick={() => back(backTo)} aria-label={`Back${backLabel ? ` to ${backLabel}` : ''}`}>
            <I.Back />
            <span>{backLabel ?? 'Back'}</span>
          </button>
        ) : (
          <a class="wordmark" href={href.home()}>
            Talking Back
          </a>
        )}
        <nav class="topnav">
          <a href={href.saved()} aria-label={`Saved verses (${saved.length})`} class="iconbtn">
            <I.Star filled={saved.length > 0} />
          </a>
          <a href={href.about()} aria-label="About this app" class="iconbtn">
            <I.Info />
          </a>
        </nav>
      </header>
    </div>
  );
}

/** A thought's color and icon, as a small label. */
export function ThoughtPill({ id }: { id: string }) {
  const t = thoughtById.get(id);
  if (!t) return null;
  return (
    <span class={`pill t-${id}`}>
      <I.ThoughtIcon id={id} size={13} />
      {t.modernName}
    </span>
  );
}

export function EntryRow({ e, showThought }: { e: Entry; showThought?: boolean }) {
  const ref = e.passages[0]?.ref ?? e.passages[0]?.greek?.ref ?? '';
  return (
    <li>
      <a class={`row t-${e.thought}`} href={href.entry(e.id)}>
        <span class="row-main">
          <span class="voice">“{e.voice}”</span>
          <span class="situation">{e.situation}</span>
          <span class="row-meta">
            {showThought && <ThoughtPill id={e.thought} />}
            {ref && <span class="ref-small">{ref}</span>}
          </span>
        </span>
        <I.Chevron />
      </a>
    </li>
  );
}

/** Crisis help for the viewer's country, which they can change. */
export function CarePanel({ children }: { children?: ComponentChildren }) {
  const [country, setCountry] = useCountry();
  const line = HELPLINES[country];
  return (
    <aside class="care" role="note">
      <strong>You don’t have to carry this alone.</strong>
      <p>If you’re thinking about ending your life or hurting yourself, please reach out now. It’s free and confidential.</p>
      {line ? (
        <>
          <a class="care-call" href={`tel:${line.tel}`}>
            <I.Phone />
            <span>
              {line.text ? 'Call or text' : 'Call'} {line.number}
              <small>{line.name}</small>
            </span>
          </a>
          <p>
            If you’re in danger right now, call <a href={`tel:${line.emergency.split(' ')[0]}`}>{line.emergency}</a>.
          </p>
        </>
      ) : (
        <>
          <a class="care-call" href="https://findahelpline.com" target="_blank" rel="noopener">
            <I.Phone />
            <span>
              Find a helpline in your country
              <small>findahelpline.com, free and confidential</small>
            </span>
          </a>
          <p>If you’re in danger right now, call your local emergency number.</p>
        </>
      )}
      <label class="care-country">
        <span>Help for</span>
        <select value={country} onChange={(ev) => setCountry((ev.target as HTMLSelectElement).value)}>
          {Object.entries(HELPLINES).map(([code, h]) => (
            <option value={code}>{h.country}</option>
          ))}
          <option value="OTHER">Another country</option>
        </select>
      </label>
      {line && (
        <p class="care-more">
          Elsewhere: <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>
        </p>
      )}
      {children}
    </aside>
  );
}

export function SearchBox({
  id,
  value,
  onChange,
  placeholder,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div class="searchbox">
      <I.Search />
      <input
        id={id}
        ref={input}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onInput={(ev) => onChange((ev.target as HTMLInputElement).value)}
      />
      {value && (
        <button
          class="clear"
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            input.current?.focus();
          }}
        >
          <I.Clear />
        </button>
      )}
    </div>
  );
}
