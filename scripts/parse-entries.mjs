// One-time extraction of the entry skeleton (book, number, kind, Septuagint
// reference) from the user's copy of Talking Back.
//
//   pdftotext -bbox -f 62 -l 184 <book.pdf> <work>/bbox.html
//   node scripts/parse-entries.mjs <work>/bbox.html <work>/reading.txt
//
// Writes data/skeleton.json (facts only: numbers and references). The
// reading file holds Brakke's wording for authoring and must stay outside
// the project: it is copyrighted.
import { readFileSync, writeFileSync } from 'node:fs';

const [bboxPath, readingPath] = process.argv.slice(2);
if (!bboxPath || !readingPath) {
  console.error('usage: parse-entries.mjs <bbox.html> <reading.txt>');
  process.exit(1);
}

// Font heights (yMax - yMin) observed in the Liturgical Press edition.
const cls = (h) =>
  h >= 15 ? 'book' : h >= 13 ? 'head' : h >= 12 ? 'entry' : h >= 11.45 ? 'quote' : h >= 11 ? 'ref' : h >= 9 ? 'note' : 'sup';

const html = readFileSync(bboxPath, 'utf8');
const lines = [];
for (const page of html.split('<page ').slice(1)) {
  const words = [...page.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)].map(
    (m) => ({ x: +m[1], y0: +m[2], y1: +m[4], t: decode(m[5]), c: cls(+m[4] - +m[2]) }),
  );
  const pageLines = [];
  for (const w of words) {
    if (w.y0 < 60) continue; // running header
    if (w.c === 'note' || w.c === 'sup') continue; // footnotes and their markers
    let line = pageLines.find((l) => Math.abs(l.y1 - w.y1) < 2.5);
    if (!line) pageLines.push((line = { y1: w.y1, words: [] }));
    line.words.push(w);
  }
  pageLines.sort((a, b) => a.y1 - b.y1);
  for (const l of pageLines) {
    l.words.sort((a, b) => a.x - b.x);
    l.x = l.words[0].x;
    l.text = l.words.map((w) => w.t).join(' ');
    l.c = l.words[0].c;
    lines.push(l);
  }
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

const BOOKS = ['gluttony', 'fornication', 'money', 'sadness', 'anger', 'listlessness', 'vainglory', 'pride'];
const ENTRY_START = /^[<\[]?(\d{1,2})(?:\[?([ab])\]?)?[.\]>]{0,3}\s+(.*)$/;

let book = 0;
let section = '';
let cur = null;
const entries = [];
const flush = () => {
  if (cur) entries.push(cur);
  cur = null;
};
for (const l of lines) {
  if (l.c === 'book') {
    if (/^(Against|Concerning)\b/.test(l.text)) {
      flush();
      book++;
    }
    continue;
  }
  if (book === 0) continue;
  if (l.c === 'head') {
    if (/^<?From\b/.test(l.text) || /^<From/.test(l.text)) {
      flush();
      section = l.text.replace(/^<|>$/g, '').replace(/^From\s+(the\s+)?/, '').replace(/\s*\d+$/, '');
    }
    continue;
  }
  const m = l.c === 'entry' && ENTRY_START.exec(l.text);
  if (m && l.x < 80) {
    flush();
    cur = { book, n: m[1] + (m[2] || ''), section, heading: m[3], quote: '', refText: '' };
    continue;
  }
  if (!cur) continue;
  if (l.c === 'entry') cur.heading += ' ' + l.text;
  else {
    for (const w of l.words) {
      if (w.c === 'ref') cur.refText += ' ' + w.t;
      else if (w.c === 'quote') cur.quote += ' ' + w.t;
      else if (w.c === 'entry') cur.heading += ' ' + w.t;
    }
  }
}
flush();

const kindOf = (h) =>
  /^To the Lord/i.test(h)
    ? 'prayer'
    : /^Against (?:\S+\s){0,2}?(soul|intellect|human)/i.test(h)
      ? 'self'
      : 'rebuke';

const clean = (s) => s.replace(/\s+/g, ' ').replace(/­\s?/g, '').trim();
const skeleton = entries.map((e) => {
  const refs = [...clean(e.refText).matchAll(/\(([^()]*\d[^()]*)\)/g)].map((m) => m[1]);
  return {
    id: `${BOOKS[e.book - 1].slice(0, 3)}-${e.n.replace(/^\d+/, (d) => d.padStart(3, '0'))}`,
    thought: BOOKS[e.book - 1],
    book: e.book,
    n: e.n,
    kind: kindOf(clean(e.heading)),
    lxxRef: refs.at(-1) ?? null,
    section: e.section,
  };
});

writeFileSync(new URL('../data/skeleton.json', import.meta.url), JSON.stringify(skeleton, null, 1) + '\n');
writeFileSync(
  readingPath,
  entries
    .map((e, i) => `[${skeleton[i].id}] (${skeleton[i].kind}) ${clean(e.heading)}\n    > ${clean(e.quote)} (${skeleton[i].lxxRef})\n`)
    .join('\n'),
);
const per = BOOKS.map((b, i) => `${b}: ${skeleton.filter((e) => e.book === i + 1).length}`);
console.log(`${skeleton.length} entries — ${per.join(', ')}`);
const missing = skeleton.filter((e) => !e.lxxRef);
if (missing.length) console.log('missing refs:', missing.map((e) => e.id).join(' '));
