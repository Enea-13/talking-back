// Build data/entries.json, the file the app (and a future iOS app) reads.
//
//   node scripts/build-data.mjs [--reading <reading.txt>]
//
// Merges data/skeleton.json (entry numbers and kinds), data/refs.json (verse
// references in English numbering), data/thoughts.json and the hand-written
// data/authoring/*.json, then bakes in public-domain verse text from the
// World English Bible and Brenton's Septuagint so the app never needs the
// network. With --reading, it also fails if any wording shares an 8-word run
// with the copyrighted translation the entries were written from.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { WEB, LXX, range, formatRef } from './bible.mjs';

const dataDir = new URL('../data/', import.meta.url);
const readJson = (name) => JSON.parse(readFileSync(new URL(name, dataDir), 'utf8'));

const skeleton = readJson('skeleton.json');
const refs = readJson('refs.json');
const thoughts = readJson('thoughts.json');
const authoring = {};
for (const f of readdirSync(new URL('authoring/', dataDir)).filter((f) => f.endsWith('.json')).sort()) {
  const file = readJson(`authoring/${f}`);
  for (const [id, a] of Object.entries(file.entries)) authoring[id] = a;
}

const readingIdx = process.argv.indexOf('--reading');
const readingPath = readingIdx > 0 ? process.argv[readingIdx + 1] : null;

const errors = [];
const fail = (id, msg) => errors.push(`${id}: ${msg}`);

// ---------- verse text ----------

// Superscriptions are merged into verse 1 in both texts ("A Psalm by David. The
// LORD is my shepherd…"). Strip leading sentences that open like a title.
const PSALM_TITLE =
  /^(?:(?:For the Chief Musician|For the end|For instruction|\[?A Psalm\]?|A Song|A Maskil|A Michtam|A Prayer|A poem|A contemplation|A meditation|By David|Of David|By Asaph|Of Asaph|By Solomon|Of Solomon|For the sons of Korah|By the sons of Korah|To the tune|Set to|Shiggaion|Alleluia)\b[^.]*\.[”’]?\s+)+/;
const ACROSTIC =
  /^(?:Aleph|Beth|Gimel|Daleth|He|Vau|Zain|Heth|Teth|Jod|Caph|Chaph|Lamed|Mem|Nun|Samech|Ain|Phe|Tsade|Sade|Koph|Resh|Rhechs|Chen|Sen|Schin|Thau)\.\s+/;

