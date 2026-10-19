import { useState } from 'preact/hooks';
import { entryById, thoughtById, clusterTitle, mainVerses, altVerses, nextInCluster, KIND_LABEL } from '../lib/data';
import { href } from '../lib/router';
import { toggleSaved, useSaved } from '../lib/storage';
import { canSpeak, useSpeech } from '../lib/speak';
import { TopBar, ThoughtPill, CarePanel } from '../components/parts';
import { CARE_ENTRY_IDS } from '../lib/care';
import { NotFound } from './Thought';
import * as I from '../components/icons';

export function Entry({ id }: { id: string }) {
  const e = entryById.get(id);
  const saved = useSaved();
  const [copied, setCopied] = useState(false);
  const verses = e ? mainVerses(e) : [];
  const spoken = verses.map((v) => v.text).join(' ');
  const [speaking, toggleSpeech] = useSpeech(spoken);
  if (!e) return <NotFound />;

  const t = thoughtById.get(e.thought)!;
  const alt = altVerses(e);
  const next = nextInCluster(e);
  const isSaved = saved.includes(e.id);
  const unidentified = !verses.length;

  const share = async () => {
    const text = `${verses.map((v) => `“${v.text}” (${v.ref})`).join('\n')}\n\nWhen the thought says: “${e.voice}”`;
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Talking Back', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* share sheet dismissed */
    }
  };

  return (
    <>
      <TopBar backTo={href.thought(t.id)} backLabel={t.modernName} />
      <main class={`page entry t-${e.thought}`}>
        {CARE_ENTRY_IDS.has(e.id) && <CarePanel />}
        <div class="entry-top">
          <ThoughtPill id={e.thought} />
        </div>
        <p class="eyebrow">When the thought says</p>
        <h1 class="voice-big">“{e.voice}”</h1>
        <p class="situation">{e.situation}</p>

        <article class="answer" aria-label="Response">
          <p class={`kind kind-${e.kind}`}>{KIND_LABEL[e.kind]}</p>
          {unidentified ? (
            <p class="verse muted">
              Evagrius answers this thought with a saying whose biblical source has not been identified, a blessing on the one who starts to help and
              leans on hope.
            </p>
          ) : (
            verses.map((v) => (
              <blockquote class="verse">
                <p>{v.text}</p>
                <cite>{v.ref}</cite>
              </blockquote>
            ))
          )}

          {!unidentified && (
            <div class="actions">
              {canSpeak && (
                <button class={`action${speaking ? ' on' : ''}`} onClick={toggleSpeech} aria-pressed={speaking}>
                  <I.Speaker on={speaking} />
                  <span>{speaking ? 'Stop' : 'Say it aloud'}</span>
                </button>
              )}
              <button class={`action${isSaved ? ' on' : ''}`} onClick={() => toggleSaved(e.id)} aria-pressed={isSaved}>
                <I.Star filled={isSaved} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
              <button class="action" onClick={share}>
                <I.Share />
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          )}
        </article>

        {alt.map((a) => (
          <section class="alt">
            <h2 class="section-label">{a.label}</h2>
            <blockquote class="verse small">
              <p>{a.text}</p>
              <cite>{a.ref}</cite>
            </blockquote>
          </section>
        ))}

        {e.note && <p class="note">{e.note}</p>}

        <p class="source">
          <em>Talking Back</em>, Book {e.book} ({t.name}) · no. {e.n}
          <br />
          {clusterTitle(e)}
        </p>

        {next && (
          <a class="next" href={href.entry(next.id)}>
            <span>
              <span class="next-label">Another response in “{clusterTitle(e)}”</span>
              <span class="next-voice">“{next.voice}”</span>
            </span>
            <I.Next />
          </a>
        )}
      </main>
    </>
  );
}
