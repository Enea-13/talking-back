// Shared Bible lookups for the data scripts.
//
// Texts come from eBible.org's verse-per-line downloads, cached in
// .cache/bibles/ (run scripts/fetch-bibles.mjs):
//   engwebu_vpl.txt      World English Bible, US spelling, "the LORD" (public domain)
//   eng-Brenton_vpl.txt  Brenton's Septuagint, 1851 (public domain), LXX numbering
import { readFileSync } from 'node:fs';

const CACHE = new URL('../.cache/bibles/', import.meta.url);

function load(file) {
  const books = new Map(); // code -> { order: [key], verses: Map(key -> text) }
  for (const line of readFileSync(new URL(file, CACHE), 'utf8').split('\n')) {
    const m = /^(\w{3}) (\d+):(\d+[a-z]?) (.*)$/.exec(line);
    if (!m) continue;
    const [, code, c, v, text] = m;
    if (!books.has(code)) books.set(code, { order: [], verses: new Map() });
    const b = books.get(code);
    const key = `${c}:${v}`;
    b.order.push(key);
    b.verses.set(key, text.trim());
  }
  return books;
}

export const WEB = load('engwebu_vpl.txt');
export const LXX = load('eng-Brenton_vpl.txt');

// Abbreviations used in Brakke's translation -> eBible codes and display names.
// lxx: the eBible code in Brenton (Septuagint numbering); web: the code in the WEB.
export const BOOKS = {
  Gen: { lxx: 'GEN', web: 'GEN', name: 'Genesis' },
  Exod: { lxx: 'EXO', web: 'EXO', name: 'Exodus' },
  Lev: { lxx: 'LEV', web: 'LEV', name: 'Leviticus' },
  Num: { lxx: 'NUM', web: 'NUM', name: 'Numbers' },
  Deut: { lxx: 'DEU', web: 'DEU', name: 'Deuteronomy' },
  Josh: { lxx: 'JOS', web: 'JOS', name: 'Joshua' },
  Judg: { lxx: 'JDG', web: 'JDG', name: 'Judges' },
  '1 Kgdms': { lxx: '1SA', web: '1SA', name: '1 Samuel' },
  '2 Kgdms': { lxx: '2SA', web: '2SA', name: '2 Samuel' },
  '3 Kgdms': { lxx: '1KI', web: '1KI', name: '1 Kings' },
  '4 Kgdms': { lxx: '2KI', web: '2KI', name: '2 Kings' },
  '2 Chr': { lxx: '2CH', web: '2CH', name: '2 Chronicles' },
  '1 Esd': { lxx: '1ES', web: '1ES', name: '1 Esdras' },
  '2 Esd': { lxx: 'EZR', web: 'EZR', name: 'Ezra' },
  Job: { lxx: 'JOB', web: 'JOB', name: 'Job' },
  Ps: { lxx: 'PSA', web: 'PSA', name: 'Psalm' },
  Prov: { lxx: 'PRO', web: 'PRO', name: 'Proverbs' },
  Qo: { lxx: 'ECC', web: 'ECC', name: 'Ecclesiastes' },
  Song: { lxx: 'SOL', web: 'SOL', name: 'Song of Songs' },
  Sir: { lxx: 'SIR', web: 'SIR', name: 'Sirach' },
  Isa: { lxx: 'ISA', web: 'ISA', name: 'Isaiah' },
  Jer: { lxx: 'JER', web: 'JER', name: 'Jeremiah' },
  Lam: { lxx: 'LAM', web: 'LAM', name: 'Lamentations' },
  Ezek: { lxx: 'EZE', web: 'EZE', name: 'Ezekiel' },
  Dan: { lxx: 'DNG', web: 'DAN', name: 'Daniel' },
  Sus: { lxx: 'SUS', web: 'DNG', name: 'Susanna', webChapter: 13 },
  Mic: { lxx: 'MIC', web: 'MIC', name: 'Micah' },
  Nah: { lxx: 'NAH', web: 'NAH', name: 'Nahum' },
  Hab: { lxx: 'HAB', web: 'HAB', name: 'Habakkuk' },
  Zech: { lxx: 'ZEC', web: 'ZEC', name: 'Zechariah' },
  Matt: { web: 'MAT', name: 'Matthew' },
  Mark: { web: 'MAR', name: 'Mark' },
  Luke: { web: 'LUK', name: 'Luke' },
  John: { web: 'JOH', name: 'John' },
  Acts: { web: 'ACT', name: 'Acts' },
  Rom: { web: 'ROM', name: 'Romans' },
  '1 Cor': { web: '1CO', name: '1 Corinthians' },
  '2 Cor': { web: '2CO', name: '2 Corinthians' },
  Gal: { web: 'GAL', name: 'Galatians' },
  Eph: { web: 'EPH', name: 'Ephesians' },
  Phil: { web: 'PHI', name: 'Philippians' },
  Col: { web: 'COL', name: 'Colossians' },
  '1 Thess': { web: '1TH', name: '1 Thessalonians' },
  '2 Thess': { web: '2TH', name: '2 Thessalonians' },
  '1 Tim': { web: '1TI', name: '1 Timothy' },
  '2 Tim': { web: '2TI', name: '2 Timothy' },
  Phlm: { web: 'PHM', name: 'Philemon' },
  Heb: { web: 'HEB', name: 'Hebrews' },
  Jas: { web: 'JAM', name: 'James' },
  '1 Pet': { web: '1PE', name: '1 Peter' },
  '2 Pet': { web: '2PE', name: '2 Peter' },
  '1 John': { web: '1JO', name: '1 John' },
  Jude: { web: 'JUD', name: 'Jude' },
};

