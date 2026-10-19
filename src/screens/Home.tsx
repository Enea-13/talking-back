import { useMemo, useState } from 'preact/hooks';
import { thoughts, entriesFor, entryById } from '../lib/data';
import { search } from '../lib/search';
import { isCrisis, HOPE_IDS } from '../lib/care';
import { href, replace } from '../lib/router';
import { TopBar, EntryRow, CarePanel, SearchBox } from '../components/parts';
import * as I from '../components/icons';

const FEELINGS = ['anxious', 'tempted', 'angry', 'afraid', 'hopeless', 'bored', 'resentful', 'jealous', 'unnoticed', 'superior', 'craving', 'lonely'];

export function Home({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const query = q.trim();
  const crisis = isCrisis(query);
  const results = useMemo(
    () => (crisis ? HOPE_IDS.map((id) => entryById.get(id)).filter((e) => !!e) : search(q)),
    [q, crisis],
  );

  const update = (v: string) => {
    setQ(v);
    replace(href.search(v.trim()));
  };

  return (
    <>
      <TopBar hero />
      <section class="hero">
        <div class="hero-inner">
          <label class="prompt" for="q">
            What is the thought telling you?
          </label>
          <p class="hero-sub">Name it, and answer it with Scripture.</p>
          <SearchBox id="q" label="What is the thought telling you?" placeholder="e.g. “just this once”" value={q} onChange={update} />
        </div>
      </section>

      <main class="page home">
        <div class="chips" role="group" aria-label="Or pick a feeling">
          {FEELINGS.map((f) => (
            <button class={`chip${query === f ? ' on' : ''}`} aria-pressed={query === f} onClick={() => update(query === f ? '' : f)}>
              {f}
            </button>
          ))}
        </div>

        {query ? (
          <section aria-live="polite">
            {crisis && <CarePanel />}
            {results.length ? (
              <>
                <p class="count">
                  {crisis ? 'For when hope is hard to hold on to' : `${results.length} ${results.length === 1 ? 'response' : 'responses'}`}
                </p>
                <ul class="rows">
                  {results.map((e) => (
                    <EntryRow e={e} showThought />
                  ))}
                </ul>
              </>
            ) : crisis ? null : (
              <p class="empty">
                Nothing matched “{query}”. Try a simpler word, such as <em>worry</em>, <em>drink</em> or <em>tired</em>, or browse the thoughts below.
              </p>
            )}
          </section>
        ) : null}

        {!query || !results.length ? (
          <section>
            <h2 class="section-label">The eight thoughts</h2>
            <ul class="tiles">
              {thoughts.map((t) => (
                <li>
                  <a class={`tile t-${t.id}`} href={href.thought(t.id)}>
                    <span class="tile-icon">
                      <I.ThoughtIcon id={t.id} />
                    </span>
                    <span class="tile-name">{t.modernName}</span>
                    <span class="tile-term">{t.name}</span>
                    <span class="tile-count">{entriesFor(t.id).length} responses</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
