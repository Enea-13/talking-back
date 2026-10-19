// One-time helper: convert each entry's Septuagint reference to standard
// (English) versification in the World English Bible.
//
//   node scripts/map-refs.mjs <reading.txt> <review.txt>
//
// Candidates come from the numbering rules (psalm offsets, Kingdoms, Susanna…);
// the winner is the WEB passage whose wording best matches what Evagrius
// quoted (the reading file, for matching only) and Brenton's Septuagint.
// Writes data/refs.json. The review file shows every match side by side and
// stays outside the project because it quotes the copyrighted translation.
import { readFileSync, writeFileSync } from 'node:fs';
import { WEB, LXX, parseRef, range, joinVerses, formatRef, psalmChapterCandidates } from './bible.mjs';

const [readingPath, reviewPath] = process.argv.slice(2);
const skeleton = JSON.parse(readFileSync(new URL('../data/skeleton.json', import.meta.url), 'utf8'));

// References the parser cannot read from the page (given only in footnotes,
// or left unidentified by the translator).
const OVERRIDES = {
  'glu-031': 'Prov 24:15', // Brakke: unidentified; matches LXX Prov 24:15 ("feeding of the belly")
  'for-055': 'Dan 4:25',
  'lis-029': null, // unidentified saying
  'lis-042': 'Dan 3:34-35',
  'vai-042': 'Jas 4:3',
  'pri-060': 'Jude 24-25',
};

