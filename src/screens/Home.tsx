import { useMemo, useState } from 'preact/hooks';
import { thoughts, entryById, roman } from '../lib/data';
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
      <TopBar />
      <main class="page home">
        <label class="prompt" for="q">
          What is the thought <em>telling you?</em>
        </label>
        <p class="sub">Name it, and answer it with Scripture.</p>
        <SearchBox id="q" label="What is the thought telling you?" placeholder="e.g. “just this once”" value={q} onChange={update} />

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
            <h2 class="heading">The eight thoughts</h2>
            <p class="heading-sub">A ladder, from the body to the spirit</p>
            <ol class="ladder">
              {thoughts.map((t) => (
                <li>
                  <a href={href.thought(t.id)}>
                    <span class="rung" aria-hidden="true">
                      <span>{roman(t.order)}</span>
                    </span>
                    <span class="emblem">
                      <I.ThoughtIcon id={t.id} />
                    </span>
                    <span class="ladder-name">
                      {t.modernName}
                      <span class="ladder-term">{t.name}</span>
                    </span>
                    <I.Chevron />
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </main>
    </>
  );
}