export const NAME_BY_WEB = Object.fromEntries(
  Object.values(BOOKS).map((b) => [b.web, b.name]).concat([
    ['NEH', 'Nehemiah'],
    ['DNG', 'Daniel (Greek)'],
    ['SUS', 'Susanna'],
  ]),
);

/** Parse "Ps 54:23", "Judg 2:20–3:2", "Prov 12:11a", "Sus 55" into a passage. */
export function parseRef(s) {
  const m = /^((?:[1-4] )?[A-Z][a-z]+)\.? (\d+)(?::(\d+[ab]?))?(?:[-–](?:(\d+):)?(\d+[ab]?))?/.exec(s.trim());
  if (!m) return null;
  const [, abbr, a, b, c, d] = m;
  const book = BOOKS[abbr];
  if (!book) return null;
  // Single-chapter books cited without a chapter ("Sus 55", "Jude 24-25").
  if (b === undefined) return { abbr, book, c1: 1, v1: a, c2: 1, v2: d ?? a };
  return { abbr, book, c1: +a, v1: b, c2: c ? +c : +a, v2: d ?? b };
}

/** Verses from (c1:v1) to (c2:v2) inclusive, in book order. */
export function range(bible, code, c1, v1, c2, v2) {
  const b = bible.get(code);
  if (!b) return null;
  const i = b.order.indexOf(`${c1}:${v1}`);
  const j = b.order.indexOf(`${c2}:${v2}`);
  if (i < 0 || j < i) return null;
  return b.order.slice(i, j + 1).map((k) => ({ key: k, text: b.verses.get(k) }));
}

export const joinVerses = (vs) => vs.map((v) => v.text).join(' ').replace(/\s+/g, ' ').trim();

/** Display form: "Psalm 55:22", "Judges 2:20–3:2", "Proverbs 6:9–11". */
export function formatRef(code, c1, v1, c2, v2) {
  const name = code === 'PSA' && c1 !== c2 ? 'Psalms' : (NAME_BY_WEB[code] ?? code);
  const start = `${c1}:${v1}`;
  if (c1 === c2 && v1 === v2) return `${name} ${start}`;
  if (c1 === c2) return `${name} ${start}–${v2}`;
  return `${name} ${start}–${c2}:${v2}`;
}

// Septuagint psalm numbering -> Hebrew/English chapter (verse offsets are matched by text).
export function psalmChapterCandidates(lxxChapter, lxxVerse) {
  const c = lxxChapter;
  const v = parseInt(lxxVerse, 10);
  if (c <= 8 || c >= 148) return [c];
  if (c === 9) return v >= 22 ? [10] : [9];
  if (c <= 112) return [c + 1];
  if (c === 113) return v >= 9 ? [115] : [114];
  if (c === 114 || c === 115) return [116];
  if (c <= 145) return [c + 1];
  return [147]; // 146, 147
}
