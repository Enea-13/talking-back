import { useMemo, useState } from 'preact/hooks';
import { thoughtById, entriesFor, roman } from '../lib/data';
import { search } from '../lib/search';
import { href } from '../lib/router';
import { TopBar, EntryRow, CarePanel, SearchBox } from '../components/parts';
import * as I from '../components/icons';

export function Thought({ id }: { id: string }) {
  const t = thoughtById.get(id);
  const [order, setOrder] = useState<'situation' | 'book'>('situation');
  const [q, setQ] = useState('');
  const query = q.trim();
  const results = useMemo(() => search(q, 60, id), [q, id]);
  if (!t) return <NotFound />;
  const list = entriesFor(id);

  return (
    <>
      <TopBar backTo={href.home()} backLabel="Home" />
      <main class="page">
        <header class="thought-head">
          <span class="thought-emblem">
            <I.ThoughtIcon id={id} size={30} />
          </span>
          <div>
            <p class="kicker caps">
              {roman(t.order)} · {t.name}
            </p>
            <h1 class="title">{t.modernName}</h1>
            <p class="subtitle">{list.length} responses</p>
          </div>
        </header>
        <p class="summary">{t.summary}</p>

        <SearchBox id="tq" label={`Search within ${t.modernName}`} placeholder={`Search within ${t.modernName}`} value={q} onChange={setQ} />

        {id === 'sadness' && !query && <CarePanel />}

        {query ? (
          <section aria-live="polite">
            {results.length ? (
              <>
                <p class="count">
                  {results.length} {results.length === 1 ? 'response' : 'responses'} in {t.modernName}
                </p>
                <ul class="rows">
                  {results.map((e) => (
                    <EntryRow e={e} />
                  ))}
                </ul>
              </>
            ) : (
              <p class="empty">
                Nothing in {t.modernName} matched “{query}”. Try another word, or <a href={href.search(query)}>search all eight thoughts</a>.
              </p>
            )}
          </section>
        ) : (
          <>
            <div class="segmented" role="tablist" aria-label="Order">
              <button role="tab" aria-selected={order === 'situation'} onClick={() => setOrder('situation')}>
                By situation
              </button>
              <button role="tab" aria-selected={order === 'book'} onClick={() => setOrder('book')}>
                Book order
              </button>
            </div>

            {order === 'situation' ? (
              t.clusters.map((c) => {
                const items = list.filter((e) => e.cluster === c.id);
                if (!items.length) return null;
                return (
                  <section class="cluster">
                    <h2>
                      {c.title} <span class="n">{items.length}</span>
                    </h2>
                    <ul class="rows">
                      {items.map((e) => (
                        <EntryRow e={e} />
                      ))}
                    </ul>
                  </section>
                );
              })
            ) : (
              <ul class="rows book-order">
                {list.map((e) => (
                  <EntryRow e={e} />
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}

export function NotFound() {
  return (
    <>
      <TopBar backTo={href.home()} backLabel="Home" />
      <main class="page">
        <p class="empty">
          That page doesn’t exist. <a href={href.home()}>Go home</a>.
        </p>
      </main>
    </>
  );
}
