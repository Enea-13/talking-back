// What each response reads aloud: the verses it shows first (mainVerses in src/lib/data.ts),
// joined with spaces. Shared by the recorder and the build check.
//
//   node scripts/audio/readings.mjs     prints [{ id, text }] as JSON, for generate.py
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);

export const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

/** The short hash generate.py stores for each text, so stale recordings can be spotted. */
export const textHash = (text) => createHash('sha1').update(text).digest('hex').slice(0, 12);

export function readings() {
  return readJson('data/entries.json')
    .entries.map((e) => ({
      id: e.id,
      text: e.passages
        .map((p) => (e.lead === 'greek' && p.greek ? p.greek.text : p.text))
        .filter(Boolean)
        .join(' '),
    }))
    .filter((r) => r.text);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(JSON.stringify(readings()));