const quotes = new Map();
for (const block of readFileSync(readingPath, 'utf8').split(/\n(?=\[)/)) {
  const m = /^\[([a-z]{3}-\d{3}[ab]?)\][^\n]*\n\s*> (.*) \([^()]*\)\s*$/s.exec(block.trim());
  if (m) quotes.set(m[1], m[2]);
}

const STOP = new Set(
  'the and of to a in that is it for be he his him you your yours thou thee thy thine ye i me my we us our they them their not with as but are was were shall will have has had which who whom this these those from by on at or all so do does did no nor an if then than there into upon unto when what also may let one up out been being am its said says say'.split(
    ' ',
  ),
);
const stem = (w) => w.replace(/(eth|est|ing|ed|es|s)$/, '');
const tokens = (s) =>
  new Set(
    (s || '')
      .toLowerCase()
      .replace(/[’']/g, '')
      .split(/[^a-z]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map(stem),
  );
function f1(a, b) {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const w of a) if (b.has(w)) hit++;
  const p = hit / b.size;
  const r = hit / a.size;
  return p + r ? (2 * p * r) / (p + r) : 0;
}

function webCandidates(p) {
  const code = p.book.web;
  const c = p.c1;
  const v = parseInt(p.v1, 10);
  if (p.abbr === 'Ps') return psalmChapterCandidates(c, p.v1).map((ch) => ({ code, ch, v }));
  if (p.abbr === 'Sus') return [{ code, ch: 13, v }];
  if (p.abbr === 'Dan') return [{ code: 'DAN', ch: c, v }, { code: 'DNG', ch: c, v }];
  if (p.abbr === '2 Esd') return [{ code: 'EZR', ch: c, v }, { code: 'NEH', ch: c - 10, v }];
  if (/Kgdms/.test(p.abbr)) return [c, c - 1, c + 1].map((ch) => ({ code, ch, v }));
  return [{ code, ch: c, v }];
}

function windows(code, startKey, n) {
  const b = WEB.get(code);
  if (!b) return [];
  const i = b.order.indexOf(startKey);
  if (i < 0) return [];
  const out = [];
  for (const len of [n - 1, n, n + 1]) {
    if (len < 1) continue;
    const keys = b.order.slice(i, i + len);
    if (keys.length === len) out.push(keys);
  }
  return out;
}

function best(code, keysList, targets, n) {
  let top = null;
  for (const keys of keysList) {
    const text = keys.map((k) => WEB.get(code).verses.get(k)).join(' ');
    const t = tokens(text);
    // Prefer the same number of verses Evagrius cited unless a longer or
    // shorter window is clearly better.
    const score = Math.max(...targets.map((q) => f1(q, t))) - (keys.length === n ? 0 : 0.05);
    if (!top || score > top.score + 1e-9) top = { code, keys, score };
  }
  return top;
}

const SCAN_ZONES = { Exod: [35, 40], Num: [16, 17], Job: [39, 42], Jer: [25, 52], Prov: [24, 31], '3 Kgdms': [2, 21] };
const scanZone = (p) => {
  const z = SCAN_ZONES[p.abbr];
  return z && p.c1 >= z[0] && p.c1 <= z[1];
};

const out = {};
const review = [];
for (const e of skeleton) {
  const raw = e.id in OVERRIDES ? OVERRIDES[e.id] : e.lxxRef;
  if (!raw) {
    out[e.id] = { lxx: null, ref: null, web: null, lxxKey: null, score: 0, note: 'unidentified' };
    continue;
  }
  const parts = raw
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !/^cf\./.test(s));
  const passages = [];
  for (const part of parts) {
    const p = parseRef(part);
    if (!p) {
      passages.push({ error: `unparsed: ${part}` });
      continue;
    }
    const lxxVerses = p.book.lxx ? range(LXX, p.book.lxx, p.c1, p.v1, p.c2, p.v2) : null;
    const lxxText = lxxVerses ? joinVerses(lxxVerses) : null;
    const n = lxxVerses?.length ?? (p.c1 === p.c2 ? parseInt(p.v2) - parseInt(p.v1) + 1 : 2);
    const targets = [tokens(quotes.get(e.id)), tokens(lxxText)].filter((t) => t.size);

    if (/[ab]$/.test(p.v1) && /[ab]$/.test(p.v2) && lxxVerses) {
      passages.push({ lxx: part, lxxKey: { code: p.book.lxx, c1: p.c1, v1: p.v1, c2: p.c2, v2: p.v2 }, web: null,
        ref: formatRef(p.book.web, p.c1, p.v1, p.c2, p.v2) + ' (Greek)', score: 1, method: 'lxx-only', _lxxText: lxxText, _webText: '-' });
      continue;
    }
    let top = null;
    for (const [ci, cand] of webCandidates(p).entries()) {
      for (let o = -3; o <= 3; o++) {
        const r = best(cand.code, windows(cand.code, `${cand.ch}:${cand.v + o}`, n), targets, n);
        if (!r) continue;
        // Psalm titles shift English verses down by one or two; elsewhere the
        // numbering usually agrees, so a shifted verse must earn its place.
        const penalty = (p.abbr === 'Ps' ? (o > 0 ? 0.1 : 0.02 * -o) : o ? 0.1 : 0) + (ci && /Kgdms/.test(p.abbr) ? 0.1 : 0);
        const adj = { ...r, adj: r.score - penalty };
        if (!top || adj.adj > top.adj) top = adj;
      }
    }
    let method = 'rule';
    if (scanZone(p) && (!top || top.score < 0.4)) {
      // Chapters whose Septuagint order differs from the Hebrew (Jeremiah 25-52,
      // the tabernacle chapters of Exodus, Proverbs 24-31…): scan the whole book.
      for (const code of new Set(webCandidates(p).map((c) => c.code))) {
        const b = WEB.get(code);
        if (!b) continue;
        const all = [];
        for (let i = 0; i < b.order.length; i++) all.push(...windows(code, b.order[i], n));
        const r = best(code, all, targets, n);
        if (r && r.score >= 0.4 && (!top || r.score >= top.score + 0.15)) {
          top = r;
          method = 'scan';
        }
      }
    }
    const [c1, v1] = top.keys[0].split(':');
    const [c2, v2] = top.keys.at(-1).split(':');
    passages.push({
      lxx: part,
      lxxKey: p.book.lxx ? { code: p.book.lxx, c1: p.c1, v1: p.v1, c2: p.c2, v2: p.v2 } : null,
      web: { code: top.code, c1: +c1, v1: +v1, c2: +c2, v2: +v2 },
      ref: formatRef(top.code, +c1, +v1, +c2, +v2),
      score: +top.score.toFixed(2),
      method,
      _lxxText: lxxText,
      _webText: top.keys.map((k) => WEB.get(top.code).verses.get(k)).join(' '),
    });
  }
  out[e.id] = passages.map(({ _lxxText, _webText, ...rest }) => rest);
  for (const p of passages)
    review.push({
      id: e.id,
      score: p.score ?? -1,
      text: `[${e.id}] ${p.lxx} -> ${p.ref}  score=${p.score} ${p.method}${p.error ? ' ' + p.error : ''}\n  QUOTE : ${quotes.get(e.id)}\n  WEB   : ${p._webText}\n  LXX   : ${p._lxxText ?? '-'}\n`,
    });
}

writeFileSync(new URL('../data/refs.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
review.sort((a, b) => a.score - b.score);
writeFileSync(reviewPath, review.map((r) => r.text).join('\n'));
const scores = review.map((r) => r.score);
const bands = [0.2, 0.3, 0.4, 0.5].map((t) => `<${t}: ${scores.filter((s) => s < t).length}`);
console.log(`${review.length} passages mapped; ${bands.join(', ')}; scans: ${Object.values(out).flat().filter((p) => p.method === 'scan').length}`);