function cleanVerse(code, key, text, greek) {
  let t = text;
  if (code === 'PSA' && key.endsWith(':1')) t = t.replace(PSALM_TITLE, '');
  if (greek) t = t.replace(ACROSTIC, '').replace(/\[([^\]]*)\]/g, '$1');
  return t
    .replace(/\s*\b(Selah|Pause)\.\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CODE_REF = /^(\w{3}) (\d+):(\d+[ab]?)(?:-(?:(\d+):)?(\d+[ab]?))?$/;
function parseCodeRef(s) {
  const m = CODE_REF.exec(s);
  if (!m) return null;
  const [, code, c1, v1, c2, v2] = m;
  return { code, c1: +c1, v1, c2: c2 ? +c2 : +c1, v2: v2 ?? v1 };
}

/**
 * Verse text for a passage, optionally cut to an excerpt ({ from, to } are
 * exact phrases in the text). The returned reference narrows to the verses
 * the excerpt actually touches.
 */
function passage(id, bible, p, greek, ex) {
  const vs = range(bible, p.code, p.c1, p.v1, p.c2, p.v2)
    ?.map((v) => ({ key: v.key, text: cleanVerse(p.code, v.key, v.text, greek) }))
    .filter((v) => v.text);
  if (!vs?.length) return null;
  const starts = [];
  let full = '';
  for (const v of vs) {
    if (full) full += ' ';
    starts.push(full.length);
    full += v.text;
  }
  if (!ex) return { ref: p, text: full };

  let start = 0;
  let end = full.length;
  if (ex.from) {
    start = full.indexOf(ex.from);
    if (start < 0) fail(id, `excerpt start not found: "${ex.from}"`);
  }
  if (ex.to) {
    const i = full.indexOf(ex.to, Math.max(start, 0));
    if (i < 0) fail(id, `excerpt end not found: "${ex.to}"`);
    else end = i + ex.to.length;
  }
  start = Math.max(start, 0);
  let text = full.slice(start, end).trim();
  if (start > 0) text = '…' + text;
  if (end < full.length) text = /[.!?”’]$/.test(text) ? `${text} …` : text.replace(/[,;:]$/, '') + '…';

  const first = starts.findLastIndex((s) => s <= start);
  const last = starts.findLastIndex((s) => s < end);
  const [c1, v1] = vs[first].key.split(':');
  const [c2, v2] = vs[last].key.split(':');
  return { ref: { code: p.code, c1: +c1, v1, c2: +c2, v2 }, text };
}

const greekRefLabel = (p) => `${formatRef(p.code, p.c1, p.v1, p.c2, p.v2).replace(/^Daniel \(Greek\)/, 'Daniel')} (Greek)`;
function webRefLabel(p) {
  if (p.code === 'DNG' && p.c1 === 13) return `Susanna ${p.v1 === p.v2 ? p.v1 : `${p.v1}–${p.v2}`}`;
  if (p.code === 'DNG') return formatRef(p.code, p.c1, p.v1, p.c2, p.v2).replace(/^Daniel \(Greek\)/, 'Daniel') + ' (Greek additions)';
  return formatRef(p.code, p.c1, p.v1, p.c2, p.v2);
}

// Word overlap between two renderings, to flag verses where the Hebrew-based
// WEB and the Greek Evagrius read say noticeably different things.
const STOP = new Set('the and of to a in that is it for be he his him you your thou thee thy ye i me my we us our they them their not with as but are was were shall will have has had which who this from by on at or all so no an if then than there into upon unto when what also'.split(' '));
const words = (s) => new Set((s || '').toLowerCase().replace(/[’']/g, '').split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(eth|est|ing|ed|es|s)$/, '')));
function overlap(a, b) {
  const A = words(a);
  const B = words(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return (2 * hit) / (A.size + B.size);
}

// ---------- entries ----------

const clusterIds = new Map(thoughts.map((t) => [t.id, new Set(t.clusters.map((c) => c.id))]));
const asList = (v, n) => (v === undefined ? Array(n).fill(undefined) : Array.isArray(v) ? v : [v, ...Array(n - 1).fill(undefined)]);

const entries = [];
for (const s of skeleton) {
  const a = authoring[s.id];
  if (!a) continue;

  for (const field of ['cluster', 'voice', 'situation']) if (!a[field]) fail(s.id, `missing ${field}`);
  if (!Array.isArray(a.tags) || a.tags.length < 3) fail(s.id, 'needs at least 3 tags');
  if (a.cluster && !clusterIds.get(s.thought)?.has(a.cluster)) fail(s.id, `unknown cluster "${a.cluster}"`);
  if (a.voice && a.voice.length > 90) fail(s.id, `voice is ${a.voice.length} chars (max 90)`);
  if (a.situation && a.situation.length > 140) fail(s.id, `situation is ${a.situation.length} chars (max 140)`);

  const mapped = Array.isArray(refs[s.id]) ? refs[s.id] : [];
  const n = Math.max(mapped.length, Array.isArray(a.web) ? a.web.length : 0, 1);
  const webOverride = asList(a.web, n);
  const greekOverride = asList(a.greekRef, n);
  const excerpts = asList(a.excerpt, n);

  const passages = [];
  for (let i = 0; i < n; i++) {
    const m = mapped[i];
    const webRef = webOverride[i] !== undefined ? (webOverride[i] && parseCodeRef(webOverride[i])) : m?.web;
    const greekRef = greekOverride[i] !== undefined ? (greekOverride[i] && parseCodeRef(greekOverride[i])) : m?.lxxKey;
    if (webOverride[i] && !webRef) fail(s.id, `bad web ref "${webOverride[i]}"`);
    if (greekOverride[i] && !greekRef) fail(s.id, `bad greek ref "${greekOverride[i]}"`);

    const web = webRef ? passage(s.id, WEB, webRef, false, excerpts[i]) : null;
    if (webRef && !web) fail(s.id, `no WEB text for ${JSON.stringify(webRef)}`);
    const greek = greekRef ? passage(s.id, LXX, greekRef, true, a.greekExcerpt) : null;
    if (greekRef && !greek) fail(s.id, `no Brenton text for ${JSON.stringify(greekRef)}`);

    const divergent = web && greek ? overlap(web.text, greek.text) < 0.35 : !!greek;
    const showGreek = !!greek && (a.lead === 'greek' || a.showGreek || divergent);
    passages.push({
      ref: web ? webRefLabel(web.ref) : greek ? greekRefLabel(greek.ref) : null,
      text: web?.text ?? null,
      ...(showGreek ? { greek: { ref: greekRefLabel(greek.ref), text: greek.text } } : {}),
    });
  }
  if (!passages.some((p) => p.text || p.greek) && s.id !== 'lis-029') fail(s.id, 'no verse text');

  entries.push({
    id: s.id,
    thought: s.thought,
    book: s.book,
    n: s.n,
    kind: a.kind ?? s.kind,
    cluster: a.cluster,
    voice: a.voice,
    situation: a.situation,
    tags: a.tags,
    ...(a.note ? { note: a.note } : {}),
    lead: a.lead === 'greek' || passages.every((p) => !p.text) ? 'greek' : 'web',
    passages,
  });
}

// ---------- copyright guard ----------

if (readingPath) {
  const norm = (t) => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z']+/g, ' ').trim().split(' ').filter(Boolean);
  const shingles = new Set();
  const src = norm(readFileSync(readingPath, 'utf8'));
  for (let i = 0; i + 8 <= src.length; i++) shingles.add(src.slice(i, i + 8).join(' '));
  for (const e of entries)
    for (const field of ['voice', 'situation', 'note']) {
      const w = norm(e[field] ?? '');
      for (let i = 0; i + 8 <= w.length; i++)
        if (shingles.has(w.slice(i, i + 8).join(' '))) fail(e.id, `${field} shares 8 words with the source translation: "${w.slice(i, i + 8).join(' ')}"`);
    }
} else {
  console.warn('note: copyright guard skipped (pass --reading <reading.txt> to run it)');
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem(s); data/entries.json not written.`);
  process.exit(1);
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  sources: {
    web: 'World English Bible (US, “LORD” edition), public domain, eBible.org',
    greek: 'Brenton’s English Septuagint (1851), public domain, eBible.org',
  },
  thoughts,
  totals: Object.fromEntries(thoughts.map((t) => [t.id, skeleton.filter((s) => s.thought === t.id).length])),
  entries,
};
writeFileSync(new URL('entries.json', dataDir), JSON.stringify(out, null, 1) + '\n');
const per = thoughts.map((t) => `${t.id} ${entries.filter((e) => e.thought === t.id).length}/${out.totals[t.id]}`).join(', ');
console.log(`data/entries.json: ${entries.length} entries (${per})`);
