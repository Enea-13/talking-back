import { useMemo, useState } from 'preact/hooks';
import { entryById, thoughtById, clusterTitle, mainVerses, altVerses, nextInCluster, roman, KIND_LABEL } from '../lib/data';
import { href } from '../lib/router';
import { toggleSaved, useSaved } from '../lib/storage';
import { canSpeak, useSpeech } from '../lib/speak';
import { isNative, shareNative, tap } from '../lib/native';
import { TopBar, CarePanel } from '../components/parts';
import { CARE_ENTRY_IDS } from '../lib/care';
import { NotFound } from './Thought';
import * as I from '../components/icons';

/** LORD and GOD set in small capitals, as English Bibles print them. */
const smallCaps = (s: string) => s.split(/\b(LORD|GOD)\b/).map((part, i) => (i % 2 ? <span class="sc">{part[0] + part.slice(1).toLowerCase()}</span> : part));

/** Each verse as words, with where each word starts in the text the voice is given. */
function splitWords(texts: string[]) {
  let base = 0;
  return texts.map((t) => {
    const words = [...t.matchAll(/\S+/g)].map((m) => ({ text: m[0], start: base + m.index! }));
    base += t.length + 1;
    return words;
  });
}

export function Entry({ id }: { id: string }) {
  const e = entryById.get(id);
  const saved = useSaved();
  const [copied, setCopied] = useState(false);
  const verses = e ? mainVerses(e) : [];
  const spoken = verses.map((v) => v.text).join(' ');
  const [speaking, toggleSpeech, at] = useSpeech(spoken);
  const words = useMemo(() => splitWords(verses.map((v) => v.text)), [spoken]);
  if (!e) return <NotFound />;

  const t = thoughtById.get(e.thought)!;
  const alt = altVerses(e);
  const next = nextInCluster(e);
  const isSaved = saved.includes(e.id);
  const unidentified = !verses.length;

  // The word being spoken, counted across all the verses; -1 until the voice reports one.
  let now = -1;
  if (at >= 0) words.flat().forEach((w, i) => w.start <= at && (now = i));
  let counted = 0;

  const share = async () => {
    const text = `${verses.map((v) => `“${v.text}” (${v.ref})`).join('\n')}\n\nWhen the thought says: “${e.voice}”`;
    const url = location.href;
    try {
      if (isNative) {
        // The app's own address means nothing on another device, so the words go alone.
        await shareNative(text);
        return;
      }
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

  const save = (
    <button
      class={`side${isSaved ? ' on' : ''}`}
      onClick={() => {
        tap();
        toggleSaved(e.id);
      }}
      aria-pressed={isSaved}
    >
      <span class="ring">
        <I.Star filled={isSaved} size={20} />
      </span>
      {isSaved ? 'Saved' : 'Save'}
    </button>
  );
  const shareButton = (
    <button class="side" onClick={share}>
      <span class="ring">
        <I.Share size={20} />
      </span>
      {copied ? 'Copied' : 'Share'}
    </button>
  );

  return (
    <>
      <TopBar backTo={href.thought(t.id)} backLabel={t.modernName} />
      <main class="page entry">
        {CARE_ENTRY_IDS.has(e.id) && <CarePanel />}
        <p class="thought-line">
          <I.ThoughtIcon id={e.thought} size={18} />
          <span>
            {roman(t.order)} · {t.modernName}
          </span>
        </p>
        <p class="eyebrow caps">When the thought says</p>
        <h1 class="voice-big">“{e.voice}”</h1>
        <p class="situation">{e.situation}</p>

        <article class="answer" aria-label="Response">
          <p class="kind caps">{KIND_LABEL[e.kind]}</p>
          {unidentified ? (
            <p class="verse muted">
              Evagrius answers this thought with a saying whose biblical source has not been identified, a blessing on the one who starts to help and
              leans on hope.
            </p>
          ) : (
            verses.map((v, vi) => {
              const ws = words[vi];
              const from = counted;
              counted += ws.length;
              // An opening quote or ellipsis hangs in the margin, so the drop cap falls on the first letter.
              const lead = vi === 0 ? (v.text.match(/^[“‘…]+/)?.[0] ?? '') : '';
              return (
                <blockquote class={`verse${vi === 0 ? ' drop' : ''}${now >= 0 ? ' speaking' : ''}`}>
                  <p>
                    {lead && <span class="hang">{lead}</span>}
                    {ws.map((w, wi) => {
                      const i = from + wi;
                      return (
                        <>
                          <span class={i === now ? 'w now' : i < now ? 'w said' : 'w'}>{smallCaps(wi === 0 ? w.text.slice(lead.length) : w.text)}</span>
                          {wi < ws.length - 1 && ' '}
                        </>
                      );
                    })}
                  </p>
                  <cite>{v.ref}</cite>
                </blockquote>
              );
            })
          )}

          {!unidentified &&
            (canSpeak ? (
              <div class="speakrow">
                {save}
                <button class="speak" onClick={toggleSpeech} aria-pressed={speaking}>
                  <span class="flame">
                    <I.Speaker on={speaking} size={30} />
                  </span>
                  {speaking ? 'Stop' : 'Speak it back'}
                </button>
                {shareButton}
              </div>
            ) : (
              <div class="actions">
                {save}
                {shareButton}
              </div>
            ))}
        </article>

        {alt.map((a) => (
          <section class="alt">
            <h2 class="section-label caps">{a.label}</h2>
            <blockquote class="verse small">
              <p>{smallCaps(a.text)}</p>
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
